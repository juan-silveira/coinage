const redisService = require('../services/redis.service');
const prismaConfig = require('../config/prisma');

// Função helper para obter Prisma
const getPrisma = () => prismaConfig.getPrisma();

/**
 * Middleware para verificar e atualizar cache de dados do usuário
 */
const userCacheMiddleware = async (req, res, next) => {
  try {
    // Se não há usuário autenticado, continuar
    if (!req.user || !req.user.id) {
      return next();
    }

    // Tentar obter dados do usuário do cache
    const cachedUserData = await redisService.getCachedUserData(req.user.id);
    
    if (cachedUserData) {
      // Atualizar req.user com dados do cache
      req.user = {
        ...req.user,
        ...cachedUserData
      };
      return next();
    }

    // Se não há cache, buscar do banco usando Prisma e cachear
    try {
      const user = await getPrisma().user.findUnique({
        where: { id: req.user.id },
        include: {
          userClients: {
            include: {
              client: true
            }
          }
        }
      });
      
      if (user) {
        // Extrair roles baseado nas relações userClients
        const roles = user.userClients?.map(uc => uc.clientRole) || [];
        const globalRole = user.globalRole;
        if (globalRole && !roles.includes(globalRole)) {
          roles.push(globalRole);
        }

        const userDataForCache = {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          cpf: user.cpf,
          birthDate: user.birthDate,
          publicKey: user.publicKey,
          globalRole: user.globalRole,
          roles: roles,
          isFirstAccess: user.isFirstAccess,
          isActive: user.isActive,
          lastUpdated: new Date().toISOString()
        };

        await redisService.cacheUserData(user.id, userDataForCache, 3600);
      }
    } catch (prismaError) {
      console.error('❌ Error fetching user from Prisma in cache middleware:', prismaError);
      // Continuar sem erro para não quebrar o fluxo
    }

    next();
  } catch (error) {
    console.error('❌ Error in user cache middleware:', error.message);
    // Em caso de erro, continuar sem cache
    next();
  }
};

/**
 * Middleware para limpar cache quando dados do usuário são atualizados
 */
const clearUserCacheMiddleware = async (req, res, next) => {
  try {
    // Salvar a função original de res.json
    const originalJson = res.json;
    
    // Sobrescrever res.json para interceptar a resposta
    res.json = function(data) {
      // Se a operação foi bem-sucedida e temos um userId
      if (data.success && req.user && req.user.id) {
        // Limpar cache do usuário
        redisService.removeCachedUserData(req.user.id).catch(err => {
          console.error('❌ Error clearing user cache:', err.message);
        });
      }
      
      // Chamar a função original
      return originalJson.call(this, data);
    };
    
    next();
  } catch (error) {
    console.error('❌ Error in clear user cache middleware:', error.message);
    next();
  }
};

/**
 * Middleware para atualizar cache de balances quando necessário
 */
const updateBalancesCacheMiddleware = async (req, res, next) => {
  try {
    // Se não há usuário autenticado, continuar sem cache
    if (!req.user || !req.user.id) {
      return next();
    }

    // Salvar a função original de res.json
    const originalJson = res.json;
    
    // Sobrescrever res.json para interceptar a resposta
    res.json = function(data) {
      // Se a operação foi bem-sucedida e temos dados de balances
      if (data.success && data.data && req.params.address && !data.data.fromCache) {
        const address = req.params.address;
        const network = req.query.network || 'testnet';
        
        // Atualizar cache de balances por rede, apenas se não veio do cache
        redisService.cacheUserBalances(req.user.id, address, network, data.data, 300).catch(err => {
          console.error('❌ Error updating balances cache:', err.message);
        });
        
      }
      
      // Chamar a função original
      return originalJson.call(this, data);
    };
    
    next();
  } catch (error) {
    console.error('❌ Error in update balances cache middleware:', error.message);
    next();
  }
};

module.exports = {
  userCacheMiddleware,
  clearUserCacheMiddleware,
  updateBalancesCacheMiddleware
};
