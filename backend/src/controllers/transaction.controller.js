const transactionService = require('../services/transaction.service');
const queueService = require('../services/queue.service');

/**
 * Controller para gerenciamento de transações da blockchain
 */
class TransactionController {
  /**
   * Obtém transações de uma empresa
   */
  async getTransactionsByCompany(req, res) {
    try {
      const { page = 1, limit = 50, status, network, transactionType, tokenSymbol, startDate, endDate } = req.query;
      const userId = req.user.id;

      console.log('🔍 [TransactionController] Buscar transações:', {
        userId,
        filters: { page, limit, status, network, transactionType, tokenSymbol, startDate, endDate }
      });

      if (!userId) {
        console.error('❌ [TransactionController] UserID não encontrado');
        return res.status(400).json({
          success: false,
          message: 'ID do usuário não encontrado'
        });
      }

      console.log('🔍 [TransactionController] Chamando transactionService.getTransactionsByUser...');
      
      const result = await transactionService.getTransactionsByUser(userId, {
        page: parseInt(page),
        limit: parseInt(limit),
        status,
        network,
        transactionType,
        tokenSymbol,
        startDate,
        endDate
      });

      console.log('🔍 [TransactionController] Result obtido:', {
        count: result.count,
        rowsLength: result.rows?.length,
        firstRow: result.rows?.[0] ? Object.keys(result.rows[0]) : null
      });

      // Use a custom JSON.stringify to handle BigInt values
      const responseData = {
        success: true,
        message: 'Transações obtidas com sucesso',
        data: {
          transactions: result.rows.map(tx => tx.getFormattedResponse()),
          pagination: {
            total: result.count,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(result.count / parseInt(limit))
          }
        }
      };

      // Send response with comprehensive BigInt handling
      res.setHeader('Content-Type', 'application/json');
      
      // Use a more comprehensive replacer function
      const bigIntReplacer = (key, value) => {
        if (typeof value === 'bigint') {
          return value.toString();
        }
        if (value && typeof value === 'object') {
          // Handle nested objects that might have BigInt
          for (const prop in value) {
            if (typeof value[prop] === 'bigint') {
              value[prop] = value[prop].toString();
            }
          }
        }
        return value;
      };
      
      const responseString = JSON.stringify(responseData, bigIntReplacer);
      res.status(200).send(responseString);
    } catch (error) {
      console.error('❌ [TransactionController] Erro ao buscar transações:', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id
      });
      res.status(400).json({
        success: false,
        message: 'Erro ao obter transações',
        error: error.message
      });
    }
  }

  /**
   * Obtém uma transação específica por hash
   */
  async getTransactionByHash(req, res) {
    try {
      const { txHash } = req.params;

      if (!txHash) {
        return res.status(400).json({
          success: false,
          message: 'Hash da transação é obrigatório'
        });
      }

      const transaction = await transactionService.getTransactionByHash(txHash);

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Transação não encontrada'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Transação obtida com sucesso',
        data: transaction.getFormattedResponse()
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao obter transação',
        error: error.message
      });
    }
  }

  /**
   * Obtém estatísticas de transações
   */
  async getTransactionStats(req, res) {
    try {
      const { startDate, endDate, network } = req.query;
      const companyId = req.company?.id;

      const stats = await transactionService.getTransactionStats({
        startDate,
        endDate,
        companyId,
        network
      });

      res.status(200).json({
        success: true,
        message: 'Estatísticas obtidas com sucesso',
        data: stats[0] || {
          totalTransactions: 0,
          confirmedCount: 0,
          pendingCount: 0,
          failedCount: 0,
          totalGasCost: 0,
          avgGasUsed: 0
        }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao obter estatísticas',
        error: error.message
      });
    }
  }

  /**
   * Obtém estatísticas por status
   */
  async getStatusStats(req, res) {
    try {
      const { startDate, endDate, network } = req.query;
      const companyId = req.company?.id;

      const stats = await transactionService.getStatusStats({
        startDate,
        endDate,
        companyId,
        network
      });

      res.status(200).json({
        success: true,
        message: 'Estatísticas por status obtidas com sucesso',
        data: stats
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao obter estatísticas por status',
        error: error.message
      });
    }
  }

  /**
   * Obtém estatísticas por tipo de transação
   */
  async getTypeStats(req, res) {
    try {
      const { startDate, endDate, network } = req.query;
      const companyId = req.company?.id;

      const stats = await transactionService.getTypeStats({
        startDate,
        endDate,
        companyId,
        network
      });

      res.status(200).json({
        success: true,
        message: 'Estatísticas por tipo obtidas com sucesso',
        data: stats
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao obter estatísticas por tipo',
        error: error.message
      });
    }
  }

  /**
   * Testa o serviço de transações
   */
  async testService(req, res) {
    try {
      const result = await transactionService.testService();
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao testar serviço de transações',
        error: error.message
      });
    }
  }

  /**
   * Enfileira uma transação da blockchain
   */
  async enqueueBlockchainTransaction(req, res) {
    try {
      const { type, data } = req.body;
      const companyId = req.company?.id;
      const userId = req.user?.id;

      if (!type || !data) {
        return res.status(400).json({
          success: false,
          message: 'Tipo e dados da transação são obrigatórios'
        });
      }

      // Adicionar informações da empresa e usuário aos dados da transação
      const transactionData = {
        ...data,
        companyId,
        userId,
        type,
        timestamp: new Date().toISOString()
      };

      // Enfileirar a transação
      const result = await queueService.enqueueBlockchainTransaction(transactionData);

      // Obter dados de rate limit do middleware
      const rateLimitKey = `transaction_rate_limit:${companyId}`;
      const rateLimitData = req.rateLimitData?.[rateLimitKey];

      res.status(200).json({
        success: true,
        message: 'Transação enfileirada com sucesso',
        data: {
          jobId: result.jobId,
          status: result.status,
          type,
          timestamp: new Date().toISOString(),
          estimatedProcessingTime: '5-15 segundos',
          rateLimit: rateLimitData ? {
            limit: 10,
            remaining: rateLimitData.remaining,
            resetTime: new Date(rateLimitData.resetTime).toISOString()
          } : undefined
        }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao enfileirar transação',
        error: error.message
      });
    }
  }

  /**
   * Obtém o status de uma transação enfileirada
   */
  async getQueuedTransactionStatus(req, res) {
    try {
      const { jobId } = req.params;

      if (!jobId) {
        return res.status(400).json({
          success: false,
          message: 'Job ID é obrigatório'
        });
      }

      const status = queueService.getJobStatus(jobId);

      res.status(200).json({
        success: true,
        message: 'Status da transação obtido com sucesso',
        data: {
          jobId,
          status,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao obter status da transação',
        error: error.message
      });
    }
  }

  /**
   * Obtém o status de múltiplas transações enfileiradas
   */
  async getMultipleQueuedTransactionStatus(req, res) {
    try {
      const { jobIds } = req.body;

      if (!jobIds || !Array.isArray(jobIds) || jobIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Lista de Job IDs é obrigatória'
        });
      }

      // Limitar a 20 jobs por vez para evitar sobrecarga
      if (jobIds.length > 20) {
        return res.status(400).json({
          success: false,
          message: 'Máximo 20 Job IDs por requisição'
        });
      }

      const results = [];
      for (const jobId of jobIds) {
        try {
          const status = queueService.getJobStatus(jobId);
          results.push({
            jobId,
            status,
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          results.push({
            jobId,
            status: 'error',
            error: error.message,
            timestamp: new Date().toISOString()
          });
        }
      }

      // Calcular estatísticas
      const stats = {
        total: results.length,
        completed: results.filter(r => r.status === 'completed').length,
        processing: results.filter(r => r.status === 'processing').length,
        failed: results.filter(r => r.status === 'failed').length,
        queued: results.filter(r => r.status === 'queued').length
      };

      res.status(200).json({
        success: true,
        message: 'Status das transações obtido com sucesso',
        data: {
          results,
          stats,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao obter status das transações',
        error: error.message
      });
    }
  }
}

module.exports = new TransactionController(); 