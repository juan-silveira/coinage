const express = require('express');
const router = express.Router();
const MintController = require('../controllers/mint.controller');

const mintController = new MintController();

/**
 * @route   POST /api/mint/create
 * @desc    Criar transação de mint vinculada a um depósito
 * @access  Private
 */
router.post('/create', mintController.createMintTransaction.bind(mintController));

/**
 * @route   GET /api/mint/by-deposit/:depositTransactionId
 * @desc    Buscar transação de mint por ID do depósito
 * @access  Private
 */
router.get('/by-deposit/:depositTransactionId', mintController.getMintByDeposit.bind(mintController));

/**
 * @route   GET /api/mint/user
 * @desc    Listar transações de mint do usuário
 * @access  Private
 */
router.get('/user', mintController.getUserMints.bind(mintController));

/**
 * @route   GET /api/mint/dev/test
 * @desc    DEV: Teste simples para verificar se rota funciona
 * @access  Public (desenvolvimento)
 */
router.get('/dev/test', (req, res) => {
  res.json({ success: true, message: 'Rota de teste funcionando sem JWT', timestamp: new Date().toISOString() });
});

/**
 * @route   GET /api/mint/dev/by-deposit/:depositTransactionId
 * @desc    DEV: Buscar transação de mint por ID do depósito (sem JWT)
 * @access  Public (desenvolvimento)
 */
router.get('/dev/by-deposit/:depositTransactionId', mintController.getMintByDepositDev.bind(mintController));

module.exports = router;