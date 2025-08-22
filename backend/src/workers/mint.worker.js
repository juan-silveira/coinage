const rabbitmqConfig = require('../config/rabbitmq');
const mintService = require('../services/mint.service');
const MintTransactionService = require('../services/mintTransaction.service');

class MintWorker {
  constructor() {
    this.mintTransactionService = new MintTransactionService();
    this.isRunning = false;
    this.consumerTags = [];
  }

  /**
   * Iniciar processamento de mensagens
   */
  async start() {
    try {
      if (this.isRunning) {
        console.log('⚠️ MintWorker já está rodando');
        return;
      }

      console.log('🚀 MintWorker: Starting...');

      // Inicializar RabbitMQ se necessário
      if (!rabbitmqConfig.isConnected) {
        await rabbitmqConfig.initialize();
      }

      // Inicializar mint service
      await mintService.initialize();

      // Configurar consumidores
      await this.setupConsumers();

      this.isRunning = true;
      console.log('✅ MintWorker: Started successfully');

    } catch (error) {
      console.error('❌ MintWorker: Failed to start:', error);
      this.isRunning = false;
      throw error;
    }
  }

  /**
   * Configura consumidores
   */
  async setupConsumers() {
    // Criar fila de mint se não existir
    await rabbitmqConfig.channel.assertQueue('blockchain.mint', {
      durable: true
    });

    // Consumidor para processamento de mint
    await rabbitmqConfig.consumeQueue(
      'blockchain.mint',
      this.handleMintProcessing.bind(this),
      { prefetch: 1 } // Processar um mint por vez
    );

    console.log('👂 MintWorker: Consumer configured for blockchain.mint');
  }

  /**
   * Processa mensagem de mint
   */
  async handleMintProcessing(message, messageInfo) {
    const maxRetries = 5;
    const retryDelay = 10000; // 10 segundos entre tentativas
    
    try {
      console.log(`🏭 Processing mint: ${message.transactionId}`);
      
      // Adicionar contador de retry à mensagem
      message.currentRetry = (message.currentRetry || 0) + 1;
      
      // Executar mint na blockchain
      const mintResult = await mintService.mintCBRL(
        message.recipientAddress,
        message.amount.toString(),
        message.network || 'testnet',
        message.transactionId
      );

      if (mintResult.success) {
        // Atualizar transação com resultado positivo
        await this.mintTransactionService.updateMintResult(message.transactionId, {
          success: true,
          transactionHash: mintResult.transactionHash,
          blockNumber: mintResult.blockNumber,
          gasUsed: mintResult.gasUsed
        });

        console.log(`✅ Mint processed successfully: ${message.transactionId}`);
        
        // Acknowledge mensagem como processada
        await rabbitmqConfig.channel.ack(messageInfo);

      } else {
        throw new Error(mintResult.error || 'Mint failed');
      }
      
    } catch (error) {
      console.error(`❌ Error handling mint (attempt ${message.currentRetry}/${maxRetries}):`, error);
      
      if (message.currentRetry < maxRetries) {
        console.log(`⏳ Reagendando mint tentativa ${message.currentRetry + 1}/${maxRetries} em ${retryDelay/1000}s`);
        
        // Reenviar mensagem para a fila com delay
        setTimeout(async () => {
          await rabbitmqConfig.publishMessage('blockchain.exchange', 'transaction.mint', message);
        }, retryDelay);
        
        // Acknowledge a mensagem atual para não bloquear a fila
        await rabbitmqConfig.channel.ack(messageInfo);
      } else {
        console.error(`❌ Máximo de tentativas excedido para mint ${message.transactionId}`);
        
        // Marcar transação como falha
        await this.mintTransactionService.updateMintResult(message.transactionId, {
          success: false,
          error: error.message
        });
        
        // Enviar para DLQ
        await rabbitmqConfig.channel.nack(messageInfo, false, false);
      }
    }
  }

  /**
   * Parar worker
   */
  async stop() {
    try {
      console.log('🛑 MintWorker: Stopping...');

      // Cancelar consumidores
      for (const consumerTag of this.consumerTags) {
        try {
          await rabbitmqConfig.channel.cancel(consumerTag);
        } catch (error) {
          console.warn(`Warning: Failed to cancel consumer ${consumerTag}:`, error.message);
        }
      }

      this.isRunning = false;
      
      console.log('✅ MintWorker: Stopped');
      
    } catch (error) {
      console.error('❌ MintWorker: Error stopping:', error);
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    return {
      worker: 'MintWorker',
      status: this.isRunning ? 'running' : 'stopped',
      consumers: this.consumerTags.length,
      timestamp: new Date().toISOString()
    };
  }
}

// Instância singleton
const mintWorker = new MintWorker();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('📡 SIGTERM received, shutting down gracefully');
  await mintWorker.stop();
  await rabbitmqConfig.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('📡 SIGINT received, shutting down gracefully');
  await mintWorker.stop();
  await rabbitmqConfig.close();
  process.exit(0);
});

// Auto-start se executado diretamente
if (require.main === module) {
  mintWorker.start().catch(error => {
    console.error('❌ Failed to start MintWorker:', error);
    process.exit(1);
  });
}

module.exports = mintWorker;