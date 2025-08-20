import { useCallback, useEffect } from 'react';
import useAuthStore from '@/store/authStore';
import { userService } from '@/services/api';
import UserPlanService from '@/services/userPlanService';
import { useConfigContext } from '@/contexts/ConfigContext';

// Função para obter o intervalo baseado no plano do usuário
const getCacheDurationMs = (userPlan = 'BASIC') => {
  switch (userPlan) {
    case 'PREMIUM': return 1 * 60 * 1000; // 1 minuto para usuários premium
    case 'PRO': return 2 * 60 * 1000;     // 2 minutos para usuários pro
    case 'BASIC':
    default: return 5 * 60 * 1000;        // 5 minutos para usuários básicos
  }
};

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
  
  const { config } = useConfigContext();
  const defaultNetwork = config?.defaultNetwork;

  // Verificar se o cache é válido
  const isCacheValid = useCallback(() => {
    if (!cachedBalances || !balancesLastUpdate) return false;
    
    // Usar o intervalo baseado no plano do usuário
    const userPlan = user?.userPlan || 'BASIC';
    const cacheDuration = getCacheDurationMs(userPlan);
    
    return (Date.now() - balancesLastUpdate) < cacheDuration;
  }, [cachedBalances, balancesLastUpdate, user?.userPlan]);

  // Carregar balances da API
  const loadBalances = useCallback(async (force = false) => {
    if (!isAuthenticated || !user?.publicKey || !defaultNetwork) return;
    
    // Se o cache é válido e não é força, retorna o cache
    if (!force && isCacheValid()) {
      return cachedBalances;
    }

    // Evitar múltiplas requisições simultâneas
    if (balancesLoading && !force) return cachedBalances;

    try {
      setBalancesLoading(true);
      
      // console.log('🔧 [DEBUG] useCachedBalances usando network:', defaultNetwork);
      const response = await userService.getUserBalances(user.publicKey, defaultNetwork);
      
      if (response.success) {
        setCachedBalances(response.data);
        return response.data;
      } else {
        return cachedBalances; // Retorna cache anterior se houver erro
      }
    } catch (error) {
      return cachedBalances; // Retorna cache anterior se houver erro
    }
  }, [isAuthenticated, user?.publicKey, defaultNetwork, isCacheValid, cachedBalances, balancesLoading, setCachedBalances, setBalancesLoading]);

  // Carregar dados iniciais (sem incluir loadBalances na dependência)
  useEffect(() => {
    if (isAuthenticated && user?.publicKey) {
      loadBalances();
    } else {
      clearCachedBalances();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.publicKey]);

  // Auto-refresh baseado no plano do usuário
  useEffect(() => {
    if (!isAuthenticated || !user?.publicKey) return;

    // Obter o intervalo baseado no plano do usuário
    const userPlan = user?.userPlan || 'BASIC';
    const cacheDuration = getCacheDurationMs(userPlan);
    
    // console.log(`🔄 [CachedBalances] Configurando auto-refresh: ${cacheDuration/60000} minutos (plano: ${userPlan})`);

    const interval = setInterval(() => {
      loadBalances(); // Vai verificar se precisa atualizar baseado no cache
    }, cacheDuration);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.publicKey, user?.userPlan]);

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
    if (!cachedBalances) return defaultNetwork === 'testnet' ? 'AZE-t' : 'AZE';
    const network = cachedBalances.network || defaultNetwork;
    return network === 'testnet' ? 'AZE-t' : 'AZE';
  }, [cachedBalances, defaultNetwork]);

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