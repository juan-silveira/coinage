const prismaConfig = require('../config/prisma');
const crypto = require('crypto');

class UserClientService {
  constructor() {
    this.prisma = null;
  }

  async init() {
    this.prisma = prismaConfig.getPrisma();
  }

  /**
   * Vincula um usuário a um cliente
   * @param {string} userId - ID do usuário
   * @param {string} clientId - ID do cliente
   * @param {Object} options - Opções de vinculação
   * @returns {Promise<Object>} Vinculação criada
   */
  async linkUserToClient(userId, clientId, options = {}) {
    try {
      if (!this.prisma) await this.init();

      const {
        clientRole = 'USER',
        requestedBy = null,
        approvedBy = null,
        status = 'pending',
        autoApprove = false
      } = options;

      // Verificar se já existe vinculação
      const existingLink = await this.prisma.userClient.findUnique({
        where: {
          userId_clientId: {
            userId,
            clientId
          }
        }
      });

      if (existingLink) {
        if (existingLink.status === 'active') {
          throw new Error('Usuário já está vinculado a este cliente');
        }
        
        // Se existe mas não está ativo, atualizar
        return await this.prisma.userClient.update({
          where: { id: existingLink.id },
          data: {
            status: autoApprove ? 'active' : 'pending',
            clientRole,
            linkedAt: autoApprove ? new Date() : null,
            approvedBy: autoApprove ? approvedBy : null,
            approvedAt: autoApprove ? new Date() : null,
            requestedBy
          },
          include: {
            user: {
              select: { id: true, name: true, email: true }
            },
            client: {
              select: { id: true, name: true }
            }
          }
        });
      }

      // Criar nova vinculação
      const userClient = await this.prisma.userClient.create({
        data: {
          userId,
          clientId,
          clientRole,
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
          client: {
            select: { id: true, name: true }
          }
        }
      });

      return userClient;
    } catch (error) {
      console.error('❌ Erro ao vincular usuário ao cliente:', error);
      throw error;
    }
  }

  /**
   * Aprova vinculação de usuário a cliente
   * @param {string} userClientId - ID da vinculação
   * @param {string} approvedBy - ID do aprovador
   * @returns {Promise<Object>} Vinculação aprovada
   */
  async approveUserClientLink(userClientId, approvedBy) {
    try {
      if (!this.prisma) await this.init();

      const userClient = await this.prisma.userClient.update({
        where: { id: userClientId },
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
          client: {
            select: { id: true, name: true }
          }
        }
      });

      return userClient;
    } catch (error) {
      console.error('❌ Erro ao aprovar vinculação:', error);
      throw error;
    }
  }

  /**
   * Rejeita vinculação de usuário a cliente
   * @param {string} userClientId - ID da vinculação
   * @param {string} rejectedBy - ID do rejeitador
   * @returns {Promise<Object>} Vinculação rejeitada
   */
  async rejectUserClientLink(userClientId, rejectedBy) {
    try {
      if (!this.prisma) await this.init();

      const userClient = await this.prisma.userClient.update({
        where: { id: userClientId },
        data: {
          status: 'revoked',
          approvedBy: rejectedBy,
          approvedAt: new Date()
        },
        include: {
          user: {
            select: { id: true, name: true, email: true }
          },
          client: {
            select: { id: true, name: true }
          }
        }
      });

      return userClient;
    } catch (error) {
      console.error('❌ Erro ao rejeitar vinculação:', error);
      throw error;
    }
  }

  /**
   * Lista clientes vinculados a um usuário
   * @param {string} userId - ID do usuário
   * @param {Object} options - Opções de listagem
   * @returns {Promise<Array>} Lista de clientes
   */
  async getUserClients(userId, options = {}) {
    try {
      if (!this.prisma) await this.init();

      const {
        status = 'active',
        includeInactive = false
      } = options;

      const where = { userId };
      
      if (!includeInactive) {
        where.status = status;
      }

      const userClients = await this.prisma.userClient.findMany({
        where,
        include: {
          client: {
            select: {
              id: true,
              name: true,
              isActive: true,
              clientBrandings: {
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

      return userClients;
    } catch (error) {
      console.error('❌ Erro ao listar clientes do usuário:', error);
      throw error;
    }
  }

  /**
   * Lista usuários vinculados a um cliente
   * @param {string} clientId - ID do cliente
   * @param {Object} options - Opções de listagem
   * @returns {Promise<Array>} Lista de usuários
   */
  async getClientUsers(clientId, options = {}) {
    try {
      if (!this.prisma) await this.init();

      const {
        status = 'active',
        role = null,
        page = 1,
        limit = 50
      } = options;

      const skip = (page - 1) * limit;
      const where = { clientId, status };
      
      if (role) {
        where.clientRole = role;
      }

      const [userClients, total] = await Promise.all([
        this.prisma.userClient.findMany({
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
        this.prisma.userClient.count({ where })
      ]);

      return {
        userClients,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('❌ Erro ao listar usuários do cliente:', error);
      throw error;
    }
  }

  /**
   * Verifica se usuário está vinculado a um cliente
   * @param {string} userId - ID do usuário
   * @param {string} clientId - ID do cliente
   * @returns {Promise<Object|null>} Vinculação encontrada
   */
  async getUserClientLink(userId, clientId) {
    try {
      if (!this.prisma) await this.init();

      const userClient = await this.prisma.userClient.findUnique({
        where: {
          userId_clientId: {
            userId,
            clientId
          }
        },
        include: {
          user: {
            select: { id: true, name: true, email: true }
          },
          client: {
            select: { id: true, name: true }
          }
        }
      });

      return userClient;
    } catch (error) {
      console.error('❌ Erro ao verificar vinculação:', error);
      throw error;
    }
  }

  /**
   * Atualiza role de usuário em um cliente
   * @param {string} userId - ID do usuário
   * @param {string} clientId - ID do cliente
   * @param {string} newRole - Nova role
   * @param {string} updatedBy - ID do atualizador
   * @returns {Promise<Object>} Vinculação atualizada
   */
  async updateUserClientRole(userId, clientId, newRole, updatedBy) {
    try {
      if (!this.prisma) await this.init();

      // Verificar se a role é válida
      const validRoles = ['USER', 'ADMIN', 'SUPER_ADMIN', 'APP_ADMIN'];
      if (!validRoles.includes(newRole)) {
        throw new Error(`Role inválida: ${newRole}`);
      }

      const userClient = await this.prisma.userClient.update({
        where: {
          userId_clientId: {
            userId,
            clientId
          }
        },
        data: {
          clientRole: newRole,
          // Se está promovendo para ADMIN ou SUPER_ADMIN, pode ver chaves privadas de acordo com a role
          canViewPrivateKeys: ['SUPER_ADMIN'].includes(newRole)
        },
        include: {
          user: {
            select: { id: true, name: true, email: true }
          },
          client: {
            select: { id: true, name: true }
          }
        }
      });

      return userClient;
    } catch (error) {
      console.error('❌ Erro ao atualizar role:', error);
      throw error;
    }
  }

  /**
   * Remove vinculação de usuário a cliente
   * @param {string} userId - ID do usuário
   * @param {string} clientId - ID do cliente
   * @returns {Promise<Object>} Vinculação removida
   */
  async unlinkUserFromClient(userId, clientId) {
    try {
      if (!this.prisma) await this.init();

      const userClient = await this.prisma.userClient.update({
        where: {
          userId_clientId: {
            userId,
            clientId
          }
        },
        data: {
          status: 'revoked',
          deletedAt: new Date()
        }
      });

      return userClient;
    } catch (error) {
      console.error('❌ Erro ao remover vinculação:', error);
      throw error;
    }
  }

  /**
   * Atualiza última atividade do usuário no cliente
   * @param {string} userId - ID do usuário
   * @param {string} clientId - ID do cliente
   * @returns {Promise<void>}
   */
  async updateLastActivity(userId, clientId) {
    try {
      if (!this.prisma) await this.init();

      await this.prisma.userClient.updateMany({
        where: {
          userId,
          clientId,
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
   * Verifica permissões do usuário em um cliente
   * @param {string} userId - ID do usuário
   * @param {string} clientId - ID do cliente
   * @param {string} permission - Permissão a verificar
   * @returns {Promise<boolean>} Se tem permissão
   */
  async hasPermission(userId, clientId, permission) {
    try {
      if (!this.prisma) await this.init();

      const userClient = await this.getUserClientLink(userId, clientId);
      
      if (!userClient || userClient.status !== 'active') {
        return false;
      }

      // Verificar por role
      const role = userClient.clientRole;
      const permissions = {
        'SUPER_ADMIN': ['*'], // Todas as permissões
        'APP_ADMIN': ['read_users', 'create_users', 'update_users', 'read_transactions', 'create_transactions'],
        'ADMIN': ['read_client_users', 'create_client_users', 'update_client_users', 'read_client_transactions', 'manage_client'],
        'USER': ['read_own_data', 'update_own_data', 'create_transactions']
      };

      const rolePermissions = permissions[role] || [];
      
      return rolePermissions.includes('*') || rolePermissions.includes(permission);
    } catch (error) {
      console.error('❌ Erro ao verificar permissões:', error);
      return false;
    }
  }
}

module.exports = new UserClientService();

