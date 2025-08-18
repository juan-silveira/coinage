const prismaConfig = require('../config/prisma');

/**
 * Middleware para registrar logs de requisições
 */
const requestLogger = async (req, res, next) => {
  const startTime = Date.now();
  const originalSend = res.send;
  
  // Capturar dados da requisição
  const requestData = {
    method: req.method,
    path: req.path,
    query: Object.keys(req.query).length > 0 ? req.query : null,
    body: req.body && Object.keys(req.body).length > 0 ? req.body : null,
    headers: {
      'user-agent': req.get('User-Agent'),
      'content-type': req.get('Content-Type'),
      'accept': req.get('Accept'),
      'x-forwarded-for': req.get('X-Forwarded-For'),
      'x-real-ip': req.get('X-Real-IP')
    },
    ipAddress: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    companyId: req.company ? req.company.id : null
  };

  // Interceptar a resposta
  res.send = function(data) {
    const responseTime = Date.now() - startTime;
    const responseSize = Buffer.byteLength(data, 'utf8');
    
    // Determinar status code
    const statusCode = res.statusCode;
    
    // Determinar rede se disponível
    const network = req.query.network || req.body.network || null;
    
    // Capturar erro se houver
    let error = null;
    if (statusCode >= 400) {
      try {
        const responseData = JSON.parse(data);
        error = {
          message: responseData.message || 'Unknown error',
          error: responseData.error || 'UNKNOWN_ERROR',
          details: responseData.details || null
        };
      } catch (e) {
        error = {
          message: 'Error parsing response',
          error: 'PARSE_ERROR'
        };
      }
    }

    // Criar log da requisição
    createRequestLog({
      ...requestData,
      statusCode,
      responseTime,
      responseSize,
      error,
      network,
      metadata: {
        originalUrl: req.originalUrl,
        protocol: req.protocol,
        hostname: req.hostname,
        timestamp: new Date().toISOString()
      }
    }).catch(err => {
      console.error('Erro ao criar log da requisição:', err.message);
    });

    // Chamar o método original
    return originalSend.call(this, data);
  };

  next();
};

/**
 * Função para criar log da requisição
 */
const createRequestLog = async (logData) => {
  try {
    // Usar modelos globais se disponíveis
    if (global.models && global.models.RequestLog) {
      await global.models.RequestLog.create(logData);
    } else {
      // Fallback para instância local (para compatibilidade)
      const prisma = prismaConfig.getPrisma();
      const RequestLogModel = require('../models/RequestLog');
      const RequestLog = RequestLogModel(sequelize);
      await RequestLog.create(logData);
    }
  } catch (error) {
    console.error('Erro ao salvar log da requisição:', error.message);
  }
};

/**
 * Middleware para registrar transações blockchain
 */
const transactionLogger = async (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    // Verificar se é uma operação de contrato
    if (req.path.includes('/contracts') && req.method === 'POST') {
      let transactionType = 'contract_call';
      
      if (req.path.includes('/deploy')) {
        transactionType = 'contract_deploy';
      } else if (req.path.includes('/read')) {
        transactionType = 'contract_read';
      }
      
      createTransactionLog({
        companyId: req.company ? req.company.id : null,
        userId: req.user ? req.user.id : null,
        requestLogId: null,
        contractId: req.params.address || null,
        network: req.body.network || req.query.network || 'testnet',
        transactionType,
        status: 'pending',
        fromAddress: req.body.fromAddress || req.body.gasPayer || null,
        toAddress: req.params.address || req.body.contractAddress || null,
        functionName: req.body.functionName || null,
        functionParams: req.body.params || null,
        metadata: {
          contractAddress: req.params.address || req.body.contractAddress,
          functionName: req.body.functionName,
          params: req.body.params,
          gasPayer: req.body.gasPayer,
          amount: req.body.amount,
          toAddress: req.body.toAddress,
          fromAddress: req.body.fromAddress
        }
      }).catch(err => {
        console.error('Erro ao criar log de transação:', err.message);
      });
    }
    
    // Verificar se é uma operação de token
    if (req.path.includes('/tokens') && req.method === 'POST') {
      let transactionType = 'contract_call';
      let functionName = null;
      let functionParams = null;
      let fromAddress = null;
      let toAddress = null;
      let metadata = {
        contractAddress: req.body.contractAddress,
        gasPayer: req.body.gasPayer,
        network: req.body.network || 'testnet'
      };
      
      // Determinar tipo de operação baseado na rota
      if (req.path.includes('/mint')) {
        functionName = 'mint';
        toAddress = req.body.toAddress;
        functionParams = [req.body.toAddress, req.body.amount];
        metadata = {
          ...metadata,
          operation: 'mint',
          toAddress: req.body.toAddress,
          amount: req.body.amount,
          amountWei: null // Será preenchido pelo serviço
        };
      } else if (req.path.includes('/burn')) {
        functionName = 'burnFrom';
        fromAddress = req.body.fromAddress;
        functionParams = [req.body.fromAddress, req.body.amount];
        metadata = {
          ...metadata,
          operation: 'burn',
          fromAddress: req.body.fromAddress,
          amount: req.body.amount,
          amountWei: null // Será preenchido pelo serviço
        };
      } else if (req.path.includes('/transfer')) {
        functionName = 'transferFromGasless';
        fromAddress = req.body.fromAddress;
        toAddress = req.body.toAddress;
        functionParams = [req.body.fromAddress, req.body.toAddress, req.body.amount];
        metadata = {
          ...metadata,
          operation: 'transfer',
          fromAddress: req.body.fromAddress,
          toAddress: req.body.toAddress,
          amount: req.body.amount,
          amountWei: null // Será preenchido pelo serviço
        };
      }
      
      createTransactionLog({
        companyId: req.company ? req.company.id : null,
        userId: req.user ? req.user.id : null,
        requestLogId: null,
        contractId: null, // Será preenchido se necessário
        network: req.body.network || 'testnet',
        transactionType,
        status: 'pending',
        fromAddress: fromAddress || req.body.gasPayer,
        toAddress: toAddress || req.body.contractAddress,
        functionName,
        functionParams,
        metadata
      }).catch(err => {
        console.error('Erro ao criar log de transação:', err.message);
      });
    }
    
    return originalSend.call(this, data);
  };
  
  next();
};

/**
 * Função para criar log de transação
 */
const createTransactionLog = async (transactionData) => {
  try {
    const prisma = prismaConfig.getPrisma();
    const TransactionModel = require('../models/Transaction');
    const Transaction = TransactionModel(sequelize);
    
    await Transaction.create(transactionData);
  } catch (error) {
    console.error('Erro ao salvar log de transação:', error.message);
  }
};

/**
 * Middleware para atualizar transações com dados da blockchain
 */
const updateTransactionLog = async (transactionId, updateData) => {
  try {
    const prisma = prismaConfig.getPrisma();
    const TransactionModel = require('../models/Transaction');
    const Transaction = TransactionModel(sequelize);
    
    const transaction = await Transaction.findByPk(transactionId);
    if (transaction) {
      await transaction.update(updateData);
    }
  } catch (error) {
    console.error('Erro ao atualizar log de transação:', error.message);
  }
};

/**
 * Middleware para log de erros
 */
const errorLogger = (err, req, res, next) => {
  const errorData = {
    method: req.method,
    path: req.path,
    companyId: req.company ? req.company.id : null,
    error: {
      message: err.message,
      stack: err.stack,
      name: err.name,
      code: err.code
    },
    statusCode: err.status || 500,
    responseTime: Date.now() - (req.startTime || Date.now()),
    network: req.query.network || req.body.network || null,
    metadata: {
      originalUrl: req.originalUrl,
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip || req.connection.remoteAddress,
      timestamp: new Date().toISOString()
    }
  };

  // Criar log do erro
  createRequestLog(errorData).catch(logErr => {
    console.error('Erro ao salvar log de erro:', logErr.message);
  });

  next(err);
};

/**
 * Middleware para log de performance
 */
const performanceLogger = (req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    
    // Log de performance para requisições lentas (> 1 segundo)
    if (responseTime > 1000) {
      console.warn(`Requisição lenta detectada: ${req.method} ${req.path} - ${responseTime}ms`);
    }
    
    // Log de performance para requisições muito lentas (> 5 segundos)
    if (responseTime > 5000) {
      console.error(`Requisição muito lenta: ${req.method} ${req.path} - ${responseTime}ms`);
    }
  });
  
  next();
};

/**
 * Função para obter estatísticas de logs
 */
const getLogStats = async (options = {}) => {
  try {
    // Usar modelos globais se disponíveis
    if (global.models && global.models.RequestLog && global.models.Transaction) {
      const requestStats = await global.models.RequestLog.getStats(options);
      const transactionStats = await global.models.Transaction.getStats(options);
      
      return {
        requests: requestStats[0] || {},
        transactions: transactionStats[0] || {}
      };
    } else {
      // Fallback para instância local (para compatibilidade)
      const prisma = prismaConfig.getPrisma();
      const RequestLogModel = require('../models/RequestLog');
      const TransactionModel = require('../models/Transaction');
      
      const RequestLog = RequestLogModel(sequelize);
      const Transaction = TransactionModel(sequelize);
      
      const requestStats = await RequestLog.getStats(options);
      const transactionStats = await Transaction.getStats(options);
      
      return {
        requests: requestStats[0] || {},
        transactions: transactionStats[0] || {}
      };
    }
  } catch (error) {
    console.error('Erro ao obter estatísticas de logs:', error.message);
    throw error;
  }
};

/**
 * Função para limpar logs antigos
 */
const cleanupOldLogs = async (daysToKeep = 30) => {
  try {
    const prisma = prismaConfig.getPrisma();
    const RequestLogModel = require('../models/RequestLog');
    const TransactionModel = require('../models/Transaction');
    
    const RequestLog = RequestLogModel(sequelize);
    const Transaction = TransactionModel(sequelize);
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    // Limpar logs de requisições antigas
    const deletedRequests = await RequestLog.destroy({
      where: {
        createdAt: {
          [sequelize.Op.lt]: cutoffDate
        }
      }
    });
    
    // Limpar transações antigas (apenas as confirmadas ou falhadas)
    const deletedTransactions = await Transaction.destroy({
      where: {
        createdAt: {
          [sequelize.Op.lt]: cutoffDate
        },
        status: {
          [sequelize.Op.in]: ['confirmed', 'failed', 'cancelled']
        }
      }
    });
    
    // Log silencioso - sem console.log

    return {
      deletedRequests,
      deletedTransactions
    };
  } catch (error) {
    console.error('Erro ao limpar logs antigos:', error.message);
    throw error;
  }
};

module.exports = {
  requestLogger,
  transactionLogger,
  updateTransactionLog,
  errorLogger,
  performanceLogger,
  getLogStats,
  cleanupOldLogs
}; 