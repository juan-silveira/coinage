const express = require('express');
const router = express.Router();
const WithdrawController = require('../controllers/withdraw.controller');

const withdrawController = new WithdrawController();

/**
 * @route   POST /api/withdrawals
 * @desc    Iniciar processo de saque
 * @access  Private
 */
router.post('/', (req, res, next) => {
  console.log(`🔍 [DEBUG] Route /api/withdrawals CHAMADA - Body:`, req.body);
  next();
}, withdrawController.initiateWithdrawal.bind(withdrawController));

/**
 * @route   POST /api/withdrawals/confirm
 * @desc    Confirmar saque na blockchain (chamado pelo worker)  
 * @access  Private (Admin/Worker)
 */
router.post('/confirm', (req, res, next) => {
  console.log(`🔍 [DEBUG] Route /api/withdrawals/confirm CHAMADA - Body:`, req.body);
  next();
}, withdrawController.confirmWithdrawal.bind(withdrawController));

/**
 * @route   GET /api/withdrawals/status/:withdrawalId
 * @desc    Obter status de um saque
 * @access  Private
 */
router.get('/status/:withdrawalId', withdrawController.getWithdrawalStatus.bind(withdrawController));

/**
 * @route   GET /api/withdrawals/:withdrawalId/status
 * @desc    Obter status de um saque (rota alternativa)
 * @access  Private
 */
router.get('/:withdrawalId/status', withdrawController.getWithdrawalStatus.bind(withdrawController));

/**
 * @route   GET /api/withdrawals/user/:userId
 * @desc    Listar saques de um usuário
 * @access  Private
 */
router.get('/user/:userId', withdrawController.getUserWithdrawals.bind(withdrawController));

/**
 * @route   POST /api/withdrawals/calculate-fee
 * @desc    Calcular taxa de saque
 * @access  Private
 */
router.post('/calculate-fee', withdrawController.calculateWithdrawalFee.bind(withdrawController));

/**
 * @route   POST /api/withdrawals/validate-pix
 * @desc    Validar chave PIX
 * @access  Private
 */
router.post('/validate-pix', withdrawController.validatePixKey.bind(withdrawController));

module.exports = router;