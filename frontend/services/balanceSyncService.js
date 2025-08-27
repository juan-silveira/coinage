import api from './api';

const BALANCE_SYNC_ENDPOINTS = {
  GET_CACHE: '/api/balance-sync/cache',
  UPDATE_CACHE: '/api/balance-sync/cache',
  GET_HISTORY: '/api/balance-sync/history',
  CLEAR_CACHE: '/api/balance-sync/cache/clear'
};

/**
 * Serviço para integração do BalanceSync com o backend Redis
 */
class BalanceSyncService {
  
  /**
   * Busca o cache Redis atual para um usuário
   * @param {string} userId - ID do usuário
   * @param {string} address - Endereço da carteira
   * @param {string} network - Rede (mainnet/testnet)
   * @returns {Promise<Object>} Dados do cache Redis
   */
  async getRedisCache(userId, address, network) {
    try {
      const response = await api.get('/api/balance-sync/cache', {
        params: { userId, address, network }
      });
      
      if (response.data.success) {
        return response.data.data;
      }
      return null;
    } catch (error) {
      // console.error('❌ [BalanceSyncService] Erro ao buscar cache Redis:', error);
      return null;
    }
  }

  /**
   * Atualiza o cache Redis com novos balances
   * @param {string} userId - ID do usuário
   * @param {string} address - Endereço da carteira
   * @param {Object} balances - Novos balances
   * @param {string} network - Rede (mainnet/testnet)
   * @returns {Promise<Object>} Resultado da atualização
   */
  async updateRedisCache(userId, address, balances, network) {
    try {
      const response = await api.post('/api/balance-sync/cache', {
        userId,
        address,
        balances,
        network,
        timestamp: new Date().toISOString()
      });
      
      if (response.data.success) {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error('❌ [BalanceSyncService] Erro ao atualizar cache Redis:', error);
      return null;
    }
  }

  /**
   * Busca histórico de mudanças de um usuário
   * @param {string} userId - ID do usuário
   * @param {string} address - Endereço da carteira
   * @param {number} limit - Limite de registros
   * @param {string} network - Rede (mainnet/testnet)
   * @returns {Promise<Array>} Histórico de mudanças
   */
  async getChangeHistory(userId, address, limit = 50, network) {
    try {
      const response = await api.get('/api/balance-sync/history', {
        params: { userId, address, limit, network }
      });
      
      if (response.data.success) {
        return response.data.data;
      }
      return [];
    } catch (error) {
      console.error('❌ [BalanceSyncService] Erro ao buscar histórico:', error);
      return [];
    }
  }

  /**
   * Limpa o cache Redis para um usuário
   * @param {string} userId - ID do usuário
   * @param {string} address - Endereço da carteira
   * @param {string} network - Rede (mainnet/testnet)
   * @returns {Promise<Object>} Resultado da limpeza
   */
  async clearRedisCache(userId, address, network) {
    try {
      const response = await api.delete('/api/balance-sync/cache/clear', {
        params: { userId, address, network }
      });
      
      if (response.data.success) {
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ [BalanceSyncService] Erro ao limpar cache Redis:', error);
      return false;
    }
  }

  /**
   * Compara balances locais com o cache Redis
   * @param {Object} localBalances - Balances locais
   * @param {Object} redisCache - Cache do Redis
   * @returns {Object} Resultado da comparação
   */
  compareWithRedis(localBalances, redisCache) {
    if (!redisCache || !redisCache.balancesTable) {
      return { synced: false, changes: [], reason: 'cache_vazio' };
    }

    const changes = [];
    const localTable = localBalances?.balancesTable || {};
    const redisTable = redisCache.balancesTable || {};

    // Verificar mudanças em tokens existentes
    Object.keys(localTable).forEach(token => {
      const localValue = parseFloat(localTable[token] || 0);
      const redisValue = parseFloat(redisTable[token] || 0);
      
      if (Math.abs(localValue - redisValue) > 0.000001) {
        changes.push({
          token,
          localValue: localValue.toFixed(6),
          redisValue: redisValue.toFixed(6),
          difference: (localValue - redisValue).toFixed(6),
          type: localValue > redisValue ? 'increase' : 'decrease'
        });
      }
    });

    // Verificar novos tokens
    Object.keys(localTable).forEach(token => {
      if (!(token in redisTable) && parseFloat(localTable[token] || 0) > 0) {
        changes.push({
          token,
          localValue: parseFloat(localTable[token]).toFixed(6),
          redisValue: '0.000000',
          difference: parseFloat(localTable[token]).toFixed(6),
          type: 'new_token'
        });
      }
    });

    // Verificar tokens removidos
    Object.keys(redisTable).forEach(token => {
      if (!(token in localTable) && parseFloat(redisTable[token] || 0) > 0) {
        changes.push({
          token,
          localValue: '0.000000',
          redisValue: parseFloat(redisTable[token]).toFixed(6),
          difference: (-parseFloat(redisTable[token])).toFixed(6),
          type: 'removed_token'
        });
      }
    });

    return {
      synced: changes.length === 0,
      changes,
      reason: changes.length === 0 ? 'sincronizado' : 'mudanças_detectadas'
    };
  }

  /**
   * Sincroniza dados locais com o Redis
   * @param {string} userId - ID do usuário
   * @param {string} address - Endereço da carteira
   * @param {Object} localBalances - Balances locais
   * @param {string} network - Rede (mainnet/testnet)
   * @returns {Promise<Object>} Resultado da sincronização
   */
  async syncWithRedis(userId, address, localBalances, network) {
    try {
      // Buscar cache atual do Redis
      const redisCache = await this.getRedisCache(userId, address, network);
      
      // Comparar balances locais com Redis
      const comparison = this.compareWithRedis(localBalances, redisCache);
      
      if (comparison.changes.length > 0) {
        // Atualizar Redis com novos balances
        const updateResult = await this.updateRedisCache(userId, address, localBalances, network);
        
        if (updateResult) {
          return {
            success: true,
            synced: true,
            changes: comparison.changes,
            reason: 'redis_atualizado'
          };
        } else {
          throw new Error('Falha ao atualizar Redis');
        }
      } else {
        return {
          success: true,
          synced: true,
          changes: [],
          reason: 'já_sincronizado'
        };
      }
      
    } catch (error) {
      console.error('❌ [BalanceSyncService] Erro na sincronização com Redis:', error);
      return {
        success: false,
        synced: false,
        changes: [],
        reason: 'erro_sincronizacao',
        error: error.message
      };
    }
  }
}

export default new BalanceSyncService();
