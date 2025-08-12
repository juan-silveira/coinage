const userCacheService = require('../services/userCache.service');

/**
 * Middleware para recarregar cache automaticamente após ações que modificam dados
 */
class CacheRefreshMiddleware {
  
  /**
   * Middleware que força refresh do cache após operações de escrita
   * Use após endpoints que criam, atualizam ou deletam dados
   */
  static async refreshAfterWrite(req, res, next) {
    const originalSend = res.send;
    const userId = req.user?.id;

    // Interceptar resposta para verificar se foi bem-sucedida
    res.send = function(data) {
      // Restaurar método original
      res.send = originalSend;

      // Se usuário autenticado e operação bem-sucedida
      if (userId && res.statusCode >= 200 && res.statusCode < 300) {
        // Agendar refresh do cache (assíncrono)
        setImmediate(async () => {
          try {
            const refreshed = await userCacheService.refreshUserCache(userId);
            if (refreshed) {
              // console.log(`🔄 Cache atualizado após operação para usuário: ${userId}`);
            }
          } catch (error) {
            console.error(`❌ Erro ao atualizar cache após operação para usuário ${userId}:`, error);
          }
        });
      }

      return originalSend.call(this, data);
    };

    next();
  }

  /**
   * Middleware específico para operações de transações na blockchain
   * Aguarda um pouco mais antes de atualizar (para dar tempo das transações serem processadas)
   */
  static async refreshAfterTransaction(req, res, next) {
    const originalSend = res.send;
    const userId = req.user?.id;

    res.send = function(data) {
      res.send = originalSend;

      if (userId && res.statusCode >= 200 && res.statusCode < 300) {
        // Aguardar 10 segundos para transações na blockchain serem processadas
        setTimeout(async () => {
          try {
            const refreshed = await userCacheService.refreshUserCache(userId);
            if (refreshed) {
              // console.log(`🔄 Cache atualizado após transação blockchain para usuário: ${userId}`);
            }
          } catch (error) {
            console.error(`❌ Erro ao atualizar cache após transação para usuário ${userId}:`, error);
          }
        }, 10000); // 10 segundos
      }

      return originalSend.call(this, data);
    };

    next();
  }

  /**
   * Middleware para refresh após operações em filas (RabbitMQ)
   * Para ser usado quando uma operação é adicionada à fila
   */
  static async refreshAfterQueueOperation(req, res, next) {
    const originalSend = res.send;
    const userId = req.user?.id;

    res.send = function(data) {
      res.send = originalSend;

      if (userId && res.statusCode >= 200 && res.statusCode < 300) {
        // Aguardar 30 segundos para operações de fila serem processadas
        setTimeout(async () => {
          try {
            const refreshed = await userCacheService.refreshUserCache(userId);
            if (refreshed) {
              // console.log(`🔄 Cache atualizado após operação de fila para usuário: ${userId}`);
            }
          } catch (error) {
            console.error(`❌ Erro ao atualizar cache após operação de fila para usuário ${userId}:`, error);
          }
        }, 30000); // 30 segundos
      }

      return originalSend.call(this, data);
    };

    next();
  }

  /**
   * Middleware para refresh imediato
   * Para operações que precisam de atualização imediata do cache
   */
  static async refreshImmediate(req, res, next) {
    const originalSend = res.send;
    const userId = req.user?.id;

    res.send = async function(data) {
      res.send = originalSend;

      if (userId && res.statusCode >= 200 && res.statusCode < 300) {
        try {
          const refreshed = await userCacheService.refreshUserCache(userId);
          if (refreshed) {
            // console.log(`🔄 Cache atualizado imediatamente para usuário: ${userId}`);
          }
        } catch (error) {
          console.error(`❌ Erro ao atualizar cache imediatamente para usuário ${userId}:`, error);
        }
      }

      return originalSend.call(this, data);
    };

    next();
  }

  /**
   * Middleware condicional - só atualiza se a operação afetou dados do usuário logado
   */
  static async refreshIfUserAffected(req, res, next) {
    const originalSend = res.send;
    const userId = req.user?.id;

    res.send = function(data) {
      res.send = originalSend;

      // Verificar se a operação afetou o usuário atual
      let shouldRefresh = false;

      if (userId && res.statusCode >= 200 && res.statusCode < 300) {
        // Verificar se a operação foi no próprio usuário
        if (req.params?.userId === userId || req.params?.id === userId) {
          shouldRefresh = true;
        }

        // Verificar se o body da resposta contém o ID do usuário
        if (data && typeof data === 'string') {
          try {
            const responseData = JSON.parse(data);
            if (responseData?.data?.userId === userId || 
                responseData?.data?.id === userId ||
                responseData?.data?.user?.id === userId) {
              shouldRefresh = true;
            }
          } catch (parseError) {
            // Se não conseguir parsear, assume que pode afetar
            shouldRefresh = true;
          }
        }

        if (shouldRefresh) {
          setImmediate(async () => {
            try {
              const refreshed = await userCacheService.refreshUserCache(userId);
              if (refreshed) {
                // console.log(`🔄 Cache atualizado condicionalmente para usuário: ${userId}`);
              }
            } catch (error) {
              console.error(`❌ Erro ao atualizar cache condicionalmente para usuário ${userId}:`, error);
            }
          });
        }
      }

      return originalSend.call(this, data);
    };

    next();
  }

  /**
   * Helper para aplicar refresh manual em qualquer lugar do código
   */
  static async manualRefresh(userId) {
    try {
      const refreshed = await userCacheService.refreshUserCache(userId);
      if (refreshed) {
        // console.log(`🔄 Cache atualizado manualmente para usuário: ${userId}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`❌ Erro ao atualizar cache manualmente para usuário ${userId}:`, error);
      return false;
    }
  }

  /**
   * Middleware para debug - registra quando cache é atualizado
   */
  static debugRefresh(req, res, next) {
    const userId = req.user?.id;
    const method = req.method;
    const path = req.path;

    // console.log(`🔍 [CacheRefresh] ${method} ${path} - Usuário: ${userId || 'Não autenticado'}`);

    next();
  }

  // Atualizar cache após operações
  static async updateCacheAfterOperation(userId, operationType, data = {}) {
    try {
      if (!userId) return;
      
      // Log silencioso - sem console.log
      
      // Atualizar cache do usuário
      await userCacheService.refreshUserCache(userId);
      
    } catch (error) {
      console.error('❌ Erro ao atualizar cache após operação:', error);
    }
  }

  // Atualizar cache após transações blockchain
  static async updateCacheAfterBlockchainTransaction(userId, transactionData = {}) {
    try {
      if (!userId) return;
      
      // Log silencioso - sem console.log
      
      // Atualizar cache do usuário
      await userCacheService.refreshUserCache(userId);
      
    } catch (error) {
      console.error('❌ Erro ao atualizar cache após transação blockchain:', error);
    }
  }

  // Atualizar cache após operações de fila
  static async updateCacheAfterQueueOperation(userId, queueData = {}) {
    try {
      if (!userId) return;
      
      // Log silencioso - sem console.log
      
      // Atualizar cache do usuário
      await userCacheService.refreshUserCache(userId);
      
    } catch (error) {
      console.error('❌ Erro ao atualizar cache após operação de fila:', error);
    }
  }

  // Atualizar cache imediatamente
  static async updateCacheImmediately(userId, reason = 'manual') {
    try {
      if (!userId) return;
      
      // Log silencioso - sem console.log
      
      // Atualizar cache do usuário
      await userCacheService.refreshUserCache(userId);
      
    } catch (error) {
      console.error('❌ Erro ao atualizar cache imediatamente:', error);
    }
  }

  // Atualizar cache condicionalmente
  static async updateCacheConditionally(userId, condition, reason = 'conditional') {
    try {
      if (!userId || !condition) return;
      
      // Log silencioso - sem console.log
      
      // Atualizar cache do usuário
      await userCacheService.refreshUserCache(userId);
      
    } catch (error) {
      console.error('❌ Erro ao atualizar cache condicionalmente:', error);
    }
  }

  // Atualizar cache manualmente
  static async updateCacheManually(userId, reason = 'manual') {
    try {
      if (!userId) return;
      
      // Log silencioso - sem console.log
      
      // Atualizar cache do usuário
      await userCacheService.refreshUserCache(userId);
      
    } catch (error) {
      console.error('❌ Erro ao atualizar cache manualmente:', error);
    }
  }

  // Middleware principal
  static async cacheRefreshMiddleware(req, res, next) {
    try {
      const userId = req.user?.id;
      const method = req.method;
      const path = req.path;
      
      // Log silencioso - sem console.log
      
      // Adicionar funções de atualização ao request
      req.updateCache = {
        afterOperation: (operationType, data) => CacheRefreshMiddleware.updateCacheAfterOperation(userId, operationType, data),
        afterBlockchainTransaction: (transactionData) => CacheRefreshMiddleware.updateCacheAfterBlockchainTransaction(userId, transactionData),
        afterQueueOperation: (queueData) => CacheRefreshMiddleware.updateCacheAfterQueueOperation(userId, queueData),
        immediately: (reason) => CacheRefreshMiddleware.updateCacheImmediately(userId, reason),
        conditionally: (condition, reason) => CacheRefreshMiddleware.updateCacheConditionally(userId, condition, reason),
        manually: (reason) => CacheRefreshMiddleware.updateCacheManually(userId, reason)
      };
      
      next();
      
    } catch (error) {
      console.error('❌ Erro no middleware de cache refresh:', error);
      next();
    }
  }
}

module.exports = CacheRefreshMiddleware;