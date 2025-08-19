// Importar Prisma company
const prismaConfig = require('../config/prisma');

// Função helper para obter Prisma
const getPrisma = () => prismaConfig.getPrisma();

// Importar serviços
const jwtService = require('../services/jwt.service');
const redisService = require('../services/redis.service');
const userCacheService = require('../services/userCache.service');
const userService = require('../services/user.service');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { validatePassword } = require('../utils/passwordValidation');

/**
 * Autenticar usuário (método auxiliar)
 */
const authenticateUser = async (email, password) => {
  try {
    const user = await userService.authenticate(email, password);
    return user;
  } catch (error) {
    console.error('❌ Erro na autenticação:', error);
    return null;
  }
};

/**
 * Login do usuário com controle de tentativas
 */
const login = async (req, res) => {
  const prisma = getPrisma();
  
  try {
    const { email, password } = req.body;
    const companyIP = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');
    
    // Validações básicas
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email e senha são obrigatórios'
      });
    }

    if (!email.includes('@')) {
      return res.status(400).json({
        success: false,
        message: 'Formato de email inválido'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Senha deve ter pelo menos 6 caracteres'
      });
    }

    // Buscar usuário pelo email primeiro (para verificar tentativas)
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    // Verificar se usuário está bloqueado por tentativas excessivas
    if (existingUser && existingUser.isBlockedLoginAttempts) {
      return res.status(423).json({
        success: false,
        message: 'Conta bloqueada devido a muitas tentativas de login incorretas. Entre em contato com o administrador.',
        data: {
          blocked: true,
          lastFailedAttempt: existingUser.lastFailedLoginAt
        }
      });
    }

    // Autenticar usuário
    const user = await authenticateUser(email, password);
    
    if (!user) {
      // Login falhou - incrementar contador de tentativas se usuário existe
      if (existingUser) {
        const newFailedAttempts = existingUser.failedLoginAttempts + 1;
        const shouldBlock = newFailedAttempts >= 5;
        
        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            failedLoginAttempts: newFailedAttempts,
            lastFailedLoginAt: new Date(),
            isBlockedLoginAttempts: shouldBlock
          }
        });

        if (shouldBlock) {
          return res.status(423).json({
            success: false,
            message: 'Conta bloqueada devido a 5 tentativas incorretas consecutivas. Entre em contato com o administrador.',
            data: {
              blocked: true,
              attempts: newFailedAttempts
            }
          });
        }

        return res.status(401).json({
          success: false,
          message: `Credenciais inválidas. Tentativas restantes: ${5 - newFailedAttempts}`,
          data: {
            attemptsRemaining: 5 - newFailedAttempts,
            totalAttempts: newFailedAttempts
          }
        });
      }
      
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Usuário inativo'
      });
    }

    // Login bem-sucedido - resetar contador de tentativas falhas
    if (existingUser && (existingUser.failedLoginAttempts > 0 || existingUser.isBlockedLoginAttempts)) {
      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          failedLoginAttempts: 0,
          lastFailedLoginAt: null,
          isBlockedLoginAttempts: false
        }
      });
    }

    // Gerar tokens
    const accessToken = jwtService.generateAccessToken(user);
    const refreshToken = jwtService.generateRefreshToken(user);

    // Buscar dados completos do usuário
    const userData = await userService.getUserById(user.id);
    
    if (!userData) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar dados do usuário'
      });
    }

    // Atualizar último acesso na empresa principal (Coinage) por padrão
    try {
      const userCompanyService = require('../services/userCompany.service');
      const companyService = require('../services/company.service');
      
      // Buscar empresa Coinage
      const coinageCompany = await companyService.getCompanyByAlias('coinage');
      if (coinageCompany) {
        await userCompanyService.updateLastActivity(user.id, coinageCompany.id);
      }
    } catch (accessError) {
      console.warn('⚠️ Erro ao atualizar último acesso:', accessError.message);
    }

    // Iniciar cache automático
    try {
      await userCacheService.startAutoCache(user.email);
    } catch (cacheError) {
      console.warn('⚠️ Cache automático não iniciado:', cacheError.message);
    }

    // Resposta de sucesso
    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      data: {
        user: userData,
        accessToken,
        refreshToken,
        expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m'
      }
    });

  } catch (error) {
    console.error('❌ Erro no login:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * Logout do usuário
 */
const logout = async (req, res) => {
  try {
    const userEmail = req.user?.email;
    const userId = req.user?.id;
    const companyIP = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');
    
    // Adicionar token à blacklist se fornecido
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      try {
        await jwtService.blacklistToken(token);
      } catch (blacklistError) {
        console.warn('⚠️ Falha ao adicionar token à blacklist:', blacklistError.message);
      }
    } else {
      console.warn('⚠️ Logout sem token fornecido');
    }

    // Finalizar cache automático
    try {
      await userCacheService.stopAutoCache(userEmail);
    } catch (cacheError) {
      console.warn('⚠️ Erro ao finalizar cache automático:', cacheError.message);
    }

    res.json({
      success: true,
      message: 'Logout realizado com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro no logout:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * Alterar senha (primeiro acesso)
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Validações básicas
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Senha atual e nova senha são obrigatórias'
      });
    }

    // Validação de senha forte
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Nova senha não atende aos critérios de segurança',
        errors: passwordValidation.errors
      });
    }

    // Buscar usuário atual
    const user = await userService.getUserById(req.user.id, true);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Verificar senha atual
    const isValidPassword = userService.verifyPassword(currentPassword, user.password, user.email);
    
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        message: 'Senha atual incorreta'
      });
    }

    // Atualizar senha no banco (o userService.updateUser já faz o hash)
    const updateResult = await userService.updateUser(req.user.id, {
      password: newPassword,
      isFirstAccess: false
    });

    if (updateResult.success) {
      res.json({
        success: true,
        message: 'Senha alterada com sucesso'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Erro ao atualizar senha'
      });
    }

  } catch (error) {
    console.error('❌ Erro na troca de senha:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * Gerar API Key
 */
const generateApiKey = async (req, res) => {
  try {
    const { name, description } = req.body;
    
    // Validações básicas
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Nome da API Key é obrigatório'
      });
    }

    // Validar tamanho do nome
    if (name.length < 3 || name.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Nome da API Key deve ter entre 3 e 50 caracteres'
      });
    }

    // Validar formato do nome (apenas letras, números, espaços e hífens)
    const nameRegex = /^[a-zA-Z0-9\s\-_]+$/;
    if (!nameRegex.test(name)) {
      return res.status(400).json({
        success: false,
        message: 'Nome da API Key deve conter apenas letras, números, espaços, hífens e underscores'
      });
    }

    // Validar descrição se fornecida
    if (description && description.length > 200) {
      return res.status(400).json({
        success: false,
        message: 'Descrição deve ter no máximo 200 caracteres'
      });
    }
    
    // Gerar nova API Key
    const apiKeyValue = crypto.randomBytes(32).toString('hex');
    const apiKeyHash = crypto.createHash('sha256').update(apiKeyValue).digest('hex');
    
    // Criar registro da API Key
    const apiKey = await getPrisma().apiKey.create({
      data: {
        key: apiKeyValue,
        keyHash: apiKeyHash,
        name: name,
        description: description || null,
        userId: req.user.id,
        permissions: req.user.permissions || {}
      }
    });
    
    res.json({
      success: true,
      message: 'API Key gerada com sucesso',
      data: {
        id: apiKey.id,
        name: apiKey.name,
        description: apiKey.description,
        apiKey: apiKeyValue, // Retornar apenas uma vez
        createdAt: apiKey.createdAt
      }
    });
  } catch (error) {
    console.error('Erro ao gerar API Key:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * Listar API Keys da empresa
 */
const listApiKeys = async (req, res) => {
  try {
    const apiKeys = await getPrisma().apiKey.findMany({
      where: { userId: req.user.id },
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true,
        createdAt: true,
        lastUsedAt: true,
        expiresAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json({
      success: true,
      message: 'API Keys listadas com sucesso',
      data: {
        apiKeys: apiKeys
      }
    });
  } catch (error) {
    console.error('Erro ao listar API Keys:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * Revogar API Key
 */
const revokeApiKey = async (req, res) => {
  try {
    const { apiKeyId } = req.params;
    
    if (!apiKeyId) {
      return res.status(400).json({
        success: false,
        message: 'ID da API Key é obrigatório'
      });
    }

    // Buscar API Key
    const apiKey = await getPrisma().apiKey.findFirst({
      where: { 
        id: apiKeyId, 
        userId: req.user.id 
      }
    });
    
    if (!apiKey) {
      return res.status(404).json({
        success: false,
        message: 'API Key não encontrada'
      });
    }

    // Desativar API Key
    const updatedApiKey = await getPrisma().apiKey.update({
      where: { id: apiKeyId },
      data: { isActive: false }
    });
    
    res.json({
      success: true,
      message: 'API Key revogada com sucesso',
      data: {
        id: updatedApiKey.id,
        name: updatedApiKey.name
      }
    });
  } catch (error) {
    console.error('Erro ao revogar API Key:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * Editar API Key
 */
const editApiKey = async (req, res) => {
  try {
    const { apiKeyId } = req.params;
    const { name, description } = req.body;

    if (!apiKeyId) {
      return res.status(400).json({
        success: false,
        message: 'ID da API Key é obrigatório'
      });
    }

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Nome da API Key é obrigatório'
      });
    }

    // Buscar API Key
    const apiKey = await getPrisma().apiKey.findFirst({
      where: { 
        id: apiKeyId, 
        userId: req.user.id 
      }
    });
    
    if (!apiKey) {
      return res.status(404).json({
        success: false,
        message: 'API Key não encontrada'
      });
    }

    // Atualizar API Key
    const updatedApiKey = await getPrisma().apiKey.update({
      where: { id: apiKeyId },
      data: {
        name: name,
        description: description || null
      }
    });
    
    res.json({
      success: true,
      message: 'API Key editada com sucesso',
      data: {
        id: updatedApiKey.id,
        name: updatedApiKey.name,
        description: updatedApiKey.description,
        updatedAt: updatedApiKey.updatedAt
      }
    });
  } catch (error) {
    console.error('Erro ao editar API Key:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * Renovar access token usando refresh token
 */
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const companyIP = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    console.log('\ud83d\udd0d [Refresh] Recebida requisição de refresh token:', {
      hasRefreshToken: !!refreshToken,
      tokenLength: refreshToken?.length || 0,
      tokenStart: refreshToken?.substring(0, 20) + '...',
      companyIP,
      userAgent: userAgent?.substring(0, 50)
    });

    if (!refreshToken) {
      console.error('\u274c [Refresh] Refresh token não fornecido');
      return res.status(400).json({
        success: false,
        message: 'Refresh token é obrigatório'
      });
    }

    // Verificar se o refresh token está na blacklist
    const isBlacklisted = await jwtService.isTokenBlacklisted(refreshToken);
    
    if (isBlacklisted) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token inválido'
      });
    }

    // Verificar e decodificar o refresh token
    let decoded;
    try {
      decoded = jwtService.verifyRefreshToken(refreshToken);
      console.log('\ud83d\udd0d [Refresh] Token decodificado com sucesso:', { userId: decoded.id, exp: decoded.exp });
    } catch (verifyError) {
      console.error('\u274c [Refresh] Erro ao verificar refresh token:', verifyError.message);
      return res.status(401).json({
        success: false,
        message: 'Refresh token inv\u00e1lido ou expirado'
      });
    }
    
    // Buscar usuário
    const user = await userService.getUserById(decoded.id);
    console.log('\ud83d\udd0d [Refresh] Usu\u00e1rio encontrado:', { found: !!user, active: user?.isActive });
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não encontrado ou inativo'
      });
    }

    // Adicionar refresh token antigo à blacklist
    try {
      const blacklistSuccess = await jwtService.blacklistToken(refreshToken);
      if (blacklistSuccess) {
        console.log('\ud83d\udcdd [Refresh] Token antigo adicionado à blacklist com sucesso');
      } else {
        console.warn('\u26a0\ufe0f [Refresh] Falha ao adicionar token antigo à blacklist');
      }
    } catch (blacklistError) {
      console.warn('\u26a0\ufe0f [Refresh] Erro ao adicionar token antigo à blacklist:', blacklistError.message);
    }

    // Gerar novos tokens
    const newAccessToken = jwtService.generateAccessToken(user);
    const newRefreshToken = jwtService.generateRefreshToken(user);
    
    console.log('\u2705 [Refresh] Novos tokens gerados com sucesso para usuário:', user.email);

    res.json({
      success: true,
      message: 'Token renovado com sucesso',
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m'
      }
    });

  } catch (error) {
    console.error('❌ [Refresh] Erro no refresh token:', {
      error: error.message,
      stack: error.stack?.split('\n').slice(0, 3),
      refreshToken: refreshToken?.substring(0, 20) + '...'
    });
    
    // Retornar erro 401 para refresh token inválidos ao invés de 500
    if (error.message.includes('invalid') || error.message.includes('expired') || error.message.includes('jwt')) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token inválido ou expirado'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * Obter informações do usuário atual
 */
const getCurrentUser = async (req, res) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não autenticado'
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          cpf: user.cpf,
          birthDate: user.birthDate,
          permissions: user.permissions,
          roles: user.roles,
          isApiAdmin: user.isApiAdmin,
          isCompanyAdmin: user.isCompanyAdmin
        }
      }
    });
  } catch (error) {
    console.error('Erro ao obter informações do usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * Registro de novo usuário
 */
const register = async (req, res) => {
  try {
    const { name, email, password, company_alias } = req.body;
    
    // Validações básicas
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Nome, email e senha são obrigatórios'
      });
    }

    if (!email.includes('@')) {
      return res.status(400).json({
        success: false,
        message: 'Formato de email inválido'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Senha deve ter pelo menos 6 caracteres'
      });
    }

    const prisma = getPrisma();
    
    // Verificar se email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Este email já está em uso'
      });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 12);

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        isActive: true,
        isFirstAccess: true
      }
    });

    // Se company_alias foi fornecido, vincular à empresa
    if (company_alias) {
      try {
        const company = await prisma.company.findUnique({
          where: { alias: company_alias }
        });

        if (company) {
          await prisma.userCompany.create({
            data: {
              userId: user.id,
              companyId: company.id,
              status: 'active',
              role: 'USER',
              linkedAt: new Date()
            }
          });
        }
      } catch (error) {
        console.warn('⚠️ Erro ao vincular usuário à empresa:', error.message);
        // Não falhar o registro por erro de vinculação
      }
    }

    res.status(201).json({
      success: true,
      message: 'Usuário registrado com sucesso',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          isFirstAccess: user.isFirstAccess
        }
      }
    });

  } catch (error) {
    console.error('❌ Erro no registro:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * Testa a blacklist do Redis
 */
const testBlacklist = async (req, res) => {
  try {
    // Testar conexão
    const connectionTest = await redisService.testConnection();
    
    // Obter estatísticas
    const stats = await redisService.getBlacklistStats();
    
    // Testar adicionar token à blacklist
    const testToken = 'test-token-' + Date.now();
    const added = await redisService.addToBlacklist(testToken, 60); // 60 segundos
    
    // Verificar se foi adicionado
    const isBlacklisted = await redisService.isBlacklisted(testToken);
    
    // Remover token de teste
    await redisService.removeFromBlacklist(testToken);
    
    res.json({
      success: true,
      message: 'Teste da blacklist realizado com sucesso',
      data: {
        connection: connectionTest,
        stats,
        testResults: {
          tokenAdded: added,
          isBlacklisted,
          tokenRemoved: true
        }
      }
    });
  } catch (error) {
    console.error('Erro no teste da blacklist:', error);
    res.status(500).json({
      success: false,
      message: 'Erro no teste da blacklist',
      error: error.message
    });
  }
};

/**
 * Desbloquear usuário (função para administradores)
 */
const unblockUser = async (req, res) => {
  const prisma = getPrisma();
  
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email é obrigatório'
      });
    }

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Desbloquear usuário
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lastFailedLoginAt: null,
        isBlockedLoginAttempts: false
      }
    });

    res.json({
      success: true,
      message: `Usuário ${email} desbloqueado com sucesso`,
      data: {
        email: user.email,
        name: user.name,
        wasBlocked: user.isBlockedLoginAttempts,
        previousAttempts: user.failedLoginAttempts
      }
    });

  } catch (error) {
    console.error('❌ Erro ao desbloquear usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * Bloquear usuário (função para administradores)
 */
const blockUser = async (req, res) => {
  const prisma = getPrisma();
  
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email é obrigatório'
      });
    }

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Bloquear usuário
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isBlockedLoginAttempts: true,
        lastFailedLoginAt: new Date()
      }
    });

    res.json({
      success: true,
      message: `Usuário ${email} bloqueado com sucesso`,
      data: {
        email: user.email,
        name: user.name,
        wasBlocked: user.isBlockedLoginAttempts,
        blockedAt: new Date()
      }
    });

  } catch (error) {
    console.error('❌ Erro ao bloquear usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * Listar usuários bloqueados (função para administradores)
 */
const listBlockedUsers = async (req, res) => {
  const prisma = getPrisma();
  
  try {
    const blockedUsers = await prisma.user.findMany({
      where: {
        isBlockedLoginAttempts: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        failedLoginAttempts: true,
        lastFailedLoginAt: true,
        isBlockedLoginAttempts: true
      }
    });

    res.json({
      success: true,
      message: `Encontrados ${blockedUsers.length} usuários bloqueados`,
      data: {
        blockedUsers,
        count: blockedUsers.length
      }
    });

  } catch (error) {
    console.error('❌ Erro ao listar usuários bloqueados:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

module.exports = {
  login,
  register,
  logout,
  changePassword,
  generateApiKey,
  listApiKeys,
  revokeApiKey,
  editApiKey,
  refreshToken,
  getCurrentUser,
  testBlacklist,
  blockUser,
  unblockUser,
  listBlockedUsers
};