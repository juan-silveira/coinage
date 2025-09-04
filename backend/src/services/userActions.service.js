const prismaConfig = require('../config/prisma');

// Helper function to get prisma instance
const getPrisma = () => {
  try {
    return prismaConfig.getPrisma();
  } catch (error) {
    console.error('Prisma not initialized:', error.message);
    throw new Error('Database connection not available');
  }
};

class UserActionsService {
  /**
   * Registra uma ação do usuário
   * @param {Object} actionData - Dados da ação
   * @returns {Promise<Object>} Ação criada
   */
  async logAction(actionData) {
    try {
      const {
        userId,
        companyId,
        action,
        category,
        status = 'success',
        details = null,
        metadata = null,
        relatedId = null,
        relatedType = null,
        ipAddress = null,
        userAgent = null,
        deviceInfo = null,
        location = null,
        errorMessage = null,
        errorCode = null,
        duration = null
      } = actionData;

      const userAction = await getPrisma().userAction.create({
        data: {
          userId,
          companyId,
          action,
          category,
          status,
          details,
          metadata,
          relatedId,
          relatedType,
          ipAddress,
          userAgent,
          deviceInfo,
          location,
          errorMessage,
          errorCode,
          duration
        }
      });

      return userAction;
    } catch (error) {
      console.error('Error logging user action:', error);
      // Não lançar erro para não afetar o fluxo principal
      return null;
    }
  }

  /**
   * Registra uma ação de autenticação
   */
  async logAuth(userId, action, req, additionalData = {}) {
    return this.logAction({
      userId,
      companyId: additionalData.companyId || req.company?.id,
      action,
      category: 'authentication',
      status: additionalData.status || 'success',
      ipAddress: this.getIpAddress(req),
      userAgent: req.headers['user-agent'],
      deviceInfo: this.getDeviceInfo(req),
      location: await this.getLocation(req),
      ...additionalData
    });
  }

  /**
   * Registra uma ação financeira
   */
  async logFinancial(userId, action, req, transactionData = {}) {
    return this.logAction({
      userId,
      companyId: req.company?.id,
      action,
      category: 'financial',
      status: transactionData.status || 'pending',
      details: {
        amount: transactionData.amount,
        currency: transactionData.currency || 'BRL',
        method: transactionData.method,
        ...transactionData.details
      },
      relatedId: transactionData.transactionId,
      relatedType: 'transaction',
      ipAddress: this.getIpAddress(req),
      userAgent: req.headers['user-agent'],
      ...transactionData
    });
  }

  /**
   * Registra uma ação blockchain
   */
  async logBlockchain(userId, action, req, blockchainData = {}) {
    return this.logAction({
      userId,
      companyId: req.company?.id,
      action,
      category: 'blockchain',
      status: blockchainData.status || 'pending',
      details: {
        network: blockchainData.network,
        txHash: blockchainData.txHash,
        blockNumber: blockchainData.blockNumber,
        gasUsed: blockchainData.gasUsed,
        ...blockchainData.details
      },
      relatedId: blockchainData.transactionId,
      relatedType: 'blockchain_transaction',
      ipAddress: this.getIpAddress(req),
      userAgent: req.headers['user-agent'],
      metadata: blockchainData.metadata
    });
  }

  /**
   * Registra uma ação de segurança
   */
  async logSecurity(userId, action, req, securityData = {}) {
    return this.logAction({
      userId,
      companyId: req.company?.id,
      action,
      category: 'security',
      status: securityData.status || 'success',
      details: securityData.details,
      ipAddress: this.getIpAddress(req),
      userAgent: req.headers['user-agent'],
      deviceInfo: this.getDeviceInfo(req),
      location: await this.getLocation(req),
      errorMessage: securityData.errorMessage,
      errorCode: securityData.errorCode
    });
  }

  /**
   * Registra uma ação administrativa
   */
  async logAdmin(adminId, action, targetUserId, req, adminData = {}) {
    return this.logAction({
      userId: adminId,
      companyId: req.company?.id,
      action,
      category: 'admin',
      status: adminData.status || 'success',
      details: {
        targetUserId,
        changes: adminData.changes,
        reason: adminData.reason,
        ...adminData.details
      },
      relatedId: targetUserId,
      relatedType: 'user',
      ipAddress: this.getIpAddress(req),
      userAgent: req.headers['user-agent']
    });
  }

  /**
   * Busca ações de um usuário
   */
  async getUserActions(userId, filters = {}) {
    try {
      const {
        category,
        action,
        status,
        startDate,
        endDate,
        limit = 50,
        offset = 0,
        orderBy = 'performedAt',
        order = 'desc'
      } = filters;

      const where = {
        userId,
        ...(category && { category }),
        ...(action && { action }),
        ...(status && { status }),
        ...(startDate && endDate && {
          performedAt: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        })
      };

      const [actions, total] = await Promise.all([
        prisma.userAction.findMany({
          where,
          take: limit,
          skip: offset,
          orderBy: {
            [orderBy]: order
          },
          include: {
            company: {
              select: {
                id: true,
                name: true,
                alias: true
              }
            }
          }
        }),
        prisma.userAction.count({ where })
      ]);

      return {
        actions,
        total,
        page: Math.floor(offset / limit) + 1,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      console.error('Error fetching user actions:', error);
      throw error;
    }
  }

  /**
   * Busca timeline de atividades para o dashboard
   */
  async getUserTimeline(userId, limit = 20) {
    try {
      const actions = await prisma.userAction.findMany({
        where: {
          userId,
          status: { not: 'cancelled' }
        },
        take: limit,
        orderBy: {
          performedAt: 'desc'
        },
        select: {
          id: true,
          action: true,
          category: true,
          status: true,
          details: true,
          performedAt: true,
          company: {
            select: {
              name: true,
              alias: true
            }
          }
        }
      });

      return this.formatTimeline(actions);
    } catch (error) {
      console.error('Error fetching user timeline:', error);
      throw error;
    }
  }

  /**
   * Obtém estatísticas das ações do usuário
   */
  async getUserActionStats(userId, period = '30d') {
    try {
      const startDate = this.getStartDateFromPeriod(period);

      const stats = await prisma.userAction.groupBy({
        by: ['category', 'status'],
        where: {
          userId,
          performedAt: {
            gte: startDate
          }
        },
        _count: {
          id: true
        }
      });

      return this.formatStats(stats);
    } catch (error) {
      console.error('Error fetching user action stats:', error);
      throw error;
    }
  }

  /**
   * Detecta atividade suspeita
   */
  async detectSuspiciousActivity(userId, action, req) {
    try {
      const recentActions = await prisma.userAction.findMany({
        where: {
          userId,
          action,
          performedAt: {
            gte: new Date(Date.now() - 60 * 60 * 1000) // Última hora
          }
        }
      });

      const threshold = this.getThresholdForAction(action);
      
      if (recentActions.length > threshold) {
        await this.logSecurity(userId, 'suspicious_activity', req, {
          status: 'failed',
          details: {
            action,
            count: recentActions.length,
            threshold,
            timeWindow: '1 hour'
          },
          errorMessage: 'Suspicious activity detected',
          errorCode: 'SUSPICIOUS_ACTIVITY'
        });

        return true;
      }

      return false;
    } catch (error) {
      console.error('Error detecting suspicious activity:', error);
      return false;
    }
  }

  /**
   * Helpers
   */
  getIpAddress(req) {
    return req.headers['x-forwarded-for']?.split(',')[0].trim() || 
           req.connection?.remoteAddress || 
           req.socket?.remoteAddress || 
           req.ip;
  }

  getDeviceInfo(req) {
    const userAgent = req.headers['user-agent'] || '';
    
    return {
      isMobile: /mobile/i.test(userAgent),
      isTablet: /tablet/i.test(userAgent),
      isDesktop: !/mobile|tablet/i.test(userAgent),
      browser: this.getBrowser(userAgent),
      os: this.getOS(userAgent)
    };
  }

  getBrowser(userAgent) {
    if (/chrome/i.test(userAgent)) return 'Chrome';
    if (/firefox/i.test(userAgent)) return 'Firefox';
    if (/safari/i.test(userAgent)) return 'Safari';
    if (/edge/i.test(userAgent)) return 'Edge';
    return 'Unknown';
  }

  getOS(userAgent) {
    if (/windows/i.test(userAgent)) return 'Windows';
    if (/mac/i.test(userAgent)) return 'MacOS';
    if (/linux/i.test(userAgent)) return 'Linux';
    if (/android/i.test(userAgent)) return 'Android';
    if (/ios/i.test(userAgent)) return 'iOS';
    return 'Unknown';
  }

  async getLocation(req) {
    // Implementar geolocalização por IP se necessário
    // Por enquanto retorna null
    return null;
  }

  getStartDateFromPeriod(period) {
    const now = new Date();
    const match = period.match(/(\d+)([dhmy])/);
    
    if (!match) return new Date(now - 30 * 24 * 60 * 60 * 1000);
    
    const [, value, unit] = match;
    const multipliers = {
      'd': 24 * 60 * 60 * 1000,
      'h': 60 * 60 * 1000,
      'm': 30 * 24 * 60 * 60 * 1000,
      'y': 365 * 24 * 60 * 60 * 1000
    };
    
    return new Date(now - parseInt(value) * multipliers[unit]);
  }

  getThresholdForAction(action) {
    const thresholds = {
      'login_failed': 5,
      'password_reset': 3,
      'api_key_created': 10,
      'withdraw_requested': 5,
      'transfer_sent': 10
    };
    
    return thresholds[action] || 20;
  }

  formatTimeline(actions) {
    return actions.map(action => ({
      id: action.id,
      title: this.getActionTitle(action.action),
      description: this.getActionDescription(action),
      icon: this.getActionIcon(action.category),
      color: this.getStatusColor(action.status),
      time: action.performedAt,
      category: action.category,
      status: action.status
    }));
  }

  getActionTitle(action) {
    const titles = {
      'login': 'Login realizado',
      'logout': 'Logout realizado',
      'deposit_initiated': 'Depósito iniciado',
      'deposit_confirmed': 'Depósito confirmado',
      'withdraw_requested': 'Saque solicitado',
      'transfer_sent': 'Transferência enviada',
      'transaction_confirmed': 'Transação confirmada',
      'profile_updated': 'Perfil atualizado',
      'document_uploaded': 'Documento enviado',
      'two_factor_enabled': '2FA ativado'
    };
    
    return titles[action] || action.replace(/_/g, ' ');
  }

  getActionDescription(action) {
    if (!action.details) return '';
    
    const details = action.details;
    
    if (details.amount) {
      return `Valor: R$ ${details.amount}`;
    }
    
    if (details.txHash) {
      return `TX: ${details.txHash.substring(0, 10)}...`;
    }
    
    return JSON.stringify(details).substring(0, 50);
  }

  getActionIcon(category) {
    const icons = {
      'authentication': '🔐',
      'profile': '👤',
      'financial': '💰',
      'blockchain': '⛓️',
      'security': '🛡️',
      'system': '⚙️',
      'admin': '👑'
    };
    
    return icons[category] || '📝';
  }

  getStatusColor(status) {
    const colors = {
      'success': 'green',
      'pending': 'yellow',
      'failed': 'red',
      'cancelled': 'gray'
    };
    
    return colors[status] || 'blue';
  }

  formatStats(stats) {
    const formatted = {};
    
    stats.forEach(stat => {
      if (!formatted[stat.category]) {
        formatted[stat.category] = {};
      }
      formatted[stat.category][stat.status] = stat._count.id;
    });
    
    return formatted;
  }

  /**
   * Obtém ações por categoria (método admin)
   */
  async getActionsByCategory(filters) {
    try {
      const {
        category,
        startDate,
        endDate,
        limit = 100,
        offset = 0
      } = filters;

      const where = {
        category,
        ...(startDate && endDate && {
          performedAt: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        })
      };

      const [actions, total] = await Promise.all([
        prisma.userAction.findMany({
          where,
          take: limit,
          skip: offset,
          orderBy: {
            performedAt: 'desc'
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            company: {
              select: {
                id: true,
                name: true,
                alias: true
              }
            }
          }
        }),
        prisma.userAction.count({ where })
      ]);

      return {
        actions,
        total,
        page: Math.floor(offset / limit) + 1,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      console.error('Error fetching actions by category:', error);
      throw error;
    }
  }

  /**
   * Obtém atividades suspeitas (método admin)
   */
  async getSuspiciousActivity(filters) {
    try {
      const { startDate, limit = 50 } = filters;

      const suspiciousActions = await prisma.userAction.findMany({
        where: {
          OR: [
            { action: 'suspicious_activity' },
            { category: 'security', status: 'failed' },
            { errorCode: { not: null } }
          ],
          performedAt: {
            gte: startDate
          }
        },
        take: limit,
        orderBy: {
          performedAt: 'desc'
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          company: {
            select: {
              id: true,
              name: true,
              alias: true
            }
          }
        }
      });

      // Agrupar por usuário para detectar padrões
      const userActivity = {};
      
      suspiciousActions.forEach(action => {
        if (!userActivity[action.userId]) {
          userActivity[action.userId] = {
            user: action.user,
            actions: [],
            suspiciousCount: 0,
            lastActivity: action.performedAt
          };
        }
        
        userActivity[action.userId].actions.push(action);
        userActivity[action.userId].suspiciousCount++;
        
        if (action.performedAt > userActivity[action.userId].lastActivity) {
          userActivity[action.userId].lastActivity = action.performedAt;
        }
      });

      return {
        suspiciousActions,
        userSummary: Object.values(userActivity)
          .sort((a, b) => b.suspiciousCount - a.suspiciousCount),
        totalSuspicious: suspiciousActions.length,
        uniqueUsers: Object.keys(userActivity).length
      };
    } catch (error) {
      console.error('Error fetching suspicious activity:', error);
      throw error;
    }
  }
}

module.exports = new UserActionsService();