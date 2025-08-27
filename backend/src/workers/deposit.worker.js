const rabbitmqConfig = require('../config/rabbitmq');
const blockchainQueueService = require('../services/blockchainQueue.service');
const DepositService = require('../services/deposit.service');
const mintService = require('../services/mint.service');

class DepositWorker {
  constructor() {
    this.depositService = new DepositService();
    this.isRunning = false;
    this.consumerTags = [];
  }

  /**
   * Iniciar processamento de mensagens
   */
  async start() {
    try {
      if (this.isRunning) {
        console.log('⚠️ DepositWorker já está rodando');
        return;
      }

      console.log('🚀 DepositWorker: Starting...');

      // Inicializar RabbitMQ se necessário
      if (!rabbitmqConfig.isConnected) {
        await rabbitmqConfig.initialize();
      }

      // Inicializar serviços
      await blockchainQueueService.initialize();
      await mintService.initialize();

      // Configurar consumidores
      await this.setupConsumers();

      this.isRunning = true;
      console.log('✅ DepositWorker: Started successfully');

    } catch (error) {
      console.error('❌ DepositWorker: Failed to start:', error);
      this.isRunning = false;
      throw error;
    }
  }

  /**
   * Configura consumidores
   */
  async setupConsumers() {
    // Consumidor para processamento de depósitos
    await rabbitmqConfig.consumeQueue(
      rabbitmqConfig.queues.DEPOSITS_PROCESSING.name,
      this.handleDepositProcessing.bind(this),
      { prefetch: 3 }
    );

    console.log('👂 DepositWorker: Consumer configured');
  }

  /**
   * Processa mensagem de depósito
   */
  async handleDepositProcessing(message, messageInfo) {
    const maxRetries = 10; // Máximo de tentativas
    const retryDelay = 30000; // 30 segundos entre tentativas
    
    try {
      console.log(`🔄 Processing deposit: ${message.depositId || message.transactionId}`);
      
      // Adicionar contador de retry à mensagem
      message.currentRetry = (message.currentRetry || 0) + 1;
      
      // Usar o novo método do blockchainQueueService ou manter compatibilidade
      if (message.type === 'deposit_processing') {
        await blockchainQueueService.processDeposit(message, messageInfo);
      } else {
        // Manter compatibilidade com formato antigo
        await this.depositService.processDepositFromQueue(message);
      }
      
      console.log(`✅ Deposit processed: ${message.depositId || message.transactionId}`);
      
      // Acknowledge mensagem como processada
      await rabbitmqConfig.channel.ack(messageInfo);

    } catch (error) {
      console.error(`❌ Error handling deposit (attempt ${message.currentRetry}/${maxRetries}):`, error);
      
      // Se for erro de PIX não confirmado, reenviar para a fila com delay
      if (error.message.includes('PIX payment not confirmed')) {
        if (message.currentRetry < maxRetries) {
          console.log(`⏳ PIX não confirmado. Reagendando tentativa ${message.currentRetry + 1}/${maxRetries} em ${retryDelay/1000}s`);
          
          // Reenviar mensagem para a fila com delay
          setTimeout(async () => {
            await rabbitmqConfig.publishToQueue(
              rabbitmqConfig.queues.DEPOSITS_PROCESSING.name,
              message
            );
          }, retryDelay);
          
          // Acknowledge a mensagem atual para não bloquear a fila
          await rabbitmqConfig.channel.ack(messageInfo);
        } else {
          console.error(`❌ Máximo de tentativas excedido para depósito ${message.transactionId}`);
          // Enviar para DLQ ou marcar como falha
          await rabbitmqConfig.channel.nack(messageInfo, false, false);
        }
      } else {
        // Para outros erros, usar o mecanismo padrão de retry do RabbitMQ
        await rabbitmqConfig.channel.nack(messageInfo, false, true);
      }
    }
  }

  /**
   * Parar worker
   */
  async stop() {
    try {
      console.log('🛑 DepositWorker: Stopping...');

      // Cancelar consumidores
      for (const consumerTag of this.consumerTags) {
        try {
          await rabbitmqConfig.channel.cancel(consumerTag);
        } catch (error) {
          console.warn(`Warning: Failed to cancel consumer ${consumerTag}:`, error.message);
        }
      }

      this.isRunning = false;
      
      await this.depositService.closeConnections();
      
      console.log('✅ DepositWorker: Stopped');
      
    } catch (error) {
      console.error('❌ DepositWorker: Error stopping:', error);
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    return {
      worker: 'DepositWorker',
      status: this.isRunning ? 'running' : 'stopped',
      consumers: this.consumerTags.length,
      timestamp: new Date().toISOString()
    };
  }
}

// Instância singleton
const depositWorker = new DepositWorker();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('📡 SIGTERM received, shutting down gracefully');
  await depositWorker.stop();
  await rabbitmqConfig.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('📡 SIGINT received, shutting down gracefully');
  await depositWorker.stop();
  await rabbitmqConfig.close();
  process.exit(0);
});

// Auto-start se executado diretamente
if (require.main === module) {
  depositWorker.start().catch(error => {
    console.error('❌ Failed to start DepositWorker:', error);
    process.exit(1);
  });
}

module.exports = depositWorker;









