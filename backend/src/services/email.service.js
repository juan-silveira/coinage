const prismaConfig = require('../config/prisma');
const axios = require('axios');

class EmailService {
  constructor() {
    this.prisma = null;
    this.mandrillApiKey = process.env.MANDRILL_API_KEY;
    this.mandrillBaseUrl = 'https://mandrillapp.com/api/1.0';
    this.fromEmail = process.env.FROM_EMAIL || 'noreply@coinage.com';
    this.fromName = process.env.FROM_NAME || 'Coinage';
  }

  async init() {
    this.prisma = prismaConfig.getPrisma();
  }

  /**
   * Envia email usando Mandrill
   * @param {Object} emailData - Dados do email
   * @returns {Promise<Object>} Resultado do envio
   */
  async sendEmail(emailData) {
    try {
      if (!this.mandrillApiKey) {
        console.warn('⚠️ MANDRILL_API_KEY não configurada, simulando envio de email');
        return this.simulateEmailSend(emailData);
      }

      const payload = {
        key: this.mandrillApiKey,
        message: {
          html: emailData.htmlContent,
          text: emailData.textContent,
          subject: emailData.subject,
          from_email: emailData.fromEmail || this.fromEmail,
          from_name: emailData.fromName || this.fromName,
          to: [
            {
              email: emailData.toEmail,
              name: emailData.toName,
              type: 'to'
            }
          ],
          headers: {
            'Reply-To': emailData.replyTo || this.fromEmail
          },
          tags: emailData.tags || [],
          metadata: emailData.metadata || {},
          track_opens: true,
          track_clicks: true
        }
      };

      const response = await axios.post(
        `${this.mandrillBaseUrl}/messages/send.json`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      const result = response.data[0];

      // Registrar log do email
      await this.logEmail({
        templateId: emailData.templateId,
        toEmail: emailData.toEmail,
        fromEmail: emailData.fromEmail || this.fromEmail,
        subject: emailData.subject,
        status: this.mapMandrillStatus(result.status),
        providerId: result._id,
        sentAt: result.status === 'sent' ? new Date() : null,
        metadata: {
          mandrillResponse: result,
          tags: emailData.tags
        }
      });

      return {
        success: true,
        providerId: result._id,
        status: result.status,
        rejectReason: result.reject_reason
      };

    } catch (error) {
      console.error('❌ Erro ao enviar email:', error);

      // Registrar erro no log
      await this.logEmail({
        templateId: emailData.templateId,
        toEmail: emailData.toEmail,
        fromEmail: emailData.fromEmail || this.fromEmail,
        subject: emailData.subject,
        status: 'failed',
        errorMessage: error.message,
        metadata: { error: error.message }
      });

      throw error;
    }
  }

  /**
   * Simula envio de email para desenvolvimento
   * @param {Object} emailData - Dados do email
   * @returns {Promise<Object>} Resultado simulado
   */
  async simulateEmailSend(emailData) {
    console.log('📧 Simulando envio de email:');
    console.log(`Para: ${emailData.toEmail}`);
    console.log(`Assunto: ${emailData.subject}`);
    console.log(`HTML: ${emailData.htmlContent?.substring(0, 200)}...`);

    // Registrar log simulado
    await this.logEmail({
      templateId: emailData.templateId,
      toEmail: emailData.toEmail,
      fromEmail: emailData.fromEmail || this.fromEmail,
      subject: emailData.subject,
      status: 'sent',
      sentAt: new Date(),
      metadata: { simulated: true }
    });

    return {
      success: true,
      providerId: `sim_${Date.now()}`,
      status: 'sent',
      simulated: true
    };
  }

  /**
   * Mapeia status do Mandrill para nosso enum
   * @param {string} mandrillStatus - Status do Mandrill
   * @returns {string} Status mapeado
   */
  mapMandrillStatus(mandrillStatus) {
    const statusMap = {
      'sent': 'sent',
      'queued': 'pending',
      'scheduled': 'pending',
      'rejected': 'failed',
      'invalid': 'failed'
    };

    return statusMap[mandrillStatus] || 'pending';
  }

  /**
   * Registra log do email
   * @param {Object} logData - Dados do log
   * @returns {Promise<Object>} Log criado
   */
  async logEmail(logData) {
    try {
      if (!this.prisma) await this.init();

      const emailLog = await this.prisma.emailLog.create({
        data: logData
      });

      return emailLog;
    } catch (error) {
      console.error('❌ Erro ao registrar log de email:', error);
      // Não lançar erro para não quebrar fluxo principal
      return null;
    }
  }

  /**
   * Envia email de confirmação de vinculação ao cliente
   * @param {string} email - Email do usuário
   * @param {Object} data - Dados para o template
   * @returns {Promise<Object>} Resultado do envio
   */
  async sendClientLinkConfirmation(email, data) {
    const template = await this.getTemplate('client_link_confirmation');
    
    const htmlContent = this.replaceTemplateVariables(template.htmlContent, {
      userName: data.userName,
      clientName: data.clientName,
      linkedAt: data.linkedAt.toLocaleDateString('pt-BR'),
      year: new Date().getFullYear()
    });

    const textContent = this.replaceTemplateVariables(template.textContent || '', {
      userName: data.userName,
      clientName: data.clientName,
      linkedAt: data.linkedAt.toLocaleDateString('pt-BR')
    });

    return await this.sendEmail({
      templateId: template.id,
      toEmail: email,
      toName: data.userName,
      subject: template.subject.replace('{{clientName}}', data.clientName),
      htmlContent,
      textContent,
      tags: ['client_link', 'confirmation'],
      metadata: {
        clientName: data.clientName,
        linkedAt: data.linkedAt.toISOString()
      }
    });
  }

  /**
   * Envia email de código 2FA
   * @param {string} email - Email do usuário
   * @param {Object} data - Dados para o template
   * @returns {Promise<Object>} Resultado do envio
   */
  async send2FACode(email, data) {
    const template = await this.getTemplate('2fa_code');
    
    const htmlContent = this.replaceTemplateVariables(template.htmlContent, {
      userName: data.userName,
      code: data.code,
      expiresIn: data.expiresIn || '10 minutos',
      year: new Date().getFullYear()
    });

    const textContent = this.replaceTemplateVariables(template.textContent || '', {
      userName: data.userName,
      code: data.code,
      expiresIn: data.expiresIn || '10 minutos'
    });

    return await this.sendEmail({
      templateId: template.id,
      toEmail: email,
      toName: data.userName,
      subject: template.subject,
      htmlContent,
      textContent,
      tags: ['2fa', 'security'],
      metadata: {
        codeType: '2fa',
        expiresAt: new Date(Date.now() + (data.expiresInMs || 10 * 60 * 1000)).toISOString()
      }
    });
  }

  /**
   * Envia email de reset de senha
   * @param {string} email - Email do usuário
   * @param {Object} data - Dados para o template
   * @returns {Promise<Object>} Resultado do envio
   */
  async sendPasswordReset(email, data) {
    const template = await this.getTemplate('password_reset');
    
    const htmlContent = this.replaceTemplateVariables(template.htmlContent, {
      userName: data.userName,
      resetLink: data.resetLink,
      expiresIn: data.expiresIn || '1 hora',
      year: new Date().getFullYear()
    });

    const textContent = this.replaceTemplateVariables(template.textContent || '', {
      userName: data.userName,
      resetLink: data.resetLink,
      expiresIn: data.expiresIn || '1 hora'
    });

    return await this.sendEmail({
      templateId: template.id,
      toEmail: email,
      toName: data.userName,
      subject: template.subject,
      htmlContent,
      textContent,
      tags: ['password_reset', 'security'],
      metadata: {
        resetToken: data.token,
        expiresAt: data.expiresAt
      }
    });
  }

  /**
   * Obtém template de email
   * @param {string} templateName - Nome do template
   * @returns {Promise<Object>} Template encontrado
   */
  async getTemplate(templateName) {
    try {
      if (!this.prisma) await this.init();

      let template = await this.prisma.emailTemplate.findUnique({
        where: { name: templateName }
      });

      if (!template) {
        // Criar template padrão se não existir
        template = await this.createDefaultTemplate(templateName);
      }

      return template;
    } catch (error) {
      console.error('❌ Erro ao obter template:', error);
      throw error;
    }
  }

  /**
   * Cria templates padrão
   * @param {string} templateName - Nome do template
   * @returns {Promise<Object>} Template criado
   */
  async createDefaultTemplate(templateName) {
    const templates = {
      'client_link_confirmation': {
        name: 'client_link_confirmation',
        subject: 'Bem-vindo ao {{clientName}}!',
        htmlContent: `
          <h2>Olá {{userName}}!</h2>
          <p>Sua conta foi vinculada com sucesso ao <strong>{{clientName}}</strong> em {{linkedAt}}.</p>
          <p>Agora você pode acessar os serviços usando suas credenciais habituais.</p>
          <br>
          <p>Atenciosamente,<br>Equipe Coinage</p>
          <hr>
          <small>© {{year}} Coinage. Todos os direitos reservados.</small>
        `,
        textContent: 'Olá {{userName}}! Sua conta foi vinculada com sucesso ao {{clientName}} em {{linkedAt}}.'
      },
      '2fa_code': {
        name: '2fa_code',
        subject: 'Seu código de verificação',
        htmlContent: `
          <h2>Código de Verificação</h2>
          <p>Olá {{userName}},</p>
          <p>Seu código de verificação é: <strong style="font-size: 24px; color: #007bff;">{{code}}</strong></p>
          <p>Este código expira em {{expiresIn}}.</p>
          <p>Se você não solicitou este código, ignore este email.</p>
          <br>
          <p>Atenciosamente,<br>Equipe Coinage</p>
          <hr>
          <small>© {{year}} Coinage. Todos os direitos reservados.</small>
        `,
        textContent: 'Olá {{userName}}, seu código de verificação é: {{code}}. Expira em {{expiresIn}}.'
      },
      'password_reset': {
        name: 'password_reset',
        subject: 'Redefinição de senha',
        htmlContent: `
          <h2>Redefinição de Senha</h2>
          <p>Olá {{userName}},</p>
          <p>Recebemos uma solicitação para redefinir sua senha.</p>
          <p>Clique no link abaixo para criar uma nova senha:</p>
          <p><a href="{{resetLink}}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Redefinir Senha</a></p>
          <p>Este link expira em {{expiresIn}}.</p>
          <p>Se você não solicitou esta redefinição, ignore este email.</p>
          <br>
          <p>Atenciosamente,<br>Equipe Coinage</p>
          <hr>
          <small>© {{year}} Coinage. Todos os direitos reservados.</small>
        `,
        textContent: 'Olá {{userName}}, clique neste link para redefinir sua senha: {{resetLink}} (expira em {{expiresIn}})'
      }
    };

    const templateData = templates[templateName];
    if (!templateData) {
      throw new Error(`Template '${templateName}' não encontrado`);
    }

    return await this.prisma.emailTemplate.create({
      data: templateData
    });
  }

  /**
   * Substitui variáveis no template
   * @param {string} content - Conteúdo do template
   * @param {Object} variables - Variáveis para substituição
   * @returns {string} Conteúdo com variáveis substituídas
   */
  replaceTemplateVariables(content, variables) {
    let result = content;
    
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, variables[key]);
    });

    return result;
  }

  /**
   * Obtém estatísticas de emails
   * @param {Object} filters - Filtros para as estatísticas
   * @returns {Promise<Object>} Estatísticas
   */
  async getEmailStats(filters = {}) {
    try {
      if (!this.prisma) await this.init();

      const { startDate, endDate, templateId } = filters;
      const where = {};

      if (startDate) where.createdAt = { gte: new Date(startDate) };
      if (endDate) where.createdAt = { ...where.createdAt, lte: new Date(endDate) };
      if (templateId) where.templateId = templateId;

      const [
        totalSent,
        delivered,
        opened,
        clicked,
        bounced,
        failed
      ] = await Promise.all([
        this.prisma.emailLog.count({ where: { ...where, status: 'sent' } }),
        this.prisma.emailLog.count({ where: { ...where, deliveredAt: { not: null } } }),
        this.prisma.emailLog.count({ where: { ...where, openedAt: { not: null } } }),
        this.prisma.emailLog.count({ where: { ...where, clickedAt: { not: null } } }),
        this.prisma.emailLog.count({ where: { ...where, bounced: true } }),
        this.prisma.emailLog.count({ where: { ...where, status: 'failed' } })
      ]);

      return {
        totalSent,
        delivered,
        opened,
        clicked,
        bounced,
        failed,
        deliveryRate: totalSent > 0 ? (delivered / totalSent * 100).toFixed(2) : 0,
        openRate: delivered > 0 ? (opened / delivered * 100).toFixed(2) : 0,
        clickRate: delivered > 0 ? (clicked / delivered * 100).toFixed(2) : 0,
        bounceRate: totalSent > 0 ? (bounced / totalSent * 100).toFixed(2) : 0
      };
    } catch (error) {
      console.error('❌ Erro ao obter estatísticas de email:', error);
      throw error;
    }
  }
}

module.exports = new EmailService();