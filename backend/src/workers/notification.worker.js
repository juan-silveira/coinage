const rabbitmqConfig = require('../config/rabbitmq');

/**
 * Worker para processar notificações (emails e webhooks)
 */
class NotificationWorker {
  constructor() {
    this.isRunning = false;
    this.consumerTags = [];
  }

  /**
   * Inicia o worker
   */
  async start() {
    try {
      console.log('🚀 NotificationWorker: Starting...');

      // Inicializar RabbitMQ se necessário
      if (!rabbitmqConfig.isConnected) {
        await rabbitmqConfig.initialize();
      }

      // Configurar consumidores
      await this.setupConsumers();

      this.isRunning = true;
      console.log('✅ NotificationWorker: Started successfully');

    } catch (error) {
      console.error('❌ NotificationWorker: Failed to start:', error);
      throw error;
    }
  }

  /**
   * Configura consumidores
   */
  async setupConsumers() {
    // Consumidor para emails
    await rabbitmqConfig.consumeQueue(
      rabbitmqConfig.queues.NOTIFICATIONS_EMAIL.name,
      this.handleEmailNotification.bind(this),
      { prefetch: 10 }
    );

    // Consumidor para webhooks
    await rabbitmqConfig.consumeQueue(
      rabbitmqConfig.queues.NOTIFICATIONS_WEBHOOK.name,
      this.handleWebhookNotification.bind(this),
      { prefetch: 5 }
    );

    console.log('👂 NotificationWorker: Consumers configured');
  }

  /**
   * Processa notificação de email
   */
  async handleEmailNotification(message, messageInfo) {
    try {
      console.log(`📧 Processing email notification to: ${message.to}`);
      
      await this.sendEmail(message);
      
      console.log(`✅ Email sent successfully to: ${message.to}`);

    } catch (error) {
      console.error(`❌ Error sending email to ${message.to}:`, error);
      throw error;
    }
  }

  /**
   * Processa notificação de webhook
   */
  async handleWebhookNotification(message, messageInfo) {
    try {
      console.log(`🔗 Processing webhook notification to: ${message.url}`);
      
      await this.sendWebhook(message);
      
      console.log(`✅ Webhook sent successfully to: ${message.url}`);

    } catch (error) {
      console.error(`❌ Error sending webhook to ${message.url}:`, error);
      throw error;
    }
  }

  /**
   * Envia email usando o provedor configurado
   */
  async sendEmail(emailData) {
    try {
      const { to, subject, template, data, userId } = emailData;
      
      // TODO: Implementar integração com Mandrill/MailerSend
      // Por enquanto, usar mock
      
      console.log(`📧 Sending email: ${template} to ${to}`);
      console.log(`📧 Subject: ${subject}`);
      console.log(`📧 Data:`, data);
      
      // Mock - simular envio
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Simular falha em 2% dos casos
      if (Math.random() < 0.02) {
        throw new Error('Email provider temporarily unavailable');
      }
      
      // Log da ação se for de um usuário específico
      if (userId) {
        const userActionsService = require('../services/userActions.service');
        await userActionsService.logGeneral(userId, 'email_sent', {}, {
          status: 'success',
          details: {
            to,
            template,
            subject
          },
          relatedType: 'email_notification'
        });
      }
      
      console.log(`✅ Email sent successfully: ${template} to ${to}`);
      
    } catch (error) {
      console.error(`❌ Error sending email:`, error);
      
      // Log da falha
      if (emailData.userId) {
        const userActionsService = require('../services/userActions.service');
        await userActionsService.logGeneral(emailData.userId, 'email_failed', {}, {
          status: 'failed',
          details: {
            to: emailData.to,
            template: emailData.template,
            error: error.message
          },
          relatedType: 'email_notification'
        });
      }
      
      throw error;
    }
  }

  /**
   * Envia webhook
   */
  async sendWebhook(webhookData) {
    try {
      const { url, method = 'POST', headers = {}, data, event, userId, maxRetries = 3 } = webhookData;
      
      const axios = require('axios');
      
      const config = {
        method: method.toLowerCase(),
        url,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Coinage-Webhook/1.0',
          'X-Webhook-Event': event,
          'X-Webhook-Timestamp': new Date().toISOString(),
          ...headers
        },
        data,
        timeout: 10000, // 10 segundos
        validateStatus: (status) => status >= 200 && status < 300
      };
      
      console.log(`🔗 Sending ${method} webhook to: ${url}`);
      console.log(`🔗 Event: ${event}`);
      
      const response = await axios(config);
      
      console.log(`✅ Webhook delivered: ${response.status} ${response.statusText}`);
      
      // Log da ação se for de um usuário específico
      if (userId) {
        const userActionsService = require('../services/userActions.service');
        await userActionsService.logGeneral(userId, 'webhook_sent', {}, {
          status: 'success',
          details: {
            url,
            event,
            statusCode: response.status,
            method
          },
          relatedType: 'webhook_notification'
        });
      }
      
      return {
        success: true,
        statusCode: response.status,
        statusText: response.statusText
      };
      
    } catch (error) {
      console.error(`❌ Error sending webhook:`, error.message);
      
      // Log da falha
      if (webhookData.userId) {
        const userActionsService = require('../services/userActions.service');
        await userActionsService.logGeneral(webhookData.userId, 'webhook_failed', {}, {
          status: 'failed',
          details: {
            url: webhookData.url,
            event: webhookData.event,
            error: error.message,
            method: webhookData.method
          },
          relatedType: 'webhook_notification'
        });
      }
      
      throw error;
    }
  }

  /**
   * Para o worker
   */
  async stop() {
    try {
      console.log('🛑 NotificationWorker: Stopping...');

      // Cancelar consumidores
      for (const consumerTag of this.consumerTags) {
        try {
          await rabbitmqConfig.channel.cancel(consumerTag);
        } catch (error) {
          console.warn(`Warning: Failed to cancel consumer ${consumerTag}:`, error.message);
        }
      }

      this.isRunning = false;
      console.log('✅ NotificationWorker: Stopped');

    } catch (error) {
      console.error('❌ NotificationWorker: Error stopping:', error);
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    return {
      worker: 'NotificationWorker',
      status: this.isRunning ? 'running' : 'stopped',
      consumers: this.consumerTags.length,
      timestamp: new Date().toISOString()
    };
  }
}

// Instância singleton
const notificationWorker = new NotificationWorker();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('📡 SIGTERM received, shutting down gracefully');
  await notificationWorker.stop();
  await rabbitmqConfig.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('📡 SIGINT received, shutting down gracefully');
  await notificationWorker.stop();
  await rabbitmqConfig.close();
  process.exit(0);
});

// Auto-start se executado diretamente
if (require.main === module) {
  notificationWorker.start().catch(error => {
    console.error('❌ Failed to start NotificationWorker:', error);
    process.exit(1);
  });
}

module.exports = notificationWorker;