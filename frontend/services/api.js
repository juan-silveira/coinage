import axios from 'axios';
import useAuthStore from '@/store/authStore';

// Configuração base da API
const API_BASE_URL = 'http://localhost:8800';

// Instância do axios
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 segundos para evitar timeout
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

    // Log do erro para debug
    console.log('🔍 [API] Erro interceptado:', {
      url: originalRequest?.url,
      method: originalRequest?.method,
      status: error.response?.status,
      message: error.message
    });

    // Se o erro for 401 e não for uma tentativa de refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const { refreshToken, logout, isAuthenticated } = useAuthStore.getState();
      
      // IMPORTANTE: Não fazer logout automático em endpoints de sincronização
      const isSyncRequest = originalRequest?.url?.includes('/balance-sync/') || 
                           originalRequest?.url?.includes('/notifications/') ||
                           originalRequest?.url?.includes('azorescan.com');
      
      if (isSyncRequest) {
        console.log('⚠️ [API] Erro 401 em requisição de sync - NÃO fazendo logout automático');
        return Promise.reject(error);
      }
      
      // Só tentar refresh se o usuário estiver autenticado
      if (isAuthenticated && refreshToken) {
        try {
          console.log('🔄 [API] Tentando renovar token...');
          // Tentar renovar o token
          const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
            refreshToken
          });

          const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data.data;
          
          console.log('✅ [API] Token renovado com sucesso');
          // Atualizar tokens no store
          useAuthStore.getState().setTokens(newAccessToken, newRefreshToken);
          
          // Retry da requisição original
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          console.error('❌ [API] Erro ao renovar token:', {
            error: refreshError.message,
            status: refreshError.response?.status,
            data: refreshError.response?.data
          });
          
          // NÃO fazer logout automático por falhas de refresh token
          // Deixar o usuário continuar logado e tentar novamente depois
          console.warn('⚠️ [API] Falha no refresh token - usuário continua logado');
          
          // Só fazer logout se for explicitamente um token inválido do servidor
          const isTokenInvalid = refreshError.response?.status === 401 && 
                               (refreshError.response?.data?.message?.toLowerCase().includes('invalid token') ||
                                refreshError.response?.data?.message?.toLowerCase().includes('token expired'));
          
          if (isTokenInvalid) {
            console.error('🚪 [API] LOGOUT - Token refresh inválido');
            logout('invalid_refresh_token');
            setTimeout(() => window.location.href = '/login', 1000);
          }
          
          return Promise.reject(refreshError);
        }
      } else if (isAuthenticated && !isSyncRequest && !refreshToken) {
        // Só fazer logout se NÃO tiver refresh token E não for requisição de sync
        console.error('🚪 [API] LOGOUT - Sem refresh token');
        logout('no_refresh_token');
        setTimeout(() => window.location.href = '/login', 1000);
      } else {
        // Para outros casos, apenas logar o erro
        console.warn('⚠️ [API] Erro 401 - Continua logado:', {
          isAuthenticated,
          hasRefreshToken: !!refreshToken,
          isSyncRequest,
          url: originalRequest?.url
        });
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

  // Refresh Token
  refreshToken: async (refreshToken) => {
    try {
      const response = await api.post('/api/auth/refresh-token', {
        refreshToken
      });
      return response.data;
    } catch (error) {
      throw error;
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
    const response = await api.post('/api/auth/refresh', {
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

  // Obter saldos do usuário por endereço (usa endpoint fresh que inclui AZE-t nativo)
  getUserBalances: async (address, network = 'testnet', forceRefresh = false) => {
    // Usar o novo endpoint que busca dados frescos incluindo AZE-t
    const response = await api.get(`/api/balance-sync/fresh`, {
      params: { 
        address: address,
        network: network
      }
    });
    
    // Transformar resposta para o formato esperado pelos hooks
    if (response.data.success && response.data.data) {
      const balanceData = response.data.data;
      return {
        success: true,
        data: {
          network: balanceData.network || 'testnet',
          balancesTable: balanceData.balancesTable || {},
          tokenBalances: balanceData.tokenBalances || [],
          totalTokens: balanceData.totalTokens || 0,
          address: balanceData.address || address,
          azeBalance: balanceData.azeBalance,
          timestamp: balanceData.timestamp || new Date().toISOString(),
          fromCache: false
        }
      };
    }
    
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

// Serviços de earnings (proventos)
export const earningsService = {
  // Obter proventos do usuário
  getUserEarnings: async (params = {}) => {
    const response = await api.get('/api/earnings', { params });
    return response.data;
  },

  // Obter dados para gráfico
  getEarningsForChart: async (params = {}) => {
    const response = await api.get('/api/earnings/chart', { params });
    return response.data;
  },

  // Obter resumo dos proventos
  getEarningsSummary: async (network = 'testnet') => {
    const response = await api.get('/api/earnings/summary', { params: { network } });
    return response.data;
  },

  // Obter proventos por período
  getEarningsByPeriod: async (startDate, endDate, network = 'testnet') => {
    const response = await api.get('/api/earnings/period', { 
      params: { startDate, endDate, network } 
    });
    return response.data;
  },

  // Criar novo provento (admin)
  createEarning: async (earningData) => {
    const response = await api.post('/api/earnings', earningData);
    return response.data;
  },

  // Atualizar provento (admin)
  updateEarning: async (id, updateData) => {
    const response = await api.put(`/api/earnings/${id}`, updateData);
    return response.data;
  },

  // Desativar provento (admin)
  deactivateEarning: async (id) => {
    const response = await api.delete(`/api/earnings/${id}`);
    return response.data;
  },
};

export default api;
