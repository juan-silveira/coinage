const TokenAmountService = require('../services/tokenAmount.service');

class TokenAmountController {
  constructor() {
    this.tokenAmountService = new TokenAmountService();
  }

  /**
   * Obter configuração do serviço
   */
  async getServiceConfig(req, res) {
    try {
      const config = this.tokenAmountService.getServiceConfig();
      
      res.json({
        success: true,
        data: config,
        message: 'Configuração do serviço obtida com sucesso'
      });
    } catch (error) {
      console.error('❌ Erro ao obter configuração do serviço:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  /**
   * Definir threshold para mudanças significativas
   */
  async setChangeThreshold(req, res) {
    try {
      const { threshold } = req.body;
      
      if (!threshold || isNaN(threshold) || threshold < 0) {
        return res.status(400).json({
          success: false,
          message: 'Threshold deve ser um número positivo'
        });
      }
      
      this.tokenAmountService.setChangeThreshold(parseFloat(threshold));
      
      res.json({
        success: true,
        message: `Threshold definido para ${threshold}%`,
        data: { threshold: parseFloat(threshold) }
      });
    } catch (error) {
      console.error('❌ Erro ao definir threshold:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  /**
   * Forçar verificação de mudanças nos saldos
   */
  async forceCheck(req, res) {
    try {
      await this.tokenAmountService.checkAllUserBalances();
      
      res.json({
        success: true,
        message: 'Verificação de saldos forçada com sucesso'
      });
    } catch (error) {
      console.error('❌ Erro ao forçar verificação de saldos:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  /**
   * Obter estatísticas de mudanças nos saldos
   */
  async getBalanceStats(req, res) {
    try {
      const config = this.tokenAmountService.getServiceConfig();
      const stats = {
        totalUsers: config.activeUsers,
        changeThreshold: config.changeThreshold,
        lastCheck: new Date().toISOString(),
        serviceStatus: config.status
      };
      
      res.json({
        success: true,
        data: stats,
        message: 'Estatísticas obtidas com sucesso'
      });
    } catch (error) {
      console.error('❌ Erro ao obter estatísticas:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }
}

module.exports = TokenAmountController;

