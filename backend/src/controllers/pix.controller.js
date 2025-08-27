/**
 * Controlador PIX Mock
 * Simula APIs PIX para desenvolvimento
 */
class PixController {
  /**
   * Obter dados do pagamento PIX
   */
  async getPixPayment(req, res) {
    try {
      const { pixPaymentId } = req.params;
      
      if (!pixPaymentId) {
        return res.status(400).json({
          success: false,
          message: 'ID do pagamento PIX é obrigatório'
        });
      }

      // Simular dados PIX baseado no ID
      const mockPixData = {
        pixPaymentId,
        status: 'pending', // pending, paid, expired, cancelled
        amount: 17.65, // Valor + taxa
        originalAmount: 14.65,
        fee: 3.00,
        qrCode: `00020126580014br.gov.bcb.pix2536pix-qr.mercadopago.com/instore/o/v2/${pixPaymentId}5204000053039865802BR5925Coinage Tecnologia6009Sao Paulo62070503***6304${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        pixKey: 'contato@coinage.com.br',
        
        // Dados da instituição
        bankData: {
          name: 'Coinage Tecnologia Ltda',
          cnpj: '12.345.678/0001-90',
          bank: 'Banco Inter',
          agency: '0001',
          account: '1234567-8'
        },
        
        // Tempo
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutos
        
        // Status de processamento
        transactionId: null, // Será preenchido quando pago
        
        // Mock: instruções
        instructions: [
          'Abra o aplicativo do seu banco',
          'Escaneie o código QR ou copie o código PIX',
          'Confirme o pagamento no valor de R$ 17,65',
          'Aguarde a confirmação automática'
        ]
      };

      res.json({
        success: true,
        data: {
          payment: mockPixData
        }
      });

    } catch (error) {
      console.error('Erro ao obter dados PIX:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  /**
   * Confirmar pagamento PIX (mock para desenvolvimento)
   */
  async confirmPixPayment(req, res) {
    try {
      const { pixPaymentId } = req.params;
      
      if (!pixPaymentId) {
        return res.status(400).json({
          success: false,
          message: 'ID do pagamento PIX é obrigatório'
        });
      }

      console.log(`🔄 [MOCK] Confirmando pagamento PIX: ${pixPaymentId}`);

      // Simular confirmação do PIX
      const confirmedPixData = {
        pixPaymentId,
        status: 'paid',
        paidAt: new Date(),
        transactionId: `tx_${Date.now()}`, // Simular transaction ID
        
        // Dados do pagador (mock)
        payer: {
          name: 'João Silva',
          document: '123.456.789-00',
          bank: 'Banco do Brasil'
        }
      };

      res.json({
        success: true,
        message: 'PIX confirmado com sucesso',
        data: {
          payment: confirmedPixData
        }
      });

    } catch (error) {
      console.error('Erro ao confirmar PIX:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }
}

module.exports = PixController;