const MintTransactionService = require('../services/mintTransaction.service');

class MintController {
  constructor() {
    this.mintService = new MintTransactionService();
  }

  /**
   * Criar transação de mint vinculada a um depósito
   */
  async createMintTransaction(req, res) {
    try {
      const { depositTransactionId, amount, recipientAddress } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado'
        });
      }

      if (!depositTransactionId || !amount || !recipientAddress) {
        return res.status(400).json({
          success: false,
          message: 'Parâmetros obrigatórios: depositTransactionId, amount, recipientAddress'
        });
      }

      console.log(`🏭 [MintController] Criando mint para depósito ${depositTransactionId}`);

      const mintTransaction = await this.mintService.createMintTransaction(
        depositTransactionId,
        userId,
        amount,
        recipientAddress
      );

      res.json({
        success: true,
        message: 'Transação de mint criada e enviada para processamento',
        data: {
          mintTransactionId: mintTransaction.id,
          depositTransactionId: depositTransactionId,
          amount: amount,
          recipientAddress: recipientAddress,
          status: 'pending'
        }
      });

    } catch (error) {
      console.error('❌ [MintController] Erro ao criar mint:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno ao criar transação de mint',
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