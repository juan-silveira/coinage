const userActionsService = require('../services/userActions.service');

class UserActionsController {
  /**
   * Obtém a timeline de atividades do usuário
   */
  async getUserTimeline(req, res) {
    try {
      const userId = req.user.id;
      const { limit = 20 } = req.query;

      const timeline = await userActionsService.getUserTimeline(userId, parseInt(limit));

      res.json({
        success: true,
        message: 'Timeline obtida com sucesso',
        data: timeline
      });
    } catch (error) {
      console.error('Erro ao obter timeline:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  /**
   * Obtém ações detalhadas do usuário com filtros
   */
  async getUserActions(req, res) {
    try {
      const userId = req.user.id;
      const filters = {
        category: req.query.category,
        action: req.query.action,
        status: req.query.status,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        limit: parseInt(req.query.limit) || 50,
        offset: parseInt(req.query.offset) || 0,
        orderBy: req.query.orderBy || 'performedAt',
        order: req.query.order || 'desc'
      };

      const result = await userActionsService.getUserActions(userId, filters);

      res.json({
        success: true,
        message: 'Ações obtidas com sucesso',
        data: result
      });
    } catch (error) {
      console.error('Erro ao obter ações do usuário:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  /**
   * Obtém estatísticas das ações do usuário
   */
  async getUserActionStats(req, res) {
    try {
      const userId = req.user.id;
      const { period = '30d' } = req.query;

      const stats = await userActionsService.getUserActionStats(userId, period);

      res.json({
        success: true,
        message: 'Estatísticas obtidas com sucesso',
        data: stats
      });
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  /**
   * Obtém ações por categoria (admin)
   */
  async getActionsByCategory(req, res) {
    try {
      if (!req.user.isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Acesso negado'
        });
      }

      const { category, startDate, endDate, limit = 100, offset = 0 } = req.query;

      if (!category) {
        return res.status(400).json({
          success: false,
          message: 'Categoria é obrigatória'
        });
      }

      const filters = {
        category,
        startDate,
        endDate,
        limit: parseInt(limit),
        offset: parseInt(offset)
      };

      // Para admin, buscar todas as ações da categoria
      const result = await userActionsService.getActionsByCategory(filters);

      res.json({
        success: true,
        message: 'Ações por categoria obtidas com sucesso',
        data: result
      });
    } catch (error) {
      console.error('Erro ao obter ações por categoria:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  /**
   * Obtém métricas de atividade suspeita (admin)
   */
  async getSuspiciousActivity(req, res) {
    try {
      if (!req.user.isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Acesso negado'
        });
      }

      const { hours = 24, limit = 50 } = req.query;
      const startDate = new Date(Date.now() - parseInt(hours) * 60 * 60 * 1000);

      const suspiciousActions = await userActionsService.getSuspiciousActivity({
        startDate,
        limit: parseInt(limit)
      });

      res.json({
        success: true,
        message: 'Atividades suspeitas obtidas com sucesso',
        data: suspiciousActions
      });
    } catch (error) {
      console.error('Erro ao obter atividades suspeitas:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  /**
   * Exporta ações do usuário (CSV/JSON)
   */
  async exportUserActions(req, res) {
    try {
      const userId = req.user.id;
      const { format = 'json', startDate, endDate, category } = req.query;

      if (!['json', 'csv'].includes(format)) {
        return res.status(400).json({
          success: false,
          message: 'Formato deve ser json ou csv'
        });
      }

      const filters = {
        startDate,
        endDate,
        category,
        limit: 10000 // Export limit
      };

      const result = await userActionsService.getUserActions(userId, filters);

      if (format === 'csv') {
        const csv = this.convertToCSV(result.actions);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="user-actions-${userId}-${Date.now()}.csv"`);
        res.send(csv);
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="user-actions-${userId}-${Date.now()}.json"`);
        res.json({
          success: true,
          message: 'Dados exportados com sucesso',
          data: result,
          exportedAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Erro ao exportar ações:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  /**
   * Helper para converter dados para CSV
   */
  convertToCSV(actions) {
    if (!actions.length) return '';

    const headers = [
      'ID', 'Action', 'Category', 'Status', 'Details', 
      'IP Address', 'User Agent', 'Performed At'
    ];

    const rows = actions.map(action => [
      action.id,
      action.action,
      action.category,
      action.status,
      JSON.stringify(action.details || {}),
      action.ipAddress || '',
      action.userAgent || '',
      action.performedAt
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    return csvContent;
  }
}

module.exports = new UserActionsController();