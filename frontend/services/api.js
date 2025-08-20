import axios from 'axios';
import useAuthStore from '@/store/authStore';

// Configuração base da API
const API_BASE_URL = 'http://localhost:8800';

// Instância do axios
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 segundos para evitar timeout prematuro
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
      console.log('🔍 [API] Detectado erro 401, tentando refresh...', {
        url: originalRequest?.url,
        hasRetry: originalRequest._retry
      });
      
      originalRequest._retry = true;

      const { refreshToken, logout, isAuthenticated } = useAuthStore.getState();
      
      console.log('🔍 [API] Estado de autenticação:', {
        isAuthenticated,
        hasRefreshToken: !!refreshToken
      });
      
      // IMPORTANTE: Não fazer logout automático em endpoints de sincronização
      const isSyncRequest = originalRequest?.url?.includes('/balance-sync/') || 
                           originalRequest?.url?.includes('/notifications/') ||
                           originalRequest?.url?.includes('azorescan.com');
      
      if (isSyncRequest) {
        console.log('⚠️ [API] Erro 401 em requisição de sync - NÃO fazendo logout automático');
        
        // Para notificações, tentar refresh token silenciosamente
        if (isAuthenticated && refreshToken && originalRequest?.url?.includes('/notifications/')) {
          try {
            console.log('🔄 [API] Tentando renovar token para notificações...');
            const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
              refreshToken
            });

            const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data.data;
            
            console.log('✅ [API] Token renovado para notificações');
            // Atualizar tokens no store
            useAuthStore.getState().setTokens(newAccessToken, newRefreshToken);
            
            // Retry da requisição original
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return api(originalRequest);
          } catch (refreshError) {
            console.warn('⚠️ [API] Falha no refresh para notificações - continuando sem notificações');
            // Não fazer logout, apenas rejeitar a requisição
            return Promise.reject(error);
          }
        }
        
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
  // Login regular
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

  // Login whitelabel com company_alias
  loginWhitelabel: async (email, password, companyAlias) => {
    try {
      // Primeiro, buscar o company ID pelo alias
      const companyResponse = await api.get(`/api/whitelabel/company-branding/${companyAlias}`);
      
      if (!companyResponse.data.success) {
        throw new Error('Company não encontrado');
      }

      // Fazer login com o company ID
      const response = await api.post('/api/whitelabel/login/authenticate', {
        email,
        password,
        companyId: companyResponse.data.data.company_id
      });
      
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Registro
  register: async (userData) => {
    try {
      const response = await api.post('/api/auth/register', userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Verificar status do usuário para registro whitelabel
  checkUserStatus: async (email, companyAlias) => {
    try {
      const response = await api.post('/api/whitelabel/check-user-status', {
        email,
        companyAlias
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Registrar novo usuário no whitelabel
  registerNewUserWhitelabel: async (userData) => {
    try {
      const response = await api.post('/api/whitelabel/register-new-user', userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Vincular usuário existente ao companye
  linkExistingUser: async (userId, password, companyAlias) => {
    try {
      const response = await api.post('/api/whitelabel/link-existing-user', {
        userId,
        password,
        companyAlias
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Completar dados do primeiro acesso
  completeFirstAccess: async (userData) => {
    try {
      const response = await api.post('/api/whitelabel/complete-first-access', userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Criar token de primeiro acesso
  createFirstAccessToken: async () => {
    try {
      const response = await api.post('/api/whitelabel/create-first-access-token');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Obter dados usando token de primeiro acesso
  getFirstAccessData: async (token) => {
    try {
      const response = await api.get(`/api/whitelabel/get-first-access-data/${token}`);
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

  // Validar token atual (usando endpoint /me)
  validateToken: async (token) => {
    try {
      const response = await api.get('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      // Se der erro 401, o token é inválido
      if (error.response?.status === 401) {
        return { success: false, message: 'Token inválido' };
      }
      throw error;
    }
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
  getUserBalances: async (address, network, forceRefresh = false) => {
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

  // Ativar usuário
  activateUser: async (id) => {
    const response = await api.post(`/api/users/${id}/activate`);
    return response.data;
  },

  // Desativar usuário
  deactivateUser: async (id) => {
    const response = await api.post(`/api/users/${id}/deactivate`);
    return response.data;
  },

  // Bloquear usuário
  blockUser: async (id) => {
    const response = await api.post(`/api/users/${id}/block`);
    return response.data;
  },

  // Desbloquear usuário
  unblockUser: async (id) => {
    const response = await api.post(`/api/users/${id}/unblock`);
    return response.data;
  },

};

// Serviços de transações
export const transactionService = {
  // Listar transações do usuário
  getTransactions: async (params = {}) => {
    const response = await api.get('/api/transactions', { params });
    return response.data;
  },

  // Obter transação por hash
  getTransactionByHash: async (txHash) => {
    const response = await api.get(`/api/transactions/${txHash}`);
    return response.data;
  },

  // Obter estatísticas gerais
  getStats: async (params = {}) => {
    const response = await api.get('/api/transactions/stats/overview', { params });
    return response.data;
  },

  // Obter estatísticas por status
  getStatusStats: async (params = {}) => {
    const response = await api.get('/api/transactions/stats/status', { params });
    return response.data;
  },

  // Obter estatísticas por tipo
  getTypeStats: async (params = {}) => {
    const response = await api.get('/api/transactions/stats/type', { params });
    return response.data;
  },

  // Enfileirar transação
  enqueueTransaction: async (transactionData) => {
    const response = await api.post('/api/transactions/enqueue', transactionData);
    return response.data;
  },

  // Obter status de transação enfileirada
  getQueuedTransactionStatus: async (jobId) => {
    const response = await api.get(`/api/transactions/queue/${jobId}`);
    return response.data;
  },

  // Obter status de múltiplas transações enfileiradas
  getMultipleQueuedTransactionStatus: async (jobIds) => {
    const response = await api.post('/api/transactions/queue/batch', { jobIds });
    return response.data;
  },
  // Obter opções para filtros (busca todas as transações sem filtros para popular as opções)
  getFilterOptions: async () => {
    const response = await api.get('/api/transactions', { 
      params: { 
        page: 1, 
        limit: 1000 // Buscar uma quantidade grande para obter todas as opções
      } 
    });
    return response.data;
  }
};

// Serviços de tokens
export const tokenService = {
  // Listar tokens
  getTokens: async (params = {}) => {
    const response = await api.get('/api/tokens', { params });
    return response.data;
  },

  // Obter saldo de token
  getTokenBalance: async (contractAddress, walletAddress, network = 'mainnet') => {
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
  getEarningsSummary: async (network = 'mainnet') => {
    const response = await api.get('/api/earnings/summary', { params: { network } });
    return response.data;
  },

  // Obter proventos por período
  getEarningsByPeriod: async (startDate, endDate, network = 'mainnet') => {
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

// Serviços de configuração
export const configService = {
  // Obter configurações públicas
  getPublicConfig: async () => {
    const response = await api.get('/api/config/public');
    return response.data;
  },
};

// Serviços de whitelabel
export const whitelabelService = {
  // Obter empresa atual do usuário
  getCurrentCompany: async () => {
    const response = await api.get('/api/whitelabel/user/current-company');
    return response.data;
  },

  // Listar empresas do usuário
  getUserCompanies: async (params = {}) => {
    const response = await api.get('/api/whitelabel/user/companies', { params });
    return response.data;
  }
};

// Serviços de administração de empresas
export const companyService = {
  // Listar todas as empresas (admin)
  getCompanies: async (params = {}) => {
    const response = await api.get('/api/companies/frontend', { params });
    return response.data;
  },

  // Obter empresa por ID
  getCompanyById: async (id) => {
    const response = await api.get(`/api/companies/${id}`);
    return response.data;
  },

  // Criar empresa
  createCompany: async (companyData) => {
    const response = await api.post('/api/companies', companyData);
    return response.data;
  },

  // Atualizar empresa
  updateCompany: async (id, companyData) => {
    const response = await api.put(`/api/companies/${id}`, companyData);
    return response.data;
  },

  // Ativar empresa
  activateCompany: async (id) => {
    const response = await api.post(`/api/companies/${id}/activate`);
    return response.data;
  },

  // Desativar empresa
  deactivateCompany: async (id) => {
    const response = await api.post(`/api/companies/${id}/deactivate`);
    return response.data;
  },

  // Obter estatísticas de uso da empresa
  getCompanyUsageStats: async (id) => {
    const response = await api.get(`/api/companies/${id}/usage-stats`);
    return response.data;
  },

  // Obter usuários da empresa
  getCompanyUsers: async (id, params = {}) => {
    const response = await api.get(`/api/companies/${id}/users`, { params });
    return response.data;
  },

  // Obter estatísticas dos usuários da empresa
  getCompanyUsersStats: async (id) => {
    const response = await api.get(`/api/companies/${id}/users/stats`);
    return response.data;
  },

  // Atualizar rate limits
  updateRateLimits: async (id, rateLimit) => {
    const response = await api.put(`/api/companies/${id}/rate-limits`, { rateLimit });
    return response.data;
  }
};

// Serviços de administração para estatísticas gerais
export const adminService = {
  // Obter estatísticas gerais do sistema
  getSystemStats: async () => {
    // Para agora, vamos criar um endpoint que combine dados de usuários e empresas
    const [usersResponse, companiesResponse] = await Promise.all([
      api.get('/api/users', { params: { limit: 1 } }), // Para pegar total
      api.get('/api/companies', { params: { limit: 1 } }) // Para pegar total
    ]);

    return {
      success: true,
      data: {
        totalUsers: usersResponse.data.data?.pagination?.total || 0,
        totalCompanies: companiesResponse.data.data?.pagination?.total || 0,
        activeUsers: usersResponse.data.data?.pagination?.total || 0, // TODO: filtrar ativos
        activeCompanies: companiesResponse.data.data?.pagination?.total || 0 // TODO: filtrar ativas
      }
    };
  },

  // Obter atividades recentes
  getRecentActivities: async (params = {}) => {
    // TODO: Implementar endpoint de logs/atividades
    return {
      success: true,
      data: []
    };
  }
};

export default api;
