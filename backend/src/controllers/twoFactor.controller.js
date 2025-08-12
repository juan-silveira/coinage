const twoFactorService = require('../services/twoFactor.service');

/**
 * Lista métodos 2FA do usuário
 */
const getTwoFactorMethods = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const methods = await twoFactorService.getUserTwoFactorMethods(userId);
    
    res.json({
      success: true,
      data: {
        methods,
        hasActive2FA: methods.some(m => m.isActive)
      }
    });
  } catch (error) {
    console.error('Erro ao listar métodos 2FA:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * Configura TOTP (Google Authenticator)
 */
const setupTOTP = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const setup = await twoFactorService.setupTOTP(userId);
    
    res.json({
      success: true,
      message: 'TOTP configurado. Escaneie o QR Code com seu app autenticador.',
      data: setup
    });
  } catch (error) {
    console.error('Erro ao configurar TOTP:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro interno do servidor'
    });
  }
};

/**
 * Verifica e ativa TOTP
 */
const verifyTOTP = async (req, res) => {
  try {
    const userId = req.user.id;
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Código TOTP é obrigatório'
      });
    }
    
    const result = await twoFactorService.verifyAndActivateTOTP(userId, code);
    
    res.json({
      success: true,
      message: result.message,
      data: {
        backupCodes: result.backupCodes
      }
    });
  } catch (error) {
    console.error('Erro ao verificar TOTP:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Erro ao verificar código TOTP'
    });
  }
};

/**
 * Configura 2FA por email
 */
const setupEmail2FA = async (req, res) => {
  try {
    const userId = req.user.id;
    const { email } = req.body;
    
    const result = await twoFactorService.setupEmail2FA(userId, email);
    
    res.json({
      success: true,
      message: result.message,
      data: {
        email: result.email
      }
    });
  } catch (error) {
    console.error('Erro ao configurar Email 2FA:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro interno do servidor'
    });
  }
};

/**
 * Envia código 2FA por email
 */
const sendEmailCode = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await twoFactorService.sendEmailCode(userId);
    
    res.json({
      success: true,
      message: result.message,
      data: {
        expiresIn: result.expiresIn
      }
    });
  } catch (error) {
    console.error('Erro ao enviar código por email:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Erro ao enviar código'
    });
  }
};

/**
 * Verifica código 2FA por email
 */
const verifyEmailCode = async (req, res) => {
  try {
    const userId = req.user.id;
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Código é obrigatório'
      });
    }
    
    const result = await twoFactorService.verifyEmailCode(userId, code);
    
    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('Erro ao verificar código de email:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Erro ao verificar código'
    });
  }
};

/**
 * Verifica código 2FA (qualquer método)
 */
const verify2FA = async (req, res) => {
  try {
    const userId = req.user.id;
    const { code, method } = req.body;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Código é obrigatório'
      });
    }
    
    const result = await twoFactorService.verify2FA(userId, code, method);
    
    res.json({
      success: true,
      message: 'Código verificado com sucesso',
      data: {
        method: result.method
      }
    });
  } catch (error) {
    console.error('Erro na verificação 2FA:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Código inválido'
    });
  }
};

/**
 * Desabilita método 2FA
 */
const disable2FA = async (req, res) => {
  try {
    const userId = req.user.id;
    const { method, confirmationCode } = req.body;
    
    if (!method) {
      return res.status(400).json({
        success: false,
        message: 'Método 2FA é obrigatório'
      });
    }

    // Para operações sensíveis, exigir confirmação 2FA
    if (confirmationCode) {
      try {
        await twoFactorService.verify2FA(userId, confirmationCode);
      } catch (error) {
        return res.status(401).json({
          success: false,
          message: 'Código de confirmação inválido'
        });
      }
    }
    
    const result = await twoFactorService.disable2FA(userId, method);
    
    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('Erro ao desabilitar 2FA:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro interno do servidor'
    });
  }
};

/**
 * Gera novos códigos de backup
 */
const generateBackupCodes = async (req, res) => {
  try {
    const userId = req.user.id;
    const { confirmationCode } = req.body;
    
    // Exigir confirmação 2FA para gerar novos códigos
    if (confirmationCode) {
      try {
        await twoFactorService.verify2FA(userId, confirmationCode);
      } catch (error) {
        return res.status(401).json({
          success: false,
          message: 'Código de confirmação inválido'
        });
      }
    }
    
    const result = await twoFactorService.generateNewBackupCodes(userId);
    
    res.json({
      success: true,
      message: result.message,
      data: {
        backupCodes: result.backupCodes
      }
    });
  } catch (error) {
    console.error('Erro ao gerar códigos de backup:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro interno do servidor'
    });
  }
};

/**
 * Middleware para exigir 2FA em operações sensíveis
 */
const require2FAMiddleware = (operation) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { twoFactorCode } = req.body;
      
      const requires2FA = await twoFactorService.require2FAForOperation(userId, operation);
      
      if (requires2FA) {
        if (!twoFactorCode) {
          return res.status(400).json({
            success: false,
            message: 'Código 2FA necessário para esta operação',
            requires2FA: true
          });
        }
        
        try {
          await twoFactorService.verify2FA(userId, twoFactorCode);
        } catch (error) {
          return res.status(401).json({
            success: false,
            message: 'Código 2FA inválido'
          });
        }
      }
      
      next();
    } catch (error) {
      console.error('Erro no middleware 2FA:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  };
};

/**
 * Verifica status do 2FA para operação
 */
const check2FARequirement = async (req, res) => {
  try {
    const userId = req.user.id;
    const { operation } = req.query;
    
    const requires2FA = await twoFactorService.require2FAForOperation(userId, operation);
    const has2FA = await twoFactorService.userHas2FA(userId);
    const methods = await twoFactorService.getUserTwoFactorMethods(userId);
    
    res.json({
      success: true,
      data: {
        requires2FA,
        has2FA,
        availableMethods: methods.filter(m => m.isActive),
        operation
      }
    });
  } catch (error) {
    console.error('Erro ao verificar requisito 2FA:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

module.exports = {
  getTwoFactorMethods,
  setupTOTP,
  verifyTOTP,
  setupEmail2FA,
  sendEmailCode,
  verifyEmailCode,
  verify2FA,
  disable2FA,
  generateBackupCodes,
  require2FAMiddleware,
  check2FARequirement
};