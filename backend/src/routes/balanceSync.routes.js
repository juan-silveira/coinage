const express = require('express');
const router = express.Router();
const balanceSyncController = require('../controllers/balanceSync.controller');
const { authenticateToken } = require('../middleware/jwt.middleware');

// Todas as rotas requerem autenticação
router.use(authenticateToken);

/**
 * @route GET /api/balance-sync/cache
 * @desc Busca cache Redis para um usuário
 * @access Private
 */
router.get('/cache', balanceSyncController.getCache);

/**
 * @route POST /api/balance-sync/cache
 * @desc Atualiza cache Redis com novos balances
 * @access Private
 */
router.post('/cache', balanceSyncController.updateCache);

/**
 * @route GET /api/balance-sync/history
 * @desc Busca histórico de mudanças de um usuário
 * @access Private
 */
router.get('/history', balanceSyncController.getHistory);

/**
 * @route DELETE /api/balance-sync/cache/clear
 * @desc Limpa cache Redis para um usuário
 * @access Private
 */
router.delete('/cache/clear', balanceSyncController.clearCache);

/**
 * @route GET /api/balance-sync/status
 * @desc Busca status da sincronização
 * @access Private
 */
router.get('/status', balanceSyncController.getStatus);

/**
 * @route GET /api/balance-sync/fresh
 * @desc Busca balances completos diretamente do Azorescan (inclui AZE-t nativo)
 * @access Private
 */
router.get('/fresh', balanceSyncController.getFreshBalances);

module.exports = router;
