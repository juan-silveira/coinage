const prismaConfig = require('../config/prisma');

// Função helper para obter Prisma
const getPrisma = () => prismaConfig.getPrisma();

class EarningsService {
  /**
   * Criar um novo registro de provento
   */
  async createEarning(earningData) {
    try {
      const earning = await getPrisma().earnings.create({
        data: {
          userId: earningData.userId,
          tokenSymbol: earningData.tokenSymbol,
          tokenName: earningData.tokenName,
          amount: earningData.amount,
          quote: earningData.quote,
          network: earningData.network || 'testnet',
          transactionHash: earningData.transactionHash,
          distributionDate: earningData.distributionDate || new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return {
        success: true,
        data: earning,
        message: 'Provento criado com sucesso',
      };
    } catch (error) {
      console.error('Erro ao criar provento:', error);
      return {
        success: false,
        error: error.message,
        message: 'Erro ao criar provento',
      };
    }
  }

  /**
   * Obter todos os proventos de um usuário
   */
  async getUserEarnings(userId, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        tokenSymbol,
        network,
        startDate,
        endDate,
        sortBy = 'distributionDate',
        sortOrder = 'desc',
      } = options;

      // Construir filtros
      const where = {
        userId,
        isActive: true,
      };

      if (tokenSymbol) {
        where.tokenSymbol = tokenSymbol;
      }

      if (network) {
        where.network = network;
      }

      if (startDate || endDate) {
        where.distributionDate = {};
        if (startDate) {
          where.distributionDate.gte = new Date(startDate);
        }
        if (endDate) {
          where.distributionDate.lte = new Date(endDate);
        }
      }

      // Calcular offset para paginação
      const offset = (page - 1) * limit;

      // Buscar proventos
      const [earnings, total] = await Promise.all([
        getPrisma().earnings.findMany({
          where,
          orderBy: {
            [sortBy]: sortOrder,
          },
          skip: offset,
          take: limit,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        }),
        getPrisma().earnings.count({ where }),
      ]);

      // Calcular estatísticas
      const totalAmount = await getPrisma().earnings.aggregate({
        where,
        _sum: {
          amount: true,
        },
      });

      const totalValue = await getPrisma().earnings.aggregate({
        where,
        _sum: {
          amount: true,
        },
      });

      // Calcular valor total em cBRL
      const earningsWithValue = earnings.map(earning => ({
        ...earning,
        valueInCbrl: parseFloat(earning.amount) * parseFloat(earning.quote),
      }));

      const totalValueInCbrl = earningsWithValue.reduce((sum, earning) => sum + earning.valueInCbrl, 0);

      return {
        success: true,
        data: {
          earnings: earningsWithValue,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
          stats: {
            totalAmount: parseFloat(totalAmount._sum.amount || 0),
            totalValueInCbrl,
            totalEarnings: total,
          },
        },
        message: 'Proventos obtidos com sucesso',
      };
    } catch (error) {
      console.error('Erro ao obter proventos do usuário:', error);
      return {
        success: false,
        error: error.message,
        message: 'Erro ao obter proventos',
      };
    }
  }

  /**
   * Obter proventos agrupados por token para gráficos
   */
  async getEarningsForChart(userId, options = {}) {
    try {
      const {
        days = 30,
        tokenSymbols = [],
        network = 'testnet',
      } = options;

      // Calcular data de início
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Construir filtros
      const where = {
        userId,
        isActive: true,
        network,
        distributionDate: {
          gte: startDate,
        },
      };

      if (tokenSymbols.length > 0) {
        where.tokenSymbol = {
          in: tokenSymbols,
        };
      }

      // Buscar proventos agrupados por data e token
      const earnings = await getPrisma().earnings.findMany({
        where,
        select: {
          tokenSymbol: true,
          tokenName: true,
          amount: true,
          quote: true,
          distributionDate: true,
        },
        orderBy: {
          distributionDate: 'asc',
        },
      });

      // Agrupar por token e data
      const earningsByToken = {};
      const dates = new Set();

      earnings.forEach(earning => {
        const date = earning.distributionDate.toISOString().split('T')[0];
        dates.add(date);

        if (!earningsByToken[earning.tokenSymbol]) {
          earningsByToken[earning.tokenSymbol] = {
            name: earning.tokenName,
            data: {},
          };
        }

        if (!earningsByToken[earning.tokenSymbol].data[date]) {
          earningsByToken[earning.tokenSymbol].data[date] = 0;
        }

        earningsByToken[earning.tokenSymbol].data[date] += parseFloat(earning.amount);
      });

      // Converter para formato do gráfico
      const sortedDates = Array.from(dates).sort();
      const series = Object.entries(earningsByToken).map(([symbol, data]) => ({
        name: symbol,
        data: sortedDates.map(date => data.data[date] || 0),
      }));

      return {
        success: true,
        data: {
          series,
          categories: sortedDates,
          tokens: Object.keys(earningsByToken),
        },
        message: 'Dados para gráfico obtidos com sucesso',
      };
    } catch (error) {
      console.error('Erro ao obter dados para gráfico:', error);
      return {
        success: false,
        error: error.message,
        message: 'Erro ao obter dados para gráfico',
      };
    }
  }

  /**
   * Obter estatísticas resumidas dos proventos
   */
  async getEarningsSummary(userId, network = 'testnet') {
    try {
      const where = {
        userId,
        isActive: true,
        network,
      };

      // Estatísticas gerais
      const [totalEarnings, totalAmount, totalValue] = await Promise.all([
        getPrisma().earnings.count({ where }),
        getPrisma().earnings.aggregate({
          where,
          _sum: {
            amount: true,
          },
        }),
        getPrisma().earnings.aggregate({
          where,
          _sum: {
            amount: true,
          },
        }),
      ]);

      // Estatísticas por token
      const earningsByToken = await getPrisma().earnings.groupBy({
        by: ['tokenSymbol', 'tokenName'],
        where,
        _sum: {
          amount: true,
        },
        _count: {
          id: true,
        },
      });

      // Calcular valor total em cBRL
      const allEarnings = await getPrisma().earnings.findMany({
        where,
        select: {
          amount: true,
          quote: true,
        },
      });

      const totalValueInCbrl = allEarnings.reduce((sum, earning) => {
        return sum + (parseFloat(earning.amount) * parseFloat(earning.quote));
      }, 0);

      return {
        success: true,
        data: {
          totalEarnings,
          totalAmount: parseFloat(totalAmount._sum.amount || 0),
          totalValueInCbrl,
          earningsByToken: earningsByToken.map(item => ({
            symbol: item.tokenSymbol,
            name: item.tokenName,
            totalAmount: parseFloat(item._sum.amount || 0),
            count: item._count.id,
          })),
        },
        message: 'Resumo dos proventos obtido com sucesso',
      };
    } catch (error) {
      console.error('Erro ao obter resumo dos proventos:', error);
      return {
        success: false,
        error: error.message,
        message: 'Erro ao obter resumo dos proventos',
      };
    }
  }

  /**
   * Atualizar um provento
   */
  async updateEarning(earningId, updateData) {
    try {
      const earning = await getPrisma().earnings.update({
        where: { id: earningId },
        data: updateData,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return {
        success: true,
        data: earning,
        message: 'Provento atualizado com sucesso',
      };
    } catch (error) {
      console.error('Erro ao atualizar provento:', error);
      return {
        success: false,
        error: error.message,
        message: 'Erro ao atualizar provento',
      };
    }
  }

  /**
   * Desativar um provento (soft delete)
   */
  async deactivateEarning(earningId) {
    try {
      const earning = await getPrisma().earnings.update({
        where: { id: earningId },
        data: { isActive: false },
      });

      return {
        success: true,
        data: earning,
        message: 'Provento desativado com sucesso',
      };
    } catch (error) {
      console.error('Erro ao desativar provento:', error);
      return {
        success: false,
        error: error.message,
        message: 'Erro ao desativar provento',
      };
    }
  }

  /**
   * Obter proventos por período para relatórios
   */
  async getEarningsByPeriod(userId, startDate, endDate, network = 'testnet') {
    try {
      const where = {
        userId,
        isActive: true,
        network,
        distributionDate: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      };

      const earnings = await getPrisma().earnings.findMany({
        where,
        orderBy: {
          distributionDate: 'asc',
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // Calcular totais
      const totalValueInCbrl = earnings.reduce((sum, earning) => {
        return sum + (parseFloat(earning.amount) * parseFloat(earning.quote));
      }, 0);

      return {
        success: true,
        data: {
          earnings,
          period: {
            startDate,
            endDate,
          },
          totals: {
            count: earnings.length,
            totalAmount: earnings.reduce((sum, e) => sum + parseFloat(e.amount), 0),
            totalValueInCbrl,
          },
        },
        message: 'Proventos por período obtidos com sucesso',
      };
    } catch (error) {
      console.error('Erro ao obter proventos por período:', error);
      return {
        success: false,
        error: error.message,
        message: 'Erro ao obter proventos por período',
      };
    }
  }
}

module.exports = new EarningsService();
