/**
 * Middleware para verificar se o email do usuário foi confirmado
 * Bloqueia acesso a funcionalidades que requerem email verificado
 */

const prismaConfig = require('../config/prisma');

class EmailConfirmedMiddleware {
  constructor() {
    this.prisma = null;
  }

  async init() {
    if (!this.prisma) {
      this.prisma = prismaConfig.getPrisma();
    }
  }

  /**
   * Middleware que requer email confirmado
   * Bloqueia usuários com is_active = false
   */
  requireEmailConfirmation = async (req, res, next) => {
    try {
      await this.init();

      // Verificar se existe usuário na request (vem do middleware de auth)
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado',
          code: 'UNAUTHORIZED'
        });
      }

      // Buscar dados atuais do usuário
      const user = await this.prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          email: true,
          isActive: true,
          emailConfirmed: true,
          name: true
        }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado',
          code: 'USER_NOT_FOUND'
        });
      }

      // Verificar se o email foi confirmado
      if (!user.emailConfirmed) {
        return res.status(403).json({
          success: false,
          message: 'Por favor, confirme seu email antes de continuar',
          code: 'EMAIL_NOT_CONFIRMED',
          data: {
            email: user.email,
            userId: user.id,
            canResendEmail: true
          }
        });
      }

      // Email confirmado, prosseguir
      req.user.isActive = user.isActive;
      req.user.emailConfirmed = user.emailConfirmed;
      next();

    } catch (error) {
      console.error('❌ Erro no middleware de email confirmado:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        code: 'INTERNAL_SERVER_ERROR'
      });
    }
  };

  /**
   * Middleware mais suave - só adiciona warning se email não confirmado
   * Não bloqueia, mas informa status
   */
  checkEmailConfirmation = async (req, res, next) => {
    try {
      await this.init();

      if (!req.user || !req.user.id) {
        return next();
      }

      const user = await this.prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          email: true,
          isActive: true,
          emailConfirmed: true
        }
      });

      if (user) {
        req.user.isActive = user.isActive;
        req.user.emailConfirmed = user.emailConfirmed;
        
        // Adicionar header de warning se email não confirmado
        if (!user.emailConfirmed) {
          res.set('X-Email-Status', 'unconfirmed');
        }
      }

      next();

    } catch (error) {
      console.error('❌ Erro ao verificar status do email:', error);
      next(); // Não bloquear em caso de erro
    }
  };

  /**
   * Middleware para rotas que explicitamente NÃO requerem email confirmado
   * Ex: logout, confirmação de email, etc.
   */
  skipEmailConfirmation = (req, res, next) => {
    req.skipEmailConfirmation = true;
    next();
  };
}

// Exportar instância singleton
const emailConfirmedMiddleware = new EmailConfirmedMiddleware();

module.exports = {
  requireEmailConfirmation: emailConfirmedMiddleware.requireEmailConfirmation,
  checkEmailConfirmation: emailConfirmedMiddleware.checkEmailConfirmation,
  skipEmailConfirmation: emailConfirmedMiddleware.skipEmailConfirmation
};