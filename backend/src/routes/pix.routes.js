const express = require('express');
const { authenticateToken } = require('../middleware/jwt.middleware');
const pixService = require('../services/pix.service');
const blockchainQueueService = require('../services/blockchainQueue.service');
const userActionsService = require('../services/userActions.service');

const router = express.Router();

/**
 * POST /api/pix/deposit/create
 * Cria cobrança PIX para depósito
 */
router.post('/deposit/create', authenticateToken, async (req, res) => {
  try {
    const { amount, description, blockchainAddress, expirationMinutes } = req.body;
    
    // Validações
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than 0'
      });
    }
    
    if (!blockchainAddress) {
      return res.status(400).json({
        success: false,
        message: 'Blockchain address is required'
      });
    }
    
    // Validar endereço blockchain
    if (!/^0x[a-fA-F0-9]{40}$/.test(blockchainAddress)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid blockchain address format'
      });
    }
    
    const depositId = `deposit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Criar cobrança PIX
    const pixCharge = await pixService.createPixCharge({
      amount: parseFloat(amount),
      description: description || `Depósito cBRL - ${amount}`,
      userInfo: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email
      },
      externalId: depositId,
      expirationMinutes: expirationMinutes || 30
    });
    
    if (!pixCharge.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create PIX charge',
        error: pixCharge.error
      });
    }
    
    // Log da ação
    await userActionsService.logFinancial(req.user.id, 'deposit_initiated', {}, {
      status: 'pending',
      details: {
        amount: parseFloat(amount),
        pixPaymentId: pixCharge.paymentId,
        blockchainAddress,
        expiresAt: pixCharge.expiresAt
      },
      relatedId: depositId,
      relatedType: 'deposit'
    });
    
    res.json({
      success: true,
      data: {
        depositId,
        paymentId: pixCharge.paymentId,
        amount: parseFloat(amount),
        currency: 'BRL',
        targetCurrency: 'cBRL',
        pixCode: pixCharge.pixCode,
        qrCodeImage: pixCharge.qrCodeImage,
        expiresAt: pixCharge.expiresAt,
        blockchainAddress,
        status: 'waiting_payment',
        description: pixCharge.description
      }
    });
    
  } catch (error) {
    console.error('Error creating PIX deposit:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating PIX deposit',
      error: error.message
    });
  }
});

/**
 * GET /api/pix/deposit/:paymentId/status
 * Verifica status do depósito PIX
 */
router.get('/deposit/:paymentId/status', authenticateToken, async (req, res) => {
  try {
    const { paymentId } = req.params;
    
    const pixStatus = await pixService.checkPaymentStatus(paymentId);
    
    if (!pixStatus.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to check payment status',
        error: pixStatus.error
      });
    }
    
    res.json({
      success: true,
      data: {
        paymentId,
        status: pixStatus.status,
        paidAt: pixStatus.paidAt,
        paidAmount: pixStatus.paidAmount,
        endToEndId: pixStatus.endToEndId,
        txId: pixStatus.txId
      }
    });
    
  } catch (error) {
    console.error('Error checking deposit status:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking deposit status',
      error: error.message
    });
  }
});

/**
 * POST /api/pix/deposit/:paymentId/process
 * Força processamento de depósito (admin)
 */
router.post('/deposit/:paymentId/process', authenticateToken, async (req, res) => {
  try {
    // Verificar se usuário é admin (simplificado)
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }
    
    const { paymentId } = req.params;
    const { blockchainAddress, amount } = req.body;
    
    const depositId = `manual_deposit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Enfileirar para processamento
    await blockchainQueueService.queueDeposit({
      depositId,
      userId: req.user.id,
      amount: parseFloat(amount),
      pixData: {
        paymentId,
        userEmail: req.user.email
      },
      blockchainAddress,
      network: process.env.BLOCKCHAIN_NETWORK || 'testnet'
    });
    
    res.json({
      success: true,
      message: 'Deposit queued for processing',
      data: {
        depositId,
        paymentId
      }
    });
    
  } catch (error) {
    console.error('Error processing deposit:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing deposit',
      error: error.message
    });
  }
});

/**
 * POST /api/pix/withdrawal/create
 * Cria saque PIX
 */
router.post('/withdrawal/create', authenticateToken, async (req, res) => {
  try {
    const { amount, pixKey, pixKeyType, blockchainAddress } = req.body;
    
    // Validações
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than 0'
      });
    }
    
    if (!pixKey) {
      return res.status(400).json({
        success: false,
        message: 'PIX key is required'
      });
    }
    
    if (!blockchainAddress) {
      return res.status(400).json({
        success: false,
        message: 'Blockchain address is required'
      });
    }
    
    // Detectar tipo da chave PIX se não fornecido
    const detectedPixKeyType = pixKeyType || pixService.detectPixKeyType(pixKey);
    
    // Validar chave PIX
    if (!pixService.validatePixKey(pixKey, detectedPixKeyType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid PIX key for type: ${detectedPixKeyType}`
      });
    }
    
    // Verificar saldo do usuário
    // TEMPORARIAMENTE DESABILITADO - cBRLService removido
    // const balanceResult = await cBRLService.getBalance(blockchainAddress);
    const balanceResult = { balance: '0', error: 'cBRL service temporarily disabled' };
    
    if (!balanceResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to check balance',
        error: balanceResult.error
      });
    }
    
    if (parseFloat(balanceResult.balance) < parseFloat(amount)) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient cBRL balance',
        available: balanceResult.balance,
        requested: amount
      });
    }
    
    // Calcular taxa
    const fee = pixService.calculatePixFee(amount, 'withdrawal');
    const totalAmount = parseFloat(amount) + fee;
    
    const withdrawalId = `withdrawal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Enfileirar para processamento
    await blockchainQueueService.queueWithdrawal({
      withdrawalId,
      userId: req.user.id,
      amount: parseFloat(amount),
      pixKey,
      pixKeyType: detectedPixKeyType,
      blockchainAddress,
      userEmail: req.user.email,
      network: process.env.BLOCKCHAIN_NETWORK || 'testnet',
      fee
    });
    
    // Log da ação
    await userActionsService.logFinancial(req.user.id, 'withdrawal_initiated', {}, {
      status: 'pending',
      details: {
        amount: parseFloat(amount),
        pixKey: pixService.maskPixKey(pixKey),
        pixKeyType: detectedPixKeyType,
        blockchainAddress,
        fee
      },
      relatedId: withdrawalId,
      relatedType: 'withdrawal'
    });
    
    res.json({
      success: true,
      data: {
        withdrawalId,
        amount: parseFloat(amount),
        fee,
        totalAmount,
        currency: 'cBRL',
        targetCurrency: 'BRL',
        pixKey: pixService.maskPixKey(pixKey),
        pixKeyType: detectedPixKeyType,
        status: 'processing',
        estimatedProcessingTime: '5-15 minutes'
      }
    });
    
  } catch (error) {
    console.error('Error creating withdrawal:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating withdrawal',
      error: error.message
    });
  }
});

/**
 * GET /api/pix/balance/:address
 * Obtém saldo cBRL de um endereço
 */
router.get('/balance/:address', authenticateToken, async (req, res) => {
  try {
    const { address } = req.params;
    
    // Validar endereço
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid blockchain address format'
      });
    }
    
    // TEMPORARIAMENTE DESABILITADO - cBRLService removido
    // const balanceResult = await cBRLService.getBalance(address);
    const balanceResult = { balance: '0', error: 'cBRL service temporarily disabled' };
    
    if (!balanceResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to get balance',
        error: balanceResult.error
      });
    }
    
    res.json({
      success: true,
      data: {
        address,
        balance: balanceResult.balance,
        currency: 'cBRL',
        decimals: balanceResult.decimals,
        network: balanceResult.network
      }
    });
    
  } catch (error) {
    console.error('Error getting balance:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting balance',
      error: error.message
    });
  }
});

/**
 * GET /api/pix/token/info
 * Obtém informações do token cBRL
 */
router.get('/token/info', async (req, res) => {
  try {
    // TEMPORARIAMENTE DESABILITADO - cBRLService removido
    // const tokenInfo = await cBRLService.getTokenInfo();
    const tokenInfo = { symbol: 'cBRL', name: 'Central Bank Real', decimals: 18 };
    
    if (!tokenInfo.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to get token info',
        error: tokenInfo.error
      });
    }
    
    res.json({
      success: true,
      data: tokenInfo
    });
    
  } catch (error) {
    console.error('Error getting token info:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting token info',
      error: error.message
    });
  }
});

/**
 * GET /api/pix/health
 * Health check dos serviços PIX e cBRL
 */
router.get('/health', async (req, res) => {
  try {
    const [pixHealth, cBRLHealth] = await Promise.all([
      pixService.healthCheck(),
      // cBRLService.healthCheck() // TEMPORARIAMENTE DESABILITADO
      Promise.resolve({ status: 'disabled' })
    ]);
    
    const overallHealthy = pixHealth.healthy && cBRLHealth.healthy;
    
    res.status(overallHealthy ? 200 : 503).json({
      success: overallHealthy,
      data: {
        overall: overallHealthy ? 'healthy' : 'unhealthy',
        services: {
          pix: pixHealth,
          cBRL: cBRLHealth
        },
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Error checking health:', error);
    res.status(503).json({
      success: false,
      message: 'Error checking health',
      error: error.message
    });
  }
});

/**
 * POST /api/pix/validate-key
 * Valida chave PIX
 */
router.post('/validate-key', async (req, res) => {
  try {
    const { pixKey } = req.body;
    
    if (!pixKey) {
      return res.status(400).json({
        success: false,
        message: 'PIX key is required'
      });
    }
    
    const detectedType = pixService.detectPixKeyType(pixKey);
    const isValid = pixService.validatePixKey(pixKey, detectedType);
    
    res.json({
      success: true,
      data: {
        pixKey: pixService.maskPixKey(pixKey),
        type: detectedType,
        valid: isValid
      }
    });
    
  } catch (error) {
    console.error('Error validating PIX key:', error);
    res.status(500).json({
      success: false,
      message: 'Error validating PIX key',
      error: error.message
    });
  }
});

module.exports = router;