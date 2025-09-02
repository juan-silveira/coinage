/**
 * useStakeData Hook - Hook para gerenciar dados de stake
 * 
 * Este hook centraliza o gerenciamento de dados de stake para um produto específico,
 * incluindo informações do contrato e dados do usuário, com cache automático e
 * atualizações em tempo real.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { stakeService } from '../services/stakeService';
import { getStakeProduct } from '../constants/stakeProducts';
import { useAuth } from './useAuth';

/**
 * Hook para gerenciar dados de stake de um produto específico
 * 
 * @param {string} productId - ID do produto de stake
 * @param {Object} options - Opções de configuração
 * @param {boolean} options.autoRefresh - Se deve fazer refresh automático dos dados
 * @param {number} options.refreshInterval - Intervalo de refresh em ms (padrão: 30s)
 * @param {boolean} options.fetchOnMount - Se deve buscar dados ao montar (padrão: true)
 * @param {string} options.userAddress - Address do usuário (opcional, usa o do contexto auth)
 */
export const useStakeData = (productId, options = {}) => {
  const {
    autoRefresh = false,
    refreshInterval = 30000, // 30 segundos
    fetchOnMount = true,
    userAddress: customUserAddress = null
  } = options;

  // States
  const [stakeData, setStakeData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  // Refs para cleanup
  const intervalRef = useRef(null);
  const mountedRef = useRef(true);

  // Auth context (assumindo que existe)
  const { user } = useAuth();
  const userAddress = customUserAddress || user?.walletAddress;

  // Obter configuração do produto
  const product = getStakeProduct(productId);
  const contractAddress = product?.contracts?.stake?.address;

  /**
   * Busca dados do stake
   */
  const fetchStakeData = useCallback(async (showLoading = true) => {
    if (!productId || !contractAddress || !userAddress) {
      return null;
    }

    if (showLoading) {
      setLoading(true);
    }
    setError(null);

    try {
      const data = await stakeService.getUserStakeData(contractAddress, userAddress);
      
      if (mountedRef.current) {
        setStakeData(data);
        setLastFetch(Date.now());
      }
      
      return data;
    } catch (err) {
      console.error(`Error fetching stake data for product ${productId}:`, err);
      
      if (mountedRef.current) {
        setError(err.message || 'Erro ao carregar dados do stake');
      }
      
      return null;
    } finally {
      if (mountedRef.current && showLoading) {
        setLoading(false);
      }
    }
  }, [productId, contractAddress, userAddress]);

  /**
   * Força refresh dos dados (limpa cache)
   */
  const refetch = useCallback(async () => {
    if (contractAddress && userAddress) {
      // Invalidar cache antes de buscar
      stakeService.invalidateCache(contractAddress, userAddress);
      return fetchStakeData(true);
    }
    return null;
  }, [contractAddress, userAddress, fetchStakeData]);

  /**
   * Refresh silencioso (sem mostrar loading)
   */
  const silentRefresh = useCallback(() => {
    return fetchStakeData(false);
  }, [fetchStakeData]);

  // Efeito para buscar dados iniciais
  useEffect(() => {
    if (fetchOnMount && productId && contractAddress && userAddress) {
      fetchStakeData(true);
    }
  }, [productId, contractAddress, userAddress, fetchOnMount, fetchStakeData]);

  // Efeito para auto-refresh
  useEffect(() => {
    if (autoRefresh && contractAddress && userAddress) {
      intervalRef.current = setInterval(() => {
        silentRefresh();
      }, refreshInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }
  }, [autoRefresh, refreshInterval, contractAddress, userAddress, silentRefresh]);

  // Cleanup ao desmontar
  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Dados computados
  const isReady = Boolean(productId && contractAddress && userAddress);
  const hasData = Boolean(stakeData);
  const isStale = lastFetch && Date.now() - lastFetch > refreshInterval;

  return {
    // Dados principais
    stakeData,
    product,
    
    // Estados
    loading,
    error,
    isReady,
    hasData,
    isStale,
    lastFetch,
    
    // Funções
    refetch,
    silentRefresh,
    
    // Dados específicos (para conveniência)
    contractInfo: stakeData?.contractInfo || null,
    userData: stakeData?.userData || null,
    
    // Estados derivados
    totalStakeBalance: stakeData?.userData?.totalStakeBalance || '0',
    pendingReward: stakeData?.userData?.pendingReward || '0',
    isBlacklisted: stakeData?.userData?.isBlacklisted || false,
    isWhitelisted: stakeData?.userData?.isWhitelisted || false
  };
};

/**
 * Hook para gerenciar dados de múltiplos produtos de stake
 * 
 * @param {string[]} productIds - Array de IDs dos produtos
 * @param {Object} options - Opções de configuração
 */
export const useMultipleStakeData = (productIds = [], options = {}) => {
  const {
    autoRefresh = false,
    refreshInterval = 30000,
    fetchOnMount = true,
    userAddress: customUserAddress = null,
    useMockData = true // Adicionar flag para usar mock data temporariamente
  } = options;

  // States
  const [stakeDataMap, setStakeDataMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [lastFetch, setLastFetch] = useState(null);

  // Refs
  const intervalRef = useRef(null);
  const mountedRef = useRef(true);

  // Auth context
  const { user } = useAuth();
  const userAddress = customUserAddress || user?.walletAddress;

  /**
   * Busca dados de todos os produtos
   */
  const fetchAllStakeData = useCallback(async (showLoading = true) => {
    if (!userAddress || productIds.length === 0) {
      return {};
    }

    if (showLoading) {
      setLoading(true);
    }

    try {
      // Se useMockData for true, retornar dados mock em vez de fazer chamada à API
      if (useMockData) {
        const dataMap = {};
        
        // Simular delay da API
        await new Promise(resolve => setTimeout(resolve, 300));
        
        productIds.forEach(productId => {
          // Gerar dados mock para cada produto
          dataMap[productId] = {
            contractInfo: {
              name: `Stake Contract ${productId}`,
              totalStakedSupply: '1000000000000000000000', // 1000 tokens
              numberOfActiveUsers: 42,
              stakingBlocked: false,
              allowPartialWithdrawal: true,
              isRestakeAllowed: true
            },
            userData: {
              userAddress,
              totalStakeBalance: '15000000000000000000', // 15 tokens
              pendingReward: '2054000000000000000', // 2.054 tokens
              isBlacklisted: false,
              isWhitelisted: true,
              lastStakeDate: Date.now() - 86400000, // 1 dia atrás
              totalRewardsClaimed: '5000000000000000000', // 5 tokens
              numberOfStakes: 3
            }
          };
        });
        
        if (mountedRef.current) {
          setStakeDataMap(dataMap);
          setErrors({});
          setLastFetch(Date.now());
        }
        
        return dataMap;
      }

      // Código original para API real
      const results = await stakeService.getAllUserStakeData(userAddress);
      
      const dataMap = {};
      const errorMap = {};
      
      results.forEach(result => {
        if (result.success) {
          dataMap[result.productId] = result.data;
        } else {
          errorMap[result.productId] = result.error;
        }
      });
      
      if (mountedRef.current) {
        setStakeDataMap(dataMap);
        setErrors(errorMap);
        setLastFetch(Date.now());
      }
      
      return dataMap;
    } catch (err) {
      console.error('Error fetching multiple stake data:', err);
      
      if (mountedRef.current) {
        const errorMap = {};
        productIds.forEach(id => {
          errorMap[id] = err.message || 'Erro ao carregar dados';
        });
        setErrors(errorMap);
      }
      
      return {};
    } finally {
      if (mountedRef.current && showLoading) {
        setLoading(false);
      }
    }
  }, [productIds, userAddress, useMockData]);

  /**
   * Refetch com limpeza de cache
   */
  const refetch = useCallback(async () => {
    if (userAddress) {
      // Invalidar todo o cache do usuário
      stakeService.invalidateCache(null, userAddress);
      return fetchAllStakeData(true);
    }
    return {};
  }, [userAddress, fetchAllStakeData]);

  /**
   * Refresh silencioso
   */
  const silentRefresh = useCallback(() => {
    return fetchAllStakeData(false);
  }, [fetchAllStakeData]);

  // Efeito para buscar dados iniciais
  useEffect(() => {
    if (fetchOnMount && userAddress && productIds.length > 0) {
      fetchAllStakeData(true);
    }
  }, [userAddress, productIds, fetchOnMount, fetchAllStakeData]);

  // Efeito para auto-refresh
  useEffect(() => {
    if (autoRefresh && userAddress && productIds.length > 0) {
      intervalRef.current = setInterval(() => {
        silentRefresh();
      }, refreshInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }
  }, [autoRefresh, refreshInterval, userAddress, productIds.length, silentRefresh]);

  // Cleanup
  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Dados computados
  const isReady = Boolean(userAddress && productIds.length > 0);
  const hasData = Object.keys(stakeDataMap).length > 0;
  const hasErrors = Object.keys(errors).length > 0;
  const isStale = lastFetch && Date.now() - lastFetch > refreshInterval;

  return {
    // Dados principais
    stakeDataMap,
    
    // Estados
    loading,
    errors,
    isReady,
    hasData,
    hasErrors,
    isStale,
    lastFetch,
    
    // Funções
    refetch,
    silentRefresh,
    
    // Funções utilitárias
    getStakeData: (productId) => stakeDataMap[productId] || null,
    getError: (productId) => errors[productId] || null,
    hasStakeData: (productId) => Boolean(stakeDataMap[productId]),
    hasError: (productId) => Boolean(errors[productId])
  };
};

/**
 * Hook para dados resumidos de stake (apenas totais)
 * 
 * @param {string} userAddress - Address do usuário
 */
export const useStakeSummary = (userAddress = null) => {
  const { user } = useAuth();
  const address = userAddress || user?.walletAddress;

  const { stakeDataMap, loading, errors, refetch } = useMultipleStakeData(
    Object.keys(stakeService.STAKE_PRODUCTS || {}),
    { userAddress: address, autoRefresh: true }
  );

  // Calcular totais
  const summary = Object.values(stakeDataMap).reduce(
    (acc, data) => {
      const stakeBalance = parseFloat(data?.userData?.totalStakeBalance || '0');
      const pendingReward = parseFloat(data?.userData?.pendingReward || '0');
      
      return {
        totalStaked: acc.totalStaked + stakeBalance,
        totalPendingRewards: acc.totalPendingRewards + pendingReward,
        activeProducts: acc.activeProducts + (stakeBalance > 0 ? 1 : 0)
      };
    },
    { totalStaked: 0, totalPendingRewards: 0, activeProducts: 0 }
  );

  return {
    summary,
    loading,
    hasErrors: Object.keys(errors).length > 0,
    refetch
  };
};

export default useStakeData;