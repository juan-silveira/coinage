const redis = require('redis');

class RedisService {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  /**
   * Inicializa a conexão com o Redis
   */
  async initialize() {
    try {
      this.client = redis.createClient({
        socket: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT) || 6379,
          family: 4, // Forçar IPv4
          connectTimeout: 30000, // 30 segundos
          commandTimeout: 30000, // 30 segundos para comandos
          lazyConnect: false
        },
        password: process.env.REDIS_PASSWORD || undefined,
        database: parseInt(process.env.REDIS_DB) || 0,
        retryDelayOnFailover: 100,
        enableReadyCheck: true,
        maxRetriesPerRequest: 3
      });

      this.client.on('error', (err) => {
        console.error('❌ Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('✅ Redis Client Connected');
        this.isConnected = true;
      });

      this.client.on('ready', () => {
        console.log('✅ Redis Client Ready');
        this.isConnected = true;
      });

      this.client.on('end', () => {
        console.log('⚠️ Redis Client Disconnected');
        this.isConnected = false;
      });

      await this.client.connect();
      console.log('✅ Redis service initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing Redis service:', error.message);
      this.isConnected = false;
    }
  }

  // ==================== MÉTODOS DE BLACKLIST ====================

  /**
   * Adiciona um token à blacklist
   */
  async addToBlacklist(token, expiresIn = 3600) {
    try {
      if (!this.isConnected || !this.client) {
        console.warn('⚠️ Redis not connected, skipping blacklist operation');
        return false;
      }

      const key = `blacklist:${token}`;
      await this.client.setEx(key, expiresIn, 'blacklisted');
      console.log(`✅ Token added to blacklist: ${token.substring(0, 20)}...`);
      return true;
    } catch (error) {
      console.error('❌ Error adding token to blacklist:', error.message);
      return false;
    }
  }

  /**
   * Verifica se um token está na blacklist
   */
  async isBlacklisted(token) {
    try {
      if (!this.isConnected || !this.client) {
        console.warn('⚠️ Redis not connected, assuming token is not blacklisted');
        return false;
      }

      const key = `blacklist:${token}`;
      const result = await this.client.get(key);
      return result === 'blacklisted';
    } catch (error) {
      console.error('❌ Error checking blacklist:', error.message);
      return false;
    }
  }

  /**
   * Remove um token da blacklist
   */
  async removeFromBlacklist(token) {
    try {
      if (!this.isConnected || !this.client) {
        console.warn('⚠️ Redis not connected, skipping blacklist removal');
        return false;
      }

      const key = `blacklist:${token}`;
      await this.client.del(key);
      console.log(`✅ Token removed from blacklist: ${token.substring(0, 20)}...`);
      return true;
    } catch (error) {
      console.error('❌ Error removing token from blacklist:', error.message);
      return false;
    }
  }

  /**
   * Limpa todos os tokens expirados da blacklist
   */
  async cleanupExpiredTokens() {
    try {
      if (!this.isConnected || !this.client) {
        console.warn('⚠️ Redis not connected, skipping cleanup');
        return 0;
      }

      const pattern = 'blacklist:*';
      const keys = await this.client.keys(pattern);
      let removedCount = 0;

      for (const key of keys) {
        const ttl = await this.client.ttl(key);
        if (ttl <= 0) {
          await this.client.del(key);
          removedCount++;
        }
      }

      console.log(`✅ Cleaned up ${removedCount} expired tokens from blacklist`);
      return removedCount;
    } catch (error) {
      console.error('❌ Error cleaning up expired tokens:', error.message);
      return 0;
    }
  }

  /**
   * Obtém estatísticas da blacklist
   */
  async getBlacklistStats() {
    try {
      if (!this.isConnected || !this.client) {
        return {
          totalTokens: 0,
          isConnected: false
        };
      }

      const pattern = 'blacklist:*';
      const keys = await this.client.keys(pattern);
      
      const stats = {
        totalTokens: keys.length,
        isConnected: true,
        tokens: []
      };

      // Obter informações detalhadas dos primeiros 10 tokens
      for (let i = 0; i < Math.min(keys.length, 10); i++) {
        const key = keys[i];
        const ttl = await this.client.ttl(key);
        stats.tokens.push({
          token: key.replace('blacklist:', '').substring(0, 20) + '...',
          expiresIn: ttl > 0 ? ttl : 'expired'
        });
      }

      return stats;
    } catch (error) {
      console.error('❌ Error getting blacklist stats:', error.message);
      return {
        totalTokens: 0,
        isConnected: false,
        error: error.message
      };
    }
  }

  // ==================== MÉTODOS DE CACHE DE USUÁRIOS ====================

  /**
   * Armazena dados do usuário no cache
   * @param {string} userId - ID do usuário
   * @param {Object} userData - Dados do usuário
   * @param {number} expiresIn - Tempo de expiração em segundos (padrão: 1 hora)
   */
  async cacheUserData(userId, userData, expiresIn = 3600) {
    try {
      if (!this.isConnected || !this.client) {
        console.warn('⚠️ Redis not connected, skipping user cache');
        return false;
      }

      const key = `user:${userId}`;
      const data = JSON.stringify({
        ...userData,
        cachedAt: new Date().toISOString()
      });

      await this.client.setEx(key, expiresIn, data);
      console.log(`✅ User data cached for ID: ${userId}`);
      return true;
    } catch (error) {
      console.error('❌ Error caching user data:', error.message);
      return false;
    }
  }

  /**
   * Obtém dados do usuário do cache
   * @param {string} userId - ID do usuário
   * @returns {Object|null} Dados do usuário ou null se não encontrado
   */
  async getCachedUserData(userId) {
    try {
      if (!this.isConnected || !this.client) {
        console.warn('⚠️ Redis not connected, user cache unavailable');
        return null;
      }

      const key = `user:${userId}`;
      const data = await this.client.get(key);
      
      if (!data) {
        return null;
      }

      const userData = JSON.parse(data);
      console.log(`✅ User data retrieved from cache for ID: ${userId}`);
      return userData;
    } catch (error) {
      console.error('❌ Error getting cached user data:', error.message);
      return null;
    }
  }

  /**
   * Remove dados do usuário do cache
   * @param {string} userId - ID do usuário
   */
  async removeCachedUserData(userId) {
    try {
      if (!this.isConnected || !this.client) {
        console.warn('⚠️ Redis not connected, skipping user cache removal');
        return false;
      }

      const key = `user:${userId}`;
      await this.client.del(key);
      console.log(`✅ User data removed from cache for ID: ${userId}`);
      return true;
    } catch (error) {
      console.error('❌ Error removing cached user data:', error.message);
      return false;
    }
  }

  /**
   * Atualiza dados específicos do usuário no cache
   * @param {string} userId - ID do usuário
   * @param {Object} updates - Dados a serem atualizados
   * @param {number} expiresIn - Tempo de expiração em segundos
   */
  async updateCachedUserData(userId, updates, expiresIn = 3600) {
    try {
      if (!this.isConnected || !this.client) {
        console.warn('⚠️ Redis not connected, skipping user cache update');
        return false;
      }

      const key = `user:${userId}`;
      const existingData = await this.client.get(key);
      
      let userData = {};
      if (existingData) {
        userData = JSON.parse(existingData);
      }

      const updatedData = {
        ...userData,
        ...updates,
        cachedAt: new Date().toISOString()
      };

      await this.client.setEx(key, expiresIn, JSON.stringify(updatedData));
      console.log(`✅ User data updated in cache for ID: ${userId}`);
      return true;
    } catch (error) {
      console.error('❌ Error updating cached user data:', error.message);
      return false;
    }
  }

  // ==================== MÉTODOS DE CACHE DE BALANCES ====================

  /**
   * Armazena balances de tokens do usuário no cache por rede
   * @param {string} userId - ID do usuário
   * @param {string} address - Endereço da carteira
   * @param {string} network - Rede (testnet/mainnet)
   * @param {Object} balances - Dados dos balances
   * @param {number} expiresIn - Tempo de expiração em segundos (padrão: 1 minuto)
   */
  async cacheUserBalances(userId, address, network, balances, expiresIn = 60) {
    try {
      if (!this.isConnected || !this.client) {
        console.warn('⚠️ Redis not connected, skipping balances cache');
        return false;
      }

      const key = `balances:${userId}:${address}:${network}`;
      const data = JSON.stringify({
        ...balances,
        network,
        cachedAt: new Date().toISOString(),
        fromCache: true
      });

      await this.client.setEx(key, expiresIn, data);
      console.log(`✅ User balances cached for ID: ${userId}, Address: ${address}, Network: ${network}`);
      return true;
    } catch (error) {
      console.error('❌ Error caching user balances:', error.message);
      return false;
    }
  }

  /**
   * Obtém balances de tokens do usuário do cache por rede
   * @param {string} userId - ID do usuário
   * @param {string} address - Endereço da carteira
   * @param {string} network - Rede (testnet/mainnet)
   * @returns {Object|null} Dados dos balances ou null se não encontrado
   */
  async getCachedUserBalances(userId, address, network) {
    try {
      if (!this.isConnected || !this.client) {
        console.warn('⚠️ Redis not connected, balances cache unavailable');
        return null;
      }

      const key = `balances:${userId}:${address}:${network}`;
      const data = await this.client.get(key);
      
      if (!data) {
        console.log(`💰 Balances cache miss for user ${userId}, address: ${address}, network: ${network}`);
        return null;
      }

      const balances = JSON.parse(data);
      console.log(`💰 Balances cache hit for user ${userId}, address: ${address}, network: ${network}`);
      return balances;
    } catch (error) {
      console.error('❌ Error getting cached user balances:', error.message);
      return null;
    }
  }

  /**
   * Remove balances do usuário do cache
   * @param {string} userId - ID do usuário
   * @param {string} address - Endereço da carteira
   */
  async removeCachedUserBalances(userId, address) {
    try {
      if (!this.isConnected || !this.client) {
        console.warn('⚠️ Redis not connected, skipping balances cache removal');
        return false;
      }

      const key = `balances:${userId}:${address}`;
      await this.client.del(key);
      console.log(`✅ User balances removed from cache for ID: ${userId}, Address: ${address}`);
      return true;
    } catch (error) {
      console.error('❌ Error removing cached user balances:', error.message);
      return false;
    }
  }

  /**
   * Atualiza balances específicos do usuário no cache
   * @param {string} userId - ID do usuário
   * @param {string} address - Endereço da carteira
   * @param {Object} updates - Dados a serem atualizados
   * @param {number} expiresIn - Tempo de expiração em segundos
   */
  async updateCachedUserBalances(userId, address, updates, expiresIn = 300) {
    try {
      if (!this.isConnected || !this.client) {
        console.warn('⚠️ Redis not connected, skipping balances cache update');
        return false;
      }

      const key = `balances:${userId}:${address}`;
      const existingData = await this.client.get(key);
      
      let balances = {};
      if (existingData) {
        balances = JSON.parse(existingData);
      }

      const updatedBalances = {
        ...balances,
        ...updates,
        cachedAt: new Date().toISOString()
      };

      await this.client.setEx(key, expiresIn, JSON.stringify(updatedBalances));
      console.log(`✅ User balances updated in cache for ID: ${userId}, Address: ${address}`);
      return true;
    } catch (error) {
      console.error('❌ Error updating cached user balances:', error.message);
      return false;
    }
  }

  /**
   * Obtém estatísticas do cache
   */
  async getCacheStats() {
    try {
      if (!this.isConnected || !this.client) {
        return {
          isConnected: false,
          userCache: { count: 0 },
          balancesCache: { count: 0 },
          blacklist: { count: 0 }
        };
      }

      const userKeys = await this.client.keys('user:*');
      const balanceKeys = await this.client.keys('balances:*');
      const blacklistKeys = await this.client.keys('blacklist:*');

      return {
        isConnected: true,
        userCache: { count: userKeys.length },
        balancesCache: { count: balanceKeys.length },
        blacklist: { count: blacklistKeys.length },
        totalKeys: userKeys.length + balanceKeys.length + blacklistKeys.length
      };
    } catch (error) {
      console.error('❌ Error getting cache stats:', error.message);
      return {
        isConnected: false,
        error: error.message
      };
    }
  }

  /**
   * Limpa todo o cache
   */
  async clearAllCache() {
    try {
      if (!this.isConnected || !this.client) {
        console.warn('⚠️ Redis not connected, skipping cache clear');
        return 0;
      }

      const userKeys = await this.client.keys('user:*');
      const balanceKeys = await this.client.keys('balances:*');
      const allKeys = [...userKeys, ...balanceKeys];

      if (allKeys.length > 0) {
        await this.client.del(allKeys);
      }

      console.log(`✅ Cleared ${allKeys.length} cache entries`);
      return allKeys.length;
    } catch (error) {
      console.error('❌ Error clearing cache:', error.message);
      return 0;
    }
  }

  /**
   * Testa a conexão com o Redis
   */
  async testConnection() {
    try {
      if (!this.isConnected || !this.client) {
        return {
          success: false,
          message: 'Redis not connected',
          isConnected: false
        };
      }

      const result = await this.client.ping();
      return {
        success: result === 'PONG',
        message: result === 'PONG' ? 'Redis connection successful' : 'Redis connection failed',
        isConnected: this.isConnected
      };
    } catch (error) {
      return {
        success: false,
        message: `Redis connection error: ${error.message}`,
        isConnected: this.isConnected
      };
    }
  }

  /**
   * Fecha a conexão com o Redis
   */
  async disconnect() {
    try {
      if (this.client) {
        await this.client.quit();
        this.isConnected = false;
        console.log('✅ Redis connection closed');
      }
    } catch (error) {
      console.error('❌ Error closing Redis connection:', error.message);
    }
  }
}

// Exportar uma instância singleton
module.exports = new RedisService(); 