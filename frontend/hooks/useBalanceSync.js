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
      console.log('📂 [BalanceSync] Cache localStorage carregado:', result);
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
      console.log('💾 [BalanceSync] Cache localStorage salvo:', balances);
    } catch (error) {
      console.error('❌ Erro ao salvar cache de balances:', error);
    }
  }, [getCacheKey]);

  // Busca balances diretamente da API do Azorescan
  const fetchBalancesFromAzorescan = useCallback(async (address) => {
    try {
      console.log('📡 [BalanceSync] Buscando balances da API Azorescan para:', address);
      
      const response = await fetch(`${AZORESCAN_API_BASE}/?module=account&action=tokenlist&address=${address}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📡 [BalanceSync] Resposta da API Azorescan:', data);
      
      if (data.status !== '1') {
        throw new Error(`API error: ${data.message || 'Unknown error'}`);
      }
      
      // Transformar dados da API do Azorescan para o formato esperado
      const transformedBalances = {
        network: 'testnet',
        address: address,
        balancesTable: {},
        lastUpdated: new Date().toISOString(),
        source: 'azorescan'
      };
      
      // Processar cada token retornado
      data.result.forEach(token => {
        const symbol = token.symbol;
        const balance = parseFloat(token.balance) / Math.pow(10, parseInt(token.decimals));
        
        transformedBalances.balancesTable[symbol] = balance.toFixed(6);
      });
      
      console.log('🔄 [BalanceSync] Balances transformados:', transformedBalances);
      return transformedBalances;
      
    } catch (error) {
      console.error('❌ [BalanceSync] Erro ao buscar balances da API Azorescan:', error);
      throw error;
    }
  }, []);

  // Sincroniza com Redis
  const syncWithRedis = useCallback(async (balances) => {
    if (!user?.id || !user?.publicKey) {
      console.log('⚠️ [BalanceSync] Sincronização Redis cancelada - usuário inválido');
      return null;
    }

    try {
      setRedisSyncStatus('syncing');
      console.log('🔄 [BalanceSync] Sincronizando com Redis...');
      
      const result = await balanceSyncService.syncWithRedis(
        user.id,
        user.publicKey,
        balances
      );
      
      if (result.success) {
        setRedisSyncStatus('synced');
        console.log('✅ [BalanceSync] Sincronização com Redis concluída:', result);
        
        if (result.synced && result.changes.length > 0) {
          console.log('💰 [BalanceSync] Mudanças detectadas no Redis:', result.changes);
          showInfo(`🔄 Redis sincronizado - ${result.changes.length} mudanças detectadas`);
        }
        
        return result;
      } else {
        throw new Error('Falha na sincronização com Redis');
      }
      
    } catch (error) {
      setRedisSyncStatus('error');
      console.error('❌ [BalanceSync] Erro na sincronização com Redis:', error);
      showError('❌ Erro na sincronização com Redis');
      return null;
    }
  }, [user?.id, user?.publicKey, showInfo, showError]);

  // Compara balances e detecta mudanças (PROTEGIDO CONTRA CRASHES)
  const detectBalanceChanges = useCallback((newBalances, previousBalances) => {
    try {
      console.log('🔍 [BalanceSync] Detectando mudanças (PROTEGIDO)...');
      console.log('🔍 [BalanceSync] Novos balances:', newBalances);
      console.log('🔍 [BalanceSync] Balances anteriores:', previousBalances);
    
      const changes = [];
      const newTable = newBalances?.balancesTable || {};
      const prevTable = previousBalances?.balancesTable || {};
      
      console.log('🔍 [BalanceSync] Nova tabela:', newTable);
      console.log('🔍 [BalanceSync] Tabela anterior:', prevTable);
      console.log('🔍 [BalanceSync] Tokens na nova tabela:', Object.keys(newTable));
      console.log('🔍 [BalanceSync] Tokens na tabela anterior:', Object.keys(prevTable));
      console.log('🔍 [BalanceSync] Rede atual:', newBalances?.network);

      // Função para comparar valores com tolerância para problemas de precisão
      const isSignificantChange = (newVal, oldVal, tolerance = 0.000001) => {
        const diff = Math.abs(newVal - oldVal);
        return diff > tolerance;
      };

      // Verificar mudanças em tokens existentes
      Object.keys(newTable).forEach(token => {
        const newBalance = parseFloat(newTable[token] || 0);
        const prevBalance = parseFloat(prevTable[token] || 0);
        
        console.log(`🔍 [BalanceSync] ${token}:`);
        console.log(`  - Novo valor: "${newTable[token]}" -> parsed: ${newBalance}`);
        console.log(`  - Valor anterior: "${prevTable[token] || 'undefined'}" -> parsed: ${prevBalance}`);
        console.log(`  - São significativamente diferentes? ${isSignificantChange(newBalance, prevBalance)}`);
        
        if (isSignificantChange(newBalance, prevBalance)) {
          const difference = newBalance - prevBalance;
          console.log(`✨ [BalanceSync] Mudança detectada em ${token}: ${prevBalance} -> ${newBalance} (diff: ${difference})`);
          
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
          console.log(`✨ [BalanceSync] Novo token detectado: ${token} = ${newTable[token]}`);
          
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
            console.log(`✨ [BalanceSync] Token removido/zerado: ${token} = ${prevBalance} -> 0`);
            
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

      console.log(`🔍 [BalanceSync] Total de mudanças detectadas: ${changes.length}`, changes);
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
      console.log('🔔 [BalanceSync] Criando notificação (PROTEGIDO):', change);
      
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
        console.log('🔔 [BalanceSync] Enviando notificação para API:', apiPayload);
        await api.post('/api/notifications/create', apiPayload);
        console.log('✅ [BalanceSync] Notificação enviada para API com sucesso');
      } catch (apiError) {
        console.error('❌ [BalanceSync] Erro ao enviar notificação para API:', apiError);
        console.error('❌ [BalanceSync] Detalhes do erro:', apiError.response?.data);
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
    console.log('🔄 [BalanceSync] Verificando condições para sincronização:');
    console.log('  - user:', user);
    console.log('  - user.publicKey:', user?.publicKey);
    console.log('  - isActive:', isActive);
    console.log('  - manual:', manual);
    console.log('  - bypassActiveCheck:', bypassActiveCheck);
    
    if (!user?.publicKey) {
      console.log('⚠️ [BalanceSync] Sincronização cancelada - publicKey inválido');
      console.log('⚠️ [BalanceSync] Detalhes:');
      console.log('  - user existe:', !!user);
      console.log('  - publicKey existe:', !!user?.publicKey);
      console.log('  - publicKey valor:', user?.publicKey);
      return;
    }
    
    if (!bypassActiveCheck && !isActive) {
      console.log('⚠️ [BalanceSync] Sincronização cancelada - isActive é false');
      console.log('⚠️ [BalanceSync] Use bypassActiveCheck=true para forçar');
      console.log('⚠️ [BalanceSync] Estado atual: isActive =', isActive, ', isActiveRef =', isActiveRef.current);
      return;
    }

    try {
      setSyncError(null);
      
      console.log(`🔄 [BalanceSync] ${manual ? 'Sincronização manual' : 'Sincronização automática'} iniciada para:`, user.publicKey);
      
      // Buscar balances da API do Azorescan
      const newBalances = await fetchBalancesFromAzorescan(user.publicKey);
      const previousBalances = previousBalancesRef.current;
      
      console.log('🔄 [BalanceSync] Estado atual:');
      console.log('  - Novos balances:', newBalances);
      console.log('  - Balances anteriores:', previousBalances);
      console.log('  - É primeira sincronização:', Object.keys(previousBalances).length === 0);

      // Detectar mudanças sempre (mesmo na primeira vez)
      console.log('🔍 [BalanceSync] SEMPRE detectando mudanças (removida lógica de primeira sync)...');
      console.log('🔍 [BalanceSync] Comparação detalhada:');
      console.log('🔍 [BalanceSync] - Novos balances COMPLETOS:', JSON.stringify(newBalances, null, 2));
      console.log('🔍 [BalanceSync] - Balances anteriores COMPLETOS:', JSON.stringify(previousBalances, null, 2));
      console.log('🔍 [BalanceSync] - Nova tabela:', newBalances?.balancesTable);
      console.log('🔍 [BalanceSync] - Tabela anterior:', previousBalances?.balancesTable);
      
      const changes = detectBalanceChanges(newBalances, previousBalances);
      
      if (Object.keys(previousBalances).length > 0) {
        
        if (changes.length > 0) {
          console.log('💰 [BalanceSync] Mudanças detectadas nos balances:', changes);
          setBalanceChanges(prev => {
            const updated = [...prev, ...changes];
            console.log('📝 [BalanceSync] Histórico de mudanças atualizado:', updated);
            return updated;
          });
          
          // Criar notificações para cada mudança (PROTEGIDO)
          for (const change of changes) {
            try {
              console.log('🔔 [BalanceSync] Criando notificação para:', change);
              await createBalanceNotification(change);
            } catch (notificationError) {
              console.error('❌ [BalanceSync] Erro ao criar notificação individual (CONTINUANDO):', notificationError);
              // Continuar mesmo se uma notificação falhar
            }
          }
          
          // Chamar callback de atualização se fornecido (PROTEGIDO)
          if (onBalanceUpdate) {
            console.log('🔄 [BalanceSync] Chamando callback de atualização (PROTEGIDO)...');
            try {
              await onBalanceUpdate(changes, newBalances);
              console.log('✅ [BalanceSync] Callback de atualização concluído com sucesso');
            } catch (callbackError) {
              console.error('❌ [BalanceSync] ERRO CRÍTICO no callback (CRASH EVITADO):', callbackError);
              console.error('❌ [BalanceSync] Stack trace:', callbackError.stack);
              // Continuar execução mesmo se callback falhar
            }
          }
        } else {
          console.log('ℹ️ [BalanceSync] Nenhuma mudança detectada');
        }
      } else {
        console.log('ℹ️ [BalanceSync] Primeira sincronização - pulando detecção de mudanças');
      }

      // Sincronizar com Redis
      console.log('🔄 [BalanceSync] Sincronizando com Redis...');
      const redisSyncResult = await syncWithRedis(newBalances);
      if (redisSyncResult) {
        console.log('✅ [BalanceSync] Sincronização Redis concluída:', redisSyncResult);
      }

      // Atualizar cache local
      console.log('💾 [BalanceSync] Atualizando cache local...');
      console.log('💾 [BalanceSync] Novos balances para salvar:', newBalances);
      console.log('💾 [BalanceSync] Cache anterior antes da atualização:', previousBalancesRef.current);
      
      previousBalancesRef.current = newBalances;
      savePreviousBalances(newBalances);
      setLastSync(new Date().toISOString());
      
      console.log('💾 [BalanceSync] Cache local atualizado com sucesso');
      console.log('💾 [BalanceSync] previousBalancesRef.current agora é:', previousBalancesRef.current);

      if (manual) {
        showSuccess('✅ Sincronização Concluída - Balances atualizados com sucesso');
      }

      console.log('✅ [BalanceSync] Sincronização de balances concluída');
      
    } catch (error) {
      console.error('❌ [BalanceSync] Erro na sincronização de balances:', error);
      setSyncError(error.message);
      
      if (manual) {
        showError(`❌ Erro na Sincronização: ${error.message}`);
      }
    }
  }, [user?.publicKey, isActive, detectBalanceChanges, createBalanceNotification, savePreviousBalances, showSuccess, showError, onBalanceUpdate, fetchBalancesFromAzorescan, syncWithRedis]);

  // Inicia o serviço de sincronização
  const startSync = useCallback(async () => {
    console.log('🚀 [BalanceSync] Tentando iniciar serviço de sincronização...');
    console.log('🚀 [BalanceSync] Estado inicial:');
    console.log('  - user:', user);
    console.log('  - user.publicKey:', user?.publicKey);
    console.log('  - isActive atual:', isActive);
    
    if (!user?.publicKey) {
      console.error('❌ [BalanceSync] Usuário inválido - publicKey não encontrada');
      showError('⚠️ Usuário Inválido - Não foi possível iniciar a sincronização. Chave pública não encontrada.');
      return;
    }

    console.log('✅ [BalanceSync] Usuário válido - iniciando serviço...');
    setIsActive(true);
    isActiveRef.current = true;
    
    // Pequeno delay para garantir que o estado seja atualizado
    await new Promise(resolve => setTimeout(resolve, 100));
    console.log('✅ [BalanceSync] Estado isActive após setIsActive:', true);
    
    // Limpar cache antigo e carregar novos balances
    console.log('📂 [BalanceSync] Limpando cache antigo para evitar problemas...');
    const cacheKey = getCacheKey();
    if (cacheKey) {
      localStorage.removeItem(cacheKey);
      console.log('🗑️ [BalanceSync] Cache localStorage limpo');
    }
    
    // Resetar cache em memória
    previousBalancesRef.current = {};
    console.log('📂 [BalanceSync] Cache resetado - irá detectar todas as mudanças');

    // Fazer primeira sincronização (bypass do check isActive)
    console.log('🔄 [BalanceSync] Executando primeira sincronização...');
    await syncBalances(true, true);
    
    // Configurar intervalo automático
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
    }
    
    syncIntervalRef.current = setInterval(async () => {
      console.log('⏰ [BalanceSync] Executando sincronização automática (intervalo)...');
      console.log('⏰ [BalanceSync] Estado isActive no intervalo:', isActiveRef.current);
      console.log('⏰ [BalanceSync] Estado isActive state:', isActive);
      console.log('⏰ [BalanceSync] Usuário:', user?.publicKey ? 'Válido' : 'Inválido');
      console.log('⏰ [BalanceSync] Próxima verificação em:', SYNC_INTERVAL_MS / 1000, 'segundos');
      
      // SEMPRE executar se o usuário for válido, ignorando isActive
      if (user?.publicKey) {
        try {
          console.log('✅ [BalanceSync] Iniciando sincronização automática (BYPASS isActive)...');
          console.log('✅ [BalanceSync] Forçando bypassActiveCheck=true para garantir execução');
          await syncBalances(false, true); // bypassActiveCheck=true para forçar
          console.log('✅ [BalanceSync] Sincronização automática concluída');
        } catch (error) {
          console.error('❌ [BalanceSync] Erro na sincronização automática (continuando ativo):', error);
          // NÃO parar o serviço, apenas logar o erro
        }
      } else {
        console.log('⚠️ [BalanceSync] Sincronização cancelada - usuário inválido');
        console.log('⚠️ [BalanceSync] Detalhes do usuário:', {
          hasUser: !!user,
          hasPublicKey: !!user?.publicKey,
          publicKey: user?.publicKey
        });
      }
    }, SYNC_INTERVAL_MS);

    showSuccess('🚀 Sincronização Iniciada - O serviço está ativo (verifica a cada 1 minuto)');

    console.log('🚀 [BalanceSync] Serviço de sincronização de balances iniciado com sucesso');
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

    console.log('⏹️ Serviço de sincronização de balances parado');
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
    console.log('🔍 [BalanceSync] Verificando auto-start...');
    console.log('🔍 [BalanceSync] - user exists:', !!user);
    console.log('🔍 [BalanceSync] - user.publicKey:', user?.publicKey);
    console.log('🔍 [BalanceSync] - isActive:', isActive);
    console.log('🔍 [BalanceSync] - should auto-start:', !!(user?.publicKey && !isActive));
    
    // Condição simplificada para auto-start
    if (user?.publicKey && !isActive) {
      console.log('🚀 [BalanceSync] ✅ INICIANDO auto-sync para usuário:', user.publicKey);
      
      // Usar timeout para evitar problemas de timing
      const autoStartTimer = setTimeout(() => {
        console.log('🚀 [BalanceSync] Executando startSync() após timeout...');
        startSync()
          .then(() => console.log('🚀 [BalanceSync] ✅ Auto-sync iniciado com sucesso!'))
          .catch(error => {
            console.error('❌ [BalanceSync] Erro no auto-start:', error);
            // Tentar novamente após 5 segundos
            setTimeout(() => {
              console.log('🔄 [BalanceSync] Tentativa 2 de auto-start...');
              startSync().catch(e => console.error('❌ [BalanceSync] Tentativa 2 falhou:', e));
            }, 5000);
          });
      }, 1000);
      
      return () => clearTimeout(autoStartTimer);
      
    } else {
      if (!user?.publicKey) {
        console.log('⚠️ [BalanceSync] ❌ Auto-start cancelado - usuário sem publicKey');
        console.log('⚠️ [BalanceSync] Detalhes user:', JSON.stringify(user, null, 2));
      }
      if (isActive) {
        console.log('ℹ️ [BalanceSync] ✅ Auto-start não necessário - já está ativo');
      }
    }
  }, [user, isActive, startSync]);

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