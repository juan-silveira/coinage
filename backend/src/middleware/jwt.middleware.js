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
    const authHeader = req.headers['authorization'];
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token de acesso necessário'
      });
    }

    const token = authHeader.substring(7);
    
    // Verificar se o token está na blacklist
    const isBlacklisted = await redisService.isBlacklisted(token);
    
    if (isBlacklisted) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido ou expirado'
      });
    }

    // Verificar e decodificar o token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Buscar usuário completo no banco com dados da empresa
    const user = await getPrisma().user.findUnique({
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
    }
    
    req.user = user;
    next();
    
  } catch (error) {
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

    // Verificar se o token está na blacklist
    const isBlacklisted = await redisService.isBlacklisted(token);
    if (isBlacklisted) {
      return next(); // Continua sem usuário
    }

    // Verificar e decodificar o token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Buscar usuário no banco usando Prisma
    const user = await getPrisma().user.findUnique({
      where: { id: decoded.id },
      include: {
        company: true
      }
    });

    if (user && user.isActive) {
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