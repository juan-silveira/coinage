const { PrismaClient } = require('../generated/prisma');

class PixKeyValidationService {
  constructor() {
    this.prisma = new PrismaClient();
  }

  async init() {
    if (!this.prisma) {
      this.prisma = new PrismaClient();
    }
  }

  // Validar chave PIX no momento do saque (cobrando taxa se necessário)
  async validatePixKeyForWithdraw(userId, pixKeyId) {
    try {
      await this.init();

      console.log('🔍 [PixValidation] Validando chave PIX para saque:', { userId, pixKeyId });

      // Buscar a chave PIX
      const pixKey = await this.prisma.userPixKey.findFirst({
        where: {
          id: pixKeyId,
          userId: userId,
          isActive: true
        }
      });

      if (!pixKey) {
        throw new Error('Chave PIX não encontrada ou inativa');
      }

      console.log('📋 [PixValidation] Chave PIX encontrada:', { 
        keyType: pixKey.keyType, 
        isVerified: pixKey.isVerified 
      });

      // Se já está verificada, não precisa validar novamente
      if (pixKey.isVerified) {
        console.log('✅ [PixValidation] Chave já verificada');
        return {
          success: true,
          validated: true,
          charged: false,
          amount: 0,
          message: 'Chave PIX já verificada'
        };
      }

      // Para chaves CPF, validar automaticamente se for igual ao CPF do usuário
      if (pixKey.keyType === 'cpf') {
        console.log('🆔 [PixValidation] Validando chave CPF automaticamente');
        
        const user = await this.prisma.user.findUnique({
          where: { id: userId }
        });

        if (!user?.cpf) {
          throw new Error('CPF do usuário não encontrado');
        }

        const userCpf = user.cpf.replace(/\D/g, '');
        const pixKeyCpf = pixKey.keyValue.replace(/\D/g, '');
        
        if (userCpf === pixKeyCpf) {
          // Marcar como verificada
          await this.prisma.userPixKey.update({
            where: { id: pixKey.id },
            data: {
              isVerified: true,
              lastVerifiedAt: new Date(),
              verificationData: {
                validatedAt: new Date().toISOString(),
                method: 'automatic_cpf',
                charged: false
              }
            }
          });

          console.log('✅ [PixValidation] Chave CPF validada automaticamente');
          return {
            success: true,
            validated: true,
            charged: false,
            amount: 0,
            message: 'Chave CPF validada automaticamente'
          };
        } else {
          throw new Error('CPF da chave PIX deve ser igual ao CPF cadastrado na conta');
        }
      }

      // Para outras chaves (email, phone, random), cobrar taxa de validação
      console.log('💰 [PixValidation] Cobrando taxa de validação para chave não-CPF');
      
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { userTaxes: true }
      });

      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      const validationFee = user.userTaxes?.pixValidation || 1.0;
      
      // Verificar se o usuário tem saldo suficiente (assumindo que existe um campo balance)
      // Aqui você pode implementar a lógica de verificação de saldo conforme sua estrutura
      
      // Simular validação externa da chave PIX
      const externalValidation = await this.validateWithExternalAPI(pixKey);
      
      if (externalValidation.success) {
        // Cobrar a taxa (implementar lógica de cobrança conforme seu sistema)
        await this.chargeValidationFee(userId, validationFee);
        
        // Marcar como verificada
        await this.prisma.userPixKey.update({
          where: { id: pixKey.id },
          data: {
            isVerified: true,
            lastVerifiedAt: new Date(),
            verificationData: {
              validatedAt: new Date().toISOString(),
              method: 'external_api',
              charged: true,
              amount: validationFee,
              externalResult: externalValidation.data
            }
          }
        });

        console.log('✅ [PixValidation] Chave validada com sucesso - Taxa cobrada:', validationFee);
        return {
          success: true,
          validated: true,
          charged: true,
          amount: validationFee,
          message: `Chave PIX validada com sucesso. Taxa de R$ ${validationFee.toFixed(2)} cobrada.`
        };
      } else {
        console.log('❌ [PixValidation] Chave não pôde ser validada pela API externa');
        return {
          success: false,
          validated: false,
          charged: false,
          amount: 0,
          message: 'Chave PIX não pôde ser validada. Verifique os dados.'
        };
      }

    } catch (error) {
      console.error('❌ [PixValidation] Erro ao validar chave PIX:', error);
      throw error;
    }
  }

  // Simular validação com API externa
  async validateWithExternalAPI(pixKey) {
    try {
      console.log('🌐 [PixValidation] Validando com API externa (simulação)');
      
      // Simular delay da API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simular resposta positiva para demonstração
      // Na implementação real, aqui seria feita a chamada para a API do banco central ou similar
      return {
        success: true,
        data: {
          keyType: pixKey.keyType,
          keyValue: pixKey.keyValue,
          holderName: pixKey.holderName,
          holderDocument: pixKey.holderDocument,
          validatedAt: new Date().toISOString(),
          provider: 'simulated_api'
        }
      };
      
    } catch (error) {
      console.error('❌ [PixValidation] Erro na API externa:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Cobrar taxa de validação
  async chargeValidationFee(userId, amount) {
    try {
      console.log('💳 [PixValidation] Cobrando taxa de validação:', { userId, amount });
      
      // Aqui você implementaria a lógica de cobrança conforme seu sistema
      // Por exemplo, debitar do saldo do usuário, criar transação, etc.
      // Para demonstração, apenas logar
      
      console.log('✅ [PixValidation] Taxa cobrada com sucesso');
      return true;
      
    } catch (error) {
      console.error('❌ [PixValidation] Erro ao cobrar taxa:', error);
      throw error;
    }
  }

  // Verificar se uma chave precisa de validação paga
  async needsPaidValidation(userId, pixKeyId) {
    try {
      await this.init();

      const pixKey = await this.prisma.userPixKey.findFirst({
        where: {
          id: pixKeyId,
          userId: userId,
          isActive: true
        }
      });

      if (!pixKey) {
        return { needsValidation: false, reason: 'Chave não encontrada' };
      }

      if (pixKey.isVerified) {
        return { needsValidation: false, reason: 'Chave já verificada' };
      }

      if (pixKey.keyType === 'cpf') {
        return { needsValidation: false, reason: 'CPF é validado automaticamente' };
      }

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { userTaxes: true }
      });

      const validationFee = user?.userTaxes?.pixValidation || 1.0;

      return { 
        needsValidation: true, 
        fee: validationFee,
        reason: 'Chave não-CPF requer validação paga'
      };

    } catch (error) {
      console.error('❌ [PixValidation] Erro ao verificar necessidade de validação:', error);
      throw error;
    }
  }
}

module.exports = new PixKeyValidationService();