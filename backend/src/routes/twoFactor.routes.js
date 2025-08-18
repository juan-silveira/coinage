const express = require('express');
const router = express.Router();
const twoFactorController = require('../controllers/twoFactor.controller');
const { authenticateToken } = require('../middleware/jwt.middleware');
const { apiRateLimiter } = require('../middleware/rateLimit.middleware');
// const { requestLogger, performanceLogger } = require('../middleware/logging.middleware');

// Middleware comum
// router.use(requestLogger);
// router.use(performanceLogger);
// A autenticação JWT é aplicada no app.js para todas as rotas /api/2fa

/**
 * @swagger
 * /api/2fa/methods:
 *   get:
 *     summary: Lista métodos 2FA do usuário
 *     tags: [Two Factor Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Métodos 2FA listados com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     methods:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           type:
 *                             type: string
 *                             enum: [totp, email, backup_codes]
 *                           isActive:
 *                             type: boolean
 *                           isVerified:
 *                             type: boolean
 *                     hasActive2FA:
 *                       type: boolean
 *       401:
 *         description: Token inválido
 */
router.get('/methods', apiRateLimiter, twoFactorController.getTwoFactorMethods);

/**
 * @swagger
 * /api/2fa/totp/setup:
 *   post:
 *     summary: Configura TOTP (Google Authenticator)
 *     tags: [Two Factor Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: TOTP configurado com sucesso
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
 *                     secret:
 *                       type: string
 *                     qrCodeUrl:
 *                       type: string
 *                     manualEntryKey:
 *                       type: string
 *       401:
 *         description: Token inválido
 */
router.post('/totp/setup', apiRateLimiter, twoFactorController.setupTOTP);

/**
 * @swagger
 * /api/2fa/totp/verify:
 *   post:
 *     summary: Verifica e ativa TOTP
 *     tags: [Two Factor Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *                 description: Código TOTP de 6 dígitos
 *             example:
 *               code: "123456"
 *     responses:
 *       200:
 *         description: TOTP verificado e ativado
 *       400:
 *         description: Código inválido
 *       401:
 *         description: Token inválido
 */
router.post('/totp/verify', apiRateLimiter, twoFactorController.verifyTOTP);

/**
 * @swagger
 * /api/2fa/email/setup:
 *   post:
 *     summary: Configura 2FA por email
 *     tags: [Two Factor Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email alternativo (opcional, usa o email do usuário se não fornecido)
 *             example:
 *               email: "backup@exemplo.com"
 *     responses:
 *       200:
 *         description: Email 2FA configurado
 *       401:
 *         description: Token inválido
 */
router.post('/email/setup', apiRateLimiter, twoFactorController.setupEmail2FA);

/**
 * @swagger
 * /api/2fa/email/send:
 *   post:
 *     summary: Envia código 2FA por email
 *     tags: [Two Factor Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Código enviado por email
 *       400:
 *         description: Email 2FA não configurado ou bloqueado
 *       401:
 *         description: Token inválido
 */
router.post('/email/send', apiRateLimiter, twoFactorController.sendEmailCode);

/**
 * @swagger
 * /api/2fa/email/verify:
 *   post:
 *     summary: Verifica código 2FA por email
 *     tags: [Two Factor Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *                 description: Código recebido por email
 *             example:
 *               code: "123456"
 *     responses:
 *       200:
 *         description: Código verificado com sucesso
 *       400:
 *         description: Código inválido ou expirado
 *       401:
 *         description: Token inválido
 */
router.post('/email/verify', apiRateLimiter, twoFactorController.verifyEmailCode);

/**
 * @swagger
 * /api/2fa/verify:
 *   post:
 *     summary: Verifica código 2FA (qualquer método)
 *     tags: [Two Factor Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *                 description: Código 2FA
 *               method:
 *                 type: string
 *                 enum: [totp, email, backup_codes]
 *                 description: Método específico (opcional)
 *             example:
 *               code: "123456"
 *               method: "totp"
 *     responses:
 *       200:
 *         description: Código verificado com sucesso
 *       400:
 *         description: Código inválido
 *       401:
 *         description: Token inválido
 */
router.post('/verify', apiRateLimiter, twoFactorController.verify2FA);

/**
 * @swagger
 * /api/2fa/disable:
 *   post:
 *     summary: Desabilita método 2FA
 *     tags: [Two Factor Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - method
 *             properties:
 *               method:
 *                 type: string
 *                 enum: [totp, email, backup_codes]
 *                 description: Método 2FA a ser desabilitado
 *               confirmationCode:
 *                 type: string
 *                 description: Código 2FA para confirmação (recomendado)
 *             example:
 *               method: "totp"
 *               confirmationCode: "123456"
 *     responses:
 *       200:
 *         description: Método 2FA desabilitado
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Token inválido ou código de confirmação inválido
 */
router.post('/disable', apiRateLimiter, twoFactorController.disable2FA);

/**
 * @swagger
 * /api/2fa/backup-codes/generate:
 *   post:
 *     summary: Gera novos códigos de backup
 *     tags: [Two Factor Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               confirmationCode:
 *                 type: string
 *                 description: Código 2FA para confirmação (recomendado)
 *             example:
 *               confirmationCode: "123456"
 *     responses:
 *       200:
 *         description: Novos códigos de backup gerados
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
 *                     backupCodes:
 *                       type: array
 *                       items:
 *                         type: string
 *       401:
 *         description: Token inválido ou código de confirmação inválido
 */
router.post('/backup-codes/generate', apiRateLimiter, twoFactorController.generateBackupCodes);

/**
 * @swagger
 * /api/2fa/check-requirement:
 *   get:
 *     summary: Verifica se 2FA é necessário para uma operação
 *     tags: [Two Factor Authentication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: operation
 *         required: true
 *         description: Nome da operação
 *         schema:
 *           type: string
 *           enum: [change_password, add_api_key, transfer_tokens, change_2fa_settings]
 *     responses:
 *       200:
 *         description: Status do requisito 2FA
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     requires2FA:
 *                       type: boolean
 *                     has2FA:
 *                       type: boolean
 *                     availableMethods:
 *                       type: array
 *                     operation:
 *                       type: string
 *       401:
 *         description: Token inválido
 */
router.get('/check-requirement', apiRateLimiter, twoFactorController.check2FARequirement);

module.exports = router;