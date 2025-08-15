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
   * Cria vinculação de usuário ao cliente
   * @param {string} userId - ID do usuário
   * @param {string} clientId - ID do cliente
   * @param {Object} options - Opções de vinculação
   * @returns {Promise<Object>} Resultado da vinculação
   */
  async createUserClientLink(userId, clientId, options = {}) {
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
      const existingLink = await this.getUserClientLink(userId, clientId);
      if (existingLink) {
        throw new Error('Usuário já está vinculado a este cliente');
      }

      const userClient = await this.prisma.userClient.create({
        data: {
          userId,
          clientId,
          status,
          role,
          permissions,
          requestedBy,
          metadata
        }
      });

      return userClient;
    } catch (error) {
      console.error('❌ Erro ao criar vinculação user-client:', error);
      throw error;
    }
  }

  /**
   * Atualiza status da vinculação user-client
   * @param {string} userId - ID do usuário
   * @param {string} clientId - ID do cliente
   * @param {string} newStatus - Novo status
   * @param {string} updatedBy - ID do usuário que fez a atualização
   * @returns {Promise<Object>} UserClient atualizado
   */
  async updateUserClientStatus(userId, clientId, newStatus, updatedBy) {
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
          status: newStatus,
          approvedBy: updatedBy,
          approvedAt: newStatus === 'active' ? new Date() : null
        }
      });

      return userClient;
    } catch (error) {
      console.error('❌ Erro ao atualizar status da vinculação:', error);
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
        where.role = role;
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
   * Atualiza role do usuário em um cliente
   * @param {string} userId - ID do usuário
   * @param {string} clientId - ID do cliente
   * @param {string} newRole - Nova role
   * @param {string} updatedBy - ID do usuário que fez a atualização
   * @returns {Promise<Object>} UserClient atualizado
   */
  async updateUserClientRole(userId, clientId, newRole, updatedBy) {
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
          role: newRole,
          updatedAt: new Date()
        }
      });

      return userClient;
    } catch (error) {
      console.error('❌ Erro ao atualizar role do usuário:', error);
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
      const role = userClient.role;
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

  /**
   * Obtém o cliente atual do usuário (baseado no último acesso)
   * @param {string} userId - ID do usuário
   * @returns {Promise<Object|null>} Cliente atual ou null
   */
  async getCurrentClient(userId) {
    try {
      if (!this.prisma) await this.init();

      // Buscar o cliente com último acesso mais recente
      const currentUserClient = await this.prisma.userClient.findFirst({
        where: {
          userId,
          status: 'active',
          client: {
            isActive: true
          }
        },
        include: {
          client: {
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

      if (!currentUserClient) {
        return null;
      }

      return {
        id: currentUserClient.client.id,
        name: currentUserClient.client.name,
        alias: currentUserClient.client.alias,
        isActive: currentUserClient.client.isActive,
        createdAt: currentUserClient.client.createdAt,
        updatedAt: currentUserClient.client.updatedAt,
        userRole: currentUserClient.role,
        linkedAt: currentUserClient.linkedAt,
        lastAccessAt: currentUserClient.lastAccessAt
      };

    } catch (error) {
      console.error('❌ Erro ao obter cliente atual:', error);
      throw error;
    }
  }
}

module.exports = new UserClientService();

