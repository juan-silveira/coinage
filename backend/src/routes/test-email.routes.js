const express = require('express');
const router = express.Router();
const EmailService = require('../services/email.service');

/**
 * @swagger
 * /api/test/email/send:
 *   post:
 *     tags:
 *       - Test Email
 *     summary: Testar envio de email via MailerSend
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               to:
 *                 type: string
 *                 format: email
 *                 example: "test@example.com"
 *               subject:
 *                 type: string
 *                 example: "Teste MailerSend"
 *               message:
 *                 type: string
 *                 example: "Esta é uma mensagem de teste"
 *     responses:
 *       200:
 *         description: Email enviado com sucesso
 *       400:
 *         description: Erro de validação
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/send', async (req, res) => {
  try {
    const { to, subject = 'Teste MailerSend - Coinage', message = 'Esta é uma mensagem de teste do sistema Coinage.' } = req.body;
    
    if (!to) {
      return res.status(400).json({
        success: false,
        message: 'Email destinatário é obrigatório'
      });
    }

    const emailService = new EmailService();
    
    const result = await emailService.sendEmail({
      to: {
        email: to,
        name: 'Test User'
      },
      subject,
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0;">🏦 Coinage</h1>
            <p style="color: #6b7280; margin: 5px 0;">Sistema Financeiro</p>
          </div>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #1f2937; margin-top: 0;">Teste de Email</h2>
            <p style="color: #374151; line-height: 1.6;">${message}</p>
          </div>
          
          <div style="background: #ecfdf5; padding: 15px; border-radius: 8px; border-left: 4px solid #10b981;">
            <p style="margin: 0; color: #065f46;">
              ✅ <strong>MailerSend ativo!</strong><br>
              Email enviado via MailerSend API em ambiente de desenvolvimento/testnet.
            </p>
          </div>
          
          <div style="margin-top: 30px; text-align: center; color: #6b7280; font-size: 14px;">
            <p>Este é um email de teste do sistema Coinage</p>
            <p>Data: ${new Date().toLocaleString('pt-BR')}</p>
          </div>
        </div>
      `,
      textContent: `${message}\n\n✅ MailerSend ativo!\nEmail enviado via MailerSend API em ambiente de desenvolvimento/testnet.\n\nEste é um email de teste do sistema Coinage\nData: ${new Date().toLocaleString('pt-BR')}`
    });

    res.json({
      success: true,
      message: 'Email de teste enviado',
      result,
      provider: 'mailersend',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erro ao enviar email de teste:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao enviar email de teste',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/test/email/config:
 *   get:
 *     tags:
 *       - Test Email
 *     summary: Verificar configuração do provedor de email
 *     responses:
 *       200:
 *         description: Status da configuração
 */
router.get('/config', async (req, res) => {
  try {
    const emailService = new EmailService();
    
    const config = {
      activeProvider: emailService.activeProvider,
      provider: process.env.EMAIL_PROVIDER,
      fromEmail: process.env.MAILERSEND_FROM_EMAIL,
      fromName: process.env.MAILERSEND_FROM_NAME,
      hasApiToken: !!process.env.MAILERSEND_API_TOKEN,
      apiTokenPreview: process.env.MAILERSEND_API_TOKEN ? 
        `${process.env.MAILERSEND_API_TOKEN.substring(0, 10)}...` : null
    };

    // Testar se o provider está ativo
    const providerStatus = emailService.providerInstances?.mailersend?.isEnabled() || false;
    
    res.json({
      success: true,
      config,
      providerActive: providerStatus,
      environment: process.env.NODE_ENV || 'development',
      blockchain: process.env.DEFAULT_NETWORK || 'testnet'
    });

  } catch (error) {
    console.error('❌ Erro ao verificar configuração de email:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao verificar configuração',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/test/email/template:
 *   post:
 *     tags:
 *       - Test Email
 *     summary: Testar envio de template de email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               to:
 *                 type: string
 *                 format: email
 *                 example: "test@example.com"
 *               template:
 *                 type: string
 *                 example: "welcome"
 *                 enum: ["welcome", "deposit_confirmed", "withdrawal_completed"]
 *     responses:
 *       200:
 *         description: Template enviado com sucesso
 */
router.post('/template', async (req, res) => {
  try {
    const { to, template = 'welcome' } = req.body;
    
    if (!to) {
      return res.status(400).json({
        success: false,
        message: 'Email destinatário é obrigatório'
      });
    }

    const emailService = new EmailService();
    
    // Dados de teste baseados no template
    const templateData = {
      welcome: {
        userName: 'Test User',
        loginUrl: 'http://localhost:3000/auth/login',
        supportEmail: 'suporte@coinage.app'
      },
      deposit_confirmed: {
        userName: 'Test User',
        amount: 100.00,
        currency: 'BRL',
        transactionId: 'TEST_TX_123456',
        depositMethod: 'PIX',
        dashboardUrl: 'http://localhost:3000/dashboard'
      },
      withdrawal_completed: {
        userName: 'Test User', 
        amount: 50.00,
        currency: 'BRL',
        transactionId: 'TEST_WD_789012',
        pixKey: 'test@example.com',
        withdrawalFee: 2.50,
        dashboardUrl: 'http://localhost:3000/dashboard'
      }
    };

    const result = await emailService.sendTemplateEmail({
      template,
      to: {
        email: to,
        name: 'Test User'
      },
      data: templateData[template] || templateData.welcome
    });

    res.json({
      success: true,
      message: `Template "${template}" enviado com sucesso`,
      result,
      template,
      provider: 'mailersend',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erro ao enviar template de email:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao enviar template',
      error: error.message,
      template: req.body.template
    });
  }
});

module.exports = router;