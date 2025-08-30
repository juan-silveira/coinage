const rabbitmqConfig = require('../config/rabbitmq');
const mintService = require('../services/mint.service');
const depositService = require('../services/deposit.service');

class MintWorker {
  constructor() {
    this.depositService = depositService; // Usar instância singleton
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
      
      // VERIFICAR SE JÁ FOI PROCESSADO (IDEMPOTÊNCIA)
      const existingTransaction = await this.depositService.getDepositStatus(message.transactionId);
      if (existingTransaction && existingTransaction.blockchainStatus === 'confirmed') {
        console.log(`⚠️ Mint já foi processado para ${message.transactionId}, ignorando duplicata`);
        return; // Sair sem erro para acknowledgment automático
      }
      
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
        // Atualizar transação de depósito com resultado blockchain
        await this.depositService.confirmBlockchainMint(message.transactionId, {
          txHash: mintResult.transactionHash,
          blockNumber: mintResult.blockNumber,
          gasUsed: mintResult.gasUsed,
          fromAddress: mintResult.fromAddress || 'admin',
          toAddress: mintResult.recipient
        });

        console.log(`✅ Mint processed successfully: ${message.transactionId}`);
        
        // RabbitMQ config fará o acknowledgment automaticamente após sucesso

      } else {
        throw new Error(mintResult.error || 'Mint failed');
      }
      
    } catch (error) {
      console.error(`❌ Error handling mint (attempt ${message.currentRetry}/${maxRetries}):`, error);
      
      // Deixar o RabbitMQ config gerenciar retry e acknowledgment
      // Se chegou até aqui, significa que houve erro e deve ser re-processado ou enviado para DLQ
      console.error(`❌ Error in mint processing for ${message.transactionId}:`, error.message);
      
      // Marcar transação como falha se necessário
      if (message.currentRetry >= maxRetries) {
        await this.depositService.failBlockchainMint(message.transactionId, error.message);
      }
      
      // Re-throw error para que RabbitMQ config gerencie retry/DLQ
      throw error;
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