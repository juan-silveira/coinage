const amqp = require('amqplib');

class RabbitMQConfig {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 5000;
    
    // Definição das filas e exchanges
    this.exchanges = {
      BLOCKCHAIN: 'blockchain.exchange',
      NOTIFICATIONS: 'notifications.exchange',
      DEADLETTER: 'deadletter.exchange'
    };
    
    this.queues = {
      // Filas de transações blockchain
      BLOCKCHAIN_TRANSACTIONS: {
        name: 'blockchain.transactions',
        options: {
          durable: true,
          maxPriority: 10,
          arguments: {
            'x-message-ttl': 300000, // 5 minutos
            'x-max-retries': 3,
            'x-dead-letter-exchange': 'deadletter.exchange',
            'x-dead-letter-routing-key': 'blockchain.failed'
          }
        }
      },
      
      // Filas de depósitos
      DEPOSITS_PROCESSING: {
        name: 'deposits.processing',
        options: {
          durable: true,
          maxPriority: 8,
          arguments: {
            'x-message-ttl': 600000, // 10 minutos
            'x-max-retries': 5,
            'x-dead-letter-exchange': 'deadletter.exchange',
            'x-dead-letter-routing-key': 'deposits.failed'
          }
        }
      },
      
      // Filas de saques
      WITHDRAWALS_PROCESSING: {
        name: 'withdrawals.processing',
        options: {
          durable: true,
          maxPriority: 9,
          arguments: {
            'x-message-ttl': 1200000, // 20 minutos
            'x-max-retries': 3,
            'x-dead-letter-exchange': 'deadletter.exchange',
            'x-dead-letter-routing-key': 'withdrawals.failed'
          }
        }
      },
      
      // Filas de contratos inteligentes
      CONTRACT_OPERATIONS: {
        name: 'contracts.operations',
        options: {
          durable: true,
          maxPriority: 7,
          arguments: {
            'x-message-ttl': 180000, // 3 minutos
            'x-max-retries': 2,
            'x-dead-letter-exchange': 'deadletter.exchange',
            'x-dead-letter-routing-key': 'contracts.failed'
          }
        }
      },
      
      // Filas de notificações
      NOTIFICATIONS_EMAIL: {
        name: 'notifications.email',
        options: {
          durable: true,
          maxPriority: 5,
          arguments: {
            'x-message-ttl': 60000, // 1 minuto
            'x-max-retries': 2,
            'x-dead-letter-exchange': 'deadletter.exchange',
            'x-dead-letter-routing-key': 'notifications.failed'
          }
        }
      },
      
      NOTIFICATIONS_WEBHOOK: {
        name: 'notifications.webhook',
        options: {
          durable: true,
          maxPriority: 6,
          arguments: {
            'x-message-ttl': 30000, // 30 segundos
            'x-max-retries': 3,
            'x-dead-letter-exchange': 'deadletter.exchange',
            'x-dead-letter-routing-key': 'webhooks.failed'
          }
        }
      },
      
      // Dead Letter Queues
      BLOCKCHAIN_DLQ: {
        name: 'blockchain.failed',
        options: { durable: true }
      },
      
      DEPOSITS_DLQ: {
        name: 'deposits.failed',
        options: { durable: true }
      },
      
      WITHDRAWALS_DLQ: {
        name: 'withdrawals.failed',
        options: { durable: true }
      },
      
      CONTRACTS_DLQ: {
        name: 'contracts.failed',
        options: { durable: true }
      },
      
      NOTIFICATIONS_DLQ: {
        name: 'notifications.failed',
        options: { durable: true }
      },
      
      WEBHOOKS_DLQ: {
        name: 'webhooks.failed',
        options: { durable: true }
      }
    };
  }

  /**
   * Inicializa conexão com RabbitMQ
   */
  async initialize() {
    try {
      const rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
      console.log('🐰 RabbitMQ: Connecting to', rabbitmqUrl.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));
      
      this.connection = await amqp.connect(rabbitmqUrl);
      this.channel = await this.connection.createChannel();
      
      // Configurar prefetch para controle de fluxo
      await this.channel.prefetch(10);
      
      // Setup de exchanges, queues e bindings
      await this.setupInfrastructure();
      
      // Event listeners
      this.connection.on('error', this.handleConnectionError.bind(this));
      this.connection.on('close', this.handleConnectionClose.bind(this));
      
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      console.log('✅ RabbitMQ: Connected successfully');
      return true;
      
    } catch (error) {
      console.error('❌ RabbitMQ: Connection failed:', error.message);
      this.isConnected = false;
      
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        await this.scheduleReconnect();
      }
      
      return false;
    }
  }

  /**
   * Configura exchanges, filas e bindings
   */
  async setupInfrastructure() {
    try {
      // Criar exchanges
      await this.channel.assertExchange(this.exchanges.BLOCKCHAIN, 'topic', { durable: true });
      await this.channel.assertExchange(this.exchanges.NOTIFICATIONS, 'topic', { durable: true });
      await this.channel.assertExchange(this.exchanges.DEADLETTER, 'direct', { durable: true });
      
      // Criar filas
      for (const [key, queueConfig] of Object.entries(this.queues)) {
        await this.channel.assertQueue(queueConfig.name, queueConfig.options);
        console.log(`✅ Queue created: ${queueConfig.name}`);
      }
      
      // Criar fila de mint
      await this.channel.assertQueue('blockchain.mint', { durable: true });
      console.log('✅ Queue created: blockchain.mint');

      // Bindings para filas principais
      await this.channel.bindQueue(this.queues.BLOCKCHAIN_TRANSACTIONS.name, this.exchanges.BLOCKCHAIN, 'transaction.*');
      await this.channel.bindQueue(this.queues.DEPOSITS_PROCESSING.name, this.exchanges.BLOCKCHAIN, 'deposit.*');
      await this.channel.bindQueue(this.queues.WITHDRAWALS_PROCESSING.name, this.exchanges.BLOCKCHAIN, 'withdrawal.*');
      await this.channel.bindQueue(this.queues.CONTRACT_OPERATIONS.name, this.exchanges.BLOCKCHAIN, 'contract.*');
      await this.channel.bindQueue('blockchain.mint', this.exchanges.BLOCKCHAIN, 'transaction.mint');
      
      // Bindings para notificações
      await this.channel.bindQueue(this.queues.NOTIFICATIONS_EMAIL.name, this.exchanges.NOTIFICATIONS, 'email.*');
      await this.channel.bindQueue(this.queues.NOTIFICATIONS_WEBHOOK.name, this.exchanges.NOTIFICATIONS, 'webhook.*');
      
      // Bindings para Dead Letter Queues
      await this.channel.bindQueue(this.queues.BLOCKCHAIN_DLQ.name, this.exchanges.DEADLETTER, 'blockchain.failed');
      await this.channel.bindQueue(this.queues.DEPOSITS_DLQ.name, this.exchanges.DEADLETTER, 'deposits.failed');
      await this.channel.bindQueue(this.queues.WITHDRAWALS_DLQ.name, this.exchanges.DEADLETTER, 'withdrawals.failed');
      await this.channel.bindQueue(this.queues.CONTRACTS_DLQ.name, this.exchanges.DEADLETTER, 'contracts.failed');
      await this.channel.bindQueue(this.queues.NOTIFICATIONS_DLQ.name, this.exchanges.DEADLETTER, 'notifications.failed');
      await this.channel.bindQueue(this.queues.WEBHOOKS_DLQ.name, this.exchanges.DEADLETTER, 'webhooks.failed');
      
      console.log('✅ RabbitMQ: Infrastructure setup completed');
      
    } catch (error) {
      console.error('❌ RabbitMQ: Infrastructure setup failed:', error);
      throw error;
    }
  }

  /**
   * Publica mensagem na fila
   */
  async publishMessage(exchange, routingKey, message, options = {}) {
    try {
      if (!this.isConnected || !this.channel) {
        throw new Error('RabbitMQ not connected');
      }

      const messageBuffer = Buffer.from(JSON.stringify({
        ...message,
        timestamp: new Date().toISOString(),
        messageId: this.generateMessageId(),
        retryCount: message.retryCount || 0
      }));

      const publishOptions = {
        persistent: true,
        priority: options.priority || 5,
        messageId: this.generateMessageId(),
        timestamp: Date.now(),
        headers: {
          'x-source': 'coinage-api',
          'x-correlation-id': options.correlationId || this.generateMessageId(),
          ...options.headers
        },
        ...options
      };

      const success = this.channel.publish(exchange, routingKey, messageBuffer, publishOptions);
      
      if (success) {
        console.log(`📤 Message published to ${exchange}:${routingKey}`);
        return { success: true, messageId: publishOptions.messageId };
      } else {
        throw new Error('Failed to publish message');
      }
      
    } catch (error) {
      console.error('❌ Error publishing message:', error);
      throw error;
    }
  }

  /**
   * Consome mensagens de uma fila
   */
  async consumeQueue(queueName, handler, options = {}) {
    try {
      if (!this.isConnected || !this.channel) {
        throw new Error('RabbitMQ not connected');
      }

      const consumerOptions = {
        noAck: false, // Manual acknowledgment
        ...options
      };

      await this.channel.consume(queueName, async (message) => {
        if (!message) return;

        try {
          const content = JSON.parse(message.content.toString());
          const messageInfo = {
            queue: queueName,
            routingKey: message.fields.routingKey,
            exchange: message.fields.exchange,
            redelivered: message.fields.redelivered,
            properties: message.properties,
            headers: message.properties.headers || {}
          };

          console.log(`📥 Processing message from ${queueName}:`, content.type || 'unknown');

          // Executar handler
          await handler(content, messageInfo);

          // Acknowledge mensagem
          this.channel.ack(message);
          console.log(`✅ Message processed successfully from ${queueName}`);

        } catch (error) {
          console.error(`❌ Error processing message from ${queueName}:`, error);
          
          const retryCount = (message.properties.headers && message.properties.headers['x-retry-count']) || 0;
          const maxRetries = this.getQueueMaxRetries(queueName);

          if (retryCount < maxRetries) {
            // Retry: rejeitar e reenviar para a fila
            console.log(`🔄 Retrying message (attempt ${retryCount + 1}/${maxRetries})`);
            this.channel.reject(message, false); // false = não requeue, vai para DLQ após retry
          } else {
            // Max retries reached: enviar para DLQ
            console.log(`💀 Max retries reached, sending to DLQ`);
            this.channel.nack(message, false, false); // false, false = reject e não requeue
          }
        }
      }, consumerOptions);

      console.log(`👂 Consuming messages from queue: ${queueName}`);
      
    } catch (error) {
      console.error(`❌ Error setting up consumer for ${queueName}:`, error);
      throw error;
    }
  }

  /**
   * Obtém estatísticas das filas
   */
  async getQueueStats(queueName) {
    try {
      if (!this.isConnected || !this.channel) {
        throw new Error('RabbitMQ not connected');
      }

      const queueInfo = await this.channel.checkQueue(queueName);
      return {
        queue: queueName,
        messageCount: queueInfo.messageCount,
        consumerCount: queueInfo.consumerCount
      };
      
    } catch (error) {
      console.error(`Error getting stats for queue ${queueName}:`, error);
      return {
        queue: queueName,
        messageCount: 0,
        consumerCount: 0,
        error: error.message
      };
    }
  }

  /**
   * Obtém estatísticas de todas as filas
   */
  async getAllQueueStats() {
    const stats = {};
    
    for (const [key, queueConfig] of Object.entries(this.queues)) {
      stats[key] = await this.getQueueStats(queueConfig.name);
    }
    
    return stats;
  }

  /**
   * Purga uma fila (remove todas as mensagens)
   */
  async purgeQueue(queueName) {
    try {
      if (!this.isConnected || !this.channel) {
        throw new Error('RabbitMQ not connected');
      }

      const result = await this.channel.purgeQueue(queueName);
      console.log(`🧹 Purged ${result.messageCount} messages from ${queueName}`);
      return result;
      
    } catch (error) {
      console.error(`Error purging queue ${queueName}:`, error);
      throw error;
    }
  }

  /**
   * Fecha conexão
   */
  async close() {
    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = null;
      }
      
      if (this.connection) {
        await this.connection.close();
        this.connection = null;
      }
      
      this.isConnected = false;
      console.log('🔒 RabbitMQ: Connection closed');
      
    } catch (error) {
      console.error('❌ Error closing RabbitMQ connection:', error);
    }
  }

  // Helper methods
  handleConnectionError(error) {
    console.error('❌ RabbitMQ connection error:', error.message);
    this.isConnected = false;
  }

  handleConnectionClose() {
    console.warn('⚠️ RabbitMQ connection closed');
    this.isConnected = false;
    
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.scheduleReconnect();
    }
  }

  async scheduleReconnect() {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * this.reconnectAttempts;
    
    console.log(`🔄 Scheduling reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);
    
    setTimeout(() => {
      this.initialize();
    }, delay);
  }

  generateMessageId() {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getQueueMaxRetries(queueName) {
    const queue = Object.values(this.queues).find(q => q.name === queueName);
    return queue?.options?.arguments?.['x-max-retries'] || 3;
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      if (!this.isConnected || !this.channel) {
        return { healthy: false, error: 'Not connected' };
      }

      // Tentar fazer uma operação simples
      await this.channel.checkQueue(this.queues.BLOCKCHAIN_TRANSACTIONS.name);
      
      return {
        healthy: true,
        connected: this.isConnected,
        reconnectAttempts: this.reconnectAttempts
      };
      
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        connected: this.isConnected
      };
    }
  }
}

// Export singleton instance
const rabbitmqConfig = new RabbitMQConfig();
module.exports = rabbitmqConfig;