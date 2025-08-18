const balanceSyncService = require('../services/balanceSync.service');
const azorescanService = require('../services/azorescan.service');

/**
 * @desc Busca cache Redis para um usuário
 * @route GET /api/balance-sync/cache
 * @access Private
 */
const getCache = async (req, res) => {
  try {
    const { userId, address, network = 'mainnet' } = req.query;
    
    if (!userId || !address) {
      return res.status(400).json({
        success: false,
        message: 'userId e address são obrigatórios'
      });
    }

    // Verificar se o usuário logado pode acessar estes dados
    if (req.user.id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado - usuário não autorizado'
      });
    }

    const cache = await balanceSyncService.getCache(userId, address, network);
    
    res.json({
      success: true,
      data: cache
    });
    
  } catch (error) {
    console.error('❌ [BalanceSyncController] Erro ao buscar cache:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
};

/**
 * @desc Atualiza cache Redis com novos balances
 * @route POST /api/balance-sync/cache
 * @access Private
 */
const updateCache = async (req, res) => {
  try {
    const { userId, address, balances, timestamp, source, network = 'mainnet' } = req.body;
    
    if (!userId || !address || !balances) {
      return res.status(400).json({
        success: false,
        message: 'userId, address e balances são obrigatórios'
      });
    }

    // Verificar se o usuário logado pode acessar estes dados
    if (req.user.id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado - usuário não autorizado'
      });
    }

    const result = await balanceSyncService.updateCache(userId, address, balances, timestamp, source, network);
    
    res.json({
      success: true,
      data: result,
      message: 'Cache atualizado com sucesso'
    });
    
  } catch (error) {
    console.error('❌ [BalanceSyncController] Erro ao atualizar cache:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
};

/**
 * @desc Busca histórico de mudanças de um usuário
 * @route GET /api/balance-sync/history
 * @access Private
 */
const getHistory = async (req, res) => {
  try {
    const { userId, address, limit = 50, network = 'mainnet' } = req.query;
    
    if (!userId || !address) {
      return res.status(400).json({
        success: false,
        message: 'userId e address são obrigatórios'
      });
    }

    // Verificar se o usuário logado pode acessar estes dados
    if (req.user.id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado - usuário não autorizado'
      });
    }

    const history = await balanceSyncService.getHistory(userId, address, parseInt(limit), network);
    
    res.json({
      success: true,
      data: history
    });
    
  } catch (error) {
    console.error('❌ [BalanceSyncController] Erro ao buscar histórico:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
};

/**
 * @desc Limpa cache Redis para um usuário
 * @route DELETE /api/balance-sync/cache/clear
 * @access Private
 */
const clearCache = async (req, res) => {
  try {
    const { userId, address, network = 'mainnet' } = req.query;
    
    if (!userId || !address) {
      return res.status(400).json({
        success: false,
        message: 'userId e address são obrigatórios'
      });
    }

    // Verificar se o usuário logado pode acessar estes dados
    if (req.user.id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado - usuário não autorizado'
      });
    }

    const result = await balanceSyncService.clearCache(userId, address, network);
    
    res.json({
      success: true,
      data: result,
      message: 'Cache limpo com sucesso'
    });
    
  } catch (error) {
    console.error('❌ [BalanceSyncController] Erro ao limpar cache:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
};

/**
 * @desc Busca status da sincronização
 * @route GET /api/balance-sync/status
 * @access Private
 */
const getStatus = async (req, res) => {
  try {
    const { userId, address } = req.query;
    
    if (!userId || !address) {
      return res.status(400).json({
        success: false,
        message: 'userId e address são obrigatórios'
      });
    }

    // Verificar se o usuário logado pode acessar estes dados
    if (req.user.id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado - usuário não autorizado'
      });
    }

    const status = await balanceSyncService.getStatus(userId, address);
    
    res.json({
      success: true,
      data: status
    });
    
  } catch (error) {
    console.error('❌ [BalanceSyncController] Erro ao buscar status:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
};

/**
 * @desc Busca balances completos diretamente do Azorescan (inclui AZE-t nativo)
 * @route GET /api/balance-sync/fresh
 * @access Private
 */
const getFreshBalances = async (req, res) => {
  try {
    const { address, network = 'mainnet' } = req.query;
    
    if (!address) {
      return res.status(400).json({
        success: false,
        message: 'address é obrigatório'
      });
    }

    // Buscar balances frescos da blockchain
    const balanceData = await balanceSyncService.getFreshBalances(address, network);
    
    if (balanceData.success) {
      res.json({
        success: true,
        message: 'Balances sincronizados com sucesso',
        data: balanceData.data
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Erro ao sincronizar balances',
        error: balanceData.error
      });
    }
    
  } catch (error) {
    console.error('❌ [BalanceSyncController] Erro ao buscar balances frescos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
};

module.exports = {
  getCache,
  updateCache,
  getHistory,
  clearCache,
  getStatus,
  getFreshBalances
};
