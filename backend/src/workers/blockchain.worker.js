const rabbitmqConfig = require('../config/rabbitmq');
const blockchainQueueService = require('../services/blockchainQueue.service');

/**
 * Worker para processar transações blockchain
 */
class BlockchainWorker {
  constructor() {
    this.isRunning = false;
    this.consumerTags = [];
  }

  /**
   * Inicia o worker
   */
  async start() {
    try {
      console.log('🚀 BlockchainWorker: Starting...');

      // Inicializar RabbitMQ se necessário
      if (!rabbitmqConfig.isConnected) {
        await rabbitmqConfig.initialize();
      }

      // Inicializar serviço de fila
      await blockchainQueueService.initialize();

      // Configurar consumidores para as diferentes filas
      await this.setupConsumers();

      this.isRunning = true;
      console.log('✅ BlockchainWorker: Started successfully');

    } catch (error) {
      console.error('❌ BlockchainWorker: Failed to start:', error);
      throw error;
    }
  }

  /**
   * Configura todos os consumidores
   */
  async setupConsumers() {
    // Consumidor para transações blockchain
    await rabbitmqConfig.consumeQueue(
      rabbitmqConfig.queues.BLOCKCHAIN_TRANSACTIONS.name,
      this.handleBlockchainTransaction.bind(this),
      { prefetch: 5 }
    );

    // Consumidor para operações de contrato
    await rabbitmqConfig.consumeQueue(
      rabbitmqConfig.queues.CONTRACT_OPERATIONS.name,
      this.handleContractOperation.bind(this),
      { prefetch: 3 }
    );

    console.log('👂 BlockchainWorker: All consumers configured');
  }

  /**
   * Processa mensagens de transação blockchain
   */
  async handleBlockchainTransaction(message, messageInfo) {
    try {
      console.log(`🔄 Processing blockchain transaction: ${message.type}`);
      
      await blockchainQueueService.processBlockchainTransaction(message, messageInfo);
      
      console.log(`✅ Blockchain transaction processed: ${message.transactionId}`);

    } catch (error) {
      console.error(`❌ Error handling blockchain transaction:`, error);
      throw error; // Re-throw para trigger retry mechanism
    }
  }

  /**
   * Processa mensagens de operação de contrato
   */
  async handleContractOperation(message, messageInfo) {
    try {
      console.log(`🔄 Processing contract operation: ${message.functionName}`);
      
      // Implementar processamento de operação de contrato
      await this.processContractOperation(message, messageInfo);
      
      console.log(`✅ Contract operation processed: ${message.operationId}`);

    } catch (error) {
      console.error(`❌ Error handling contract operation:`, error);
      throw error;
    }
  }

  /**
   * Processa operação de contrato específica
   */
  async processContractOperation(message, messageInfo) {
    const { operationId, contractAddress, contractType, functionName, functionParams, fromAddress, network, userId } = message;
    
    try {
      // Obter ABI do contrato
      const contractService = require('../services/contract.service');
      const abi = await contractService.getContractABI(contractType);
      
      // Executar função do contrato
      const blockchainService = require('../services/blockchain.service');
      const result = await blockchainService.callContractFunction(
        contractAddress,
        abi,
        functionName,
        functionParams,
        {
          from: fromAddress,
          network: network
        }
      );

      // Log da ação do usuário
      if (userId) {
        const userActionsService = require('../services/userActions.service');
        await userActionsService.logBlockchain(userId, 'contract_interaction', {}, {
          status: result.success ? 'success' : 'failed',
          details: {
            contractAddress,
            contractType,
            functionName,
            txHash: result.txHash,
            network,
            gasUsed: result.gasUsed
          },
          relatedId: operationId,
          relatedType: 'contract_operation'
        });
      }

      // Chamar webhook se fornecido
      if (message.webhookUrl) {
        await blockchainQueueService.queueWebhook({
          url: message.webhookUrl,
          event: result.success ? 'contract_operation_success' : 'contract_operation_failed',
          data: {
            operationId,
            contractAddress,
            functionName,
            result: result.success ? result.data : null,
            txHash: result.txHash,
            error: result.error
          },
          userId
        });
      }

      return result;

    } catch (error) {
      console.error(`❌ Error processing contract operation ${operationId}:`, error);
      throw error;
    }
  }

  /**
   * Para o worker
   */
  async stop() {
    try {
      console.log('🛑 BlockchainWorker: Stopping...');

      // Cancelar consumidores
      for (const consumerTag of this.consumerTags) {
        try {
          await rabbitmqConfig.channel.cancel(consumerTag);
        } catch (error) {
          console.warn(`Warning: Failed to cancel consumer ${consumerTag}:`, error.message);
        }
      }

      this.isRunning = false;
      console.log('✅ BlockchainWorker: Stopped');

    } catch (error) {
      console.error('❌ BlockchainWorker: Error stopping:', error);
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    return {
      worker: 'BlockchainWorker',
      status: this.isRunning ? 'running' : 'stopped',
      consumers: this.consumerTags.length,
      timestamp: new Date().toISOString()
    };
  }
}

// Instância singleton
const blockchainWorker = new BlockchainWorker();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('📡 SIGTERM received, shutting down gracefully');
  await blockchainWorker.stop();
  await rabbitmqConfig.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('📡 SIGINT received, shutting down gracefully');
  await blockchainWorker.stop();
  await rabbitmqConfig.close();
  process.exit(0);
});

// Auto-start se executado diretamente
if (require.main === module) {
  blockchainWorker.start().catch(error => {
    console.error('❌ Failed to start BlockchainWorker:', error);
    process.exit(1);
  });
}

module.exports = blockchainWorker;