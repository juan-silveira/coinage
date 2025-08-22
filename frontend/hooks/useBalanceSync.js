import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import useAuthStore from '@/store/authStore';
// Alert context removido - sistema totalmente silencioso
import api from '@/services/api';
import balanceSyncService from '@/services/balanceSyncService';
import balanceBackupService from '@/services/balanceBackupService';
import { useNotificationEvents } from '@/contexts/NotificationContext';
import { useConfigContext } from '@/contexts/ConfigContext';

// Função para obter o intervalo baseado no plano do usuário
const getSyncIntervalMs = (userPlan = 'BASIC') => {
  switch (userPlan) {
    case 'PREMIUM': return 1 * 60 * 1000; // 1 minuto para usuários premium
    case 'PRO': return 2 * 60 * 1000;     // 2 minutos para usuários pro
    case 'BASIC':
    default: return 5 * 60 * 1000;        // 5 minutos para usuários básicos
  }
};
// REMOVIDO: CACHE_KEY_PREFIX não é mais usado para localStorage

// Cache global para evitar notificações duplicadas
// REMOVIDO: NOTIFICATION_CACHE_KEY não é mais usado para localStorage
// const NOTIFICATION_CACHE_KEY = 'balanceSync_notifications_sent';
// const NOTIFICATION_CACHE_TTL = 60 * 60 * 1000; // 1 hora

// Cache em memória para evitar notificações duplicadas
const notificationCache = new Map();
const NOTIFICATION_CACHE_TTL = 60 * 60 * 1000; // 1 hora

// REMOVIDO: Flag global que estava causando problemas

const useBalanceSync = (onBalanceUpdate = null) => {
  // Store - SEMPRE chamar hooks no mesmo nível
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [isActive, setIsActive] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [syncError, setSyncError] = useState(null);
  const [balanceChanges, setBalanceChanges] = useState([]);
  const [redisSyncStatus, setRedisSyncStatus] = useState('idle'); // idle, syncing, synced, error
  
  // Referências para cancelar operações em andamento
  const abortControllerRef = useRef(null);
  const notifications = useAuthStore((s) => s.notifications);
  const addNotification = useAuthStore((s) => s.addNotification);
  const cachedBalances = useAuthStore((s) => s.cachedBalances);
  const setCachedBalances = useAuthStore((s) => s.setCachedBalances);
  const balancesLastUpdate = useAuthStore((s) => s.balancesLastUpdate);
  
  // Notification events para tocar som
  const { notifyNewNotification } = useNotificationEvents();
  
  // Config
  const { config } = useConfigContext();
  const defaultNetwork = config?.defaultNetwork;
  const currentExplorerUrl = config?.defaultNetwork === 'mainnet'
    ? config?.mainnetExplorerUrl
    : config?.testnetExplorerUrl;

  // Refs
  const syncIntervalRef = useRef(null);
  const previousBalancesRef = useRef({});
  const isActiveRef = useRef(false);

  // Sistema totalmente silencioso - sem alerts/toasts

  // REMOVIDO: Funções de localStorage não são mais necessárias
  // Os dados de balance são gerenciados pelo Redis através do backend

  // Busca balances diretamente da API do Azorescan
  const fetchBalancesFromAzorescan = useCallback(async (address) => {
    try {
      // console.log('🔄 [BalanceSync] Buscando balances do Azorescan para:', address);
      
      // Fazer duas chamadas: uma para tokens ERC-20 e outra para balance nativo
      const [tokensResponse, balanceResponse] = await Promise.all([
        // Buscar tokens ERC-20
        fetch(`${currentExplorerUrl}/?module=account&action=tokenlist&address=${address}`),
        // Buscar balance nativo AZE-t
        fetch(`${currentExplorerUrl}/?module=account&action=balance&address=${address}&tag=latest`)
      ]);
      
      if (!tokensResponse.ok || !balanceResponse.ok) {
        throw new Error(`HTTP error! tokens: ${tokensResponse.status}, balance: ${balanceResponse.status}`);
      }
      
      const [tokensData, balanceData] = await Promise.all([
        tokensResponse.json(),
        balanceResponse.json()
      ]);
      
      if (tokensData.status !== '1' && tokensData.message !== 'No tokens found') {
        throw new Error(`Tokens API error: ${tokensData.message || 'Unknown error'}`);
      }
      
      if (balanceData.status !== '1') {
        throw new Error(`Balance API error: ${balanceData.message || 'Unknown error'}`);
      }
      
      // Transformar dados da API do Azorescan para o formato esperado
      const transformedBalances = {
        network: defaultNetwork, // Usar rede da configuração
        address: address,
        balancesTable: {},
        lastUpdated: new Date().toISOString(),
        source: 'azorescan'
      };
      
      // Adicionar balance nativo AZE-t primeiro
      if (balanceData.result) {
        const nativeBalance = parseFloat(balanceData.result) / Math.pow(10, 18); // AZE-t tem 18 decimais
        transformedBalances.balancesTable['AZE-t'] = nativeBalance.toFixed(6);
        // console.log('💰 [BalanceSync] Balance nativo AZE-t detectado:', nativeBalance.toFixed(6));
      }
      
      // Processar tokens ERC-20 se existirem
      if (tokensData.result && Array.isArray(tokensData.result)) {
        tokensData.result.forEach(token => {
          const symbol = token.symbol;
          const balance = parseFloat(token.balance) / Math.pow(10, parseInt(token.decimals));
          
          transformedBalances.balancesTable[symbol] = balance.toFixed(6);
        });
      }
      
      // Log detalhado dos valores detectados no refresh
      // console.log('🆕 [BalanceSync] Valores detectados no refresh:', {
      //   address,
      //   totalTokens: Object.keys(transformedBalances.balancesTable).length,
      //   detectedBalances: transformedBalances.balancesTable,
      //   incluiAZEt: 'AZE-t' in transformedBalances.balancesTable,
      //   balanceAZEt: transformedBalances.balancesTable['AZE-t'] || 'não encontrado',
      //   timestamp: transformedBalances.lastUpdated,
      //   rawApiResponses: {
      //     tokens: tokensData.result?.length || 0,
      //     nativeBalance: balanceData.result || 'erro'
      //   }
      // });
      
      return transformedBalances;
      
    } catch (error) {
      console.error('❌ [BalanceSync] Erro ao buscar balances da API Azorescan:', error);
      throw error;
    }
  }, [defaultNetwork, currentExplorerUrl]);

  // Sincroniza com Redis
  const syncWithRedis = useCallback(async (balances) => {
    if (!user?.id || !user?.publicKey) {
      return null;
    }

    try {
      setRedisSyncStatus('syncing');
      
      const result = await balanceSyncService.syncWithRedis(
        user.id,
        user.publicKey,
        balances,
        defaultNetwork
      );
      
      if (result && result.success) {
        setRedisSyncStatus('synced');
        
        // Redis sincronizado silenciosamente
        
        return result;
      } else {
        // Falha silenciosa se Redis não estiver disponível
        setRedisSyncStatus('error');
        console.warn('⚠️ [BalanceSync] Redis não disponível, continuando sem sync');
        return { success: false, synced: false, changes: [] };
      }
      
    } catch (error) {
      setRedisSyncStatus('error');
      console.warn('⚠️ [BalanceSync] Erro na sincronização com Redis (continuando):', {
        error: error.message,
        status: error.response?.status,
        userId: user?.id
      });
      // Não mostrar erro para usuário, continuar sem Redis
      return { success: false, synced: false, changes: [] };
    }
  }, [user?.id, user?.publicKey, defaultNetwork]);

  // Compara balances e detecta mudanças (PROTEGIDO CONTRA CRASHES)
  const detectBalanceChanges = useCallback((newBalances, previousBalances) => {
    try {
      const changes = [];
      const newTable = newBalances?.balancesTable || {};
      const prevTable = previousBalances?.balancesTable || {};

      // Log detalhado da comparação
      // console.log('🔍 [BalanceSync] Comparando balances:', {
      //   novosBalances: newTable,
      //   balancesAnteriores: prevTable,
      //   temBalancesAnteriores: Object.keys(prevTable).length > 0,
      //   totalTokensNovos: Object.keys(newTable).length,
      //   totalTokensAnteriores: Object.keys(prevTable).length
      // });

      // Função para comparar valores com tolerância para problemas de precisão
      const isSignificantChange = (newVal, oldVal, tolerance = 0.000001) => {
        const diff = Math.abs(newVal - oldVal);
        return diff > tolerance;
      };

      // Verificar mudanças em tokens existentes
      Object.keys(newTable).forEach(token => {
        const newBalance = parseFloat(newTable[token] || 0);
        const prevBalance = parseFloat(prevTable[token] || 0);
        
        // console.log(`🔢 [BalanceSync] Comparando token ${token}:`, {
        //   balanceAnterior: prevBalance.toFixed(6),
        //   balanceNovo: newBalance.toFixed(6),
        //   diferenca: (newBalance - prevBalance).toFixed(6),
        //   ehMudancaSignificativa: isSignificantChange(newBalance, prevBalance)
        // });
        
        // PROTEÇÃO: NUNCA notificar mudanças para 0 ou de 0
        if (isSignificantChange(newBalance, prevBalance) && newBalance > 0 && prevBalance > 0) {
          const difference = newBalance - prevBalance;
          
          changes.push({
            token,
            previousBalance: prevBalance.toFixed(6),
            newBalance: newBalance.toFixed(6),
            difference: difference.toFixed(6),
            type: difference > 0 ? 'increase' : 'decrease',
            timestamp: new Date().toISOString()
          });
        }
      });

      // Verificar novos tokens - MAS BLOQUEAR TOKENS QUE JÁ EXISTIAM (evita notificação de "novo token" quando API volta)
      Object.keys(newTable).forEach(token => {
        if (!(token in prevTable) && parseFloat(newTable[token] || 0) > 0) {
          // VERIFICAR SE É REALMENTE NOVO OU SE ESTAVA COM VALOR DE EMERGÊNCIA
          const emergencyTokens = ['AZE-t', 'AZE', 'cBRL', 'STT'];
          const isKnownToken = emergencyTokens.includes(token);
          
          if (!isKnownToken) {
            // Token realmente novo
            changes.push({
              token,
              previousBalance: '0.000000',
              newBalance: parseFloat(newTable[token]).toFixed(6),
              difference: parseFloat(newTable[token]).toFixed(6),
              type: 'new_token',
              timestamp: new Date().toISOString()
            });
          }
        }
      });

      // Verificar tokens que foram removidos ou zerados - MAS BLOQUEAR NOTIFICAÇÕES PARA ZEROS
      Object.keys(prevTable).forEach(token => {
        // Tokens removidos/zerados não geram notificações
        if (!(token in newTable) || parseFloat(newTable[token] || 0) === 0) {
          // Bloquear notificações de tokens que desapareceram/zeraram
        }
      });

      // Log final do resultado da comparação
      // console.log('📊 [BalanceSync] Resultado da comparação:', {
      //   totalMudancas: changes.length,
      //   mudancasDetectadas: changes,
      //   resumo: changes.length === 0 ? 'Nenhuma mudança detectada' : `${changes.length} mudança(s) detectada(s)`
      // });

      return changes;
      
    } catch (error) {
      console.error('❌ [BalanceSync] ERRO CRÍTICO na detecção de mudanças (CRASH EVITADO):', error);
      console.error('❌ [BalanceSync] Stack trace:', error.stack);
      console.error('❌ [BalanceSync] Dados que causaram erro:', { newBalances, previousBalances });
      
      // Retornar array vazio para evitar crash
      return [];
    }
  }, []);

  // Função para verificar se notificação já foi enviada
  const isNotificationAlreadySent = useCallback((change) => {
    try {
      const cache = notificationCache.get(change.token);
      if (!cache) return false;
      
      const { notifications, timestamp } = cache;
      
      // Verificar se cache expirou (1 hora)
      if (Date.now() - timestamp > NOTIFICATION_CACHE_TTL) {
        notificationCache.delete(change.token);
        return false;
      }
      
      // Criar chave única para esta notificação
      const notificationKey = `${change.token}_${change.type}_${change.difference}_${change.newBalance}`;
      
      return notifications.includes(notificationKey);
    } catch (error) {
      console.error('❌ [BalanceSync] Erro ao verificar cache de notificações:', error);
      return false;
    }
  }, []);

  // Função para marcar notificação como enviada
  const markNotificationAsSent = useCallback((change) => {
    try {
      let cache = { notifications: [], timestamp: Date.now() };
      
      try {
        const existing = notificationCache.get(change.token);
        if (existing) {
          cache = existing;
        }
      } catch (parseError) {
        // Usar cache vazio se erro no parse
      }
      
      // Criar chave única para esta notificação
      const notificationKey = `${change.token}_${change.type}_${change.difference}_${change.newBalance}`;
      
      if (!cache.notifications.includes(notificationKey)) {
        cache.notifications.push(notificationKey);
        cache.timestamp = Date.now();
        
        // Manter apenas últimas 50 notificações para evitar crescimento excessivo
        if (cache.notifications.length > 50) {
          cache.notifications = cache.notifications.slice(-50);
        }
        
        notificationCache.set(change.token, cache);
      }
    } catch (error) {
      console.error('❌ [BalanceSync] Erro ao salvar cache de notificações:', error);
    }
  }, []);

  // Cria notificação para mudança de saldo (PROTEGIDO CONTRA CRASHES)
  const createBalanceNotification = useCallback(async (change) => {
    try {
      // Validar dados de entrada
      if (!change || typeof change !== 'object') {
        throw new Error('Dados de mudança inválidos');
      }
      
      const { token, difference, type, newBalance, isOfflineDetection } = change;
      
      // Verificar se notificação já foi enviada para evitar duplicatas
      if (isNotificationAlreadySent(change)) {
        // console.log('🚫 [BalanceSync] Notificação já enviada, ignorando duplicata:', change);
        return;
      }
      
      if (!token || !difference || !type || !newBalance) {
        throw new Error(`Campos obrigatórios faltando: ${JSON.stringify(change)}`);
      }
    
      let title, message, notificationType;
    
      const networkLabel = defaultNetwork === 'mainnet' ? 'Mainnet' : 'Testnet';
      
      switch (type) {
        case 'increase':
          title = `💰 Saldo Aumentado - ${token} (${networkLabel})`;
          message = isOfflineDetection 
            ? `Detectado no login: Seu saldo de ${token} aumentou em ${difference} na ${networkLabel}. Novo saldo: ${newBalance}`
            : `Seu saldo de ${token} aumentou em ${difference} na ${networkLabel}. Novo saldo: ${newBalance}`;
          notificationType = 'balance_increase';
          break;
        case 'decrease':
          title = `📉 Saldo Reduzido - ${token} (${networkLabel})`;
          message = isOfflineDetection
            ? `Detectado no login: Seu saldo de ${token} diminuiu em ${Math.abs(difference)} na ${networkLabel}. Novo saldo: ${newBalance}`
            : `Seu saldo de ${token} diminuiu em ${Math.abs(difference)} na ${networkLabel}. Novo saldo: ${newBalance}`;
          notificationType = 'balance_decrease';
          break;
        case 'new_token':
          title = `🆕 Novo Token Recebido - ${token} (${networkLabel})`;
          message = isOfflineDetection
            ? `Detectado no login: Você recebeu ${newBalance} ${token} em sua carteira na ${networkLabel}`
            : `Você recebeu ${newBalance} ${token} em sua carteira na ${networkLabel}`;
          notificationType = 'new_token';
          break;
        default:
          return;
      }

      const notificationData = {
        title,
        message,
        type: notificationType,
        data: {
          token,
          change: difference,
          newBalance,
          changeType: type,
          network: defaultNetwork,
          networkLabel
        }
      };

      // Adicionar ao store de notificações (local)
      if (addNotification) {
        addNotification({
          id: `balance_${token}_${Date.now()}`,
          ...notificationData,
          timestamp: new Date().toISOString(),
          isRead: false
        });
      }

      // Enviar para API do backend
      try {
        const apiPayload = {
          userId: user.id,
          title,
          message,
          sender: 'coinage',
          data: notificationData.data
        };
        
        // console.log('📤 [BalanceSync] Enviando notificação para API:', apiPayload);
        
        const response = await api.post('/api/notifications/create', apiPayload);
        
        // console.log('✅ [BalanceSync] Notificação criada com sucesso:', response.data);
        
        // Disparar evento para atualizar o dropdown de notificações
        if (response.data.success && response.data.data) {
          const newNotification = response.data.data;
          
          // Disparar evento customizado para notificar o sistema
          window.dispatchEvent(new CustomEvent('notificationCreated', { 
            detail: { notification: newNotification } 
          }));
          
          // Tocar som de notificação diretamente
          if (notifyNewNotification) {
            notifyNewNotification(newNotification);
          }
          
          // Marcar notificação como enviada para evitar duplicatas
          markNotificationAsSent(change);
          
          // console.log('🔔 [BalanceSync] Evento de nova notificação disparado');
        }
        
      } catch (apiError) {
        console.error('❌ [BalanceSync] Erro ao enviar notificação para API:', apiError);
        console.error('❌ [BalanceSync] Detalhes do erro:', apiError.response?.data);
        console.error('❌ [BalanceSync] Status:', apiError.response?.status);
        // Continuar mesmo se API falhar - a notificação local ainda funciona
      }

      // Não mostrar toast - a notificação já será exibida no dropdown com som

    } catch (error) {
      console.error('❌ [BalanceSync] ERRO CRÍTICO na criação de notificação (CRASH EVITADO):', error);
      console.error('❌ [BalanceSync] Stack trace:', error.stack);
      console.error('❌ [BalanceSync] Dados que causaram erro:', change);
      
      // Não propagar o erro para evitar crash do sistema
      return false;
    }
  }, [addNotification, user?.id, notifyNewNotification, isNotificationAlreadySent, markNotificationAsSent, defaultNetwork]);

  // IMPLEMENTA FALLBACK ULTRA ROBUSTO: API → Redis → AuthStore → Backup Robusto → NUNCA 0
  const getBalancesWithFallback = useCallback(async () => {
    // PROTEÇÃO CRÍTICA: Não fazer chamadas API se usuário não está autenticado
    if (!user?.publicKey || !user?.id || !isAuthenticated) {
      return {
        data: null,
        source: 'no_user',
        success: false,
        error: 'Usuário não autenticado'
      };
    }
    
    // 1. TENTAR API BLOCKCHAIN
    try {
      // Criar AbortController para cancelar se necessário
      abortControllerRef.current = new AbortController();
      
      const response = await api.get(`/api/balance-sync/fresh?address=${user.publicKey}&network=${defaultNetwork}`, {
        signal: abortControllerRef.current.signal
      });
      
      if (response.data.success && response.data.data && response.data.data.balancesTable && Object.keys(response.data.data.balancesTable).length > 0) {
        
        // SALVAR EM TODOS OS BACKUPS
        await balanceBackupService.saveBalances(user.id, response.data.data, 'api');
        
        return {
          data: response.data.data,
          source: 'api',
          success: true
        };
      }
    } catch (apiError) {
      // Se requisição foi cancelada (logout), parar silenciosamente
      if (apiError.name === 'AbortError' || apiError.message?.includes('aborted')) {
        return {
          data: null,
          source: 'aborted',
          success: false,
          error: 'Requisição cancelada'
        };
      }
      
      // Se erro de autenticação (incluindo bloqueio pelo interceptor ou silenciado), usuário foi deslogado - parar sync
      if (apiError.response?.status === 401 || apiError.response?.status === 403 || 
          apiError.code === 'USER_NOT_AUTHENTICATED' || 
          apiError.code === 'USER_NOT_AUTHENTICATED_SILENT' ||
          apiError.code === 'BALANCE_SYNC_UNAUTHORIZED_SILENCED') {
        return {
          data: null,
          source: 'unauthorized',
          success: false,
          error: 'Token expirado ou inválido'
        };
      }
    }

    // 2. FALLBACK PARA REDIS
    try {
      const cacheResponse = await api.get(`/api/balance-sync/cache?userId=${user.id}&address=${user.publicKey}&network=${defaultNetwork}`, {
        signal: abortControllerRef.current?.signal
      });
      
      if (cacheResponse.data.success && cacheResponse.data.data && cacheResponse.data.data.balances && Object.keys(cacheResponse.data.data.balances.balancesTable || {}).length > 0) {
        
        const redisData = {
          ...cacheResponse.data.data.balances,
          syncStatus: 'cached_redis',
          fromCache: true,
          cacheSource: 'redis'
        };
        
        // SALVAR DADOS DO REDIS NOS BACKUPS LOCAIS
        await balanceBackupService.saveBalances(user.id, redisData, 'redis');
        
        return {
          data: redisData,
          source: 'redis',
          success: true
        };
      }
    } catch (redisError) {
      // Se requisição foi cancelada (logout), parar silenciosamente
      if (redisError.name === 'AbortError' || redisError.message?.includes('aborted')) {
        return {
          data: null,
          source: 'aborted',
          success: false,
          error: 'Requisição cancelada'
        };
      }
      
      // Se erro de autenticação (incluindo bloqueio pelo interceptor ou silenciado), usuário foi deslogado - parar sync
      if (redisError.response?.status === 401 || redisError.response?.status === 403 || 
          redisError.code === 'USER_NOT_AUTHENTICATED' ||
          redisError.code === 'USER_NOT_AUTHENTICATED_SILENT' ||
          redisError.code === 'BALANCE_SYNC_UNAUTHORIZED_SILENCED') {
        return {
          data: null,
          source: 'unauthorized',
          success: false,
          error: 'Token expirado ou inválido'
        };
      }
    }

    // 3. FALLBACK AUTHSTORE
    if (cachedBalances && cachedBalances.balancesTable && Object.keys(cachedBalances.balancesTable).length > 0) {
      const cacheAge = balancesLastUpdate ? Date.now() - balancesLastUpdate : Infinity;
      
      
      return {
        data: {
          ...cachedBalances,
          syncStatus: 'cached_authstore',
          fromCache: true,
          cacheSource: 'authstore',
          cacheAge: Math.floor(cacheAge / 1000 / 60) + ' min'
        },
        source: 'authstore',
        success: true,
        isStale: cacheAge > (10 * 60 * 1000)
      };
    }

    // 4. BACKUP ROBUSTO (NUNCA FALHA)
    // console.log('🛡️ [BalanceSync] Usando sistema de backup robusto...');
    const backupResult = await balanceBackupService.getBalances(user.id);
    
    if (backupResult && backupResult.data) {
      // console.log('✅ [BalanceSync] Backup robusto funcionando:', backupResult.source);
      
      return {
        data: {
          ...backupResult.data,
          syncStatus: 'backup_mode',
          fromBackup: true,
          backupSource: backupResult.source,
          isEmergency: backupResult.isEmergency || false
        },
        source: backupResult.source,
        success: true,
        isBackup: true,
        isEmergency: backupResult.isEmergency || false
      };
    }

    // 5. ISTO NUNCA DEVE ACONTECER (sistema de backup sempre retorna algo)
    console.error('🚨 [BalanceSync] ERRO CRÍTICO: Sistema de backup falhou completamente');
    return {
      data: null,
      source: 'critical_error',
      success: false,
      error: 'Sistema de backup falhou'
    };
  }, [user?.publicKey, user?.id, defaultNetwork, cachedBalances, balancesLastUpdate, isAuthenticated]);

  // Sincroniza balances com sistema robusto de fallback
  const syncBalances = useCallback(async (bypassActiveCheck = false) => {
    // PROTEÇÃO CRÍTICA: Não sincronizar se usuário não está autenticado
    if (!user?.publicKey || !user?.id || !isAuthenticated) {
      return;
    }
    
    if (!bypassActiveCheck && !isActive) {
      return;
    }

    try {
      setSyncError(null);
      
      // Buscar balances com fallback robusto
      const balanceResult = await getBalancesWithFallback();
      
      if (!balanceResult.success || !balanceResult.data) {
        // Se erro de autenticação ou abort, parar sync completamente
        if (balanceResult.source === 'no_user' || balanceResult.source === 'unauthorized' || balanceResult.source === 'aborted') {
          return; // Não definir erro, apenas parar silenciosamente
        }
        setSyncError('Nenhuma fonte de balances disponível');
        return;
      }

      const newBalances = balanceResult.data;
      const isFromAPI = balanceResult.source === 'api';
      

      // Salvar no AuthStore se veio da API (para próximos fallbacks)
      if (isFromAPI && newBalances.balancesTable) {
        setCachedBalances(newBalances);
      }

      const previousBalances = previousBalancesRef.current;
      
      // Detectar mudanças APENAS se:
      // 1. Dados vêm da API (não de cache)
      // 2. Há balances anteriores válidos  
      // 3. Não há erro de sync
      // 4. Não é primeira execução (previousBalances deve ter balancesTable válida)
      // 5. NUNCA detectar mudanças para 0 (proteção contra notificações falsas)
      // 6. NUNCA detectar quando API volta online depois de estar offline (evita notificações de "volta da API")
      const hasPreviousBalances = previousBalances && 
                                previousBalances.balancesTable && 
                                Object.keys(previousBalances.balancesTable).length > 0;

      const hasValidNewBalances = newBalances.balancesTable &&
                                 Object.keys(newBalances.balancesTable).length > 0 &&
                                 Object.values(newBalances.balancesTable).some(val => parseFloat(val) > 0);

      // VERIFICAR SE BALANCES ANTERIORES ERAM DE EMERGÊNCIA/BACKUP (API estava offline)
      const previousWasEmergency = previousBalances && (
        previousBalances.syncStatus?.includes('emergency') ||
        previousBalances.syncStatus?.includes('backup') ||
        previousBalances.syncStatus?.includes('cached') ||
        previousBalances.syncStatus?.includes('error') ||
        previousBalances.isEmergency === true ||
        previousBalances.fromCache === true
      );
      
      const shouldDetectChanges = isFromAPI && 
                                 hasPreviousBalances && 
                                 hasValidNewBalances &&
                                 !previousWasEmergency && // BLOQUEAR se anterior era emergência (API voltando online)
                                 newBalances.syncStatus !== 'error' &&
                                 !newBalances.syncStatus?.includes('cached') &&
                                 !newBalances.syncStatus?.includes('emergency') &&
                                 !newBalances.syncStatus?.includes('backup');
      
      
      const changes = shouldDetectChanges 
        ? detectBalanceChanges(newBalances, previousBalances)
        : [];
      
      // FILTRAR MUDANÇAS QUE ENVOLVAM ZEROS - PROTEÇÃO EXTRA
      const filteredChanges = changes.filter(change => {
        const newBalance = parseFloat(change.newBalance || 0);
        const prevBalance = parseFloat(change.previousBalance || 0);
        
        // Bloquear qualquer mudança que envolva zero
        if (newBalance === 0 || prevBalance === 0) {
          return false;
        }
        
        return true;
      });
      
      // Processar mudanças detectadas (apenas as filtradas)
      if (filteredChanges.length > 0) {
        setBalanceChanges(prev => [...prev, ...filteredChanges]);
        
        // Criar notificações para cada mudança (apenas as filtradas)
        for (const change of filteredChanges) {
          try {
            await createBalanceNotification(change);
          } catch (notificationError) {
            console.error('❌ [BalanceSync] Erro ao criar notificação:', notificationError);
          }
        }
        
        // Callback opcional
        if (onBalanceUpdate) {
          try {
            await onBalanceUpdate(changes, newBalances);
          } catch (callbackError) {
            console.error('❌ [BalanceSync] Erro no callback:', callbackError);
          }
        }
      }

      // Sincronizar com Redis apenas se dados vêm da API
      if (isFromAPI) {
        await syncWithRedis(newBalances);
      }

      // Atualizar referência local
      previousBalancesRef.current = newBalances;
      setLastSync(new Date().toISOString());
      
    } catch (error) {
      console.error('❌ [BalanceSync] Erro crítico na sincronização:', error);
      setSyncError(error.message);
    }
    
  }, [user?.publicKey, user?.id, isActive, isAuthenticated, getBalancesWithFallback, setCachedBalances, detectBalanceChanges, createBalanceNotification, onBalanceUpdate, syncWithRedis]);

  // Inicia o serviço de sincronização
  const startSync = useCallback(async () => {
    if (!user?.publicKey || !user?.id || !isAuthenticated) {
      return;
    }

    // console.log('🚀 [BalanceSync] Iniciando serviço de sincronização:', {
    //   userId: user?.id,
    //   publicKey: user?.publicKey,
    //   timestamp: new Date().toISOString()
    // });

    setIsActive(true);
    isActiveRef.current = true;
    
    // Pequeno delay para garantir que o estado seja atualizado
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // REMOVIDO: Carregar cache existente antes de limpar para detectar mudanças offline
    // previousBalancesRef.current = {}; // Limpar cache anterior

    // Fazer primeira sincronização (bypass do check isActive)
    await syncBalances(true, true);
    
    // Detectar mudanças offline apenas se havia cache anterior válido
    // REMOVIDO: previousBalancesRef.current é sempre vazio, então não há mudanças offline
    // if (Object.keys(previousBalancesRef.current).length > 0 && previousBalancesRef.current.balancesTable) {
    //   const offlineChanges = detectBalanceChanges(previousBalancesRef.current, {}); // Comparar com vazio
    //   if (offlineChanges.length > 0) {
    //     // console.log(`🔍 [BalanceSync] ${offlineChanges.length} mudança(s) detectada(s) enquanto offline:`, offlineChanges);
    //     for (const change of offlineChanges) {
    //       try {
    //         // Modificar o título para indicar que foi detectado no login
    //         const modifiedChange = {
    //           ...change,
    //           timestamp: new Date().toISOString(),
    //           isOfflineDetection: true
    //         };
    //         await createBalanceNotification(modifiedChange);
    //       } catch (notificationError) {
    //         console.error('❌ [BalanceSync] Erro ao criar notificação offline (CONTINUANDO):', notificationError);
    //       }
    //     }
    //   } else {
    //     // console.log('✅ [BalanceSync] Nenhuma mudança detectada enquanto offline');
    //   }
    // }
    
    // Configurar intervalo automático - TEMPORARIAMENTE DESABILITADO PARA TESTE
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
    }
    
    // syncIntervalRef.current = setInterval(async () => {
    //   // PROTEÇÃO: SEMPRE verificar autenticação antes de sync
    //   if (user?.publicKey && user?.id && isAuthenticated) {
    //     try {
    //       await syncBalances(false, true); // bypassActiveCheck=true para forçar
    //     } catch (error) {
    //       console.error('❌ [BalanceSync] Erro na sincronização automática (continuando ativo):', {
    //         error: error.message,
    //         status: error.response?.status,
    //         timestamp: new Date().toISOString()
    //       });
    //       // NÃO parar o serviço, apenas logar o erro
    //     }
    //   }
    // }, getSyncIntervalMs(user?.userPlan || 'BASIC'));

    // Sincronização iniciada silenciosamente
  }, [user?.publicKey, syncBalances]);

  // Para o serviço de sincronização
  const stopSync = useCallback(() => {
    setIsActive(false);
    isActiveRef.current = false;
    
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
      syncIntervalRef.current = null;
    }

    // Sincronização parada silenciosamente
  }, []);

  // Limpa o histórico de mudanças
  const clearChanges = useCallback(() => {
    setBalanceChanges([]);
  }, []);

  // Sincroniza manualmente com Redis
  const forceRedisSync = useCallback(async () => {
    if (!user?.id || !user?.publicKey) {
      console.warn('⚠️ Usuário inválido para sincronização Redis');
      return;
    }

    try {
      const currentBalances = previousBalancesRef.current;
      if (Object.keys(currentBalances).length === 0) {
        console.warn('⚠️ Nenhum balance disponível para sincronização');
        return;
      }

      // Sincronizando com Redis silenciosamente
      const result = await syncWithRedis(currentBalances);
      
      if (result) {
        // console.log('✅ Sincronização Redis concluída');
      }
    } catch (error) {
      console.error('❌ Erro na sincronização Redis:', error);
    }
  }, [user?.id, user?.publicKey, syncWithRedis]);

  // Cleanup ao desmontar componente
  useEffect(() => {
    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, []);

  // LIMPAR TUDO IMEDIATAMENTE QUANDO USUÁRIO DESLOGA
  useEffect(() => {
    if (!isAuthenticated || !user?.publicKey || !user?.id) {
      // ATIVAR BLOQUEIO NA API
      if (typeof window !== 'undefined' && window.setBalanceSyncAPIBlocked) {
        window.setBalanceSyncAPIBlocked(true);
      }
      
      // Cancelar requisições em andamento
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      
      // Limpar intervalo
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
      }
      
      // Reset de estados
      setSyncError(null);
      setRedisSyncStatus('idle');
    } else {
      // REATIVAR API
      if (typeof window !== 'undefined' && window.setBalanceSyncAPIBlocked) {
        window.setBalanceSyncAPIBlocked(false);
      }
    }
  }, [isAuthenticated, user?.publicKey, user?.id]);

  // PARAR SYNC IMEDIATAMENTE QUANDO USUÁRIO DESLOGA + Auto-start quando autentica
  useEffect(() => {
    // PRIMEIRA PRIORIDADE: Parar sync se não autenticado
    if (!isAuthenticated || !user?.publicKey || !user?.id) {
      if (isActive) {
        setIsActive(false); // Parar sync imediatamente
      }
      return;
    }
    
    // SEGUNDA PRIORIDADE: Auto-start quando usuário está autenticado mas sync não ativo
    if (!isActive) {
      // Usar timeout para evitar problemas de timing
      const autoStartTimer = setTimeout(() => {
        startSync()
          .catch(error => {
            console.error('❌ [BalanceSync] Erro no auto-start:', error);
            // Tentar novamente após 5 segundos
            setTimeout(() => {
              startSync().catch(e => console.error('❌ [BalanceSync] Tentativa 2 falhou:', e));
            }, 5000);
          });
      }, 1000);
      
      return () => clearTimeout(autoStartTimer);
    }
  }, [user?.publicKey, user?.id, isActive, isAuthenticated]); // Remover startSync das dependências

  // 🛡️ MEMOIZAR RETORNO: Se não autenticado, retornar objeto desabilitado
  return useMemo(() => {
    if (!isAuthenticated || !user?.publicKey || !user?.id) {
      return {
        // Estado desabilitado
        isActive: false,
        lastSync: null,
        syncError: null,
        balanceChanges: [],
        redisSyncStatus: 'disabled',
        
        // Funções vazias que NUNCA falham
        startSync: () => Promise.resolve(),
        stopSync: () => {},
        syncBalances: () => Promise.resolve(),
        forceSyncBalances: () => Promise.resolve(),
        forceRedisSync: () => Promise.resolve(),
        clearChanges: () => {},
        
        // Utilitários
        formatLastSync: () => 'Desabilitado',
      };
    }

    // Retorno normal quando autenticado
    return {
      // Estado
      isActive,
      lastSync,
      syncError,
      balanceChanges,
      redisSyncStatus,
      
      // Ações
      startSync,
      stopSync,
      syncBalances: () => syncBalances(true, false),
      forceSyncBalances: () => syncBalances(true, true), // Force bypass para debug
      forceRedisSync,
      clearChanges,
      
      // Utilitários
      formatLastSync: () => {
        if (!lastSync) return 'Nunca';
        return new Date(lastSync).toLocaleString('pt-BR');
      }
    };
  }, [isAuthenticated, user?.publicKey, user?.id, isActive, lastSync, syncError, balanceChanges, redisSyncStatus, startSync, stopSync, syncBalances, forceRedisSync, clearChanges]);
};

export default useBalanceSync;