const { logger, httpRequest, performance, errorLog } = require('../config/logger');
const { v4: uuidv4 } = require('uuid');

/**
 * Middleware para logs estruturados de requisições HTTP
 */
const structuredLoggingMiddleware = (req, res, next) => {
  // Adicionar ID único à requisição
  req.requestId = uuidv4();
  
  // Timestamp de início
  const startTime = Date.now();
  
  // Adicionar requestId aos headers de resposta para debug
  res.setHeader('X-Request-ID', req.requestId);
  
  // Capturar dados da requisição
  const requestData = {
    requestId: req.requestId,
    method: req.method,
    url: req.url,
    originalUrl: req.originalUrl,
    query: req.query,
    params: req.params,
    ip: req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'],
    userAgent: req.get('User-Agent'),
    referer: req.get('Referer'),
    contentType: req.get('Content-Type'),
    contentLength: req.get('Content-Length'),
    host: req.get('Host'),
    userId: null, // Será preenchido depois da autenticação
    companyId: null
  };
  
  // Log da requisição recebida
  logger.info('HTTP Request Received', {
    ...requestData,
    body: shouldLogBody(req) ? sanitizeBody(req.body) : '[BODY_HIDDEN]'
  });
  
  // Interceptar fim da resposta
  const originalEnd = res.end;
  const originalWrite = res.write;
  
  let responseBody = '';
  
  // Capturar corpo da resposta (apenas para debug em desenvolvimento)
  res.write = function(chunk, encoding) {
    if (process.env.NODE_ENV === 'development' && chunk) {
      responseBody += chunk.toString();
    }
    originalWrite.call(this, chunk, encoding);
  };
  
  res.end = function(chunk, encoding) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    if (chunk && process.env.NODE_ENV === 'development') {
      responseBody += chunk.toString();
    }
    
    // Capturar dados da resposta
    const responseData = {
      requestId: req.requestId,
      statusCode: res.statusCode,
      statusMessage: res.statusMessage,
      responseTime,
      contentLength: res.get('Content-Length'),
      contentType: res.get('Content-Type'),
      userId: req.user?.id,
      companyId: req.user?.companyId || req.company?.id
    };
    
    // Log da resposta enviada
    const logLevel = res.statusCode >= 500 ? 'error' : 
                     res.statusCode >= 400 ? 'warn' : 'info';
                     
    logger[logLevel]('HTTP Response Sent', {
      ...responseData,
      response: shouldLogResponse(req, res) ? sanitizeResponse(responseBody) : '[RESPONSE_HIDDEN]'
    });
    
    // Log de performance se demorou mais que o threshold
    if (responseTime > 1000) { // 1 segundo
      performance('HTTP Request Slow', responseTime, {
        requestId: req.requestId,
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        userId: req.user?.id
      });
    }
    
    // Log de auditoria para endpoints sensíveis
    if (isSensitiveEndpoint(req.url)) {
      logger.info('Sensitive Endpoint Access', {
        requestId: req.requestId,
        endpoint: req.url,
        method: req.method,
        userId: req.user?.id,
        companyId: req.user?.companyId,
        statusCode: res.statusCode,
        ip: requestData.ip,
        userAgent: requestData.userAgent
      });
    }
    
    originalEnd.call(this, chunk, encoding);
  };
  
  // Adicionar dados da requisição ao objeto req para uso posterior
  req.logData = requestData;
  req.startTime = startTime;
  
  next();
};

/**
 * Middleware para capturar erros e registrar logs estruturados
 */
const errorLoggingMiddleware = (error, req, res, next) => {
  const responseTime = req.startTime ? Date.now() - req.startTime : 0;
  
  // Log detalhado do erro
  errorLog(error, {
    requestId: req.requestId,
    method: req.method,
    url: req.url,
    userId: req.user?.id,
    companyId: req.user?.companyId,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    responseTime,
    body: shouldLogBody(req) ? sanitizeBody(req.body) : '[BODY_HIDDEN]',
    query: req.query,
    params: req.params
  });
  
  // Performance log para erros (importante para monitoramento)
  if (responseTime > 0) {
    performance('HTTP Request Error', responseTime, {
      requestId: req.requestId,
      method: req.method,
      url: req.url,
      errorType: error.name,
      statusCode: error.status || 500
    });
  }
  
  next(error);
};

/**
 * Middleware para enriquecer logs com dados do usuário após autenticação
 */
const enrichLogsWithUserData = (req, res, next) => {
  if (req.user && req.logData) {
    req.logData.userId = req.user.id;
    req.logData.companyId = req.user.companyId;
    
    logger.debug('Request enriched with user data', {
      requestId: req.requestId,
      userId: req.user.id,
      companyId: req.user.companyId
    });
  }
  
  next();
};

/**
 * Determina se deve logar o corpo da requisição
 */
const shouldLogBody = (req) => {
  // Não logar senhas, tokens, etc.
  const sensitiveEndpoints = [
    '/api/auth/login',
    '/api/auth/register', 
    '/api/auth/change-password',
    '/api/password-reset'
  ];
  
  return process.env.NODE_ENV === 'development' && 
         !sensitiveEndpoints.some(endpoint => req.url.includes(endpoint));
};

/**
 * Remove dados sensíveis do corpo da requisição
 */
const sanitizeBody = (body) => {
  if (!body || typeof body !== 'object') return body;
  
  const sanitized = { ...body };
  const sensitiveFields = ['password', 'newPassword', 'currentPassword', 'token', 'apiKey', 'secret'];
  
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });
  
  return sanitized;
};

/**
 * Determina se deve logar a resposta
 */
const shouldLogResponse = (req, res) => {
  return process.env.NODE_ENV === 'development' && 
         res.statusCode >= 400 && 
         res.get('Content-Type')?.includes('application/json');
};

/**
 * Sanitiza resposta removendo dados sensíveis
 */
const sanitizeResponse = (responseBody) => {
  try {
    const parsed = JSON.parse(responseBody);
    if (parsed.data && parsed.data.accessToken) {
      parsed.data.accessToken = '[REDACTED]';
    }
    if (parsed.data && parsed.data.refreshToken) {
      parsed.data.refreshToken = '[REDACTED]';
    }
    return JSON.stringify(parsed);
  } catch {
    return responseBody?.substring(0, 500) || '[EMPTY]';
  }
};

/**
 * Verifica se é um endpoint sensível que requer auditoria
 */
const isSensitiveEndpoint = (url) => {
  const sensitivePatterns = [
    '/api/auth/',
    '/api/admin/',
    '/api/withdrawals/',
    '/api/deposits/',
    '/api/transfers/',
    '/api/user-documents/',
    '/api/password-reset/'
  ];
  
  return sensitivePatterns.some(pattern => url.includes(pattern));
};

module.exports = {
  structuredLoggingMiddleware,
  errorLoggingMiddleware,
  enrichLogsWithUserData
};