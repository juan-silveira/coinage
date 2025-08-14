import { useState, useEffect, useCallback, useRef } from 'react';
import useAuthStore from '@/store/authStore';
import useToast from '@/hooks/useToast';
import api from '@/services/api';
import balanceSyncService from '@/services/balanceSyncService';

const SYNC_INTERVAL_MS = 60 * 1000; // 1 minuto
const CACHE_KEY_PREFIX = 'balanceSync_';
const AZORESCAN_API_BASE = 'https://floripa.azorescan.com/api';

const useBalanceSync = (onBalanceUpdate = null) => {
  const [isActive, setIsActive] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [syncError, setSyncError] = useState(null);
  const [balanceChanges, setBalanceChanges] = useState([]);
  const [redisSyncStatus, setRedisSyncStatus] = useState('idle'); // idle, syncing, synced, error

  // Store
  const user = useAuthStore((s) => s.user);
  const notifications = useAuthStore((s) => s.notifications);
  const addNotification = useAuthStore((s) => s.addNotification);

  // Refs
  const syncIntervalRef = useRef(null);
  const previousBalancesRef = useRef({});
  const isActiveRef = useRef(false);

  // Toast
  const { showSuccess, showError, showInfo } = useToast();

  // Chave do cache localStorage baseada no usuário
  const getCacheKey = useCallback(() => {
    if (!user?.id) return null;
    return `${CACHE_KEY_PREFIX}${user.id}`;
  }, [user?.id]);

  // Carrega balances anteriores do cache localStorage
  const loadPreviousBalances = useCallback(() => {
    const cacheKey = getCacheKey();
    if (!cacheKey) return {};
    
    try {
      const cached = localStorage.getItem(cacheKey);
      const result = cached ? JSON.parse(cached) : {};
      
      // Log detalhado dos valores em cache no login
      console.log('📋 [BalanceSync] Valores em cache no login:', {
        cacheKey,
        hasCachedData: !!cached,
        cachedBalances: result?.balancesTable || {},
        lastUpdated: result?.lastUpdated || 'nunca',
        totalTokensInCache: Object.keys(result?.balancesTable || {}).length
      });
      
      return result;
    } catch (error) {
      console.error('❌ Erro ao carregar cache de balances:', error);
      return {};
    }
  }, [getCacheKey]);

  // Salva balances no cache localStorage
  const savePreviousBalances = useCallback((balances) => {
    const cacheKey = getCacheKey();
    if (!cacheKey) return;
    
    try {
      localStorage.setItem(cacheKey, JSON.stringify(balances));
    } catch (error) {
      console.error('❌ Erro ao salvar cache de balances:', error);
    }
  }, [getCacheKey]);

  // Busca balances diretamente da API do Azorescan
  const fetchBalancesFromAzorescan = useCallback(async (address) => {
    try {
      console.log('🔄 [BalanceSync] Buscando balances do Azorescan para:', address);
      
      // Fazer duas chamadas: uma para tokens ERC-20 e outra para balance nativo
      const [tokensResponse, balanceResponse] = await Promise.all([
        // Buscar tokens ERC-20
        fetch(`${AZORESCAN_API_BASE}/?module=account&action=tokenlist&address=${address}`),
        // Buscar balance nativo AZE-t
        fetch(`${AZORESCAN_API_BASE}/?module=account&action=balance&address=${address}&tag=latest`)
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
        network: 'testnet',
        address: address,
        balancesTable: {},
        lastUpdated: new Date().toISOString(),
        source: 'azorescan'
      };
      
      // Adicionar balance nativo AZE-t primeiro
      if (balanceData.result) {
        const nativeBalance = parseFloat(balanceData.result) / Math.pow(10, 18); // AZE-t tem 18 decimais
        transformedBalances.balancesTable['AZE-t'] = nativeBalance.toFixed(6);
        console.log('💰 [BalanceSync] Balance nativo AZE-t detectado:', nativeBalance.toFixed(6));
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
      console.log('🆕 [BalanceSync] Valores detectados no refresh:', {
        address,
        totalTokens: Object.keys(transformedBalances.balancesTable).length,
        detectedBalances: transformedBalances.balancesTable,
        incluiAZEt: 'AZE-t' in transformedBalances.balancesTable,
        balanceAZEt: transformedBalances.balancesTable['AZE-t'] || 'não encontrado',
        timestamp: transformedBalances.lastUpdated,
        rawApiResponses: {
          tokens: tokensData.result?.length || 0,
          nativeBalance: balanceData.result || 'erro'
        }
      });
      
      return transformedBalances;
      
    } catch (error) {
      console.error('❌ [BalanceSync] Erro ao buscar balances da API Azorescan:', error);
      throw error;
    }
  }, []);

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
        balances
      );
      
      if (result && result.success) {
        setRedisSyncStatus('synced');
        
        if (result.synced && result.changes && result.changes.length > 0) {
          showInfo(`🔄 Redis sincronizado - ${result.changes.length} mudanças detectadas`);
        }
        
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
  }, [user?.id, user?.publicKey, showInfo]);

  // Compara balances e detecta mudanças (PROTEGIDO CONTRA CRASHES)
  const detectBalanceChanges = useCallback((newBalances, previousBalances) => {
    try {
      const changes = [];
      const newTable = newBalances?.balancesTable || {};
      const prevTable = previousBalances?.balancesTable || {};

      // Log detalhado da comparação
      console.log('🔍 [BalanceSync] Comparando balances:', {
        novosBalances: newTable,
        balancesAnteriores: prevTable,
        temBalancesAnteriores: Object.keys(prevTable).length > 0,
        totalTokensNovos: Object.keys(newTable).length,
        totalTokensAnteriores: Object.keys(prevTable).length
      });

      // Função para comparar valores com tolerância para problemas de precisão
      const isSignificantChange = (newVal, oldVal, tolerance = 0.000001) => {
        const diff = Math.abs(newVal - oldVal);
        return diff > tolerance;
      };

      // Verificar mudanças em tokens existentes
      Object.keys(newTable).forEach(token => {
        const newBalance = parseFloat(newTable[token] || 0);
        const prevBalance = parseFloat(prevTable[token] || 0);
        
        console.log(`🔢 [BalanceSync] Comparando token ${token}:`, {
          balanceAnterior: prevBalance.toFixed(6),
          balanceNovo: newBalance.toFixed(6),
          diferenca: (newBalance - prevBalance).toFixed(6),
          ehMudancaSignificativa: isSignificantChange(newBalance, prevBalance)
        });
        
        if (isSignificantChange(newBalance, prevBalance)) {
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

      // Verificar novos tokens
      Object.keys(newTable).forEach(token => {
        if (!(token in prevTable) && parseFloat(newTable[token] || 0) > 0) {
          console.log(`🆕 [BalanceSync] Novo token detectado: ${token} = ${newTable[token]}`);
          
          changes.push({
            token,
            previousBalance: '0.000000',
            newBalance: parseFloat(newTable[token]).toFixed(6),
            difference: parseFloat(newTable[token]).toFixed(6),
            type: 'new_token',
            timestamp: new Date().toISOString()
          });
        }
      });

      // Verificar tokens que foram removidos ou zerados
      Object.keys(prevTable).forEach(token => {
        if (!(token in newTable) || parseFloat(newTable[token] || 0) === 0) {
          const prevBalance = parseFloat(prevTable[token] || 0);
          if (prevBalance > 0) {
            console.log(`📉 [BalanceSync] Token removido/zerado: ${token} (era ${prevBalance.toFixed(6)})`);
            
            changes.push({
              token,
              previousBalance: prevBalance.toFixed(6),
              newBalance: '0.000000',
              difference: (0 - prevBalance).toFixed(6),
              type: 'decrease',
              timestamp: new Date().toISOString()
            });
          }
        }
      });

      // Log final do resultado da comparação
      console.log('📊 [BalanceSync] Resultado da comparação:', {
        totalMudancas: changes.length,
        mudancasDetectadas: changes,
        resumo: changes.length === 0 ? 'Nenhuma mudança detectada' : `${changes.length} mudança(s) detectada(s)`
      });

      return changes;
      
    } catch (error) {
      console.error('❌ [BalanceSync] ERRO CRÍTICO na detecção de mudanças (CRASH EVITADO):', error);
      console.error('❌ [BalanceSync] Stack trace:', error.stack);
      console.error('❌ [BalanceSync] Dados que causaram erro:', { newBalances, previousBalances });
      
      // Retornar array vazio para evitar crash
      return [];
    }
  }, []);

  // Cria notificação para mudança de saldo (PROTEGIDO CONTRA CRASHES)
  const createBalanceNotification = useCallback(async (change) => {
    try {
      // Validar dados de entrada
      if (!change || typeof change !== 'object') {
        throw new Error('Dados de mudança inválidos');
      }
      
      const { token, difference, type, newBalance } = change;
      
      if (!token || !difference || !type || !newBalance) {
        throw new Error(`Campos obrigatórios faltando: ${JSON.stringify(change)}`);
      }
    
      let title, message, notificationType;
    
      switch (type) {
        case 'increase':
          title = `💰 Saldo Aumentado - ${token}`;
          message = `Seu saldo de ${token} aumentou em ${difference}. Novo saldo: ${newBalance}`;
          notificationType = 'balance_increase';
          break;
        case 'decrease':
          title = `📉 Saldo Reduzido - ${token}`;
          message = `Seu saldo de ${token} diminuiu em ${Math.abs(difference)}. Novo saldo: ${newBalance}`;
          notificationType = 'balance_decrease';
          break;
        case 'new_token':
          title = `🆕 Novo Token Recebido - ${token}`;
          message = `Você recebeu ${newBalance} ${token} em sua carteira`;
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
          changeType: type
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
        
        console.log('📤 [BalanceSync] Enviando notificação para API:', apiPayload);
        
        const response = await api.post('/api/notifications/create', apiPayload);
        
        console.log('✅ [BalanceSync] Notificação criada com sucesso:', response.data);
        
        // Disparar evento para atualizar o dropdown de notificações
        if (response.data.success && response.data.data) {
          const newNotification = response.data.data;
          
          // Disparar evento customizado para notificar o sistema
          window.dispatchEvent(new CustomEvent('notificationCreated', { 
            detail: { notification: newNotification } 
          }));
          
          console.log('🔔 [BalanceSync] Evento de nova notificação disparado');
        }
        
      } catch (apiError) {
        console.error('❌ [BalanceSync] Erro ao enviar notificação para API:', apiError);
        console.error('❌ [BalanceSync] Detalhes do erro:', apiError.response?.data);
        console.error('❌ [BalanceSync] Status:', apiError.response?.status);
        // Continuar mesmo se API falhar - a notificação local ainda funciona
      }

      // Mostrar toast
      if (type === 'decrease') {
        showError(`${title}: ${message}`);
      } else {
        showSuccess(`${title}: ${message}`);
      }

    } catch (error) {
      console.error('❌ [BalanceSync] ERRO CRÍTICO na criação de notificação (CRASH EVITADO):', error);
      console.error('❌ [BalanceSync] Stack trace:', error.stack);
      console.error('❌ [BalanceSync] Dados que causaram erro:', change);
      
      // Não propagar o erro para evitar crash do sistema
      return false;
    }
  }, [addNotification, showSuccess, showError, user?.id]);

  // Sincroniza balances com a blockchain via Azorescan
  const syncBalances = useCallback(async (manual = false, bypassActiveCheck = false) => {
    if (!user?.publicKey) {
      return;
    }
    
    if (!bypassActiveCheck && !isActive) {
      return;
    }

    try {
      setSyncError(null);
      
      // Buscar balances da API do Azorescan
      const newBalances = await fetchBalancesFromAzorescan(user.publicKey);
      const previousBalances = previousBalancesRef.current;
      
      // Detectar mudanças sempre (mesmo na primeira vez)
      const changes = detectBalanceChanges(newBalances, previousBalances);
      
      if (Object.keys(previousBalances).length > 0) {
        
        if (changes.length > 0) {
          setBalanceChanges(prev => {
            const updated = [...prev, ...changes];
            return updated;
          });
          
          // Criar notificações para cada mudança (PROTEGIDO)
          for (const change of changes) {
            try {
              await createBalanceNotification(change);
            } catch (notificationError) {
              console.error('❌ [BalanceSync] Erro ao criar notificação individual (CONTINUANDO):', notificationError);
              // Continuar mesmo se uma notificação falhar
            }
          }
          
          // Chamar callback de atualização se fornecido (PROTEGIDO)
          if (onBalanceUpdate) {
            try {
              await onBalanceUpdate(changes, newBalances);
            } catch (callbackError) {
              console.error('❌ [BalanceSync] ERRO CRÍTICO no callback (CRASH EVITADO):', callbackError);
              console.error('❌ [BalanceSync] Stack trace:', callbackError.stack);
              // Continuar execução mesmo se callback falhar
            }
          }
        }
      }

      // Sincronizar com Redis
      const redisSyncResult = await syncWithRedis(newBalances);

      // Atualizar cache local
      previousBalancesRef.current = newBalances;
      savePreviousBalances(newBalances);
      setLastSync(new Date().toISOString());

      if (manual) {
        showSuccess('✅ Sincronização Concluída - Balances atualizados com sucesso');
      }
      
    } catch (error) {
      console.error('❌ [BalanceSync] Erro na sincronização de balances:', {
        error: error.message,
        status: error.response?.status,
        url: error.config?.url,
        publicKey: user?.publicKey?.slice(0, 10) + '...',
        manual
      });
      setSyncError(error.message);
      
      if (manual) {
        showError(`❌ Erro na Sincronização: ${error.message}`);
      }
    }
  }, [user?.publicKey, isActive, detectBalanceChanges, createBalanceNotification, savePreviousBalances, showSuccess, showError, onBalanceUpdate, fetchBalancesFromAzorescan, syncWithRedis]);

  // Inicia o serviço de sincronização
  const startSync = useCallback(async () => {
    if (!user?.publicKey) {
      console.error('❌ [BalanceSync] Usuário inválido - publicKey não encontrada');
      showError('⚠️ Usuário Inválido - Não foi possível iniciar a sincronização. Chave pública não encontrada.');
      return;
    }

    console.log('🚀 [BalanceSync] Iniciando serviço de sincronização:', {
      userId: user?.id,
      publicKey: user?.publicKey,
      timestamp: new Date().toISOString()
    });

    setIsActive(true);
    isActiveRef.current = true;
    
    // Pequeno delay para garantir que o estado seja atualizado
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Carregar cache existente antes de limpar (para debug)
    const cacheKey = getCacheKey();
    const existingCache = cacheKey ? localStorage.getItem(cacheKey) : null;
    if (existingCache) {
      console.log('🗂️ [BalanceSync] Cache existente encontrado (será limpo):', JSON.parse(existingCache));
    } else {
      console.log('📭 [BalanceSync] Nenhum cache existente encontrado');
    }
    
    // Limpar cache antigo e carregar novos balances
    if (cacheKey) {
      localStorage.removeItem(cacheKey);
    }
    
    // Resetar cache em memória
    previousBalancesRef.current = {};

    // Fazer primeira sincronização (bypass do check isActive)
    await syncBalances(true, true);
    
    // Configurar intervalo automático
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
    }
    
    syncIntervalRef.current = setInterval(async () => {
      // SEMPRE executar se o usuário for válido, ignorando isActive
      if (user?.publicKey) {
        try {
          await syncBalances(false, true); // bypassActiveCheck=true para forçar
        } catch (error) {
          console.error('❌ [BalanceSync] Erro na sincronização automática (continuando ativo):', {
            error: error.message,
            status: error.response?.status,
            timestamp: new Date().toISOString()
          });
          // NÃO parar o serviço, apenas logar o erro
        }
      }
    }, SYNC_INTERVAL_MS);

    showSuccess('🚀 Sincronização Iniciada - O serviço está ativo (verifica a cada 1 minuto)');
  }, [user?.publicKey, syncBalances, showSuccess, showError, getCacheKey]);

  // Para o serviço de sincronização
  const stopSync = useCallback(() => {
    setIsActive(false);
    isActiveRef.current = false;
    
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
      syncIntervalRef.current = null;
    }

    showInfo('⏹️ Sincronização Parada - O serviço foi interrompido');
  }, [showInfo]);

  // Limpa o histórico de mudanças
  const clearChanges = useCallback(() => {
    setBalanceChanges([]);
  }, []);

  // Sincroniza manualmente com Redis
  const forceRedisSync = useCallback(async () => {
    if (!user?.id || !user?.publicKey) {
      showError('⚠️ Usuário inválido para sincronização Redis');
      return;
    }

    try {
      const currentBalances = previousBalancesRef.current;
      if (Object.keys(currentBalances).length === 0) {
        showError('⚠️ Nenhum balance disponível para sincronização');
        return;
      }

      showInfo('🔄 Sincronizando com Redis...');
      const result = await syncWithRedis(currentBalances);
      
      if (result) {
        showSuccess('✅ Sincronização Redis concluída');
      }
    } catch (error) {
      showError('❌ Erro na sincronização Redis');
    }
  }, [user?.id, user?.publicKey, syncWithRedis, showError, showInfo, showSuccess]);

  // Cleanup ao desmontar componente
  useEffect(() => {
    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, []);

  // Auto-start quando usuário logar (ativado sempre) - versão simplificada
  useEffect(() => {
    // Condição simplificada para auto-start
    if (user?.publicKey && !isActive) {
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
  }, [user?.publicKey, isActive]); // Remover startSync das dependências

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
};

export default useBalanceSync;