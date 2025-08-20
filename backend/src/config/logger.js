const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');

// Criar diretório de logs se não existir
const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Formato customizado para logs estruturados
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Formato para console (desenvolvimento)
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` | ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

// Configuração dos transportes
const transports = [];

// Console (sempre ativo)
transports.push(
  new winston.transports.Console({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: consoleFormat
  })
);

// Arquivo combinado (todos os logs)
transports.push(
  new DailyRotateFile({
    filename: path.join(logDir, 'combined-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d',
    level: 'info',
    format: logFormat
  })
);

// Arquivo de erros
transports.push(
  new DailyRotateFile({
    filename: path.join(logDir, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '30d',
    level: 'error',
    format: logFormat
  })
);

// Arquivo de auditoria (transações e operações críticas)
transports.push(
  new DailyRotateFile({
    filename: path.join(logDir, 'audit-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '90d',
    level: 'info',
    format: logFormat
  })
);

// Arquivo de performance
transports.push(
  new DailyRotateFile({
    filename: path.join(logDir, 'performance-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '7d',
    level: 'info',
    format: logFormat
  })
);

// Criar logger principal
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: {
    service: 'coinage-api',
    version: process.env.APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  },
  transports,
  exitOnError: false
});

// Logger específico para auditoria
const auditLogger = winston.createLogger({
  level: 'info',
  format: logFormat,
  defaultMeta: {
    service: 'coinage-audit',
    type: 'audit'
  },
  transports: [
    new DailyRotateFile({
      filename: path.join(logDir, 'audit-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '90d',
      format: logFormat
    })
  ]
});

// Logger para performance
const performanceLogger = winston.createLogger({
  level: 'info',
  format: logFormat,
  defaultMeta: {
    service: 'coinage-performance',
    type: 'performance'
  },
  transports: [
    new DailyRotateFile({
      filename: path.join(logDir, 'performance-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '7d',
      format: logFormat
    })
  ]
});

// Logger para segurança
const securityLogger = winston.createLogger({
  level: 'info',
  format: logFormat,
  defaultMeta: {
    service: 'coinage-security',
    type: 'security'
  },
  transports: [
    new DailyRotateFile({
      filename: path.join(logDir, 'security-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
      format: logFormat
    }),
    new winston.transports.Console({
      level: 'warn',
      format: consoleFormat
    })
  ]
});

// Métodos auxiliares para logs estruturados
const createStructuredLog = (level, message, metadata = {}) => {
  return {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...metadata
  };
};

// Exportar loggers e utilitários
module.exports = {
  logger,
  auditLogger,
  performanceLogger,
  securityLogger,
  
  // Métodos de conveniência
  info: (message, meta = {}) => logger.info(message, meta),
  error: (message, meta = {}) => logger.error(message, meta),
  warn: (message, meta = {}) => logger.warn(message, meta),
  debug: (message, meta = {}) => logger.debug(message, meta),
  
  // Logs especializados
  audit: (action, details = {}) => {
    auditLogger.info('Audit Event', {
      action,
      ...details,
      auditId: require('crypto').randomUUID()
    });
  },
  
  performance: (operation, duration, details = {}) => {
    performanceLogger.info('Performance Metric', {
      operation,
      duration,
      ...details,
      performanceId: require('crypto').randomUUID()
    });
  },
  
  security: (event, details = {}) => {
    securityLogger.warn('Security Event', {
      event,
      ...details,
      securityId: require('crypto').randomUUID(),
      severity: details.severity || 'medium'
    });
  },
  
  // Log de requisição HTTP
  httpRequest: (req, res, responseTime) => {
    const meta = {
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      statusCode: res.statusCode,
      responseTime,
      contentLength: res.get('content-length'),
      referer: req.get('Referer'),
      userId: req.user?.id,
      companyId: req.user?.companyId
    };
    
    if (res.statusCode >= 400) {
      logger.warn('HTTP Request Failed', meta);
    } else {
      logger.info('HTTP Request', meta);
    }
  },
  
  // Log de transação blockchain
  blockchainTransaction: (action, txData) => {
    auditLogger.info('Blockchain Transaction', {
      action,
      txHash: txData.hash,
      from: txData.from,
      to: txData.to,
      value: txData.value,
      network: txData.network,
      gasUsed: txData.gasUsed,
      gasPrice: txData.gasPrice,
      blockNumber: txData.blockNumber,
      status: txData.status,
      transactionId: require('crypto').randomUUID()
    });
  },
  
  // Log de operação financeira
  financialOperation: (type, amount, details = {}) => {
    auditLogger.info('Financial Operation', {
      type, // 'deposit', 'withdrawal', 'transfer', 'exchange'
      amount,
      currency: details.currency || 'BRL',
      userId: details.userId,
      pixKey: details.pixKey,
      transactionId: details.transactionId,
      status: details.status || 'pending',
      fee: details.fee,
      operationId: require('crypto').randomUUID()
    });
  },
  
  // Log de erro estruturado
  errorLog: (error, context = {}) => {
    logger.error('Application Error', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      ...context,
      errorId: require('crypto').randomUUID()
    });
  },
  
  // Log de autenticação
  authEvent: (event, details = {}) => {
    securityLogger.info('Authentication Event', {
      event, // 'login', 'logout', 'register', 'failed_login', 'password_reset'
      userId: details.userId,
      email: details.email,
      ip: details.ip,
      userAgent: details.userAgent,
      success: details.success !== false,
      reason: details.reason,
      attemptCount: details.attemptCount,
      authId: require('crypto').randomUUID()
    });
  },
  
  // Log de email
  emailEvent: (event, details = {}) => {
    logger.info('Email Event', {
      event, // 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed'
      template: details.template,
      to: details.to,
      subject: details.subject,
      provider: details.provider,
      messageId: details.messageId,
      status: details.status,
      error: details.error,
      emailId: require('crypto').randomUUID()
    });
  },
  
  createStructuredLog
};

// Configurar manipuladores de erro global
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', {
    message: error.message,
    stack: error.stack,
    type: 'uncaughtException'
  });
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection', {
    reason: reason?.message || reason,
    stack: reason?.stack,
    promise: promise.toString(),
    type: 'unhandledRejection'
  });
});

console.log(`✅ Logger configurado - Logs salvos em: ${logDir}`);