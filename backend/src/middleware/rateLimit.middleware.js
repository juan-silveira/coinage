/**
 * Middleware de Rate Limiting
 * Controla o número de requisições por empresa em diferentes janelas de tempo
 */

// Armazenamento em memória para rate limiting (em produção, usar Redis)
const rateLimitStore = new Map();

/**
 * Middleware de rate limiting genérico
 * @param {Object} options - Opções de configuração
 * @param {number} options.maxRequests - Número máximo de requisições
 * @param {number} options.windowMs - Janela de tempo em milissegundos
 * @param {string} options.keyPrefix - Prefixo para a chave de rate limit
 * @param {Function} options.keyGenerator - Função para gerar a chave única
 * @param {string} options.message - Mensagem de erro personalizada
 */
const createRateLimiter = (options) => {
  const {
    maxRequests = 100,
    windowMs = 15 * 60 * 1000, // 15 minutos padrão
    keyPrefix = 'rate_limit',
    keyGenerator = (req) => req.company?.id || req.ip,
    message = 'Limite de requisições excedido'
  } = options;

  return (req, res, next) => {
    const companyKey = keyGenerator(req);
    
    if (!companyKey) {
      return res.status(400).json({
        success: false,
        message: 'Empresa não identificada para rate limiting'
      });
    }

    const rateLimitKey = `${keyPrefix}:${companyKey}`;
    const currentTime = Date.now();

    // Obter ou criar registro de rate limit
    let rateLimitData = rateLimitStore.get(rateLimitKey);
    
    if (!rateLimitData || currentTime > rateLimitData.resetTime) {
      rateLimitData = {
        count: 0,
        resetTime: currentTime + windowMs
      };
      rateLimitStore.set(rateLimitKey, rateLimitData);
    }

    // Incrementar contador
    rateLimitData.count++;

    // Verificar se excedeu o limite
    if (rateLimitData.count > maxRequests) {
      const timeUntilReset = Math.ceil((rateLimitData.resetTime - currentTime) / 1000);
      
      // Adicionar headers de rate limit
      res.set({
        'X-RateLimit-Limit': maxRequests.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': Math.floor(rateLimitData.resetTime / 1000),
        'Retry-After': timeUntilReset
      });

      return res.status(429).json({
        success: false,
        message: `${message}. Aguarde ${timeUntilReset} segundos para fazer novas chamadas.`,
        data: {
          limit: maxRequests,
          remaining: 0,
          resetTime: new Date(rateLimitData.resetTime).toISOString(),
          timeUntilReset: timeUntilReset,
          retryAfter: timeUntilReset
        }
      });
    }

    // Adicionar headers de rate limit na resposta
    const remaining = maxRequests - rateLimitData.count;
    res.set({
      'X-RateLimit-Limit': maxRequests.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': Math.floor(rateLimitData.resetTime / 1000)
    });

    // Adicionar dados de rate limit ao request para uso posterior
    if (!req.rateLimitData) {
      req.rateLimitData = {};
    }
    req.rateLimitData[rateLimitKey] = {
      count: rateLimitData.count,
      remaining: remaining,
      resetTime: rateLimitData.resetTime
    };

    next();
  };
};

/**
 * Rate limiter específico para transações blockchain
 * 100 transações por minuto por empresa (aumentado para companies grandes)
 */
const transactionRateLimiter = createRateLimiter({
  maxRequests: 100,
  windowMs: 60 * 1000, // 1 minuto
  keyPrefix: 'transaction_rate_limit',
  keyGenerator: (req) => req.company?.id,
  message: 'Limite de transações blockchain excedido. Máximo 100 transações por minuto.'
});

/**
 * Rate limiter para API calls gerais
 * 1000 requisições por 15 minutos por empresa (aumentado para companies grandes)
 */
const apiRateLimiter = createRateLimiter({
  maxRequests: 1000,
  windowMs: 15 * 60 * 1000, // 15 minutos
  keyPrefix: 'api_rate_limit',
  keyGenerator: (req) => req.company?.id || req.ip,
  message: 'Limite de requisições da API excedido. Máximo 1000 requisições por 15 minutos.'
});

/**
 * Rate limiter para login
 * 1000 tentativas por 15 minutos por IP (removido para usar sistema baseado em usuário)
 */
const loginRateLimiter = createRateLimiter({
  maxRequests: 1000,
  windowMs: 15 * 60 * 1000, // 15 minutos
  keyPrefix: 'login_rate_limit',
  keyGenerator: (req) => req.ip,
  message: 'Limite de tentativas de login excedido. Tente novamente mais tarde.'
});

/**
 * Rate limiter para geração de API Keys
 * 3 por hora por empresa
 */
const apiKeyRateLimiter = createRateLimiter({
  maxRequests: 3,
  windowMs: 60 * 60 * 1000, // 1 hora
  keyPrefix: 'api_key_rate_limit',
  keyGenerator: (req) => req.company?.id,
  message: 'Limite de geração de API Keys excedido. Máximo 3 por hora.'
});

/**
 * Função para limpar dados antigos de rate limit
 * Executar periodicamente para evitar vazamento de memória
 */
const cleanupRateLimitData = () => {
  const currentTime = Date.now();
  const keysToDelete = [];

  for (const [key, data] of rateLimitStore.entries()) {
    if (currentTime > data.resetTime) {
      keysToDelete.push(key);
    }
  }

  keysToDelete.forEach(key => rateLimitStore.delete(key));
  
  if (keysToDelete.length > 0) {
    // Log silencioso - sem console.log
  }
};

// Executar limpeza a cada 5 minutos
setInterval(cleanupRateLimitData, 5 * 60 * 1000);

/**
 * Função para limpar completamente o rate limit (útil para desenvolvimento)
 */
const clearRateLimit = () => {
  rateLimitStore.clear();
  console.log('🗑️ Rate limit cache limpo');
};

/**
 * Função para obter estatísticas de rate limit
 */
const getRateLimitStats = () => {
  const stats = {
    totalEntries: rateLimitStore.size,
    entries: []
  };

  for (const [key, data] of rateLimitStore.entries()) {
    stats.entries.push({
      key,
      count: data.count,
      resetTime: new Date(data.resetTime).toISOString(),
      isExpired: Date.now() > data.resetTime
    });
  }

  return stats;
};

// Removido: clearRateLimit() automático que estava causando problemas

module.exports = {
  createRateLimiter,
  transactionRateLimiter,
  apiRateLimiter,
  loginRateLimiter,
  apiKeyRateLimiter,
  cleanupRateLimitData,
  getRateLimitStats,
  clearRateLimit
}; 