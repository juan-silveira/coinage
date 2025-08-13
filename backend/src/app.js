const express = require('express');
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
// const debugUserRoutes = require('./routes/debug-user.routes'); // Temporariamente desabilitado

const contractRoutes = require('./routes/contract.routes');
const tokenRoutes = require('./routes/token.routes');
const stakeRoutes = require('./routes/stake.routes');
const clientRoutes = require('./routes/client.routes');
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

// Importar serviços
const contractService = require('./services/contract.service');
const clientService = require('./services/client.service');
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
  requireClientAdmin, 
  requireAnyAdmin,
  addUserInfo: addAdminUserInfo,
  logAdminRequest 
} = require('./middleware/admin.middleware');
const { 
  apiRateLimiter, 
  transactionRateLimiter, 
  loginRateLimiter,
  apiKeyRateLimiter,
  getRateLimitStats 
} = require('./middleware/rateLimit.middleware');
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

// Middlewares de segurança
app.use(helmet());

// Middleware de CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Session-Token']
}));

// Middleware de logging personalizado (antes do morgan)
// app.use(requestLogger);
// app.use(performanceLogger);

// Middleware de logging padrão
app.use(morgan('combined'));

// Middleware para parsing de JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rota de health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
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
      swagger: '/api-docs'
    }
  });
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
// app.use('/api/debug', debugUserRoutes); // Temporariamente desabilitado

// Rotas de clientes (com autenticação JWT e rate limiting)
app.use('/api/clients', authenticateJWT, apiRateLimiter, addUserInfo, logAuthenticatedRequest, clientRoutes);

// Rotas de autenticação (públicas)
app.use('/api/auth', authRoutes);

// Rotas de recuperação de senha (públicas)
app.use('/api/password-reset', passwordResetRoutes);

// Rotas de usuários (com autenticação JWT e refresh de cache)
app.use('/api/users', authenticateJWT, apiRateLimiter, addUserInfo, logAuthenticatedRequest, CacheRefreshMiddleware.refreshAfterWrite, userRoutes);

// Rotas de contratos (com autenticação e sistema de fila)
app.use('/api/contracts', authenticateApiKey, transactionRateLimiter, addUserInfo, logAuthenticatedRequest, QueueMiddleware.enqueueExternalOperations, CacheRefreshMiddleware.refreshAfterQueueOperation, contractRoutes);

// Rotas de tokens (com autenticação e sistema de fila)
app.use('/api/tokens', authenticateApiKey, transactionRateLimiter, addUserInfo, logAuthenticatedRequest, QueueMiddleware.enqueueExternalOperations, CacheRefreshMiddleware.refreshAfterQueueOperation, tokenRoutes);

// Rotas de stakes (com autenticação e sistema de fila)
app.use('/api/stakes', authenticateApiKey, transactionRateLimiter, addUserInfo, logAuthenticatedRequest, QueueMiddleware.enqueueExternalOperations, CacheRefreshMiddleware.refreshAfterQueueOperation, stakeRoutes);

// Rotas de transações (com autenticação JWT)
app.use('/api/transactions', authenticateJWT, transactionRateLimiter, addUserInfo, logAuthenticatedRequest, CacheRefreshMiddleware.refreshAfterTransaction, transactionRoutes);

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

// Middleware de tratamento de erros 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint não encontrado',
    path: req.originalUrl,
    method: req.method
  });
});

// Middleware de tratamento de erros global (com logging)
// app.use(errorLogger);

module.exports = app; 