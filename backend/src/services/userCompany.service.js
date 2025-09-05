const prismaConfig = require('../config/prisma');
const crypto = require('crypto');

class UserCompanyService {
  constructor() {
    this.prisma = null;
  }

  async init() {
    this.prisma = prismaConfig.getPrisma();
  }

  /**
   * Vincula um usuário a um empresa
   * @param {string} userId - ID do usuário
   * @param {string} companyId - ID do empresa
   * @param {Object} options - Opções de vinculação
   * @returns {Promise<Object>} Vinculação criada
   */
  async linkUserToCompany(userId, companyId, options = {}) {
    try {
      if (!this.prisma) await this.init();

      const {
        companyRole = 'USER',
        requestedBy = null,
        approvedBy = null,
        status = 'pending',
        autoApprove = false
      } = options;

      // Verificar se já existe vinculação
      const existingLink = await this.prisma.userCompany.findUnique({
        where: {
          userId_companyId: {
            userId,
            companyId
          }
        }
      });

      if (existingLink) {
        if (existingLink.status === 'active') {
          throw new Error('Usuário já está vinculado a este empresa');
        }
        
        // Se existe mas não está ativo, atualizar
        return await this.prisma.userCompany.update({
          where: { id: existingLink.id },
          data: {
            status: autoApprove ? 'active' : 'pending',
            companyRole,
            linkedAt: autoApprove ? new Date() : null,
            approvedBy: autoApprove ? approvedBy : null,
            approvedAt: autoApprove ? new Date() : null,
            requestedBy
          },
          include: {
            user: {
              select: { id: true, name: true, email: true }
            },
            company: {
              select: { id: true, name: true }
            }
          }
        });
      }

      // Criar nova vinculação
      const userCompany = await this.prisma.userCompany.create({
        data: {
          userId,
          companyId,
          companyRole,
          status: autoApprove ? 'active' : 'pending',
          linkedAt: autoApprove ? new Date() : null,
          requestedBy,
          approvedBy: autoApprove ? approvedBy : null,
          approvedAt: autoApprove ? new Date() : null
        },
        include: {
          user: {
            select: { id: true, name: true, email: true }
          },
          company: {
            select: { id: true, name: true }
          }
        }
      });

      return userCompany;
    } catch (error) {
      console.error('❌ Erro ao vincular usuário ao empresa:', error);
      throw error;
    }
  }

  /**
   * Aprova vinculação de usuário a empresa
   * @param {string} userCompanyId - ID da vinculação
   * @param {string} approvedBy - ID do aprovador
   * @returns {Promise<Object>} Vinculação aprovada
   */
  async approveUserCompanyLink(userCompanyId, approvedBy) {
    try {
      if (!this.prisma) await this.init();

      const userCompany = await this.prisma.userCompany.update({
        where: { id: userCompanyId },
        data: {
          status: 'active',
          linkedAt: new Date(),
          approvedBy,
          approvedAt: new Date()
        },
        include: {
          user: {
            select: { id: true, name: true, email: true }
          },
          company: {
            select: { id: true, name: true }
          }
        }
      });

      return userCompany;
    } catch (error) {
      console.error('❌ Erro ao aprovar vinculação:', error);
      throw error;
    }
  }

  /**
   * Rejeita vinculação de usuário a empresa
   * @param {string} userCompanyId - ID da vinculação
   * @param {string} rejectedBy - ID do rejeitador
   * @returns {Promise<Object>} Vinculação rejeitada
   */
  async rejectUserCompanyLink(userCompanyId, rejectedBy) {
    try {
      if (!this.prisma) await this.init();

      const userCompany = await this.prisma.userCompany.update({
        where: { id: userCompanyId },
        data: {
          status: 'revoked',
          approvedBy: rejectedBy,
          approvedAt: new Date()
        },
        include: {
          user: {
            select: { id: true, name: true, email: true }
          },
          company: {
            select: { id: true, name: true }
          }
        }
      });

      return userCompany;
    } catch (error) {
      console.error('❌ Erro ao rejeitar vinculação:', error);
      throw error;
    }
  }

  /**
   * Cria vinculação de usuário ao empresa
   * @param {string} userId - ID do usuário
   * @param {string} companyId - ID do empresa
   * @param {Object} options - Opções de vinculação
   * @returns {Promise<Object>} Resultado da vinculação
   */
  async createUserCompanyLink(userId, companyId, options = {}) {
    try {
      if (!this.prisma) await this.init();

      const {
        status = 'pending',
        role = 'USER',
        permissions = {},
        requestedBy = null,
        metadata = {}
      } = options;

      // Verificar se já existe vinculação
      const existingLink = await this.getUserCompanyLink(userId, companyId);
      if (existingLink) {
        throw new Error('Usuário já está vinculado a este empresa');
      }

      const userCompany = await this.prisma.userCompany.create({
        data: {
          userId,
          companyId,
          status,
          role,
          permissions,
          requestedBy,
          metadata
        }
      });

      return userCompany;
    } catch (error) {
      console.error('❌ Erro ao criar vinculação user-company:', error);
      throw error;
    }
  }

  /**
   * Atualiza status da vinculação user-company
   * @param {string} userId - ID do usuário
   * @param {string} companyId - ID do empresa
   * @param {string} newStatus - Novo status
   * @param {string} updatedBy - ID do usuário que fez a atualização
   * @returns {Promise<Object>} UserCompany atualizado
   */
  async updateUserCompanyStatus(userId, companyId, newStatus, updatedBy) {
    try {
      if (!this.prisma) await this.init();

      const userCompany = await this.prisma.userCompany.update({
        where: {
          userId_companyId: {
            userId,
            companyId
          }
        },
        data: {
          status: newStatus,
          approvedBy: updatedBy,
          approvedAt: newStatus === 'active' ? new Date() : null
        }
      });

      return userCompany;
    } catch (error) {
      console.error('❌ Erro ao atualizar status da vinculação:', error);
      throw error;
    }
  }

  /**
   * Lista empresas vinculados a um usuário
   * @param {string} userId - ID do usuário
   * @param {Object} options - Opções de listagem
   * @returns {Promise<Array>} Lista de empresas
   */
  async getUserCompanies(userId, options = {}) {
    try {
      if (!this.prisma) await this.init();

      const {
        status = 'active',
        role,
        includeInactive = false
      } = options;

      const where = { userId };
      
      if (!includeInactive) {
        where.status = status;
      }

      if (role) {
        where.role = role;
      }

      const userCompanies = await this.prisma.userCompany.findMany({
        where,
        include: {
          company: {
            select: {
              id: true,
              name: true,
              isActive: true,
              companyBrandings: {
                where: { isActive: true },
                select: {
                  primaryColor: true,
                  logoUrl: true,
                  loginTitle: true
                }
              }
            }
          }
        },
        orderBy: { linkedAt: 'desc' }
      });

      return userCompanies;
    } catch (error) {
      console.error('❌ Erro ao listar empresas do usuário:', error);
      throw error;
    }
  }

  /**
   * Lista usuários vinculados a um empresa
   * @param {string} companyId - ID do empresa
   * @param {Object} options - Opções de listagem
   * @returns {Promise<Array>} Lista de usuários
   */
  async getCompanyUsers(companyId, options = {}) {
    try {
      if (!this.prisma) await this.init();

      const {
        status = 'active',
        role = null,
        page = 1,
        limit = 50
      } = options;

      const skip = (page - 1) * limit;
      const where = { companyId, status };
      
      if (role) {
        where.role = role;
      }

      const [userCompanies, total] = await Promise.all([
        this.prisma.userCompany.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                isActive: true,
                lastActivityAt: true,
                createdAt: true
              }
            }
          },
          orderBy: { linkedAt: 'desc' },
          skip,
          take: limit
        }),
        this.prisma.userCompany.count({ where })
      ]);

      return {
        userCompanies,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('❌ Erro ao listar usuários do empresa:', error);
      throw error;
    }
  }

  /**
   * Verifica se usuário está vinculado a um empresa
   * @param {string} userId - ID do usuário
   * @param {string} companyId - ID do empresa
   * @returns {Promise<Object|null>} Vinculação encontrada
   */
  async getUserCompanyLink(userId, companyId) {
    try {
      if (!this.prisma) await this.init();

      const userCompany = await this.prisma.userCompany.findUnique({
        where: {
          userId_companyId: {
            userId,
            companyId
          }
        },
        include: {
          user: {
            select: { id: true, name: true, email: true }
          },
          company: {
            select: { id: true, name: true }
          }
        }
      });

      return userCompany;
    } catch (error) {
      console.error('❌ Erro ao verificar vinculação:', error);
      throw error;
    }
  }

  /**
   * Atualiza role do usuário em um empresa
   * @param {string} userId - ID do usuário
   * @param {string} companyId - ID do empresa
   * @param {string} newRole - Nova role
   * @param {string} updatedBy - ID do usuário que fez a atualização
   * @returns {Promise<Object>} UserCompany atualizado
   */
  async updateUserCompanyRole(userId, companyId, newRole, updatedBy) {
    try {
      if (!this.prisma) await this.init();

      const userCompany = await this.prisma.userCompany.update({
        where: {
          userId_companyId: {
            userId,
            companyId
          }
        },
        data: {
          role: newRole,
          updatedAt: new Date()
        }
      });

      return userCompany;
    } catch (error) {
      console.error('❌ Erro ao atualizar role do usuário:', error);
      throw error;
    }
  }

  /**
   * Remove vinculação de usuário a empresa
   * @param {string} userId - ID do usuário
   * @param {string} companyId - ID do empresa
   * @returns {Promise<Object>} Vinculação removida
   */
  async unlinkUserFromCompany(userId, companyId) {
    try {
      if (!this.prisma) await this.init();

      const userCompany = await this.prisma.userCompany.update({
        where: {
          userId_companyId: {
            userId,
            companyId
          }
        },
        data: {
          status: 'revoked',
          deletedAt: new Date()
        }
      });

      return userCompany;
    } catch (error) {
      console.error('❌ Erro ao remover vinculação:', error);
      throw error;
    }
  }

  /**
   * Atualiza última atividade do usuário no empresa
   * @param {string} userId - ID do usuário
   * @param {string} companyId - ID do empresa
   * @returns {Promise<void>}
   */
  async updateLastActivity(userId, companyId) {
    try {
      if (!this.prisma) await this.init();

      await this.prisma.userCompany.updateMany({
        where: {
          userId,
          companyId,
          status: 'active'
        },
        data: {
          lastAccessAt: new Date(),
          accessCount: {
            increment: 1
          }
        }
      });
    } catch (error) {
      console.error('❌ Erro ao atualizar última atividade:', error);
      // Não lançar erro para não quebrar fluxo principal
    }
  }

  /**
   * Verifica permissões do usuário em um empresa
   * @param {string} userId - ID do usuário
   * @param {string} companyId - ID do empresa
   * @param {string} permission - Permissão a verificar
   * @returns {Promise<boolean>} Se tem permissão
   */
  async hasPermission(userId, companyId, permission) {
    try {
      if (!this.prisma) await this.init();

      const userCompany = await this.getUserCompanyLink(userId, companyId);
      
      if (!userCompany || userCompany.status !== 'active') {
        return false;
      }

      // Verificar por role
      const role = userCompany.role;
      const permissions = {
        'SUPER_ADMIN': ['*'], // Todas as permissões
        'APP_ADMIN': ['read_users', 'create_users', 'update_users', 'read_transactions', 'create_transactions'],
        'ADMIN': ['read_company_users', 'create_company_users', 'update_company_users', 'read_company_transactions', 'manage_company'],
        'USER': ['read_own_data', 'update_own_data', 'create_transactions']
      };

      const rolePermissions = permissions[role] || [];
      
      return rolePermissions.includes('*') || rolePermissions.includes(permission);
    } catch (error) {
      console.error('❌ Erro ao verificar permissões:', error);
      return false;
    }
  }

  /**
   * Obtém o empresa atual do usuário (baseado no último acesso)
   * @param {string} userId - ID do usuário
   * @returns {Promise<Object|null>} empresa atual ou null
   */
  async getCurrentCompany(userId) {
    try {
      if (!this.prisma) await this.init();

      // Buscar o empresa com último acesso mais recente
      const currentUserCompany = await this.prisma.userCompany.findFirst({
        where: {
          userId,
          status: 'active',
          company: {
            isActive: true
          }
        },
        include: {
          company: {
            select: {
              id: true,
              name: true,
              alias: true,
              isActive: true,
              createdAt: true,
              updatedAt: true
            }
          }
        },
        orderBy: [
          { lastAccessAt: 'desc' },
          { linkedAt: 'desc' }
        ]
      });

      if (!currentUserCompany) {
        return null;
      }

      return {
        id: currentUserCompany.company.id,
        name: currentUserCompany.company.name,
        alias: currentUserCompany.company.alias,
        isActive: currentUserCompany.company.isActive,
        createdAt: currentUserCompany.company.createdAt,
        updatedAt: currentUserCompany.company.updatedAt,
        userRole: currentUserCompany.role,
        linkedAt: currentUserCompany.linkedAt,
        lastAccessAt: currentUserCompany.lastAccessAt
      };

    } catch (error) {
      console.error('❌ Erro ao obter empresa atual:', error);
      throw error;
    }
  }

  /**
   * Atualiza o último acesso de uma empresa específica
   * @param {string} userId - ID do usuário
   * @param {string} companyId - ID da empresa
   */
  async updateLastAccess(userId, companyId) {
    try {
      if (!this.prisma) await this.init();

      await this.prisma.userCompany.update({
        where: {
          userId_companyId: {
            userId,
            companyId
          }
        },
        data: {
          lastAccessAt: new Date()
        }
      });

      console.log(`✅ LastAccessAt atualizado para empresa ${companyId}`);
    } catch (error) {
      console.error('❌ Erro ao atualizar último acesso:', error);
      // Não fazer throw para não quebrar o fluxo principal
    }
  }

  /**
   * Define empresa atual do usuário (atualiza lastAccessAt)
   * @param {string} userId - ID do usuário
   * @param {string} companyId - ID da empresa
   */
  async setCurrentCompany(userId, companyId) {
    try {
      if (!this.prisma) await this.init();

      // Verificar se o usuário está vinculado à empresa
      const userCompany = await this.getUserCompanyLink(userId, companyId);
      if (!userCompany || userCompany.status !== 'active') {
        throw new Error('Usuário não está vinculado a esta empresa ou vinculação não está ativa');
      }

      // Atualizar lastAccessAt
      await this.updateLastAccess(userId, companyId);

      return await this.getCurrentCompany(userId);
    } catch (error) {
      console.error('❌ Erro ao definir empresa atual:', error);
      throw error;
    }
  }
}

module.exports = new UserCompanyService();

