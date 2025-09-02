import api from '@/services/api';

class StakeContractsService {
  constructor() {
    this.cache = new Map();
    this.cacheTimestamp = new Map();
    this.CACHE_DURATION = 30000; // 30 segundos
  }

  clearCache() {
    this.cache.clear();
    this.cacheTimestamp.clear();
  }

  isCacheValid(key) {
    const timestamp = this.cacheTimestamp.get(key);
    if (!timestamp) return false;
    return Date.now() - timestamp < this.CACHE_DURATION;
  }

  async getAllStakeContracts(forceRefresh = false) {
    const cacheKey = 'allStakeContracts';
    
    if (!forceRefresh && this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    try {
      const response = await api.get('/api/contracts/all');
      if (response.data.success) {
        // Filtrar apenas contratos de stake
        const stakeContracts = response.data.data.filter(
          contract => contract.contractType === 'stake'
        );
        
        // Armazenar no cache
        this.cache.set(cacheKey, stakeContracts);
        this.cacheTimestamp.set(cacheKey, Date.now());
        
        return stakeContracts;
      }
      return [];
    } catch (error) {
      console.error('Error fetching stake contracts:', error);
      return [];
    }
  }

  async checkWhitelistStatus(contractAddress, network, forceRefresh = false) {
    const cacheKey = `whitelist_${contractAddress}_${network}`;
    
    if (!forceRefresh && this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    try {
      const response = await api.post('/api/contracts/read', {
        contractAddress,
        functionName: 'whitelistEnabled',
        params: [],
        network
      });

      if (response?.data?.success) {
        // Verificar diferentes formatos de resposta
        let result = false;
        
        // IMPORTANTE: Baseado no contracts/interact, o resultado vem diretamente em response.data.data
        // Não em response.data.data.result
        let valueToCheck = response.data.data;
        
        // Se existe result, usar ele
        if (response.data.data?.result !== undefined) {
          valueToCheck = response.data.data.result;
        }
        
        // Se é um array, pegar o primeiro elemento
        if (Array.isArray(valueToCheck) && valueToCheck.length > 0) {
          valueToCheck = valueToCheck[0];
        }
        
        // Converter para booleano
        if (typeof valueToCheck === 'boolean') {
          result = valueToCheck;
        } else if (typeof valueToCheck === 'string') {
          // Pode vir como 'true', 'false', '1', '0', ou hexadecimal
          const lowerValue = valueToCheck.toLowerCase();
          if (lowerValue === 'true' || lowerValue === '1') {
            result = true;
          } else if (lowerValue === 'false' || lowerValue === '0') {
            result = false;
          } else if (lowerValue.startsWith('0x')) {
            // Se for hexadecimal, converter para número
            const numValue = parseInt(valueToCheck, 16);
            result = numValue === 1 || numValue === true;
          }
        } else if (typeof valueToCheck === 'number') {
          result = valueToCheck === 1 || valueToCheck === true;
        } else if (valueToCheck && typeof valueToCheck === 'object') {
          // Pode ser um BigNumber ou objeto similar
          if (valueToCheck._hex) {
            const numValue = parseInt(valueToCheck._hex, 16);
            result = numValue === 1;
          } else if (valueToCheck.toNumber) {
            result = valueToCheck.toNumber() === 1;
          }
        }
        
        // Armazenar no cache
        this.cache.set(cacheKey, result);
        this.cacheTimestamp.set(cacheKey, Date.now());
        
        return result;
      }
      return false;
    } catch (error) {
      // Se falhar, assumir que não tem whitelist (stake público)
      return false;
    }
  }

  async getWhitelistedAddresses(contractAddress, network, forceRefresh = false) {
    const cacheKey = `addresses_${contractAddress}_${network}`;
    
    if (!forceRefresh && this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    try {
      const response = await api.post('/api/contracts/read', {
        contractAddress,
        functionName: 'getWhitelistedAddresses',
        params: [],
        network
      });

      if (response?.data?.success) {
        let result = [];
        
        // O resultado pode vir como array ou string única
        if (response.data.data?.result) {
          const rawResult = response.data.data.result;
          
          if (Array.isArray(rawResult)) {
            result = rawResult;
          } else if (typeof rawResult === 'string' && rawResult.trim()) {
            // Se for uma string única, converter para array
            result = [rawResult.trim()];
          } else if (rawResult) {
            // Caso seja outro tipo, tentar converter para string e depois array
            result = [String(rawResult)];
          }
        }
        
        // Armazenar no cache
        this.cache.set(cacheKey, result);
        this.cacheTimestamp.set(cacheKey, Date.now());
        
        return result;
      }
      return [];
    } catch (error) {
      return [];
    }
  }

  async isUserWhitelisted(contractAddress, network, userAddress, forceRefresh = false) {
    try {
      if (!userAddress) {
        return false;
      }

      const whitelistedAddresses = await this.getWhitelistedAddresses(contractAddress, network, forceRefresh);
      
      if (!Array.isArray(whitelistedAddresses) || whitelistedAddresses.length === 0) {
        return false;
      }
      
      // Normalizar endereços para lowercase para comparação
      const normalizedUserAddress = userAddress.toLowerCase();
      const normalizedWhitelistedAddresses = whitelistedAddresses
        .filter(addr => addr) // Filtrar valores null/undefined
        .map(addr => addr.toLowerCase());

      const isWhitelisted = normalizedWhitelistedAddresses.includes(normalizedUserAddress);
      
      return isWhitelisted;
    } catch (error) {
      return false;
    }
  }

  async categorizeStakeContracts(userAddress, forceRefresh = false) {
    try {
      const allStakeContracts = await this.getAllStakeContracts(forceRefresh);
      
      if (!allStakeContracts.length) {
        return {
          privateOffers: [],
          publicStakes: [],
          totalContracts: 0
        };
      }

      const privateOffers = [];
      const publicStakes = [];

      // Processar cada contrato individualmente com tratamento robusto
      const contractPromises = allStakeContracts.map(async (contract) => {
        try {
          // Validar dados do contrato
          if (!contract?.address || !contract?.network) {
            return {
              contract,
              category: 'public',
              error: 'Invalid contract data'
            };
          }

          const isWhitelistEnabled = await this.checkWhitelistStatus(
            contract.address, 
            contract.network,
            forceRefresh
          );

          if (isWhitelistEnabled) {
            // Se whitelist está habilitada, verificar se usuário está na lista
            if (userAddress) {
              const isUserWhitelisted = await this.isUserWhitelisted(
                contract.address,
                contract.network,
                userAddress,
                forceRefresh
              );

              if (isUserWhitelisted) {
                return {
                  contract: {
                    ...contract,
                    whitelistEnabled: true,
                    userWhitelisted: true
                  },
                  category: 'private'
                };
              }
            }
            // Usuário não está na whitelist, não incluir em lugar nenhum
            return null;
          } else {
            // Se whitelist está desabilitada, vai para stake público
            return {
              contract: {
                ...contract,
                whitelistEnabled: false,
                userWhitelisted: false
              },
              category: 'public'
            };
          }
        } catch (contractError) {
          // Em caso de erro, adicionar aos stakes públicos como fallback
          return {
            contract: {
              ...contract,
              whitelistEnabled: false,
              userWhitelisted: false,
              hasError: true
            },
            category: 'public'
          };
        }
      });

      const results = await Promise.allSettled(contractPromises);
      
      // Processar resultados
      results.forEach((result) => {
        if (result.status === 'fulfilled' && result.value) {
          const { contract, category } = result.value;
          if (category === 'private') {
            privateOffers.push(contract);
          } else if (category === 'public') {
            publicStakes.push(contract);
          }
        }
      });

      return {
        privateOffers,
        publicStakes,
        totalContracts: allStakeContracts.length
      };
    } catch (error) {
      console.error('Error categorizing stake contracts:', error);
      return {
        privateOffers: [],
        publicStakes: [],
        totalContracts: 0
      };
    }
  }

  // Método para buscar informações adicionais do contrato de stake
  async getStakeContractInfo(contractAddress, network) {
    try {
      const [totalStakedResponse, rewardRateResponse] = await Promise.all([
        api.post('/api/contracts/read', {
          contractAddress,
          functionName: 'getTotalStakedBalance',
          params: [],
          network
        }).catch(() => ({ data: { success: false } })),
        
        api.post('/api/contracts/read', {
          contractAddress,
          functionName: 'getRewardRate',
          params: [],
          network
        }).catch(() => ({ data: { success: false } }))
      ]);

      const result = {};

      if (totalStakedResponse.data.success) {
        result.totalStaked = totalStakedResponse.data.data.result[0];
      }

      if (rewardRateResponse.data.success) {
        result.rewardRate = rewardRateResponse.data.data.result[0];
      }

      return result;
    } catch (error) {
      console.error('Error getting stake contract info:', error);
      return {};
    }
  }
}

export default new StakeContractsService();