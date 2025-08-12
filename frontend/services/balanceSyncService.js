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
   * @returns {Promise<Object>} Dados do cache Redis
   */
  async getRedisCache(userId, address) {
    try {
      console.log('📡 [BalanceSyncService] Buscando cache Redis para:', { userId, address });
      
      const response = await api.get(BALANCE_SYNC_ENDPOINTS.GET_CACHE, {
        params: { userId, address }
      });
      
      if (response.data.success) {
        console.log('✅ [BalanceSyncService] Cache Redis recuperado:', response.data.data);
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Erro ao buscar cache Redis');
      }
    } catch (error) {
      console.error('❌ [BalanceSyncService] Erro ao buscar cache Redis:', error);
      throw error;
    }
  }

  /**
   * Atualiza o cache Redis com novos balances
   * @param {string} userId - ID do usuário
   * @param {string} address - Endereço da carteira
   * @param {Object} balances - Novos balances
   * @returns {Promise<Object>} Resultado da atualização
   */
  async updateRedisCache(userId, address, balances) {
    try {
      console.log('📡 [BalanceSyncService] Atualizando cache Redis:', { userId, address, balances });
      
      const payload = {
        userId,
        address,
        balances,
        timestamp: new Date().toISOString(),
        source: 'frontend-sync'
      };
      
      const response = await api.post(BALANCE_SYNC_ENDPOINTS.UPDATE_CACHE, payload);
      
      if (response.data.success) {
        console.log('✅ [BalanceSyncService] Cache Redis atualizado com sucesso');
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Erro ao atualizar cache Redis');
      }
    } catch (error) {
      console.error('❌ [BalanceSyncService] Erro ao atualizar cache Redis:', error);
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
  async getChangeHistory(userId, address, limit = 50) {
    try {
      console.log('📡 [BalanceSyncService] Buscando histórico para:', { userId, address, limit });
      
      const response = await api.get(BALANCE_SYNC_ENDPOINTS.GET_HISTORY, {
        params: { userId, address, limit }
      });
      
      if (response.data.success) {
        console.log('✅ [BalanceSyncService] Histórico recuperado:', response.data.data);
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Erro ao buscar histórico');
      }
    } catch (error) {
      console.error('❌ [BalanceSyncService] Erro ao buscar histórico:', error);
      throw error;
    }
  }

  /**
   * Limpa o cache Redis para um usuário
   * @param {string} userId - ID do usuário
   * @param {string} address - Endereço da carteira
   * @returns {Promise<Object>} Resultado da limpeza
   */
  async clearRedisCache(userId, address) {
    try {
      console.log('📡 [BalanceSyncService] Limpando cache Redis para:', { userId, address });
      
      const response = await api.delete(BALANCE_SYNC_ENDPOINTS.CLEAR_CACHE, {
        params: { userId, address }
      });
      
      if (response.data.success) {
        console.log('✅ [BalanceSyncService] Cache Redis limpo com sucesso');
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Erro ao limpar cache Redis');
      }
    } catch (error) {
      console.error('❌ [BalanceSyncService] Erro ao limpar cache Redis:', error);
      throw error;
    }
  }

  /**
   * Compara balances locais com o cache Redis
   * @param {Object} localBalances - Balances locais
   * @param {Object} redisCache - Cache do Redis
   * @returns {Object} Resultado da comparação
   */
  compareWithRedis(localBalances, redisCache) {
    try {
      console.log('🔍 [BalanceSyncService] Comparando balances locais com Redis');
      console.log('  - Balances locais:', localBalances);
      console.log('  - Cache Redis:', redisCache);
      
      const comparison = {
        hasChanges: false,
        changes: [],
        localTimestamp: localBalances?.lastUpdated,
        redisTimestamp: redisCache?.lastUpdated,
        isOutOfSync: false
      };
      
      if (!redisCache || !redisCache.balancesTable) {
        console.log('ℹ️ [BalanceSyncService] Cache Redis vazio ou inválido');
        comparison.hasChanges = true;
        comparison.isOutOfSync = true;
        return comparison;
      }
      
      const localTable = localBalances?.balancesTable || {};
      const redisTable = redisCache.balancesTable || {};
      
      // Verificar se há diferenças
      const allTokens = new Set([...Object.keys(localTable), ...Object.keys(redisTable)]);
      
      allTokens.forEach(token => {
        const localBalance = parseFloat(localTable[token] || 0);
        const redisBalance = parseFloat(redisTable[token] || 0);
        
        if (Math.abs(localBalance - redisBalance) > 0.000001) {
          comparison.hasChanges = true;
          comparison.changes.push({
            token,
            localBalance: localBalance.toFixed(6),
            redisBalance: redisBalance.toFixed(6),
            difference: (localBalance - redisBalance).toFixed(6),
            type: localBalance > redisBalance ? 'increase' : 'decrease'
          });
        }
      });
      
      // Verificar se está fora de sincronia (diferença de timestamp > 5 minutos)
      if (localBalances?.lastUpdated && redisCache?.lastUpdated) {
        const localTime = new Date(localBalances.lastUpdated).getTime();
        const redisTime = new Date(redisCache.lastUpdated).getTime();
        const timeDiff = Math.abs(localTime - redisTime);
        
        if (timeDiff > 5 * 60 * 1000) { // 5 minutos
          comparison.isOutOfSync = true;
        }
      }
      
      console.log('🔍 [BalanceSyncService] Comparação concluída:', comparison);
      return comparison;
      
    } catch (error) {
      console.error('❌ [BalanceSyncService] Erro na comparação com Redis:', error);
      return {
        hasChanges: false,
        changes: [],
        error: error.message
      };
    }
  }

  /**
   * Sincroniza dados locais com o Redis
   * @param {string} userId - ID do usuário
   * @param {string} address - Endereço da carteira
   * @param {Object} localBalances - Balances locais
   * @returns {Promise<Object>} Resultado da sincronização
   */
  async syncWithRedis(userId, address, localBalances) {
    try {
      console.log('🔄 [BalanceSyncService] Sincronizando com Redis:', { userId, address });
      
      // Buscar cache atual do Redis
      const redisCache = await this.getRedisCache(userId, address);
      
      // Comparar balances
      const comparison = this.compareWithRedis(localBalances, redisCache);
      
      if (comparison.hasChanges || comparison.isOutOfSync) {
        console.log('📡 [BalanceSyncService] Mudanças detectadas, atualizando Redis...');
        
        // Atualizar Redis com dados locais
        const updateResult = await this.updateRedisCache(userId, address, localBalances);
        
        return {
          success: true,
          synced: true,
          changes: comparison.changes,
          comparison,
          updateResult
        };
      } else {
        console.log('ℹ️ [BalanceSyncService] Nenhuma mudança detectada, Redis já está sincronizado');
        
        return {
          success: true,
          synced: false,
          changes: [],
          comparison
        };
      }
      
    } catch (error) {
      console.error('❌ [BalanceSyncService] Erro na sincronização com Redis:', error);
      throw error;
    }
  }
}

export default new BalanceSyncService();
