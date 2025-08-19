const DepositService = require('../services/deposit.service');

class DepositController {
  constructor() {
    this.depositService = new DepositService();
  }

  /**
   * Iniciar processo de depósito
   */
  async initiateDeposit(req, res) {
    try {
      const { amount, userId } = req.body;
      
      // Validações
      if (!amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Valor inválido para depósito'
        });
      }

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'ID do usuário é obrigatório'
        });
      }

      // Iniciar processo de depósito
      const result = await this.depositService.initiateDeposit(amount, userId);
      
      res.json({
        success: true,
        message: 'Depósito iniciado com sucesso',
        data: {
          transactionId: result.transactionId,
          amount: result.amount,
          status: result.status
        }
      });

    } catch (error) {
      console.error('Erro ao iniciar depósito:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  /**
   * Confirmar depósito na blockchain
   */
  async confirmDeposit(req, res) {
    try {
      const { transactionId, blockchainTxHash, blockNumber, gasUsed } = req.body;
      
      // Validações
      if (!transactionId || !blockchainTxHash) {
        return res.status(400).json({
          success: false,
          message: 'ID da transação e hash da blockchain são obrigatórios'
        });
      }

      // Confirmar depósito
      const result = await this.depositService.confirmDeposit(
        transactionId, 
        blockchainTxHash, 
        blockNumber, 
        gasUsed
      );
      
      res.json({
        success: true,
        message: 'Depósito confirmado com sucesso',
        data: result
      });

    } catch (error) {
      console.error('Erro ao confirmar depósito:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  /**
   * Obter status de um depósito
   */
  async getDepositStatus(req, res) {
    try {
      const { transactionId } = req.params;
      
      if (!transactionId) {
        return res.status(400).json({
          success: false,
          message: 'ID da transação é obrigatório'
        });
      }

      const status = await this.depositService.getDepositStatus(transactionId);
      
      res.json({
        success: true,
        data: status
      });

    } catch (error) {
      console.error('Erro ao obter status do depósito:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  /**
   * Listar depósitos de um usuário
   */
  async getUserDeposits(req, res) {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 10, status } = req.query;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'ID do usuário é obrigatório'
        });
      }

      const deposits = await this.depositService.getUserDeposits(
        userId, 
        parseInt(page), 
        parseInt(limit), 
        status
      );
      
      res.json({
        success: true,
        data: deposits
      });

    } catch (error) {
      console.error('Erro ao listar depósitos:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }
}

module.exports = DepositController;



