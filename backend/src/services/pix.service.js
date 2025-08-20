const axios = require('axios');
const crypto = require('crypto');

/**
 * Serviço PIX - Preparado para integração real mas usando mock
 * Suporta diferentes provedores PIX do Brasil
 */
class PixService {
  constructor() {
    this.provider = process.env.PIX_PROVIDER || 'mock'; // 'efipay', 'pagarme', 'asaas', 'mock'
    this.apiUrl = process.env.PIX_API_URL || 'https://api-pix.example.com';
    this.apiKey = process.env.PIX_API_KEY || 'mock_key';
    this.webhookSecret = process.env.PIX_WEBHOOK_SECRET || 'mock_secret';
    this.isMockMode = this.provider === 'mock' || process.env.NODE_ENV === 'development';
    
    // Configurações por provedor
    this.providerConfig = {
      efipay: {
        baseUrl: 'https://api-pix.gerencianet.com.br',
        endpoints: {
          charge: '/v2/cob',
          payment: '/v2/pix',
          webhook: '/v2/webhook'
        }
      },
      pagarme: {
        baseUrl: 'https://api.pagar.me',
        endpoints: {
          charge: '/core/v5/orders',
          payment: '/core/v5/transactions',
          webhook: '/core/v5/webhooks'
        }
      },
      asaas: {
        baseUrl: 'https://www.asaas.com/api/v3',
        endpoints: {
          charge: '/payments',
          payment: '/payments',
          webhook: '/webhook'
        }
      }
    };
  }

  /**
   * Cria cobrança PIX para depósito
   */
  async createPixCharge(chargeData) {
    try {
      const { amount, description, userInfo, externalId, expirationMinutes = 30 } = chargeData;
      
      console.log(`💰 Creating PIX charge: R$ ${amount} for user ${userInfo.name}`);
      
      if (this.isMockMode) {
        return this.createMockPixCharge(chargeData);
      }
      
      // Implementação real baseada no provedor
      switch (this.provider) {
        case 'efipay':
          return await this.createEfiPayCharge(chargeData);
        case 'pagarme':
          return await this.createPagarMeCharge(chargeData);
        case 'asaas':
          return await this.createAsaasCharge(chargeData);
        default:
          throw new Error(`Unsupported PIX provider: ${this.provider}`);
      }
      
    } catch (error) {
      console.error('❌ Error creating PIX charge:', error);
      throw error;
    }
  }

  /**
   * Verifica status de pagamento PIX
   */
  async checkPaymentStatus(paymentId) {
    try {
      console.log(`🔍 Checking PIX payment status: ${paymentId}`);
      
      if (this.isMockMode) {
        return this.checkMockPaymentStatus(paymentId);
      }
      
      // Implementação real baseada no provedor
      switch (this.provider) {
        case 'efipay':
          return await this.checkEfiPayStatus(paymentId);
        case 'pagarme':
          return await this.checkPagarMeStatus(paymentId);
        case 'asaas':
          return await this.checkAsaasStatus(paymentId);
        default:
          throw new Error(`Unsupported PIX provider: ${this.provider}`);
      }
      
    } catch (error) {
      console.error('❌ Error checking payment status:', error);
      throw error;
    }
  }

  /**
   * Processa saque PIX
   */
  async processPixWithdrawal(withdrawalData) {
    try {
      const { amount, pixKey, pixKeyType, userInfo, externalId } = withdrawalData;
      
      console.log(`💸 Processing PIX withdrawal: R$ ${amount} to ${this.maskPixKey(pixKey)}`);
      
      if (this.isMockMode) {
        return this.processMockPixWithdrawal(withdrawalData);
      }
      
      // Implementação real baseada no provedor
      switch (this.provider) {
        case 'efipay':
          return await this.processEfiPayWithdrawal(withdrawalData);
        case 'pagarme':
          return await this.processPagarMeWithdrawal(withdrawalData);
        case 'asaas':
          return await this.processAsaasWithdrawal(withdrawalData);
        default:
          throw new Error(`Unsupported PIX provider: ${this.provider}`);
      }
      
    } catch (error) {
      console.error('❌ Error processing PIX withdrawal:', error);
      throw error;
    }
  }

  /**
   * MOCK IMPLEMENTATIONS
   */

  /**
   * Mock: Cria cobrança PIX
   */
  async createMockPixCharge(chargeData) {
    const { amount, description, userInfo, externalId, expirationMinutes = 30 } = chargeData;
    
    // Simular delay da API
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const paymentId = `pix_charge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = new Date(Date.now() + expirationMinutes * 60 * 1000);
    
    // QR Code PIX mock (seria gerado pela API real)
    const pixCode = this.generateMockPixCode(amount, description, paymentId);
    
    return {
      success: true,
      paymentId,
      externalId,
      status: 'waiting_payment',
      amount: parseFloat(amount),
      description,
      pixCode,
      qrCodeImage: `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==`, // Pixel transparente
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString(),
      webhookUrl: `${process.env.API_BASE_URL}/api/webhooks/pix/${paymentId}`,
      provider: 'mock'
    };
  }

  /**
   * Mock: Verifica status do pagamento
   */
  async checkMockPaymentStatus(paymentId) {
    // Simular delay da API
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Para mock, simular aprovação em 70% dos casos após 10 segundos
    const createdTime = this.extractTimeFromPaymentId(paymentId);
    const elapsed = Date.now() - createdTime;
    const shouldApprove = elapsed > 10000 && Math.random() > 0.3;
    
    if (shouldApprove) {
      return {
        success: true,
        paymentId,
        status: 'approved',
        paidAt: new Date().toISOString(),
        paidAmount: 100.00, // Mock amount
        endToEndId: `E${Date.now()}2023${Math.random().toString().substr(2, 8)}`,
        txId: `txid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        provider: 'mock'
      };
    } else {
      return {
        success: true,
        paymentId,
        status: 'waiting_payment',
        provider: 'mock'
      };
    }
  }

  /**
   * Mock: Processa saque PIX
   */
  async processMockPixWithdrawal(withdrawalData) {
    const { amount, pixKey, pixKeyType, userInfo, externalId } = withdrawalData;
    
    // Simular delay do processamento
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simular sucesso em 90% dos casos
    const success = Math.random() > 0.1;
    
    if (success) {
      const withdrawalId = `pix_withdrawal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      return {
        success: true,
        withdrawalId,
        externalId,
        status: 'completed',
        amount: parseFloat(amount),
        pixKey: this.maskPixKey(pixKey),
        pixKeyType,
        endToEndId: `E${Date.now()}2023${Math.random().toString().substr(2, 8)}`,
        txId: `txid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        processedAt: new Date().toISOString(),
        fee: 0.00, // Mock sem taxa
        provider: 'mock'
      };
    } else {
      return {
        success: false,
        error: 'PIX provider temporarily unavailable',
        errorCode: 'PROVIDER_ERROR',
        provider: 'mock'
      };
    }
  }

  /**
   * REAL PROVIDER IMPLEMENTATIONS (Templates prontos para integração)
   */

  /**
   * EfiPay (ex-Gerencianet) - Implementação real
   */
  async createEfiPayCharge(chargeData) {
    // TODO: Implementar integração real com EfiPay
    // Documentação: https://dev.efipay.com.br/docs/api-pix
    
    const config = this.providerConfig.efipay;
    // Implementar autenticação OAuth2, criação de cobrança, etc.
    
    throw new Error('EfiPay integration not implemented yet');
  }

  async checkEfiPayStatus(paymentId) {
    // TODO: Implementar verificação de status EfiPay
    throw new Error('EfiPay integration not implemented yet');
  }

  async processEfiPayWithdrawal(withdrawalData) {
    // TODO: Implementar saque EfiPay
    throw new Error('EfiPay integration not implemented yet');
  }

  /**
   * Pagar.me - Implementação real
   */
  async createPagarMeCharge(chargeData) {
    // TODO: Implementar integração real com Pagar.me
    // Documentação: https://docs.pagar.me/
    
    throw new Error('Pagar.me integration not implemented yet');
  }

  async checkPagarMeStatus(paymentId) {
    // TODO: Implementar verificação de status Pagar.me
    throw new Error('Pagar.me integration not implemented yet');
  }

  async processPagarMeWithdrawal(withdrawalData) {
    // TODO: Implementar saque Pagar.me
    throw new Error('Pagar.me integration not implemented yet');
  }

  /**
   * Asaas - Implementação real
   */
  async createAsaasCharge(chargeData) {
    // TODO: Implementar integração real com Asaas
    // Documentação: https://docs.asaas.com/
    
    throw new Error('Asaas integration not implemented yet');
  }

  async checkAsaasStatus(paymentId) {
    // TODO: Implementar verificação de status Asaas
    throw new Error('Asaas integration not implemented yet');
  }

  async processAsaasWithdrawal(withdrawalData) {
    // TODO: Implementar saque Asaas
    throw new Error('Asaas integration not implemented yet');
  }

  /**
   * UTILITY METHODS
   */

  /**
   * Gera código PIX mock
   */
  generateMockPixCode(amount, description, paymentId) {
    // PIX code simplificado para mock
    const payload = `${paymentId}|${amount}|${description}`;
    return `00020126${payload.length.toString().padStart(2, '0')}${payload}5303986540${amount.toFixed(2)}5802BR6009SAO PAULO62070503***6304`;
  }

  /**
   * Extrai timestamp do paymentId para simulação
   */
  extractTimeFromPaymentId(paymentId) {
    const match = paymentId.match(/(\d+)/);
    return match ? parseInt(match[1]) : Date.now();
  }

  /**
   * Mascara chave PIX
   */
  maskPixKey(pixKey) {
    if (!pixKey) return '';
    
    if (pixKey.includes('@')) {
      // Email
      const [username, domain] = pixKey.split('@');
      return `${username.substring(0, 2)}***@${domain}`;
    } else if (pixKey.length === 11) {
      // CPF
      return `***${pixKey.slice(-3)}`;
    } else if (pixKey.length === 14) {
      // CNPJ
      return `***${pixKey.slice(-4)}`;
    } else {
      // Telefone ou aleatória
      return `***${pixKey.slice(-4)}`;
    }
  }

  /**
   * Valida chave PIX
   */
  validatePixKey(pixKey, type) {
    if (!pixKey) return false;
    
    switch (type) {
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(pixKey);
      case 'cpf':
        return /^\d{11}$/.test(pixKey.replace(/\D/g, ''));
      case 'cnpj':
        return /^\d{14}$/.test(pixKey.replace(/\D/g, ''));
      case 'phone':
        return /^\+55\d{10,11}$/.test(pixKey.replace(/\D/g, ''));
      case 'random':
        return /^[a-f0-9-]{36}$/.test(pixKey);
      default:
        return false;
    }
  }

  /**
   * Detecta tipo de chave PIX
   */
  detectPixKeyType(pixKey) {
    if (!pixKey) return null;
    
    const cleaned = pixKey.replace(/\D/g, '');
    
    if (pixKey.includes('@')) return 'email';
    if (cleaned.length === 11) return 'cpf';
    if (cleaned.length === 14) return 'cnpj';
    if (cleaned.length >= 10 && cleaned.length <= 11 && pixKey.includes('+55')) return 'phone';
    if (/^[a-f0-9-]{36}$/.test(pixKey)) return 'random';
    
    return 'unknown';
  }

  /**
   * Calcula taxa PIX (se aplicável)
   */
  calculatePixFee(amount, operation = 'withdrawal') {
    // Mock: sem taxa para depósitos, taxa fixa para saques
    if (operation === 'deposit') return 0;
    if (operation === 'withdrawal') return 2.50; // R$ 2,50 taxa fixa mock
    return 0;
  }

  /**
   * Health check do serviço PIX
   */
  async healthCheck() {
    try {
      if (this.isMockMode) {
        return {
          healthy: true,
          provider: 'mock',
          status: 'operational',
          timestamp: new Date().toISOString()
        };
      }
      
      // Para provedores reais, fazer ping na API
      const response = await axios.get(`${this.apiUrl}/health`, {
        timeout: 5000,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
      
      return {
        healthy: response.status === 200,
        provider: this.provider,
        status: response.data?.status || 'unknown',
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      return {
        healthy: false,
        provider: this.provider,
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = new PixService();