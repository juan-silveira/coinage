const express = require('express');
const router = express.Router();
const earningsService = require('../services/earnings.service');
const { authenticateToken } = require('../middleware/jwt.middleware');

// Middleware de autenticação para todas as rotas
router.use(authenticateToken);

/**
 * @route   GET /api/earnings
 * @desc    Obter proventos do usuário autenticado
 * @access  Private
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      page = 1,
      limit = 20,
      tokenSymbol,
      network,
      startDate,
      endDate,
      sortBy = 'distributionDate',
      sortOrder = 'desc',
    } = req.query;

    const result = await earningsService.getUserEarnings(userId, {
      page: parseInt(page),
      limit: parseInt(limit),
      tokenSymbol,
      network,
      startDate,
      endDate,
      sortBy,
      sortOrder,
    });

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Erro na rota GET /earnings:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/earnings/chart
 * @desc    Obter dados para gráfico de proventos
 * @access  Private
 */
router.get('/chart', async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      days = 30,
      tokenSymbols = [],
      network = 'testnet',
    } = req.query;

    // Converter tokenSymbols de string para array se necessário
    let tokenSymbolsArray = tokenSymbols;
    if (typeof tokenSymbols === 'string') {
      tokenSymbolsArray = tokenSymbols.split(',').filter(s => s.trim());
    }

    const result = await earningsService.getEarningsForChart(userId, {
      days: parseInt(days),
      tokenSymbols: tokenSymbolsArray,
      network,
    });

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Erro na rota GET /earnings/chart:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/earnings/summary
 * @desc    Obter resumo dos proventos
 * @access  Private
 */
router.get('/summary', async (req, res) => {
  try {
    const userId = req.user.id;
    const { network = 'testnet' } = req.query;

    const result = await earningsService.getEarningsSummary(userId, network);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Erro na rota GET /earnings/summary:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/earnings/period
 * @desc    Obter proventos por período
 * @access  Private
 */
router.get('/period', async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate, network = 'testnet' } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Data de início e fim são obrigatórias',
      });
    }

    const result = await earningsService.getEarningsByPeriod(
      userId,
      startDate,
      endDate,
      network
    );

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Erro na rota GET /earnings/period:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/earnings
 * @desc    Criar novo provento
 * @access  Private (Admin)
 */
router.post('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      tokenSymbol,
      tokenName,
      amount,
      quote,
      network = 'testnet',
      transactionHash,
      distributionDate,
    } = req.body;

    // Validações básicas
    if (!tokenSymbol || !tokenName || !amount || !quote) {
      return res.status(400).json({
        success: false,
        message: 'Token, nome, quantidade e cotação são obrigatórios',
      });
    }

    const earningData = {
      userId,
      tokenSymbol,
      tokenName,
      amount: parseFloat(amount),
      quote: parseFloat(quote),
      network,
      transactionHash,
      distributionDate: distributionDate ? new Date(distributionDate) : new Date(),
    };

    const result = await earningsService.createEarning(earningData);

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Erro na rota POST /earnings:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message,
    });
  }
});

/**
 * @route   PUT /api/earnings/:id
 * @desc    Atualizar provento
 * @access  Private (Admin)
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remover campos que não devem ser atualizados
    delete updateData.id;
    delete updateData.userId;
    delete updateData.createdAt;

    // Converter campos numéricos se fornecidos
    if (updateData.amount) {
      updateData.amount = parseFloat(updateData.amount);
    }
    if (updateData.quote) {
      updateData.quote = parseFloat(updateData.quote);
    }

    const result = await earningsService.updateEarning(id, updateData);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Erro na rota PUT /earnings/:id:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message,
    });
  }
});

/**
 * @route   DELETE /api/earnings/:id
 * @desc    Desativar provento (soft delete)
 * @access  Private (Admin)
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await earningsService.deactivateEarning(id);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Erro na rota DELETE /earnings/:id:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message,
    });
  }
});

module.exports = router;
