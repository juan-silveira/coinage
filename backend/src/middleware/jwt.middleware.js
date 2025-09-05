const jwt = require('jsonwebtoken');
const prismaConfig = require('../config/prisma');
const redisService = require('../services/redis.service');
const userCompanyService = require('../services/userCompany.service');

// Função helper para obter Prisma
const getPrisma = () => prismaConfig.getPrisma();

/**
 * Middleware para autenticação JWT
 */
const authenticateToken = async (req, res, next) => {
  try {
    console.log('🔑 JWT Middleware - Iniciando autenticação...');
    console.log('🔍 JWT Middleware VERSION CHECK - Código atualizado com debugging!');
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

    // Adicionar dados da empresa usando getCurrentCompany para obter dados atualizados
    console.log(`🔍 JWT Middleware DEBUG - user.userCompanies:`, user.userCompanies ? user.userCompanies.length : 'null');
    if (user.userCompanies && user.userCompanies.length > 0) {
      try {
        // Obter a empresa atual dinamicamente (com base em lastAccessAt mais recente)
        console.log(`🔍 JWT Middleware - Buscando empresa atual para usuário: ${user.id}`);
        const currentCompany = await userCompanyService.getCurrentCompany(user.id);
        console.log(`🔍 JWT Middleware - Empresa atual encontrada:`, currentCompany);
        
        if (currentCompany) {
          req.company = currentCompany;
          user.companyId = currentCompany.id;
          
          console.log(`🏢 JWT Middleware - Usuário ${user.name} usando empresa: ${currentCompany.name} (${currentCompany.id})`);
        } else {
          // Fallback para a primeira empresa ativa se getCurrentCompany não retornar nada
          const selectedCompany = user.userCompanies.find(uc => uc.status === 'active' && uc.company.isActive);
          if (selectedCompany) {
            req.company = selectedCompany.company;
            user.companyId = selectedCompany.company.id;
            console.log(`🏢 JWT Middleware - Usuário ${user.name} usando empresa (fallback): ${selectedCompany.company.name} (${selectedCompany.company.id})`);
          }
        }
      } catch (error) {
        console.error('❌ JWT Middleware - Erro ao obter empresa atual:', error);
        // Fallback para a primeira empresa ativa em caso de erro
        const selectedCompany = user.userCompanies.find(uc => uc.status === 'active' && uc.company.isActive);
        if (selectedCompany) {
          req.company = selectedCompany.company;
          user.companyId = selectedCompany.company.id;
          console.log(`🏢 JWT Middleware - Usuário ${user.name} usando empresa (erro fallback): ${selectedCompany.company.name} (${selectedCompany.company.id})`);
        }
      }
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
        // Priorizar empresa "Coinage" se existir, senão usar a primeira
        let selectedCompany = user.userCompanies.find(uc => 
          uc.company.alias === 'coinage' || uc.company.name === 'Coinage'
        );
        
        if (!selectedCompany) {
          selectedCompany = user.userCompanies[0];
        }
        
        req.company = selectedCompany.company;
        user.companyId = selectedCompany.company.id;
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