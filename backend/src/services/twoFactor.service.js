const prismaConfig = require('../config/prisma');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const crypto = require('crypto');
const emailService = require('./email.service');

class TwoFactorService {
  constructor() {
    this.prisma = null;
  }

  async init() {
    this.prisma = prismaConfig.getPrisma();
  }

  /**
   * Gera secret para TOTP
   * @param {string} userId - ID do usuário
   * @param {string} userEmail - Email do usuário
   * @returns {Promise<Object>} Dados do TOTP
   */
  async generateTOTPSecret(userId, userEmail) {
    try {
      if (!this.prisma) await this.init();

      // Gerar secret
      const secret = speakeasy.generateSecret({
        name: `Coinage (${userEmail})`,
        issuer: 'Coinage',
        length: 32
      });

      // Criar ou atualizar registro de 2FA
      const twoFactor = await this.prisma.userTwoFactor.upsert({
        where: {
          userId_type: {
            userId,
            type: 'totp'
          }
        },
        update: {
          secret: secret.base32,
          isActive: false,
          isVerified: false,
          setupCompletedAt: null
        },
        create: {
          userId,
          type: 'totp',
          secret: secret.base32,
          isActive: false,
          isVerified: false
        }
      });

      // Gerar QR Code
      const qrCodeDataURL = await qrcode.toDataURL(secret.otpauth_url);

      return {
        secret: secret.base32,
        qrCode: qrCodeDataURL,
        manualEntryKey: secret.base32,
        id: twoFactor.id
      };

    } catch (error) {
      console.error('❌ Erro ao gerar secret TOTP:', error);
      throw error;
    }
  }

  /**
   * Verifica e ativa TOTP
   * @param {string} userId - ID do usuário
   * @param {string} token - Token TOTP fornecido
   * @returns {Promise<Object>} Resultado da verificação
   */
  async verifyAndActivateTOTP(userId, token) {
    try {
      if (!this.prisma) await this.init();

      const twoFactor = await this.prisma.userTwoFactor.findUnique({
        where: {
          userId_type: {
            userId,
            type: 'totp'
          }
        }
      });

      if (!twoFactor || !twoFactor.secret) {
        throw new Error('TOTP não configurado para este usuário');
      }

      // Verificar token
      const verified = speakeasy.totp.verify({
        secret: twoFactor.secret,
        encoding: 'base32',
        token,
        window: 2 // Permite uma janela de tolerância
      });

      if (!verified) {
        return {
          success: false,
          message: 'Código inválido'
        };
      }

      // Gerar códigos de backup
      const backupCodes = this.generateBackupCodes();

      // Ativar TOTP
      const activatedTwoFactor = await this.prisma.userTwoFactor.update({
        where: { id: twoFactor.id },
        data: {
          isActive: true,
          isVerified: true,
          setupCompletedAt: new Date(),
          backupCodes: backupCodes.map(code => ({ code, used: false })),
          lastUsedAt: new Date()
        }
      });

      return {
        success: true,
        message: 'TOTP ativado com sucesso',
        backupCodes
      };

    } catch (error) {
      console.error('❌ Erro ao verificar TOTP:', error);
      throw error;
    }
  }

  /**
   * Verifica token TOTP para login
   * @param {string} userId - ID do usuário
   * @param {string} token - Token fornecido
   * @returns {Promise<boolean>} Se o token é válido
   */
  async verifyTOTP(userId, token) {
    try {
      if (!this.prisma) await this.init();

      const twoFactor = await this.prisma.userTwoFactor.findUnique({
        where: {
          userId_type: {
            userId,
            type: 'totp'
          }
        }
      });

      if (!twoFactor || !twoFactor.isActive || !twoFactor.secret) {
        return false;
      }

      // Verificar se está bloqueado
      if (twoFactor.lockedUntil && new Date() < twoFactor.lockedUntil) {
        throw new Error('2FA temporariamente bloqueado devido a muitas tentativas inválidas');
      }

      // Verificar token
      const verified = speakeasy.totp.verify({
        secret: twoFactor.secret,
        encoding: 'base32',
        token,
        window: 2
      });

      if (verified) {
        // Reset failed attempts e atualizar último uso
        await this.prisma.userTwoFactor.update({
          where: { id: twoFactor.id },
          data: {
            failedAttempts: 0,
            lockedUntil: null,
            lastUsedAt: new Date()
          }
        });
        return true;
      } else {
        // Incrementar failed attempts
        const failedAttempts = twoFactor.failedAttempts + 1;
        const lockedUntil = failedAttempts >= 5 
          ? new Date(Date.now() + 30 * 60 * 1000) // 30 minutos
          : null;

        await this.prisma.userTwoFactor.update({
          where: { id: twoFactor.id },
          data: {
            failedAttempts,
            lockedUntil
          }
        });

        return false;
      }

    } catch (error) {
      console.error('❌ Erro ao verificar TOTP:', error);
      throw error;
    }
  }

  /**
   * Configura 2FA por email
   * @param {string} userId - ID do usuário
   * @param {string} email - Email do usuário
   * @returns {Promise<Object>} Configuração criada
   */
  async setupEmailTwoFactor(userId, email) {
    try {
      if (!this.prisma) await this.init();

      const twoFactor = await this.prisma.userTwoFactor.upsert({
        where: {
          userId_type: {
            userId,
            type: 'email'
          }
        },
        update: {
          email,
          isActive: true,
          isVerified: true,
          setupCompletedAt: new Date()
        },
        create: {
          userId,
          type: 'email',
          email,
          isActive: true,
          isVerified: true,
          setupCompletedAt: new Date()
        }
      });

      return twoFactor;

    } catch (error) {
      console.error('❌ Erro ao configurar 2FA por email:', error);
      throw error;
    }
  }

  /**
   * Envia código 2FA por email
   * @param {string} userId - ID do usuário
   * @returns {Promise<Object>} Resultado do envio
   */
  async sendEmailTwoFactorCode(userId) {
    try {
      if (!this.prisma) await this.init();

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          userTwoFactors: {
            where: { type: 'email', isActive: true }
          }
        }
      });

      if (!user || !user.userTwoFactors[0]) {
        throw new Error('2FA por email não configurado');
      }

      const twoFactor = user.userTwoFactors[0];

      // Gerar código de 6 dígitos
      const code = crypto.randomInt(100000, 999999).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

      // Salvar código temporariamente
      await this.prisma.userTwoFactor.update({
        where: { id: twoFactor.id },
        data: {
          settings: {
            tempCode: code,
            tempCodeExpiresAt: expiresAt.toISOString()
          }
        }
      });

      // Enviar email
      await emailService.send2FACode(twoFactor.email || user.email, {
        userName: user.name,
        code,
        expiresIn: '10 minutos',
        expiresInMs: 10 * 60 * 1000
      });

      return {
        success: true,
        message: 'Código enviado por email',
        expiresAt
      };

    } catch (error) {
      console.error('❌ Erro ao enviar código 2FA:', error);
      throw error;
    }
  }

  /**
   * Verifica código 2FA enviado por email
   * @param {string} userId - ID do usuário
   * @param {string} code - Código fornecido
   * @returns {Promise<boolean>} Se o código é válido
   */
  async verifyEmailTwoFactorCode(userId, code) {
    try {
      if (!this.prisma) await this.init();

      const twoFactor = await this.prisma.userTwoFactor.findUnique({
        where: {
          userId_type: {
            userId,
            type: 'email'
          }
        }
      });

      if (!twoFactor || !twoFactor.isActive) {
        return false;
      }

      const settings = twoFactor.settings || {};
      const tempCode = settings.tempCode;
      const tempCodeExpiresAt = settings.tempCodeExpiresAt 
        ? new Date(settings.tempCodeExpiresAt) 
        : null;

      if (!tempCode || !tempCodeExpiresAt || new Date() > tempCodeExpiresAt) {
        return false;
      }

      if (tempCode === code) {
        // Limpar código temporário
        await this.prisma.userTwoFactor.update({
          where: { id: twoFactor.id },
          data: {
            settings: {},
            lastUsedAt: new Date(),
            failedAttempts: 0
          }
        });
        return true;
      } else {
        // Incrementar failed attempts
        await this.prisma.userTwoFactor.update({
          where: { id: twoFactor.id },
          data: {
            failedAttempts: { increment: 1 }
          }
        });
        return false;
      }

    } catch (error) {
      console.error('❌ Erro ao verificar código 2FA por email:', error);
      throw error;
    }
  }

  /**
   * Verifica código de backup
   * @param {string} userId - ID do usuário
   * @param {string} backupCode - Código de backup
   * @returns {Promise<boolean>} Se o código é válido
   */
  async verifyBackupCode(userId, backupCode) {
    try {
      if (!this.prisma) await this.init();

      const twoFactor = await this.prisma.userTwoFactor.findFirst({
        where: {
          userId,
          isActive: true,
          backupCodes: {
            path: '$[*].code',
            array_contains: [backupCode]
          }
        }
      });

      if (!twoFactor) {
        return false;
      }

      const backupCodes = twoFactor.backupCodes || [];
      const codeIndex = backupCodes.findIndex(bc => bc.code === backupCode && !bc.used);

      if (codeIndex === -1) {
        return false;
      }

      // Marcar código como usado
      backupCodes[codeIndex].used = true;
      backupCodes[codeIndex].usedAt = new Date().toISOString();

      await this.prisma.userTwoFactor.update({
        where: { id: twoFactor.id },
        data: {
          backupCodes,
          usedBackupCodes: {
            push: backupCode
          },
          lastUsedAt: new Date()
        }
      });

      return true;

    } catch (error) {
      console.error('❌ Erro ao verificar código de backup:', error);
      throw error;
    }
  }

  /**
   * Gera códigos de backup
   * @returns {Array<string>} Lista de códigos
   */
  generateBackupCodes() {
    const codes = [];
    for (let i = 0; i < 10; i++) {
      // Gerar código de 8 caracteres (letras e números)
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  /**
   * Lista métodos 2FA ativos de um usuário
   * @param {string} userId - ID do usuário
   * @returns {Promise<Array>} Lista de métodos 2FA
   */
  async getUserTwoFactorMethods(userId) {
    try {
      if (!this.prisma) await this.init();

      const methods = await this.prisma.userTwoFactor.findMany({
        where: {
          userId,
          isActive: true
        },
        select: {
          id: true,
          type: true,
          isVerified: true,
          setupCompletedAt: true,
          lastUsedAt: true,
          phoneNumber: true,
          email: true
        }
      });

      return methods;

    } catch (error) {
      console.error('❌ Erro ao listar métodos 2FA:', error);
      throw error;
    }
  }

  /**
   * Desativa método 2FA
   * @param {string} userId - ID do usuário
   * @param {string} type - Tipo do 2FA
   * @returns {Promise<Object>} Método desativado
   */
  async disableTwoFactor(userId, type) {
    try {
      if (!this.prisma) await this.init();

      const twoFactor = await this.prisma.userTwoFactor.update({
        where: {
          userId_type: {
            userId,
            type
          }
        },
        data: {
          isActive: false,
          deletedAt: new Date()
        }
      });

      return twoFactor;

    } catch (error) {
      console.error('❌ Erro ao desativar 2FA:', error);
      throw error;
    }
  }

  /**
   * Verifica se usuário tem 2FA ativo
   * @param {string} userId - ID do usuário
   * @returns {Promise<boolean>} Se tem 2FA ativo
   */
  async userHasTwoFactor(userId) {
    try {
      if (!this.prisma) await this.init();

      const count = await this.prisma.userTwoFactor.count({
        where: {
          userId,
          isActive: true,
          isVerified: true
        }
      });

      return count > 0;

    } catch (error) {
      console.error('❌ Erro ao verificar 2FA:', error);
      return false;
    }
  }
}

module.exports = new TwoFactorService();