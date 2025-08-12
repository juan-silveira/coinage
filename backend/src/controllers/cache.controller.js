const userCacheService = require('../services/userCache.service');

/**
 * Obtém dados completos do cache do usuário
 */
const getUserCacheData = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não autenticado'
      });
    }

    // Verificar se sessão está ativa
    if (!userCacheService.isSessionActive(userId)) {
      return res.status(404).json({
        success: false,
        message: 'Sessão de cache não encontrada'
      });
    }

    // Buscar dados completos do cache
    const cacheData = await userCacheService.getCachedData(userId, 'all');
    
    if (!cacheData) {
      return res.status(404).json({
        success: false,
        message: 'Dados não encontrados no cache'
      });
    }

    res.json({
      success: true,
      message: 'Dados do cache obtidos com sucesso',
      data: cacheData
    });
  } catch (error) {
    console.error('❌ Erro ao obter dados do cache:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * Obtém dados do PostgreSQL do cache
 */
const getPostgresCacheData = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não autenticado'
      });
    }

    const postgresData = await userCacheService.getCachedData(userId, 'postgres');
    
    if (!postgresData) {
      return res.status(404).json({
        success: false,
        message: 'Dados PostgreSQL não encontrados no cache'
      });
    }

    res.json({
      success: true,
      message: 'Dados PostgreSQL do cache obtidos com sucesso',
      data: postgresData
    });
  } catch (error) {
    console.error('❌ Erro ao obter dados PostgreSQL do cache:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * Obtém dados da blockchain do cache
 */
const getBlockchainCacheData = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não autenticado'
      });
    }

    const blockchainData = await userCacheService.getCachedData(userId, 'blockchain');
    
    if (!blockchainData) {
      return res.status(404).json({
        success: false,
        message: 'Dados blockchain não encontrados no cache'
      });
    }

    res.json({
      success: true,
      message: 'Dados blockchain do cache obtidos com sucesso',
      data: blockchainData
    });
  } catch (error) {
    console.error('❌ Erro ao obter dados blockchain do cache:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * Força atualização do cache do usuário
 */
const refreshUserCache = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não autenticado'
      });
    }

    const refreshed = await userCacheService.refreshUserCache(userId);
    
    if (!refreshed) {
      return res.status(400).json({
        success: false,
        message: 'Não foi possível atualizar o cache (usuário sem sessão ativa)'
      });
    }

    // Buscar dados atualizados
    const updatedData = await userCacheService.getCachedData(userId, 'all');

    res.json({
      success: true,
      message: 'Cache atualizado com sucesso',
      data: updatedData
    });
  } catch (error) {
    console.error('❌ Erro ao atualizar cache:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * Obtém status das sessões de cache ativas (apenas para admins)
 */
const getCacheSessionsStatus = async (req, res) => {
  try {
    const user = req.user;
    
    // Verificar se usuário é admin
    if (!user?.roles?.includes('SUPER_ADMIN') && !user?.roles?.includes('APP_ADMIN')) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado'
      });
    }

    const activeSessions = userCacheService.getActiveSessions();
    const testResult = await userCacheService.testService();

    res.json({
      success: true,
      message: 'Status das sessões de cache',
      data: {
        activeSessions,
        totalActiveSessions: activeSessions.length,
        serviceTest: testResult
      }
    });
  } catch (error) {
    console.error('❌ Erro ao obter status das sessões:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * Limpa cache do usuário atual
 */
const clearUserCache = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não autenticado'
      });
    }

    await userCacheService.clearUserCache(userId);

    res.json({
      success: true,
      message: 'Cache limpo com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro ao limpar cache:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * Endpoint para compatibilidade com frontend existente (getUserByEmail)
 */
const getUserByEmailFromCache = async (req, res) => {
  try {
    const email = req.params.email || req.user?.email;
    const userId = req.user?.id;
    
    if (!userId || !email) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não autenticado'
      });
    }

    // Buscar dados do PostgreSQL do cache
    const postgresData = await userCacheService.getCachedData(userId, 'postgres');
    
    if (!postgresData) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado no cache'
      });
    }

    res.json({
      success: true,
      message: 'Usuário encontrado',
      data: postgresData.user
    });
  } catch (error) {
    console.error('❌ Erro ao obter usuário por email do cache:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * Endpoint para compatibilidade com frontend existente (getUserBalances)
 */
const getUserBalancesFromCache = async (req, res) => {
  try {
    const publicKey = req.params.publicKey || req.user?.publicKey;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não autenticado'
      });
    }

    // Buscar dados da blockchain do cache
    const blockchainData = await userCacheService.getCachedData(userId, 'blockchain');
    
    if (!blockchainData) {
      return res.status(404).json({
        success: false,
        message: 'Dados de saldo não encontrados no cache'
      });
    }

    res.json({
      success: true,
      message: 'Saldos obtidos do cache',
      data: blockchainData
    });
  } catch (error) {
    console.error('❌ Erro ao obter saldos do cache:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

module.exports = {
  getUserCacheData,
  getPostgresCacheData,
  getBlockchainCacheData,
  refreshUserCache,
  getCacheSessionsStatus,
  clearUserCache,
  getUserByEmailFromCache,
  getUserBalancesFromCache
};