const express = require('express');
const router = express.Router();
const NotificationController = require('../controllers/notification.controller');
const { authenticateToken } = require('../middleware/jwt.middleware');

const notificationController = new NotificationController();

// Rotas públicas (para uso interno do sistema)
router.post('/create', notificationController.createNotification.bind(notificationController));

// Rotas protegidas (requerem autenticação JWT)
router.get('/', authenticateToken, notificationController.getNotifications.bind(notificationController));
router.get('/unread', authenticateToken, notificationController.getUnreadNotifications.bind(notificationController));
router.get('/unread-count', authenticateToken, notificationController.getUnreadCount.bind(notificationController));
router.get('/:id', authenticateToken, notificationController.getNotificationById.bind(notificationController));
router.put('/mark-multiple-read', authenticateToken, notificationController.markMultipleAsRead.bind(notificationController));
router.put('/mark-all-read', authenticateToken, notificationController.markAllAsRead.bind(notificationController));
router.put('/mark-all-unread', authenticateToken, notificationController.markAllAsUnread.bind(notificationController));
router.put('/:id/read', authenticateToken, notificationController.markAsRead.bind(notificationController));
router.put('/:id/unread', authenticateToken, notificationController.markAsUnread.bind(notificationController));
router.put('/:id/favorite', authenticateToken, notificationController.toggleFavorite.bind(notificationController));
router.put('/:id/restore', authenticateToken, notificationController.restoreNotification.bind(notificationController));
router.delete('/delete-multiple', authenticateToken, notificationController.deleteMultipleNotifications.bind(notificationController));
router.delete('/:id', authenticateToken, notificationController.deleteNotification.bind(notificationController));

module.exports = router;
