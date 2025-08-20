const express = require('express');
const router = express.Router();
const WithdrawController = require('../controllers/withdraw.controller');
const { authenticateApiKey } = require('../middleware/auth.middleware');

const withdrawController = new WithdrawController();

/**
 * @route   POST /api/withdrawals
 * @desc    Iniciar processo de saque
 * @access  Private
 */
router.post('/', authenticateApiKey, withdrawController.initiateWithdrawal.bind(withdrawController));

/**
 * @route   POST /api/withdrawals/confirm
 * @desc    Confirmar saque na blockchain (chamado pelo worker)
 * @access  Private (Admin/Worker)
 */
router.post('/confirm', authenticateApiKey, withdrawController.confirmWithdrawal.bind(withdrawController));

/**
 * @route   GET /api/withdrawals/status/:withdrawalId
 * @desc    Obter status de um saque
 * @access  Private
 */
router.get('/status/:withdrawalId', authenticateApiKey, withdrawController.getWithdrawalStatus.bind(withdrawController));

/**
 * @route   GET /api/withdrawals/user/:userId
 * @desc    Listar saques de um usuário
 * @access  Private
 */
router.get('/user/:userId', authenticateApiKey, withdrawController.getUserWithdrawals.bind(withdrawController));

/**
 * @route   POST /api/withdrawals/calculate-fee
 * @desc    Calcular taxa de saque
 * @access  Private
 */
router.post('/calculate-fee', authenticateApiKey, withdrawController.calculateWithdrawalFee.bind(withdrawController));

/**
 * @route   POST /api/withdrawals/validate-pix
 * @desc    Validar chave PIX
 * @access  Private
 */
router.post('/validate-pix', authenticateApiKey, withdrawController.validatePixKey.bind(withdrawController));

module.exports = router;