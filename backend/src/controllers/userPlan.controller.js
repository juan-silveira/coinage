const UserPlanService = require('../services/userPlan.service');

/**
 * Controller para gerenciamento de planos de usuário
 */
class UserPlanController {
  /**
   * Obtém todos os planos disponíveis
   */
  static async getAvailablePlans(req, res) {
    try {
      const plans = await UserPlanService.getAvailablePlans();
      
      res.json({
        success: true,
        data: plans,
        message: 'Planos obtidos com sucesso'
      });
    } catch (error) {
      console.error('Erro ao obter planos:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Obtém o plano atual de um usuário
   */
  static async getUserPlan(req, res) {
    try {
      const { userId } = req.params;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'ID do usuário é obrigatório'
        });
      }

      const userPlan = await UserPlanService.getUserPlan(userId);
      
      res.json({
        success: true,
        data: { userPlan },
        message: 'Plano do usuário obtido com sucesso'
      });
    } catch (error) {
      console.error('Erro ao obter plano do usuário:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Atualiza o plano de um usuário (Admin)
   */
  static async updateUserPlan(req, res) {
    try {
      const { userId } = req.params;
      const { userPlan } = req.body;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'ID do usuário é obrigatório'
        });
      }

      if (!userPlan) {
        return res.status(400).json({
          success: false,
          error: 'Novo plano é obrigatório'
        });
      }

      const result = await UserPlanService.updateUserPlan(userId, userPlan);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Erro ao atualizar plano do usuário:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Obtém estatísticas dos planos (Admin)
   */
  static async getPlanStatistics(req, res) {
    try {
      const stats = await UserPlanService.getPlanStatistics();
      
      if (stats.success) {
        res.json(stats);
      } else {
        res.status(400).json(stats);
      }
    } catch (error) {
      console.error('Erro ao obter estatísticas dos planos:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Obtém o intervalo de sincronização para um plano
   */
  static async getSyncInterval(req, res) {
    try {
      const { userPlan } = req.params;
      
      if (!userPlan) {
        return res.status(400).json({
          success: false,
          error: 'Plano é obrigatório'
        });
      }

      const interval = UserPlanService.getSyncIntervalForPlan(userPlan);
      
      res.json({
        success: true,
        data: {
          userPlan,
          syncIntervalMs: interval,
          syncIntervalMinutes: interval / (60 * 1000)
        },
        message: 'Intervalo de sincronização obtido com sucesso'
      });
    } catch (error) {
      console.error('Erro ao obter intervalo de sincronização:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }
}

module.exports = UserPlanController;

