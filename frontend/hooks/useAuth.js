/**
 * useAuth Hook - Hook temporário para autenticação
 * 
 * Este é um hook temporário para resolver dependências.
 * Deve ser substituído pelo hook real de autenticação do sistema.
 */

import { useState, useEffect, createContext, useContext } from 'react';

// Context temporário
const AuthContext = createContext({});

// Hook de autenticação temporário
export const useAuth = () => {
  // Retorna um usuário mock por enquanto
  const [user, setUser] = useState({
    id: '1',
    name: 'Usuário Demo',
    email: 'demo@example.com',
    walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb8' // Address mock
  });

  return {
    user,
    isAuthenticated: true,
    loading: false,
    login: () => Promise.resolve(),
    logout: () => Promise.resolve(),
    setUser
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