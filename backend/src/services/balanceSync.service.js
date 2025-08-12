const redisService = require('./redis.service');
const azoreScanService = require('./azorescan.service');

// Prefixos para as chaves do Redis
const REDIS_PREFIXES = {
  CACHE: 'balance_sync:cache',
  HISTORY: 'balance_sync:history',
  STATUS: 'balance_sync:status'
};

/**
 * Serviço para sincronização de balances com Redis
 */
class BalanceSyncService {
  
  /**
   * Gera chave Redis para cache de um usuário
   * @param {string} userId - ID do usuário
   * @param {string} address - Endereço da carteira
   * @returns {string} Chave Redis
   */
  generateCacheKey(userId, address) {
    return `${REDIS_PREFIXES.CACHE}:${userId}:${address}`;
  }

  /**
   * Gera chave Redis para histórico de um usuário
   * @param {string} userId - ID do usuário
   * @param {string} address - Endereço da carteira
   * @returns {string} Chave Redis
   */
  generateHistoryKey(userId, address) {
    return `${REDIS_PREFIXES.HISTORY}:${userId}:${address}`;
  }

  /**
   * Gera chave Redis para status de um usuário
   * @param {string} userId - ID do usuário
   * @param {string} address - Endereço da carteira
   * @returns {string} Chave Redis
   */
  generateStatusKey(userId, address) {
    return `${REDIS_PREFIXES.STATUS}:${userId}:${address}`;
  }

  /**
   * Busca cache Redis para um usuário
   * @param {string} userId - ID do usuário
   * @param {string} address - Endereço da carteira
   * @returns {Promise<Object|null>} Dados do cache ou null se não existir
   */
  async getCache(userId, address) {
    try {
      const cacheKey = this.generateCacheKey(userId, address);
      
      if (!redisService.isConnected || !redisService.client) {
        console.warn('⚠️ [BalanceSyncService] Redis não conectado');
        return null;
      }
      
      const cachedData = await redisService.client.get(cacheKey);
      
      if (!cachedData) {
        return null;
      }
      
      const parsedData = JSON.parse(cachedData);
      return parsedData;
      
    } catch (error) {
      console.error('❌ [BalanceSyncService] Erro ao buscar cache Redis:', error);
      return null;
    }
  }

  /**
   * Atualiza cache Redis com novos balances
   * @param {string} userId - ID do usuário
   * @param {string} address - Endereço da carteira
   * @param {Object} balances - Novos balances
   * @param {string} timestamp - Timestamp da atualização
   * @param {string} source - Fonte da atualização
   * @returns {Promise<Object>} Resultado da atualização
   */
  async updateCache(userId, address, balances, timestamp, source) {
    try {
      const cacheKey = this.generateCacheKey(userId, address);
      const historyKey = this.generateHistoryKey(userId, address);
      const statusKey = this.generateStatusKey(userId, address);
      
      if (!redisService.isConnected || !redisService.client) {
        console.warn('⚠️ [BalanceSyncService] Redis não conectado, pulando atualização');
        return { success: false, message: 'Redis não disponível' };
      }
      
      // Preparar dados para o cache
      const cacheData = {
        userId,
        address,
        balances,
        lastUpdated: timestamp || new Date().toISOString(),
        source: source || 'backend',
        version: '1.0'
      };
      
      // Salvar no cache principal
      await redisService.client.set(cacheKey, JSON.stringify(cacheData));
      
      // Adicionar ao histórico
      const historyEntry = {
        timestamp: timestamp || new Date().toISOString(),
        source: source || 'backend',
        balances: balances,
        action: 'update'
      };
      
      await redisService.client.lPush(historyKey, JSON.stringify(historyEntry));
      
      // Manter apenas os últimos 100 registros no histórico
      await redisService.client.lTrim(historyKey, 0, 99);
      
      // Atualizar status
      const statusData = {
        lastSync: timestamp || new Date().toISOString(),
        source: source || 'backend',
        status: 'synced',
        balanceCount: Object.keys(balances.balancesTable || {}).length
      };
      
      await redisService.client.set(statusKey, JSON.stringify(statusData));
      
      return {
        success: true,
        cacheKey,
        historyKey,
        statusKey,
        timestamp: cacheData.lastUpdated
      };
      
    } catch (error) {
      console.error('❌ [BalanceSyncService] Erro ao atualizar cache:', error);
      throw error;
    }
  }

  /**
   * Busca histórico de mudanças de um usuário
   * @param {string} userId - ID do usuário
   * @param {string} address - Endereço da carteira
   * @param {number} limit - Limite de registros
   * @returns {Promise<Array>} Histórico de mudanças
   */
  async getHistory(userId, address, limit = 50) {
    try {
      const historyKey = this.generateHistoryKey(userId, address);
      
      if (!redisService.isConnected || !redisService.client) {
        console.warn('⚠️ [BalanceSyncService] Redis não conectado');
        return [];
      }
      
      const historyData = await redisService.client.lRange(historyKey, 0, limit - 1);
      
      if (!historyData || historyData.length === 0) {
        return [];
      }
      
      const parsedHistory = historyData.map(entry => JSON.parse(entry));
      return parsedHistory;
      
    } catch (error) {
      console.error('❌ [BalanceSyncService] Erro ao buscar histórico:', error);
      throw error;
    }
  }

  /**
   * Limpa cache Redis para um usuário
   * @param {string} userId - ID do usuário
   * @param {string} address - Endereço da carteira
   * @returns {Promise<Object>} Resultado da limpeza
   */
  async clearCache(userId, address) {
    try {
      const cacheKey = this.generateCacheKey(userId, address);
      const historyKey = this.generateHistoryKey(userId, address);
      const statusKey = this.generateStatusKey(userId, address);
      
      if (!redisService.isConnected || !redisService.client) {
        console.warn('⚠️ [BalanceSyncService] Redis não conectado, pulando limpeza');
        return { success: false, message: 'Redis não disponível' };
      }
      
      // Remover todas as chaves relacionadas
      const keysToDelete = [cacheKey, historyKey, statusKey];
      const deletePromises = keysToDelete.map(key => redisService.client.del(key));
      
      await Promise.all(deletePromises);
      
      return {
        success: true,
        deletedKeys: keysToDelete,
        message: 'Cache limpo com sucesso'
      };
      
    } catch (error) {
      console.error('❌ [BalanceSyncService] Erro ao limpar cache:', error);
      throw error;
    }
  }

  /**
   * Busca status da sincronização
   * @param {string} userId - ID do usuário
   * @param {string} address - Endereço da carteira
   * @returns {Promise<Object>} Status da sincronização
   */
  async getStatus(userId, address) {
    try {
      const statusKey = this.generateStatusKey(userId, address);
      const cacheKey = this.generateCacheKey(userId, address);
      
      if (!redisService.isConnected || !redisService.client) {
        console.warn('⚠️ [BalanceSyncService] Redis não conectado');
        return {
          userId,
          address,
          status: 'disconnected',
          lastSync: null,
          source: null,
          balanceCount: 0,
          hasCache: false,
          cacheTimestamp: null
        };
      }
      
      const [statusData, cacheData] = await Promise.all([
        redisService.client.get(statusKey),
        redisService.client.get(cacheKey)
      ]);
      
      const status = statusData ? JSON.parse(statusData) : null;
      const cache = cacheData ? JSON.parse(cacheData) : null;
      
      const result = {
        userId,
        address,
        status: status?.status || 'unknown',
        lastSync: status?.lastSync || null,
        source: status?.source || null,
        balanceCount: status?.balanceCount || 0,
        hasCache: !!cache,
        cacheTimestamp: cache?.lastUpdated || null
      };
      
      return result;
      
    } catch (error) {
      console.error('❌ [BalanceSyncService] Erro ao buscar status:', error);
      throw error;
    }
  }

  /**
   * Busca todas as chaves relacionadas a um usuário
   * @param {string} userId - ID do usuário
   * @returns {Promise<Array>} Lista de chaves
   */
  async getUserKeys(userId) {
    try {
      const pattern = `${REDIS_PREFIXES.CACHE}:${userId}:*`;
      
      if (!redisService.isConnected || !redisService.client) {
        console.warn('⚠️ [BalanceSyncService] Redis não conectado');
        return [];
      }
      
      const keys = await redisService.client.keys(pattern);
      return keys;
      
    } catch (error) {
      console.error('❌ [BalanceSyncService] Erro ao buscar chaves do usuário:', error);
      throw error;
    }
  }

  /**
   * Limpa todos os dados de um usuário
   * @param {string} userId - ID do usuário
   * @returns {Promise<Object>} Resultado da limpeza
   */
  async clearUserData(userId) {
    try {
      const userKeys = await this.getUserKeys(userId);
      
      if (userKeys.length > 0) {
        await Promise.all(userKeys.map(key => redisService.client.del(key)));
      }
      
      return userKeys.length;
      
    } catch (error) {
      console.error('❌ [BalanceSyncService] Erro ao limpar dados do usuário:', error);
      throw error;
    }
  }

  /**
   * Busca balances frescos diretamente da blockchain (usando AzoreScan)
   * @param {string} address - Endereço da carteira
   * @param {string} network - Rede (testnet/mainnet)
   * @returns {Promise<Object>} Balances frescos da blockchain
   */
  async getFreshBalances(address, network = 'testnet') {
    try {
      console.log(`🔄 [BalanceSyncService] Buscando balances frescos para ${address} na ${network}`);
      
      // Buscar dados frescos do AzoreScan
      const azoreScanResponse = await azoreScanService.getCompleteBalances(address, network);
      
      if (!azoreScanResponse.success) {
        return {
          success: false,
          error: azoreScanResponse.error
        };
      }
      
      console.log(`✅ [BalanceSyncService] Balances frescos obtidos: ${azoreScanResponse.data.totalTokens} tokens`);
      
      return {
        success: true,
        data: azoreScanResponse.data
      };
      
    } catch (error) {
      console.error('❌ [BalanceSyncService] Erro ao buscar balances frescos:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new BalanceSyncService();
