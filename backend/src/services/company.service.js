const prismaConfig = require('../config/prisma');

class CompanyService {
  constructor() {
    this.prisma = null;
  }

  async initialize() {
    this.prisma = prismaConfig.getPrisma();
  }

  /**
   * Cria uma nova empresa
   * @param {Object} companyData - Dados da empresa
   * @returns {Promise<Object>} Empresa criada
   */
  async createCompany(companyData) {
    try {
      if (!this.prisma) await this.initialize();

      const company = await this.prisma.company.create({
        data: {
          name: companyData.name,
          rateLimit: companyData.rateLimit || {
            requestsPerMinute: 100,
            requestsPerHour: 1000,
            requestsPerDay: 10000
          }
        }
      });

      return {
        success: true,
        data: company,
        message: 'Empresa criada com sucesso'
      };
    } catch (error) {
      console.error('❌ Erro ao criar empresa:', error);
      throw new Error(`Erro ao criar empresa: ${error.message}`);
    }
  }

  /**
   * Busca empresa por ID
   * @param {string} id - ID do empresa
   * @returns {Promise<Object|null>} empresa encontrado
   */
  async getCompanyById(id) {
    try {
      if (!this.prisma) await this.initialize();

      const company = await this.prisma.company.findUnique({
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

      return company;
    } catch (error) {
      console.error('❌ Erro ao buscar empresa por ID:', error);
      throw error;
    }
  }

  /**
   * Lista empresas com paginação
   * @param {Object} options - Opções de listagem
   * @returns {Promise<Object>} Lista paginada de empresas
   */
  async listCompanies(options = {}) {
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
      const [companies, total] = await Promise.all([
        this.prisma.company.findMany({
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
        this.prisma.company.count({ where })
      ]);

      return {
        companies,
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
      console.error('❌ Erro ao listar empresas:', error);
      throw error;
    }
  }

  /**
   * Atualiza um empresa
   * @param {string} id - ID do empresa
   * @param {Object} updateData - Dados para atualização
   * @returns {Promise<Object>} empresa atualizado
   */
  async updateCompany(id, updateData) {
    try {
      if (!this.prisma) await this.initialize();

      const company = await this.prisma.company.update({
        where: { id },
        data: updateData
      });

      return {
        success: true,
        data: company,
        message: 'empresa atualizado com sucesso'
      };
    } catch (error) {
      console.error('❌ Erro ao atualizar empresa:', error);
      throw new Error(`Erro ao atualizar empresa: ${error.message}`);
    }
  }

  /**
   * Desativa um empresa
   * @param {string} id - ID do empresa
   * @returns {Promise<Object>} empresa desativado
   */
  async deactivateCompany(id) {
    try {
      if (!this.prisma) await this.initialize();

      const company = await this.prisma.company.update({
        where: { id },
        data: { isActive: false }
      });

      return {
        success: true,
        data: company,
        message: 'empresa desativado com sucesso'
      };
    } catch (error) {
      console.error('❌ Erro ao desativar empresa:', error);
      throw new Error(`Erro ao desativar empresa: ${error.message}`);
    }
  }

  /**
   * Ativa um empresa
   * @param {string} id - ID do empresa
   * @returns {Promise<Object>} empresa ativado
   */
  async activateCompany(id) {
    try {
      if (!this.prisma) await this.initialize();

      const company = await this.prisma.company.update({
        where: { id },
        data: { isActive: true }
      });

      return {
        success: true,
        data: company,
        message: 'empresa ativado com sucesso'
      };
    } catch (error) {
      console.error('❌ Erro ao ativar empresa:', error);
      throw new Error(`Erro ao ativar empresa: ${error.message}`);
    }
  }

  /**
   * Atualiza rate limits de um empresa
   * @param {string} id - ID do empresa
   * @param {Object} rateLimit - Novos rate limits
   * @returns {Promise<Object>} empresa atualizado
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

      const company = await this.prisma.company.update({
        where: { id },
        data: { rateLimit: validRateLimit }
      });

      return {
        success: true,
        data: company,
        message: 'Rate limits atualizados com sucesso'
      };
    } catch (error) {
      console.error('❌ Erro ao atualizar rate limits:', error);
      throw error;
    }
  }

  /**
   * Obtém estatísticas de uso do empresa
   * @param {string} id - ID do empresa
   * @returns {Promise<Object>} Estatísticas do empresa
   */
  async getCompanyUsageStats(id) {
    try {
      if (!this.prisma) await this.initialize();

      const stats = await this.prisma.company.findUnique({
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
        throw new Error('empresa não encontrado');
      }

      // Estatísticas adicionais por período
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const [todayTransactions, monthTransactions] = await Promise.all([
        this.prisma.transaction.count({
          where: {
            companyId: id,
            createdAt: { gte: today }
          }
        }),
        this.prisma.transaction.count({
          where: {
            companyId: id,
            createdAt: { gte: thisMonth }
          }
        })
      ]);

      return {
        companyId: id,
        companyName: stats.name,
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
      console.error('❌ Erro ao obter estatísticas do empresa:', error);
      throw error;
    }
  }

  /**
   * Busca empresa por alias
   * @param {string} alias - Alias da empresa
   * @returns {Promise<Object|null>} empresa ou null
   */
  async getCompanyByAlias(alias) {
    try {
      if (!this.prisma) await this.initialize();

      const company = await this.prisma.company.findUnique({
        where: { alias }
      });

      return company;
    } catch (error) {
      console.error('❌ Erro ao buscar empresa por alias:', error);
      return null;
    }
  }

  /**
   * Atualiza última atividade do empresa
   * @param {string} id - ID do empresa
   * @returns {Promise<Object>} empresa atualizado
   */
  async updateLastActivity(id) {
    try {
      if (!this.prisma) await this.initialize();

      const company = await this.prisma.company.update({
        where: { id },
        data: { lastActivityAt: new Date() }
      });

      return company;
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

      // Contar empresas
      const companyCount = await this.prisma.company.count();

      return {
        success: true,
        message: 'CompanyService (Prisma) funcionando corretamente',
        totalCompanies: companyCount,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        message: 'Erro no CompanyService (Prisma)',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = new CompanyService();