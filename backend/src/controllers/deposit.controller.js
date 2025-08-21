const DepositService = require('../services/deposit.service');
const userActionsService = require('../services/userActions.service');

class DepositController {
  constructor() {
    this.depositService = new DepositService();
  }

  /**
   * @swagger
   * /api/deposits/pix:
   *   post:
   *     summary: Criar depósito PIX
   *     description: Inicia um novo processo de depósito PIX convertendo BRL para cBRL
   *     tags: [Deposits]
   *     security:
   *       - BearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - amount
   *               - userId
   *             properties:
   *               amount:
   *                 type: number
   *                 minimum: 10
   *                 description: Valor do depósito em BRL (mínimo R$ 10,00)
   *                 example: 100.00
   *               userId:
   *                 type: string
   *                 format: uuid
   *                 description: ID do usuário
   *               description:
   *                 type: string
   *                 description: Descrição opcional do depósito
   *                 example: "Depósito para compra de cBRL"
   *     responses:
   *       201:
   *         description: Depósito criado com sucesso
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: "Depósito iniciado com sucesso"
   *                 data:
   *                   type: object
   *                   properties:
   *                     deposit:
   *                       $ref: '#/components/schemas/Deposit'
   *                     pixPayment:
   *                       type: object
   *                       properties:
   *                         paymentId:
   *                           type: string
   *                           description: ID do pagamento PIX
   *                         qrCode:
   *                           type: string
   *                           description: Código QR para pagamento
   *                         pixKey:
   *                           type: string
   *                           description: Chave PIX para pagamento manual
   *                         expiresAt:
   *                           type: string
   *                           format: date-time
   *                           description: Data de expiração
   *       400:
   *         description: Dados inválidos
   *       403:
   *         description: Email não confirmado
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: false
   *                 message:
   *                   type: string
   *                   example: "Por favor, confirme seu email antes de continuar"
   *                 code:
   *                   type: string
   *                   example: "EMAIL_NOT_CONFIRMED"
   *       401:
   *         description: Token inválido ou expirado
   *       500:
   *         description: Erro interno do servidor
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
      
      // Registrar ação de depósito iniciado
      await userActionsService.logFinancial(userId, 'deposit_initiated', req, {
        status: 'pending',
        amount,
        currency: 'BRL',
        method: 'pix',
        transactionId: result.transactionId,
        details: {
          depositId: result.transactionId,
          amount: result.amount
        }
      });
      
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
      
      // Registrar falha no depósito
      if (req.body.userId) {
        await userActionsService.logFinancial(req.body.userId, 'deposit_failed', req, {
          status: 'failed',
          amount: req.body.amount,
          errorMessage: error.message,
          errorCode: 'DEPOSIT_INITIATION_ERROR'
        });
      }
      
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

  /**
   * DEBUG: Confirmar PIX manualmente (apenas para desenvolvimento)
   */
  async debugConfirmPix(req, res) {
    try {
      // Verificar se está em ambiente de desenvolvimento
      if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({
          success: false,
          message: 'Este endpoint está disponível apenas em desenvolvimento'
        });
      }

      const { transactionId } = req.params;
      
      console.log(`🐛 DEBUG: Confirmando PIX manualmente para transação ${transactionId}`);

      // Dados simulados do PIX
      const pixData = {
        pixId: `PIX_DEBUG_${Date.now()}`,
        payerDocument: '12345678900',
        payerName: 'Debug Test User',
        paidAmount: req.body.amount || 100.00
      };

      // Confirmar pagamento PIX e enviar para fila
      const result = await this.depositService.confirmPixPayment(transactionId, pixData);

      // Registrar ação de debug
      if (result.user_id) {
        await userActionsService.logFinancial(result.user_id, 'debug_pix_confirmed', req, {
          status: 'processing',
          transactionId: transactionId,
          method: 'debug',
          details: pixData
        });
      }

      res.json({
        success: true,
        message: 'PIX confirmado (DEBUG) e enviado para processamento blockchain',
        data: {
          transactionId: result.id,
          status: result.status,
          metadata: result.metadata
        }
      });

    } catch (error) {
      console.error('Erro ao confirmar PIX (DEBUG):', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao confirmar PIX',
        error: error.message
      });
    }
  }

  /**
   * Webhook para receber confirmações de PIX do provedor
   */
  async handlePixWebhook(req, res) {
    try {
      // Validar assinatura do webhook (implementar conforme provedor)
      const signature = req.headers['x-webhook-signature'];
      
      // TODO: Validar assinatura quando integrar com provedor real
      // if (!validateWebhookSignature(signature, req.body)) {
      //   return res.status(401).json({ success: false, message: 'Invalid signature' });
      // }

      const { 
        transactionId, 
        pixId, 
        status,
        payerDocument,
        payerName,
        paidAmount 
      } = req.body;

      console.log(`📨 Webhook PIX recebido: ${transactionId} - Status: ${status}`);

      // Processar apenas se o PIX foi confirmado
      if (status === 'confirmed' || status === 'approved') {
        const pixData = {
          pixId,
          payerDocument,
          payerName,
          paidAmount
        };

        // Confirmar pagamento e enviar para fila
        await this.depositService.confirmPixPayment(transactionId, pixData);

        res.json({
          success: true,
          message: 'Webhook processado com sucesso'
        });
      } else {
        console.log(`⚠️ PIX não confirmado: ${status}`);
        res.json({
          success: true,
          message: 'Webhook recebido mas PIX não está confirmado'
        });
      }

    } catch (error) {
      console.error('Erro ao processar webhook PIX:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao processar webhook',
        error: error.message
      });
    }
  }
}

module.exports = DepositController;








