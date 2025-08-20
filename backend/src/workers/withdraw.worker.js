const rabbitmqConfig = require('../config/rabbitmq');
const blockchainQueueService = require('../services/blockchainQueue.service');

/**
 * Worker para processar saques PIX
 */
class WithdrawWorker {
  constructor() {
    this.isRunning = false;
    this.consumerTags = [];
  }

  /**
   * Inicia o worker
   */
  async start() {
    try {
      console.log('🚀 WithdrawWorker: Starting...');

      // Inicializar RabbitMQ se necessário
      if (!rabbitmqConfig.isConnected) {
        await rabbitmqConfig.initialize();
      }

      // Inicializar serviço de fila
      await blockchainQueueService.initialize();

      // Configurar consumidores
      await this.setupConsumers();

      this.isRunning = true;
      console.log('✅ WithdrawWorker: Started successfully');

    } catch (error) {
      console.error('❌ WithdrawWorker: Failed to start:', error);
      throw error;
    }
  }

  /**
   * Configura consumidores
   */
  async setupConsumers() {
    // Consumidor para processamento de saques
    await rabbitmqConfig.consumeQueue(
      rabbitmqConfig.queues.WITHDRAWALS_PROCESSING.name,
      this.handleWithdrawalProcessing.bind(this),
      { prefetch: 2 }
    );

    console.log('👂 WithdrawWorker: Consumer configured');
  }

  /**
   * Processa mensagem de saque
   */
  async handleWithdrawalProcessing(message, messageInfo) {
    try {
      console.log(`🔄 Processing withdrawal: ${message.withdrawalId}`);
      
      await this.processWithdrawal(message, messageInfo);
      
      console.log(`✅ Withdrawal processed: ${message.withdrawalId}`);

    } catch (error) {
      console.error(`❌ Error handling withdrawal:`, error);
      throw error;
    }
  }

  /**
   * Processa saque específico
   */
  async processWithdrawal(message, messageInfo) {
    const { withdrawalId, userId, amount, pixKey, blockchainAddress, userEmail } = message;
    
    try {
      // Usar o serviço integrado de processamento de saque
      const result = await blockchainQueueService.processWithdrawal({
        withdrawalId,
        userId,
        amount,
        pixKey,
        blockchainAddress
      });

      // Log da ação do usuário
      if (userId) {
        const userActionsService = require('../services/userActions.service');
        await userActionsService.logFinancial(userId, 'withdrawal_completed', {}, {
          status: 'success',
          details: {
            amount,
            pixKey: this.maskPixKey(pixKey),
            burnTxHash: result.burnTxHash,
            pixTransactionId: result.pixTransactionId,
            pixEndToEndId: result.pixEndToEndId
          },
          relatedId: withdrawalId,
          relatedType: 'withdrawal'
        });
      }

      // Notificar usuário por email
      await blockchainQueueService.queueEmailNotification({
        to: userEmail,
        subject: 'Saque Processado - cBRL',
        template: 'withdrawal_completed',
        data: {
          amount,
          currency: 'cBRL',
          pixKey: this.maskPixKey(pixKey),
          burnTxHash: result.burnTxHash,
          pixTransactionId: result.pixTransactionId,
          pixEndToEndId: result.pixEndToEndId,
          processedAt: result.processedAt
        },
        userId
      });

      // Chamar webhook se fornecido
      if (message.webhookUrl) {
        await blockchainQueueService.queueWebhook({
          url: message.webhookUrl,
          event: 'withdrawal_completed',
          data: {
            withdrawalId,
            amount,
            currency: 'cBRL',
            burnTxHash: result.burnTxHash,
            pixTransactionId: result.pixTransactionId,
            pixEndToEndId: result.pixEndToEndId,
            status: 'completed'
          },
          userId
        });
      }

      console.log(`✅ Withdrawal processed successfully: ${withdrawalId} - PIX: ${result.pixTransactionId}`);

    } catch (error) {
      console.error(`❌ Error processing withdrawal ${withdrawalId}:`, error);
      
      // Log da falha
      if (userId) {
        const userActionsService = require('../services/userActions.service');
        await userActionsService.logFinancial(userId, 'withdrawal_failed', {}, {
          status: 'failed',
          details: {
            amount,
            pixKey: this.maskPixKey(pixKey),
            error: error.message
          },
          relatedId: withdrawalId,
          relatedType: 'withdrawal'
        });
      }
      
      // Notificar falha
      await blockchainQueueService.queueEmailNotification({
        to: userEmail || message.pixData?.userEmail,
        subject: 'Falha no Saque - cBRL',
        template: 'withdrawal_failed',
        data: {
          amount,
          currency: 'cBRL',
          pixKey: this.maskPixKey(pixKey),
          error: error.message,
          supportEmail: process.env.SUPPORT_EMAIL || 'suporte@coinage.com'
        },
        userId
      });

      throw error;
    }
  }


  /**
   * Mascara a chave PIX para logs
   */
  maskPixKey(pixKey) {
    if (!pixKey) return '';
    
    if (pixKey.includes('@')) {
      // Email
      const [username, domain] = pixKey.split('@');
      return `${username.substring(0, 2)}***@${domain}`;
    } else if (pixKey.length === 11) {
      // CPF
      return `***${pixKey.slice(-3)}`;
    } else if (pixKey.length === 14) {
      // CNPJ
      return `***${pixKey.slice(-4)}`;
    } else {
      // Telefone ou aleatória
      return `***${pixKey.slice(-4)}`;
    }
  }

  /**
   * Para o worker
   */
  async stop() {
    try {
      console.log('🛑 WithdrawWorker: Stopping...');

      // Cancelar consumidores
      for (const consumerTag of this.consumerTags) {
        try {
          await rabbitmqConfig.channel.cancel(consumerTag);
        } catch (error) {
          console.warn(`Warning: Failed to cancel consumer ${consumerTag}:`, error.message);
        }
      }

      this.isRunning = false;
      console.log('✅ WithdrawWorker: Stopped');

    } catch (error) {
      console.error('❌ WithdrawWorker: Error stopping:', error);
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    return {
      worker: 'WithdrawWorker',
      status: this.isRunning ? 'running' : 'stopped',
      consumers: this.consumerTags.length,
      timestamp: new Date().toISOString()
    };
  }
}

// Instância singleton
const withdrawWorker = new WithdrawWorker();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('📡 SIGTERM received, shutting down gracefully');
  await withdrawWorker.stop();
  await rabbitmqConfig.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('📡 SIGINT received, shutting down gracefully');
  await withdrawWorker.stop();
  await rabbitmqConfig.close();
  process.exit(0);
});

// Auto-start se executado diretamente
if (require.main === module) {
  withdrawWorker.start().catch(error => {
    console.error('❌ Failed to start WithdrawWorker:', error);
    process.exit(1);
  });
}

module.exports = withdrawWorker;