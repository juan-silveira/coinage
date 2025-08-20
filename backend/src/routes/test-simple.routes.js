const express = require('express');
const router = express.Router();

/**
 * @swagger
 * /api/test-simple/mailersend:
 *   get:
 *     summary: Teste simples do MailerSend
 *     tags: [Test]
 *     responses:
 *       200:
 *         description: Configuração verificada
 */
router.get('/mailersend', async (req, res) => {
  try {
    console.log('🧪 Testando configuração do MailerSend (simples)...');
    
    const config = {
      EMAIL_PROVIDER: process.env.EMAIL_PROVIDER,
      MAILERSEND_FROM_EMAIL: process.env.MAILERSEND_FROM_EMAIL,
      MAILERSEND_FROM_NAME: process.env.MAILERSEND_FROM_NAME,
      hasApiToken: !!process.env.MAILERSEND_API_TOKEN,
      apiTokenPreview: process.env.MAILERSEND_API_TOKEN ? 
        `${process.env.MAILERSEND_API_TOKEN.substring(0, 15)}...` : null,
      DEFAULT_NETWORK: process.env.DEFAULT_NETWORK,
      NODE_ENV: process.env.NODE_ENV
    };

    console.log('📧 Configuração MailerSend:', config);

    // Testar apenas a importação do MailerSendProvider
    try {
      const MailerSendProvider = require('../services/providers/mailersend.provider');
      const provider = new MailerSendProvider();
      console.log('✅ MailerSendProvider importado e instanciado com sucesso');
      console.log('🔍 Provider enabled:', provider.isEnabled());

      res.json({
        success: true,
        message: 'Configuração MailerSend verificada (teste simples)',
        config,
        provider: {
          imported: true,
          enabled: provider.isEnabled(),
          configured: provider.isConfigured
        },
        timestamp: new Date().toISOString()
      });

    } catch (providerError) {
      console.error('❌ Erro ao importar MailerSendProvider:', providerError);
      throw providerError;
    }

  } catch (error) {
    console.error('❌ Erro no teste simples MailerSend:', error);
    res.status(500).json({
      success: false,
      message: 'Erro no teste simples MailerSend',
      error: error.message,
      stack: error.stack
    });
  }
});

/**
 * @swagger
 * /api/test-simple/send-email:
 *   post:
 *     summary: Enviar email via MailerSend (teste direto)
 *     tags: [Test]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               to:
 *                 type: string
 *                 format: email
 *                 default: "juansilveira@gmail.com"
 *     responses:
 *       200:
 *         description: Email enviado com sucesso
 */
router.post('/send-email', async (req, res) => {
  try {
    const { to = 'juansilveira@gmail.com' } = req.body;
    
    console.log('📧 Enviando email de teste direto para:', to);
    
    // Importar e usar MailerSendProvider diretamente
    const MailerSendProvider = require('../services/providers/mailersend.provider');
    const provider = new MailerSendProvider();

    if (!provider.isEnabled()) {
      throw new Error('MailerSend não está configurado ou habilitado');
    }

    const result = await provider.sendEmail({
      to: {
        email: to,
        name: 'Test User'
      },
      subject: 'Teste MailerSend Direto - Coinage System',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #374151 0%, #1f2937 50%, #00229e 100%); color: white;">
          <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 12px; margin-bottom: 20px; text-align: center;">
            <div style="font-size: 20px; font-weight: 700;">🏦 Coinage</div>
          </div>
          
          <div style="background: white; color: #333; padding: 30px; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.2);">
            <h1 style="color: #059669; text-align: center; margin-bottom: 20px;">✅ MailerSend Funcionando!</h1>
            
            <p>Este é um teste direto do MailerSend via Coinage System.</p>
            
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #374151; margin-top: 0;">Configuração Atual:</h3>
              <ul style="color: #6b7280;">
                <li><strong>Provider:</strong> MailerSend</li>
                <li><strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}</li>
                <li><strong>Network:</strong> ${process.env.DEFAULT_NETWORK || 'testnet'}</li>
                <li><strong>From:</strong> ${process.env.MAILERSEND_FROM_EMAIL}</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <div style="background: #ecfdf5; border: 2px solid #10b981; padding: 15px; border-radius: 8px;">
                <p style="margin: 0; color: #065f46;"><strong>🎉 Sucesso!</strong> O sistema de email está configurado e funcionando corretamente.</p>
              </div>
            </div>
          </div>
          
          <div style="text-align: center; padding: 20px; color: rgba(255,255,255,0.7); font-size: 13px;">
            Sistema Coinage - Teste realizado em ${new Date().toLocaleString('pt-BR')}
          </div>
        </div>
      `,
      textContent: `Coinage - Teste MailerSend Direto

✅ MailerSend está funcionando!

Este é um teste direto do MailerSend via Coinage System.

Configuração:
- Provider: MailerSend
- Environment: ${process.env.NODE_ENV || 'development'}
- Network: ${process.env.DEFAULT_NETWORK || 'testnet'}
- From: ${process.env.MAILERSEND_FROM_EMAIL}

🎉 Sucesso! O sistema de email está configurado e funcionando corretamente.

Sistema Coinage - Teste realizado em ${new Date().toLocaleString('pt-BR')}`
    });

    console.log('📧 Resultado do envio direto:', result);

    res.json({
      success: true,
      message: 'Email de teste enviado via MailerSend direto',
      result,
      provider: 'mailersend_direct',
      to,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erro ao enviar email direto:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao enviar email via MailerSend direto',
      error: error.message,
      stack: error.stack
    });
  }
});

module.exports = router;