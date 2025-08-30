const depositService = require('../services/deposit.service');

class MintController {
  constructor() {
    this.depositService = depositService; // Usar instância singleton
  }

  /**
   * Criar transação de mint vinculada a um depósito
   */
  async createMintTransaction(req, res) {
    try {
      // MÉTODO DESABILITADO - Agora usamos transações unificadas no depositService
      return res.status(410).json({
        success: false,
        message: 'Método descontinuado - Use depositService para transações unificadas'
      });

    } catch (error) {
      console.error('❌ [MintController] Erro:', error);
      res.status(500).json({
        success: false,
        message: 'Método descontinuado',
        error: error.message
      });
    }
  }

  /**
   * Buscar transação de mint por depósito
   */
  async getMintByDeposit(req, res) {
    try {
      const { depositTransactionId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado'
        });
      }

      const mintTransaction = await this.mintService.getMintByDepositId(depositTransactionId);

      if (!mintTransaction) {
        return res.json({
          success: true,
          message: 'Nenhuma transação de mint encontrada para este depósito',
          data: null
        });
      }

      // Verificar se o mint pertence ao usuário
      if (mintTransaction.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Acesso negado a esta transação'
        });
      }

      res.json({
        success: true,
        data: mintTransaction
      });

    } catch (error) {
      console.error('❌ [MintController] Erro ao buscar mint:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno ao buscar transação de mint',
        error: error.message
      });
    }
  }

  /**
   * DEV: Buscar transação de mint por depósito (sem autenticação)
   */
  async getMintByDepositDev(req, res) {
    try {
      const { depositTransactionId } = req.params;

      const mintTransaction = await this.mintService.getMintByDepositId(depositTransactionId);

      if (!mintTransaction) {
        return res.json({
          success: true,
          message: 'Nenhuma transação de mint encontrada para este depósito',
          data: null
        });
      }

      res.json({
        success: true,
        data: mintTransaction
      });

    } catch (error) {
      console.error('❌ [MintController] Erro ao buscar mint (DEV):', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno ao buscar transação de mint',
        error: error.message
      });
    }
  }

  /**
   * Listar transações de mint do usuário
   */
  async getUserMints(req, res) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado'
        });
      }

      const mintTransactions = await this.mintService.getUserMintTransactions(userId);

      res.json({
        success: true,
        data: mintTransactions
      });

    } catch (error) {
      console.error('❌ [MintController] Erro ao listar mints:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno ao listar transações de mint',
        error: error.message
      });
    }
  }
}

module.exports = MintController;