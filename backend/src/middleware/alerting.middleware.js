/**
 * Middleware de Alertas
 * Integra o sistema de alertas com requests HTTP
 */

const alertingService = require('../services/alerting.service');
const logger = require('../config/logger');

/**
 * Middleware para rastrear performance e erros
 */
const performanceMonitoring = (req, res, next) => {
  const startTime = Date.now();

  // Interceptar o final da resposta
  const originalSend = res.send;
  res.send = function(data) {
    const responseTime = Date.now() - startTime;
    
    // Rastrear requests lentos
    alertingService.trackSlowRequest(req, responseTime);
    
    // Log de performance
    if (responseTime > 1000) {
      logger.warn('Slow request', {
        method: req.method,
        url: req.url,
        responseTime,
        status: res.statusCode,
        userAgent: req.get('user-agent'),
        ip: req.ip
      });
    }

    return originalSend.call(this, data);
  };

  next();
};

/**
 * Middleware para capturar erros não tratados
 */
const errorTracking = (error, req, res, next) => {
  // Rastrear erro no sistema de alertas
  alertingService.trackError(error, {
    method: req.method,
    url: req.url,
    userAgent: req.get('user-agent'),
    ip: req.ip,
    body: req.body,
    params: req.params,
    query: req.query
  });

  // Log do erro
  logger.error('HTTP Error caught by alerting middleware', {
    error: error.message,
    stack: error.stack,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });

  // Passar erro adiante
  next(error);
};

/**
 * Middleware específico para rastrear tentativas de login
 */
const loginTracking = (req, res, next) => {
  // Interceptar resposta
  const originalJson = res.json;
  res.json = function(data) {
    // Se é uma tentativa de login falhada
    if (req.path.includes('/login') || req.path.includes('/auth')) {
      if (data && data.success === false) {
        const email = req.body?.email || 'unknown';
        const reason = data.message || 'Authentication failed';
        
        alertingService.trackFailedLogin(email, req.ip, reason);
      }
    }

    return originalJson.call(this, data);
  };

  next();
};

/**
 * Middleware para rastrear erros de banco de dados
 */
const databaseErrorTracking = (error, req, res, next) => {
  // Verificar se é erro de database
  if (error.code || error.name === 'PrismaClientKnownRequestError' || 
      error.name === 'PrismaClientUnknownRequestError' ||
      error.message.includes('database') ||
      error.message.includes('connection')) {
    
    alertingService.trackDatabaseError(error, req.body?.query);
  }

  next(error);
};

/**
 * Middleware para monitorar rate limiting
 */
const rateLimitMonitoring = (req, res, next) => {
  // Se rate limit foi atingido
  if (res.statusCode === 429) {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      url: req.url,
      method: req.method,
      userAgent: req.get('user-agent'),
      rateLimitInfo: req.rateLimitData
    });

    // Alertar se muitos rate limits em pouco tempo
    const rateLimitKey = `rate_limit_${req.ip}`;
    // Usar counter interno do alerting service
    alertingService.trackError(new Error('Rate limit exceeded'), {
      type: 'RATE_LIMIT',
      ip: req.ip,
      url: req.url,
      method: req.method
    });
  }

  next();
};

/**
 * Middleware para alertas críticos customizados
 */
const criticalAlertMiddleware = (alertType, data) => {
  return (req, res, next) => {
    // Condições específicas para alertas críticos
    if (alertType === 'SUSPICIOUS_ACTIVITY') {
      // Exemplo: múltiplas tentativas de acesso a endpoints admin
      if (req.url.includes('/admin') && !req.user?.isApiAdmin) {
        alertingService.sendCriticalAlert('UNAUTHORIZED_ADMIN_ACCESS', {
          ip: req.ip,
          url: req.url,
          userAgent: req.get('user-agent'),
          timestamp: new Date().toISOString()
        });
      }
    }

    next();
  };
};

/**
 * Health check para sistema de alertas
 */
const alertingHealthCheck = (req, res, next) => {
  try {
    const stats = alertingService.getAlertStats();
    req.alertingHealth = {
      status: 'healthy',
      stats
    };
  } catch (error) {
    req.alertingHealth = {
      status: 'unhealthy',
      error: error.message
    };
  }

  next();
};

module.exports = {
  performanceMonitoring,
  errorTracking,
  loginTracking,
  databaseErrorTracking,
  rateLimitMonitoring,
  criticalAlertMiddleware,
  alertingHealthCheck
};