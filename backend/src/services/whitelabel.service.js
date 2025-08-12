const prismaConfig = require('../config/prisma');
const userClientService = require('./userClient.service');
const emailService = require('./email.service');
const path = require('path');

class WhitelabelService {
  constructor() {
    this.prisma = null;
  }

  async init() {
    this.prisma = prismaConfig.getPrisma();
  }

  /**
   * Inicia processo de login whitelabel
   * @param {string} email - Email do usuário
   * @param {string} clientId - ID do cliente
   * @returns {Promise<Object>} Resultado do processo
   */
  async initiateWhitelabelLogin(email, clientId) {
    try {
      if (!this.prisma) await this.init();

      // Buscar usuário por email
      const user = await this.prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        include: {
          userClients: {
            where: { clientId, status: 'active' }
          }
        }
      });

      if (!user) {
        return {
          success: false,
          action: 'user_not_found',
          message: 'Usuário não encontrado'
        };
      }

      if (!user.isActive) {
        return {
          success: false,
          action: 'user_inactive',
          message: 'Usuário inativo'
        };
      }

      // Verificar se já está vinculado ao cliente
      const existingLink = user.userClients.find(uc => uc.clientId === clientId);

      if (existingLink) {
        // Usuário já vinculado, solicitar senha
        return {
          success: true,
          action: 'request_password',
          message: 'Usuário já vinculado a este cliente',
          data: {
            userId: user.id,
            clientId,
            requiresPassword: true
          }
        };
      }

      // Usuário existe mas não está vinculado
      return {
        success: true,
        action: 'request_link_confirmation',
        message: 'Usuário encontrado mas não vinculado a este cliente',
        data: {
          userId: user.id,
          clientId,
          userName: user.name,
          requiresLinking: true
        }
      };

    } catch (error) {
      console.error('❌ Erro ao iniciar login whitelabel:', error);
      throw error;
    }
  }

  /**
   * Confirma vinculação de usuário ao cliente
   * @param {string} userId - ID do usuário
   * @param {string} clientId - ID do cliente
   * @param {string} password - Senha do usuário
   * @returns {Promise<Object>} Resultado da vinculação
   */
  async confirmClientLinking(userId, clientId, password) {
    try {
      if (!this.prisma) await this.init();

      // Verificar senha do usuário
      const user = await this.prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      const userService = require('./user.service');
      const isValidPassword = await userService.verifyPassword(password, user.password, user.email);

      if (!isValidPassword) {
        return {
          success: false,
          message: 'Senha incorreta'
        };
      }

      // Criar vinculação
      const userClient = await userClientService.linkUserToClient(userId, clientId, {
        clientRole: 'USER',
        autoApprove: true,
        approvedBy: userId // Auto-aprovação
      });

      // Buscar dados do cliente para personalização
      const client = await this.prisma.client.findUnique({
        where: { id: clientId },
        include: {
          clientBrandings: {
            where: { isActive: true }
          }
        }
      });

      // Enviar email de confirmação de vinculação
      try {
        await emailService.sendClientLinkConfirmation(user.email, {
          userName: user.name,
          clientName: client.name,
          linkedAt: new Date()
        });
      } catch (emailError) {
        console.warn('⚠️ Erro ao enviar email de confirmação:', emailError.message);
      }

      return {
        success: true,
        message: 'Vinculação confirmada com sucesso',
        data: {
          userClient,
          client: {
            id: client.id,
            name: client.name,
            branding: client.clientBrandings[0] || null
          }
        }
      };

    } catch (error) {
      console.error('❌ Erro ao confirmar vinculação:', error);
      throw error;
    }
  }

  /**
   * Autentica usuário em cliente específico
   * @param {string} email - Email do usuário
   * @param {string} password - Senha do usuário
   * @param {string} clientId - ID do cliente
   * @returns {Promise<Object>} Resultado da autenticação
   */
  async authenticateWhitelabelUser(email, password, clientId) {
    try {
      if (!this.prisma) await this.init();

      // Buscar usuário com vinculações
      const user = await this.prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        include: {
          userClients: {
            where: { clientId, status: 'active' },
            include: {
              client: {
                include: {
                  clientBrandings: {
                    where: { isActive: true }
                  }
                }
              }
            }
          }
        }
      });

      if (!user || !user.isActive) {
        return {
          success: false,
          message: 'Usuário não encontrado ou inativo'
        };
      }

      // Verificar se está vinculado ao cliente
      const userClient = user.userClients[0];
      if (!userClient) {
        return {
          success: false,
          message: 'Usuário não vinculado a este cliente'
        };
      }

      // Verificar senha
      const userService = require('./user.service');
      const isValidPassword = await userService.verifyPassword(password, user.password, user.email);

      if (!isValidPassword) {
        return {
          success: false,
          message: 'Senha incorreta'
        };
      }

      // Atualizar última atividade
      await userClientService.updateLastActivity(user.id, clientId);

      // Preparar dados para retorno
      const clientData = userClient.client;
      const branding = clientData.clientBrandings[0] || null;

      return {
        success: true,
        message: 'Autenticação realizada com sucesso',
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            globalRole: user.globalRole,
            isFirstAccess: user.isFirstAccess
          },
          client: {
            id: clientData.id,
            name: clientData.name,
            branding
          },
          userClient: {
            id: userClient.id,
            clientRole: userClient.clientRole,
            canViewPrivateKeys: userClient.canViewPrivateKeys,
            linkedAt: userClient.linkedAt
          }
        }
      };

    } catch (error) {
      console.error('❌ Erro na autenticação whitelabel:', error);
      throw error;
    }
  }

  /**
   * Obtém configuração de branding do cliente por alias
   * @param {string} clientAlias - Alias do cliente
   * @returns {Promise<Object>} Configuração de branding
   */
  async getClientBrandingByAlias(clientAlias) {
    try {
      if (!this.prisma) await this.init();

      const client = await this.prisma.client.findUnique({
        where: { alias: clientAlias },
        include: {
          clientBrandings: {
            where: { isActive: true }
          }
        }
      });

      if (!client) {
        throw new Error('Cliente não encontrado');
      }

      const branding = client.clientBrandings[0];

      if (!branding) {
        // Retornar branding padrão
        return {
          brand_name: client.name,
          primary_color: '#3B82F6',
          secondary_color: '#1E293B',
          logo_url: '/assets/images/logo/logo.svg',
          logo_dark_url: '/assets/images/logo/logo-white.svg',
          tagline: 'Sistema de gestão de tokens e transações em blockchain'
        };
      }

      return {
        brand_name: client.name,
        primary_color: branding.primaryColor,
        secondary_color: branding.secondaryColor,
        logo_url: branding.logoUrl || '/assets/images/logo/logo.svg',
        logo_dark_url: branding.logoUrlDark || '/assets/images/logo/logo-white.svg',
        tagline: branding.loginSubtitle || branding.welcomeMessage || 'Sistema de gestão de tokens e transações em blockchain'
      };

    } catch (error) {
      console.error('❌ Erro ao obter branding por alias:', error);
      throw error;
    }
  }

  /**
   * Obtém configuração de branding do cliente
   * @param {string} clientId - ID do cliente
   * @returns {Promise<Object>} Configuração de branding
   */
  async getClientBranding(clientId) {
    try {
      if (!this.prisma) await this.init();

      const client = await this.prisma.client.findUnique({
        where: { id: clientId },
        include: {
          clientBrandings: {
            where: { isActive: true }
          }
        }
      });

      if (!client) {
        throw new Error('Cliente não encontrado');
      }

      const branding = client.clientBrandings[0];

      if (!branding) {
        // Retornar branding padrão
        return {
          client: {
            id: client.id,
            name: client.name
          },
          branding: {
            primaryColor: '#007bff',
            backgroundColor: '#ffffff',
            textColor: '#333333',
            loginTitle: `Acesso ${client.name}`,
            loginSubtitle: 'Digite seu email para continuar',
            logoUrl: null,
            layoutStyle: 'default'
          }
        };
      }

      return {
        client: {
          id: client.id,
          name: client.name
        },
        branding: {
          primaryColor: branding.primaryColor,
          secondaryColor: branding.secondaryColor,
          backgroundColor: branding.backgroundColor,
          textColor: branding.textColor,
          loginTitle: branding.loginTitle || `Acesso ${client.name}`,
          loginSubtitle: branding.loginSubtitle || 'Digite seu email para continuar',
          logoUrl: branding.logoUrl,
          logoUrlDark: branding.logoUrlDark,
          backgroundImageUrl: branding.backgroundImageUrl,
          layoutStyle: branding.layoutStyle,
          borderRadius: branding.borderRadius,
          fontFamily: branding.fontFamily,
          fontSize: branding.fontSize,
          customCss: branding.customCss
        }
      };

    } catch (error) {
      console.error('❌ Erro ao obter branding:', error);
      throw error;
    }
  }

  /**
   * Obtém estatísticas de uso do cliente
   * @param {string} clientId - ID do cliente
   * @returns {Promise<Object>} Estatísticas
   */
  async getClientStats(clientId) {
    try {
      if (!this.prisma) await this.init();

      const [
        totalUsers,
        activeUsers,
        pendingUsers,
        recentLogins
      ] = await Promise.all([
        this.prisma.userClient.count({
          where: { clientId }
        }),
        this.prisma.userClient.count({
          where: { clientId, status: 'active' }
        }),
        this.prisma.userClient.count({
          where: { clientId, status: 'pending' }
        }),
        this.prisma.userClient.count({
          where: {
            clientId,
            status: 'active',
            lastAccessAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Últimos 30 dias
            }
          }
        })
      ]);

      return {
        totalUsers,
        activeUsers,
        pendingUsers,
        recentLogins,
        conversionRate: totalUsers > 0 ? (activeUsers / totalUsers * 100).toFixed(2) : 0
      };

    } catch (error) {
      console.error('❌ Erro ao obter estatísticas:', error);
      throw error;
    }
  }
}

module.exports = new WhitelabelService();

