import { useState, useEffect, useCallback, useRef } from 'react';
import { userService } from '@/services/api';
import useAuthStore from '@/store/authStore';
import api from '@/services/api';

// Tempo de atualização configurável (padrão: 5 minutos)
// Futuramente pode ser personalizado por usuário (ex: premium = 1 minuto)
const DEFAULT_REFRESH_INTERVAL_MS = 5 * 60 * 1000;

const getRefreshInterval = (userPlan = 'BASIC') => {
  switch (userPlan) {
    case 'PREMIUM': return 1 * 60 * 1000; // 1 minuto para usuários premium
    case 'PRO': return 2 * 60 * 1000;     // 2 minutos para usuários pro
    case 'BASIC':
    default: return DEFAULT_REFRESH_INTERVAL_MS; // 5 minutos para usuários básicos
  }
};

// Função para disparar evento de notificações
const triggerNotificationRefresh = () => {
  const event = new CustomEvent('refreshNotifications');
  window.dispatchEvent(event);
};

const useCacheData = () => {
  const [cachedUser, setCachedUser] = useState(null);
  const [balances, setBalances] = useState({
    network: 'testnet',
    balancesTable: {},
    tokenBalances: [],
    totalTokens: 0,
    categories: null
  });
  const [loading, setLoading] = useState(true);

  // Store
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const cacheLoaded = useAuthStore((s) => s.cacheLoaded);
  const setCacheLoaded = useAuthStore((s) => s.setCacheLoaded);
  const cacheLoading = useAuthStore((s) => s.cacheLoading);
  const setCacheLoading = useAuthStore((s) => s.setCacheLoading);
  const maskBalances = useAuthStore((s) => s.maskBalances);
  const setMaskBalances = useAuthStore((s) => s.setMaskBalances);
  const toggleMaskBalances = useAuthStore((s) => s.toggleMaskBalances);

  const hasLoadedRef = useRef(false);
  const currentUserEmailRef = useRef(null);
  const refreshTimerRef = useRef(null);
  const isLoadingRef = useRef(false);

  // Função para criar notificação de mudança de balance
  const createBalanceNotification = useCallback(async (changes) => {
    if (!user?.id || changes.length === 0) return;

    try {
      // Se houver apenas 1 mudança, criar notificação detalhada
      if (changes.length === 1) {
        const change = changes[0];
        const oldValue = parseFloat(change.oldValue);
        const newValue = parseFloat(change.newValue);
        const difference = parseFloat(change.difference);
        const percentage = oldValue > 0 ? ((difference / oldValue) * 100).toFixed(2) : 0;
        
        let title = '';
        let message = '';
        let emoji = '';
        
        if (change.type === 'new') {
          emoji = '🆕';
          title = `${emoji} Novo Token Recebido - ${change.token}`;
          message = `Você recebeu ${change.newValue} ${change.token} em sua carteira`;
        } else if (change.type === 'increase') {
          emoji = '💰';
          title = `${emoji} Saldo Aumentou - ${change.token}`;
          message = `Seu saldo do token ${change.token} aumentou ${Math.abs(difference).toFixed(6)} de ${change.oldValue} para ${change.newValue} (+${Math.abs(percentage)}%)`;
        } else if (change.type === 'decrease') {
          emoji = '📉';
          title = `${emoji} Saldo Diminuiu - ${change.token}`;
          message = `Seu saldo do token ${change.token} diminuiu ${Math.abs(difference).toFixed(6)} de ${change.oldValue} para ${change.newValue} (-${Math.abs(percentage)}%)`;
        }

        const notificationData = {
          userId: user.id,
          title,
          message,
          sender: 'coinage',
          data: {
            type: 'balance_update',
            changes: [change],
            timestamp: new Date().toISOString()
          }
        };

        await api.post('/api/notifications/create', notificationData);
        
      } else {
        // Múltiplas mudanças - criar uma notificação para cada uma
        for (const change of changes) {
          const oldValue = parseFloat(change.oldValue);
          const newValue = parseFloat(change.newValue);
          const difference = parseFloat(change.difference);
          const percentage = oldValue > 0 ? ((difference / oldValue) * 100).toFixed(2) : 0;
          
          let title = '';
          let message = '';
          let emoji = '';
          
          if (change.type === 'new') {
            emoji = '🆕';
            title = `${emoji} Novo Token Recebido - ${change.token}`;
            message = `Você recebeu ${change.newValue} ${change.token} em sua carteira`;
          } else if (change.type === 'increase') {
            emoji = '💰';
            title = `${emoji} Saldo Aumentou - ${change.token}`;
            message = `Seu saldo do token ${change.token} aumentou ${Math.abs(difference).toFixed(6)} de ${change.oldValue} para ${change.newValue} (+${Math.abs(percentage)}%)`;
          } else if (change.type === 'decrease') {
            emoji = '📉';
            title = `${emoji} Saldo Diminuiu - ${change.token}`;
            message = `Seu saldo do token ${change.token} diminuiu ${Math.abs(difference).toFixed(6)} de ${change.oldValue} para ${change.newValue} (-${Math.abs(percentage)}%)`;
          }

          const notificationData = {
            userId: user.id,
            title,
            message,
            sender: 'coinage',
            data: {
              type: 'balance_update',
              changes: [change],
              timestamp: new Date().toISOString()
            }
          };

          await api.post('/api/notifications/create', notificationData);
          
          // Pequeno delay entre notificações para evitar spam
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      // Disparar evento para atualizar o componente de notificações
      triggerNotificationRefresh();
      
    } catch (error) {
      // Log apenas em caso de erro crítico (não 401)
      if (error.response?.status !== 401) {
        console.error('❌ [CacheData] Erro ao criar notificação de balance:', {
          error: error.message,
          status: error.response?.status,
          changes: changes?.length || 0
        });
      }
    }
  }, [user?.id]);

  // Função para detectar mudanças nos balances
  const detectBalanceChanges = useCallback((newBalances, oldBalances) => {
    try {
      if (!newBalances?.balancesTable || !oldBalances?.balancesTable) {
        return [];
      }
      
      const changes = [];
      const newTable = newBalances.balancesTable;
      const oldTable = oldBalances.balancesTable;
      
      // Verificar mudanças em tokens existentes
      Object.keys(newTable).forEach(token => {
        try {
          const newValue = parseFloat(newTable[token] || 0);
          const oldValue = parseFloat(oldTable[token] || 0);
          
          if (Math.abs(newValue - oldValue) > 0.000001) { // Tolerância para precisão
            const difference = newValue - oldValue;
            const change = {
              token,
              oldValue: oldValue.toFixed(6),
              newValue: newValue.toFixed(6),
              difference: difference.toFixed(6),
              type: oldValue === 0 ? 'new' : (difference > 0 ? 'increase' : 'decrease')
            };
            changes.push(change);
          }
        } catch (tokenError) {
          // Erro ao processar token ignorado
        }
      });
      
      // Verificar tokens que sumiram
      Object.keys(oldTable).forEach(token => {
        try {
          if (!(token in newTable) && parseFloat(oldTable[token]) > 0) {
            const change = {
              token,
              oldValue: parseFloat(oldTable[token]).toFixed(6),
              newValue: '0.000000',
              difference: (-parseFloat(oldTable[token])).toFixed(6),
              type: 'decrease'
            };
            changes.push(change);
          }
        } catch (tokenError) {
          // Erro ao processar remoção ignorado
        }
      });
      
      return changes;
    } catch (error) {
      // Erro crítico na detecção de mudanças ignorado
      return [];
    }
  }, []);

  const loadCacheData = useCallback(async (reason = 'auto') => {
    // Reset ao trocar usuário
    if (currentUserEmailRef.current !== user?.email) {
      hasLoadedRef.current = false;
      currentUserEmailRef.current = user?.email;
      setCacheLoaded(false);
      setCacheLoading(false);
    }

    if (!user?.email) {
      setLoading(false);
      setBalances({ network: 'testnet', balancesTable: {}, tokenBalances: [], totalTokens: 0, categories: null });
      return;
    }

    // Evitar reentrância dupla
    if (isLoadingRef.current) return;
    if (cacheLoading) return;
    if (hasLoadedRef.current && reason !== 'silent') return;

    isLoadingRef.current = true;
    setCacheLoading(true);
    // Só mostrar loading se não for silent
    if (reason !== 'silent') {
      setLoading(true);
    }

    try {
      const userResponse = await userService.getUserByEmail(user.email);
      
      if (userResponse.success && userResponse.data?.user) {
        const userData = userResponse.data.user;
        
        // Log para debug do userPlan
        // console.log('🔍 [CacheData] Debug - userData carregado:', {
        //   id: userData.id,
        //   email: userData.email,
        //   userPlan: userData.userPlan,
        //   hasUserPlan: 'userPlan' in userData
        // });
        
        // Sempre verificar mudanças nos dados do usuário
        if (reason === 'silent' && cachedUser && userData.id === cachedUser.id) {
          // Comparar timestamps ou dados importantes para detectar mudanças

        }
        
        setCachedUser(userData);
        updateUser(userData);

        if (userData?.publicKey) {
          const balanceResponse = await userService.getUserBalances(userData.publicKey);
          
          if (balanceResponse.success) {
            const newBalanceData = balanceResponse.data;
            
            // Sempre detectar mudanças nos balances (mais sensível)
            if (reason === 'silent' && balances && balances.totalTokens !== undefined) {
              const balanceChanged = newBalanceData.totalTokens !== balances.totalTokens ||
                                   JSON.stringify(newBalanceData.balancesTable) !== JSON.stringify(balances.balancesTable) ||
                                   newBalanceData.timestamp !== balances.timestamp;
              
              if (balanceChanged) {
                // Detectar mudanças específicas nos tokens
                const changes = detectBalanceChanges(newBalanceData, balances);
                
                if (changes.length > 0) {
                  // Criar notificação apenas se houver mudanças reais nos valores
                  try {
                    await createBalanceNotification(changes);
                  } catch (notificationError) {
                    // Erro ao criar notificação ignorado
                    // Continuar mesmo se a notificação falhar
                  }
                }
                
                setLoading(true); // Mostrar loading brevemente para indicar atualização
              }
            } else if (reason === 'silent') {
              // Primeira vez ou dados não existiam - sempre mostrar loading
              setLoading(true);
            }
            
            setBalances(newBalanceData);
            setCacheLoaded(true);
          } else {
            // Erro ao carregar balances
            setBalances({ network: 'testnet', balancesTable: {}, tokenBalances: [], totalTokens: 0, categories: null });
          }
        } else {
          // PublicKey não encontrada
          setBalances({ network: 'testnet', balancesTable: {}, tokenBalances: [], totalTokens: 0, categories: null });
        }
      } else {
        // Resposta inválida
        setBalances({ network: 'testnet', balancesTable: {}, tokenBalances: [], totalTokens: 0, categories: null });
      }
    } catch (error) {
      // Se for erro 401 em modo silent, não mostrar erro
      if (error.response?.status === 401 && reason === 'silent') {
        // Não fazer nada, deixar o sistema lidar com o refresh token
        return;
      }
      
      // Log apenas erros que não sejam 401 em silent
      if (!(error.response?.status === 401 && reason === 'silent')) {
        console.error('❌ [CacheData] Erro ao carregar dados do cache:', {
          error: error.message,
          status: error.response?.status,
          url: error.config?.url,
          userEmail: user?.email,
          reason: reason
        });
      }
      
      setBalances({ network: 'testnet', balancesTable: {}, tokenBalances: [], totalTokens: 0, categories: null });
    } finally {
      // Parar loading com timeout para dar tempo de mostrar a mudança
      if (reason === 'silent') {
        // Para silent, dar 1 segundo para mostrar que houve atualização
        setTimeout(() => {
          setLoading(false);
        }, 1000);
      } else {
        setLoading(false);
      }
      setCacheLoading(false);
      isLoadingRef.current = false;
      hasLoadedRef.current = true;
    }
  }, [user?.email, cacheLoaded, cacheLoading, setCacheLoaded, setCacheLoading, detectBalanceChanges, createBalanceNotification]);

  // useEffect principal - carregar dados iniciais
  useEffect(() => {
    if (user?.email) {
      loadCacheData('initial');
    } else {
      // Limpar dados se não há usuário
      setBalances({ network: 'testnet', balancesTable: {}, tokenBalances: [], totalTokens: 0, categories: null });
      setCachedUser(null);
      setLoading(false);
    }
  }, [user?.email, loadCacheData]);

  // Atualização automática com intervalo configurável por usuário
  // IMPORTANTE: Este useEffect deve vir DEPOIS do principal para garantir que cachedUser seja carregado primeiro
  useEffect(() => {
    // Só configurar auto-sync se tivermos dados do usuário
    if (!cachedUser?.userPlan) {
      // console.log('⏳ [CacheData] Aguardando dados do usuário para configurar auto-sync...');
      return;
    }

    // Configurar verificação automática baseada no plano do usuário
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
    }
    
    // Pegar o plano do usuário dos dados do cache
    const userPlan = cachedUser.userPlan;
    const refreshInterval = getRefreshInterval(userPlan);
    
    // Log detalhado para debug
    // console.log('🔍 [CacheData] Debug - Dados do usuário:', {
    //   cachedUser: {
    //     id: cachedUser.id,
    //     email: cachedUser.email,
    //     userPlan: cachedUser.userPlan
    //   },
    //   userPlan: userPlan,
    //   refreshInterval: refreshInterval,
    //   refreshIntervalMinutes: refreshInterval / 60000
    // });
    
    // console.log(`🔄 [CacheData] Configurando auto-sync: ${refreshInterval/60000} minutos (plano: ${userPlan})`);
    
    refreshTimerRef.current = setInterval(() => {
      try {
        loadCacheData('silent');
      } catch (error) {
        // Log apenas erros que não sejam 401 em auto-sync
        if (!(error.response?.status === 401)) {
          console.error('❌ [CacheData] Erro no auto-sync:', {
            error: error.message,
            status: error.response?.status,
            timestamp: new Date().toISOString()
          });
        }
      }
    }, refreshInterval);
    
    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [cachedUser?.userPlan, loadCacheData]);

  const formatBalance = useCallback((balance) => {
    if (!balance || balance === '0' || balance === 0) return '0.000000';
    return parseFloat(balance).toFixed(6);
  }, []);

  const getCorrectAzeSymbol = useCallback(() => {
    if (!balances) return 'AZE';
    const network = balances.network || 'testnet';
    return network === 'testnet' ? 'AZE-t' : 'AZE';
  }, [balances]);

  const getBalance = useCallback((symbol) => {
    if (!balances) return '0.000000';
    // Não converter automaticamente - deixar que os componentes passem o símbolo correto
    if (balances.balancesTable && balances.balancesTable[symbol]) return formatBalance(balances.balancesTable[symbol]);
    if (balances.tokenBalances && Array.isArray(balances.tokenBalances)) {
      const token = balances.tokenBalances.find(t => t.tokenSymbol === symbol || t.tokenName === symbol);
      if (token) return formatBalance(token.balanceEth || token.balance);
    }
    // Fallback específico para AZE/AZE-t se não encontrou ainda
    if (symbol === 'AZE' || symbol === 'AZE-t') {
      if (balances.azeBalance) return formatBalance(balances.azeBalance.balanceEth);
      if (balances.balancesTable && balances.balancesTable.AZE) return formatBalance(balances.balancesTable.AZE);
      if (balances.balancesTable && balances.balancesTable['AZE-t']) return formatBalance(balances.balancesTable['AZE-t']);
      if (balances.tokenBalances && Array.isArray(balances.tokenBalances)) {
        const azeToken = balances.tokenBalances.find(t => ['AZE', 'AZE-t'].includes(t.tokenSymbol) || ['AZE', 'AZE-t'].includes(t.tokenName));
        if (azeToken) return formatBalance(azeToken.balanceEth || azeToken.balance);
      }
    }
    return '0.000000';
  }, [balances, formatBalance]);

  // Formatações (CPF e Telefone) no padrão brasileiro
  const formatCPF = useCallback((cpf) => {
    if (!cpf) return '';
    const cleaned = String(cpf).replace(/\D/g, '');
    if (cleaned.length !== 11) return cpf;
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }, []);

  const formatPhone = useCallback((phone) => {
    if (!phone) return '';
    const cleaned = String(phone).replace(/\D/g, '');
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (cleaned.length === 10) {
      return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return phone;
  }, []);

  // Aplicar/retirar blur globalmente aos valores com classe .balance
  useEffect(() => {
    const root = document.documentElement;
    if (maskBalances) root.classList.add('mask-balances');
    else root.classList.remove('mask-balances');
  }, [maskBalances]);

  return {
    cachedUser,
    balances,
    loading,
    getBalance,
    formatBalance,
    getCorrectAzeSymbol,
    reloadData: () => loadCacheData('manual'),
    // Controle de máscara
    maskBalances,
    setMaskBalances,
    toggleMaskBalances,
    // Formatações
    formatCPF,
    formatPhone,
  };
};

export default useCacheData;

