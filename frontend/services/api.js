// Serviço de API para integração com o backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8800/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Método para fazer requisições HTTP
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    // Configurações padrão
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    // Adicionar token de autenticação se existir
    const token = this.getToken();
    if (token) {
      defaultOptions.headers['Authorization'] = `Bearer ${token}`;
    }

    // Mesclar opções
    const config = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      
      // Verificar se a resposta é ok
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  // Métodos de autenticação
  async login(email, password) {
    console.log("API Service: Fazendo requisição de login para:", `${this.baseURL}/auth/login`);
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    console.log("API Service: Resposta do login:", response);
    return response;
  }

  async logout() {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  async refreshToken(refreshToken) {
    return this.request('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  }

  async getCurrentUser() {
    return this.request('/auth/me', {
      method: 'GET',
    });
  }

  // Métodos para gerenciamento de tokens
  setToken(token) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', token);
    }
  }

  getToken() {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('accessToken');
    }
    return null;
  }

  setRefreshToken(token) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('refreshToken', token);
    }
  }

  getRefreshToken() {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('refreshToken');
    }
    return null;
  }

  clearTokens() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  }

  setUser(user) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(user));
    }
  }

  getUser() {
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    }
    return null;
  }

  // Verificar se o usuário está autenticado
  isAuthenticated() {
    return !!this.getToken();
  }

  // Verificar se o token está expirado
  isTokenExpired() {
    const token = this.getToken();
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch (error) {
      return true;
    }
  }
}

// Instância singleton do serviço
const apiService = new ApiService();

export default apiService; 