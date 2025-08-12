const whitelabelService = require('../services/whitelabel.service');
const userClientService = require('../services/userClient.service');
const jwtService = require('../services/jwt.service');

/**
 * Inicia processo de login whitelabel
 */
const initiateLogin = async (req, res) => {
  try {
    const { email, clientId } = req.body;

    if (!email || !clientId) {
      return res.status(400).json({
        success: false,
        message: 'Email e clientId são obrigatórios'
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

    const result = await whitelabelService.initiateWhitelabelLogin(email, clientId);

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
 * Confirma vinculação de usuário ao cliente
 */
const confirmLinking = async (req, res) => {
  try {
    const { userId, clientId, password } = req.body;

    if (!userId || !clientId || !password) {
      return res.status(400).json({
        success: false,
        message: 'UserId, clientId e password são obrigatórios'
      });
    }

    const result = await whitelabelService.confirmClientLinking(userId, clientId, password);

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
 * Autentica usuário em cliente específico
 */
const authenticateUser = async (req, res) => {
  try {
    const { email, password, clientId } = req.body;

    if (!email || !password || !clientId) {
      return res.status(400).json({
        success: false,
        message: 'Email, password e clientId são obrigatórios'
      });
    }

    const result = await whitelabelService.authenticateWhitelabelUser(email, password, clientId);

    if (!result.success) {
      return res.status(401).json(result);
    }

    // Gerar tokens JWT
    const user = result.data.user;
    const tokens = jwtService.generateTokenPair({
      ...user,
      // Adicionar informações do contexto do cliente
      currentClientId: clientId,
      currentClientRole: result.data.userClient.clientRole
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
        client: result.data.client,
        userClient: result.data.userClient
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
 * Obtém configuração de branding do cliente por alias
 */
const getClientBrandingByAlias = async (req, res) => {
  try {
    const { clientAlias } = req.params;

    if (!clientAlias) {
      return res.status(400).json({
        success: false,
        message: 'Client alias é obrigatório'
      });
    }

    const branding = await whitelabelService.getClientBrandingByAlias(clientAlias);

    res.json({
      success: true,
      data: branding
    });

  } catch (error) {
    console.error('❌ Erro ao obter branding por alias:', error);
    
    if (error.message === 'Cliente não encontrado') {
      return res.status(404).json({
        success: false,
        message: 'Cliente não encontrado'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * Obtém configuração de branding do cliente
 */
const getClientBranding = async (req, res) => {
  try {
    const { clientId } = req.params;

    if (!clientId) {
      return res.status(400).json({
        success: false,
        message: 'ClientId é obrigatório'
      });
    }

    const branding = await whitelabelService.getClientBranding(clientId);

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
 * Lista clientes vinculados a um usuário
 */
const getUserClients = async (req, res) => {
  try {
    const userId = req.user.id;
    const { includeInactive } = req.query;

    const clients = await userClientService.getUserClients(userId, {
      includeInactive: includeInactive === 'true'
    });

    res.json({
      success: true,
      data: {
        clients
      }
    });

  } catch (error) {
    console.error('❌ Erro ao listar clientes do usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * Lista usuários vinculados a um cliente
 */
const getClientUsers = async (req, res) => {
  try {
    const { clientId } = req.params;
    const { 
      status = 'active',
      role,
      page = 1,
      limit = 50
    } = req.query;

    // Verificar se o usuário tem permissão para ver usuários deste cliente
    const hasPermission = await userClientService.hasPermission(
      req.user.id, 
      clientId, 
      'read_client_users'
    );

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'Sem permissão para acessar usuários deste cliente'
      });
    }

    const result = await userClientService.getClientUsers(clientId, {
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
    console.error('❌ Erro ao listar usuários do cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * Atualiza role de usuário em um cliente
 */
const updateUserRole = async (req, res) => {
  try {
    const { clientId, userId } = req.params;
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({
        success: false,
        message: 'Role é obrigatória'
      });
    }

    // Verificar se o usuário tem permissão para alterar roles
    const hasPermission = await userClientService.hasPermission(
      req.user.id, 
      clientId, 
      'update_client_users'
    );

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'Sem permissão para alterar roles neste cliente'
      });
    }

    const userClient = await userClientService.updateUserClientRole(
      userId, 
      clientId, 
      role, 
      req.user.id
    );

    res.json({
      success: true,
      message: 'Role atualizada com sucesso',
      data: {
        userClient
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
 * Remove vinculação de usuário a cliente
 */
const unlinkUser = async (req, res) => {
  try {
    const { clientId, userId } = req.params;

    // Verificar se o usuário tem permissão
    const hasPermission = await userClientService.hasPermission(
      req.user.id, 
      clientId, 
      'update_client_users'
    );

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'Sem permissão para remover usuários deste cliente'
      });
    }

    await userClientService.unlinkUserFromClient(userId, clientId);

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
 * Obtém estatísticas do cliente
 */
const getClientStats = async (req, res) => {
  try {
    const { clientId } = req.params;

    // Verificar se o usuário tem permissão
    const hasPermission = await userClientService.hasPermission(
      req.user.id, 
      clientId, 
      'read_client_users'
    );

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'Sem permissão para acessar estatísticas deste cliente'
      });
    }

    const stats = await whitelabelService.getClientStats(clientId);

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

module.exports = {
  initiateLogin,
  confirmLinking,
  authenticateUser,
  getClientBranding,
  getClientBrandingByAlias,
  getUserClients,
  getClientUsers,
  updateUserRole,
  unlinkUser,
  getClientStats
};