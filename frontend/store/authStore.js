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
          n.id === id ? { ...n, isRead: true } : n
        )
      })),
      
      clearNotifications: () => set({ notifications: [] }),
      
      login: (user, accessToken, refreshToken, requiresPasswordChange = false) => {
        if (user && user.name) {
          sessionStorage.setItem('showLoginSuccess', 'true');
          sessionStorage.setItem('loginUserName', user.name);
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
        // console.error('🚪 [AuthStore] LOGOUT EXECUTADO:', {
        //   reason,
        //   timestamp: new Date().toISOString(),
        //   stackTrace: new Error().stack
        // });
        
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
          cachedBalances: null,
          balancesLastUpdate: null,
          balancesLoading: false,
        });
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
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        requiresPasswordChange: state.requiresPasswordChange,
        maskBalances: state.maskBalances, // persistir preferência de ocultar valores
        // Não persistir cacheLoaded/cacheLoading
      }),
    }
  )
);

export default useAuthStore;
