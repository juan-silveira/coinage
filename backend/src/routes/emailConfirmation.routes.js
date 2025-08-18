const express = require('express');
const router = express.Router();
const emailService = require('../services/email.service');
const userService = require('../services/user.service');
const userCompanyService = require('../services/userCompany.service');
const whitelabelService = require('../services/whitelabel.service');

/**
 * @swagger
 * /api/email-confirmation/confirm:
 *   post:
 *     summary: Confirma email do usuário
 *     tags: [Email Confirmation]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - companyAlias
 *             properties:
 *               token:
 *                 type: string
 *                 description: Token de confirmação
 *               companyAlias:
 *                 type: string
 *                 description: Alias da empresa
 *     responses:
 *       200:
 *         description: Email confirmado com sucesso
 *       400:
 *         description: Token inválido ou expirado
 */
router.post('/confirm', async (req, res) => {
  try {
    const { token, companyAlias } = req.body;

    if (!token || !companyAlias) {
      return res.status(400).json({
        success: false,
        message: 'Token e company alias são obrigatórios'
      });
    }

    // Validar token
    const tokenData = await emailService.validateEmailConfirmationToken(token, companyAlias);

    if (!tokenData || !tokenData.valid) {
      return res.status(400).json({
        success: false,
        message: 'Token inválido ou expirado'
      });
    }

    if (tokenData.bypassed) {
      // Em modo bypass, apenas retornar sucesso
      return res.json({
        success: true,
        message: 'Email confirmado com sucesso (bypass ativo)',
        bypassed: true
      });
    }

    // Ativar usuário
    await userService.activateUser(tokenData.userId);

    res.json({
      success: true,
      message: 'Email confirmado com sucesso! Sua conta foi ativada.'
    });

  } catch (error) {
    console.error('❌ Erro na confirmação de email:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

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
 *               - companyAlias
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email do usuário
 *               companyAlias:
 *                 type: string
 *                 description: Alias da empresa
 *     responses:
 *       200:
 *         description: Email reenviado com sucesso
 *       404:
 *         description: Usuário não encontrado
 */
router.post('/resend', async (req, res) => {
  try {
    const { email, companyAlias } = req.body;

    if (!email || !companyAlias) {
      return res.status(400).json({
        success: false,
        message: 'Email e company alias são obrigatórios'
      });
    }

    // Buscar usuário
    const user = await userService.getUserByEmail(email);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Buscar dados da empresa
    const branding = await whitelabelService.getCompanyBrandingByAlias(companyAlias);
    
    // Gerar novo token
    const token = await emailService.generateEmailConfirmationToken(user.id, branding.company_id);

    // Enviar email
    await emailService.sendEmailConfirmation(email, {
      userName: user.name,
      companyName: branding.brand_name,
      companyId: branding.company_id,
      companyAlias,
      userId: user.id,
      token,
      baseUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
      primaryColor: branding.primary_color
    });

    res.json({
      success: true,
      message: 'Email de confirmação reenviado com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao reenviar confirmação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

module.exports = router;