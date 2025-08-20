// Redis Service - Estratégia Simplificada
// Funcional para cache básico, rate limiting e filas temporárias
// NÃO usado para sessões JWT (mantidas no token)

const redis = require('redis');

class RedisService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.memoryFallback = new Map(); // Fallback em memória
    this.isInitializing = false;
  }

  /**
   * Inicializa conexão real com Redis
   */
  async initialize() {
    if (this.isInitializing) return;
    this.isInitializing = true;

    try {
      // Usar variáveis específicas do .env ou construir URL
      const redisHost = process.env.REDIS_HOST || 'localhost';
      const redisPort = process.env.REDIS_PORT || 6379;
      const redisPassword = process.env.REDIS_PASSWORD || '';
      const redisUrl = process.env.REDIS_URL || `redis://${redisPassword ? `:${redisPassword}@` : ''}${redisHost}:${redisPort}`;
      
      console.log('🔄 Redis: Tentando conectar...', `redis://${redisHost}:${redisPort}`);
      
      this.client = redis.createClient({
        url: redisUrl,
        socket: {
          connectTimeout: 5000,
          lazyConnect: true
        },
        retry_strategy: (options) => {
          console.warn('⚠️ Redis: Tentativa de reconexão', options.attempt);
          if (options.attempt > 3) {
            console.error('❌ Redis: Máximo de tentativas excedido, usando fallback de memória');
            return false;
          }
          return Math.min(options.attempt * 100, 3000);
        }
      });

      this.client.on('error', (error) => {
        console.error('❌ Redis Error:', error.message);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('✅ Redis: Conectado com sucesso');
        this.isConnected = true;
      });

      this.client.on('disconnect', () => {
        console.warn('⚠️ Redis: Desconectado - usando fallback de memória');
        this.isConnected = false;
      });

      await this.client.connect();
      
      // Alias para compatibilidade com outros serviços que usam .company
      this.company = this.client;
      
    } catch (error) {
      console.error('❌ Redis: Falha na inicialização, usando fallback de memória:', error.message);
      this.isConnected = false;
    }

    this.isInitializing = false;
  }

  /**
   * Cache de saldo do usuário (TTL: 30s)
   */
  async cacheBalance(userId, balance, ttl = 30) {
    try {
      const key = `balance:${userId}`;
      const data = JSON.stringify(balance);
      
      if (this.isConnected) {
        await this.client.setEx(key, ttl, data);
      } else {
        // Fallback de memória
        this.memoryFallback.set(key, { data, expiry: Date.now() + (ttl * 1000) });
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error caching balance:', error.message);
      return false;
    }
  }

  /**
   * Obtém saldo do cache
   */
  async getBalance(userId) {
    try {
      const key = `balance:${userId}`;
      
      if (this.isConnected) {
        const data = await this.client.get(key);
        return data ? JSON.parse(data) : null;
      } else {
        // Fallback de memória
        const cached = this.memoryFallback.get(key);
        if (cached && cached.expiry > Date.now()) {
          return JSON.parse(cached.data);
        }
        return null;
      }
    } catch (error) {
      console.error('❌ Error getting balance from cache:', error.message);
      return null;
    }
  }

  /**
   * Rate limiting por usuário/IP
   */
  async checkRateLimit(identifier, limit = 100, window = 60) {
    try {
      const key = `rate:${identifier}`;
      
      if (this.isConnected) {
        const count = await this.client.incr(key);
        if (count === 1) {
          await this.client.expire(key, window);
        }
        return count <= limit;
      } else {
        // Fallback de memória
        const now = Date.now();
        const windowStart = now - (window * 1000);
        const cached = this.memoryFallback.get(key) || { count: 0, timestamp: now };
        
        if (cached.timestamp < windowStart) {
          cached.count = 1;
          cached.timestamp = now;
        } else {
          cached.count++;
        }
        
        this.memoryFallback.set(key, cached);
        return cached.count <= limit;
      }
    } catch (error) {
      console.error('❌ Error checking rate limit:', error.message);
      return true; // Permitir em caso de erro
    }
  }

  /**
   * Invalida cache do usuário
   */
  async invalidateUserCache(userId) {
    try {
      if (this.isConnected) {
        const pattern = `*:${userId}:*`;
        const keys = await this.client.keys(pattern);
        if (keys.length) {
          await this.client.del(...keys);
        }
      } else {
        // Fallback de memória
        const keysToDelete = [];
        for (const key of this.memoryFallback.keys()) {
          if (key.includes(`:${userId}:`)) {
            keysToDelete.push(key);
          }
        }
        keysToDelete.forEach(key => this.memoryFallback.delete(key));
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error invalidating user cache:', error.message);
      return false;
    }
  }

  /**
   * Cache de transações (TTL: 1min)
   */
  async cacheTransactions(userId, transactions, ttl = 60) {
    try {
      const key = `transactions:${userId}`;
      const data = JSON.stringify(transactions);
      
      if (this.isConnected) {
        await this.client.setEx(key, ttl, data);
      } else {
        this.memoryFallback.set(key, { data, expiry: Date.now() + (ttl * 1000) });
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error caching transactions:', error.message);
      return false;
    }
  }

  /**
   * Obtém dados do cache (método genérico)
   */
  async get(key) {
    try {
      if (this.isConnected) {
        return await this.client.get(key);
      } else {
        const cached = this.memoryFallback.get(key);
        if (cached && cached.expiry > Date.now()) {
          return cached.data;
        }
        return null;
      }
    } catch (error) {
      console.error('❌ Error getting cache data:', error.message);
      return null;
    }
  }

  /**
   * Define dados no cache (método genérico)
   */
  async set(key, value, options = {}) {
    try {
      if (this.isConnected) {
        if (options.EX) {
          return await this.client.setEx(key, options.EX, value);
        } else {
          return await this.client.set(key, value);
        }
      } else {
        const expiry = options.EX ? Date.now() + (options.EX * 1000) : null;
        this.memoryFallback.set(key, { data: value, expiry });
        return 'OK';
      }
    } catch (error) {
      console.error('❌ Error setting cache data:', error.message);
      return false;
    }
  }

  /**
   * Remove dados do cache
   */
  async del(key) {
    try {
      if (this.isConnected) {
        return await this.client.del(key);
      } else {
        const deleted = this.memoryFallback.delete(key);
        return deleted ? 1 : 0;
      }
    } catch (error) {
      console.error('❌ Error deleting cache data:', error.message);
      return 0;
    }
  }

  /**
   * Verifica se uma chave existe
   */
  async exists(key) {
    try {
      if (this.isConnected) {
        return await this.client.exists(key);
      } else {
        const cached = this.memoryFallback.get(key);
        if (cached && (!cached.expiry || cached.expiry > Date.now())) {
          return 1;
        }
        return 0;
      }
    } catch (error) {
      console.error('❌ Error checking key existence:', error.message);
      return 0;
    }
  }

  /**
   * Fechar conexão
   */
  async close() {
    try {
      if (this.client) {
        await this.client.disconnect();
        console.log('✅ Redis: Conexão fechada');
      }
      this.isConnected = false;
      this.memoryFallback.clear();
    } catch (error) {
      console.error('❌ Error closing Redis connection:', error.message);
      throw error;
    }
  }

  /**
   * Ping para verificar conexão
   */
  async ping() {
    try {
      if (this.isConnected && this.client) {
        return await this.client.ping();
      } else {
        throw new Error('Redis not connected');
      }
    } catch (error) {
      console.error('❌ Error pinging Redis:', error.message);
      throw error;
    }
  }

  /**
   * Limpa cache expirado da memória (apenas fallback)
   */
  cleanupExpiredMemoryCache() {
    if (!this.isConnected) {
      const now = Date.now();
      for (const [key, cached] of this.memoryFallback.entries()) {
        if (cached.expiry && cached.expiry <= now) {
          this.memoryFallback.delete(key);
        }
      }
    }
  }

  /**
   * Obtém estatísticas do cache
   */
  getStats() {
    return {
      isConnected: this.isConnected,
      memoryFallbackSize: this.memoryFallback.size,
      mode: this.isConnected ? 'redis' : 'memory_fallback'
    }
  }
}

// Exportar instância única
const redisService = new RedisService();
module.exports = redisService;