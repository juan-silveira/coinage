const prismaConfig = require('../config/prisma');

class PixKeysController {
  constructor() {
    this.prisma = null;
  }

  async init() {
    if (!this.prisma) {
      this.prisma = prismaConfig.getPrisma();
    }
  }

  // Listar chaves PIX do usuário
  async getUserPixKeys(req, res) {
    try {
      await this.init();
      const userId = req.user.id;

      const pixKeys = await this.prisma.userPixKey.findMany({
        where: { 
          userId,
          isActive: true
        },
        include: {
          user: {
            select: { id: true, name: true, email: true, cpf: true }
          }
        },
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }]
      });

      return res.json({
        success: true,
        data: {
          pixKeys: pixKeys.map(key => ({
            id: key.id,
            keyType: key.keyType,
            keyValue: this.getFormattedKey(key),
            keyValueRaw: key.keyValue,
            bankCode: key.bankCode,
            bankName: key.bankName,
            bankLogo: key.bankLogo,
            accountDisplay: this.getAccountDisplay(key),
            agency: key.agency,
            agencyDigit: key.agencyDigit,
            accountNumber: key.accountNumber,
            accountDigit: key.accountDigit,
            accountType: key.accountType,
            holderName: key.holderName,
            holderDocument: key.holderDocument,
            isVerified: key.isVerified,
            isActive: key.isActive,
            isDefault: key.isDefault,
            lastVerifiedAt: key.lastVerifiedAt,
            createdAt: key.createdAt,
            updatedAt: key.updatedAt
          }))
        },
        message: 'Chaves PIX carregadas com sucesso'
      });

    } catch (error) {
      console.error('Erro ao buscar chaves PIX:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  // Criar nova chave PIX
  async createPixKey(req, res) {
    try {
      await this.init();
      const userId = req.user.id;
      const {
        keyType,
        keyValue,
        bankCode,
        bankName,
        bankLogo,
        agency,
        agencyDigit,
        accountNumber,
        accountDigit,
        accountType,
        holderName,
        holderDocument,
        isDefault = false
      } = req.body;

      // Validação básica
      if (!keyType || !keyValue || !bankCode || !bankName || !agency || !accountNumber || !accountDigit || !holderName || !holderDocument) {
        return res.status(400).json({
          success: false,
          message: 'Dados obrigatórios não fornecidos'
        });
      }

      // Verificar se a chave já existe
      const existingKey = await this.prisma.userPixKey.findFirst({
        where: {
          keyType,
          keyValue: keyValue.replace(/\D/g, '') // Remove formatação para comparação
        }
      });

      if (existingKey) {
        return res.status(409).json({
          success: false,
          message: 'Esta chave PIX já está cadastrada no sistema'
        });
      }

      // Se for definir como padrão, remover padrão das outras
      if (isDefault) {
        await this.prisma.userPixKey.updateMany({
          where: { userId },
          data: { isDefault: false }
        });
      }

      // Criar nova chave PIX
      const pixKey = await this.prisma.userPixKey.create({
        data: {
          userId,
          keyType,
          keyValue: keyValue.replace(/\D/g, ''), // Armazenar sem formatação
          bankCode,
          bankName,
          bankLogo,
          agency,
          agencyDigit,
          accountNumber,
          accountDigit,
          accountType,
          holderName,
          holderDocument,
          isDefault,
          isVerified: keyType === 'cpf', // CPF é automaticamente verificado
          lastVerifiedAt: keyType === 'cpf' ? new Date() : null
        }
      });

      return res.status(201).json({
        success: true,
        data: {
          pixKey: {
            id: pixKey.id,
            keyType: pixKey.keyType,
            keyValue: this.getFormattedKey(pixKey),
            bankName: pixKey.bankName,
            accountDisplay: this.getAccountDisplay(pixKey),
            isVerified: pixKey.isVerified,
            isDefault: pixKey.isDefault
          }
        },
        message: 'Chave PIX cadastrada com sucesso'
      });

    } catch (error) {
      console.error('Erro ao criar chave PIX:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  // Atualizar chave PIX
  async updatePixKey(req, res) {
    try {
      await this.init();
      const userId = req.user.id;
      const { pixKeyId } = req.params;
      const updateData = req.body;

      const pixKey = await this.prisma.userPixKey.findFirst({
        where: { 
          id: pixKeyId, 
          userId 
        }
      });

      if (!pixKey) {
        return res.status(404).json({
          success: false,
          message: 'Chave PIX não encontrada'
        });
      }

      // Se estiver definindo como padrão
      if (updateData.isDefault && !pixKey.isDefault) {
        await this.setAsDefault(pixKeyId, userId);
      }

      // Atualizar outros campos
      const updatedPixKey = await this.prisma.userPixKey.update({
        where: { id: pixKeyId },
        data: updateData
      });

      return res.json({
        success: true,
        data: {
          pixKey: {
            id: updatedPixKey.id,
            keyType: updatedPixKey.keyType,
            keyValue: this.getFormattedKey(updatedPixKey),
            bankName: updatedPixKey.bankName,
            accountDisplay: this.getAccountDisplay(updatedPixKey),
            isVerified: updatedPixKey.isVerified,
            isDefault: updatedPixKey.isDefault
          }
        },
        message: 'Chave PIX atualizada com sucesso'
      });

    } catch (error) {
      console.error('Erro ao atualizar chave PIX:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  // Excluir chave PIX
  async deletePixKey(req, res) {
    try {
      await this.init();
      const userId = req.user.id;
      const { pixKeyId } = req.params;

      const pixKey = await this.prisma.userPixKey.findFirst({
        where: { 
          id: pixKeyId, 
          userId 
        }
      });

      if (!pixKey) {
        return res.status(404).json({
          success: false,
          message: 'Chave PIX não encontrada'
        });
      }

      // Se era a chave padrão, definir outra como padrão
      if (pixKey.isDefault) {
        const otherKey = await this.prisma.userPixKey.findFirst({
          where: { 
            userId,
            id: { not: pixKeyId },
            isActive: true
          },
          orderBy: { createdAt: 'asc' }
        });

        if (otherKey) {
          await this.prisma.userPixKey.update({
            where: { id: otherKey.id },
            data: { isDefault: true }
          });
        }
      }

      await this.prisma.userPixKey.update({
        where: { id: pixKeyId },
        data: { isActive: false }
      });

      return res.json({
        success: true,
        message: 'Chave PIX removida com sucesso'
      });

    } catch (error) {
      console.error('Erro ao excluir chave PIX:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  // Definir chave como padrão
  async setDefaultPixKey(req, res) {
    try {
      await this.init();
      const userId = req.user.id;
      const { pixKeyId } = req.params;

      const pixKey = await this.prisma.userPixKey.findFirst({
        where: { 
          id: pixKeyId, 
          userId,
          isActive: true
        }
      });

      if (!pixKey) {
        return res.status(404).json({
          success: false,
          message: 'Chave PIX não encontrada'
        });
      }

      await this.setAsDefault(pixKeyId, userId);

      return res.json({
        success: true,
        message: 'Chave PIX definida como padrão'
      });

    } catch (error) {
      console.error('Erro ao definir chave padrão:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  // Verificar chave PIX (simulado)
  async verifyPixKey(req, res) {
    try {
      await this.init();
      const userId = req.user.id;
      const { pixKeyId } = req.params;

      const pixKey = await this.prisma.userPixKey.findFirst({
        where: { 
          id: pixKeyId, 
          userId 
        }
      });

      if (!pixKey) {
        return res.status(404).json({
          success: false,
          message: 'Chave PIX não encontrada'
        });
      }

      // Simular verificação (em produção, usar API do Banco Central)
      const verificationData = {
        verified: true,
        verifiedAt: new Date(),
        holderMatches: true,
        accountActive: true
      };

      await this.prisma.userPixKey.update({
        where: { id: pixKeyId },
        data: {
          isVerified: true,
          verificationData,
          lastVerifiedAt: new Date()
        }
      });

      return res.json({
        success: true,
        data: {
          verification: verificationData
        },
        message: 'Chave PIX verificada com sucesso'
      });

    } catch (error) {
      console.error('Erro ao verificar chave PIX:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  // Métodos helper
  getFormattedKey(pixKey) {
    switch(pixKey.keyType) {
      case 'cpf':
        return pixKey.keyValue.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
      case 'phone':
        const digits = pixKey.keyValue.replace(/\D/g, '');
        if (digits.length === 11) {
          return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        } else {
          return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
        }
      default:
        return pixKey.keyValue;
    }
  }

  getAccountDisplay(pixKey) {
    const agency = pixKey.agencyDigit 
      ? `${pixKey.agency}-${pixKey.agencyDigit}`
      : pixKey.agency;
    
    const account = `${pixKey.accountNumber}-${pixKey.accountDigit}`;
    
    const typeMap = {
      'corrente': 'Conta corrente',
      'poupanca': 'Conta poupança',
      'pagamentos': 'Conta de pagamentos',
      'salario': 'Conta salário'
    };

    return {
      agency,
      account,
      type: typeMap[pixKey.accountType] || 'Conta corrente'
    };
  }

  async setAsDefault(pixKeyId, userId) {
    await this.init();
    
    try {
      // Remove o padrão de todas as chaves do usuário
      await this.prisma.userPixKey.updateMany({
        where: { userId },
        data: { isDefault: false }
      });

      // Define a nova chave como padrão
      await this.prisma.userPixKey.update({
        where: { id: pixKeyId, userId },
        data: { isDefault: true }
      });

      return true;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new PixKeysController();