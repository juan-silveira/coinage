const blockchainWorker = require('./blockchain.worker');
const depositWorker = require('./deposit.worker');
const withdrawWorker = require('./withdraw.worker');
const notificationWorker = require('./notification.worker');
const rabbitmqConfig = require('../config/rabbitmq');

/**
 * Gerenciador de Workers
 * Coordena todos os workers do sistema
 */
class WorkerManager {
  constructor() {
    this.workers = {
      blockchain: blockchainWorker,
      deposit: depositWorker,
      withdraw: withdrawWorker,
      notification: notificationWorker
    };
    
    this.isRunning = false;
  }

  /**
   * Inicia todos os workers
   */
  async startAll() {
    try {
      console.log('🚀 WorkerManager: Starting all workers...');

      // Inicializar RabbitMQ primeiro
      if (!rabbitmqConfig.isConnected) {
        await rabbitmqConfig.initialize();
      }

      // Iniciar todos os workers em paralelo
      const startPromises = Object.entries(this.workers).map(async ([name, worker]) => {
        try {
          console.log(`🚀 Starting ${name} worker...`);
          await worker.start();
          console.log(`✅ ${name} worker started`);
        } catch (error) {
          console.error(`❌ Failed to start ${name} worker:`, error);
          throw error;
        }
      });

      await Promise.all(startPromises);

      this.isRunning = true;
      console.log('✅ WorkerManager: All workers started successfully');

    } catch (error) {
      console.error('❌ WorkerManager: Failed to start workers:', error);
      throw error;
    }
  }

  /**
   * Para todos os workers
   */
  async stopAll() {
    try {
      console.log('🛑 WorkerManager: Stopping all workers...');

      // Parar todos os workers em paralelo
      const stopPromises = Object.entries(this.workers).map(async ([name, worker]) => {
        try {
          console.log(`🛑 Stopping ${name} worker...`);
          await worker.stop();
          console.log(`✅ ${name} worker stopped`);
        } catch (error) {
          console.error(`❌ Error stopping ${name} worker:`, error);
        }
      });

      await Promise.all(stopPromises);

      // Fechar conexão RabbitMQ
      await rabbitmqConfig.close();

      this.isRunning = false;
      console.log('✅ WorkerManager: All workers stopped');

    } catch (error) {
      console.error('❌ WorkerManager: Error stopping workers:', error);
    }
  }

  /**
   * Reinicia um worker específico
   */
  async restartWorker(workerName) {
    try {
      const worker = this.workers[workerName];
      if (!worker) {
        throw new Error(`Worker not found: ${workerName}`);
      }

      console.log(`🔄 Restarting ${workerName} worker...`);
      
      await worker.stop();
      await worker.start();
      
      console.log(`✅ ${workerName} worker restarted`);

    } catch (error) {
      console.error(`❌ Error restarting ${workerName} worker:`, error);
      throw error;
    }
  }

  /**
   * Obtém status de todos os workers
   */
  async getStatus() {
    const status = {
      manager: {
        isRunning: this.isRunning,
        timestamp: new Date().toISOString()
      },
      workers: {},
      rabbitmq: await rabbitmqConfig.healthCheck()
    };

    // Coletar status de cada worker
    for (const [name, worker] of Object.entries(this.workers)) {
      try {
        status.workers[name] = await worker.healthCheck();
      } catch (error) {
        status.workers[name] = {
          worker: name,
          status: 'error',
          error: error.message,
          timestamp: new Date().toISOString()
        };
      }
    }

    return status;
  }

  /**
   * Obtém estatísticas das filas
   */
  async getQueueStats() {
    try {
      return await rabbitmqConfig.getAllQueueStats();
    } catch (error) {
      console.error('❌ Error getting queue stats:', error);
      return {};
    }
  }

  /**
   * Purga uma fila específica
   */
  async purgeQueue(queueName) {
    try {
      return await rabbitmqConfig.purgeQueue(queueName);
    } catch (error) {
      console.error(`❌ Error purging queue ${queueName}:`, error);
      throw error;
    }
  }

  /**
   * Health check completo
   */
  async healthCheck() {
    const status = await this.getStatus();
    const queueStats = await this.getQueueStats();
    
    const allWorkersHealthy = Object.values(status.workers).every(
      worker => worker.status === 'running'
    );
    
    return {
      healthy: this.isRunning && status.rabbitmq.healthy && allWorkersHealthy,
      status,
      queues: queueStats,
      timestamp: new Date().toISOString()
    };
  }
}

// Instância singleton
const workerManager = new WorkerManager();

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`📡 ${signal} received, shutting down workers gracefully...`);
  await workerManager.stopAll();
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Auto-start se executado diretamente
if (require.main === module) {
  workerManager.startAll().catch(error => {
    console.error('❌ Failed to start WorkerManager:', error);
    process.exit(1);
  });
}

module.exports = {
  workerManager,
  workers: {
    blockchainWorker,
    depositWorker,
    withdrawWorker,
    notificationWorker
  }
};