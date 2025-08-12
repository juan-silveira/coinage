const prismaConfig = require('../config/prisma');

class ClientService {
  constructor() {
    this.prisma = null;
  }

  async initialize() {
    this.prisma = prismaConfig.getPrisma();
  }

  /**
   * Cria um novo cliente
   * @param {Object} clientData - Dados do cliente
   * @returns {Promise<Object>} Cliente criado
   */
  async createClient(clientData) {
    try {
      if (!this.prisma) await this.initialize();

      const client = await this.prisma.client.create({
        data: {
          name: clientData.name,
          rateLimit: clientData.rateLimit || {
            requestsPerMinute: 100,
            requestsPerHour: 1000,
            requestsPerDay: 10000
          }
        }
      });

      return {
        success: true,
        data: client,
        message: 'Cliente criado com sucesso'
      };
    } catch (error) {
      console.error('❌ Erro ao criar cliente:', error);
      throw new Error(`Erro ao criar cliente: ${error.message}`);
    }
  }

  /**
   * Busca cliente por ID
   * @param {string} id - ID do cliente
   * @returns {Promise<Object|null>} Cliente encontrado
   */
  async getClientById(id) {
    try {
      if (!this.prisma) await this.initialize();

      const client = await this.prisma.client.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              users: { where: { isActive: true } },
              transactions: true,
              webhooks: { where: { isActive: true } }
            }
          }
        }
      });

      return client;
    } catch (error) {
      console.error('❌ Erro ao buscar cliente por ID:', error);
      throw error;
    }
  }

  /**
   * Lista clientes com paginação
   * @param {Object} options - Opções de listagem
   * @returns {Promise<Object>} Lista paginada de clientes
   */
  async listClients(options = {}) {
    try {
      if (!this.prisma) await this.initialize();

      const {
        page = 1,
        limit = 50,
        isActive,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = options;

      const skip = (page - 1) * limit;
      const take = parseInt(limit);

      // Construir filtros
      const where = {};
      
      if (typeof isActive === 'boolean') where.isActive = isActive;
      
      if (search) {
        where.name = {
          contains: search,
          mode: 'insensitive'
        };
      }

      // Executar consulta
      const [clients, total] = await Promise.all([
        this.prisma.client.findMany({
          where,
          include: {
            _count: {
              select: {
                users: { where: { isActive: true } },
                transactions: true,
                webhooks: { where: { isActive: true } }
              }
            }
          },
          orderBy: { [sortBy]: sortOrder },
          skip,
          take
        }),
        this.prisma.client.count({ where })
      ]);

      return {
        clients,
        pagination: {
          page: parseInt(page),
          limit: take,
          total,
          totalPages: Math.ceil(total / take),
          hasNext: skip + take < total,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      console.error('❌ Erro ao listar clientes:', error);
      throw error;
    }
  }

  /**
   * Atualiza um cliente
   * @param {string} id - ID do cliente
   * @param {Object} updateData - Dados para atualização
   * @returns {Promise<Object>} Cliente atualizado
   */
  async updateClient(id, updateData) {
    try {
      if (!this.prisma) await this.initialize();

      const client = await this.prisma.client.update({
        where: { id },
        data: updateData
      });

      return {
        success: true,
        data: client,
        message: 'Cliente atualizado com sucesso'
      };
    } catch (error) {
      console.error('❌ Erro ao atualizar cliente:', error);
      throw new Error(`Erro ao atualizar cliente: ${error.message}`);
    }
  }

  /**
   * Desativa um cliente
   * @param {string} id - ID do cliente
   * @returns {Promise<Object>} Cliente desativado
   */
  async deactivateClient(id) {
    try {
      if (!this.prisma) await this.initialize();

      const client = await this.prisma.client.update({
        where: { id },
        data: { isActive: false }
      });

      return {
        success: true,
        data: client,
        message: 'Cliente desativado com sucesso'
      };
    } catch (error) {
      console.error('❌ Erro ao desativar cliente:', error);
      throw new Error(`Erro ao desativar cliente: ${error.message}`);
    }
  }

  /**
   * Ativa um cliente
   * @param {string} id - ID do cliente
   * @returns {Promise<Object>} Cliente ativado
   */
  async activateClient(id) {
    try {
      if (!this.prisma) await this.initialize();

      const client = await this.prisma.client.update({
        where: { id },
        data: { isActive: true }
      });

      return {
        success: true,
        data: client,
        message: 'Cliente ativado com sucesso'
      };
    } catch (error) {
      console.error('❌ Erro ao ativar cliente:', error);
      throw new Error(`Erro ao ativar cliente: ${error.message}`);
    }
  }

  /**
   * Atualiza rate limits de um cliente
   * @param {string} id - ID do cliente
   * @param {Object} rateLimit - Novos rate limits
   * @returns {Promise<Object>} Cliente atualizado
   */
  async updateRateLimits(id, rateLimit) {
    try {
      if (!this.prisma) await this.initialize();

      // Validar rate limits
      const validRateLimit = {
        requestsPerMinute: rateLimit.requestsPerMinute || 100,
        requestsPerHour: rateLimit.requestsPerHour || 1000,
        requestsPerDay: rateLimit.requestsPerDay || 10000
      };

      // Validar hierarquia
      if (validRateLimit.requestsPerMinute > validRateLimit.requestsPerHour) {
        throw new Error('requestsPerMinute não pode ser maior que requestsPerHour');
      }
      if (validRateLimit.requestsPerHour > validRateLimit.requestsPerDay) {
        throw new Error('requestsPerHour não pode ser maior que requestsPerDay');
      }

      const client = await this.prisma.client.update({
        where: { id },
        data: { rateLimit: validRateLimit }
      });

      return {
        success: true,
        data: client,
        message: 'Rate limits atualizados com sucesso'
      };
    } catch (error) {
      console.error('❌ Erro ao atualizar rate limits:', error);
      throw error;
    }
  }

  /**
   * Obtém estatísticas de uso do cliente
   * @param {string} id - ID do cliente
   * @returns {Promise<Object>} Estatísticas do cliente
   */
  async getClientUsageStats(id) {
    try {
      if (!this.prisma) await this.initialize();

      const stats = await this.prisma.client.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              users: { where: { isActive: true } },
              transactions: true,
              requestLogs: true,
              webhooks: { where: { isActive: true } },
              documents: true
            }
          }
        }
      });

      if (!stats) {
        throw new Error('Cliente não encontrado');
      }

      // Estatísticas adicionais por período
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const [todayTransactions, monthTransactions] = await Promise.all([
        this.prisma.transaction.count({
          where: {
            clientId: id,
            createdAt: { gte: today }
          }
        }),
        this.prisma.transaction.count({
          where: {
            clientId: id,
            createdAt: { gte: thisMonth }
          }
        })
      ]);

      return {
        clientId: id,
        clientName: stats.name,
        isActive: stats.isActive,
        totalUsers: stats._count.users,
        totalTransactions: stats._count.transactions,
        totalRequestLogs: stats._count.requestLogs,
        totalWebhooks: stats._count.webhooks,
        totalDocuments: stats._count.documents,
        transactionsToday: todayTransactions,
        transactionsThisMonth: monthTransactions,
        lastActivity: stats.lastActivityAt,
        rateLimit: stats.rateLimit
      };
    } catch (error) {
      console.error('❌ Erro ao obter estatísticas do cliente:', error);
      throw error;
    }
  }

  /**
   * Atualiza última atividade do cliente
   * @param {string} id - ID do cliente
   * @returns {Promise<Object>} Cliente atualizado
   */
  async updateLastActivity(id) {
    try {
      if (!this.prisma) await this.initialize();

      const client = await this.prisma.client.update({
        where: { id },
        data: { lastActivityAt: new Date() }
      });

      return client;
    } catch (error) {
      console.error('❌ Erro ao atualizar última atividade:', error);
      throw error;
    }
  }

  /**
   * Testa o serviço
   * @returns {Promise<Object>} Status do teste
   */
  async testService() {
    try {
      if (!this.prisma) await this.initialize();

      // Teste simples de conexão
      await this.prisma.$queryRaw`SELECT 1 as test`;

      // Contar clientes
      const clientCount = await this.prisma.client.count();

      return {
        success: true,
        message: 'ClientService (Prisma) funcionando corretamente',
        totalClients: clientCount,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        message: 'Erro no ClientService (Prisma)',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = new ClientService();