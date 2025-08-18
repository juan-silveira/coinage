const prismaConfig = require('../config/prisma');
const { Op } = require('sequelize');

class LogService {
  constructor() {
    this.RequestLog = null;
    this.Transaction = null;
    this.Company = null;
    this.sequelize = null;
  }

  async initialize() {
    try {
      // Aguardar até que os modelos globais estejam disponíveis
      let attempts = 0;
      while (!global.models && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
      
      if (!global.models) {
        throw new Error('Modelos não foram inicializados');
      }
      
      this.sequelize = global.sequelize;
      this.RequestLog = global.models.RequestLog;
      this.Transaction = global.models.Transaction;
      this.Company = global.models.Company;
      console.log('✅ Serviço de logs inicializado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao inicializar serviço de logs:', error.message);
      throw error;
    }
  }

  /**
   * Obtém estatísticas de requests de um company
   */
  async getCompanyRequestsStats(companyId, period = 'day') {
    try {
      const company = await this.Company.findByPk(companyId);
      if (!company) {
        throw new Error('Company não encontrado');
      }

      // Calcular data de início baseada no período
      const startDate = new Date();
      switch (period) {
        case 'day':
          startDate.setDate(startDate.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        default:
          startDate.setDate(startDate.getDate() - 1);
      }

      // Total de requests no período
      const totalRequests = await this.RequestLog.count({
        where: {
          companyId,
          created_at: {
            [Op.gte]: startDate
          }
        }
      });

      // Requests por status
      const successRequests = await this.RequestLog.count({
        where: {
          companyId,
          statusCode: {
            [Op.between]: [200, 299]
          },
          created_at: {
            [Op.gte]: startDate
          }
        }
      });

      const errorRequests = await this.RequestLog.count({
        where: {
          companyId,
          statusCode: {
            [Op.gte]: 400
          },
          created_at: {
            [Op.gte]: startDate
          }
        }
      });

      // Requests por método HTTP
      const methodStats = await this.RequestLog.findAll({
        where: {
          companyId,
          created_at: {
            [Op.gte]: startDate
          }
        },
        attributes: [
          'method',
          [this.sequelize.fn('COUNT', '*'), 'count']
        ],
        group: ['method'],
        order: [[this.sequelize.fn('COUNT', '*'), 'DESC']]
      });

      // Requests por endpoint
      const endpointStats = await this.RequestLog.findAll({
        where: {
          companyId,
          created_at: {
            [Op.gte]: startDate
          }
        },
        attributes: [
          'path',
          [this.sequelize.fn('COUNT', '*'), 'count'],
          [this.sequelize.fn('AVG', this.sequelize.col('response_time')), 'avgResponseTime']
        ],
        group: ['path'],
        order: [[this.sequelize.fn('COUNT', '*'), 'DESC']],
        limit: 10
      });

      // Tempo médio de resposta
      const avgResponseTime = await this.RequestLog.findOne({
        where: {
          companyId,
          created_at: {
            [Op.gte]: startDate
          }
        },
        attributes: [
          [this.sequelize.fn('AVG', this.sequelize.col('response_time')), 'avgResponseTime']
        ]
      });

      // Requests por hora (últimas 24 horas)
      const hourlyStats = await this.RequestLog.findAll({
        where: {
          companyId,
          created_at: {
            [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        },
        attributes: [
          [this.sequelize.fn('DATE_TRUNC', 'hour', this.sequelize.col('created_at')), 'hour'],
          [this.sequelize.fn('COUNT', '*'), 'count']
        ],
        group: [this.sequelize.fn('DATE_TRUNC', 'hour', this.sequelize.col('created_at'))],
        order: [[this.sequelize.fn('DATE_TRUNC', 'hour', this.sequelize.col('created_at')), 'ASC']]
      });

      return {
        success: true,
        message: 'Estatísticas de requests obtidas com sucesso',
        data: {
          company: {
            id: company.id,
            name: company.name
          },
          period,
          summary: {
            total: totalRequests,
            success: successRequests,
            errors: errorRequests,
            successRate: totalRequests > 0 ? ((successRequests / totalRequests) * 100).toFixed(2) : 0,
            avgResponseTime: avgResponseTime ? parseFloat(avgResponseTime.getDataValue('avgResponseTime')).toFixed(2) : 0
          },
          methods: methodStats.map(stat => ({
            method: stat.method,
            count: parseInt(stat.getDataValue('count'))
          })),
          topEndpoints: endpointStats.map(stat => ({
            path: stat.path,
            count: parseInt(stat.getDataValue('count')),
            avgResponseTime: parseFloat(stat.getDataValue('avgResponseTime')).toFixed(2)
          })),
          hourly: hourlyStats.map(stat => ({
            hour: stat.getDataValue('hour'),
            count: parseInt(stat.getDataValue('count'))
          }))
        }
      };
    } catch (error) {
      throw new Error(`Erro ao obter estatísticas de requests: ${error.message}`);
    }
  }

  /**
   * Lista logs de requisições
   */
  async listRequestLogs(options = {}) {
    try {
      const {
        page = 1,
        limit = 50,
        companyId,
        resourceType,
        statusCode,
        startDate,
        endDate,
        search
      } = options;

      const offset = (page - 1) * limit;
      const where = {};

      if (companyId) where.companyId = companyId;
      if (resourceType) where.resourceType = resourceType;
      if (statusCode) where.statusCode = statusCode;

      if (startDate || endDate) {
        where.created_at = {};
        if (startDate) where.created_at.$gte = new Date(startDate);
        if (endDate) where.created_at.$lte = new Date(endDate);
      }

      if (search) {
        where[Op.or] = [
          { path: { [Op.iLike]: `%${search}%` } },
          { ipAddress: { [Op.iLike]: `%${search}%` } },
          { userAgent: { [Op.iLike]: `%${search}%` } }
        ];
      }

      const { count, rows } = await this.RequestLog.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['created_at', 'DESC']]
      });

      return {
        success: true,
        message: 'Logs de requisições listados com sucesso',
        data: {
          logs: rows.map(log => log.getFormattedResponse()),
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count,
            pages: Math.ceil(count / limit)
          }
        }
      };
    } catch (error) {
      throw new Error(`Erro ao listar logs de requisições: ${error.message}`);
    }
  }

  /**
   * Lista transações
   */
  async listTransactions(options = {}) {
    try {
      const {
        page = 1,
        limit = 50,
        companyId,
        status,
        network,
        transactionType,
        startDate,
        endDate
      } = options;

      const offset = (page - 1) * limit;
      const where = {};

      if (companyId) where.companyId = companyId;
      if (status) where.status = status;
      if (network) where.network = network;
      if (transactionType) where.transactionType = transactionType;

      if (startDate || endDate) {
        where.created_at = {};
        if (startDate) where.created_at.$gte = new Date(startDate);
        if (endDate) where.created_at.$lte = new Date(endDate);
      }

      const { count, rows } = await this.Transaction.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['created_at', 'DESC']]
      });

      return {
        success: true,
        message: 'Transações listadas com sucesso',
        data: {
          transactions: rows.map(tx => tx.getFormattedResponse()),
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count,
            pages: Math.ceil(count / limit)
          }
        }
      };
    } catch (error) {
      throw new Error(`Erro ao listar transações: ${error.message}`);
    }
  }

  /**
   * Obtém estatísticas de logs
   */
  async getLogStats(options = {}) {
    try {
      const {
        startDate,
        endDate,
        companyId,
        network,
        resourceType,
        transactionType
      } = options;

      // Estatísticas de requisições
      const requestStats = await this.RequestLog.getStats({
        startDate,
        endDate,
        companyId,
        resourceType
      });

      // Estatísticas de transações
      const transactionStats = await this.Transaction.getStats({
        startDate,
        endDate,
        companyId,
        network,
        transactionType
      });

      // Estatísticas por método HTTP
      const methodStats = await this.RequestLog.getMethodStats({
        startDate,
        endDate,
        companyId
      });

      // Estatísticas por tipo de recurso
      const resourceTypeStats = await this.RequestLog.getResourceTypeStats({
        startDate,
        endDate,
        companyId
      });

      // Estatísticas por status de transação
      const transactionStatusStats = await this.Transaction.getStatusStats({
        startDate,
        endDate,
        companyId,
        network
      });

      // Estatísticas por tipo de transação
      const transactionTypeStats = await this.Transaction.getTypeStats({
        startDate,
        endDate,
        companyId,
        network
      });

      return {
        success: true,
        message: 'Estatísticas obtidas com sucesso',
        data: {
          requests: requestStats[0] || {},
          transactions: transactionStats[0] || {},
          methodStats,
          resourceTypeStats,
          transactionStatusStats,
          transactionTypeStats
        }
      };
    } catch (error) {
      throw new Error(`Erro ao obter estatísticas: ${error.message}`);
    }
  }

  /**
   * Obtém logs de erro
   */
  async getErrorLogs(options = {}) {
    try {
      const { page = 1, limit = 50, startDate, endDate } = options;
      const offset = (page - 1) * limit;

      const { count, rows } = await this.RequestLog.findErrors({
        page: parseInt(page),
        limit: parseInt(limit),
        startDate,
        endDate
      });

      return {
        success: true,
        message: 'Logs de erro obtidos com sucesso',
        data: {
          errors: rows.map(log => log.getFormattedResponse()),
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count,
            pages: Math.ceil(count / limit)
          }
        }
      };
    } catch (error) {
      throw new Error(`Erro ao obter logs de erro: ${error.message}`);
    }
  }

  /**
   * Obtém transações pendentes
   */
  async getPendingTransactions(options = {}) {
    try {
      const { network, limit = 100 } = options;

      const transactions = await this.Transaction.findPending({
        network,
        limit: parseInt(limit)
      });

      return {
        success: true,
        message: 'Transações pendentes obtidas com sucesso',
        data: {
          transactions: transactions.map(tx => tx.getFormattedResponse()),
          count: transactions.length
        }
      };
    } catch (error) {
      throw new Error(`Erro ao obter transações pendentes: ${error.message}`);
    }
  }

  /**
   * Obtém transação por hash
   */
  async getTransactionByHash(txHash) {
    try {
      const transaction = await this.Transaction.findByTxHash(txHash);
      
      if (!transaction) {
        throw new Error('Transação não encontrada');
      }

      return {
        success: true,
        message: 'Transação encontrada com sucesso',
        data: transaction.getFormattedResponse()
      };
    } catch (error) {
      throw new Error(`Erro ao obter transação: ${error.message}`);
    }
  }

  /**
   * Atualiza status de transação
   */
  async updateTransactionStatus(transactionId, status, additionalData = {}) {
    try {
      const transaction = await this.Transaction.findByPk(transactionId);
      
      if (!transaction) {
        throw new Error('Transação não encontrada');
      }

      await transaction.updateStatus(status, additionalData);

      return {
        success: true,
        message: 'Status da transação atualizado com sucesso',
        data: transaction.getFormattedResponse()
      };
    } catch (error) {
      throw new Error(`Erro ao atualizar status da transação: ${error.message}`);
    }
  }

  /**
   * Limpa logs antigos
   */
  async cleanupOldLogs(daysToKeep = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      // Limpar logs de requisições antigas
      const deletedRequests = await this.RequestLog.destroy({
        where: {
          created_at: {
            [Op.lt]: cutoffDate
          }
        }
      });

      // Limpar transações antigas (apenas as confirmadas ou falhadas)
      const deletedTransactions = await this.Transaction.destroy({
        where: {
          created_at: {
            [Op.lt]: cutoffDate
          },
          status: {
            [Op.in]: ['confirmed', 'failed', 'cancelled']
          }
        }
      });

      return {
        success: true,
        message: 'Limpeza de logs concluída com sucesso',
        data: {
          deletedRequests,
          deletedTransactions,
          cutoffDate: cutoffDate.toISOString()
        }
      };
    } catch (error) {
      throw new Error(`Erro ao limpar logs antigos: ${error.message}`);
    }
  }

  /**
   * Exporta logs para análise
   */
  async exportLogs(options = {}) {
    try {
      const {
        startDate,
        endDate,
        companyId,
        network,
        format = 'json'
      } = options;

      const where = {};

      if (startDate || endDate) {
        where.created_at = {};
        if (startDate) where.created_at.$gte = new Date(startDate);
        if (endDate) where.created_at.$lte = new Date(endDate);
      }

      if (companyId) where.companyId = companyId;
      if (network) where.network = network;

      const requestLogs = await this.RequestLog.findAll({
        where,
        order: [['created_at', 'DESC']]
      });

      const transactions = await this.Transaction.findAll({
        where,
        order: [['created_at', 'DESC']]
      });

      const exportData = {
        exportDate: new Date().toISOString(),
        filters: options,
        requestLogs: requestLogs.map(log => log.getFormattedResponse()),
        transactions: transactions.map(tx => tx.getFormattedResponse()),
        summary: {
          totalRequests: requestLogs.length,
          totalTransactions: transactions.length,
          dateRange: {
            start: startDate,
            end: endDate
          }
        }
      };

      return {
        success: true,
        message: 'Logs exportados com sucesso',
        data: exportData
      };
    } catch (error) {
      throw new Error(`Erro ao exportar logs: ${error.message}`);
    }
  }

  /**
   * Obtém logs de requisições de um usuário específico
   */
  async getUserLogs(options = {}) {
    try {
      const { userId, page = 1, limit = 50, resourceType, statusCode, startDate, endDate } = options;
      const offset = (page - 1) * limit;
      
      const where = { userId };
      
      if (resourceType) where.resourceType = resourceType;
      if (statusCode) where.statusCode = statusCode;
      if (startDate || endDate) {
        where.created_at = {};
        if (startDate) where.created_at[Op.gte] = new Date(startDate);
        if (endDate) where.created_at[Op.lte] = new Date(endDate);
      }
      
      const { count, rows } = await this.RequestLog.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['created_at', 'DESC']],
        include: [
          { model: this.Company, as: 'company', attributes: ['id', 'name'] },
          { model: global.models.User, as: 'user', attributes: ['id', 'name', 'email'] }
        ]
      });
      
      return {
        success: true,
        message: 'Logs do usuário obtidos com sucesso',
        data: {
          logs: rows,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count,
            pages: Math.ceil(count / limit)
          }
        }
      };
    } catch (error) {
      console.error('Erro ao obter logs do usuário:', error);
      return {
        success: false,
        message: 'Erro ao obter logs do usuário',
        error: error.message
      };
    }
  }

  /**
   * Obtém transações de um usuário específico
   */
  async getUserTransactions(options = {}) {
    try {
      const { userId, page = 1, limit = 50, status, network, transactionType, startDate, endDate } = options;
      const offset = (page - 1) * limit;
      
      const where = { userId };
      
      if (status) where.status = status;
      if (network) where.network = network;
      if (transactionType) where.transactionType = transactionType;
      if (startDate || endDate) {
        where.created_at = {};
        if (startDate) where.created_at[Op.gte] = new Date(startDate);
        if (endDate) where.created_at[Op.lte] = new Date(endDate);
      }
      
      const { count, rows } = await this.Transaction.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['created_at', 'DESC']],
        include: [
          { model: this.Company, as: 'company', attributes: ['id', 'name'] },
          { model: global.models.User, as: 'user', attributes: ['id', 'name', 'email'] }
        ]
      });
      
      return {
        success: true,
        message: 'Transações do usuário obtidas com sucesso',
        data: {
          transactions: rows,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count,
            pages: Math.ceil(count / limit)
          }
        }
      };
    } catch (error) {
      console.error('Erro ao obter transações do usuário:', error);
      return {
        success: false,
        message: 'Erro ao obter transações do usuário',
        error: error.message
      };
    }
  }

  /**
   * Obtém estatísticas de um usuário específico
   */
  async getUserStats(options = {}) {
    try {
      const { userId, startDate, endDate, network, resourceType, transactionType } = options;
      
      const where = { userId };
      
      if (startDate || endDate) {
        where.created_at = {};
        if (startDate) where.created_at[this.sequelize.Sequelize.Op.gte] = new Date(startDate);
        if (endDate) where.created_at[this.sequelize.Sequelize.Op.lte] = new Date(endDate);
      }
      
      // Estatísticas de requisições
      const requestStats = await this.RequestLog.findAll({
        where,
        attributes: [
          [this.sequelize.fn('COUNT', this.sequelize.col('id')), 'totalRequests'],
          [this.sequelize.fn('AVG', this.sequelize.col('response_time')), 'avgResponseTime'],
          [this.sequelize.fn('COUNT', this.sequelize.literal('CASE WHEN status_code >= 400 THEN 1 ELSE NULL END')), 'errorCount'],
          [this.sequelize.fn('COUNT', this.sequelize.literal('CASE WHEN status_code < 400 THEN 1 ELSE NULL END')), 'successCount']
        ],
        raw: true
      });
      
      // Estatísticas de transações
      const transactionWhere = { userId };
      if (network) transactionWhere.network = network;
      if (transactionType) transactionWhere.transactionType = transactionType;
      if (startDate || endDate) {
        transactionWhere.created_at = {};
        if (startDate) transactionWhere.created_at[this.sequelize.Sequelize.Op.gte] = new Date(startDate);
        if (endDate) transactionWhere.created_at[this.sequelize.Sequelize.Op.lte] = new Date(endDate);
      }
      
      const transactionStats = await this.Transaction.findAll({
        where: transactionWhere,
        attributes: [
          [this.sequelize.fn('COUNT', this.sequelize.col('id')), 'totalTransactions'],
          [this.sequelize.fn('COUNT', this.sequelize.literal('CASE WHEN status = \'confirmed\' THEN 1 ELSE NULL END')), 'confirmedCount'],
          [this.sequelize.fn('COUNT', this.sequelize.literal('CASE WHEN status = \'pending\' THEN 1 ELSE NULL END')), 'pendingCount'],
          [this.sequelize.fn('COUNT', this.sequelize.literal('CASE WHEN status = \'failed\' THEN 1 ELSE NULL END')), 'failedCount']
        ],
        raw: true
      });
      
      return {
        success: true,
        message: 'Estatísticas do usuário obtidas com sucesso',
        data: {
          requests: requestStats[0] || {
            totalRequests: 0,
            avgResponseTime: 0,
            errorCount: 0,
            successCount: 0
          },
          transactions: transactionStats[0] || {
            totalTransactions: 0,
            confirmedCount: 0,
            pendingCount: 0,
            failedCount: 0
          }
        }
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas do usuário:', error);
      return {
        success: false,
        message: 'Erro ao obter estatísticas do usuário',
        error: error.message
      };
    }
  }

  /**
   * Testa o serviço de logs
   */
  async testService() {
    try {
      // Buscar um empresa real para o teste
      const testCompany = await this.Company.findOne({
        where: { isActive: true }
      });
      
      if (!testCompany) {
        throw new Error('Nenhum empresa ativo encontrado para o teste');
      }

      // Teste de criação de log de requisição
      const testRequestLog = await this.RequestLog.create({
        companyId: testCompany.id,
        method: 'GET',
        path: '/api/test',
        statusCode: 200,
        response_time: 150,
        ipAddress: '127.0.0.1',
        userAgent: 'Test Agent'
      });

      // Teste de criação de transação
      const testTransaction = await this.Transaction.create({
        companyId: testCompany.id,
        network: 'testnet',
        transactionType: 'contract_call',
        status: 'pending',
        fromAddress: '0x1234567890123456789012345678901234567890',
        toAddress: '0xabcdef1234567890abcdef1234567890abcdef12'
      });

      // Teste de busca
      const foundLog = await this.RequestLog.findByPk(testRequestLog.id);
      const foundTx = await this.Transaction.findByPk(testTransaction.id);

      // Teste de estatísticas
      const stats = await this.getLogStats();

      // Limpar dados de teste
      await testRequestLog.destroy();
      await testTransaction.destroy();

      return {
        success: true,
        message: 'Teste do serviço de logs realizado com sucesso',
        data: {
          requestLogCreated: true,
          transactionCreated: true,
          requestLogFound: true,
          transactionFound: true,
          statsRetrieved: true,
          testDataCleaned: true
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Falha no teste do serviço de logs',
        error: error.message,
        data: {
          success: false,
          error: error.message
        }
      };
    }
  }
}

module.exports = new LogService(); 