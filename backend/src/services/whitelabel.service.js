const prismaConfig = require('../config/prisma');
const userCompanyService = require('./userCompany.service');
const emailService = require('./email.service');
const path = require('path');

class WhitelabelService {
  constructor() {
    this.prisma = null;
  }

  async init() {
    // Tentar usar a instância global do Prisma primeiro
    if (global.prisma) {
      this.prisma = global.prisma;
      console.log('✅ [WhitelabelService] Usando Prisma global');
    } else {
      // Fallback para prismaConfig.getPrisma()
      this.prisma = prismaConfig.getPrisma();
      console.log('✅ [WhitelabelService] Usando Prisma do config');
    }
  }

  /**
   * Inicia processo de login whitelabel
   * @param {string} email - Email do usuário
   * @param {string} companyId - ID da empresa
   * @returns {Promise<Object>} Resultado do processo
   */
  async initiateWhitelabelLogin(email, companyId) {
    try {
      if (!this.prisma) await this.init();

      // Buscar usuário por email
      const user = await this.prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        include: {
          userCompanies: {
            where: { companyId, status: 'active' }
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

      // Verificar se já está vinculado à empresa
      const existingLink = user.userCompanies.find(uc => uc.companyId === companyId);

      if (existingLink) {
        // Usuário já vinculado, solicitar senha
        return {
          success: true,
          action: 'request_password',
          message: 'Usuário já vinculado a esta empresa',
          data: {
            userId: user.id,
            companyId,
            requiresPassword: true
          }
        };
      }

      // Usuário existe mas não está vinculado
      return {
        success: true,
        action: 'request_link_confirmation',
        message: 'Usuário encontrado mas não vinculado a esta empresa',
        data: {
          userId: user.id,
          companyId,
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
   * Confirma vinculação de usuário aa empresa
   * @param {string} userId - ID do usuário
   * @param {string} companyId - ID da empresa
   * @param {string} password - Senha do usuário
   * @returns {Promise<Object>} Resultado da vinculação
   */
  async confirmCompanyLinking(userId, companyId, password) {
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
      const isValidPassword = userService.verifyPassword(password, user.password);

      if (!isValidPassword) {
        return {
          success: false,
          message: 'Senha incorreta'
        };
      }

      // Criar vinculação user-company se não existir
      const userCompany = await userCompanyService.createUserCompanyLink(user.id, companyId, {
        status: 'active',
        role: 'USER',
        permissions: {}
      });

      // Buscar dados da empresa para personalização
      const company = await this.prisma.company.findUnique({
        where: { id: companyId },
        include: {
          companyBrandings: true
        }
      });

      // Enviar email de confirmação de vinculação
      try {
        await emailService.sendCompanyLinkConfirmation(user.email, {
          userName: user.name,
          companyName: company.name,
          linkedAt: new Date()
        });
      } catch (emailError) {
        console.warn('⚠️ Erro ao enviar email de confirmação:', emailError.message);
      }

      return {
        success: true,
        message: 'Vinculação confirmada com sucesso',
        data: {
          userCompany,
          company: {
            id: company.id,
            name: company.name,
            branding: company.companyBrandings[0] || null
          }
        }
      };

    } catch (error) {
      console.error('❌ Erro ao confirmar vinculação:', error);
      throw error;
    }
  }

  /**
   * Autentica usuário em empresa específica
   * @param {string} email - Email do usuário
   * @param {string} password - Senha do usuário
   * @param {string} companyId - ID da empresa
   * @returns {Promise<Object>} Resultado da autenticação
   */
  async authenticateWhitelabelUser(email, password, companyId) {
    try {
      if (!this.prisma) await this.init();

      // Buscar usuário com vinculações
      const user = await this.prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        include: {
          userCompanies: {
            where: { companyId, status: 'active' },
            include: {
              company: {
                include: {
                  companyBrandings: {
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

      // Verificar se está vinculado à empresa
      const userCompany = user.userCompanies[0];
      if (!userCompany) {
        return {
          success: false,
          message: 'Usuário não vinculado a esta empresa'
        };
      }

      // Verificar senha
      const userService = require('./user.service');
      const isValidPassword = userService.verifyPassword(password, user.password);

      if (!isValidPassword) {
        return {
          success: false,
          message: 'Senha incorreta'
        };
      }

      // Atualizar última atividade
      await userCompanyService.updateLastActivity(user.id, companyId);

      // Preparar dados para retorno
      const companyData = userCompany.company;
      const branding = companyData.companyBrandings[0] || null;

      return {
        success: true,
        message: 'Autenticação realizada com sucesso',
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            isFirstAccess: user.isFirstAccess
          },
          company: {
            id: companyData.id,
            name: companyData.name,
            branding
          },
          userCompany: {
            id: userCompany.id,
            role: userCompany.role,
            canViewPrivateKeys: userCompany.canViewPrivateKeys,
            linkedAt: userCompany.linkedAt
          }
        }
      };

    } catch (error) {
      console.error('❌ Erro na autenticação whitelabel:', error);
      throw error;
    }
  }

  /**
   * Obtém configuração de branding da empresa por alias
   * @param {string} companyAlias - Alias da empresa
   * @returns {Promise<Object>} Configuração de branding
   */
  async getCompanyBrandingByAlias(companyAlias) {
    try {
      if (!this.prisma) await this.init();

      const company = await this.prisma.company.findUnique({
        where: { alias: companyAlias },
        include: {
          companyBrandings: true
        }
      });

      if (!company) {
        throw new Error('Company não encontrado');
      }

      const branding = company.companyBrandings;
      console.log('🔍 Debug branding getCompanyBrandingByAlias:', { branding, isActive: branding?.isActive });

      if (!branding || !branding.isActive) {
        console.log('🔍 Retornando branding padrão');
        // Retornar branding padrão
        return {
          company_id: company.id,
          brand_name: company.name,
          primary_color: '#3B82F6',
          secondary_color: '#1E293B',
          logo_url: '/assets/images/logo/logo.svg',
          logo_dark_url: '/assets/images/logo/logo-white.svg',
          tagline: 'Sistema de gestão de tokens e transações em blockchain'
        };
      }

      return {
        company_id: company.id,
        brand_name: company.name,
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
   * Obtém configuração de branding da empresa
   * @param {string} companyId - ID da empresa
   * @returns {Promise<Object>} Configuração de branding
   */
  async getCompanyBranding(companyId) {
    try {
      if (!this.prisma) await this.init();

      const company = await this.prisma.company.findUnique({
        where: { id: companyId },
        include: {
          companyBrandings: true
        }
      });

      if (!company) {
        throw new Error('Company não encontrado');
      }

      const branding = company.companyBrandings;

      if (!branding || !branding.isActive) {
        // Retornar branding padrão
        return {
          company: {
            id: company.id,
            name: company.name
          },
          branding: {
            primaryColor: '#007bff',
            backgroundColor: '#ffffff',
            textColor: '#333333',
            loginTitle: `Acesso ${company.name}`,
            loginSubtitle: 'Digite seu email para continuar',
            logoUrl: null,
            layoutStyle: 'default'
          }
        };
      }

      return {
        company: {
          id: company.id,
          name: company.name
        },
        branding: {
          primaryColor: branding.primaryColor,
          secondaryColor: branding.secondaryColor,
          backgroundColor: branding.backgroundColor,
          textColor: branding.textColor,
          loginTitle: branding.loginTitle || `Acesso ${company.name}`,
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
   * Obtém estatísticas de uso da empresa
   * @param {string} companyId - ID da empresa
   * @returns {Promise<Object>} Estatísticas
   */
  async getCompanyStats(companyId) {
    try {
      if (!this.prisma) await this.init();

      const [
        totalUsers,
        activeUsers,
        pendingUsers,
        recentLogins
      ] = await Promise.all([
        this.prisma.userCompany.count({
          where: { companyId }
        }),
        this.prisma.userCompany.count({
          where: { companyId, status: 'active' }
        }),
        this.prisma.userCompany.count({
          where: { companyId, status: 'pending' }
        }),
        this.prisma.userCompany.count({
          where: {
            companyId,
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

  /**
   * Verifica se usuário existe e status de vinculação com empresa
   * @param {string} email - Email do usuário
   * @param {string} companyAlias - Alias da empresa
   * @returns {Promise<Object>} Status do usuário e próxima ação
   */
  async checkUserStatus(email, companyAlias) {
    try {
      if (!this.prisma) await this.init();

      // Buscar empresa pelo alias
      const company = await this.prisma.company.findUnique({
        where: { alias: companyAlias },
        include: {
          companyBrandings: true
        }
      });

      if (!company) {
        throw new Error('Company não encontrado');
      }

      // Buscar usuário por email
      const user = await this.prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        include: {
          userCompanies: {
            where: { companyId: company.id },
            include: {
              company: true
            }
          }
        }
      });

      // Caso 1: Usuário não existe
      if (!user) {
        return {
          success: true,
          action: 'register_new_user',
          message: 'Usuário não encontrado. Será criado um novo cadastro.',
          data: {
            email,
            company: {
              id: company.id,
              name: company.name,
              alias: company.alias
            },
            branding: company.companyBrandings || null,
            requiresFullRegistration: true
          }
        };
      }

      // Verificar se já está vinculado à empresa
      const userCompany = user.userCompanies.find(uc => uc.companyId === company.id);

      // Caso 2: Usuário existe e já está vinculado à empresa
      if (userCompany) {
        return {
          success: true,
          action: 'login_existing_user',
          message: `Usuário encontrado e já vinculado ao ${company.name}. Faça login com sua senha.`,
          data: {
            userId: user.id,
            userName: user.name,
            email: user.email,
            company: {
              id: company.id,
              name: company.name,
              alias: company.alias
            },
            branding: company.companyBrandings || null,
            userCompany: {
              id: userCompany.id,
              role: userCompany.role,
              linkedAt: userCompany.linkedAt
            },
            requiresPassword: true
          }
        };
      }

      // Caso 3: Usuário existe mas não está vinculado à empresa
      return {
        success: true,
        action: 'link_existing_user',
        message: `Usuário encontrado! Deseja vincular sua conta ao ${company.name}?`,
        data: {
          userId: user.id,
          userName: user.name,
          email: user.email,
          company: {
            id: company.id,
            name: company.name,
            alias: company.alias
          },
          branding: company.companyBrandings || null,
          existingCompanies: user.userCompanies.map(uc => ({
            id: uc.company.id,
            name: uc.company.name,
            alias: uc.company.alias,
            linkedAt: uc.linkedAt
          })),
          requiresPassword: true,
          requiresLinking: true
        }
      };

    } catch (error) {
      console.error('❌ Erro ao verificar status do usuário:', error);
      throw error;
    }
  }

  /**
   * Registra novo usuário e vincula à empresa
   * @param {Object} userData - Dados do usuário
   * @param {string} companyAlias - Alias da empresa
   * @returns {Promise<Object>} Resultado do registro
   */
  async registerNewUserWithCompany(userData, companyAlias) {
    try {
      if (!this.prisma) await this.init();

      const { name, email, password } = userData;

      // Buscar empresa
      const company = await this.prisma.company.findUnique({
        where: { alias: companyAlias },
        include: {
          companyBrandings: true
        }
      });

      if (!company) {
        throw new Error('Empresa não encontrada');
      }

      // Verificar se email já existe
      const existingUser = await this.prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      });

      if (existingUser) {
        throw new Error('Este email já está em uso');
      }

      // Hash da senha
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash(password, 12);

      // Criar usuário sem CPF/chaves (será preenchido no primeiro acesso)
      const user = await this.prisma.user.create({
        data: {
          name,
          email: email.toLowerCase(),
          cpf: '00000000000', // CPF temporário será preenchido no primeiro acesso
          password: hashedPassword,
          publicKey: 'TEMP_KEY', // Chave temporária será gerada no primeiro acesso
          privateKey: 'TEMP_KEY', // Chave temporária será gerada no primeiro acesso
          isActive: false, // Inativo até confirmação do email
          isFirstAccess: true // Flag que indica necessidade de completar dados
        }
      });

      // Vincular à empresa
      const userCompany = await this.prisma.userCompany.create({
        data: {
          userId: user.id,
          companyId: company.id,
          status: 'active',
          role: 'USER',
          linkedAt: new Date()
        }
      });

      // Gerar token de confirmação
      const emailService = require('./email.service');
      const token = await emailService.generateEmailConfirmationToken(user.id, company.id);

      // Enviar email de confirmação (com bypass)
      try {
        await emailService.sendEmailConfirmation(email, {
          userName: name,
          companyName: company.name,
          companyId: company.id,
          companyAlias: company.alias,
          userId: user.id,
          token,
          baseUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
          primaryColor: company.companyBrandings?.primaryColor || '#3B82F6'
        });
      } catch (emailError) {
        console.warn('⚠️ Erro ao enviar email de confirmação:', emailError.message);
        // Não falhar o registro por erro de email
      }

      return {
        success: true,
        message: 'Usuário registrado com sucesso! Verifique seu email para ativar a conta.',
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            isActive: user.isActive
          },
          company: {
            id: company.id,
            name: company.name,
            alias: company.alias
          },
          userCompany: {
            id: userCompany.id,
            role: userCompany.role,
            linkedAt: userCompany.linkedAt
          },
          confirmationRequired: true,
          confirmationToken: token // Para desenvolvimento/debug
        }
      };

    } catch (error) {
      console.error('❌ Erro ao registrar novo usuário:', error);
      throw error;
    }
  }

  /**
   * Vincula usuário existente à nova empresa
   * @param {string} userId - ID do usuário
   * @param {string} password - Senha do usuário
   * @param {string} companyAlias - Alias da empresa
   * @returns {Promise<Object>} Resultado da vinculação
   */
  async linkExistingUserToCompany(userId, password, companyAlias) {
    try {
      console.log('🚀 [WhitelabelService] Iniciando linkExistingUserToCompany...');
      console.log('🚀 [WhitelabelService] userId:', userId);
      console.log('🚀 [WhitelabelService] companyAlias:', companyAlias);
      
      if (!this.prisma) {
        console.log('🔧 [WhitelabelService] Inicializando Prisma...');
        await this.init();
        console.log('✅ [WhitelabelService] Prisma inicializado');
      }

      // Buscar usuário
      console.log('👤 [WhitelabelService] Buscando usuário...');
      const user = await this.prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        console.log('❌ [WhitelabelService] Usuário não encontrado');
        throw new Error('Usuário não encontrado');
      }
      
      console.log('✅ [WhitelabelService] Usuário encontrado:', user.email);

      // Verificar senha
      const userService = require('./user.service');
      // Garantir que o userService esteja inicializado
      if (!userService.prisma) {
        await userService.init();
      }
      
      console.log('🔍 [WhitelabelService] Verificando senha para usuário:', user.email);
      console.log('🔍 [WhitelabelService] UserService inicializado:', !!userService.prisma);
      
      const isValidPassword = userService.verifyPassword(password, user.password);
      
      console.log('🔍 [WhitelabelService] Resultado da verificação:', isValidPassword);
      
      if (!isValidPassword) {
        console.log('❌ [WhitelabelService] Senha inválida para usuário:', user.email);
        return {
          success: false,
          message: 'Senha incorreta'
        };
      }
      
      console.log('✅ [WhitelabelService] Senha válida para usuário:', user.email);

      // Buscar empresa
      const company = await this.prisma.company.findUnique({
        where: { alias: companyAlias },
        include: {
          companyBrandings: true
        }
      });

      if (!company) {
        throw new Error('Empresa não encontrada');
      }

      // Verificar se já está vinculado
      const existingLink = await this.prisma.userCompany.findFirst({
        where: {
          userId: user.id,
          companyId: company.id
        }
      });

      if (existingLink) {
        throw new Error('Usuário já está vinculado a esta empresa');
      }

      // Criar vinculação
      const userCompany = await this.prisma.userCompany.create({
        data: {
          userId: user.id,
          companyId: company.id,
          status: 'active',
          role: 'USER',
          linkedAt: new Date()
        }
      });

      // Enviar email de notificação (com bypass)
      try {
        const emailService = require('./email.service');
        await emailService.sendNewCompanyNotification(user.email, {
          userName: user.name,
          companyName: company.name,
          companyId: company.id,
          companyAlias: company.alias,
          userId: user.id,
          linkedAt: new Date(),
          baseUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
          primaryColor: company.companyBrandings?.primaryColor || '#3B82F6'
        });
      } catch (emailError) {
        console.warn('⚠️ Erro ao enviar notificação de nova empresa:', emailError.message);
        // Não falhar a vinculação por erro de email
      }

      return {
        success: true,
        message: `Sua conta foi vinculada com sucesso ao ${company.name}!`,
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email
          },
          company: {
            id: company.id,
            name: company.name,
            alias: company.alias
          },
          userCompany: {
            id: userCompany.id,
            role: userCompany.role,
            linkedAt: userCompany.linkedAt
          }
        }
      };

    } catch (error) {
      console.error('❌ Erro ao vincular usuário existente:', error);
      throw error;
    }
  }

  /**
   * Completa dados do primeiro acesso do usuário
   * @param {Object} data - Dados para completar
   * @returns {Promise<Object>} Resultado da operação
   */
  async completeFirstAccess(data) {
    try {
      if (!this.prisma) await this.init();

      const { userId, cpf, phone, birthDate } = data;

      // Buscar usuário com sua empresa
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          userCompanies: {
            include: {
              company: true
            }
          }
        }
      });

      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      if (!user.isFirstAccess) {
        throw new Error('Usuário já completou os dados de primeiro acesso');
      }

      // Obter a empresa principal do usuário
      const userCompany = user.userCompanies?.find(uc => uc.isPrimary) || user.userCompanies?.[0];
      if (!userCompany?.company) {
        throw new Error('Usuário não está vinculado a nenhuma empresa');
      }

      const company = userCompany.company;

      // Verificar se CPF já está em uso por outro usuário
      const existingUserWithCpf = await this.prisma.user.findFirst({
        where: { 
          cpf,
          id: { not: userId }
        }
      });

      if (existingUserWithCpf) {
        throw new Error('Este CPF já está em uso por outro usuário');
      }

      // Gerar chaves Ethereum
      const userService = require('./user.service');
      const { publicKey, privateKey } = userService.generateKeyPair();

      console.log('🔑 Chaves geradas:', {
        publicKey,
        privateKey: privateKey.substring(0, 10) + '...' // Log parcial por segurança
      });

      // Atualizar usuário com os dados completos
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: {
          cpf,
          phone,
          birthDate: new Date(birthDate),
          publicKey,
          privateKey,
          isFirstAccess: false, // Marcar como não sendo mais primeiro acesso
          isActive: true // Ativar usuário completamente
        }
      });

      // Enviar email de boas-vindas (com bypass para desenvolvimento)
      try {
        const emailService = require('./email.service');
        const template = await emailService.getTemplate('welcome_message');
        await emailService.sendEmail({
          templateId: template.id,
          toEmail: user.email,
          toName: user.name,
          subject: template.subject.replace('{{companyName}}', company.name),
          htmlContent: emailService.replaceTemplateVariables(template.htmlContent, {
            userName: user.name,
            companyName: company.name,
            publicKey,
            year: new Date().getFullYear()
          }),
          textContent: emailService.replaceTemplateVariables(template.textContent || '', {
            userName: user.name,
            companyName: company.name,
            publicKey
          }),
          tags: ['welcome', 'first_access'],
          metadata: {
            companyId: company.id,
            companyAlias: company.alias,
            userId: user.id
          }
        });
      } catch (emailError) {
        console.warn('⚠️ Erro ao enviar email de boas-vindas:', emailError.message);
        // Não falhar a operação por erro de email
      }

      return {
        success: true,
        message: 'Dados completados com sucesso! Suas chaves blockchain foram geradas.',
        data: {
          user: {
            id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            cpf: updatedUser.cpf,
            phone: updatedUser.phone,
            birthDate: updatedUser.birthDate,
            isFirstAccess: updatedUser.isFirstAccess,
            isActive: updatedUser.isActive
          },
          keys: {
            publicKey: updatedUser.publicKey,
            // Não retornar chave privada na resposta por segurança
          },
          company: {
            id: company.id,
            name: company.name,
            alias: company.alias
          }
        }
      };

    } catch (error) {
      console.error('❌ Erro ao completar primeiro acesso:', error);
      throw error;
    }
  }
}

module.exports = new WhitelabelService();

