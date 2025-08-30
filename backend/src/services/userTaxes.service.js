const prismaConfig = require('../config/prisma');

class UserTaxesService {
  constructor() {
    this.prisma = null;
  }

  async init() {
    this.prisma = prismaConfig.getPrisma();
  }

  /**
   * Obter taxas do usuário ou criar taxas padrão
   */
  async getUserTaxes(userId) {
    try {
      if (!this.prisma) await this.init();

      // Buscar taxas existentes (usando userId como campo do Prisma)
      let userTaxes = await this.prisma.userTaxes.findUnique({
        where: { userId: userId }
      });

      // Se não existir, criar com valores padrão
      if (!userTaxes) {
        userTaxes = await this.createDefaultTaxes(userId);
      }

      // Verificar se as taxas ainda são válidas
      if (userTaxes.validUntil && new Date(userTaxes.validUntil) < new Date()) {
        // Taxas expiraram, retornar aos valores padrão
        userTaxes = await this.resetToDefaultTaxes(userId);
      }

      return userTaxes;

    } catch (error) {
      console.error('❌ Erro ao obter taxas do usuário:', error);
      throw error;
    }
  }

  /**
   * Criar taxas padrão para um usuário
   */
  async createDefaultTaxes(userId) {
    try {
      if (!this.prisma) await this.init();

      const defaultTaxes = await this.prisma.userTaxes.create({
        data: {
          userId: userId,
          depositFee: 3.0,           // R$ 3,00 taxa fixa
          withdrawFee: 1.0,          // R$ 1,00 taxa fixa
          exchangeFeePercent: 0.3,  // 0.3%
          transferFeePercent: 0.1,  // 0.1%
          gasSubsidyEnabled: false,
          gasSubsidyPercent: 0,
          isVip: false,
          vipLevel: 0
        }
      });

      console.log(`✅ Taxas padrão criadas para usuário ${userId}`);
      return defaultTaxes;

    } catch (error) {
      console.error('❌ Erro ao criar taxas padrão:', error);
      throw error;
    }
  }

  /**
   * Resetar taxas para valores padrão
   */
  async resetToDefaultTaxes(userId) {
    try {
      if (!this.prisma) await this.init();

      const updatedTaxes = await this.prisma.userTaxes.update({
        where: { userId: userId },
        data: {
          depositFee: 3.0,
          withdrawFee: 1.0,
          exchangeFeePercent: 0.3,
          transferFeePercent: 0.1,
          gasSubsidyEnabled: false,
          gasSubsidyPercent: 0,
          isVip: false,
          vipLevel: 0,
          validUntil: null
        }
      });

      console.log(`🔄 Taxas resetadas para valores padrão para usuário ${userId}`);
      return updatedTaxes;

    } catch (error) {
      console.error('❌ Erro ao resetar taxas:', error);
      throw error;
    }
  }

  /**
   * Calcular taxa de depósito
   */
  async calculateDepositFee(userId, amount) {
    try {
      const userTaxes = await this.getUserTaxes(userId);
      
      // Usar taxa fixa para depósito (campo depositFee)
      const fee = userTaxes.depositFee || 3.0; // Taxa fixa padrão R$ 3,00

      return {
        fee: parseFloat(fee.toFixed(2)),
        feeType: 'fixed', // Indicar que é taxa fixa
        // NOVA LÓGICA: valor desejado (amount) + taxa = total a pagar
        desiredAmount: amount, // O que o usuário quer receber em cBRL
        totalAmount: parseFloat((amount + fee).toFixed(2)), // Total que o usuário vai pagar
        netAmount: amount, // Valor final que vai receber em cBRL (igual ao desejado)
        grossAmount: parseFloat((amount + fee).toFixed(2)), // Total a pagar
        isVip: userTaxes.isVip,
        vipLevel: userTaxes.vipLevel
      };

    } catch (error) {
      console.error('❌ Erro ao calcular taxa de depósito:', error);
      throw error;
    }
  }

  /**
   * Calcular taxa de saque usando taxa fixa do banco
   */
  async calculateWithdrawFee(userId, amount) {
    try {
      const userTaxes = await this.getUserTaxes(userId);
      
      // Usar taxa fixa do banco de dados (campo withdrawFee)
      const fee = userTaxes.withdrawFee || 1.0; // Fallback para R$ 1,00

      return {
        fee: parseFloat(fee.toFixed(2)),
        feeType: 'fixed', // Taxa fixa, não percentual
        netAmount: parseFloat((amount - fee).toFixed(2)),
        grossAmount: amount,
        isVip: userTaxes.isVip,
        vipLevel: userTaxes.vipLevel
      };

    } catch (error) {
      console.error('❌ Erro ao calcular taxa de saque:', error);
      throw error;
    }
  }

  /**
   * Calcular taxa de exchange
   */
  async calculateExchangeFee(userId, amount) {
    try {
      const userTaxes = await this.getUserTaxes(userId);
      
      // Calcular taxa percentual
      const fee = (amount * userTaxes.exchangeFeePercent) / 100;

      return {
        fee: parseFloat(fee.toFixed(2)),
        feePercent: userTaxes.exchangeFeePercent,
        netAmount: parseFloat((amount - fee).toFixed(2)),
        grossAmount: amount,
        isVip: userTaxes.isVip,
        vipLevel: userTaxes.vipLevel
      };

    } catch (error) {
      console.error('❌ Erro ao calcular taxa de exchange:', error);
      throw error;
    }
  }

  /**
   * Calcular taxa de transferência
   */
  async calculateTransferFee(userId, amount) {
    try {
      const userTaxes = await this.getUserTaxes(userId);
      
      // Calcular taxa percentual
      const fee = (amount * userTaxes.transferFeePercent) / 100;

      return {
        fee: parseFloat(fee.toFixed(2)),
        feePercent: userTaxes.transferFeePercent,
        netAmount: parseFloat((amount - fee).toFixed(2)),
        grossAmount: amount,
        isVip: userTaxes.isVip,
        vipLevel: userTaxes.vipLevel
      };

    } catch (error) {
      console.error('❌ Erro ao calcular taxa de transferência:', error);
      throw error;
    }
  }

  /**
   * Calcular subsídio de gas
   */
  async calculateGasSubsidy(userId, gasAmount) {
    try {
      const userTaxes = await this.getUserTaxes(userId);
      
      if (!userTaxes.gasSubsidyEnabled) {
        return {
          subsidyAmount: 0,
          userPays: gasAmount,
          platformPays: 0,
          subsidyPercent: 0,
          isSubsidized: false
        };
      }

      const subsidyAmount = (gasAmount * userTaxes.gasSubsidyPercent) / 100;
      const userPays = gasAmount - subsidyAmount;

      return {
        subsidyAmount: parseFloat(subsidyAmount.toFixed(4)),
        userPays: parseFloat(userPays.toFixed(4)),
        platformPays: parseFloat(subsidyAmount.toFixed(4)),
        subsidyPercent: userTaxes.gasSubsidyPercent,
        isSubsidized: true
      };

    } catch (error) {
      console.error('❌ Erro ao calcular subsídio de gas:', error);
      throw error;
    }
  }

  /**
   * Atualizar nível VIP do usuário
   */
  async updateVipLevel(userId, vipLevel, validUntil = null) {
    try {
      if (!this.prisma) await this.init();

      const updatedTaxes = await this.prisma.userTaxes.update({
        where: { userId: userId },
        data: {
          isVip: vipLevel > 0,
          vipLevel: vipLevel,
          validUntil: validUntil,
          // Ajustar taxas baseado no nível VIP
          depositFeePercent: this.getVipDepositFee(vipLevel),
          withdrawFeePercent: this.getVipWithdrawFee(vipLevel),
          exchangeFeePercent: this.getVipExchangeFee(vipLevel),
          transferFeePercent: this.getVipTransferFee(vipLevel),
          gasSubsidyEnabled: vipLevel >= 3,
          gasSubsidyPercent: this.getVipGasSubsidy(vipLevel)
        }
      });

      console.log(`⭐ Nível VIP atualizado para ${vipLevel} para usuário ${userId}`);
      return updatedTaxes;

    } catch (error) {
      console.error('❌ Erro ao atualizar nível VIP:', error);
      throw error;
    }
  }

  /**
   * Obter taxa de depósito baseada no nível VIP
   */
  getVipDepositFee(vipLevel) {
    const fees = {
      0: 0.5,   // Normal
      1: 0.45,  // VIP 1
      2: 0.4,   // VIP 2
      3: 0.35,  // VIP 3
      4: 0.3,   // VIP 4
      5: 0.25   // VIP 5
    };
    return fees[vipLevel] || fees[0];
  }

  /**
   * Obter taxa de saque baseada no nível VIP
   */
  getVipWithdrawFee(vipLevel) {
    const fees = {
      0: 0.5,   // Normal
      1: 0.45,  // VIP 1
      2: 0.4,   // VIP 2
      3: 0.35,  // VIP 3
      4: 0.3,   // VIP 4
      5: 0.25   // VIP 5
    };
    return fees[vipLevel] || fees[0];
  }

  /**
   * Obter taxa de exchange baseada no nível VIP
   */
  getVipExchangeFee(vipLevel) {
    const fees = {
      0: 0.3,   // Normal
      1: 0.28,  // VIP 1
      2: 0.25,  // VIP 2
      3: 0.22,  // VIP 3
      4: 0.18,  // VIP 4
      5: 0.15   // VIP 5
    };
    return fees[vipLevel] || fees[0];
  }

  /**
   * Obter taxa de transferência baseada no nível VIP
   */
  getVipTransferFee(vipLevel) {
    const fees = {
      0: 0.1,   // Normal
      1: 0.09,  // VIP 1
      2: 0.08,  // VIP 2
      3: 0.06,  // VIP 3
      4: 0.04,  // VIP 4
      5: 0.02   // VIP 5
    };
    return fees[vipLevel] || fees[0];
  }

  /**
   * Obter subsídio de gas baseado no nível VIP
   */
  getVipGasSubsidy(vipLevel) {
    const subsidies = {
      0: 0,    // Normal - sem subsídio
      1: 0,    // VIP 1 - sem subsídio
      2: 0,    // VIP 2 - sem subsídio
      3: 25,   // VIP 3 - 25% subsídio
      4: 50,   // VIP 4 - 50% subsídio
      5: 100   // VIP 5 - 100% subsídio
    };
    return subsidies[vipLevel] || subsidies[0];
  }

  /**
   * Atualizar taxas customizadas para um usuário
   */
  async updateCustomTaxes(userId, customTaxes) {
    try {
      if (!this.prisma) await this.init();

      const updatedTaxes = await this.prisma.userTaxes.update({
        where: { userId: userId },
        data: customTaxes
      });

      console.log(`📝 Taxas customizadas atualizadas para usuário ${userId}`);
      return updatedTaxes;

    } catch (error) {
      console.error('❌ Erro ao atualizar taxas customizadas:', error);
      throw error;
    }
  }
}

module.exports = new UserTaxesService();