// Importar Prisma client
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
 * Login do usuário
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress;
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

    // Autenticar usuário
    const user = await authenticateUser(email, password);
    
    if (!user) {
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
    const clientIP = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');
    
    // Adicionar token à blacklist se fornecido
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      try {
        await jwtService.addToBlacklist(token);
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

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Nova senha deve ter pelo menos 6 caracteres'
      });
    }

    // Buscar usuário atual
    const user = await userService.getUserById(req.user.id);
    
    if (!user.success) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Verificar senha atual
    const isValidPassword = await userService.verifyPassword(currentPassword, user.data.password, user.data.email);
    
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        message: 'Senha atual incorreta'
      });
    }

    // Gerar hash da nova senha
    const hashedPassword = await userService.hashPassword(newPassword);
    
    // Atualizar senha no banco
    const updateResult = await userService.updateUser(req.user.id, {
      password: hashedPassword,
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
 * Listar API Keys do cliente
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
    const clientIP = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    if (!refreshToken) {
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
    const decoded = jwtService.verifyRefreshToken(refreshToken);
    
    // Buscar usuário
    const user = await userService.getUserById(decoded.id);
    
    if (!user.success || !user.data.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não encontrado ou inativo'
      });
    }

    // Gerar novos tokens
    const newAccessToken = jwtService.generateAccessToken(user.data);
    const newRefreshToken = jwtService.generateRefreshToken(user.data);

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
    console.error('❌ Erro no refresh token:', error);
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
          isClientAdmin: user.isClientAdmin
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

module.exports = {
  login,
  logout,
  changePassword,
  generateApiKey,
  listApiKeys,
  revokeApiKey,
  editApiKey,
  refreshToken,
  getCurrentUser,
  testBlacklist
};