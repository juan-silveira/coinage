const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transaction.controller');
const { authenticateApiKey } = require('../middleware/auth.middleware');
const { transactionRateLimiter } = require('../middleware/rateLimit.middleware');
const { authenticateToken } = require('../middleware/jwt.middleware');

// TESTE TEMPORÁRIO: Endpoint sem autenticação (ANTES do middleware)
router.get('/test-no-auth', async (req, res) => {
  try {
    console.log('🔴 [TEST] Endpoint de teste chamado!');
    const mockData = {
      transactions: [
        {
          id: '1',
          company: { name: 'Coinage App' },
          tokenSymbol: 'STT',
          tokenName: 'Stake Token',
          txHash: '0x1234567890abcdef1234567890abcdef12345678901234567890abcdef123456',
          type: 'stake',
          subType: 'debit',
          amount: -1000,
          date: new Date().toISOString(),
          status: 'confirmed',
          network: 'testnet'
        },
        {
          id: '2', 
          company: { name: 'Navi' },
          tokenSymbol: 'STT',
          tokenName: 'Stake Token',
          txHash: '0x2345678901bcdef12345678901bcdef12345678901234567890bcdef123457',
          type: 'unstake',
          subType: 'credit', 
          amount: 500,
          date: new Date(Date.now() - 24*60*60*1000).toISOString(),
          status: 'confirmed',
          network: 'testnet'
        }
      ],
      pagination: {
        total: 2,
        page: 1,
        limit: 5,
        totalPages: 1
      }
    };
    
    res.status(200).json({
      success: true,
      message: 'Transações de teste obtidas com sucesso',
      data: mockData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro no teste',
      error: error.message
    });
  }
});

// TESTE TEMPORÁRIO: Endpoint direto para transactions com Prisma (ANTES do middleware)
router.get('/direct-prisma-test', async (req, res) => {
  try {
    console.log('🔴 [DIRECT-PRISMA-TEST] Testando query Prisma direta!');
    
    // Simular userId do usuário Ivan (o correto)
    const userId = '34290450-ce0d-46fc-a370-6ffa787ea6b9';
    
    // Usar Prisma diretamente
    const prismaConfig = require('../config/prisma');
    const prisma = await prismaConfig.initialize();
    
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      include: {
        company: {
          select: { id: true, name: true, alias: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    console.log('✅ [DIRECT-PRISMA-TEST] Transações encontradas:', transactions.length);

    // Manually convert BigInt to string
    const safeTransactions = transactions.map(tx => ({
      id: tx.id,
      userId: tx.userId,
      companyId: tx.companyId,
      company: tx.company,
      network: tx.network,
      transactionType: tx.transactionType,
      status: tx.status,
      txHash: tx.txHash,
      blockNumber: tx.blockNumber ? tx.blockNumber.toString() : null,
      fromAddress: tx.fromAddress,
      toAddress: tx.toAddress,
      gasPrice: tx.gasPrice ? tx.gasPrice.toString() : null,
      gasLimit: tx.gasLimit ? tx.gasLimit.toString() : null,
      gasUsed: tx.gasUsed ? tx.gasUsed.toString() : null,
      functionName: tx.functionName,
      functionParams: tx.functionParams,
      estimatedGas: tx.estimatedGas ? tx.estimatedGas.toString() : null,
      actualGasCost: tx.actualGasCost ? tx.actualGasCost.toString() : null,
      metadata: tx.metadata,
      createdAt: tx.createdAt,
      updatedAt: tx.updatedAt,
      submittedAt: tx.submittedAt,
      confirmedAt: tx.confirmedAt,
      failedAt: tx.failedAt
    }));

    res.status(200).json({
      success: true,
      message: 'Teste Prisma direto executado com sucesso',
      data: {
        userId,
        transactions: safeTransactions,
        count: transactions.length,
        rawFirst: transactions[0] ? JSON.stringify(transactions[0], (k, v) => typeof v === 'bigint' ? v.toString() : v) : null
      }
    });
  } catch (error) {
    console.error('❌ [DIRECT-PRISMA-TEST] Erro:', error);
    res.status(500).json({
      success: false,
      message: 'Erro no teste Prisma direto',
      error: error.message,
      stack: error.stack
    });
  }
});

// Middleware de autenticação para todas as rotas (EXCETO as de teste)
router.use(authenticateToken);

/**
 * @swagger
 * components:
 *   schemas:
 *     Transaction:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: ID único da transação
 *         companyId:
 *           type: string
 *           format: uuid
 *           description: ID da empresa que iniciou a transação
 *         userId:
 *           type: string
 *           format: uuid
 *           description: ID do usuário que iniciou a transação
 *         network:
 *           type: string
 *           enum: [mainnet, testnet]
 *           description: Rede blockchain onde a transação foi executada
 *         transactionType:
 *           type: string
 *           enum: [transfer, contract_deploy, contract_call, contract_read]
 *           description: Tipo da transação
 *         status:
 *           type: string
 *           enum: [pending, confirmed, failed, cancelled]
 *           description: Status da transação
 *         txHash:
 *           type: string
 *           pattern: '^0x[a-fA-F0-9]{64}$'
 *           description: Hash da transação na blockchain
 *         blockNumber:
 *           type: integer
 *           description: Número do bloco onde a transação foi confirmada
 *         fromAddress:
 *           type: string
 *           pattern: '^0x[a-fA-F0-9]{40}$'
 *           description: Endereço de origem da transação
 *         toAddress:
 *           type: string
 *           pattern: '^0x[a-fA-F0-9]{40}$'
 *           description: Endereço de destino da transação
 *         functionName:
 *           type: string
 *           description: Nome da função chamada no contrato
 *         functionParams:
 *           type: array
 *           description: Parâmetros da função chamada
 *         gasUsed:
 *           type: integer
 *           description: Gas utilizado na transação
 *         gasPrice:
 *           type: string
 *           description: Preço do gas em Wei
 *         actualGasCost:
 *           type: string
 *           description: Custo real do gas em Wei
 *         metadata:
 *           type: object
 *           description: Metadados adicionais da transação
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Data de criação da transação
 *         confirmedAt:
 *           type: string
 *           format: date-time
 *           description: Data de confirmação da transação
 *     TransactionStats:
 *       type: object
 *       properties:
 *         totalTransactions:
 *           type: integer
 *           description: Total de transações
 *         confirmedCount:
 *           type: integer
 *           description: Número de transações confirmadas
 *         pendingCount:
 *           type: integer
 *           description: Número de transações pendentes
 *         failedCount:
 *           type: integer
 *           description: Número de transações falhadas
 *         totalGasCost:
 *           type: string
 *           description: Custo total do gas em Wei
 *         avgGasUsed:
 *           type: number
 *           description: Média de gas utilizado
 */


/**
 * @swagger
 * /api/transactions:
 *   get:
 *     summary: Obtém transações de um empresa
 *     tags: [Transactions]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número da página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Limite de itens por página
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, failed, cancelled]
 *         description: Filtrar por status
 *       - in: query
 *         name: network
 *         schema:
 *           type: string
 *           enum: [mainnet, testnet]
 *         description: Filtrar por rede
 *       - in: query
 *         name: transactionType
 *         schema:
 *           type: string
 *           enum: [transfer, contract_deploy, contract_call, contract_read]
 *         description: Filtrar por tipo de transação
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de início para filtrar
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de fim para filtrar
 *     responses:
 *       200:
 *         description: Transações obtidas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     transactions:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Transaction'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *       400:
 *         description: Erro na requisição
 *       401:
 *         description: Não autorizado
 */
router.get('/', transactionController.getTransactionsByCompany);

/**
 * @swagger
 * /api/transactions/stats/overview:
 *   get:
 *     summary: Obtém estatísticas gerais de transações
 *     tags: [Transactions]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de início para filtrar
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de fim para filtrar
 *       - in: query
 *         name: network
 *         schema:
 *           type: string
 *           enum: [mainnet, testnet]
 *         description: Filtrar por rede
 *     responses:
 *       200:
 *         description: Estatísticas obtidas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/TransactionStats'
 *       400:
 *         description: Erro na requisição
 *       401:
 *         description: Não autorizado
 */
router.get('/stats/overview', transactionController.getTransactionStats);

/**
 * @swagger
 * /api/transactions/stats/status:
 *   get:
 *     summary: Obtém estatísticas por status de transação
 *     tags: [Transactions]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de início para filtrar
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de fim para filtrar
 *       - in: query
 *         name: network
 *         schema:
 *           type: string
 *           enum: [mainnet, testnet]
 *         description: Filtrar por rede
 *     responses:
 *       200:
 *         description: Estatísticas por status obtidas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       status:
 *                         type: string
 *                       count:
 *                         type: integer
 *       400:
 *         description: Erro na requisição
 *       401:
 *         description: Não autorizado
 */
router.get('/stats/status', transactionController.getStatusStats);

/**
 * @swagger
 * /api/transactions/stats/type:
 *   get:
 *     summary: Obtém estatísticas por tipo de transação
 *     tags: [Transactions]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de início para filtrar
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de fim para filtrar
 *       - in: query
 *         name: network
 *         schema:
 *           type: string
 *           enum: [mainnet, testnet]
 *         description: Filtrar por rede
 *     responses:
 *       200:
 *         description: Estatísticas por tipo obtidas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       transactionType:
 *                         type: string
 *                       count:
 *                         type: integer
 *       400:
 *         description: Erro na requisição
 *       401:
 *         description: Não autorizado
 */
router.get('/stats/type', transactionController.getTypeStats);

/**
 * @swagger
 * /api/transactions/test:
 *   get:
 *     summary: Testa o serviço de transações
 *     tags: [Transactions]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: Serviço testado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     service:
 *                       type: string
 *                     status:
 *                       type: string
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Erro no teste
 *       401:
 *         description: Não autorizado
 */
router.get('/test', transactionController.testService);

/**
 * @swagger
 * /api/transactions/{txHash}:
 *   get:
 *     summary: Obtém uma transação específica por hash
 *     tags: [Transactions]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: txHash
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^0x[a-fA-F0-9]{64}$'
 *         description: Hash da transação
 *     responses:
 *       200:
 *         description: Transação obtida com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Transaction'
 *       400:
 *         description: Erro na requisição
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Transação não encontrada
 */
router.get('/:txHash', transactionController.getTransactionByHash);

/**
 * @swagger
 * /api/transactions/stats/overview:
 *   get:
 *     summary: Obtém estatísticas gerais de transações
 *     tags: [Transactions]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de início para filtrar
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de fim para filtrar
 *       - in: query
 *         name: network
 *         schema:
 *           type: string
 *           enum: [mainnet, testnet]
 *         description: Filtrar por rede
 *     responses:
 *       200:
 *         description: Estatísticas obtidas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/TransactionStats'
 *       400:
 *         description: Erro na requisição
 *       401:
 *         description: Não autorizado
 */
router.get('/stats/overview', transactionController.getTransactionStats);

/**
 * @swagger
 * /api/transactions/stats/status:
 *   get:
 *     summary: Obtém estatísticas por status de transação
 *     tags: [Transactions]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de início para filtrar
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de fim para filtrar
 *       - in: query
 *         name: network
 *         schema:
 *           type: string
 *           enum: [mainnet, testnet]
 *         description: Filtrar por rede
 *     responses:
 *       200:
 *         description: Estatísticas por status obtidas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       status:
 *                         type: string
 *                       count:
 *                         type: integer
 *       400:
 *         description: Erro na requisição
 *       401:
 *         description: Não autorizado
 */
router.get('/stats/status', transactionController.getStatusStats);

/**
 * @swagger
 * /api/transactions/stats/type:
 *   get:
 *     summary: Obtém estatísticas por tipo de transação
 *     tags: [Transactions]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de início para filtrar
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de fim para filtrar
 *       - in: query
 *         name: network
 *         schema:
 *           type: string
 *           enum: [mainnet, testnet]
 *         description: Filtrar por rede
 *     responses:
 *       200:
 *         description: Estatísticas por tipo obtidas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       transactionType:
 *                         type: string
 *                       count:
 *                         type: integer
 *       400:
 *         description: Erro na requisição
 *       401:
 *         description: Não autorizado
 */
router.get('/stats/type', transactionController.getTypeStats);

/**
 * @swagger
 * /api/transactions/test:
 *   get:
 *     summary: Testa o serviço de transações
 *     tags: [Transactions]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: Serviço testado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     service:
 *                       type: string
 *                     status:
 *                       type: string
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Erro no teste
 *       401:
 *         description: Não autorizado
 */
router.get('/test', transactionController.testService);

/**
 * @swagger
 * /api/transactions/enqueue:
 *   post:
 *     summary: Enfileira uma transação da blockchain
 *     tags: [Transactions]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [mint, burn, transfer, send_transaction]
 *                 description: Tipo da transação
 *               data:
 *                 type: object
 *                 description: Dados específicos da transação
 *             required:
 *               - type
 *               - data
 *     responses:
 *       200:
 *         description: Transação enfileirada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     jobId:
 *                       type: string
 *                       format: uuid
 *                     status:
 *                       type: string
 *                     type:
 *                       type: string
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     estimatedProcessingTime:
 *                       type: string
 *                     rateLimit:
 *                       type: object
 *                       properties:
 *                         limit:
 *                           type: integer
 *                         remaining:
 *                           type: integer
 *                         resetTime:
 *                           type: string
 *                           format: date-time
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 *       429:
 *         description: Rate limit excedido
 *         headers:
 *           X-RateLimit-Limit:
 *             description: Limite de requisições
 *             schema:
 *               type: string
 *           X-RateLimit-Remaining:
 *             description: Requisições restantes
 *             schema:
 *               type: string
 *           X-RateLimit-Reset:
 *             description: Timestamp de reset
 *             schema:
 *               type: string
 *           Retry-After:
 *             description: Segundos para aguardar
 *             schema:
 *               type: string
 */
router.post('/enqueue', authenticateApiKey, transactionRateLimiter, transactionController.enqueueBlockchainTransaction);

/**
 * @swagger
 * /api/transactions/queue/{jobId}:
 *   get:
 *     summary: Obtém o status de uma transação enfileirada
 *     tags: [Transactions]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do job da transação
 *     responses:
 *       200:
 *         description: Status da transação obtido com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     jobId:
 *                       type: string
 *                     status:
 *                       type: string
 *                     timestamp:
 *                       type: string
 *       400:
 *         description: Erro ao obter status
 */
router.get('/queue/:jobId', transactionController.getQueuedTransactionStatus);

/**
 * @swagger
 * /api/transactions/queue/batch:
 *   post:
 *     summary: Obtém o status de múltiplas transações enfileiradas
 *     tags: [Transactions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               jobIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Lista de Job IDs das transações
 *             required:
 *               - jobIds
 *     responses:
 *       200:
 *         description: Status das transações obtido com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     results:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           jobId:
 *                             type: string
 *                           status:
 *                             type: string
 *                           timestamp:
 *                             type: string
 *                     stats:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         completed:
 *                           type: integer
 *                         processing:
 *                           type: integer
 *                         failed:
 *                           type: integer
 *                         queued:
 *                           type: integer
 *                     timestamp:
 *                       type: string
 *       400:
 *         description: Erro ao obter status
 */
router.post('/queue/batch', transactionController.getMultipleQueuedTransactionStatus);

module.exports = router; 