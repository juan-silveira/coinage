const express = require('express');
const router = express.Router();
const emailConfirmationController = require('../controllers/emailConfirmation.controller');
const { authenticateApiKey } = require('../middleware/auth.middleware');
const { authenticateJWT } = require('../middleware/jwt.middleware');
const { apiRateLimiter } = require('../middleware/rateLimit.middleware');
const { skipEmailConfirmation } = require('../middleware/emailConfirmed.middleware');

/**
 * @swagger
 * /api/email-confirmation/confirm:
 *   get:
 *     summary: Confirma email do usuário usando token via query params
 *     tags: [Email Confirmation]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Token de confirmação
 *       - in: query
 *         name: company
 *         schema:
 *           type: string
 *         description: Alias da empresa (opcional)
 *     responses:
 *       200:
 *         description: Email confirmado com sucesso
 *       400:
 *         description: Token inválido ou expirado
 */
router.get('/confirm',
  apiRateLimiter,
  skipEmailConfirmation,
  emailConfirmationController.confirmEmail
);

/**
 * @swagger
 * /api/email-confirmation/resend:
 *   post:
 *     summary: Reenvia email de confirmação
 *     tags: [Email Confirmation]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email do usuário
 *               companyAlias:
 *                 type: string
 *                 description: Alias da empresa (opcional)
 *     responses:
 *       200:
 *         description: Email reenviado com sucesso
 *       429:
 *         description: Rate limit excedido
 */
router.post('/resend',
  apiRateLimiter,
  skipEmailConfirmation,
  emailConfirmationController.resendConfirmationEmail
);

/**
 * @swagger
 * /api/email-confirmation/manual-confirm:
 *   post:
 *     summary: Confirmação manual do email (botão "Já confirmei meu email")
 *     tags: [Email Confirmation]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Email confirmado manualmente com sucesso
 *       401:
 *         description: Usuário não autenticado
 *       404:
 *         description: Usuário não encontrado
 */
router.post('/manual-confirm',
  apiRateLimiter,
  authenticateJWT,
  skipEmailConfirmation,
  emailConfirmationController.manualConfirmEmail
);

/**
 * @swagger
 * /api/email-confirmation/status/{userId}:
 *   get:
 *     summary: Verificar status do email de confirmação
 *     tags: [Email Confirmation]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do usuário
 *     responses:
 *       200:
 *         description: Status do email retornado
 *       404:
 *         description: Usuário não encontrado
 */
router.get('/status/:userId',
  apiRateLimiter,
  (req, res, next) => {
    authenticateJWT(req, res, (jwtError) => {
      if (!jwtError) return next();
      authenticateApiKey(req, res, (apiError) => {
        if (!apiError) return next();
        return res.status(401).json({
          success: false,
          message: 'Token JWT ou API Key requerido',
          code: 'AUTHENTICATION_REQUIRED'
        });
      });
    });
  },
  skipEmailConfirmation,
  emailConfirmationController.getEmailStatus
);

/**
 * @swagger
 * /api/email-confirmation/health:
 *   get:
 *     summary: Health check do serviço
 *     tags: [Email Confirmation]
 *     responses:
 *       200:
 *         description: Serviço operacional
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'Email Confirmation Service',
    status: 'operational',
    timestamp: new Date().toISOString(),
    endpoints: {
      confirm: 'GET /api/email-confirmation/confirm?token=xxx&company=yyy',
      resend: 'POST /api/email-confirmation/resend',
      manualConfirm: 'POST /api/email-confirmation/manual-confirm',
      status: 'GET /api/email-confirmation/status/:userId'
    }
  });
});

module.exports = router;