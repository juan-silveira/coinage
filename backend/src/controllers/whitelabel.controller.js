const whitelabelService = require('../services/whitelabel.service');
const userCompanyService = require('../services/userCompany.service');
const jwtService = require('../services/jwt.service');
const userActionsService = require('../services/userActions.service');

/**
 * Inicia processo de login whitelabel
 */
const initiateLogin = async (req, res) => {
  try {
    const { email, companyId } = req.body;

    if (!email || !companyId) {
      return res.status(400).json({
        success: false,
        message: 'Email e companyId são obrigatórios'
      });
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Formato de email inválido'
      });
    }

    const result = await whitelabelService.initiateWhitelabelLogin(email, companyId);

    res.json(result);

  } catch (error) {
    console.error('❌ Erro ao iniciar login whitelabel:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * Confirma vinculação de usuário aa empresa
 */
const confirmLinking = async (req, res) => {
  try {
    const { userId, companyId, password } = req.body;

    if (!userId || !companyId || !password) {
      return res.status(400).json({
        success: false,
        message: 'UserId, companyId e password são obrigatórios'
      });
    }

    const result = await whitelabelService.confirmCompanyLinking(userId, companyId, password);

    res.json(result);

  } catch (error) {
    console.error('❌ Erro ao confirmar vinculação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * Autentica usuário em empresa específico
 */
const authenticateUser = async (req, res) => {
  try {
    const { email, password, companyId } = req.body;

    if (!email || !password || !companyId) {
      return res.status(400).json({
        success: false,
        message: 'Email, password e companyId são obrigatórios'
      });
    }

    // Se companyId é um alias, converter para UUID real
    let actualCompanyId = companyId;
    let companyInfo = null;
    console.log('🔍 Debug companyId recebido:', companyId);
    
    if (companyId && !companyId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
      console.log('🔍 CompanyId é um alias, convertendo para UUID...');
      // É um alias, precisa buscar o ID real usando o método de branding
      try {
        const companyBranding = await whitelabelService.getCompanyBrandingByAlias(companyId);
        actualCompanyId = companyBranding.company_id;
        console.log('🔍 UUID da empresa encontrado:', actualCompanyId);
        
        // Buscar informações completas da empresa para o log
        const prisma = require('../config/prisma').getPrisma();
        companyInfo = await prisma.company.findUnique({
          where: { id: actualCompanyId },
          select: { id: true, name: true, alias: true }
        });
      } catch (error) {
        console.error('❌ Erro ao buscar empresa por alias:', error.message);
        return res.status(404).json({
          success: false,
          message: 'Empresa não encontrada'
        });
      }
    } else {
      // É um UUID, buscar informações da empresa
      try {
        const prisma = require('../config/prisma').getPrisma();
        companyInfo = await prisma.company.findUnique({
          where: { id: companyId },
          select: { id: true, name: true, alias: true }
        });
        if (!companyInfo) {
          return res.status(404).json({
            success: false,
            message: 'Empresa não encontrada'
          });
        }
      } catch (error) {
        console.error('❌ Erro ao buscar empresa por ID:', error.message);
        return res.status(500).json({
          success: false,
          message: 'Erro interno do servidor'
        });
      }
    }

    const result = await whitelabelService.authenticateWhitelabelUser(email, password, actualCompanyId);

    if (!result.success) {
      // Log failed login attempt with company_id
      try {
        if (result.message === 'Senha incorreta') {
          // Only log if we found the user but password is wrong
          const userQuery = await require('../config/prisma').getPrisma().user.findUnique({
            where: { email: email.toLowerCase() }
          });
          if (userQuery) {
            await userActionsService.logAuth(userQuery.id, 'login_failed', req, {
              status: 'failed',
              companyId: actualCompanyId,
              errorMessage: 'Senha incorreta',
              errorCode: 'INVALID_PASSWORD',
              details: {
                companyName: companyInfo?.name,
                companyAlias: companyInfo?.alias || companyId,
                loginType: 'whitelabel',
                originalRequestParam: companyId
              }
            });
            console.log(`❌ Login whitelabel com falha registrado: userId=${userQuery.id}, companyId=${actualCompanyId}, company=${companyInfo?.name}`);
          }
        }
      } catch (logError) {
        console.warn('⚠️ Erro ao registrar tentativa de login com falha:', logError.message);
      }
      
      return res.status(401).json(result);
    }

    // Atualizar último acesso na empresa
    try {
      const userCompanyService = require('../services/userCompany.service');
      await userCompanyService.updateLastActivity(result.data.user.id, actualCompanyId);
    } catch (accessError) {
      console.warn('⚠️ Erro ao atualizar último acesso:', accessError.message);
    }

    // Log successful whitelabel login with company_id
    try {
      await userActionsService.logAuth(result.data.user.id, 'login', req, {
        status: 'success',
        companyId: actualCompanyId,
        details: {
          companyName: companyInfo?.name || result.data.company.name,
          companyAlias: companyInfo?.alias || companyId,
          userRole: result.data.userCompany.role,
          loginType: 'whitelabel',
          originalRequestParam: companyId
        }
      });
      console.log(`✅ Login whitelabel registrado: userId=${result.data.user.id}, companyId=${actualCompanyId}, company=${companyInfo?.name || result.data.company.name}`);
    } catch (logError) {
      console.warn('⚠️ Erro ao registrar login no user_actions:', logError.message);
    }

    // Gerar tokens JWT
    const user = result.data.user;
    const tokens = jwtService.generateTokenPair({
      ...user,
      // Adicionar informações do contexto da empresa
      currentCompanyId: companyId,
      currentCompanyRole: result.data.userCompany.role
    });

    res.json({
      success: true,
      message: 'Autenticação realizada com sucesso',
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
        refreshExpiresIn: tokens.refreshExpiresIn,
        user: result.data.user,
        company: result.data.company,
        userCompany: result.data.userCompany
      }
    });

  } catch (error) {
    console.error('❌ Erro na autenticação whitelabel:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * Obtém configuração de branding da empresa por alias
 */
const getCompanyBrandingByAlias = async (req, res) => {
  try {
    const { companyAlias } = req.params;

    // Se companyAlias for undefined, vazio ou a string "undefined", usar 'coinage' como padrão
    let alias = companyAlias;
    
    if (!alias || alias === 'undefined' || alias === 'null') {
      alias = 'coinage';
    }

    const branding = await whitelabelService.getCompanyBrandingByAlias(alias);

    res.json({
      success: true,
      data: branding
    });

  } catch (error) {
    console.error('❌ Erro ao obter branding por alias:', error);
    
    if (error.message === 'Empresa não encontrada') {
      return res.status(404).json({
        success: false,
        message: 'Empresa não encontrada'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * Obtém configuração de branding da empresa
 */
const getCompanyBranding = async (req, res) => {
  try {
    const { companyId } = req.params;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'CompanyId é obrigatório'
      });
    }

    const branding = await whitelabelService.getCompanyBranding(companyId);

    res.json({
      success: true,
      data: branding
    });

  } catch (error) {
    console.error('❌ Erro ao obter branding:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * Lista empresas vinculadas a um usuário
 */
const getUserCompanies = async (req, res) => {
  try {
    const userId = req.user.id;
    const { includeInactive } = req.query;

    const companies = await userCompanyService.getUserCompanies(userId, {
      includeInactive: includeInactive === 'true'
    });

    res.json({
      success: true,
      data: {
        companies
      }
    });

  } catch (error) {
    console.error('❌ Erro ao listar empresas do usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * Lista usuários vinculados a um empresa
 */
const getCompanyUsers = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { 
      status = 'active',
      role,
      page = 1,
      limit = 50
    } = req.query;

    // Verificar se o usuário tem permissão para ver usuários deste empresa
    const hasPermission = await userCompanyService.hasPermission(
      req.user.id, 
      companyId, 
      'read_company_users'
    );

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'Sem permissão para acessar usuários deste empresa'
      });
    }

    const result = await userCompanyService.getCompanyUsers(companyId, {
      status,
      role,
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('❌ Erro ao listar usuários da empresa:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * Atualiza role de usuário em um empresa
 */
const updateUserRole = async (req, res) => {
  try {
    const { companyId, userId } = req.params;
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({
        success: false,
        message: 'Role é obrigatória'
      });
    }

    // Verificar se o usuário tem permissão para alterar roles
    const hasPermission = await userCompanyService.hasPermission(
      req.user.id, 
      companyId, 
      'update_company_users'
    );

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'Sem permissão para alterar roles neste empresa'
      });
    }

    const userCompany = await userCompanyService.updateUserCompanyRole(
      userId, 
      companyId, 
      role, 
      req.user.id
    );

    res.json({
      success: true,
      message: 'Role atualizada com sucesso',
      data: {
        userCompany
      }
    });

  } catch (error) {
    console.error('❌ Erro ao atualizar role:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * Remove vinculação de usuário a empresa
 */
const unlinkUser = async (req, res) => {
  try {
    const { companyId, userId } = req.params;

    // Verificar se o usuário tem permissão
    const hasPermission = await userCompanyService.hasPermission(
      req.user.id, 
      companyId, 
      'update_company_users'
    );

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'Sem permissão para remover usuários desta empresa'
      });
    }

    await userCompanyService.unlinkUserFromCompany(userId, companyId);

    res.json({
      success: true,
      message: 'Usuário desvinculado com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao desvincular usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * Obtém estatísticas da empresa
 */
const getCompanyStats = async (req, res) => {
  try {
    const { companyId } = req.params;

    // Verificar se o usuário tem permissão
    const hasPermission = await userCompanyService.hasPermission(
      req.user.id, 
      companyId, 
      'read_company_users'
    );

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'Sem permissão para acessar estatísticas desta empresa'
      });
    }

    const stats = await whitelabelService.getCompanyStats(companyId);

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('❌ Erro ao obter estatísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * Obtém a empresa atual do usuário (baseado no último acesso)
 */
const getCurrentCompany = async (req, res) => {
  try {
    const userId = req.user.id;

    // Buscar a empresa com último acesso mais recente
    const currentCompany = await userCompanyService.getCurrentCompany(userId);

    if (!currentCompany) {
      return res.status(404).json({
        success: false,
        message: 'Nenhum empresa ativo encontrado para este usuário'
      });
    }

    res.json({
      success: true,
      data: {
        currentCompany
      }
    });

  } catch (error) {
    console.error('❌ Erro ao obter empresa atual:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * Atualiza último acesso do usuário em uma empresa
 */
const updateCompanyAccess = async (req, res) => {
  try {
    const { companyId } = req.params;
    const userId = req.user.id;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'ID da empresa é obrigatório'
      });
    }

    // Verificar se o usuário está vinculado à empresa
    const userCompany = await userCompanyService.getUserCompanyLink(userId, companyId);
    
    if (!userCompany || userCompany.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Usuário não tem acesso a esta empresa'
      });
    }

    // Atualizar último acesso
    await userCompanyService.updateLastActivity(userId, companyId);

    res.json({
      success: true,
      message: 'Último acesso atualizado com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao atualizar último acesso:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * Verifica status do usuário por email
 */
const checkUserStatus = async (req, res) => {
  try {
    const { email, companyAlias } = req.body;

    if (!email || !companyAlias) {
      return res.status(400).json({
        success: false,
        message: 'Email e company alias são obrigatórios'
      });
    }

    const result = await whitelabelService.checkUserStatus(email, companyAlias);
    res.json(result);

  } catch (error) {
    console.error('❌ Erro ao verificar status do usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * Registra novo usuário vinculado aa empresa
 */
const registerNewUser = async (req, res) => {
  try {
    const { name, email, password, companyAlias } = req.body;

    if (!name || !email || !password || !companyAlias) {
      return res.status(400).json({
        success: false,
        message: 'Nome, email, senha e company alias são obrigatórios'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Senha deve ter pelo menos 6 caracteres'
      });
    }

    const result = await whitelabelService.registerNewUserWithCompany(
      { name, email, password },
      companyAlias
    );

    res.status(201).json(result);

  } catch (error) {
    console.error('❌ Erro ao registrar novo usuário:', error);
    
    if (error.message === 'Este email já está em uso') {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * Vincula usuário existente aa empresa
 */
const linkExistingUser = async (req, res) => {
  try {
    // console.log('🚀 [WhitelabelController] Iniciando linkExistingUser...');
    // console.log('🚀 [WhitelabelController] Body:', req.body);
    
    const { userId, password, companyAlias } = req.body;

    if (!userId || !password || !companyAlias) {
      // console.log('❌ [WhitelabelController] Dados obrigatórios faltando');
      return res.status(400).json({
        success: false,
        message: 'UserId, senha e company alias são obrigatórios'
      });
    }

    // console.log('✅ [WhitelabelController] Dados válidos, chamando serviço...');
    const result = await whitelabelService.linkExistingUserToCompany(
      userId,
      password,
      companyAlias
    );

    // console.log('📋 [WhitelabelController] Resultado do serviço:', result);

    if (!result.success) {
      // console.log('❌ [WhitelabelController] Falha no serviço, retornando 401');
      return res.status(401).json(result);
    }

    // console.log('✅ [WhitelabelController] Sucesso, retornando resultado');
    res.json(result);

  } catch (error) {
    // console.error('❌ [WhitelabelController] Erro ao vincular usuário existente:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * Completa dados do primeiro acesso do usuário
 */
const completeFirstAccess = async (req, res) => {
  try {
    console.log('🔥 FIRST ACCESS CONTROLLER - NEW VERSION RUNNING!');
    console.log('🔥 Request body:', req.body);
    const { userId, cpf, phone, birthDate } = req.body;

    if (!userId || !cpf || !phone || !birthDate) {
      return res.status(400).json({
        success: false,
        message: 'Todos os campos são obrigatórios (userId, cpf, phone, birthDate)'
      });
    }

    // Validar CPF (deve ter 11 dígitos)
    const cleanCpf = cpf.replace(/\D/g, '');
    if (cleanCpf.length !== 11) {
      return res.status(400).json({
        success: false,
        message: 'CPF deve ter 11 dígitos'
      });
    }

    // Validar telefone (deve ter pelo menos 10 dígitos)
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Telefone deve ter pelo menos 10 dígitos'
      });
    }

    // Validar data de nascimento
    const birth = new Date(birthDate);
    if (isNaN(birth.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Data de nascimento inválida'
      });
    }

    // Validar idade mínima (18 anos)
    const today = new Date();
    const age = today.getFullYear() - birth.getFullYear();
    if (age < 18) {
      return res.status(400).json({
        success: false,
        message: 'Usuário deve ter pelo menos 18 anos'
      });
    }

    const result = await whitelabelService.completeFirstAccess({
      userId,
      cpf: cleanCpf,
      phone: cleanPhone,
      birthDate
    });

    res.json(result);

  } catch (error) {
    console.error('❌ Erro ao completar primeiro acesso:', error);
    
    if (error.message === 'Usuário não encontrado') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    if (error.message === 'Usuário não está vinculado a nenhuma empresa') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('já está em uso')) {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * Cria token temporário para primeiro acesso
 */
const createFirstAccessToken = async (req, res) => {
  try {
    const user = req.user; // Vem do middleware JWT
    
    if (!user || !user.isFirstAccess) {
      return res.status(400).json({
        success: false,
        message: 'Usuário não precisa completar primeiro acesso'
      });
    }

    const redisService = require('../services/redis.service');
    const token = await redisService.createFirstAccessToken({
      userId: user.id,
      userName: user.name,
      email: user.email
    }, 600); // 10 minutos

    if (!token) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao criar token de primeiro acesso'
      });
    }

    res.json({
      success: true,
      data: { token }
    });

  } catch (error) {
    console.error('❌ Erro ao criar token de primeiro acesso:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * Obtém dados do usuário usando token de primeiro acesso
 */
const getFirstAccessData = async (req, res) => {
  try {
    const { token } = req.params;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token é obrigatório'
      });
    }

    const redisService = require('../services/redis.service');
    const userData = await redisService.getFirstAccessData(token);

    if (!userData) {
      return res.status(404).json({
        success: false,
        message: 'Token não encontrado ou expirado'
      });
    }

    // Consumir o token após o uso
    await redisService.consumeFirstAccessToken(token);

    res.json({
      success: true,
      data: userData
    });

  } catch (error) {
    console.error('❌ Erro ao obter dados de primeiro acesso:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * Lista empresas disponíveis para whitelabel
 */
const getAvailableCompanies = async (req, res) => {
  try {
    const companies = await whitelabelService.getAvailableCompanies();
    
    res.json({
      success: true,
      data: companies
    });

  } catch (error) {
    console.error('❌ Erro ao listar empresas disponíveis:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

module.exports = {
  initiateLogin,
  confirmLinking,
  authenticateUser,
  getCompanyBranding,
  getCompanyBrandingByAlias,
  getUserCompanies,
  getCompanyUsers,
  updateUserRole,
  unlinkUser,
  getCompanyStats,
  getCurrentCompany,
  updateCompanyAccess,
  checkUserStatus,
  registerNewUser,
  linkExistingUser,
  completeFirstAccess,
  createFirstAccessToken,
  getFirstAccessData,
  getAvailableCompanies
};