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
          // reset flags de cache ao fazer login
          cacheLoaded: false,
          cacheLoading: false,
        });
      },
      
      logout: (reason = 'manual') => {
        const state = get();
        let companyAlias = 'coinage'; // fallback padrão
        
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
      
      // Ações para cache de balances
      setCachedBalances: (balances) =>
        set({ 
          cachedBalances: balances, 
          balancesLastUpdate: Date.now(),
          balancesLoading: false 
        }),
      
      setBalancesLoading: (loading) =>
        set({ balancesLoading: loading }),
      
      clearCachedBalances: () =>
        set({ 
          cachedBalances: null, 
          balancesLastUpdate: null,
          balancesLoading: false 
        }),
      
      clearRequiresPasswordChange: () =>
        set({ requiresPasswordChange: false }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        // Persistir dados de autenticação de forma segura
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        requiresPasswordChange: state.requiresPasswordChange,
        
        // Outros dados não essenciais
        maskBalances: state.maskBalances,
      }),
    }
  )
);

export default useAuthStore;
