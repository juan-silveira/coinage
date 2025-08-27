const express = require('express');
const router = express.Router();
const PixController = require('../controllers/pix.controller');

const pixController = new PixController();

/**
 * @route   GET /api/pix/dev/payment/:pixPaymentId
 * @desc    Obter dados do pagamento PIX (SEM AUTENTICAÇÃO - DESENVOLVIMENTO)
 * @access  Public
 */
router.get('/dev/payment/:pixPaymentId', pixController.getPixPayment.bind(pixController));

/**
 * @route   POST /api/pix/dev/payment/:pixPaymentId/force
 * @desc    Forçar confirmação do PIX (SEM AUTENTICAÇÃO - DESENVOLVIMENTO)
 * @access  Public
 */
router.post('/dev/payment/:pixPaymentId/force', pixController.confirmPixPayment.bind(pixController));

/**
 * @route   GET /api/pix/payment/:pixPaymentId
 * @desc    Obter dados do pagamento PIX
 * @access  Private
 */
router.get('/payment/:pixPaymentId', pixController.getPixPayment.bind(pixController));

/**
 * @route   POST /api/pix/payment/:pixPaymentId/force
 * @desc    Forçar confirmação do PIX (desenvolvimento)
 * @access  Private
 */
router.post('/payment/:pixPaymentId/force', pixController.confirmPixPayment.bind(pixController));

module.exports = router;