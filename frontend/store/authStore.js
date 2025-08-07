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
      
      logout: () => {
        sessionStorage.setItem('showLogoutSuccess', 'true');
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          requiresPasswordChange: false,
          isLoading: false,
          cacheLoaded: false,
          cacheLoading: false,
        });
      },
      
      updateUser: (userData) =>
        set((state) => ({
          user: { ...state.user, ...userData }
        })),
      
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
