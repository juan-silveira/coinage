import { useCallback, useEffect } from 'react';
import useAuthStore from '@/store/authStore';
import { userService } from '@/services/api';

const CACHE_DURATION_MS = 60 * 1000; // 60 segundos

export const useCachedBalances = () => {
  const { 
    isAuthenticated, 
    user,
    cachedBalances, 
    balancesLastUpdate, 
    balancesLoading,
    setCachedBalances,
    setBalancesLoading,
    clearCachedBalances
  } = useAuthStore();

  // Verificar se o cache é válido
  const isCacheValid = useCallback(() => {
    if (!cachedBalances || !balancesLastUpdate) return false;
    return (Date.now() - balancesLastUpdate) < CACHE_DURATION_MS;
  }, [cachedBalances, balancesLastUpdate]);

  // Carregar balances da API
  const loadBalances = useCallback(async (force = false) => {
    if (!isAuthenticated || !user?.publicKey) return;
    
    // Se o cache é válido e não é força, retorna o cache
    if (!force && isCacheValid()) {
      return cachedBalances;
    }

    // Evitar múltiplas requisições simultâneas
    if (balancesLoading && !force) return cachedBalances;

    try {
      setBalancesLoading(true);
      
      const response = await userService.getUserBalances(user.publicKey);
      
      if (response.success) {
        setCachedBalances(response.data);
        return response.data;
      } else {
        return cachedBalances; // Retorna cache anterior se houver erro
      }
    } catch (error) {
      return cachedBalances; // Retorna cache anterior se houver erro
    }
  }, [isAuthenticated, user?.publicKey, isCacheValid, cachedBalances, balancesLoading, setCachedBalances, setBalancesLoading]);

  // Carregar dados iniciais
  useEffect(() => {
    if (isAuthenticated && user?.publicKey) {
      loadBalances();
    } else {
      clearCachedBalances();
    }
  }, [isAuthenticated, user?.publicKey, loadBalances, clearCachedBalances]);

  // Auto-refresh a cada 60 segundos
  useEffect(() => {
    if (!isAuthenticated || !user?.publicKey) return;

    const interval = setInterval(() => {
      loadBalances(); // Vai verificar se precisa atualizar baseado no cache
    }, CACHE_DURATION_MS);

    return () => clearInterval(interval);
  }, [isAuthenticated, user?.publicKey, loadBalances]);

  // Funções de conveniência
  const getBalance = useCallback((symbol) => {
    if (!cachedBalances?.balancesTable) return '0.000000';
    const balance = cachedBalances.balancesTable[symbol];
    if (!balance || balance === '0' || balance === 0) return '0.000000';
    return parseFloat(balance).toFixed(6);
  }, [cachedBalances]);

  const formatBalance = useCallback((balance) => {
    if (!balance || balance === '0' || balance === 0) return '0.000000';
    return parseFloat(balance).toFixed(6);
  }, []);

  const getCorrectAzeSymbol = useCallback(() => {
    if (!cachedBalances) return 'AZE';
    const network = cachedBalances.network || 'testnet';
    return network === 'testnet' ? 'AZE-t' : 'AZE';
  }, [cachedBalances]);

  return {
    balances: cachedBalances,
    loading: balancesLoading,
    isValid: isCacheValid(),
    lastUpdate: balancesLastUpdate,
    reloadBalances: () => loadBalances(true),
    getBalance,
    formatBalance,
    getCorrectAzeSymbol,
  };
};

export default useCachedBalances;