const express = require('express');
const router = express.Router();
const TokenAmountController = require('../controllers/tokenAmount.controller');
const { authenticateToken } = require('../middleware/jwt.middleware');

const tokenAmountController = new TokenAmountController();

// Rotas públicas (para verificação de status)
router.get('/config', tokenAmountController.getServiceConfig.bind(tokenAmountController));
router.get('/stats', tokenAmountController.getBalanceStats.bind(tokenAmountController));

// Rotas protegidas (requerem autenticação JWT)
router.post('/force-check', authenticateToken, tokenAmountController.forceCheck.bind(tokenAmountController));
router.post('/set-threshold', authenticateToken, tokenAmountController.setChangeThreshold.bind(tokenAmountController));

module.exports = router;

