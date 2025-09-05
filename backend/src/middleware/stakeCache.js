/**
 * StakeCache Middleware - Middleware para cache automático de operações de stake
 * 
 * Este middleware intercepta requisições para endpoints de stake e aplica
 * cache inteligente baseado no tipo de operação e dados solicitados.
 */

const stakeCacheService = require('../services/stakeCacheService');
const logger = require('../config/logger');

/**
 * Middleware para cache de consultas GET de stake
 */
const cacheStakeQuery = (options = {}) => {
  const {
    keyGenerator = null,
    ttl = null,
    condition = null,
    skipCache = false
  } = options;

  return async (req, res, next) => {
    // Pular cache em certas condições
    if (skipCache || req.method !== 'GET' || req.query.nocache === 'true') {
      return next();
    }

    try {
      // Gerar chave de cache
      const cacheKey = keyGenerator 
        ? keyGenerator(req) 
        : generateDefaultCacheKey(req);

      // Verificar condição personalizada
      if (condition && !condition(req)) {
        return next();
      }

      // Tentar recuperar do cache
      const cachedData = await stakeCacheService.get(cacheKey);
      
      if (cachedData) {
        logger.debug(`Cache hit for ${req.method} ${req.path}`, { cacheKey });
        
        return res.json({
          success: true,
          data: cachedData,
          cached: true,
          timestamp: Date.now()
        });
      }

      // Cache miss - continuar com a requisição
      logger.debug(`Cache miss for ${req.method} ${req.path}`, { cacheKey });
      
      // Interceptar resposta para armazenar no cache
      const originalJson = res.json;
      res.json = function(data) {
        // Armazenar resposta bem-sucedida no cache
        if (data && data.success && data.data) {
          stakeCacheService.set(cacheKey, data.data, ttl)
            .catch(error => {
              logger.error('Error caching response:', { cacheKey, error: error.message });
            });
        }
        
        // Chamar método original
        originalJson.call(this, data);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error:', { 
        path: req.path, 
        method: req.method, 
        error: error.message 
      });
      next(); // Continuar mesmo com erro de cache
    }
  };
};

/**
 * Middleware para invalidação de cache após operações POST
 */
const invalidateCacheAfterOperation = () => {
  return async (req, res, next) => {
    // Interceptar resposta para invalidar cache
    const originalJson = res.json;
    res.json = function(data) {
      // Se operação foi bem-sucedida, invalidar cache relacionado
      if (data && data.success) {
        invalidateCacheForOperation(req)
          .catch(error => {
            logger.error('Error invalidating cache:', { 
              path: req.path, 
              error: error.message 
            });
          });
      }
      
      // Chamar método original
      originalJson.call(this, data);
    };

    next();
  };
};

/**
 * Middleware específico para informações do contrato
 */
const cacheContractInfo = cacheStakeQuery({
  keyGenerator: (req) => {
    const contractAddress = req.params.contractAddress || req.params.address;
    return stakeCacheService.generateKey('contract', contractAddress, 'info');
  },
  ttl: 300, // 5 minutos
  condition: (req) => {
    const contractAddress = req.params.contractAddress || req.params.address;
    return contractAddress && contractAddress.length === 42; // Endereço Ethereum válido
  }
});

/**
 * Middleware específico para saldo de stake do usuário
 */
const cacheUserStakeBalance = cacheStakeQuery({
  keyGenerator: (req) => {
    const contractAddress = req.params.contractAddress || req.params.address;
    const userAddress = req.body?.userAddress || req.query?.userAddress;
    return stakeCacheService.generateKey('user', contractAddress, userAddress, 'balance');
  },
  ttl: 30, // 30 segundos
  condition: (req) => {
    const contractAddress = req.params.contractAddress || req.params.address;
    const userAddress = req.body?.userAddress || req.query?.userAddress;
    return contractAddress && userAddress && 
           contractAddress.length === 42 && userAddress.length === 42;
  }
});

/**
 * Middleware específico para recompensas pendentes
 */
const cacheUserPendingRewards = cacheStakeQuery({
  keyGenerator: (req) => {
    const contractAddress = req.params.contractAddress || req.params.address;
    const userAddress = req.body?.userAddress || req.query?.userAddress;
    return stakeCacheService.generateKey('user', contractAddress, userAddress, 'rewards');
  },
  ttl: 30, // 30 segundos
  condition: (req) => {
    const contractAddress = req.params.contractAddress || req.params.address;
    const userAddress = req.body?.userAddress || req.query?.userAddress;
    return contractAddress && userAddress && 
           contractAddress.length === 42 && userAddress.length === 42;
  }
});

/**
 * Middleware para métricas de performance
 */
const trackCachePerformance = () => {
  return (req, res, next) => {
    const startTime = Date.now();
    
    const originalJson = res.json;
    res.json = function(data) {
      const duration = Date.now() - startTime;
      const isCached = data && data.cached;
      
      logger.debug('Request performance:', {
        path: req.path,
        method: req.method,
        duration,
        cached: isCached,
        status: res.statusCode
      });
      
      originalJson.call(this, data);
    };
    
    next();
  };
};

// ===== FUNÇÕES AUXILIARES =====

/**
 * Gera chave de cache padrão baseada na requisição
 */
function generateDefaultCacheKey(req) {
  const contractAddress = req.params.contractAddress || req.params.address;
  const userAddress = req.body?.userAddress || req.query?.userAddress;
  const path = req.path.replace(/^\/api\/stakes\/[^\/]+\//, ''); // Remove prefix
  
  if (userAddress) {
    return stakeCacheService.generateKey('user', contractAddress, userAddress, path);
  } else {
    return stakeCacheService.generateKey('contract', contractAddress, path);
  }
}

/**
 * Invalida cache baseado na operação realizada
 */
async function invalidateCacheForOperation(req) {
  const contractAddress = req.params.contractAddress || req.params.address;
  const userAddress = req.body?.userAddress;
  const operation = getOperationFromPath(req.path);
  
  if (operation && contractAddress && userAddress) {
    await stakeCacheService.invalidateAfterOperation(operation, contractAddress, userAddress);
  }
}

/**
 * Extrai tipo de operação do caminho da requisição
 */
function getOperationFromPath(path) {
  if (path.includes('/invest')) return 'invest';
  if (path.includes('/withdraw')) return 'withdraw';
  if (path.includes('/claim-rewards')) return 'claim';
  if (path.includes('/compound')) return 'compound';
  return null;
}

/**
 * Middleware para limpar cache em desenvolvimento
 */
const clearCacheInDevelopment = () => {
  return async (req, res, next) => {
    if (process.env.NODE_ENV === 'development' && req.query.clearcache === 'true') {
      try {
        const cleared = await stakeCacheService.clearAll();
        logger.info(`Development: Cache cleared (${cleared} keys)`);
        
        return res.json({
          success: true,
          message: `Cache cleared: ${cleared} keys removed`,
          timestamp: Date.now()
        });
      } catch (error) {
        logger.error('Error clearing cache in development:', error.message);
        return res.status(500).json({
          success: false,
          message: 'Error clearing cache',
          error: error.message
        });
      }
    }
    
    next();
  };
};

/**
 * Middleware para health check do cache
 */
const cacheHealthCheck = () => {
  return async (req, res, next) => {
    if (req.path === '/health/cache') {
      try {
        const health = await stakeCacheService.healthCheck();
        
        return res.json({
          success: true,
          data: health,
          timestamp: Date.now()
        });
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: 'Cache health check failed',
          error: error.message
        });
      }
    }
    
    next();
  };
};

/**
 * Middleware condicional para cache baseado em configuração
 */
const conditionalCache = (condition) => {
  return (req, res, next) => {
    if (condition && condition(req)) {
      return cacheStakeQuery()(req, res, next);
    }
    next();
  };
};

// ===== EXPORTAÇÕES =====

module.exports = {
  // Middlewares principais
  cacheStakeQuery,
  invalidateCacheAfterOperation,
  
  // Middlewares específicos
  cacheContractInfo,
  cacheUserStakeBalance, 
  cacheUserPendingRewards,
  
  // Middlewares utilitários
  trackCachePerformance,
  clearCacheInDevelopment,
  cacheHealthCheck,
  conditionalCache,
  
  // Funções auxiliares (para uso em controllers)
  generateDefaultCacheKey,
  invalidateCacheForOperation,
  
  // Re-export do serviço
  stakeCacheService
};