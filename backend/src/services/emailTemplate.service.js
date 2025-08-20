/**
 * Serviço de Templates de Email
 * Gerencia templates dinâmicos e personalizados por empresa
 */
class EmailTemplateService {
  constructor() {
    this.defaultTemplates = {
      // Templates de autenticação
      welcome: {
        subject: 'Bem-vindo ao {{companyName}}!',
        category: 'auth',
        variables: ['userName', 'companyName', 'loginUrl', 'supportEmail']
      },
      
      email_confirmation: {
        subject: 'Confirme seu email - {{companyName}}',
        category: 'auth',
        variables: ['userName', 'confirmationUrl', 'expiresIn', 'companyName']
      },
      
      password_reset: {
        subject: 'Redefinir senha - {{companyName}}',
        category: 'auth',
        variables: ['userName', 'resetUrl', 'expiresIn', 'companyName', 'ipAddress']
      },
      
      login_alert: {
        subject: 'Novo acesso detectado - {{companyName}}',
        category: 'security',
        variables: ['userName', 'loginTime', 'ipAddress', 'device', 'location', 'companyName']
      },
      
      // Templates PIX/Financeiro
      deposit_confirmed: {
        subject: 'Depósito confirmado - {{amount}} {{currency}}',
        category: 'financial',
        variables: ['userName', 'amount', 'currency', 'txHash', 'blockNumber', 'explorerUrl', 'pixEndToEndId', 'companyName']
      },
      
      deposit_failed: {
        subject: 'Falha no depósito - {{companyName}}',
        category: 'financial',
        variables: ['userName', 'amount', 'currency', 'error', 'supportEmail', 'companyName']
      },
      
      withdrawal_completed: {
        subject: 'Saque processado - {{amount}} {{currency}}',
        category: 'financial',
        variables: ['userName', 'amount', 'currency', 'pixKey', 'burnTxHash', 'pixTransactionId', 'processedAt', 'companyName']
      },
      
      withdrawal_failed: {
        subject: 'Falha no saque - {{companyName}}',
        category: 'financial',
        variables: ['userName', 'amount', 'currency', 'pixKey', 'error', 'supportEmail', 'companyName']
      },
      
      // Templates blockchain
      transaction_confirmed: {
        subject: 'Transação confirmada - {{companyName}}',
        category: 'blockchain',
        variables: ['userName', 'operation', 'txHash', 'blockNumber', 'network', 'explorerUrl', 'companyName']
      },
      
      transaction_failed: {
        subject: 'Falha na transação - {{companyName}}',
        category: 'blockchain',
        variables: ['userName', 'operation', 'error', 'supportEmail', 'companyName']
      },
      
      // Templates administrativos
      account_suspended: {
        subject: 'Conta suspensa - {{companyName}}',
        category: 'admin',
        variables: ['userName', 'reason', 'suspendedAt', 'contactEmail', 'companyName']
      },
      
      account_verified: {
        subject: 'Conta verificada - {{companyName}}',
        category: 'admin',
        variables: ['userName', 'verifiedAt', 'newLimits', 'companyName']
      },
      
      // Templates de sistema
      maintenance_notice: {
        subject: 'Manutenção programada - {{companyName}}',
        category: 'system',
        variables: ['maintenanceStart', 'maintenanceEnd', 'affectedServices', 'companyName']
      },
      
      system_alert: {
        subject: 'Alerta do sistema - {{companyName}}',
        category: 'system',
        variables: ['alertType', 'message', 'timestamp', 'companyName']
      },

      // Templates KYC
      kyc_approved: {
        subject: 'KYC aprovado - {{companyName}}',
        category: 'kyc',
        variables: ['userName', 'approvedAt', 'newLimits', 'nextSteps', 'companyName']
      },

      kyc_rejected: {
        subject: 'KYC rejeitado - {{companyName}}',
        category: 'kyc', 
        variables: ['userName', 'rejectedAt', 'reason', 'nextSteps', 'supportEmail', 'companyName']
      },

      // Templates de relatórios
      weekly_summary: {
        subject: 'Resumo semanal - {{companyName}}',
        category: 'reports',
        variables: ['userName', 'weekStart', 'weekEnd', 'totalDeposits', 'totalWithdrawals', 'balance', 'transactionCount', 'companyName']
      },

      monthly_statement: {
        subject: 'Extrato mensal - {{companyName}}',
        category: 'reports',
        variables: ['userName', 'monthYear', 'openingBalance', 'closingBalance', 'totalDeposits', 'totalWithdrawals', 'fees', 'transactionCount', 'companyName']
      },

      // Templates de transferência
      transfer_completed: {
        subject: 'Transferência completada - {{amount}} {{currency}}',
        category: 'financial',
        variables: ['userName', 'amount', 'currency', 'recipient', 'txHash', 'completedAt', 'companyName']
      },

      transfer_failed: {
        subject: 'Falha na transferência - {{companyName}}',
        category: 'financial',
        variables: ['userName', 'amount', 'currency', 'recipient', 'error', 'failedAt', 'supportEmail', 'companyName']
      },

      // Templates de exchange
      exchange_completed: {
        subject: 'Troca completada - {{fromAmount}} {{fromCurrency}} → {{toAmount}} {{toCurrency}}',
        category: 'financial',
        variables: ['userName', 'fromAmount', 'fromCurrency', 'toAmount', 'toCurrency', 'rate', 'txHash', 'completedAt', 'companyName']
      },

      exchange_failed: {
        subject: 'Falha na troca - {{companyName}}',
        category: 'financial',
        variables: ['userName', 'fromAmount', 'fromCurrency', 'toCurrency', 'error', 'failedAt', 'supportEmail', 'companyName']
      }
    };
  }

  /**
   * Obtém template com dados preenchidos
   */
  async getTemplate(templateName, data, companyId = null) {
    try {
      // 1. Buscar template customizado da empresa
      let template = await this.getCompanyTemplate(templateName, companyId);
      
      // 2. Fallback para template padrão
      if (!template) {
        template = this.getDefaultTemplate(templateName);
      }
      
      if (!template) {
        throw new Error(`Template not found: ${templateName}`);
      }
      
      // 3. Processar template com dados
      return this.processTemplate(template, data);
      
    } catch (error) {
      console.error(`Error getting template ${templateName}:`, error);
      throw error;
    }
  }

  /**
   * Busca template personalizado da empresa
   */
  async getCompanyTemplate(templateName, companyId) {
    if (!companyId) return null;
    
    try {
      // TODO: Implementar busca no banco de dados
      // const prisma = require('../config/prisma').initialize();
      // const template = await prisma.emailTemplate.findFirst({
      //   where: {
      //     name: templateName,
      //     companyId: companyId,
      //     active: true
      //   }
      // });
      // return template;
      
      return null; // Por enquanto, usar apenas templates padrão
      
    } catch (error) {
      console.error('Error fetching company template:', error);
      return null;
    }
  }

  /**
   * Obtém template padrão
   */
  getDefaultTemplate(templateName) {
    const templateConfig = this.defaultTemplates[templateName];
    if (!templateConfig) return null;
    
    return {
      name: templateName,
      subject: templateConfig.subject,
      html: this.getDefaultHtmlTemplate(templateName),
      text: this.getDefaultTextTemplate(templateName),
      category: templateConfig.category,
      variables: templateConfig.variables
    };
  }

  /**
   * Processa template substituindo variáveis
   */
  processTemplate(template, data) {
    // Adicionar dados padrão
    const processedData = {
      ...data,
      currentYear: new Date().getFullYear(),
      timestamp: new Date().toISOString(),
      companyName: data.companyName || 'Coinage',
      supportEmail: data.supportEmail || process.env.SUPPORT_EMAIL || 'suporte@coinage.com'
    };
    
    return {
      subject: this.replaceVariables(template.subject, processedData),
      html: this.replaceVariables(template.html, processedData),
      text: this.replaceVariables(template.text, processedData),
      category: template.category
    };
  }

  /**
   * Substitui variáveis no template usando {{variable}}
   */
  replaceVariables(content, data) {
    if (!content) return '';
    
    return content.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
      return data[variable] !== undefined ? data[variable] : match;
    });
  }

  /**
   * Templates HTML padrão
   */
  getDefaultHtmlTemplate(templateName) {
    const baseHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{subject}}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px; }
        .highlight { background: #e3f2fd; padding: 15px; border-radius: 6px; margin: 20px 0; }
        .success { background: #e8f5e8; border-left: 4px solid #4caf50; }
        .error { background: #ffeef0; border-left: 4px solid #f44336; }
        .warning { background: #fff8e1; border-left: 4px solid #ff9800; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{{companyName}}</h1>
        </div>
        <div class="content">
            {{content}}
        </div>
        <div class="footer">
            <p>© {{currentYear}} {{companyName}}. Todos os direitos reservados.</p>
            <p>Dúvidas? Entre em contato: <a href="mailto:{{supportEmail}}">{{supportEmail}}</a></p>
        </div>
    </div>
</body>
</html>`;

    const contentTemplates = {
      welcome: `
        <h2>Bem-vindo, {{userName}}! 🎉</h2>
        <p>É um prazer tê-lo conosco! Sua conta foi criada com sucesso e você já pode começar a usar nossos serviços.</p>
        <a href="{{loginUrl}}" class="button">Acessar Conta</a>
        <div class="highlight">
          <p><strong>Próximos passos:</strong></p>
          <ul>
            <li>Complete seu perfil</li>
            <li>Verifique sua identidade</li>
            <li>Explore nossos recursos</li>
          </ul>
        </div>`,

      email_confirmation: `
        <h2>Confirme seu email 📧</h2>
        <p>Olá, {{userName}}!</p>
        <p>Para ativar sua conta, clique no botão abaixo para confirmar seu endereço de email:</p>
        <a href="{{confirmationUrl}}" class="button">Confirmar Email</a>
        <div class="highlight warning">
          <p><strong>⚠️ Importante:</strong> Este link expira em {{expiresIn}}.</p>
        </div>`,

      password_reset: `
        <h2>Redefinir senha 🔒</h2>
        <p>Olá, {{userName}}!</p>
        <p>Recebemos uma solicitação para redefinir sua senha. Se foi você, clique no botão abaixo:</p>
        <a href="{{resetUrl}}" class="button">Redefinir Senha</a>
        <div class="highlight warning">
          <p><strong>Informações do acesso:</strong></p>
          <ul>
            <li>IP: {{ipAddress}}</li>
            <li>Expira em: {{expiresIn}}</li>
          </ul>
          <p>Se não foi você, ignore este email.</p>
        </div>`,

      deposit_confirmed: `
        <h2>Depósito confirmado! ✅</h2>
        <p>Olá, {{userName}}!</p>
        <p>Seu depósito foi processado com sucesso:</p>
        <div class="highlight success">
          <p><strong>Detalhes do depósito:</strong></p>
          <ul>
            <li>Valor: {{amount}} {{currency}}</li>
            <li>PIX E2E ID: {{pixEndToEndId}}</li>
            <li>Hash da transação: <a href="{{explorerUrl}}" target="_blank">{{txHash}}</a></li>
            <li>Bloco: {{blockNumber}}</li>
          </ul>
        </div>
        <p>Os tokens já estão disponíveis em sua carteira!</p>`,

      deposit_failed: `
        <h2>Falha no depósito ❌</h2>
        <p>Olá, {{userName}}!</p>
        <p>Infelizmente houve um problema com seu depósito de {{amount}} {{currency}}.</p>
        <div class="highlight error">
          <p><strong>Erro:</strong> {{error}}</p>
        </div>
        <p>Nossa equipe foi notificada e está investigando. Entre em contato conosco se precisar de ajuda:</p>
        <a href="mailto:{{supportEmail}}" class="button">Contatar Suporte</a>`,

      withdrawal_completed: `
        <h2>Saque processado! 💸</h2>
        <p>Olá, {{userName}}!</p>
        <p>Seu saque foi processado com sucesso:</p>
        <div class="highlight success">
          <p><strong>Detalhes do saque:</strong></p>
          <ul>
            <li>Valor: {{amount}} {{currency}}</li>
            <li>Chave PIX: {{pixKey}}</li>
            <li>Hash do burn: <a href="{{explorerUrl}}" target="_blank">{{burnTxHash}}</a></li>
            <li>ID PIX: {{pixTransactionId}}</li>
            <li>Processado em: {{processedAt}}</li>
          </ul>
        </div>
        <p>O valor deve chegar em sua conta em alguns minutos.</p>`,

      withdrawal_failed: `
        <h2>Falha no saque ❌</h2>
        <p>Olá, {{userName}}!</p>
        <p>Houve um problema com seu saque de {{amount}} {{currency}} para {{pixKey}}.</p>
        <div class="highlight error">
          <p><strong>Erro:</strong> {{error}}</p>
        </div>
        <p>Seus tokens não foram debitados. Tente novamente ou entre em contato conosco:</p>
        <a href="mailto:{{supportEmail}}" class="button">Contatar Suporte</a>`
    };

    const content = contentTemplates[templateName] || '<p>Template não encontrado.</p>';
    return baseHtml.replace('{{content}}', content);
  }

  /**
   * Templates de texto simples
   */
  getDefaultTextTemplate(templateName) {
    const templates = {
      welcome: `
Bem-vindo ao {{companyName}}, {{userName}}!

É um prazer tê-lo conosco! Sua conta foi criada com sucesso.

Acesse sua conta: {{loginUrl}}

Dúvidas? Entre em contato: {{supportEmail}}

{{companyName}} - {{currentYear}}`,

      email_confirmation: `
Confirme seu email - {{companyName}}

Olá, {{userName}}!

Para ativar sua conta, acesse o link abaixo:
{{confirmationUrl}}

Este link expira em {{expiresIn}}.

{{companyName}} - {{currentYear}}`,

      deposit_confirmed: `
Depósito confirmado - {{companyName}}

Olá, {{userName}}!

Seu depósito foi processado:
- Valor: {{amount}} {{currency}}
- PIX E2E: {{pixEndToEndId}}
- Hash: {{txHash}}
- Bloco: {{blockNumber}}

Os tokens estão disponíveis em sua carteira.

{{companyName}} - {{currentYear}}`,

      withdrawal_completed: `
Saque processado - {{companyName}}

Olá, {{userName}}!

Seu saque foi processado:
- Valor: {{amount}} {{currency}}
- PIX: {{pixKey}}
- Hash burn: {{burnTxHash}}
- ID PIX: {{pixTransactionId}}

O valor deve chegar em alguns minutos.

{{companyName}} - {{currentYear}}`
    };

    return templates[templateName] || `Conteúdo do email - {{companyName}}\n\n{{userName}}, este é um email automático.\n\nDúvidas: {{supportEmail}}`;
  }

  /**
   * Lista todos os templates disponíveis
   */
  getAvailableTemplates() {
    return Object.keys(this.defaultTemplates).map(name => ({
      name,
      subject: this.defaultTemplates[name].subject,
      category: this.defaultTemplates[name].category,
      variables: this.defaultTemplates[name].variables
    }));
  }

  /**
   * Valida se os dados necessários estão presentes
   */
  validateTemplateData(templateName, data) {
    const template = this.defaultTemplates[templateName];
    if (!template) {
      return { valid: false, missing: [], message: 'Template não encontrado' };
    }

    const missing = template.variables.filter(variable => 
      data[variable] === undefined || data[variable] === null
    );

    return {
      valid: missing.length === 0,
      missing,
      message: missing.length > 0 ? `Variáveis faltando: ${missing.join(', ')}` : 'Válido'
    };
  }
}

module.exports = new EmailTemplateService();