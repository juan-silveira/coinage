const express = require('express');
const router = express.Router();
const userActionsController = require('../controllers/userActions.controller');
const jwtMiddleware = require('../middleware/jwt.middleware');
const adminMiddleware = require('../middleware/admin.middleware');

// Middleware de autenticação para todas as rotas
router.use(jwtMiddleware.authenticateToken);

/**
 * @swagger
 * /api/user-actions/timeline:
 *   get:
 *     summary: Obtém a timeline de atividades do usuário
 *     tags: [User Actions]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Número de itens na timeline
 *     responses:
 *       200:
 *         description: Timeline obtida com sucesso
 *       401:
 *         description: Token inválido
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/timeline', userActionsController.getUserTimeline);

/**
 * @swagger
 * /api/user-actions:
 *   get:
 *     summary: Obtém ações detalhadas do usuário com filtros
 *     tags: [User Actions]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [authentication, profile, financial, blockchain, security, system, admin]
 *         description: Filtrar por categoria
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *         description: Filtrar por ação específica
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [success, failed, pending, cancelled]
 *         description: Filtrar por status
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Data inicial (ISO 8601)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Data final (ISO 8601)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Número de itens por página
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Número de itens a pular
 *       - in: query
 *         name: orderBy
 *         schema:
 *           type: string
 *           default: performedAt
 *         description: Campo para ordenação
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Direção da ordenação
 *     responses:
 *       200:
 *         description: Ações obtidas com sucesso
 *       400:
 *         description: Parâmetros inválidos
 *       401:
 *         description: Token inválido
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/', userActionsController.getUserActions);

/**
 * @swagger
 * /api/user-actions/stats:
 *   get:
 *     summary: Obtém estatísticas das ações do usuário
 *     tags: [User Actions]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           default: 30d
 *           example: "7d, 30d, 90d, 1y"
 *         description: Período para análise
 *     responses:
 *       200:
 *         description: Estatísticas obtidas com sucesso
 *       401:
 *         description: Token inválido
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/stats', userActionsController.getUserActionStats);

/**
 * @swagger
 * /api/user-actions/export:
 *   get:
 *     summary: Exporta ações do usuário
 *     tags: [User Actions]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, csv]
 *           default: json
 *         description: Formato de exportação
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filtrar por categoria
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Data inicial
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Data final
 *     responses:
 *       200:
 *         description: Arquivo exportado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *           text/csv:
 *             schema:
 *               type: string
 *       401:
 *         description: Token inválido
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/export', userActionsController.exportUserActions);

// Rotas administrativas
/**
 * @swagger
 * /api/user-actions/admin/category/{category}:
 *   get:
 *     summary: Obtém ações por categoria (admin)
 *     tags: [User Actions, Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *           enum: [authentication, profile, financial, blockchain, security, system, admin]
 *         description: Categoria das ações
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Data inicial
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Data final
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Número de itens por página
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Número de itens a pular
 *     responses:
 *       200:
 *         description: Ações por categoria obtidas com sucesso
 *       401:
 *         description: Token inválido
 *       403:
 *         description: Acesso negado (apenas admin)
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/admin/category/:category', adminMiddleware.requireAnyAdmin, userActionsController.getActionsByCategory);

/**
 * @swagger
 * /api/user-actions/admin/suspicious:
 *   get:
 *     summary: Obtém métricas de atividade suspeita (admin)
 *     tags: [User Actions, Admin, Security]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: hours
 *         schema:
 *           type: integer
 *           default: 24
 *         description: Período em horas para análise
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Número de atividades suspeitas
 *     responses:
 *       200:
 *         description: Atividades suspeitas obtidas com sucesso
 *       401:
 *         description: Token inválido
 *       403:
 *         description: Acesso negado (apenas admin)
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/admin/suspicious', adminMiddleware.requireAnyAdmin, userActionsController.getSuspiciousActivity);

module.exports = router;