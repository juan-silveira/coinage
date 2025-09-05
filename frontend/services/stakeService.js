/**
 * StakeService - Serviço para comunicação com APIs de Stake
 * 
 * Este serviço centraliza toda a comunicação com as APIs de stake do backend,
 * incluindo operações de investimento, retirada, resgate de recompensas e
 * consultas de dados dos contratos.
 */

import axios from 'axios';
import { STAKE_PRODUCTS, getStakeProduct } from '../constants/stakeProducts';

class StakeService {
  constructor() {
    this.apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8800';
    this.cacheExpiry = parseInt(process.env.NEXT_PUBLIC_STAKE_CACHE_TTL || '300') * 1000; // 5 min
    this.maxRetries = 3;
    this.retryDelay = 1000;
    this.cache = new Map();
    
    // Criar instância do axios com configurações padrão
    this.api = axios.create({
      baseURL: this.apiUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptador para adicionar token de autenticação
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Interceptador para tratamento de erros
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('Stake API Error:', {
          url: error.config?.url,
          method: error.config?.method,
          status: error.response?.status,
          message: error.response?.data?.message || error.message
        });
        return Promise.reject(error);
      }
    );
  }

  // ===== MÉTODOS DE CACHE =====

  /**
   * Gera chave de cache única
   */
  getCacheKey(contractAddress, method, userAddress = null) {
    const key = userAddress 
      ? `${contractAddress}_${method}_${userAddress}` 
      : `${contractAddress}_${method}`;
    return key.toLowerCase();
  }

  /**
   * Obtém dados do cache se ainda válidos
   */
  getFromCache(cacheKey) {
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.data;
    }
    this.cache.delete(cacheKey);
    return null;
  }

  /**
   * Armazena dados no cache
   */
  setCache(cacheKey, data, customTTL = null) {
    const ttl = customTTL || this.cacheExpiry;
    this.cache.set(cacheKey, {
      data,
      expiresAt: Date.now() + ttl,
      cachedAt: Date.now()
    });
  }

  /**
   * Limpa cache relacionado a um contrato ou usuário
   */
  invalidateCache(contractAddress = null, userAddress = null) {
    if (!contractAddress && !userAddress) {
      // Limpar todo o cache
      this.cache.clear();
      return;
    }

    const keysToDelete = [];
    for (const [key] of this.cache) {
      const shouldDelete = 
        (contractAddress && key.includes(contractAddress.toLowerCase())) ||
        (userAddress && key.includes(userAddress.toLowerCase()));
      
      if (shouldDelete) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  // ===== MÉTODOS DE RETRY =====

  /**
   * Executa requisição com retry automático
   */
  async withRetry(operation, context = '') {
    let lastError;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (attempt === this.maxRetries) {
          console.error(`StakeService: Max retries reached for ${context}:`, error);
          break;
        }

        // Não fazer retry para alguns tipos de erro
        if (error.response?.status === 401 || error.response?.status === 403) {
          break;
        }

        console.warn(`StakeService: Retry ${attempt}/${this.maxRetries} for ${context}`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
      }
    }

    throw lastError;
  }

  // ===== OPERAÇÕES DE STAKE =====

  /**
   * Investe tokens em um contrato de stake
   */
  async invest(contractAddress, userAddress, amount, customTimestamp = null) {
    const operation = async () => {
      const response = await this.api.post(`/api/stakes/${contractAddress}/invest`, {
        userAddress,
        amount,
        customTimestamp
      });
      
      // Invalidar cache do usuário após operação
      this.invalidateCache(contractAddress, userAddress);
      
      return response.data;
    };

    return this.withRetry(operation, `invest ${contractAddress}`);
  }

  /**
   * Retira tokens de um contrato de stake
   */
  async withdraw(contractAddress, userAddress, amount) {
    const operation = async () => {
      const response = await this.api.post(`/api/stakes/${contractAddress}/withdraw`, {
        userAddress,
        amount
      });
      
      // Invalidar cache do usuário após operação
      this.invalidateCache(contractAddress, userAddress);
      
      return response.data;
    };

    return this.withRetry(operation, `withdraw ${contractAddress}`);
  }

  /**
   * Resgata recompensas pendentes
   */
  async claimRewards(contractAddress, userAddress) {
    const operation = async () => {
      const response = await this.api.post(`/api/stakes/${contractAddress}/claim-rewards`, {
        userAddress
      });
      
      // Invalidar cache do usuário após operação
      this.invalidateCache(contractAddress, userAddress);
      
      return response.data;
    };

    return this.withRetry(operation, `claim-rewards ${contractAddress}`);
  }

  /**
   * Reinveste recompensas (compound)
   */
  async compound(contractAddress, userAddress) {
    const operation = async () => {
      const response = await this.api.post(`/api/stakes/${contractAddress}/compound`, {
        userAddress
      });
      
      // Invalidar cache do usuário após operação
      this.invalidateCache(contractAddress, userAddress);
      
      return response.data;
    };

    return this.withRetry(operation, `compound ${contractAddress}`);
  }

  // ===== CONSULTAS DE DADOS =====

  /**
   * Obtém informações gerais do contrato de stake
   */
  async getContractInfo(contractAddress) {
    const cacheKey = this.getCacheKey(contractAddress, 'info');
    
    // Tentar cache primeiro
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    const operation = async () => {
      const response = await this.api.get(`/api/stakes/${contractAddress}/info`);
      return response.data;
    };

    const result = await this.withRetry(operation, `info ${contractAddress}`);
    
    // Cache por 5 minutos (dados menos voláteis)
    this.setCache(cacheKey, result, 300000);
    
    return result;
  }

  /**
   * Obtém recompensas pendentes de um usuário
   */
  async getPendingReward(contractAddress, userAddress) {
    const cacheKey = this.getCacheKey(contractAddress, 'pending-reward', userAddress);
    
    // Tentar cache primeiro (TTL menor para dados do usuário)
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    const operation = async () => {
      const response = await this.api.post(`/api/stakes/${contractAddress}/pending-reward`, {
        userAddress
      });
      return response.data;
    };

    const result = await this.withRetry(operation, `pending-reward ${contractAddress}`);
    
    // Cache por 30 segundos (dados mais voláteis)
    this.setCache(cacheKey, result, 30000);
    
    return result;
  }

  /**
   * Obtém saldo total investido de um usuário
   */
  async getTotalStakeBalance(contractAddress, userAddress) {
    const cacheKey = this.getCacheKey(contractAddress, 'total-balance', userAddress);
    
    // Tentar cache primeiro
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    const operation = async () => {
      const response = await this.api.post(`/api/stakes/${contractAddress}/total-stake-balance`, {
        userAddress
      });
      return response.data;
    };

    const result = await this.withRetry(operation, `total-balance ${contractAddress}`);
    
    // Cache por 30 segundos
    this.setCache(cacheKey, result, 30000);
    
    return result;
  }

  // ===== MÉTODOS COMBINADOS =====

  /**
   * Obtém todos os dados de um usuário para um contrato específico
   */
  async getUserStakeData(contractAddress, userAddress) {
    try {
      const [contractInfo, pendingReward, totalBalance] = await Promise.all([
        this.getContractInfo(contractAddress),
        this.getPendingReward(contractAddress, userAddress),
        this.getTotalStakeBalance(contractAddress, userAddress)
      ]);

      return {
        contractInfo: contractInfo.data,
        userData: {
          userAddress,
          totalStakeBalance: totalBalance.data.totalBalance,
          pendingReward: pendingReward.data.pendingReward,
          // Campos adicionais podem ser adicionados conforme necessário
          isBlacklisted: false, // TODO: implementar quando disponível na API
          isWhitelisted: true,  // TODO: implementar quando disponível na API
          lastStakeDate: null,  // TODO: implementar quando disponível na API
          totalRewardsClaimed: null, // TODO: implementar quando disponível na API
          numberOfStakes: null // TODO: implementar quando disponível na API
        }
      };
    } catch (error) {
      console.error('Error getting user stake data:', error);
      throw new Error(`Failed to get stake data for ${userAddress}: ${error.message}`);
    }
  }

  // ===== MÉTODOS DE BATCH =====

  /**
   * Executa múltiplas consultas de dados em paralelo
   */
  async batchGetUserData(requests) {
    const batchSize = parseInt(process.env.NEXT_PUBLIC_STAKE_BATCH_SIZE || '10');
    const results = [];

    // Dividir em batches para evitar sobrecarga
    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async ({ contractAddress, userAddress, productId }) => {
        try {
          const data = await this.getUserStakeData(contractAddress, userAddress);
          return {
            productId,
            contractAddress,
            userAddress,
            success: true,
            data
          };
        } catch (error) {
          return {
            productId,
            contractAddress,
            userAddress,
            success: false,
            error: error.message
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Pequena pausa entre batches se necessário
      if (i + batchSize < requests.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return results;
  }

  // ===== MÉTODOS UTILITÁRIOS =====

  /**
   * Obtém dados de todos os produtos de stake para um usuário
   */
  async getAllUserStakeData(userAddress) {
    const products = Object.values(STAKE_PRODUCTS);
    const requests = products
      .filter(product => product.contracts.stake.address) // Apenas produtos com contratos deployados
      .map(product => ({
        productId: product.id,
        contractAddress: product.contracts.stake.address,
        userAddress
      }));

    if (requests.length === 0) {
      return [];
    }

    return this.batchGetUserData(requests);
  }

  /**
   * Verifica se um produto de stake está disponível para operações
   */
  isStakeProductAvailable(productId) {
    const product = getStakeProduct(productId);
    return product && 
           product.contracts.stake.address && 
           product.status === 'active' &&
           product.defaultConfig.stakingEnabled;
  }

  /**
   * Obtém estatísticas de cache (para debug)
   */
  getCacheStats() {
    const now = Date.now();
    let active = 0;
    let expired = 0;

    for (const [key, entry] of this.cache) {
      if (now < entry.expiresAt) {
        active++;
      } else {
        expired++;
      }
    }

    return {
      total: this.cache.size,
      active,
      expired,
      hitRatio: this.hitCount / (this.hitCount + this.missCount) || 0
    };
  }

  /**
   * Limpa entradas expiradas do cache
   */
  cleanExpiredCache() {
    const now = Date.now();
    const keysToDelete = [];

    for (const [key, entry] of this.cache) {
      if (now >= entry.expiresAt) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
    
    return keysToDelete.length;
  }
}

// Instância singleton do serviço
export const stakeService = new StakeService();
export default stakeService;