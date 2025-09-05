const prismaConfig = require('../config/prisma');
const PixValidationService = require('../services/pixValidation.service');
const pixKeyValidationService = require('../services/pixKeyValidation.service');
const pixValidationService = new PixValidationService();

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
      console.log('🔍 DEBUG: Iniciando createPixKey');
      await this.init();
      const userId = req.user.id;
      const {
        keyType,
        keyValue,
        holderName,
        holderDocument,
        isDefault = false
      } = req.body;

      console.log('📋 Dados recebidos:', { 
        userId, 
        keyType, 
        keyValue: keyValue ? keyValue.substring(0, 4) + '***' : 'N/A', 
        holderName 
      });

      // Validação básica
      if (!keyType || !keyValue) {
        return res.status(400).json({
          success: false,
          message: 'Tipo de chave e valor são obrigatórios'
        });
      }

      // Processar keyValue baseado no tipo
      let cleanKeyValue;
      switch(keyType) {
        case 'cpf':
        case 'phone':
          cleanKeyValue = keyValue.replace(/\D/g, ''); // Remove formatação para CPF e telefone
          break;
        case 'email':
        case 'random':
        default:
          cleanKeyValue = keyValue.trim(); // Manter como está para email e random
          break;
      }

      // Limpar documento (CPF) removendo formatação
      const cleanDocument = holderDocument ? holderDocument.replace(/\D/g, '') : '';

      // Verificar se a chave já existe (apenas chaves ativas)
      const existingActiveKey = await this.prisma.userPixKey.findFirst({
        where: {
          keyType,
          keyValue: cleanKeyValue,
          isActive: true
        }
      });

      if (existingActiveKey) {
        console.log('⚠️ Chave PIX ativa já existe no sistema');
        return res.status(409).json({
          success: false,
          message: 'Esta chave PIX já está cadastrada e ativa no sistema'
        });
      }

      // Verificar se existe uma chave inativa para reativar (do mesmo usuário)
      const existingInactiveKey = await this.prisma.userPixKey.findFirst({
        where: {
          userId,
          keyType,
          keyValue: cleanKeyValue,
          isActive: false
        }
      });

      if (existingInactiveKey) {
        console.log('🔄 Reativando chave PIX existente');
        
        // Se for definir como padrão, remover padrão das outras
        if (isDefault) {
          console.log('🔄 Removendo padrão das outras chaves');
          await this.prisma.userPixKey.updateMany({
            where: {
              userId,
              isActive: true,
              id: { not: existingInactiveKey.id }
            },
            data: { isDefault: false }
          });
        }

        // Reativar a chave existente com os novos dados (preservar documento se não fornecido)
        const reactivatedKey = await this.prisma.userPixKey.update({
          where: { id: existingInactiveKey.id },
          data: {
            holderName: holderName || existingInactiveKey.holderName,
            holderDocument: cleanDocument || existingInactiveKey.holderDocument,
            isActive: true,
            isDefault,
            lastVerifiedAt: new Date()
          }
        });

        console.log('✅ Chave PIX reativada com sucesso');
        return res.status(200).json({
          success: true,
          message: 'Chave PIX reativada com sucesso',
          data: {
            id: reactivatedKey.id,
            keyType: reactivatedKey.keyType,
            keyValue: this.getFormattedKey(reactivatedKey),
            keyValueRaw: reactivatedKey.keyValue,
            holderName: reactivatedKey.holderName,
            holderDocument: reactivatedKey.holderDocument,
            isVerified: reactivatedKey.isVerified,
            isActive: reactivatedKey.isActive,
            isDefault: reactivatedKey.isDefault,
            lastVerifiedAt: reactivatedKey.lastVerifiedAt,
            createdAt: reactivatedKey.createdAt,
            updatedAt: reactivatedKey.updatedAt
          }
        });
      }

      // Se for definir como padrão, remover padrão das outras
      if (isDefault) {
        console.log('🔄 Removendo padrão das outras chaves');
        await this.prisma.userPixKey.updateMany({
          where: { userId },
          data: { isDefault: false }
        });
      }

      // Criar nova chave PIX
      console.log('💾 Criando nova chave PIX no banco');
      const pixKey = await this.prisma.userPixKey.create({
        data: {
          userId,
          keyType,
          keyValue: cleanKeyValue, // Usar valor processado corretamente
          holderName: holderName || req.user.name || '',
          holderDocument: cleanDocument || req.user.cpf?.replace(/\D/g, '') || '',
          isDefault,
          isVerified: false, // Será validada posteriormente
          lastVerifiedAt: null
        }
      });

      console.log('✅ Chave PIX criada:', { id: pixKey.id, keyType: pixKey.keyType });

      // Para chave CPF, definir como validada automaticamente
      if (keyType === 'cpf') {
        console.log('🆔 Validando chave CPF automaticamente');
        
        // CPF é automaticamente validado se for igual ao CPF do usuário
        const userCpf = req.user.cpf.replace(/\D/g, '');
        const pixKeyCpf = cleanKeyValue;
        
        if (userCpf === pixKeyCpf) {
          await this.prisma.userPixKey.update({
            where: { id: pixKey.id },
            data: {
              isVerified: true,
              lastVerifiedAt: new Date()
            }
          });
          console.log('✅ Chave CPF validada automaticamente');
        } else {
          console.log('❌ CPF da chave não confere com CPF do usuário');
          return res.status(400).json({
            success: false,
            message: 'CPF da chave PIX deve ser igual ao CPF cadastrado na conta'
          });
        }
      }

      // Buscar chave atualizada
      const updatedPixKey = await this.prisma.userPixKey.findUnique({
        where: { id: pixKey.id }
      });

      console.log('🎉 Chave PIX cadastrada com sucesso:', {
        id: updatedPixKey.id,
        keyType: updatedPixKey.keyType,
        isVerified: updatedPixKey.isVerified
      });

      return res.status(201).json({
        success: true,
        data: {
          pixKey: {
            id: updatedPixKey.id,
            keyType: updatedPixKey.keyType,
            keyValue: this.getFormattedKey(updatedPixKey),
            holderName: updatedPixKey.holderName,
            holderDocument: updatedPixKey.holderDocument,
            isVerified: updatedPixKey.isVerified,
            isDefault: updatedPixKey.isDefault,
            needsValidation: !updatedPixKey.isVerified && keyType !== 'cpf'
          }
        },
        message: keyType === 'cpf' && updatedPixKey.isVerified 
          ? 'Chave PIX CPF cadastrada e validada com sucesso'
          : 'Chave PIX cadastrada com sucesso. Valide a chave para poder utilizá-la.'
      });

    } catch (error) {
      console.error('❌ Erro ao criar chave PIX:', error);
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
            holderName: updatedPixKey.holderName,
            holderDocument: updatedPixKey.holderDocument,
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

  // Verificar chave PIX com cobrança de taxa
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

      if (pixKey.isVerified) {
        return res.json({
          success: true,
          data: {
            pixKey: {
              id: pixKey.id,
              isVerified: true,
              lastVerifiedAt: pixKey.lastVerifiedAt
            }
          },
          message: 'Chave PIX já está verificada'
        });
      }

      // Usar serviço de validação com taxa
      const validationResult = await pixValidationService.validatePixKeyWithFee(
        userId, 
        pixKey.keyValue, 
        pixKey.keyType
      );

      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: validationResult.error,
          data: {
            charged: validationResult.charged,
            amount: validationResult.amount,
            requiredBalance: validationResult.requiredBalance,
            currentBalance: validationResult.currentBalance
          }
        });
      }

      // Atualizar chave PIX com resultado da validação
      if (validationResult.validated) {
        await pixValidationService.updatePixKeyAfterValidation(pixKeyId, validationResult);
      }

      // Buscar chave atualizada
      const updatedPixKey = await this.prisma.userPixKey.findUnique({
        where: { id: pixKeyId }
      });

      return res.json({
        success: true,
        data: {
          pixKey: {
            id: updatedPixKey.id,
            isVerified: updatedPixKey.isVerified,
            lastVerifiedAt: updatedPixKey.lastVerifiedAt,
            verificationData: updatedPixKey.verificationData
          },
          validation: {
            keyBelongsToUser: validationResult.keyBelongsToUser,
            charged: validationResult.charged,
            amount: validationResult.amount,
            holderData: validationResult.holderData
          }
        },
        message: validationResult.keyBelongsToUser 
          ? `Chave PIX validada com sucesso! Taxa cobrada: ${validationResult.amount} cBRL`
          : `Chave PIX não pertence ao mesmo CPF do usuário. Taxa cobrada: ${validationResult.amount} cBRL`
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

  // Helper method removed - banking info no longer stored at registration

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

  // Obter histórico de validações PIX
  async getValidationHistory(req, res) {
    try {
      const userId = req.user.id;
      const history = await pixValidationService.getValidationHistory(userId);

      return res.json({
        success: true,
        data: {
          history
        },
        message: 'Histórico de validações carregado com sucesso'
      });

    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  // Obter custos de validações
  async getValidationCosts(req, res) {
    try {
      const userId = req.user.id;
      const { days = 30 } = req.query;
      const costs = await pixValidationService.getValidationCosts(userId, parseInt(days));

      return res.json({
        success: true,
        data: {
          costs
        },
        message: 'Custos de validação calculados com sucesso'
      });

    } catch (error) {
      console.error('Erro ao calcular custos:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  // Health check do serviço de validação PIX
  async validationHealthCheck(req, res) {
    try {
      const health = await pixValidationService.healthCheck();

      return res.json({
        success: true,
        data: {
          health
        },
        message: 'Status do serviço de validação PIX'
      });

    } catch (error) {
      console.error('Erro no health check:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  // Validar chave PIX para saque (com cobrança de taxa se necessário)
  async validateForWithdraw(req, res) {
    try {
      console.log('🔍 [PixKeys] Validando chave PIX para saque');
      await this.init();
      const userId = req.user.id;
      const { pixKeyId } = req.params;

      const validationResult = await pixKeyValidationService.validatePixKeyForWithdraw(userId, pixKeyId);

      if (validationResult.success) {
        return res.json({
          success: true,
          data: {
            validated: validationResult.validated,
            charged: validationResult.charged,
            amount: validationResult.amount,
            message: validationResult.message
          }
        });
      } else {
        return res.status(400).json({
          success: false,
          message: validationResult.message
        });
      }

    } catch (error) {
      console.error('❌ [PixKeys] Erro ao validar chave para saque:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  // Verificar se chave precisa de validação paga
  async checkValidationNeeded(req, res) {
    try {
      console.log('🔍 [PixKeys] Verificando necessidade de validação');
      const userId = req.user.id;
      const { pixKeyId } = req.params;

      const checkResult = await pixKeyValidationService.needsPaidValidation(userId, pixKeyId);

      return res.json({
        success: true,
        data: checkResult
      });

    } catch (error) {
      console.error('❌ [PixKeys] Erro ao verificar validação:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }
}

module.exports = new PixKeysController();