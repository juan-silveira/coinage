import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set, get) => ({
      // Estado
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      requiresPasswordChange: false,
      cacheLoaded: false, // indica se o cache já foi carregado nesta sessão
      cacheLoading: false, // evita concorrência em carregamentos
      maskBalances: false, // se true, aplica blur nos valores
      notifications: [], // notificações do sistema
      profilePhotoUrl: null, // URL da foto de perfil
      profilePhotoTimestamp: null, // timestamp da última atualização da foto
      
      // Cache de balances
      cachedBalances: null,
      balancesLastUpdate: null,
      balancesLoading: false,

      // Ações
      setUser: (user) => set({ user }),
      
      setTokens: (accessToken, refreshToken) => 
        set({ accessToken, refreshToken, isAuthenticated: true }),
      
      setRequiresPasswordChange: (requires) => 
        set({ requiresPasswordChange: requires }),
      
      setLoading: (loading) => set({ isLoading: loading }),

      setCacheLoaded: (loaded) => set({ cacheLoaded: loaded }),
      setCacheLoading: (loading) => set({ cacheLoading: loading }),

      setMaskBalances: (masked) => set({ maskBalances: masked }),
      toggleMaskBalances: () => set((s) => ({ maskBalances: !s.maskBalances })),

      // Notificações
      addNotification: (notification) => set((state) => ({
        notifications: [...state.notifications, notification]
      })),
      
      removeNotification: (id) => set((state) => ({
        notifications: state.notifications.filter(n => n.id !== id)
      })),
      
      markNotificationAsRead: (id) => set((state) => ({
        notifications: state.notifications.map(n => 
          n === id ? { ...n, isRead: true } : n
        )
      })),
      
      clearNotifications: () => set({ notifications: [] }),
      
      // Ações para foto de perfil
      setProfilePhotoUrl: (url) => set({ 
        profilePhotoUrl: url,
        profilePhotoTimestamp: Date.now()
      }),
      
      clearProfilePhoto: () => set({ 
        profilePhotoUrl: null,
        profilePhotoTimestamp: null 
      }),
      
      login: (user, accessToken, refreshToken, requiresPasswordChange = false) => {
        // CRÍTICO: Limpar TODO o cache ANTES de fazer login
        try {
          // Limpar TODOS os storages relacionados a balances
          const keysToRemove = [
            'coinage_balance_backup_v3',
            'coinage_session_backup_v3', 
            'coinage_last_known_balances_v3',
            'coinage_emergency_used_v3',
            'balanceSync_cache',
            'balanceSync_lastFetch',
            'auth-storage', // Limpar auth storage antigo
          ];
          
          keysToRemove.forEach(key => {
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
          });
          
          // Limpar IndexedDB se existir
          if (typeof window !== 'undefined' && window.indexedDB) {
            indexedDB.deleteDatabase('CoinageBalanceBackup');
          }
          
          console.log('[AUTH] Cache completamente limpo no login para usuário:', user?.id);
        } catch (e) {
          console.error('[AUTH] Erro ao limpar cache no login:', e);
        }
        
        if (user && user.name) {
          sessionStorage.setItem('showLoginSuccess', 'true');
          sessionStorage.setItem('loginUserName', user.name);
        }
        
        // Tentar salvar a company atual da URL para usar no logout
        try {
          const currentPath = window.location.pathname;
          const pathMatch = currentPath.match(/\/(login|register)\/([^\/\?]+)/);
          if (pathMatch && pathMatch[2]) {
            sessionStorage.setItem('currentLoginCompany', pathMatch[2]);
          }
        } catch (e) {
          // Falha silenciosa
        }
        
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          requiresPasswordChange,
          isLoading: false,
          // CRÍTICO: Limpar COMPLETAMENTE cache de balances no login para evitar cross-user contamination
          cacheLoaded: false,
          cacheLoading: false,
          cachedBalances: null,
          balancesLastUpdate: null,
          balancesLoading: false,
          notifications: [], // Limpar notificações do usuário anterior
          profilePhotoUrl: null, // Limpar foto do usuário anterior
        });
      },
      
      logout: (reason = 'manual') => {
        const state = get();
        let companyAlias = 'coinage'; // fallback padrão
        
        // CRÍTICO: Limpar TODO o cache de balances antes de fazer logout
        try {
          // Limpar cache do balanceBackupService
          if (typeof window !== 'undefined') {
            const { default: balanceBackupService } = require('@/services/balanceBackupService');
            if (state.user?.id) {
              balanceBackupService.clearAll(state.user.id);
            }
          }
          
          // Limpar outros caches relacionados a balances
          localStorage.removeItem('coinage_balance_backup_v3');
          localStorage.removeItem('coinage_last_known_balances_v3');
          localStorage.removeItem('coinage_emergency_used_v3');
          sessionStorage.removeItem('coinage_session_backup_v3');
        } catch (e) {
          console.warn('Erro ao limpar cache de balances:', e);
        }
        
        // PRIORIDADE 0: Obter do sessionStorage (salvo no login)
        try {
          const sessionCompany = sessionStorage.getItem('currentLoginCompany');
          if (sessionCompany) {
            companyAlias = sessionCompany;
          }
        } catch (e) {
          // Falha silenciosa
        }
        
        // PRIORIDADE 1: Obter do CompanyContext (company da sessão atual)
        if (companyAlias === 'coinage') {
          try {
            const companyData = localStorage.getItem('company-context-storage');
            if (companyData) {
              const parsed = JSON.parse(companyData);
              if (parsed?.state?.currentCompany?.alias) {
                companyAlias = parsed.state.currentCompany.alias;
              }
            }
          } catch (e) {
            // Falha silenciosa
          }
        }
        
        // PRIORIDADE 2: Se não encontrou no CompanyContext, tentar do usuário
        if (companyAlias === 'coinage' && state.user?.company_alias) {
          companyAlias = state.user.company_alias;
        }
        
        // PRIORIDADE 3: Se ainda não encontrou, tentar obter da URL atual
        if (companyAlias === 'coinage') {
          try {
            const currentPath = window.location.pathname;
            const pathMatch = currentPath.match(/\/(login|register)\/([^\/\?]+)/);
            if (pathMatch && pathMatch[2]) {
              companyAlias = pathMatch[2];
            }
          } catch (e) {
            // Falha silenciosa
          }
        }
        
        // Limpar informações da sessão
        try {
          sessionStorage.removeItem('currentLoginCompany');
        } catch (e) {
          // Falha silenciosa
        }
        
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          requiresPasswordChange: false,
          isLoading: false,
          cacheLoaded: false,
          cacheLoading: false,
          notifications: [], // limpar notificações ao fazer logout
          profilePhotoUrl: null, // limpar foto de perfil ao fazer logout
          profilePhotoTimestamp: null,
          cachedBalances: null,
          balancesLastUpdate: null,
          balancesLoading: false,
        });
        
        // Retornar o company_alias para redirecionamento
        return companyAlias;
      },
      
      updateUser: (userData) =>
        set((state) => ({
          user: { ...state.user, ...userData }
        })),
      
      // Ações para cache de balances - PROTEÇÃO BRUTAL CONTRA SALDOS ZERADOS
      setCachedBalances: (balances) => {
        const state = get();
        
        // VERIFICAR SE OS NOVOS SALDOS ESTÃO VAZIOS OU ZERADOS
        const hasValidBalances = balances?.balancesTable && 
          Object.keys(balances.balancesTable).length > 0 && 
          Object.values(balances.balancesTable).some(val => parseFloat(val) > 0);

        // SE TENTOU SETAR SALDOS VAZIOS E JÁ TEMOS SALDOS VÁLIDOS, RECUSAR!
        if (!hasValidBalances && state.cachedBalances?.balancesTable && Object.keys(state.cachedBalances.balancesTable).length > 0) {
          
          // Manter saldos anteriores mas atualizar status de erro
          const protectedBalances = {
            ...state.cachedBalances,
            syncStatus: 'protected_from_zero',
            syncError: 'AuthStore bloqueou tentativa de zerar saldos',
            lastUpdated: new Date().toISOString(),
            protectedAt: Date.now()
          };
          
          return set({ 
            cachedBalances: protectedBalances, 
            balancesLastUpdate: Date.now(),
            balancesLoading: false 
          });
        }

        // SE NÃO HÁ SALDOS VÁLIDOS E NÃO TEMOS BACKUP, USAR VALORES DE EMERGÊNCIA
        if (!hasValidBalances && (!state.cachedBalances || Object.keys(state.cachedBalances.balancesTable || {}).length === 0)) {
          
          const emergencyBalances = {
            balancesTable: {
              'AZE-t': '0.000000',
              'cBRL': '0.000000', 
              'STT': '0.000000'
            },
            network: 'testnet',
            address: '0x5528C065931f523CA9F3a6e49a911896fb1D2e6f',
            lastUpdated: new Date().toISOString(),
            source: 'authstore_emergency',
            syncStatus: 'emergency_values',
            syncError: 'Valores de emergência aplicados pelo AuthStore',
            userId: state.user?.id,
            isEmergency: true
          };
          
          return set({ 
            cachedBalances: emergencyBalances, 
            balancesLastUpdate: Date.now(),
            balancesLoading: false 
          });
        }

        // Se chegou aqui, os saldos são válidos
        return set({ 
          cachedBalances: balances, 
          balancesLastUpdate: Date.now(),
          balancesLoading: false 
        });
      },
      
      setBalancesLoading: (loading) =>
        set({ balancesLoading: loading }),
      
      clearCachedBalances: () => {
        
        const emergencyBalances = {
          balancesTable: {
            'AZE-t': '0.000000',
            'cBRL': '0.000000', 
            'STT': '0.000000'
          },
          network: 'testnet',
          address: '0x5528C065931f523CA9F3a6e49a911896fb1D2e6f',
          lastUpdated: new Date().toISOString(),
          source: 'authstore_emergency_clear',
          syncStatus: 'emergency_after_clear',
          syncError: 'Clear bloqueado - valores de emergência mantidos',
          isEmergency: true
        };
        
        return set({ 
          cachedBalances: emergencyBalances, 
          balancesLastUpdate: Date.now(),
          balancesLoading: false 
        });
      },
      
      clearRequiresPasswordChange: () =>
        set({ requiresPasswordChange: false }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        // Persistir APENAS dados de autenticação
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        requiresPasswordChange: state.requiresPasswordChange,
        
        // NÃO PERSISTIR BALANCES - CAUSA PROBLEMAS DE SEGURANÇA ENTRE USUÁRIOS!
        // cachedBalances e balancesLastUpdate removidos intencionalmente
        
        // Outros dados não essenciais
        maskBalances: state.maskBalances,
      }),
    }
  )
);

export default useAuthStore;
