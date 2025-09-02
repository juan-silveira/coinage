/**
 * StakeCacheService - Serviço de cache Redis para dados de stake
 * 
 * Este serviço gerencia o cache inteligente dos dados de stake usando Redis,
 * com TTL diferenciado por tipo de dados e métricas de performance.
 */

const redis = require('../config/redis');
const logger = require('../config/logger');

class StakeCacheService {
  constructor() {
    // TTL configurações em segundos
    this.ttlConfig = {
      // Dados do usuário (mais voláteis)
      userStakeBalance: 30,          // 30 segundos
      userPendingRewards: 30,        // 30 segundos
      userBlacklistStatus: 300,      // 5 minutos
      
      // Dados do contrato (menos voláteis)
      contractInfo: 300,             // 5 minutos
      contractStatistics: 120,       // 2 minutos
      totalStakedSupply: 60,         // 1 minuto
      
      // Dados globais (menos voláteis ainda)
      contractMetadata: 600,         // 10 minutos
      networkInfo: 300,              // 5 minutos
      
      // Dados de transações
      transactionStatus: 60,         // 1 minuto
      transactionReceipt: 3600,      // 1 hora (quando confirmada)
    };

    // Prefixos para organização das chaves
    this.keyPrefixes = {
      user: 'stake:user',
      contract: 'stake:contract', 
      network: 'stake:network',
      transaction: 'stake:tx',
      metrics: 'stake:metrics'
    };

    // Métricas de cache
    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0
    };

    // Carregar métricas do Redis na inicialização
    this.loadMetrics();
  }

  // ===== GERENCIAMENTO DE CHAVES =====

  /**
   * Gera chave de cache formatada
   */
  generateKey(prefix, ...parts) {
    const cleanParts = parts
      .filter(part => part !== null && part !== undefined)
      .map(part => part.toString().toLowerCase());
    
    return `${this.keyPrefixes[prefix]}:${cleanParts.join(':')}`;
  }

  /**
   * Extrai informações da chave de cache
   */
  parseKey(key) {
    const parts = key.split(':');
    return {
      service: parts[0],
      type: parts[1],
      identifier: parts.slice(2).join(':')
    };
  }

  // ===== OPERAÇÕES BÁSICAS DE CACHE =====

  /**
   * Armazena dados no cache com TTL específico
   */
  async set(key, data, customTTL = null) {
    try {
      const serializedData = JSON.stringify({
        data,
        cachedAt: Date.now(),
        ttl: customTTL || this.getDefaultTTL(key)
      });

      const ttl = customTTL || this.getDefaultTTL(key);
      await redis.setex(key, ttl, serializedData);
      
      this.metrics.sets++;
      await this.updateMetrics();
      
      logger.debug(`Cache SET: ${key} (TTL: ${ttl}s)`);
      return true;
    } catch (error) {
      this.metrics.errors++;
      await this.updateMetrics();
      logger.error('Cache SET error:', { key, error: error.message });
      return false;
    }
  }

  /**
   * Recupera dados do cache
   */
  async get(key) {
    try {
      const cached = await redis.get(key);
      
      if (!cached) {
        this.metrics.misses++;
        await this.updateMetrics();
        logger.debug(`Cache MISS: ${key}`);
        return null;
      }

      const { data, cachedAt } = JSON.parse(cached);
      
      this.metrics.hits++;
      await this.updateMetrics();
      
      logger.debug(`Cache HIT: ${key} (age: ${Date.now() - cachedAt}ms)`);
      return data;
    } catch (error) {
      this.metrics.errors++;
      await this.updateMetrics();
      logger.error('Cache GET error:', { key, error: error.message });
      return null;
    }
  }

  /**
   * Remove dados do cache
   */
  async delete(key) {
    try {
      const result = await redis.del(key);
      
      if (result > 0) {
        this.metrics.deletes++;
        await this.updateMetrics();
        logger.debug(`Cache DELETE: ${key}`);
      }
      
      return result > 0;
    } catch (error) {
      this.metrics.errors++;
      await this.updateMetrics();
      logger.error('Cache DELETE error:', { key, error: error.message });
      return false;
    }
  }

  /**
   * Verifica se uma chave existe no cache
   */
  async exists(key) {
    try {
      const result = await redis.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Cache EXISTS error:', { key, error: error.message });
      return false;
    }
  }

  // ===== MÉTODOS ESPECÍFICOS PARA STAKES =====

  /**
   * Cache para saldo de stake do usuário
   */
  async setUserStakeBalance(contractAddress, userAddress, balance) {
    const key = this.generateKey('user', contractAddress, userAddress, 'balance');
    return this.set(key, balance, this.ttlConfig.userStakeBalance);
  }

  async getUserStakeBalance(contractAddress, userAddress) {
    const key = this.generateKey('user', contractAddress, userAddress, 'balance');
    return this.get(key);
  }

  /**
   * Cache para recompensas pendentes do usuário
   */
  async setUserPendingRewards(contractAddress, userAddress, rewards) {
    const key = this.generateKey('user', contractAddress, userAddress, 'rewards');
    return this.set(key, rewards, this.ttlConfig.userPendingRewards);
  }

  async getUserPendingRewards(contractAddress, userAddress) {
    const key = this.generateKey('user', contractAddress, userAddress, 'rewards');
    return this.get(key);
  }

  /**
   * Cache para informações do contrato
   */
  async setContractInfo(contractAddress, info) {
    const key = this.generateKey('contract', contractAddress, 'info');
    return this.set(key, info, this.ttlConfig.contractInfo);
  }

  async getContractInfo(contractAddress) {
    const key = this.generateKey('contract', contractAddress, 'info');
    return this.get(key);
  }

  /**
   * Cache para estatísticas do contrato
   */
  async setContractStats(contractAddress, stats) {
    const key = this.generateKey('contract', contractAddress, 'stats');
    return this.set(key, stats, this.ttlConfig.contractStatistics);
  }

  async getContractStats(contractAddress) {
    const key = this.generateKey('contract', contractAddress, 'stats');
    return this.get(key);
  }

  /**
   * Cache para status de transação
   */
  async setTransactionStatus(txHash, status) {
    const key = this.generateKey('transaction', txHash, 'status');
    const ttl = status === 'confirmed' ? this.ttlConfig.transactionReceipt : this.ttlConfig.transactionStatus;
    return this.set(key, status, ttl);
  }

  async getTransactionStatus(txHash) {
    const key = this.generateKey('transaction', txHash, 'status');
    return this.get(key);
  }

  // ===== INVALIDAÇÃO INTELIGENTE =====

  /**
   * Invalida cache relacionado a um usuário específico
   */
  async invalidateUser(userAddress, contractAddress = null) {
    try {
      let pattern;
      if (contractAddress) {
        pattern = this.generateKey('user', contractAddress, userAddress, '*');
      } else {
        pattern = this.generateKey('user', '*', userAddress, '*');
      }

      const keys = await redis.keys(pattern);
      
      if (keys.length > 0) {
        await redis.del(...keys);
        this.metrics.deletes += keys.length;
        await this.updateMetrics();
        logger.debug(`Cache invalidated for user: ${userAddress} (${keys.length} keys)`);
      }

      return keys.length;
    } catch (error) {
      this.metrics.errors++;
      await this.updateMetrics();
      logger.error('Cache user invalidation error:', { userAddress, contractAddress, error: error.message });
      return 0;
    }
  }

  /**
   * Invalida cache relacionado a um contrato específico
   */
  async invalidateContract(contractAddress) {
    try {
      const contractPattern = this.generateKey('contract', contractAddress, '*');
      const userPattern = this.generateKey('user', contractAddress, '*');
      
      const [contractKeys, userKeys] = await Promise.all([
        redis.keys(contractPattern),
        redis.keys(userPattern)
      ]);

      const allKeys = [...contractKeys, ...userKeys];
      
      if (allKeys.length > 0) {
        await redis.del(...allKeys);
        this.metrics.deletes += allKeys.length;
        await this.updateMetrics();
        logger.debug(`Cache invalidated for contract: ${contractAddress} (${allKeys.length} keys)`);
      }

      return allKeys.length;
    } catch (error) {
      this.metrics.errors++;
      await this.updateMetrics();
      logger.error('Cache contract invalidation error:', { contractAddress, error: error.message });
      return 0;
    }
  }

  /**
   * Invalida cache após uma operação específica
   */
  async invalidateAfterOperation(operationType, contractAddress, userAddress) {
    const invalidationMap = {
      'invest': ['userStakeBalance', 'userPendingRewards', 'contractStatistics', 'totalStakedSupply'],
      'withdraw': ['userStakeBalance', 'userPendingRewards', 'contractStatistics', 'totalStakedSupply'],
      'claim': ['userPendingRewards', 'contractStatistics'],
      'compound': ['userStakeBalance', 'userPendingRewards', 'contractStatistics', 'totalStakedSupply']
    };

    const keysToInvalidate = invalidationMap[operationType] || [];
    
    try {
      const promises = keysToInvalidate.map(keyType => {
        switch (keyType) {
          case 'userStakeBalance':
            return this.delete(this.generateKey('user', contractAddress, userAddress, 'balance'));
          case 'userPendingRewards':
            return this.delete(this.generateKey('user', contractAddress, userAddress, 'rewards'));
          case 'contractStatistics':
            return this.delete(this.generateKey('contract', contractAddress, 'stats'));
          case 'totalStakedSupply':
            return this.delete(this.generateKey('contract', contractAddress, 'supply'));
          default:
            return Promise.resolve(false);
        }
      });

      await Promise.all(promises);
      
      logger.debug(`Cache invalidated after ${operationType}:`, {
        contractAddress,
        userAddress,
        keysInvalidated: keysToInvalidate.length
      });
    } catch (error) {
      logger.error('Cache operation invalidation error:', {
        operationType,
        contractAddress,
        userAddress,
        error: error.message
      });
    }
  }

  // ===== TTL E CONFIGURAÇÃO =====

  /**
   * Obtém TTL padrão baseado no tipo de chave
   */
  getDefaultTTL(key) {
    if (key.includes(':user:') && key.includes(':balance')) return this.ttlConfig.userStakeBalance;
    if (key.includes(':user:') && key.includes(':rewards')) return this.ttlConfig.userPendingRewards;
    if (key.includes(':contract:') && key.includes(':info')) return this.ttlConfig.contractInfo;
    if (key.includes(':contract:') && key.includes(':stats')) return this.ttlConfig.contractStatistics;
    if (key.includes(':tx:')) return this.ttlConfig.transactionStatus;
    
    return 300; // TTL padrão: 5 minutos
  }

  /**
   * Atualiza TTL de uma chave existente
   */
  async updateTTL(key, newTTL) {
    try {
      await redis.expire(key, newTTL);
      logger.debug(`Cache TTL updated: ${key} (${newTTL}s)`);
      return true;
    } catch (error) {
      logger.error('Cache TTL update error:', { key, newTTL, error: error.message });
      return false;
    }
  }

  // ===== MÉTRICAS E MONITORING =====

  /**
   * Carrega métricas do Redis
   */
  async loadMetrics() {
    try {
      const key = this.generateKey('metrics', 'cache');
      const cached = await redis.get(key);
      
      if (cached) {
        const savedMetrics = JSON.parse(cached);
        this.metrics = { ...this.metrics, ...savedMetrics };
      }
    } catch (error) {
      logger.error('Error loading cache metrics:', error.message);
    }
  }

  /**
   * Salva métricas no Redis
   */
  async updateMetrics() {
    try {
      const key = this.generateKey('metrics', 'cache');
      await redis.setex(key, 3600, JSON.stringify({
        ...this.metrics,
        lastUpdated: Date.now()
      }));
    } catch (error) {
      logger.error('Error updating cache metrics:', error.message);
    }
  }

  /**
   * Obtém métricas atuais do cache
   */
  getMetrics() {
    const total = this.metrics.hits + this.metrics.misses;
    const hitRate = total > 0 ? (this.metrics.hits / total * 100) : 0;

    return {
      ...this.metrics,
      total,
      hitRate: Math.round(hitRate * 100) / 100
    };
  }

  /**
   * Reset das métricas
   */
  async resetMetrics() {
    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0
    };
    
    await this.updateMetrics();
  }

  // ===== OPERAÇÕES DE LIMPEZA =====

  /**
   * Remove entradas expiradas manualmente
   */
  async cleanupExpired() {
    try {
      const pattern = 'stake:*';
      const keys = await redis.keys(pattern);
      let cleanedCount = 0;

      for (const key of keys) {
        const ttl = await redis.ttl(key);
        if (ttl === -1) { // Chave sem TTL
          await redis.expire(key, this.getDefaultTTL(key));
        } else if (ttl === -2) { // Chave expirada
          await redis.del(key);
          cleanedCount++;
        }
      }

      logger.info(`Cache cleanup completed: ${cleanedCount} expired keys removed`);
      return cleanedCount;
    } catch (error) {
      logger.error('Cache cleanup error:', error.message);
      return 0;
    }
  }

  /**
   * Limpa todo o cache de stakes
   */
  async clearAll() {
    try {
      const pattern = 'stake:*';
      const keys = await redis.keys(pattern);
      
      if (keys.length > 0) {
        await redis.del(...keys);
        logger.info(`All stake cache cleared: ${keys.length} keys removed`);
      }

      return keys.length;
    } catch (error) {
      logger.error('Cache clear all error:', error.message);
      return 0;
    }
  }

  // ===== HEALTH CHECK =====

  /**
   * Verifica saúde do cache Redis
   */
  async healthCheck() {
    try {
      const testKey = 'stake:health:check';
      const testData = { timestamp: Date.now() };
      
      // Teste de escrita
      await redis.setex(testKey, 10, JSON.stringify(testData));
      
      // Teste de leitura
      const retrieved = await redis.get(testKey);
      const parsed = JSON.parse(retrieved);
      
      // Limpeza
      await redis.del(testKey);
      
      return {
        status: 'healthy',
        latency: Date.now() - parsed.timestamp,
        metrics: this.getMetrics()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        metrics: this.getMetrics()
      };
    }
  }
}

// Instância singleton do serviço
const stakeCacheService = new StakeCacheService();

module.exports = stakeCacheService;