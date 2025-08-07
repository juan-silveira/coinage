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

      // Ações
      setUser: (user) => set({ user }),
      
      setTokens: (accessToken, refreshToken) => 
        set({ accessToken, refreshToken, isAuthenticated: true }),
      
      setRequiresPasswordChange: (requires) => 
        set({ requiresPasswordChange: requires }),
      
      setLoading: (loading) => set({ isLoading: loading }),
      
      login: (user, accessToken, refreshToken, requiresPasswordChange = false) => {
        // Verificar se o user existe e tem name antes de salvar
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
          isLoading: false
        });
      },
      
      logout: () => {
        // Salvar flag de logout no sessionStorage
        sessionStorage.setItem('showLogoutSuccess', 'true');
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          requiresPasswordChange: false,
          isLoading: false
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
      }),
    }
  )
);

export default useAuthStore;
