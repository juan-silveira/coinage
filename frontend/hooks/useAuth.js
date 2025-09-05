/**
 * useAuth Hook - Hook temporário para autenticação
 * 
 * Este é um hook temporário para resolver dependências.
 * Deve ser substituído pelo hook real de autenticação do sistema.
 */

import { useState, useEffect, createContext, useContext } from 'react';
import useAuthStore from '@/store/authStore';

// Context temporário
const AuthContext = createContext({});

// Hook de autenticação temporário
export const useAuth = () => {
  const { user: storeUser, setUser: setStoreUser } = useAuthStore();
  
  // Inicializar usuário no store e garantir walletAddress para Ivan
  useEffect(() => {
    if (!storeUser) {
      // Definir usuário Ivan com todas as permissões necessárias
      const mockUser = {
        id: '1',
        name: 'Ivan Alberton',
        email: 'ivan.alberton@navi.inf.br',
        walletAddress: '0x5528C065931f523CA9F3a6e49a911896fb1D2e6f',
        userCompanies: [
          {
            role: 'SUPER_ADMIN',
            companyId: '1',
            company: {
              id: '1',
              name: 'Navi'
            }
          }
        ]
      };
      
      setStoreUser(mockUser);
    } else if (storeUser.email === 'ivan.alberton@navi.inf.br' && !storeUser.walletAddress) {
      // Se for Ivan mas não tem walletAddress, adicionar
      const updatedUser = {
        ...storeUser,
        walletAddress: '0x5528C065931f523CA9F3a6e49a911896fb1D2e6f',
        userCompanies: storeUser.userCompanies || [
          {
            role: 'SUPER_ADMIN',
            companyId: '1',
            company: {
              id: '1',
              name: 'Navi'
            }
          }
        ]
      };
      
      setStoreUser(updatedUser);
    }
  }, [storeUser, setStoreUser]);

  return {
    user: storeUser,
    isAuthenticated: true,
    loading: false,
    login: () => Promise.resolve(),
    logout: () => Promise.resolve(),
    setUser: setStoreUser
  };
};

// Provider temporário (caso necessário)
export const AuthProvider = ({ children }) => {
  const auth = useAuth();
  
  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
};

export default useAuth;