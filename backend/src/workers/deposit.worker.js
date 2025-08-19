const amqp = require('amqplib');
const DepositService = require('../services/deposit.service');

class DepositWorker {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.depositService = new DepositService();
    this.isRunning = false;
  }

  /**
   * Conectar ao RabbitMQ
   */
  async connect() {
    try {
      this.connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
      this.channel = await this.connection.createChannel();
      
      // Declarar fila de depósitos
      await this.channel.assertQueue('deposits', {
        durable: true
      });
      
      // Configurar QoS para processar uma mensagem por vez
      await this.channel.prefetch(1);
      
      console.log('✅ Worker conectado ao RabbitMQ');
      
    } catch (error) {
      console.error('❌ Erro ao conectar worker ao RabbitMQ:', error);
      throw error;
    }
  }

  /**
   * Iniciar processamento de mensagens
   */
  async start() {
    try {
      if (this.isRunning) {
        console.log('⚠️ Worker já está rodando');
        return;
      }

      await this.connect();
      this.isRunning = true;

      console.log('🚀 Worker de depósitos iniciado');

      // Consumir mensagens da fila
      await this.channel.consume('deposits', async (msg) => {
        if (msg) {
          try {
            const depositMessage = JSON.parse(msg.content.toString());
            console.log(`📥 Processando depósito: ${depositMessage.transactionId}`);
            
            // Processar depósito
            await this.depositService.processDepositFromQueue(depositMessage);
            
            // Confirmar mensagem processada
            this.channel.ack(msg);
            
            console.log(`✅ Depósito processado com sucesso: ${depositMessage.transactionId}`);
            
          } catch (error) {
            console.error('❌ Erro ao processar depósito:', error);
            
            // Rejeitar mensagem e enviar para fila de retry ou dead letter
            this.channel.nack(msg, false, false);
            
            // Aguardar um pouco antes de processar a próxima mensagem
            await new Promise(resolve => setTimeout(resolve, 5000));
          }
        }
      });

    } catch (error) {
      console.error('❌ Erro ao iniciar worker:', error);
      this.isRunning = false;
      throw error;
    }
  }

  /**
   * Parar worker
   */
  async stop() {
    try {
      this.isRunning = false;
      
      if (this.channel) {
        await this.channel.close();
      }
      
      if (this.connection) {
        await this.connection.close();
      }
      
      await this.depositService.closeConnections();
      
      console.log('🛑 Worker de depósitos parado');
      
    } catch (error) {
      console.error('❌ Erro ao parar worker:', error);
    }
  }

  /**
   * Verificar status do worker
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      isConnected: !!this.connection && !!this.channel
    };
  }
}

// Instância singleton do worker
let workerInstance = null;

/**
 * Iniciar worker
 */
const startWorker = async () => {
  try {
    if (!workerInstance) {
      workerInstance = new DepositWorker();
    }
    
    await workerInstance.start();
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('🔄 Recebido SIGINT, parando worker...');
      await workerInstance.stop();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      console.log('🔄 Recebido SIGTERM, parando worker...');
      await workerInstance.stop();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Erro fatal no worker:', error);
    process.exit(1);
  }
};

/**
 * Parar worker
 */
const stopWorker = async () => {
  if (workerInstance) {
    await workerInstance.stop();
  }
};

module.exports = {
  DepositWorker,
  startWorker,
  stopWorker,
  getWorkerInstance: () => workerInstance
};



