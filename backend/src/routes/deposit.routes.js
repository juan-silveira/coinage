const express = require('express');
const router = express.Router();
const DepositController = require('../controllers/deposit.controller');
const { authenticateApiKey } = require('../middleware/auth.middleware');
const jwtMiddleware = require('../middleware/jwt.middleware');

const depositController = new DepositController();

/**
 * @route   POST /api/deposits
 * @desc    Iniciar processo de depósito
 * @access  Private
 */
router.post('/', depositController.initiateDeposit.bind(depositController));

/**
 * @route   POST /api/deposits/confirm-pix
 * @desc    Confirmar PIX do depósito
 * @access  Private (Admin/Worker)
 */
router.post('/confirm-pix', jwtMiddleware.authenticateToken, depositController.confirmPixDeposit.bind(depositController));

/**
 * @route   POST /api/deposits/confirm-blockchain
 * @desc    Confirmar depósito na blockchain (chamado pelo worker)
 * @access  Private (Admin/Worker)
 */
router.post('/confirm-blockchain', jwtMiddleware.authenticateToken, depositController.confirmBlockchainDeposit.bind(depositController));

/**
 * @route   GET /api/deposits/status/:transactionId
 * @desc    Obter status de um depósito
 * @access  Private
 */
router.get('/status/:transactionId', depositController.getDepositStatus.bind(depositController));

/**
 * @route   GET /api/deposits/user/:userId
 * @desc    Listar depósitos de um usuário
 * @access  Private
 */
router.get('/user/:userId', depositController.getUserDeposits.bind(depositController));

/**
 * @route   GET /api/deposits/dev/status/:transactionId
 * @desc    DEV: Obter status de um depósito (sem JWT)
 * @access  Public (desenvolvimento)
 */
router.get('/dev/status/:transactionId', depositController.getDepositStatus.bind(depositController));

/**
 * @route   POST /api/deposits/debug/confirm-pix/:transactionId
 * @desc    DEBUG: Confirmar pagamento PIX manualmente (apenas desenvolvimento)
 * @access  Private
 */
router.post('/debug/confirm-pix/:transactionId', jwtMiddleware.authenticateToken, depositController.debugConfirmPix.bind(depositController));

/**
 * @route   POST /api/deposits/debug/complete-deposit/:transactionId
 * @desc    DEBUG: Completar depósito (PIX + mint) manualmente para testes
 * @access  Private
 */
router.post('/debug/complete-deposit/:transactionId', jwtMiddleware.authenticateToken, depositController.debugCompleteDeposit.bind(depositController));

/**
 * @route   POST /api/deposits/dev/debug/confirm-pix/:transactionId
 * @desc    DEV DEBUG: Confirmar pagamento PIX manualmente (sem JWT)
 * @access  Public (desenvolvimento)
 */
router.post('/dev/debug/confirm-pix/:transactionId', depositController.debugConfirmPix.bind(depositController));

/**
 * @route   POST /api/deposits/dev/debug/complete-deposit/:transactionId
 * @desc    DEV DEBUG: Completar depósito (PIX + mint) manualmente (sem JWT)
 * @access  Public (desenvolvimento)
 */
router.post('/dev/debug/complete-deposit/:transactionId', depositController.debugCompleteDeposit.bind(depositController));

/**
 * @route   POST /api/deposits/webhook/pix
 * @desc    Webhook para receber confirmações de PIX do provedor
 * @access  Public (validado por assinatura)
 */
router.post('/webhook/pix', depositController.handlePixWebhook.bind(depositController));

/**
 * @route   POST /api/deposits/calculate-fees
 * @desc    Calcular taxas de depósito para um usuário
 * @access  Private
 */
router.post('/calculate-fees', depositController.calculateDepositFees.bind(depositController));

/**
 * @route   GET /api/deposits/taxes/:userId
 * @desc    Obter configuração de taxas de um usuário
 * @access  Private
 */
router.get('/taxes/:userId', jwtMiddleware.authenticateToken, depositController.getUserTaxes.bind(depositController));

module.exports = router;









