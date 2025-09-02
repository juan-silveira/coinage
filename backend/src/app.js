const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
require('dotenv').config();

// Importar configuração do Swagger
const swaggerSpecs = require('./config/swagger');

// Importar rotas
const testRoutes = require('./routes/test.routes');
const testPrismaRoutes = require('./routes/test-prisma.routes');
const debugLoginRoutes = require('./routes/debug-login.routes');
const testEmailRoutes = require('./routes/test-email.routes');
const testSimpleRoutes = require('./routes/test-simple.routes');
// const debugUserRoutes = require('./routes/debug-user.routes'); // Temporariamente desabilitado

const contractRoutes = require('./routes/contract.routes');
const tokenRoutes = require('./routes/token.routes');
const stakeRoutes = require('./routes/stake.routes');
const stakeContractRoutes = require('./routes/stakeContracts.routes');
const contractsInteractRoutes = require('./routes/contracts.routes');
const companyRoutes = require('./routes/company.routes');
const logRoutes = require('./routes/log.routes');
const userRoutes = require('./routes/user.routes');
const adminRoutes = require('./routes/admin.routes');
const authRoutes = require('./routes/auth.routes');
const passwordResetRoutes = require('./routes/passwordReset.routes');
const transactionRoutes = require('./routes/transaction.routes');
const queueRoutes = require('./routes/queue.routes');
const documentRoutes = require('./routes/document.routes');
const webhookRoutes = require('./routes/webhook.routes');

// Novas rotas
const whitelabelRoutes = require('./routes/whitelabel.routes');
const twoFactorRoutes = require('./routes/twoFactor.routes');
const cacheRoutes = require('./routes/cache.routes');
const notificationRoutes = require('./routes/notification.routes');
const tokenAmountRoutes = require('./routes/tokenAmount.routes');
const earningsRoutes = require('./routes/earnings.routes');
const userPlanRoutes = require('./routes/userPlan.routes');
const configRoutes = require('./routes/config.routes');
const smartContractRoutes = require('./routes/smartContract.routes');
const userDocumentRoutes = require('./routes/userDocument.routes');
const userActionsRoutes = require('./routes/userActions.routes');
const contractTypeRoutes = require('./routes/contractType.routes');
const workersRoutes = require('./routes/workers.routes');
// TEMPORARIAMENTE DESABILITADO - cBRL service removido
// const pixRoutes = require('./routes/pix.routes');
const profileRoutes = require('./routes/profile.routes');
const backupRoutes = require('./routes/backup.routes');

// Importar serviços
const contractService = require('./services/contract.service');
const companyService = require('./services/company.service');
const logService = require('./services/log.service');
const tokenAmountService = require('./services/tokenAmount.service');

// Importar middlewares
const { 
  authenticateApiKey, 
  checkPermission, 
  checkNetworkAccess, 
  checkUsageLimits,
  addUserInfo,
  logAuthenticatedRequest 
} = require('./middleware/auth.middleware');
const { authenticateJWT } = require('./middleware/jwt.middleware');
const { 
  requireApiAdmin, 
  requireCompanyAdmin, 
  requireAnyAdmin,
  addUserInfo: addAdminUserInfo,
  logAdminRequest 
} = require('./middleware/admin.middleware');
const { 
  apiRateLimiter, 
  transactionRateLimiter, 
  apiKeyRateLimiter,
  loginRateLimiter,
  getRateLimitStats 
} = require('./middleware/rateLimit.middleware');
const {
  performanceMonitoring,
  errorTracking,
  loginTracking,
  databaseErrorTracking,
  criticalAlertMiddleware
} = require('./middleware/alerting.middleware');
// const { 
//   requestLogger, 
//   transactionLogger, 
//   errorLogger, 
//   performanceLogger 
// } = require('./middleware/logging.middleware');
const QueueMiddleware = require('./middleware/queue.middleware');
const CacheRefreshMiddleware = require('./middleware/cacheRefresh.middleware');

// Removidas todas as referências a databaseConfig e modelos do app.js

// Criar aplicação Express
const app = express();

// ====== ENDPOINTS PÚBLICOS (SEM AUTENTICAÇÃO) ======

// Endpoint público para buscar transação por UUID parcial (FORA do /api para evitar middleware)
app.get('/search-deposit/:partialId', async (req, res) => {
  try {
    const { partialId } = req.params;
    
    console.log(`🔍 [SEARCH] Buscando transação com UUID parcial: ${partialId}`);
    
    // Buscar transações que começam com o ID parcial
    const transactions = await prisma.transaction.findMany({
      where: {
        id: {
          startsWith: partialId
        },
        transactionType: 'deposit'
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 1 // Pegar apenas a mais recente
    });
    
    if (transactions.length > 0) {
      const transaction = transactions[0];
      console.log(`✅ [SEARCH] Transação encontrada: ${transaction.id}`);
      
      res.json({
        success: true,
        data: {
          id: transaction.id,
          status: transaction.status,
          amount: String(transaction.amount),
          currency: transaction.currency,
          transactionType: transaction.transactionType,
          createdAt: transaction.createdAt,
          confirmedAt: transaction.confirmedAt,
          txHash: transaction.txHash,
          blockNumber: transaction.blockNumber,
          gasUsed: transaction.gasUsed,
          metadata: transaction.metadata
        }
      });
    } else {
      console.log(`❌ [SEARCH] Nenhuma transação encontrada iniciando com: ${partialId}`);
      res.status(404).json({
        success: false,
        message: `Nenhuma transação de depósito encontrada iniciando com: ${partialId}`
      });
    }
    
  } catch (error) {
    console.error('❌ [SEARCH] Erro na busca:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// ====== INÍCIO DOS MIDDLEWARES ======

// Middlewares de segurança
app.use(helmet());

// Middleware de CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Session-Token']
}));

// Middleware de Rate Limiting Global
app.use('/api/', apiRateLimiter);

// Middleware de Alertas e Monitoramento
app.use(performanceMonitoring);
app.use(loginTracking);

// Middleware de logging personalizado (antes do morgan)
// app.use(requestLogger);
// app.use(performanceLogger);

// Middleware de logging padrão
app.use(morgan('combined'));

// Global BigInt serialization fix
BigInt.prototype.toJSON = function() { return this.toString() }

// Middleware para parsing de JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir arquivos estáticos de uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rota de health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// TESTE DIRETO: Endpoint para mostrar transações sem middleware
app.get('/test-transactions-direto', async (req, res) => {
  try {
    console.log('🔥 [TEST-DIRETO] Iniciando teste direto das transações');
    
    // Importar Prisma diretamente
    const prismaConfig = require('./config/prisma');
    const prisma = await prismaConfig.initialize();
    
    // UserID do Ivan
    const userId = '34290450-ce0d-46fc-a370-6ffa787ea6b9';
    
    console.log('🔥 [TEST-DIRETO] Buscando transações para userId:', userId);
    
    // Query direta
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      include: {
        company: {
          select: { id: true, name: true, alias: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    console.log('🔥 [TEST-DIRETO] Encontradas', transactions.length, 'transações');
    
    if (transactions.length > 0) {
      console.log('🔥 [TEST-DIRETO] Primeira transação (tipos):', {
        blockNumber: typeof transactions[0].blockNumber,
        gasPrice: typeof transactions[0].gasPrice,
        gasUsed: typeof transactions[0].gasUsed
      });
    }
    
    // Converter BigInt manualmente campo por campo
    const safeTransactions = transactions.map(tx => ({
      id: tx.id,
      userId: tx.userId,
      companyId: tx.companyId,
      company: tx.company,
      network: tx.network,
      transactionType: tx.transactionType,
      status: tx.status,
      txHash: tx.txHash,
      blockNumber: tx.blockNumber ? String(tx.blockNumber) : null,
      fromAddress: tx.fromAddress,
      toAddress: tx.toAddress,
      gasPrice: tx.gasPrice ? String(tx.gasPrice) : null,
      gasUsed: tx.gasUsed ? String(tx.gasUsed) : null,
      gasLimit: tx.gasLimit ? String(tx.gasLimit) : null,
      actualGasCost: tx.actualGasCost ? String(tx.actualGasCost) : null,
      estimatedGas: tx.estimatedGas ? String(tx.estimatedGas) : null,
      functionName: tx.functionName,
      functionParams: tx.functionParams,
      metadata: tx.metadata,
      createdAt: tx.createdAt,
      updatedAt: tx.updatedAt
    }));
    
    console.log('🔥 [TEST-DIRETO] Transações convertidas com sucesso');
    
    // Resposta manual sem usar res.json()
    res.setHeader('Content-Type', 'application/json');
    const response = {
      success: true,
      message: 'Transações encontradas com sucesso!',
      data: {
        count: transactions.length,
        userId,
        transactions: safeTransactions
      }
    };
    
    const responseString = JSON.stringify(response);
    console.log('🔥 [TEST-DIRETO] JSON serializado com sucesso, enviando resposta');
    
    res.status(200).send(responseString);
    
  } catch (error) {
    console.error('🔥 [TEST-DIRETO] ERRO:', error);
    res.status(500).json({
      success: false,
      message: 'Erro no teste direto',
      error: error.message,
      stack: error.stack
    });
  }
});

// Rota raiz
app.get('/', (req, res) => {
  res.json({
    message: 'Azore Blockchain API Service',
    version: '1.0.0',
    description: 'Microserviço para abstrair a complexidade da blockchain Azore',
    endpoints: {
      health: '/health',
      test: '/api/test',
      docs: '/api-docs',
      swagger: '/api-docs',
      testTransactionsDireto: '/test-transactions-direto'
    }
  });
});

// Rota de teste do MailerSend
app.get('/api/test-mailersend', async (req, res) => {
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
    const EmailService = require('./services/email.service');
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

// Rota de teste de envio real do MailerSend
app.post('/api/send-test-email', async (req, res) => {
  try {
    const { to = 'test@example.com' } = req.body;
    
    console.log('📧 Enviando email de teste para:', to);
    
    const EmailService = require('./services/email.service');
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

// Configuração do Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Azore Blockchain API Documentation',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    docExpansion: 'list',
    filter: true,
    showRequestHeaders: true
  }
}));

// Removida inicialização assíncrona dos serviços do app.js

// Inicializar serviço de monitoramento de saldos de tokens
const tokenAmountServiceInstance = new tokenAmountService();
tokenAmountServiceInstance.initialize().catch(error => {
  console.error('❌ Erro ao inicializar serviço de monitoramento de saldos:', error);
});

// Rotas públicas (sem autenticação) - comunicação direta com blockchain
app.use('/api/test', testRoutes);
app.use('/api/debug', testPrismaRoutes);
app.use('/api/debug', debugLoginRoutes);

// Rotas de teste de email
app.use('/api/test/email', testEmailRoutes);
app.use('/api/test-simple', testSimpleRoutes);
// app.use('/api/debug', debugUserRoutes); // Temporariamente desabilitado

// Removed deprecated mint dev route - using unified transaction architecture

// ========================================
// DEPOSIT APIs - Estrutura organizada
// ========================================

// 1. POST /api/deposit - Criar depósito
app.post('/api/deposit', async (req, res) => {
  try {
    console.log('💰 [DEPOSIT] Criando novo depósito');
    const { userId, amount, currency = 'cBRL', paymentMethod = 'pix' } = req.body;
    
    if (!userId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'userId e amount são obrigatórios'
      });
    }
    
    const prismaConfig = require('./config/prisma');
    const { v4: uuidv4 } = require('uuid');
    const prisma = prismaConfig.getPrisma();
    
    // Buscar taxa do usuário na tabela user_taxes
    const userTax = await prisma.userTaxes.findUnique({
      where: { userId: userId },
      select: { depositFee: true }
    });
    
    const netAmount = parseFloat(amount); // Valor que o usuário vai receber (ex: 100.00)
    const feeAmount = userTax?.depositFee || 3.0; // Taxa padrão se não encontrar
    const totalAmount = netAmount + feeAmount; // Valor total do PIX (ex: 103.00)
    
    console.log(`💰 [DEPOSIT] Valores calculados: Net=${netAmount}, Fee=${feeAmount}, Total=${totalAmount}`);
    
    // Criar transação de depósito
    const depositTransaction = await prisma.transaction.create({
      data: {
        id: uuidv4(),
        userId: userId,
        companyId: '9ab5ecaa-ad9e-4372-a5de-8b3c56cd8757', // Navi company ID
        transactionType: 'deposit',
        status: 'pending',
        amount: netAmount, // Valor líquido que será mintado
        currency: currency,
        metadata: {
          payment_method: paymentMethod,
          net_amount: netAmount,
          fee_amount: feeAmount,
          total_amount: totalAmount,
          created_at: new Date().toISOString()
        }
      }
    });
    
    // Gerar dados PIX com valor total (incluindo taxa)
    const pixPaymentId = `pix_${depositTransaction.id}_${Date.now()}`;
    console.log(`🔍 [DEBUG] TransactionID: ${depositTransaction.id}`);
    console.log(`🔍 [DEBUG] PixPaymentID: ${pixPaymentId}`);
    const pixData = {
      pixPaymentId,
      transactionId: depositTransaction.id,
      amount: totalAmount, // PIX mostra valor total (net + fee)
      netAmount: netAmount, // Valor líquido para referência
      feeAmount: feeAmount, // Taxa para referência
      status: 'pending',
      qrCode: `00020126580014br.gov.bcb.pix2536pix-qr.mercadopago.com/instore/o/v2/${pixPaymentId}5204000053039865802BR5925Coinage Tecnologia6009Sao Paulo62070503***6304OZ0H`,
      pixKey: 'contato@coinage.com.br',
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min
      createdAt: new Date().toISOString()
    };
    
    console.log(`✅ [DEPOSIT] Depósito criado: ${depositTransaction.id} (Net: ${netAmount}, Total PIX: ${totalAmount})`);
    
    res.json({
      success: true,
      message: 'Depósito criado com sucesso',
      data: {
        transactionId: depositTransaction.id,
        amount: netAmount, // Valor que será mintado
        totalAmount: totalAmount, // Valor total do PIX
        feeAmount: feeAmount, // Taxa cobrada
        status: 'pending',
        pixPaymentId: pixPaymentId,
        pixData: pixData
      }
    });
    
  } catch (error) {
    console.error('❌ [DEPOSIT] Erro:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar depósito',
      error: error.message
    });
  }
});

// 2. POST /api/deposit/pix - Confirmar PIX
app.post('/api/deposit/pix', async (req, res) => {
  try {
    console.log('🔵 [PIX] Confirmando pagamento PIX');
    const { transactionId, pixPaymentId, paidAmount } = req.body;
    
    if (!transactionId) {
      return res.status(400).json({
        success: false,
        message: 'transactionId é obrigatório'
      });
    }
    
    const prismaConfig = require('./config/prisma');
    const prisma = prismaConfig.getPrisma();
    
    // Confirmar PIX (mas manter status pending até blockchain confirmar)
    const depositTransaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: 'pending', // MANTER PENDING até blockchain confirmar
        pix_status: 'confirmed', // Confirmar apenas PIX
        pix_confirmed_at: new Date(),
        metadata: {
          ...((await prisma.transaction.findUnique({ where: { id: transactionId } }))?.metadata || {}),
          pix_confirmed: true,
          pix_confirmation_date: new Date().toISOString(),
          pix_payment_id: pixPaymentId || `pix-${Date.now()}`,
          pix_payer_document: '000.000.000-00',
          pix_payer_name: 'Usuario Teste',
          pix_paid_amount: paidAmount || 0
        }
      }
    });
    
    console.log(`✅ [PIX] PIX confirmado: ${transactionId}`);
    
    // AUTO-DISPARAR MINT APÓS CONFIRMAÇÃO PIX
    console.log('🚀 [AUTO-MINT] Disparando mint automaticamente após confirmação PIX...');
    
    try {
      // Buscar dados da transação confirmada
      const confirmedTransaction = await prisma.transaction.findUnique({
        where: { id: transactionId },
        include: { user: { select: { publicKey: true, email: true } } }
      });
      
      if (!confirmedTransaction || !confirmedTransaction.user?.publicKey) {
        console.error('❌ [AUTO-MINT] Usuário não encontrado ou sem endereço de carteira');
        // Não falha a confirmação PIX por isso
      } else {
        // Executar mint automaticamente
        const MintTransactionService = require('./services/mintTransaction.service');
        const mintService = new MintTransactionService();
        
        console.log(`🏭 [AUTO-MINT] Criando mint REAL para ${confirmedTransaction.amount} cBRL`);
        const mintTransaction = await mintService.createMintTransaction(
          transactionId,
          confirmedTransaction.userId,
          confirmedTransaction.amount.toString(),
          confirmedTransaction.user.publicKey
        );
        
        console.log(`✅ [AUTO-MINT] Mint REAL criado automaticamente: ${mintTransaction.id}`);
      }
    } catch (mintError) {
      console.error('❌ [AUTO-MINT] Erro ao executar mint automático:', mintError);
      // Não falha a confirmação PIX por causa do erro no mint
    }
    
    res.json({
      success: true,
      message: 'PIX confirmado com sucesso',
      data: {
        transactionId: transactionId,
        status: 'confirmed',
        pixConfirmed: true,
        readyForMint: true,
        autoMintTriggered: true
      }
    });
    
  } catch (error) {
    console.error('❌ [PIX] Erro:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao confirmar PIX',
      error: error.message
    });
  }
});

// 3. POST /api/deposit/mint - Executar mint na blockchain
app.post('/api/deposit/mint', async (req, res) => {
  try {
    console.log('⛓️ [MINT] Executando mint na blockchain');
    const { transactionId } = req.body;
    
    if (!transactionId) {
      return res.status(400).json({
        success: false,
        message: 'transactionId é obrigatório'
      });
    }
    
    const prismaConfig = require('./config/prisma');
    const MintTransactionService = require('./services/mintTransaction.service');
    const prisma = prismaConfig.getPrisma();
    const mintService = new MintTransactionService();
    
    // Buscar depósito confirmado
    const depositTransaction = await prisma.transaction.findUnique({
      where: { id: transactionId }
    });
    
    if (!depositTransaction) {
      return res.status(404).json({
        success: false,
        message: 'Depósito não encontrado'
      });
    }
    
    if (depositTransaction.status !== 'confirmed') {
      return res.status(400).json({
        success: false,
        message: 'Depósito deve estar confirmado antes do mint'
      });
    }
    
    // Buscar endereço real do usuário
    const user = await prisma.user.findUnique({
      where: { id: depositTransaction.userId },
      select: { publicKey: true, email: true }
    });
    
    if (!user || !user.publicKey) {
      throw new Error('Usuário não encontrado ou sem endereço de carteira');
    }
    
    console.log(`🔑 [MINT] Endereço do usuário: ${user.publicKey} (${user.email})`);
    
    // Criar transação de mint REAL
    console.log(`🏭 [MINT] Criando mint REAL para ${depositTransaction.amount} cBRL`);
    const mintTransaction = await mintService.createMintTransaction(
      transactionId,
      depositTransaction.userId,
      depositTransaction.amount.toString(),
      user.publicKey
    );
    
    console.log(`✅ [MINT] Mint REAL criado: ${mintTransaction.id}`);
    
    res.json({
      success: true,
      message: 'Mint executado na blockchain',
      data: {
        mintTransactionId: mintTransaction.id,
        depositTransactionId: transactionId,
        amount: depositTransaction.amount,
        recipientAddress: user.publicKey,
        status: 'pending',
        network: 'testnet'
      }
    });
    
  } catch (error) {
    console.error('❌ [MINT] Erro:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao executar mint',
      error: error.message
    });
  }
});

// Rotas de empresas (com autenticação JWT e rate limiting)
app.use('/api/companies', authenticateJWT, apiRateLimiter, addUserInfo, logAuthenticatedRequest, companyRoutes);

// Rotas de contratos de stake (com autenticação JWT)
app.use('/api/stake-contracts', authenticateJWT, apiRateLimiter, addUserInfo, logAuthenticatedRequest, stakeContractRoutes);

// Rotas de interação com contratos (com autenticação JWT)
app.use('/api/contracts', authenticateJWT, apiRateLimiter, addUserInfo, logAuthenticatedRequest, contractsInteractRoutes);

// Rotas de autenticação (públicas)
app.use('/api/auth', loginRateLimiter, authRoutes);

// Rotas de recuperação de senha (públicas)
app.use('/api/password-reset', loginRateLimiter, passwordResetRoutes);

// Rotas de confirmação de email (públicas)
const emailConfirmationRoutes = require('./routes/emailConfirmation.routes');
app.use('/api/email-confirmation', loginRateLimiter, emailConfirmationRoutes);

// Rotas de usuários (com autenticação JWT e refresh de cache)
app.use('/api/users', authenticateJWT, apiRateLimiter, addUserInfo, logAuthenticatedRequest, CacheRefreshMiddleware.refreshAfterWrite, userRoutes);

// Rotas de contratos (com autenticação e sistema de fila)
app.use('/api/contracts', authenticateApiKey, transactionRateLimiter, addUserInfo, logAuthenticatedRequest, QueueMiddleware.enqueueExternalOperations, CacheRefreshMiddleware.refreshAfterQueueOperation, contractRoutes);

// Endpoint de teste para verificar JWT
app.get('/api/admin/test-jwt', authenticateJWT, (req, res) => {
  console.log('🧪 Teste JWT - Usuário:', req.user.id, req.user.name);
  res.json({ success: true, message: 'JWT funcionando', user: req.user.name });
});

// Rotas administrativas de tokens (com autenticação JWT para frontend) - DEVE VIR ANTES DA ROTA GENÉRICA
app.use('/api/admin/tokens', authenticateJWT, apiRateLimiter, addUserInfo, logAuthenticatedRequest, tokenRoutes);

// Middleware híbrido para aceitar JWT ou API Key
const authenticateHybrid = (req, res, next) => {
  // Verificar se há JWT token no header
  const authHeader = req.headers.authorization;
  console.log('🔍 [HYBRID] AuthHeader:', authHeader ? 'presente' : 'ausente');
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    console.log('🔍 [HYBRID] Token parts:', token.split('.').length);
    // Se parece com JWT (3 partes separadas por pontos), usar JWT middleware
    if (token.split('.').length === 3) {
      console.log('🔄 Usando autenticação JWT para tokens');
      return authenticateJWT(req, res, next);
    }
  }
  
  // Caso contrário, usar API Key middleware
  console.log('🔄 Usando autenticação API Key para tokens');
  return authenticateApiKey(req, res, next);
};

// Rotas de tokens (com autenticação híbrida e sistema de fila)
app.use('/api/tokens', authenticateHybrid, transactionRateLimiter, addUserInfo, logAuthenticatedRequest, QueueMiddleware.enqueueExternalOperations, CacheRefreshMiddleware.refreshAfterQueueOperation, tokenRoutes);

// Rotas de stakes (com autenticação e sistema de fila)
app.use('/api/stakes', authenticateApiKey, transactionRateLimiter, addUserInfo, logAuthenticatedRequest, QueueMiddleware.enqueueExternalOperations, CacheRefreshMiddleware.refreshAfterQueueOperation, stakeRoutes);

// TESTE TEMPORÁRIO: Endpoint de debug direto no app
app.get('/api/transactions-debug', async (req, res) => {
  try {
    console.log('🔴 [APP-DEBUG] Endpoint de debug chamado diretamente no app!');
    
    // Simular userId do usuário Ivan
    const userId = 'c5cb9ad1-c89c-4b86-a483-5dfec6e3bd51';
    
    // Importar serviço diretamente
    const transactionService = require('./services/transaction.service');
    
    const result = await transactionService.getTransactionsByUser(userId, {
      page: 1,
      limit: 20
    });

    res.status(200).json({
      success: true,
      message: 'Debug app-level executado com sucesso',
      data: {
        userId,
        transactions: result.rows,
        count: result.count,
        pagination: {
          total: result.count,
          page: 1,
          limit: 20,
          totalPages: Math.ceil(result.count / 20)
        }
      }
    });
  } catch (error) {
    console.error('❌ [APP-DEBUG] Erro:', error);
    res.status(500).json({
      success: false,
      message: 'Erro no debug app-level',
      error: error.message,
      stack: error.stack
    });
  }
});

// Rotas de transações (com autenticação JWT)
app.use('/api/transactions', transactionRoutes);

// Rotas de depósitos (com autenticação JWT e email confirmado)
const depositRoutes = require('./routes/deposit.routes');
const mintRoutes = require('./routes/mint.routes');
const pixRoutes = require('./routes/pix.routes');
const { requireEmailConfirmation } = require('./middleware/emailConfirmed.middleware');
// IMPORTANTE: Rotas de desenvolvimento SEM autenticação devem vir ANTES
app.use('/api/pix/dev', pixRoutes);
app.use('/api/deposits/dev', depositRoutes);
app.use('/api/mint/dev', mintRoutes);

// Rotas com autenticação JWT
app.use('/api/deposits', authenticateJWT, depositRoutes);
app.use('/api/mint', authenticateJWT, mintRoutes);
app.use('/api/pix', authenticateJWT, pixRoutes);

// Rotas de saques (com autenticação JWT - email confirmado temporariamente desabilitado)
const withdrawRoutes = require('./routes/withdraw.routes');
app.use('/api/withdrawals', authenticateJWT, withdrawRoutes);

// Rotas de logs (com autenticação JWT)
app.use('/api/logs', authenticateJWT, apiRateLimiter, addUserInfo, logAuthenticatedRequest, logRoutes);

// Rotas de documentos (com autenticação JWT)
app.use('/api/documents', authenticateJWT, apiRateLimiter, addUserInfo, logAuthenticatedRequest, documentRoutes);

// Rotas de webhooks (com autenticação JWT)
// app.use('/api/webhooks', authenticateJWT, apiRateLimiter, addUserInfo, logAuthenticatedRequest, webhookRoutes); // Temporariamente desabilitado

// Rotas de fila (com autenticação admin)
app.use('/api/queue', queueRoutes);

// Rotas admin (com autenticação admin)
app.use('/api/admin', authenticateApiKey, requireApiAdmin, apiRateLimiter, addAdminUserInfo, logAdminRequest, adminRoutes);

// Rota para estatísticas de rate limiting (admin)
app.get('/api/admin/rate-limit-stats', authenticateApiKey, requireApiAdmin, (req, res) => {
  try {
    const stats = getRateLimitStats();
    res.json({
      success: true,
      message: 'Estatísticas de rate limiting obtidas com sucesso',
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao obter estatísticas de rate limiting',
      error: error.message
    });
  }
});

// Rotas para sistema de alertas (admin)
const alertingService = require('./services/alerting.service');

app.get('/api/admin/alert-stats', authenticateApiKey, requireApiAdmin, (req, res) => {
  try {
    const stats = alertingService.getAlertStats();
    res.json({
      success: true,
      message: 'Estatísticas de alertas obtidas com sucesso',
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao obter estatísticas de alertas',
      error: error.message
    });
  }
});

app.post('/api/admin/alert-thresholds', authenticateApiKey, requireApiAdmin, (req, res) => {
  try {
    const newThresholds = req.body;
    alertingService.updateThresholds(newThresholds);
    res.json({
      success: true,
      message: 'Thresholds de alertas atualizados com sucesso',
      data: alertingService.getAlertStats().thresholds
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar thresholds de alertas',
      error: error.message
    });
  }
});

app.post('/api/admin/reset-alert-counters', authenticateApiKey, requireApiAdmin, (req, res) => {
  try {
    alertingService.forceResetCounters();
    res.json({
      success: true,
      message: 'Contadores de alertas resetados com sucesso'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao resetar contadores de alertas',
      error: error.message
    });
  }
});

// Rotas whitelabel (públicas e autenticadas)
app.use('/api/whitelabel', whitelabelRoutes);

// Rotas 2FA (com autenticação JWT)
app.use('/api/2fa', authenticateJWT, apiRateLimiter, addUserInfo, logAuthenticatedRequest, twoFactorRoutes);

// Rotas de cache (com autenticação JWT)
app.use('/api/cache', authenticateJWT, apiRateLimiter, addUserInfo, logAuthenticatedRequest, cacheRoutes);

// Rotas de notificações (com autenticação JWT)
app.use('/api/notifications', notificationRoutes);

// Rotas de sincronização de balances (com autenticação JWT)
const balanceSyncRoutes = require('./routes/balanceSync.routes');
app.use('/api/balance-sync', balanceSyncRoutes);

// Rotas de monitoramento de saldos de tokens
app.use('/api/token-amounts', tokenAmountRoutes);
app.use('/api/earnings', earningsRoutes);

// Rotas de planos de usuário (públicas para consulta, autenticadas para admin)
app.use('/api/user-plans', userPlanRoutes);

// Configurações públicas (sem autenticação e sem rate limiting)
app.use('/api/config', configRoutes);

// Smart Contract Routes (Public)
app.use('/api/smart-contracts', smartContractRoutes);

// User Documents Routes (com autenticação JWT)
app.use('/api/user-documents', authenticateJWT, apiRateLimiter, addUserInfo, logAuthenticatedRequest, userDocumentRoutes);

// User Actions Routes
app.use('/api/user-actions', authenticateJWT, apiRateLimiter, addUserInfo, logAuthenticatedRequest, userActionsRoutes);

// Contract Types Routes
app.use('/api/contract-types', authenticateJWT, apiRateLimiter, addUserInfo, logAuthenticatedRequest, contractTypeRoutes);

// Workers Routes (Admin only)
app.use('/api/workers', workersRoutes);

// PIX Routes (cBRL deposits/withdrawals) - TEMPORARIAMENTE DESABILITADO
// app.use('/api/pix', pixRoutes);

// Rotas do Profile
app.use('/api/profile', profileRoutes);

// Backup routes (public - no authentication required)
app.use('/api/backup', backupRoutes);

// PIX Keys routes (com autenticação JWT)
const pixKeysRoutes = require('./routes/pixKeys.routes');
app.use('/api/pix-keys', pixKeysRoutes);

// Banks routes (públicas)
const banksRoutes = require('./routes/banks.routes');
app.use('/api/banks', banksRoutes);

// Middleware de tratamento de erros 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint não encontrado',
    path: req.originalUrl,
    method: req.method
  });
});

// Middleware de tratamento de erros global (com logging e alertas)
app.use(databaseErrorTracking);
app.use(errorTracking);
// app.use(errorLogger);

module.exports = app; 