const mandrill = require('mandrill-api/mandrill');

/**
 * Provedor de email Mandrill (MailChimp Transactional)
 * Implementa envio de emails transacionais via Mandrill API
 */
class MandrillProvider {
  constructor() {
    this.apiKey = process.env.MANDRILL_API_KEY;
    this.client = this.apiKey ? new mandrill.Mandrill(this.apiKey) : null;
    
    this.defaultSender = {
      email: process.env.MANDRILL_FROM_EMAIL || 'noreply@coinage.com',
      name: process.env.MANDRILL_FROM_NAME || 'Coinage',
    };

    this.isConfigured = !!(
      process.env.MANDRILL_API_KEY && 
      process.env.MANDRILL_FROM_EMAIL
    );
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
    return new Promise((resolve) => {
      try {
        if (!this.isConfigured || !this.client) {
          resolve({
            success: false,
            error: 'Mandrill não está configurado. Verifique as variáveis de ambiente.',
            provider: 'mandrill'
          });
          return;
        }

        // Preparar destinatários
        const recipients = Array.isArray(to) 
          ? to.map(recipient => ({
              email: recipient.email,
              name: recipient.name,
              type: 'to'
            }))
          : [{
              email: to.email || to,
              name: to.name || '',
              type: 'to'
            }];

        // Preparar anexos
        const mandrillAttachments = attachments.map(att => ({
          type: att.type || 'application/octet-stream',
          name: att.filename,
          content: att.content
        }));

        // Configurar mensagem
        const message = {
          html: htmlContent,
          text: textContent,
          subject: subject,
          from_email: from?.email || this.defaultSender.email,
          from_name: from?.name || this.defaultSender.name,
          to: recipients,
          headers: {
            'Reply-To': replyTo?.email || this.defaultSender.email
          },
          important: false,
          track_opens: true,
          track_clicks: true,
          auto_text: !textContent, // Gerar texto automaticamente se não fornecido
          auto_html: false,
          inline_css: true,
          url_strip_qs: false,
          preserve_recipients: false,
          view_content_link: false,
          tracking_domain: null,
          signing_domain: null,
          return_path_domain: null,
          merge: false,
          attachments: mandrillAttachments
        };

        // Enviar email
        this.client.messages.send({
          message: message,
          async: false,
          ip_pool: 'Main Pool'
        }, (result) => {
          if (result && result.length > 0) {
            const firstResult = result[0];
            
            if (firstResult.status === 'sent' || firstResult.status === 'queued') {
              console.log('✅ Email enviado via Mandrill:', {
                messageId: firstResult._id,
                to: recipients.map(r => r.email),
                subject,
                status: firstResult.status
              });

              resolve({
                success: true,
                messageId: firstResult._id,
                provider: 'mandrill',
                status: firstResult.status,
                response: result
              });
            } else {
              console.error('❌ Erro no envio via Mandrill:', firstResult);
              
              resolve({
                success: false,
                error: firstResult.reject_reason || 'Erro desconhecido',
                provider: 'mandrill',
                status: firstResult.status,
                details: result
              });
            }
          } else {
            resolve({
              success: false,
              error: 'Resposta vazia da API Mandrill',
              provider: 'mandrill'
            });
          }
        }, (error) => {
          console.error('❌ Erro na API Mandrill:', error);
          
          resolve({
            success: false,
            error: error.message,
            provider: 'mandrill',
            details: error
          });
        });

      } catch (error) {
        console.error('❌ Erro ao enviar email via Mandrill:', error);
        
        resolve({
          success: false,
          error: error.message,
          provider: 'mandrill'
        });
      }
    });
  }

  /**
   * Enviar email usando template
   */
  async sendTemplateEmail({ to, templateName, variables, from }) {
    return new Promise((resolve) => {
      try {
        if (!this.isConfigured || !this.client) {
          resolve({
            success: false,
            error: 'Mandrill não está configurado. Verifique as variáveis de ambiente.',
            provider: 'mandrill'
          });
          return;
        }

        const recipients = Array.isArray(to)
          ? to.map(recipient => ({
              email: recipient.email,
              name: recipient.name,
              type: 'to'
            }))
          : [{
              email: to.email || to,
              name: to.name || '',
              type: 'to'
            }];

        // Preparar variáveis globais do template
        const globalMergeVars = variables ? Object.keys(variables).map(key => ({
          name: key,
          content: variables[key]
        })) : [];

        const templateContent = []; // Templates do Mandrill não precisam de conteúdo adicional

        const message = {
          from_email: from?.email || this.defaultSender.email,
          from_name: from?.name || this.defaultSender.name,
          to: recipients,
          important: false,
          track_opens: true,
          track_clicks: true,
          auto_text: true,
          auto_html: false,
          inline_css: true,
          url_strip_qs: false,
          preserve_recipients: false,
          view_content_link: false,
          global_merge_vars: globalMergeVars,
          merge: true,
          merge_language: 'handlebars'
        };

        this.client.messages.sendTemplate({
          template_name: templateName,
          template_content: templateContent,
          message: message,
          async: false
        }, (result) => {
          if (result && result.length > 0) {
            const firstResult = result[0];
            
            if (firstResult.status === 'sent' || firstResult.status === 'queued') {
              console.log('✅ Email template enviado via Mandrill:', {
                messageId: firstResult._id,
                to: recipients.map(r => r.email),
                templateName,
                status: firstResult.status
              });

              resolve({
                success: true,
                messageId: firstResult._id,
                provider: 'mandrill',
                status: firstResult.status,
                response: result
              });
            } else {
              console.error('❌ Erro no envio template via Mandrill:', firstResult);
              
              resolve({
                success: false,
                error: firstResult.reject_reason || 'Erro desconhecido',
                provider: 'mandrill',
                status: firstResult.status,
                details: result
              });
            }
          } else {
            resolve({
              success: false,
              error: 'Resposta vazia da API Mandrill',
              provider: 'mandrill'
            });
          }
        }, (error) => {
          console.error('❌ Erro na API Mandrill (template):', error);
          
          resolve({
            success: false,
            error: error.message,
            provider: 'mandrill',
            details: error
          });
        });

      } catch (error) {
        console.error('❌ Erro ao enviar template via Mandrill:', error);
        
        resolve({
          success: false,
          error: error.message,
          provider: 'mandrill'
        });
      }
    });
  }

  /**
   * Verificar informações da mensagem
   */
  async getDeliveryStatus(messageId) {
    return new Promise((resolve) => {
      try {
        if (!this.isConfigured || !this.client) {
          resolve({
            success: false,
            error: 'Mandrill não está configurado.',
            provider: 'mandrill'
          });
          return;
        }

        this.client.messages.info({
          id: messageId
        }, (result) => {
          console.log('✅ Status obtido via Mandrill:', {
            messageId,
            status: result.state
          });

          resolve({
            success: true,
            status: result.state,
            provider: 'mandrill',
            details: result
          });
        }, (error) => {
          console.error('❌ Erro ao obter status via Mandrill:', error);
          
          resolve({
            success: false,
            error: error.message,
            provider: 'mandrill'
          });
        });

      } catch (error) {
        resolve({
          success: false,
          error: error.message,
          provider: 'mandrill'
        });
      }
    });
  }

  /**
   * Listar templates disponíveis
   */
  async getTemplates() {
    return new Promise((resolve) => {
      try {
        if (!this.isConfigured || !this.client) {
          resolve({
            success: false,
            error: 'Mandrill não está configurado.',
            provider: 'mandrill'
          });
          return;
        }

        this.client.templates.list({
          label: null
        }, (result) => {
          resolve({
            success: true,
            templates: result,
            provider: 'mandrill'
          });
        }, (error) => {
          console.error('❌ Erro ao listar templates Mandrill:', error);
          
          resolve({
            success: false,
            error: error.message,
            provider: 'mandrill'
          });
        });

      } catch (error) {
        resolve({
          success: false,
          error: error.message,
          provider: 'mandrill'
        });
      }
    });
  }

  /**
   * Validar configuração do provedor
   */
  async validateConfiguration() {
    return new Promise((resolve) => {
      try {
        if (!this.isConfigured || !this.client) {
          resolve({
            valid: false,
            error: 'Variáveis de ambiente não configuradas',
            missing: ['MANDRILL_API_KEY', 'MANDRILL_FROM_EMAIL'],
            provider: 'mandrill'
          });
          return;
        }

        // Testar a API com ping
        this.client.users.ping2({}, (result) => {
          resolve({
            valid: true,
            provider: 'mandrill',
            ping: result.PING,
            config: {
              apiKey: this.apiKey ? '***' : null,
              fromEmail: this.defaultSender.email,
              fromName: this.defaultSender.name
            }
          });
        }, (error) => {
          resolve({
            valid: false,
            error: error.message,
            provider: 'mandrill'
          });
        });

      } catch (error) {
        resolve({
          valid: false,
          error: error.message,
          provider: 'mandrill'
        });
      }
    });
  }
}

module.exports = MandrillProvider;