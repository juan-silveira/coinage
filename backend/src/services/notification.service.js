const { PrismaClient } = require('../generated/prisma');

class NotificationService {
  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Limpar markdown de uma string, mantendo emojis
   */
  cleanMarkdown(text) {
    if (!text) return text;
    
    // Remover markdown básico, mas manter emojis
    return text
      .replace(/\*\*(.*?)\*\*/g, '$1') // **bold** -> bold
      .replace(/\*(.*?)\*/g, '$1')     // *italic* -> italic
      .replace(/`(.*?)`/g, '$1')       // `code` -> code
      .replace(/\[(.*?)\]\(.*?\)/g, '$1') // [text](url) -> text
      .replace(/^#{1,6}\s+/gm, '')    // # heading -> heading
      .replace(/^\s*[-*+]\s+/gm, '')  // - list item -> list item
      .replace(/^\s*\d+\.\s+/gm, '')  // 1. list item -> list item
      .replace(/\n\s*\n/g, '\n')      // Múltiplas quebras de linha -> uma
      .trim();
  }

  /**
   * Obter emoji baseado no tipo de notificação
   */
  getNotificationEmoji(type) {
    const emojiMap = {
      'balance_change': '💰',
      'token_received': '📥',
      'token_sent': '📤',
      'system': '🔔',
      'warning': '⚠️',
      'success': '✅',
      'error': '❌',
      'info': 'ℹ️'
    };
    
    return emojiMap[type] || '🔔';
  }

  /**
   * Criar uma nova notificação
   */
  async createNotification(data) {
    try {
      const notification = await this.prisma.notification.create({
        data: {
          userId: data.userId,
          sender: data.sender || 'coinage',
          title: data.title,
          message: data.message,
          isRead: false,
          isActive: true
        }
      });
      
      // Emitir evento para notificações em tempo real
      this.emitNotificationEvent(notification);
      
      return notification;
    } catch (error) {
      console.error('Erro ao criar notificação:', error);
      throw error;
    }
  }

  /**
   * Emitir evento de notificação criada
   */
  emitNotificationEvent(notification) {
    try {
      // Emitir evento no processo para que outros componentes possam escutar
      process.emit('notification:created', {
        userId: notification.userId,
        notification: notification,
        timestamp: new Date().toISOString()
      });
      
      // Se existir WebSocket global, emitir para o usuário específico
      if (global.io) {
        global.io.to(`user:${notification.userId}`).emit('notification', {
          notification: notification,
          timestamp: new Date().toISOString()
        });
      }
      
    } catch (error) {
      console.error('❌ Erro ao emitir evento de notificação:', error);
    }
  }

  /**
   * Listar todas as notificações de um usuário (incluindo excluídas)
   */
  async getAllNotifications(userId) {
    try {
      const notifications = await this.prisma.notification.findMany({
        where: {
          userId: userId
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      return notifications;
    } catch (error) {
      console.error('Erro ao buscar todas as notificações:', error);
      throw error;
    }
  }

  /**
   * Listar todas as notificações ativas de um usuário
   */
  async getActiveNotifications(userId) {
    try {
      const notifications = await this.prisma.notification.findMany({
        where: {
          userId: userId,
          isActive: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      return notifications;
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
      throw error;
    }
  }

  /**
   * Obter notificação específica por ID
   */
  async getNotificationById(notificationId, userId) {
    try {
      const notification = await this.prisma.notification.findFirst({
        where: {
          id: notificationId,
          userId: userId,
          isActive: true
        }
      });
      return notification;
    } catch (error) {
      console.error('Erro ao buscar notificação por ID:', error);
      throw error;
    }
  }

  /**
   * Listar notificações não lidas de um usuário
   */
  async getUnreadNotifications(userId) {
    try {
      const notifications = await this.prisma.notification.findMany({
        where: {
          userId: userId,
          isActive: true,
          isRead: false
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      return notifications;
    } catch (error) {
      console.error('Erro ao buscar notificações não lidas:', error);
      throw error;
    }
  }

  /**
   * Marcar notificação como lida
   */
  async markAsRead(notificationId) {
    try {
      const notification = await this.prisma.notification.update({
        where: {
          id: notificationId
        },
        data: {
          isRead: true,
          readDate: new Date()
        }
      });
      return notification;
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
      throw error;
    }
  }

  /**
   * Marcar notificação como não lida
   */
  async markAsUnread(notificationId) {
    try {
      const notification = await this.prisma.notification.update({
        where: {
          id: notificationId
        },
        data: {
          isRead: false,
          readDate: null
        }
      });
      return notification;
    } catch (error) {
      console.error('Erro ao marcar notificação como não lida:', error);
      throw error;
    }
  }

  /**
   * Marcar/desmarcar notificação como favorita
   */
  async toggleFavorite(notificationId) {
    try {
      const currentNotification = await this.prisma.notification.findUnique({
        where: { id: notificationId }
      });

      const notification = await this.prisma.notification.update({
        where: {
          id: notificationId
        },
        data: {
          isFavorite: !currentNotification.isFavorite
        }
      });
      return notification;
    } catch (error) {
      console.error('Erro ao alternar favorito da notificação:', error);
      throw error;
    }
  }

  /**
   * Marcar múltiplas notificações como lidas
   */
  async markMultipleAsRead(notificationIds) {
    try {
      const result = await this.prisma.notification.updateMany({
        where: {
          id: { in: notificationIds }
        },
        data: {
          isRead: true,
          readDate: new Date()
        }
      });
      return result;
    } catch (error) {
      console.error('Erro ao marcar múltiplas notificações como lidas:', error);
      throw error;
    }
  }

  /**
   * Marcar todas as notificações de um usuário como lidas
   */
  async markAllAsRead(userId) {
    try {
      const result = await this.prisma.notification.updateMany({
        where: {
          userId: userId,
          isActive: true,
          isRead: false
        },
        data: {
          isRead: true,
          readDate: new Date()
        }
      });
      return result;
    } catch (error) {
      console.error('Erro ao marcar todas as notificações como lidas:', error);
      throw error;
    }
  }

  /**
   * Marcar todas as notificações de um usuário como não lidas
   */
  async markAllAsUnread(userId) {
    try {
      const result = await this.prisma.notification.updateMany({
        where: {
          userId: userId,
          isActive: true,
          isRead: true
        },
        data: {
          isRead: false,
          readDate: null
        }
      });
      return result;
    } catch (error) {
      console.error('Erro ao marcar todas as notificações como não lidas:', error);
      throw error;
    }
  }

  /**
   * Excluir múltiplas notificações
   */
  async deleteMultipleNotifications(notificationIds) {
    try {
      const result = await this.prisma.notification.updateMany({
        where: {
          id: { in: notificationIds }
        },
        data: {
          isActive: false,
          deleteDate: new Date()
        }
      });
      return result;
    } catch (error) {
      console.error('Erro ao excluir múltiplas notificações:', error);
      throw error;
    }
  }

  /**
   * Restaurar notificação excluída
   */
  async restoreNotification(notificationId, userId) {
    try {
      const notification = await this.prisma.notification.update({
        where: {
          id: notificationId,
          userId: userId
        },
        data: {
          isActive: true,
          deleteDate: null
        }
      });
      return notification;
    } catch (error) {
      console.error('Erro ao restaurar notificação:', error);
      throw error;
    }
  }

  /**
   * Marcar notificação como excluída (soft delete)
   */
  async deleteNotification(notificationId) {
    try {
      const notification = await this.prisma.notification.update({
        where: {
          id: notificationId
        },
        data: {
          isActive: false,
          deleteDate: new Date()
        }
      });
      return notification;
    } catch (error) {
      console.error('Erro ao excluir notificação:', error);
      throw error;
    }
  }

  /**
   * Contar notificações não lidas de um usuário
   */
  async getUnreadCount(userId) {
    try {
      const count = await this.prisma.notification.count({
        where: {
          userId: userId,
          isActive: true,
          isRead: false
        }
      });
      return count;
    } catch (error) {
      console.error('Erro ao contar notificações não lidas:', error);
      throw error;
    }
  }

  /**
   * Criar notificação de mudança de saldo de token
   */
  async createBalanceChangeNotification(userId, tokenSymbol, oldAmount, newAmount, changePercent, changeType) {
    try {
      const emoji = changeType === 'aumentou' ? '📈' : '📉';
      const notification = await this.createNotification({
        userId: userId,
        sender: 'coinage',
        title: `${emoji} Mudança no saldo de ${tokenSymbol}`,
        message: `Seu saldo do token **${tokenSymbol}** ${changeType} de **${oldAmount}** para **${newAmount}** (${changePercent}%).`
      });
      
      return notification;
    } catch (error) {
      console.error('Erro ao criar notificação de mudança de saldo:', error);
      throw error;
    }
  }

  /**
   * Criar notificação de mudança de saldo de token
   */
  async createTokenBalanceChangeNotification(userId, oldBalance, newBalance, tokenSymbol, walletAddress) {
    try {
      const balanceChange = newBalance - oldBalance;
      const changeType = balanceChange > 0 ? 'recebeu' : 'perdeu';
      const changeAmount = Math.abs(balanceChange);
      
      let title, message;
      
      if (balanceChange > 0) {
        title = `💰 Recebimento de ${tokenSymbol}`;
        message = `Sua carteira **${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}** recebeu **${changeAmount.toFixed(6)} ${tokenSymbol}**. Saldo anterior: **${oldBalance.toFixed(6)}**, Saldo atual: **${newBalance.toFixed(6)}**.`;
      } else if (balanceChange < 0) {
        title = `💸 Transferência de ${tokenSymbol}`;
        message = `Sua carteira **${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}** transferiu **${changeAmount.toFixed(6)} ${tokenSymbol}**. Saldo atual: **${newBalance.toFixed(6)}**.`;
      } else {
        return null; // Sem mudança
      }
      
      const notification = await this.createNotification({
        userId: userId,
        sender: 'coinage',
        title,
        message
      });
      
      return notification;
    } catch (error) {
      console.error('Erro ao criar notificação de mudança de saldo:', error);
      throw error;
    }
  }
}

module.exports = NotificationService;
