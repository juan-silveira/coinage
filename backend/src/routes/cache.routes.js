const express = require('express');
const router = express.Router();

// Middleware de autenticação
const { authenticateToken } = require('../middleware/jwt.middleware');

// Controller
const cacheController = require('../controllers/cache.controller');

/**
 * @swagger
 * tags:
 *   name: Cache
 *   description: Sistema de cache automático de dados do usuário
 */

/**
 * @swagger
 * /api/cache/user:
 *   get:
 *     summary: Obtém dados completos do cache do usuário
 *     tags: [Cache]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dados do cache obtidos com sucesso
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
 *                     postgres:
 *                       type: object
 *                     blockchain:
 *                       type: object
 *                     lastUpdated:
 *                       type: string
 *       401:
 *         description: Não autenticado
 *       404:
 *         description: Dados não encontrados no cache
 */
router.get('/user', authenticateToken, cacheController.getUserCacheData);

/**
 * @swagger
 * /api/cache/postgres:
 *   get:
 *     summary: Obtém dados do PostgreSQL do cache
 *     tags: [Cache]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dados PostgreSQL obtidos com sucesso
 */
router.get('/postgres', authenticateToken, cacheController.getPostgresCacheData);

/**
 * @swagger
 * /api/cache/blockchain:
 *   get:
 *     summary: Obtém dados da blockchain do cache
 *     tags: [Cache]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dados blockchain obtidos com sucesso
 */
router.get('/blockchain', authenticateToken, cacheController.getBlockchainCacheData);

/**
 * @swagger
 * /api/cache/refresh:
 *   post:
 *     summary: Força atualização do cache do usuário
 *     tags: [Cache]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cache atualizado com sucesso
 */
router.post('/refresh', authenticateToken, cacheController.refreshUserCache);

/**
 * @swagger
 * /api/cache/clear:
 *   delete:
 *     summary: Limpa cache do usuário atual
 *     tags: [Cache]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cache limpo com sucesso
 */
router.delete('/clear', authenticateToken, cacheController.clearUserCache);

/**
 * @swagger
 * /api/cache/sessions:
 *   get:
 *     summary: Status das sessões de cache ativas (apenas admins)
 *     tags: [Cache]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Status das sessões
 *       403:
 *         description: Acesso negado
 */
router.get('/sessions', authenticateToken, cacheController.getCacheSessionsStatus);

// Endpoints de compatibilidade com frontend existente
/**
 * @swagger
 * /api/cache/user/email/{email}:
 *   get:
 *     summary: Obtém usuário por email do cache (compatibilidade)
 *     tags: [Cache]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Usuário encontrado
 */
router.get('/user/email/:email', authenticateToken, cacheController.getUserByEmailFromCache);

/**
 * @swagger
 * /api/cache/balances/{publicKey}:
 *   get:
 *     summary: Obtém saldos por chave pública do cache (compatibilidade)
 *     tags: [Cache]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: publicKey
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Saldos obtidos do cache
 */
router.get('/balances/:publicKey', authenticateToken, cacheController.getUserBalancesFromCache);

module.exports = router;