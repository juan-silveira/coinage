const express = require('express');
const testController = require('../controllers/test.controller');

const router = express.Router();

/**
 * @swagger
 * /api/test/connection:
 *   get:
 *     summary: Testa a conexão com a blockchain
 *     description: Verifica se a API consegue se conectar com a blockchain Azore
 *     tags: [Test]
 *     parameters:
 *       - in: query
 *         name: network
 *         schema:
 *           type: string
 *           enum: [mainnet, testnet]
 *         description: "Rede para testar (padrão: testnet)"
 *     responses:
 *       200:
 *         description: Conexão estabelecida com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Conexão com a blockchain estabelecida com sucesso
 *                 data:
 *                   type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                     network:
 *                       type: string
 *                     chainId:
 *                       type: number
 *                     blockNumber:
 *                       type: string
 *                     gasPrice:
 *                       type: string
 *       500:
 *         description: Erro na conexão
 */
router.get('/connection', testController.testConnection);

/**
 * @swagger
 * /api/test/mailersend:
 *   get:
 *     summary: Testa configuração do MailerSend
 *     tags: [Test]
 *     responses:
 *       200:
 *         description: Configuração verificada
 */
router.get('/mailersend', async (req, res) => {
  try {
    console.log('🧪 Testando configuração do MailerSend...');
    
    const config = {
      EMAIL_PROVIDER: process.env.EMAIL_PROVIDER,
      MAILERSEND_FROM_EMAIL: process.env.MAILERSEND_FROM_EMAIL,
      MAILERSEND_FROM_NAME: process.env.MAILERSEND_FROM_NAME,
      hasApiToken: !!process.env.MAILERSEND_API_TOKEN,
      apiTokenPreview: process.env.MAILERSEND_API_TOKEN ? 
        `${process.env.MAILERSEND_API_TOKEN.substring(0, 15)}...` : null,
      DEFAULT_NETWORK: process.env.DEFAULT_NETWORK,
      NODE_ENV: process.env.NODE_ENV
    };

    console.log('📧 Configuração MailerSend:', config);

    // Importar e testar EmailService
    const EmailService = require('../services/email.service');
    const emailService = new EmailService();
    
    console.log('🔍 Provider ativo:', emailService.activeProvider);
    console.log('🔍 Provider instances:', Object.keys(emailService.providerInstances || {}));
    
    const providerEnabled = emailService.providerInstances?.mailersend?.isEnabled();
    console.log('🔍 MailerSend enabled:', providerEnabled);

    res.json({
      success: true,
      message: 'Configuração MailerSend verificada',
      config,
      provider: {
        active: emailService.activeProvider,
        enabled: providerEnabled,
        instances: Object.keys(emailService.providerInstances || {})
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erro ao testar MailerSend:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao verificar configuração MailerSend',
      error: error.message,
      stack: error.stack
    });
  }
});

/**
 * @swagger
 * /api/test/send-email:
 *   post:
 *     summary: Envia email de teste via MailerSend
 *     tags: [Test]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               to:
 *                 type: string
 *                 format: email
 *                 example: "test@example.com"
 *     responses:
 *       200:
 *         description: Email enviado com sucesso
 */
router.post('/send-email', async (req, res) => {
  try {
    const { to = 'test@example.com' } = req.body;
    
    console.log('📧 Enviando email de teste para:', to);
    
    const EmailService = require('../services/email.service');
    const emailService = new EmailService();
    
    const result = await emailService.sendEmail({
      to: {
        email: to,
        name: 'Test User'
      },
      subject: 'Teste MailerSend - Coinage System',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb;">🏦 Coinage - Teste de Email</h1>
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p>✅ <strong>MailerSend está funcionando!</strong></p>
            <p>Este email foi enviado via MailerSend API em ambiente de desenvolvimento/testnet.</p>
            <p><strong>Configuração:</strong></p>
            <ul>
              <li>Provider: ${emailService.activeProvider}</li>
              <li>Network: ${process.env.DEFAULT_NETWORK}</li>
              <li>Environment: ${process.env.NODE_ENV}</li>
            </ul>
          </div>
          <p style="color: #6b7280; font-size: 14px;">Data: ${new Date().toLocaleString('pt-BR')}</p>
        </div>
      `,
      textContent: `Coinage - Teste de Email\n\n✅ MailerSend está funcionando!\n\nEste email foi enviado via MailerSend API em ambiente de desenvolvimento/testnet.\n\nProvider: ${emailService.activeProvider}\nNetwork: ${process.env.DEFAULT_NETWORK}\nEnvironment: ${process.env.NODE_ENV}\n\nData: ${new Date().toLocaleString('pt-BR')}`
    });

    console.log('📧 Resultado do envio:', result);

    res.json({
      success: true,
      message: 'Email de teste enviado',
      result,
      provider: emailService.activeProvider,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erro ao enviar email de teste:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao enviar email de teste',
      error: error.message,
      stack: error.stack
    });
  }
});

/**
 * @swagger
 * /api/test/network-info:
 *   get:
 *     summary: Obtém informações da rede atual
 *     description: Retorna informações sobre a rede blockchain configurada
 *     tags: [Test]
 *     responses:
 *       200:
 *         description: Informações da rede obtidas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     chainId:
 *                       type: number
 *                     rpcUrl:
 *                       type: string
 *                     defaultNetwork:
 *                       type: string
 */
router.get('/network-info', testController.getNetworkInfo);

/**
 * @swagger
 * /api/test/balance/{address}:
 *   get:
 *     summary: Consulta o saldo de um endereço
 *     description: Obtém o saldo em ETH de um endereço específico
 *     tags: [Test]
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: Endereço Ethereum para consultar
 *       - in: query
 *         name: network
 *         schema:
 *           type: string
 *           enum: [mainnet, testnet]
 *         description: "Rede para consultar (padrão: testnet)"
 *     responses:
 *       200:
 *         description: Saldo consultado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     balance:
 *                       type: string
 *                       description: Saldo em Wei
 *                     balanceEth:
 *                       type: string
 *                       description: Saldo em ETH
 *                     address:
 *                       type: string
 *                     network:
 *                       type: string
 *       400:
 *         description: Endereço inválido
 *       500:
 *         description: Erro na consulta
 */
router.get('/balance/:address', testController.getBalance);

/**
 * @swagger
 * /api/test/block/{blockNumber}:
 *   get:
 *     summary: Obtém informações de um bloco
 *     description: Retorna informações detalhadas de um bloco específico
 *     tags: [Test]
 *     parameters:
 *       - in: path
 *         name: blockNumber
 *         required: true
 *         schema:
 *           type: string
 *         description: Número do bloco ou 'latest' para o mais recente
 *       - in: query
 *         name: network
 *         schema:
 *           type: string
 *           enum: [mainnet, testnet]
 *         description: "Rede para consultar (padrão: testnet)"
 *     responses:
 *       200:
 *         description: Informações do bloco obtidas com sucesso
 *       400:
 *         description: Bloco não encontrado
 */
router.get('/block/:blockNumber?', testController.getBlock);

/**
 * @swagger
 * /api/test/transaction/{txHash}:
 *   get:
 *     summary: Obtém informações de uma transação
 *     description: Retorna informações detalhadas de uma transação específica
 *     tags: [Test]
 *     parameters:
 *       - in: path
 *         name: txHash
 *         required: true
 *         schema:
 *           type: string
 *         description: Hash da transação
 *       - in: query
 *         name: network
 *         schema:
 *           type: string
 *           enum: [mainnet, testnet]
 *         description: "Rede para consultar (padrão: testnet)"
 *     responses:
 *       200:
 *         description: Informações da transação obtidas com sucesso
 *       400:
 *         description: Transação não encontrada
 */
router.get('/transaction/:txHash', testController.getTransaction);

/**
 * @swagger
 * /api/test/gas-price:
 *   get:
 *     summary: Obtém o preço atual do gás
 *     description: Retorna o preço atual do gás na rede
 *     tags: [Test]
 *     parameters:
 *       - in: query
 *         name: network
 *         schema:
 *           type: string
 *           enum: [mainnet, testnet]
 *         description: "Rede para consultar (padrão: testnet)"
 *     responses:
 *       200:
 *         description: Preço do gás obtido com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     gasPriceWei:
 *                       type: string
 *                     gasPriceGwei:
 *                       type: string
 *                     network:
 *                       type: string
 */
router.get('/gas-price', testController.getGasPrice);

/**
 * @swagger
 * /api/test/network:
 *   get:
 *     summary: Obtém informações da rede
 *     description: Retorna informações sobre a rede blockchain
 *     tags: [Test]
 *     parameters:
 *       - in: query
 *         name: network
 *         schema:
 *           type: string
 *           enum: [mainnet, testnet]
 *         description: "Rede para consultar (padrão: testnet)"
 *     responses:
 *       200:
 *         description: Informações da rede obtidas com sucesso
 */
router.get('/network', testController.getNetwork);

/**
 * @swagger
 * /api/test/blockchain/connection:
 *   get:
 *     summary: Testa a conexão com a blockchain
 *     description: Verifica se a API consegue se conectar com a blockchain Azore
 *     tags: [Test]
 *     parameters:
 *       - in: query
 *         name: network
 *         schema:
 *           type: string
 *           enum: [mainnet, testnet]
 *         description: "Rede para testar (padrão: testnet)"
 *     responses:
 *       200:
 *         description: Conexão estabelecida com sucesso
 *       500:
 *         description: Erro na conexão
 */
router.get('/blockchain/connection', testController.testConnection);

/**
 * @swagger
 * /api/test/blockchain/network-info:
 *   get:
 *     summary: Obtém informações da rede atual
 *     description: Retorna informações sobre a rede blockchain configurada
 *     tags: [Test]
 *     responses:
 *       200:
 *         description: Informações da rede obtidas com sucesso
 */
router.get('/blockchain/network-info', testController.getNetworkInfo);

/**
 * @swagger
 * /api/test/blockchain/latest-block:
 *   get:
 *     summary: Obtém o bloco mais recente
 *     description: Retorna informações do bloco mais recente da blockchain
 *     tags: [Test]
 *     responses:
 *       200:
 *         description: Informações do bloco obtidas com sucesso
 */
router.get('/blockchain/latest-block', testController.getLatestBlock);

/**
 * @swagger
 * /api/test/blockchain/blocks/{blockNumber}:
 *   get:
 *     summary: Obtém informações de um bloco específico
 *     description: Retorna informações detalhadas de um bloco específico
 *     tags: [Test]
 *     parameters:
 *       - in: path
 *         name: blockNumber
 *         required: true
 *         schema:
 *           type: string
 *         description: Número do bloco
 *     responses:
 *       200:
 *         description: Informações do bloco obtidas com sucesso
 *       400:
 *         description: Bloco não encontrado
 */
router.get('/blockchain/blocks/:blockNumber', testController.getBlock);

/**
 * @swagger
 * /api/test/blockchain/transactions/{transactionHash}:
 *   get:
 *     summary: Obtém informações de uma transação
 *     description: Retorna informações detalhadas de uma transação específica
 *     tags: [Test]
 *     parameters:
 *       - in: path
 *         name: transactionHash
 *         required: true
 *         schema:
 *           type: string
 *         description: Hash da transação
 *     responses:
 *       200:
 *         description: Informações da transação obtidas com sucesso
 *       400:
 *         description: Transação não encontrada
 */
router.get('/blockchain/transactions/:transactionHash', testController.getTransaction);

/**
 * @swagger
 * /api/test/blockchain/wallets/{walletAddress}/balance:
 *   get:
 *     summary: Consulta o saldo de uma carteira
 *     description: Obtém o saldo em ETH de um endereço específico
 *     tags: [Test]
 *     parameters:
 *       - in: path
 *         name: walletAddress
 *         required: true
 *         schema:
 *           type: string
 *         description: Endereço da carteira para consultar
 *     responses:
 *       200:
 *         description: Saldo consultado com sucesso
 *       400:
 *         description: Endereço inválido
 *       500:
 *         description: Erro na consulta
 */
router.get('/blockchain/wallets/:walletAddress/balance', testController.getWalletBalance);

/**
 * @swagger
 * /api/test/blocks/{blockNumber}:
 *   get:
 *     summary: Obtém informações de um bloco específico
 *     description: Retorna informações detalhadas de um bloco específico
 *     tags: [Test]
 *     parameters:
 *       - in: path
 *         name: blockNumber
 *         required: true
 *         schema:
 *           type: string
 *         description: Número do bloco
 *     responses:
 *       200:
 *         description: Informações do bloco obtidas com sucesso
 *       400:
 *         description: Bloco não encontrado
 */
router.get('/blocks/:blockNumber', testController.getBlock);

/**
 * @swagger
 * /api/test/transactions/{transactionHash}:
 *   get:
 *     summary: Obtém informações de uma transação
 *     description: Retorna informações detalhadas de uma transação específica
 *     tags: [Test]
 *     parameters:
 *       - in: path
 *         name: transactionHash
 *         required: true
 *         schema:
 *           type: string
 *         description: Hash da transação
 *     responses:
 *       200:
 *         description: Informações da transação obtidas com sucesso
 *       400:
 *         description: Transação não encontrada
 */
router.get('/transactions/:transactionHash', testController.getTransaction);

/**
 * @swagger
 * /api/test/wallets/{walletAddress}/balance:
 *   get:
 *     summary: Consulta o saldo de uma carteira
 *     description: Obtém o saldo em ETH de um endereço específico
 *     tags: [Test]
 *     parameters:
 *       - in: path
 *         name: walletAddress
 *         required: true
 *         schema:
 *           type: string
 *         description: Endereço da carteira para consultar
 *     responses:
 *       200:
 *         description: Saldo consultado com sucesso
 *       400:
 *         description: Endereço inválido
 *       500:
 *         description: Erro na consulta
 */
router.get('/wallets/:walletAddress/balance', testController.getWalletBalance);

/**
 * @swagger
 * /api/test/transactions/{transactionHash}/details:
 *   get:
 *     summary: Obtém informações detalhadas de uma transação via AzoreScan
 *     description: Retorna informações detalhadas de uma transação usando a API do AzoreScan
 *     tags: [Test]
 *     parameters:
 *       - in: path
 *         name: transactionHash
 *         required: true
 *         schema:
 *           type: string
 *         description: Hash da transação
 *       - in: query
 *         name: network
 *         schema:
 *           type: string
 *           enum: [mainnet, testnet]
 *         description: "Rede para consultar (padrão: testnet)"
 *     responses:
 *       200:
 *         description: Informações detalhadas da transação obtidas com sucesso
 *       400:
 *         description: Transação não encontrada
 */
router.get('/transactions/:transactionHash/details', testController.getTransactionDetails);

/**
 * @swagger
 * /api/test/blocks/{blockNumber}/details:
 *   get:
 *     summary: Obtém informações detalhadas de um bloco via AzoreScan
 *     description: Retorna informações detalhadas de um bloco usando a API do AzoreScan
 *     tags: [Test]
 *     parameters:
 *       - in: path
 *         name: blockNumber
 *         required: true
 *         schema:
 *           type: string
 *         description: Número do bloco
 *       - in: query
 *         name: network
 *         schema:
 *           type: string
 *           enum: [mainnet, testnet]
 *         description: "Rede para consultar (padrão: testnet)"
 *     responses:
 *       200:
 *         description: Informações detalhadas do bloco obtidas com sucesso
 *       400:
 *         description: Bloco não encontrado
 */
router.get('/blocks/:blockNumber/details', testController.getBlockDetails);

/**
 * @swagger
 * /api/test/wallets/balances:
 *   post:
 *     summary: Consulta saldos de múltiplas carteiras
 *     description: Obtém o saldo de até 20 endereços de uma vez
 *     tags: [Test]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               addresses:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Lista de endereços (máximo 20)
 *                 example: ["0x123...", "0x456..."]
 *     parameters:
 *       - in: query
 *         name: network
 *         schema:
 *           type: string
 *           enum: [mainnet, testnet]
 *         description: "Rede para consultar (padrão: testnet)"
 *     responses:
 *       200:
 *         description: Saldos consultados com sucesso
 *       400:
 *         description: Lista de endereços inválida
 */
router.post('/wallets/balances', testController.getMultipleBalances);

/**
 * @swagger
 * /api/test/webhook:
 *   post:
 *     summary: Teste de webhook
 *     description: Testa configuração de webhook (simulado)
 *     tags: [Test]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - url
 *             properties:
 *               url:
 *                 type: string
 *                 format: uri
 *                 description: URL para onde enviar o webhook
 *     responses:
 *       200:
 *         description: Teste de webhook configurado
 *       400:
 *         description: URL inválida
 */
router.post('/webhook', testController.testWebhook);

module.exports = router; 