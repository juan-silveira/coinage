import axios from 'axios';
import useAuthStore from '@/store/authStore';

// Configuração base da API
const API_BASE_URL = 'http://localhost:8800';

// Instância do axios
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token de autenticação
api.interceptors.request.use(
  (config) => {
    const { accessToken } = useAuthStore.getState();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratamento de respostas
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Se o erro for 401 e não for uma tentativa de refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const { refreshToken, logout, isAuthenticated } = useAuthStore.getState();
      
      // Só tentar refresh se o usuário estiver autenticado
      if (isAuthenticated && refreshToken) {
        try {
          // Tentar renovar o token
          const response = await axios.post(`${API_BASE_URL}/api/auth/refresh-token`, {
            refreshToken
          });

          const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;
          
          // Atualizar tokens no store
          useAuthStore.getState().setTokens(newAccessToken, newRefreshToken);
          
          // Retry da requisição original
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Se falhar o refresh, fazer logout
          logout();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else if (isAuthenticated) {
        // Usuário autenticado mas sem refresh token, fazer logout
        logout();
        window.location.href = '/login';
      }
      // Se não estiver autenticado, não fazer nada (provavelmente é erro de login)
    }

    return Promise.reject(error);
  }
);

// Serviços de autenticação
export const authService = {
  // Login
  login: async (email, password) => {
    try {
      const response = await api.post('/api/auth/login', {
        email,
        password
      });
      // O backend retorna { success: true, data: { user, accessToken, ... } }
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Logout
  logout: async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (error) {
      // Erro no logout silencioso
    }
  },

  // Alterar senha
  changePassword: async (oldPassword, newPassword) => {
    const response = await api.post('/api/auth/change-password', {
      currentPassword: oldPassword,
      newPassword
    });
    return response.data;
  },

  // Refresh token
  refreshToken: async (refreshToken) => {
    const response = await api.post('/api/auth/refresh-token', {
      refreshToken
    });
    return response.data;
  },

  // Obter usuário atual
  getCurrentUser: async () => {
    const response = await api.get('/api/auth/me');
    return response.data;
  },
};

// Serviços de usuário
export const userService = {
  // Listar usuários
  getUsers: async (params = {}) => {
    const response = await api.get('/api/users', { params });
    return response.data;
  },

  // Obter usuário por ID
  getUserById: async (id) => {
    const response = await api.get(`/api/users/${id}`);
    return response.data;
  },

  // Obter usuário por email (inclui dados do cache)
  getUserByEmail: async (email) => {
    const response = await api.get(`/api/users/email/${email}`);
    return response.data;
  },

  // Criar usuário
  createUser: async (userData) => {
    const response = await api.post('/api/users', userData);
    return response.data;
  },

  // Atualizar usuário
  updateUser: async (id, userData) => {
    const response = await api.put(`/api/users/${id}`, userData);
    return response.data;
  },

  // Obter saldos do usuário por endereço (consulta direta à blockchain)
  getUserBalances: async (address, network = 'testnet') => {
    const response = await api.get(`/api/users/address/${address}/balances`, {
      params: { network }
    });
    return response.data;
  },
};

// Serviços de transações
export const transactionService = {
  // Listar transações
  getTransactions: async (params = {}) => {
    const response = await api.get('/api/transactions', { params });
    return response.data;
  },

  // Obter estatísticas
  getStats: async () => {
    const response = await api.get('/api/transactions/stats');
    return response.data;
  },
};

// Serviços de tokens
export const tokenService = {
  // Listar tokens
  getTokens: async (params = {}) => {
    const response = await api.get('/api/tokens', { params });
    return response.data;
  },

  // Obter saldo de token
  getTokenBalance: async (contractAddress, walletAddress, network = 'testnet') => {
    const response = await api.post('/api/tokens/balance', {
      contractAddress,
      walletAddress,
      network
    });
    return response.data;
  },
};

export default api;
