import { useCallback, useEffect } from 'react';
import useAuthStore from '@/store/authStore';
import { userService } from '@/services/api';
import UserPlanService from '@/services/userPlanService';
import { useConfigContext } from '@/contexts/ConfigContext';
import redisBackupService from '@/services/redisBackupService';
import balanceBackupService from '@/services/balanceBackupService';

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

  // PROTEÇÃO CRÍTICA: Aplicar backup apenas quando realmente necessário (primeira carga)
  // DESABILITADO: Para evitar loops infinitos - será aplicado apenas no loadBalances se necessário

  // Verificar se o cache é válido
  const isCacheValid = useCallback(() => {
    if (!cachedBalances || !balancesLastUpdate) return false;
    
    // CRÍTICO: Verificar se o cache é do usuário atual (evitar cross-user contamination)
    if (cachedBalances.userId && user?.id && cachedBalances.userId !== user.id) {
      console.warn('⚠️ [CachedBalances] Cache de outro usuário detectado, invalidando');
      return false;
    }
    
    // Usar o intervalo baseado no plano do usuário
    const userPlan = user?.userPlan || 'BASIC';
    const cacheDuration = getCacheDurationMs(userPlan);
    
    return (Date.now() - balancesLastUpdate) < cacheDuration;
  }, [cachedBalances, balancesLastUpdate, user?.userPlan, user?.id]);

  // Carregar balances da API - usar cache quando possível
  const loadBalances = useCallback(async (force = false) => {
    if (!isAuthenticated || !user?.publicKey || !defaultNetwork) return;
    
    // Usar cache se disponível e válido (a menos que force = true)
    if (!force && cachedBalances && cachedBalances.userId === user?.id && isCacheValid()) {
      console.log('✅ [CachedBalances] Usando dados do cache válido');
      return cachedBalances;
    }

    // Evitar múltiplas requisições simultâneas
    if (balancesLoading && !force) {
      console.log('⚠️ [CachedBalances] Aguardando requisição em andamento...');
      return cachedBalances;
    }

    let safetyTimeout;
    try {
      setBalancesLoading(true);
      
      // Timeout de segurança para garantir que loading nunca fica preso
      safetyTimeout = setTimeout(() => {
        setBalancesLoading(false);
      }, 10000); // 10 segundos
      
      const response = await userService.getUserBalances(user.publicKey, defaultNetwork, true);
      
      if (response.success) {
        // ✅ API OK: Atualizar dados com timestamp fresh
        const balancesWithUserId = {
          ...response.data,
          userId: user.id,
          loadedAt: new Date().toISOString(),
          syncStatus: 'success',
          syncError: null,
          fromCache: false,
          isFreshData: true // Marcar como dados frescos
        };
        
        setCachedBalances(balancesWithUserId);
        
        // Salvar backup no Redis
        try {
          redisBackupService.saveUserBalanceBackup(user.publicKey, balancesWithUserId);
        } catch (redisError) {
          console.log('⚠️ [CachedBalances] Redis backup falhou (continuando):', redisError.message);
        }
        
        return balancesWithUserId;
      } else {
        // ❌ API com erro: Usar cache se disponível
        return await loadFromCache('API com erro');
      }
    } catch (error) {
      // ❌ API offline: Usar cache se disponível
      return await loadFromCache('API offline');
    } finally {
      clearTimeout(safetyTimeout);
      setBalancesLoading(false);
    }
  }, [isAuthenticated, user?.publicKey, defaultNetwork, isCacheValid]); // Removido cachedBalances, balancesLoading, setCachedBalances, setBalancesLoading

  // Função para carregar do cache quando API falha
  const loadFromCache = useCallback(async (reason = '') => {
    // CRÍTICO: Sempre parar loading primeiro
    setBalancesLoading(false);
    
    // Tentar cache atual primeiro
    if (cachedBalances && cachedBalances.userId === user?.id && cachedBalances.balancesTable) {
      const updatedCache = {
        ...cachedBalances,
        syncStatus: 'error',
        syncError: `${reason} - Mantendo dados em cache`,
        fromCache: true,
        lastApiError: new Date().toISOString()
      };
      setCachedBalances(updatedCache);
      return updatedCache;
    }

    // BACKUP ROBUSTO - NUNCA FALHA
    try {
      // console.log('🛡️ [CachedBalances] Tentando backup robusto...');
      const backupResult = await balanceBackupService.getBalances(user.id);
      
      if (backupResult && backupResult.data) {
        const balancesFromBackup = {
          ...backupResult.data,
          network: defaultNetwork,
          userId: user.id,
          loadedAt: new Date().toISOString(),
          syncStatus: 'error',
          syncError: `${reason} - Backup robusto (${backupResult.source})`,
          fromCache: true,
          isEmergency: backupResult.isEmergency || false
        };
        
        setCachedBalances(balancesFromBackup);
        // console.log('✅ [CachedBalances] Backup robusto carregado:', backupResult.source);
        return balancesFromBackup;
      }
    } catch (backupError) {
      // console.error('❌ [CachedBalances] Erro no backup robusto:', backupError);
    }

    // Se não tem cache atual, tentar backup Redis legado
    try {
      const userBackup = await redisBackupService.getUserBalanceBackup(user.publicKey);
      
      if (userBackup && userBackup.balancesTable && Object.keys(userBackup.balancesTable).length > 0) {
        const balancesFromBackup = {
          ...userBackup,
          network: defaultNetwork,
          userId: user.id,
          loadedAt: new Date().toISOString(),
          syncStatus: 'error',
          syncError: `${reason} - Usando backup Redis legado`,
          fromCache: true
        };
        setCachedBalances(balancesFromBackup);
        return balancesFromBackup;
      }
    } catch (backupError) {
      console.error('❌ [CachedBalances] Erro ao buscar backup Redis:', backupError);
    }
    
    // Se chegou até aqui, nenhum backup funcionou - usar balances vazios para novo usuário
    const emergencyBalances = {
      balancesTable: {
        'AZE-t': '0.000000',
        'cBRL': '0.000000',
        'STT': '0.000000'
      },
      network: defaultNetwork,
      userId: user.id,
      loadedAt: new Date().toISOString(),
      syncStatus: 'emergency',
      syncError: `${reason} - Sem dados disponíveis`,
      fromCache: true,
      isEmergency: true
    };
    
    setCachedBalances(emergencyBalances);
    return emergencyBalances;
  }, [user?.id, user?.publicKey, defaultNetwork]); // Removido cachedBalances, setCachedBalances, setBalancesLoading das dependências


  // Carregar dados iniciais
  useEffect(() => {
    if (isAuthenticated && user?.publicKey && user?.id) {
      // CRÍTICO: Verificar se há cache de outro usuário e limpar se necessário
      if (cachedBalances?.userId && user?.id && cachedBalances.userId !== user.id) {
        console.warn('🧹 [CachedBalances] Limpando cache de outro usuário');
        clearCachedBalances();
      }
      
      loadBalances();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.publicKey, user?.id]);

  // Auto-refresh baseado no plano do usuário - TEMPORARIAMENTE DESABILITADO PARA TESTE
  // useEffect(() => {
  //   if (!isAuthenticated || !user?.publicKey) return;

  //   // Obter o intervalo baseado no plano do usuário
  //   const userPlan = user?.userPlan || 'BASIC';
  //   const cacheDuration = getCacheDurationMs(userPlan);

  //   const interval = setInterval(() => {
  //     loadBalances(); // Vai verificar se precisa atualizar baseado no cache
  //   }, cacheDuration);

  //   return () => clearInterval(interval);
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [isAuthenticated, user?.publicKey, user?.userPlan]);

  // VALORES DE EMERGÊNCIA para useCachedBalances - Valores zerados para novos usuários
  const emergencyValues = {
    'AZE-t': '0.000000',
    'AZE': '0.000000',
    'cBRL': '0.000000',
    'STT': '0.000000'
  };

  // Funções de conveniência COM PROTEÇÃO TOTAL
  const getBalance = useCallback((symbol) => {
    if (!cachedBalances?.balancesTable) {
      return emergencyValues[symbol] || '0.000000';
    }
    
    const balance = cachedBalances.balancesTable[symbol];
    if (!balance || balance === '0' || balance === 0) {
      return emergencyValues[symbol] || '0.000000';
    }
    
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

  // Obter status de sincronização
  const getSyncStatus = useCallback(() => {
    // Se está loading e já tem dados, é atualização em background
    if (balancesLoading && cachedBalances && cachedBalances.balancesTable) {
      return {
        status: 'updating',
        error: null,
        lastSuccessfulSync: cachedBalances.lastSuccessfulSync || cachedBalances.timestamp,
        fromCache: cachedBalances.fromCache || false,
        loadingStartTime: Date.now(),
        isBackgroundUpdate: true
      };
    }
    
    // Se está loading e não tem dados, é loading inicial
    if (balancesLoading && (!cachedBalances || !cachedBalances.balancesTable)) {
      return { 
        status: 'loading',
        loadingStartTime: Date.now(),
        isInitialLoad: true
      };
    }
    
    // Se não está loading, retornar status normal
    if (!cachedBalances) {
      return { status: 'loading', loadingStartTime: Date.now() };
    }
    
    return {
      status: cachedBalances.syncStatus || 'success',
      error: cachedBalances.syncError || null,
      lastSuccessfulSync: cachedBalances.lastSuccessfulSync || cachedBalances.timestamp,
      fromCache: cachedBalances.fromCache || false,
      loadingStartTime: cachedBalances.loadingStartTime || null
    };
  }, [cachedBalances, balancesLoading]);

  return {
    balances: cachedBalances,
    loading: balancesLoading,
    isValid: isCacheValid(),
    lastUpdate: balancesLastUpdate,
    syncStatus: getSyncStatus(),
    reloadBalances: (force = false) => loadBalances(force),
    getBalance,
    formatBalance,
    getCorrectAzeSymbol,
  };
};

export default useCachedBalances;