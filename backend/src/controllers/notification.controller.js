const NotificationService = require('../services/notification.service');

class NotificationController {
  constructor() {
    this.notificationService = new NotificationService();
  }

  /**
   * Listar todas as notificações (incluindo excluídas)
   */
  async getNotifications(req, res) {
    try {
      const userId = req.user.id;
      const notifications = await this.notificationService.getAllNotifications(userId);
      res.json({
        success: true,
        data: notifications
      });
    } catch (error) {
      console.error('Erro no controlador de notificações:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  /**
   * Obter notificação específica por ID
   */
  async getNotificationById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'ID da notificação é obrigatório'
        });
      }

      const notification = await this.notificationService.getNotificationById(id, userId);
      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notificação não encontrada'
        });
      }

      res.json({
        success: true,
        data: notification
      });
    } catch (error) {
      console.error('Erro ao buscar notificação:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  /**
   * Listar notificações não lidas
   */
  async getUnreadNotifications(req, res) {
    try {
      const userId = req.user.id;
      const notifications = await this.notificationService.getUnreadNotifications(userId);
      res.json({
        success: true,
        data: notifications
      });
    } catch (error) {
      console.error('Erro ao buscar notificações não lidas:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  /**
   * Marcar notificação como lida
   */
  async markAsRead(req, res) {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'ID da notificação é obrigatório'
        });
      }

      const notification = await this.notificationService.markAsRead(id);
      res.json({
        success: true,
        data: notification,
        message: 'Notificação marcada como lida'
      });
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  /**
   * Excluir notificação (soft delete)
   */
  async deleteNotification(req, res) {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'ID da notificação é obrigatório'
        });
      }

      const notification = await this.notificationService.deleteNotification(id);
      res.json({
        success: true,
        data: notification,
        message: 'Notificação excluída com sucesso'
      });
    } catch (error) {
      console.error('Erro ao excluir notificação:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  /**
   * Marcar notificação como não lida
   */
  async markAsUnread(req, res) {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'ID da notificação é obrigatório'
        });
      }

      const notification = await this.notificationService.markAsUnread(id);
      res.json({
        success: true,
        data: notification,
        message: 'Notificação marcada como não lida'
      });
    } catch (error) {
      console.error('Erro ao marcar notificação como não lida:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  /**
   * Marcar/desmarcar notificação como favorita
   */
  async toggleFavorite(req, res) {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'ID da notificação é obrigatório'
        });
      }

      const notification = await this.notificationService.toggleFavorite(id);
      res.json({
        success: true,
        data: notification,
        message: `Notificação ${notification.isFavorite ? 'marcada como' : 'removida dos'} favoritos`
      });
    } catch (error) {
      console.error('Erro ao alternar favorito da notificação:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  /**
   * Marcar múltiplas notificações como lidas
   */
  async markMultipleAsRead(req, res) {
    try {
      const { notificationIds } = req.body;
      
      if (!notificationIds || !Array.isArray(notificationIds)) {
        return res.status(400).json({
          success: false,
          message: 'Lista de IDs de notificações é obrigatória'
        });
      }

      const result = await this.notificationService.markMultipleAsRead(notificationIds);
      res.json({
        success: true,
        data: result,
        message: `${result.count} notificação(ões) marcada(s) como lida(s)`
      });
    } catch (error) {
      console.error('Erro ao marcar múltiplas notificações como lidas:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  /**
   * Marcar todas as notificações como lidas
   */
  async markAllAsRead(req, res) {
    try {
      const userId = req.user.id;
      const result = await this.notificationService.markAllAsRead(userId);
      res.json({
        success: true,
        data: result,
        message: `${result.count} notificação(ões) marcada(s) como lida(s)`
      });
    } catch (error) {
      console.error('Erro ao marcar todas as notificações como lidas:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  /**
   * Marcar todas as notificações como não lidas
   */
  async markAllAsUnread(req, res) {
    try {
      const userId = req.user.id;
      const result = await this.notificationService.markAllAsUnread(userId);
      res.json({
        success: true,
        data: result,
        message: `${result.count} notificação(ões) marcada(s) como não lida(s)`
      });
    } catch (error) {
      console.error('Erro ao marcar todas as notificações como não lidas:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  /**
   * Excluir múltiplas notificações
   */
  async deleteMultipleNotifications(req, res) {
    try {
      const { notificationIds } = req.body;
      
      if (!notificationIds || !Array.isArray(notificationIds)) {
        return res.status(400).json({
          success: false,
          message: 'Lista de IDs de notificações é obrigatória'
        });
      }

      const result = await this.notificationService.deleteMultipleNotifications(notificationIds);
      res.json({
        success: true,
        data: result,
        message: `${result.count} notificação(ões) excluída(s)`
      });
    } catch (error) {
      console.error('Erro ao excluir múltiplas notificações:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  /**
   * Contar notificações não lidas
   */
  async getUnreadCount(req, res) {
    try {
      const userId = req.user.id;
      const count = await this.notificationService.getUnreadCount(userId);
      res.json({
        success: true,
        data: { count }
      });
    } catch (error) {
      console.error('Erro ao contar notificações não lidas:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  /**
   * Restaurar notificação excluída
   */
  async restoreNotification(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      const result = await this.notificationService.restoreNotification(id, userId);
      
      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'Notificação não encontrada'
        });
      }
      
      res.json({
        success: true,
        data: result,
        message: 'Notificação restaurada com sucesso'
      });
    } catch (error) {
      console.error('Erro ao restaurar notificação:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  /**
   * Criar notificação (para uso interno do sistema)
   */
  async createNotification(req, res) {
    try {
      const { userId, sender, title, message } = req.body;
      
      if (!userId || !title || !message) {
        return res.status(400).json({
          success: false,
          message: 'userId, título e mensagem são obrigatórios'
        });
      }

      const notification = await this.notificationService.createNotification({
        userId,
        sender: sender || 'coinage',
        title,
        message
      });

      res.status(201).json({
        success: true,
        data: notification,
        message: 'Notificação criada com sucesso'
      });
    } catch (error) {
      console.error('Erro ao criar notificação:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }
}

module.exports = NotificationController;
