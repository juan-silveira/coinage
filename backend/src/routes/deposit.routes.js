const express = require('express');
const router = express.Router();
const DepositController = require('../controllers/deposit.controller');
const { authenticateApiKey } = require('../middleware/auth.middleware');

const depositController = new DepositController();

/**
 * @route   POST /api/deposits
 * @desc    Iniciar processo de depósito
 * @access  Private
 */
router.post('/', authenticateApiKey, depositController.initiateDeposit.bind(depositController));

/**
 * @route   POST /api/deposits/confirm
 * @desc    Confirmar depósito na blockchain (chamado pelo worker)
 * @access  Private (Admin/Worker)
 */
router.post('/confirm', authenticateApiKey, depositController.confirmDeposit.bind(depositController));

/**
 * @route   GET /api/deposits/status/:transactionId
 * @desc    Obter status de um depósito
 * @access  Private
 */
router.get('/status/:transactionId', authenticateApiKey, depositController.getDepositStatus.bind(depositController));

/**
 * @route   GET /api/deposits/user/:userId
 * @desc    Listar depósitos de um usuário
 * @access  Private
 */
router.get('/user/:userId', authenticateApiKey, depositController.getUserDeposits.bind(depositController));

module.exports = router;







