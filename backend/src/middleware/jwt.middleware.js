const jwt = require('jsonwebtoken');
const prismaConfig = require('../config/prisma');
const redisService = require('../services/redis.service');

// Função helper para obter Prisma
const getPrisma = () => prismaConfig.getPrisma();

/**
 * Middleware para autenticação JWT
 */
const authenticateToken = async (req, res, next) => {
  try {
    console.log('🔑 JWT Middleware - Iniciando autenticação...');
    const authHeader = req.headers['authorization'];
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ JWT Middleware - Token não fornecido ou formato inválido');
      return res.status(401).json({
        success: false,
        message: 'Token de acesso necessário'
      });
    }

    const token = authHeader.substring(7);
    
    // Verificar se o token está na blacklist (opcional, se Redis disponível)
    try {
      if (redisService && redisService.isConnected) {
        const isBlacklisted = await redisService.isBlacklisted(token);
        
        if (isBlacklisted) {
          return res.status(401).json({
            success: false,
            message: 'Token inválido ou expirado'
          });
        }
      }
    } catch (redisError) {
      console.warn('⚠️ Redis não disponível para verificação de blacklist:', redisError.message);
      // Continuar sem verificação de blacklist se Redis não estiver disponível
    }

    // Verificar e decodificar o token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Buscar usuário completo no banco com dados da empresa
    let prisma;
    try {
      prisma = getPrisma();
    } catch (error) {
      // Se Prisma não foi inicializado, inicializar primeiro
      await prismaConfig.initialize();
      prisma = getPrisma();
    }
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        userCompanies: {
          include: {
            company: true
          }
        }
      }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não encontrado ou inativo'
      });
    }

    // Adicionar dados da empresa se existir
    if (user.userCompanies && user.userCompanies.length > 0) {
      req.company = user.userCompanies[0].company;
      // Definir companyId para uso no controller
      user.companyId = user.userCompanies[0].company.id;
    }
    
    // Verificar se é admin do sistema baseado nas roles das empresas
    const hasAdminRole = user.userCompanies.some(uc => 
      uc.role === 'SUPER_ADMIN' || uc.role === 'APP_ADMIN' || uc.role === 'ADMIN'
    );
    user.isApiAdmin = hasAdminRole;
    
    req.user = user;
    console.log('✅ JWT Middleware - Usuário autenticado:', user.id, user.name);
    next();
    
  } catch (error) {
    console.error('❌ JWT Middleware - Erro na verificação:', error.message);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado'
      });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    } else {
      console.error('❌ Erro na verificação do token:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }
};

/**
 * Middleware opcional para autenticação JWT (não falha se não houver token)
 */
const optionalJWT = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continua sem usuário
    }

    const token = authHeader.substring(7);

    // Verificar se o token está na blacklist (opcional, se Redis disponível)
    try {
      if (redisService && redisService.isConnected) {
        const isBlacklisted = await redisService.isBlacklisted(token);
        if (isBlacklisted) {
          return next(); // Continua sem usuário
        }
      }
    } catch (redisError) {
      // Ignora erro do Redis no middleware opcional
    }

    // Verificar e decodificar o token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Buscar usuário no banco usando Prisma
    let prisma;
    try {
      prisma = getPrisma();
    } catch (error) {
      // Se Prisma não foi inicializado, inicializar primeiro
      await prismaConfig.initialize();
      prisma = getPrisma();
    }
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        userCompanies: {
          include: {
            company: true
          }
        }
      }
    });

    if (user && user.isActive) {
      // Adicionar dados da empresa se existir
      if (user.userCompanies && user.userCompanies.length > 0) {
        req.company = user.userCompanies[0].company;
        // Definir companyId para uso no controller
        user.companyId = user.userCompanies[0].company.id;
      }
      
      // Verificar se é admin do sistema baseado nas roles das empresas
      const hasAdminRole = user.userCompanies.some(uc => 
        uc.role === 'SUPER_ADMIN' || uc.role === 'APP_ADMIN' || uc.role === 'ADMIN'
      );
      user.isApiAdmin = hasAdminRole;
      
      req.user = user;
    }

    next();

  } catch (error) {
    // Em caso de erro, continua sem usuário
    next();
  }
};

module.exports = {
  authenticateToken,
  authenticateJWT: authenticateToken, // Alias para manter compatibilidade
  optionalJWT
};