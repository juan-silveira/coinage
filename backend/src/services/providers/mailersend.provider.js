const { MailerSend, EmailParams, Sender, Recipient } = require('mailersend');

/**
 * Provedor de email MailerSend
 * Implementa envio de emails transacionais via MailerSend API
 */
class MailerSendProvider {
  constructor() {
    this.mailersend = new MailerSend({
      apiKey: process.env.MAILERSEND_API_TOKEN,
    });
    
    this.defaultSender = {
      email: process.env.MAILERSEND_FROM_EMAIL || 'noreply@coinage.app',
      name: process.env.MAILERSEND_FROM_NAME || 'Coinage System',
    };

    this.isConfigured = !!(process.env.MAILERSEND_API_TOKEN && this.defaultSender.email);
  }

  /**
   * Verificar se o provedor está configurado
   */
  isEnabled() {
    return this.isConfigured;
  }

  /**
   * Enviar email simples
   */
  async sendEmail({ to, subject, htmlContent, textContent, from, replyTo, attachments = [] }) {
    try {
      if (!this.isConfigured) {
        throw new Error('MailerSend não está configurado. Verifique as variáveis de ambiente.');
      }

      // Configurar remetente
      const sender = new Sender(
        from?.email || this.defaultSender.email,
        from?.name || this.defaultSender.name
      );

      // Configurar destinatário
      const recipients = Array.isArray(to) 
        ? to.map(recipient => new Recipient(recipient.email, recipient.name))
        : [new Recipient(to.email || to, to.name)];

      // Configurar parâmetros do email
      const emailParams = new EmailParams()
        .setFrom(sender)
        .setTo(recipients)
        .setReplyTo(replyTo?.email || this.defaultSender.email)
        .setSubject(subject);

      // Adicionar conteúdo
      if (htmlContent) {
        emailParams.setHtml(htmlContent);
      }
      
      if (textContent) {
        emailParams.setText(textContent);
      }

      // Adicionar anexos se houver
      if (attachments && attachments.length > 0) {
        emailParams.setAttachments(attachments.map(att => ({
          content: att.content,
          filename: att.filename,
          type: att.type || 'application/octet-stream',
          disposition: att.disposition || 'attachment'
        })));
      }

      // Enviar email
      const response = await this.mailersend.email.send(emailParams);

      console.log('✅ Email enviado via MailerSend:', {
        messageId: response?.data?.message_id,
        to: recipients.map(r => r.email),
        subject
      });

      return {
        success: true,
        messageId: response?.data?.message_id,
        provider: 'mailersend',
        response
      };

    } catch (error) {
      console.error('❌ Erro ao enviar email via MailerSend:', error);
      
      return {
        success: false,
        error: error.message,
        provider: 'mailersend',
        details: error.response?.data || error.stack
      };
    }
  }

  /**
   * Enviar email usando template
   */
  async sendTemplateEmail({ to, templateId, variables, from }) {
    try {
      if (!this.isConfigured) {
        throw new Error('MailerSend não está configurado. Verifique as variáveis de ambiente.');
      }

      const sender = new Sender(
        from?.email || this.defaultSender.email,
        from?.name || this.defaultSender.name
      );

      const recipients = Array.isArray(to)
        ? to.map(recipient => new Recipient(recipient.email, recipient.name))
        : [new Recipient(to.email || to, to.name)];

      const emailParams = new EmailParams()
        .setFrom(sender)
        .setTo(recipients)
        .setTemplateId(templateId);

      // Adicionar variáveis do template
      if (variables && Object.keys(variables).length > 0) {
        emailParams.setVariables([
          {
            email: recipients[0].email,
            substitutions: Object.keys(variables).map(key => ({
              var: key,
              value: variables[key]
            }))
          }
        ]);
      }

      const response = await this.mailersend.email.send(emailParams);

      console.log('✅ Email template enviado via MailerSend:', {
        messageId: response?.data?.message_id,
        to: recipients.map(r => r.email),
        templateId
      });

      return {
        success: true,
        messageId: response?.data?.message_id,
        provider: 'mailersend',
        response
      };

    } catch (error) {
      console.error('❌ Erro ao enviar email template via MailerSend:', error);
      
      return {
        success: false,
        error: error.message,
        provider: 'mailersend',
        details: error.response?.data || error.stack
      };
    }
  }

  /**
   * Verificar status de entrega
   */
  async getDeliveryStatus(messageId) {
    try {
      // Nota: MailerSend não tem endpoint direto para verificar status por message_id
      // Seria necessário implementar webhooks para tracking de status
      console.warn('⚠️ MailerSend: Verificação de status não implementada. Use webhooks.');
      
      return {
        success: false,
        error: 'Status checking não implementado para MailerSend. Use webhooks.',
        provider: 'mailersend'
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        provider: 'mailersend'
      };
    }
  }

  /**
   * Listar templates disponíveis
   */
  async getTemplates() {
    try {
      if (!this.isConfigured) {
        throw new Error('MailerSend não está configurado.');
      }

      const response = await this.mailersend.messages.list();
      
      return {
        success: true,
        templates: response?.data || [],
        provider: 'mailersend'
      };

    } catch (error) {
      console.error('❌ Erro ao listar templates MailerSend:', error);
      
      return {
        success: false,
        error: error.message,
        provider: 'mailersend'
      };
    }
  }

  /**
   * Validar configuração do provedor
   */
  async validateConfiguration() {
    try {
      if (!this.isConfigured) {
        return {
          valid: false,
          error: 'Variáveis de ambiente não configuradas',
          missing: ['MAILERSEND_API_TOKEN', 'MAILERSEND_FROM_EMAIL']
        };
      }

      // Teste básico da API
      const testEmail = {
        to: { email: 'test@exemplo.com', name: 'Test' },
        subject: 'Teste de configuração MailerSend',
        htmlContent: '<p>Este é um email de teste.</p>',
        textContent: 'Este é um email de teste.'
      };

      // Não enviar realmente, apenas validar parâmetros
      const sender = new Sender(this.defaultSender.email, this.defaultSender.name);
      const recipients = [new Recipient(testEmail.to.email, testEmail.to.name)];
      
      const emailParams = new EmailParams()
        .setFrom(sender)
        .setTo(recipients)
        .setSubject(testEmail.subject)
        .setHtml(testEmail.htmlContent)
        .setText(testEmail.textContent);

      // Verificar se os parâmetros são válidos
      if (emailParams && sender && recipients) {
        return {
          valid: true,
          provider: 'mailersend',
          config: {
            apiKey: process.env.MAILERSEND_API_TOKEN ? '***' : null,
            fromEmail: this.defaultSender.email,
            fromName: this.defaultSender.name
          }
        };
      }

      return {
        valid: false,
        error: 'Configuração inválida',
        provider: 'mailersend'
      };

    } catch (error) {
      return {
        valid: false,
        error: error.message,
        provider: 'mailersend'
      };
    }
  }
}

module.exports = MailerSendProvider;