const axios = require('axios');
const prismaConfig = require('../config/prisma');
const userTaxesService = require('./userTaxes.service');

/**
 * Serviço para validação de chaves PIX com taxa
 * Integra com API externa para verificar se a chave pertence ao mesmo CPF do usuário
 */
class PixValidationService {
  constructor() {
    this.prisma = null;
    this.validationApiUrl = process.env.PIX_VALIDATION_API_URL || 'https://api.pixvalidation.example.com';
    this.validationApiKey = process.env.PIX_VALIDATION_API_KEY || 'mock_key';
    this.isMockMode = process.env.PIX_VALIDATION_MOCK === 'true' || process.env.NODE_ENV === 'development';
  }

  async init() {
    if (!this.prisma) {
      try {
        this.prisma = prismaConfig.getPrisma();
      } catch (error) {
        await prismaConfig.initialize();
        this.prisma = prismaConfig.getPrisma();
      }
    }
  }

  /**
   * Valida chave PIX com cobrança de taxa
   * @param {string} userId - ID do usuário
   * @param {string} pixKey - Chave PIX a ser validada
   * @param {string} keyType - Tipo da chave PIX
   * @returns {Promise<Object>} Resultado da validação
   */
  async validatePixKeyWithFee(userId, pixKey, keyType) {
    try {
      await this.init();

      console.log(`🔍 Iniciando validação PIX para usuário ${userId}, chave: ${this.maskPixKey(pixKey)}, tipo: ${keyType}`);

      // 1. Buscar usuário e suas informações
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          userTaxes: true
        }
      });

      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      // 2. Verificar se é chave CPF (sem taxa)
      if (keyType === 'cpf') {
        console.log('💰 Chave PIX tipo CPF - sem taxa de validação');
        
        // Verificar se o CPF da chave é o mesmo do usuário
        const cleanCpf = pixKey.replace(/\D/g, '');
        const userCpf = user.cpf.replace(/\D/g, '');
        
        if (cleanCpf !== userCpf) {
          return {
            success: false,
            error: 'CPF da chave PIX deve ser igual ao CPF cadastrado na conta',
            charged: false,
            amount: 0
          };
        }

        return {
          success: true,
          validated: true,
          message: 'Chave PIX CPF validada com sucesso',
          charged: false,
          amount: 0,
          keyBelongsToUser: true,
          holderData: {
            name: user.name,
            cpf: user.cpf
          }
        };
      }

      // 3. Verificar saldo e obter taxa de validação
      const validationFee = user.userTaxes?.pixValidation || 1.0;
      
      if (user.balance < validationFee) {
        return {
          success: false,
          error: `Saldo insuficiente. Taxa de validação: ${validationFee} cBRL`,
          charged: false,
          amount: 0,
          requiredBalance: validationFee,
          currentBalance: parseFloat(user.balance)
        };
      }

      // 4. Cobrar taxa de validação
      console.log(`💸 Cobrando taxa de validação: ${validationFee} cBRL`);
      
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          balance: {
            decrement: validationFee
          }
        }
      });

      // 5. Registrar transação da taxa
      await this.prisma.transaction.create({
        data: {
          companyId: user.userCompanies?.[0]?.companyId || '40fce51c-b169-4bac-9608-a9549b360c90', // Fallback para Coinage
          userId: userId,
          transactionType: 'fee',
          status: 'confirmed',
          amount: validationFee,
          currency: 'cBRL',
          operation_type: 'pix_validation',
          fee: 0,
          net_amount: validationFee,
          confirmedAt: new Date(),
          metadata: {
            description: 'Taxa de validação de chave PIX',
            pixKey: this.maskPixKey(pixKey),
            keyType: keyType
          }
        }
      });

      // 6. Chamar API de validação
      let validationResult;
      try {
        validationResult = await this.callPixValidationAPI(pixKey, keyType, user.cpf);
      } catch (apiError) {
        console.error('❌ Erro na API de validação:', apiError.message);
        
        // Em caso de erro da API, devolver a taxa cobrada
        await this.prisma.user.update({
          where: { id: userId },
          data: {
            balance: {
              increment: validationFee
            }
          }
        });

        return {
          success: false,
          error: 'Erro na validação da chave PIX. Taxa reembolsada.',
          charged: false,
          amount: 0,
          refunded: true
        };
      }

      console.log(`✅ Validação PIX concluída - Taxa cobrada: ${validationFee} cBRL`);

      return {
        success: true,
        validated: validationResult.keyBelongsToUser,
        message: validationResult.keyBelongsToUser 
          ? 'Chave PIX validada com sucesso' 
          : 'Chave PIX não pertence ao mesmo CPF do usuário',
        charged: true,
        amount: validationFee,
        keyBelongsToUser: validationResult.keyBelongsToUser,
        holderData: validationResult.holderData,
        validationDetails: validationResult.details
      };

    } catch (error) {
      console.error('❌ Erro na validação PIX:', error);
      throw error;
    }
  }

  /**
   * Chama API externa para validação da chave PIX
   * @param {string} pixKey - Chave PIX
   * @param {string} keyType - Tipo da chave
   * @param {string} userCpf - CPF do usuário para comparação
   * @returns {Promise<Object>} Resultado da API
   */
  async callPixValidationAPI(pixKey, keyType, userCpf) {
    if (this.isMockMode) {
      return this.mockPixValidationAPI(pixKey, keyType, userCpf);
    }

    try {
      const response = await axios.post(`${this.validationApiUrl}/validate`, {
        pixKey,
        keyType,
        userCpf: userCpf.replace(/\D/g, '')
      }, {
        headers: {
          'Authorization': `Bearer ${this.validationApiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      return {
        keyBelongsToUser: response.data.cpfMatches,
        holderData: response.data.holder,
        details: response.data.details
      };

    } catch (error) {
      console.error('❌ Erro na API de validação PIX:', error.message);
      throw new Error('Serviço de validação PIX temporariamente indisponível');
    }
  }

  /**
   * Mock da API de validação PIX para desenvolvimento
   */
  async mockPixValidationAPI(pixKey, keyType, userCpf) {
    console.log('🧪 Usando mock da API de validação PIX');
    
    // Simular delay da API
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Para mock, simular validação positiva em 80% dos casos
    const isValid = Math.random() > 0.2;

    if (isValid) {
      return {
        keyBelongsToUser: true,
        holderData: {
          name: 'Nome do Titular Mock',
          cpf: userCpf
        },
        details: {
          bankName: 'Banco Mock',
          accountType: 'Conta Corrente',
          status: 'ativa'
        }
      };
    } else {
      return {
        keyBelongsToUser: false,
        holderData: {
          name: 'Outro Titular',
          cpf: '12345678901'
        },
        details: {
          bankName: 'Banco Mock',
          accountType: 'Conta Corrente',
          status: 'ativa'
        }
      };
    }
  }

  /**
   * Atualiza chave PIX após validação bem-sucedida
   * @param {string} pixKeyId - ID da chave PIX
   * @param {Object} validationData - Dados da validação
   */
  async updatePixKeyAfterValidation(pixKeyId, validationData) {
    try {
      await this.init();

      await this.prisma.userPixKey.update({
        where: { id: pixKeyId },
        data: {
          isVerified: validationData.keyBelongsToUser,
          lastVerifiedAt: new Date(),
          verificationData: {
            validated: true,
            validatedAt: new Date().toISOString(),
            holderData: validationData.holderData,
            details: validationData.validationDetails,
            charged: validationData.charged,
            amount: validationData.amount
          }
        }
      });

      console.log(`✅ Chave PIX ${pixKeyId} atualizada após validação`);

    } catch (error) {
      console.error('❌ Erro ao atualizar chave PIX:', error);
      throw error;
    }
  }

  /**
   * Obtém histórico de validações do usuário
   * @param {string} userId - ID do usuário
   * @returns {Promise<Array>} Histórico de validações
   */
  async getValidationHistory(userId) {
    try {
      await this.init();

      const validations = await this.prisma.transaction.findMany({
        where: {
          userId,
          operation_type: 'pix_validation'
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 50
      });

      return validations.map(transaction => ({
        id: transaction.id,
        amount: parseFloat(transaction.amount),
        pixKey: transaction.metadata?.pixKey || 'N/A',
        keyType: transaction.metadata?.keyType || 'N/A',
        status: transaction.status,
        createdAt: transaction.createdAt
      }));

    } catch (error) {
      console.error('❌ Erro ao buscar histórico:', error);
      throw error;
    }
  }

  /**
   * Calcula custo total de validações do usuário
   * @param {string} userId - ID do usuário
   * @param {number} days - Dias para cálculo (padrão: 30)
   * @returns {Promise<Object>} Estatísticas de custos
   */
  async getValidationCosts(userId, days = 30) {
    try {
      await this.init();

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const result = await this.prisma.transaction.aggregate({
        where: {
          userId,
          operation_type: 'pix_validation',
          createdAt: {
            gte: startDate
          }
        },
        _sum: {
          amount: true
        },
        _count: {
          id: true
        }
      });

      return {
        totalAmount: parseFloat(result._sum.amount || 0),
        totalValidations: result._count.id,
        period: `${days} dias`,
        averageCost: result._count.id > 0 ? parseFloat(result._sum.amount) / result._count.id : 0
      };

    } catch (error) {
      console.error('❌ Erro ao calcular custos:', error);
      throw error;
    }
  }

  /**
   * Mascara chave PIX para logs
   * @param {string} pixKey - Chave PIX
   * @returns {string} Chave mascarada
   */
  maskPixKey(pixKey) {
    if (!pixKey) return '';
    
    if (pixKey.includes('@')) {
      const [username, domain] = pixKey.split('@');
      return `${username.substring(0, 2)}***@${domain}`;
    } else if (pixKey.length === 11) {
      return `***${pixKey.slice(-3)}`;
    } else if (pixKey.length === 14) {
      return `***${pixKey.slice(-4)}`;
    } else {
      return `***${pixKey.slice(-4)}`;
    }
  }

  /**
   * Health check do serviço de validação
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

      const response = await axios.get(`${this.validationApiUrl}/health`, {
        timeout: 5000,
        headers: {
          'Authorization': `Bearer ${this.validationApiKey}`
        }
      });

      return {
        healthy: response.status === 200,
        provider: 'external',
        status: response.data?.status || 'unknown',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return {
        healthy: false,
        provider: 'external',
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = PixValidationService;