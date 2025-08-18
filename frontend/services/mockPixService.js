/**
 * Serviço Mock para Simular Pagamentos PIX
 * Simula geração de QR Code, código PIX e detecção de pagamento
 */

// Simular delay para tornar mais realista
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Banco de dados mock para pagamentos PIX
const mockPixDatabase = {
  payments: new Map(),
  nextId: 1,
  
  // Gerar ID único
  generateId() {
    return this.nextId++;
  },
  
  // Criar pagamento PIX
  createPayment(data) {
    const id = this.generateId();
    const pixKey = generatePixKey();
    const qrCode = generateQRCode(pixKey, data.amount);
    
    const payment = {
      id,
      pixKey,
      qrCode,
      amount: data.amount,
      transactionId: data.transactionId,
      userId: data.userId,
      status: 'pending', // pending, paid, expired, cancelled
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutos
      paidAt: null,
      metadata: {
        type: 'pix',
        institution: 'Banco Mock',
        accountType: 'Conta Corrente',
        beneficiary: 'Coinage LTDA',
        cnpj: '12.345.678/0001-90'
      }
    };
    
    this.payments.set(id, payment);
    return payment;
  },
  
  // Buscar pagamento por ID
  getPayment(id) {
    return this.payments.get(parseInt(id));
  },
  
  // Buscar pagamento por transactionId
  getPaymentByTransactionId(transactionId) {
    return Array.from(this.payments.values())
      .find(payment => payment.transactionId === transactionId);
  },
  
  // Atualizar pagamento
  updatePayment(id, data) {
    const payment = this.payments.get(parseInt(id));
    if (payment) {
      Object.assign(payment, data);
      this.payments.set(parseInt(id), payment);
    }
    return payment;
  },
  
  // Marcar como pago
  markAsPaid(id) {
    const payment = this.payments.get(parseInt(id));
    if (payment) {
      payment.status = 'paid';
      payment.paidAt = new Date().toISOString();
      this.payments.set(parseInt(id), payment);
    }
    return payment;
  },
  
  // Listar pagamentos do usuário
  listUserPayments(userId) {
    return Array.from(this.payments.values())
      .filter(payment => payment.userId === userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },
  
  // Limpar pagamentos expirados
  cleanExpiredPayments() {
    const now = new Date();
    for (const [id, payment] of this.payments.entries()) {
      if (payment.status === 'pending' && new Date(payment.expiresAt) < now) {
        payment.status = 'expired';
        this.payments.set(id, payment);
      }
    }
  }
};

// Gerar chave PIX aleatória
const generatePixKey = () => {
  const pixKeys = [
    'coinage@email.com',
    '11987654321',
    '12.345.678/0001-90',
    '12345678901234567890'
  ];
  return pixKeys[Math.floor(Math.random() * pixKeys.length)];
};

// Gerar QR Code mock (base64 de uma imagem simples)
const generateQRCode = (pixKey, amount) => {
  // Simular QR Code em base64 (imagem simples)
  const qrData = `00020126580014br.gov.bcb.pix0136${pixKey}520400005303986540${amount.toFixed(2)}5802BR5913Coinage LTDA6008Sao Paulo62070503***6304`;
  return `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==`;
};

// Simular detecção de pagamento
const simulatePaymentDetection = async (paymentId) => {
  // Simular tempo de pagamento (entre 5 e 60 segundos)
  const paymentTime = Math.random() * 55000 + 5000;
  
  console.log(`💳 Simulando pagamento PIX ${paymentId}...`);
  console.log(`⏱️ Tempo estimado: ${Math.round(paymentTime / 1000)} segundos`);
  
  await delay(paymentTime);
  
  // Marcar como pago
  const payment = mockPixDatabase.markAsPaid(paymentId);
  
  console.log(`✅ Pagamento PIX ${paymentId} confirmado!`);
  console.log(`💰 Valor: R$ ${payment.amount}`);
  console.log(`🕐 Pago em: ${payment.paidAt}`);
  
  return payment;
};

// Serviço principal
const mockPixService = {
  /**
   * Criar pagamento PIX
   */
  async createPixPayment(paymentData) {
    try {
      console.log('💳 Criando pagamento PIX:', paymentData);
      
      // Simular delay de criação
      await delay(1000 + Math.random() * 2000);
      
      // Criar pagamento no banco mock
      const payment = mockPixDatabase.createPayment({
        ...paymentData,
        amount: paymentData.amount
      });
      
      console.log('✅ Pagamento PIX criado com sucesso:', payment);
      
      // Iniciar simulação de pagamento (opcional)
      if (paymentData.autoSimulate !== false) {
        this.simulatePaymentAsync(payment.id);
      }
      
      return {
        success: true,
        message: 'Pagamento PIX criado com sucesso',
        payment
      };
      
    } catch (error) {
      console.error('❌ Erro ao criar pagamento PIX:', error);
      return {
        success: false,
        message: 'Erro interno ao criar pagamento PIX',
        error: error.message
      };
    }
  },
  
  /**
   * Simular pagamento de forma assíncrona
   */
  async simulatePaymentAsync(paymentId) {
    try {
      // Simular delay inicial
      await delay(2000 + Math.random() * 3000);
      
      // Simular detecção de pagamento
      await simulatePaymentDetection(paymentId);
      
    } catch (error) {
      console.error(`❌ Erro na simulação de pagamento ${paymentId}:`, error);
    }
  },
  
  /**
   * Buscar pagamento por ID
   */
  async getPayment(paymentId) {
    try {
      console.log('🔍 Buscando pagamento PIX:', paymentId);
      
      // Simular delay de busca
      await delay(500 + Math.random() * 1000);
      
      const payment = mockPixDatabase.getPayment(paymentId);
      
      if (!payment) {
        return {
          success: false,
          message: 'Pagamento PIX não encontrado'
        };
      }
      
      console.log('✅ Pagamento PIX encontrado:', payment);
      
      return {
        success: true,
        payment
      };
      
    } catch (error) {
      console.error('❌ Erro ao buscar pagamento PIX:', error);
      return {
        success: false,
        message: 'Erro interno ao buscar pagamento PIX',
        error: error.message
      };
    }
  },
  
  /**
   * Buscar pagamento por transactionId
   */
  async getPaymentByTransactionId(transactionId) {
    try {
      console.log('🔍 Buscando pagamento PIX por transação:', transactionId);
      
      // Simular delay de busca
      await delay(500 + Math.random() * 1000);
      
      const payment = mockPixDatabase.getPaymentByTransactionId(transactionId);
      
      if (!payment) {
        return {
          success: false,
          message: 'Pagamento PIX não encontrado para esta transação'
        };
      }
      
      console.log('✅ Pagamento PIX encontrado:', payment);
      
      return {
        success: true,
        payment
      };
      
    } catch (error) {
      console.error('❌ Erro ao buscar pagamento PIX:', error);
      return {
        success: false,
        message: 'Erro interno ao buscar pagamento PIX',
        error: error.message
      };
    }
  },
  
  /**
   * Forçar pagamento (para testes)
   */
  async forcePayment(paymentId) {
    try {
      console.log('💪 Forçando pagamento PIX:', paymentId);
      
      const payment = mockPixDatabase.markAsPaid(paymentId);
      
      if (payment) {
        console.log('✅ Pagamento PIX forçado com sucesso:', payment);
        return {
          success: true,
          message: 'Pagamento PIX forçado com sucesso',
          payment
        };
      } else {
        return {
          success: false,
          message: 'Pagamento PIX não encontrado'
        };
      }
      
    } catch (error) {
      console.error('❌ Erro ao forçar pagamento PIX:', error);
      return {
        success: false,
        message: 'Erro interno ao forçar pagamento PIX',
        error: error.message
      };
    }
  },
  
  /**
   * Listar pagamentos do usuário
   */
  async listUserPayments(userId) {
    try {
      console.log('📋 Listando pagamentos PIX do usuário:', userId);
      
      // Simular delay de busca
      await delay(800 + Math.random() * 1200);
      
      const payments = mockPixDatabase.listUserPayments(userId);
      
      console.log(`✅ Encontrados ${payments.length} pagamentos PIX`);
      
      return {
        success: true,
        payments,
        total: payments.length
      };
      
    } catch (error) {
      console.error('❌ Erro ao listar pagamentos PIX:', error);
      return {
        success: false,
        message: 'Erro interno ao listar pagamentos PIX',
        error: error.message
      };
    }
  },
  
  /**
   * Limpar dados mock
   */
  clearMockData() {
    console.log('🧹 Limpando dados PIX mock...');
    mockPixDatabase.payments.clear();
    mockPixDatabase.nextId = 1;
    console.log('✅ Dados PIX mock limpos');
  },
  
  /**
   * Obter estatísticas dos dados mock
   */
  getMockStats() {
    const payments = Array.from(mockPixDatabase.payments.values());
    const stats = {
      total: payments.length,
      pending: payments.filter(p => p.status === 'pending').length,
      paid: payments.filter(p => p.status === 'paid').length,
      expired: payments.filter(p => p.status === 'expired').length,
      totalAmount: payments
        .filter(p => p.status === 'paid')
        .reduce((sum, p) => sum + p.amount, 0)
    };
    
    console.log('📊 Estatísticas PIX mock:', stats);
    return stats;
  }
};

// Exportar serviço
export default mockPixService;

// Exportar funções utilitárias para testes
export {
  mockPixDatabase,
  generatePixKey,
  generateQRCode,
  simulatePaymentDetection
};
