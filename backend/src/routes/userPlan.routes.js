const express = require('express');
const router = express.Router();
const userPlanController = require('../controllers/userPlan.controller');
const { authenticateApiKey, requireApiAdmin, requireAnyAdmin } = require('../middleware/auth.middleware');
const { requirePasswordChange } = require('../middleware/session.middleware');

/**
 * @swagger
 * components:
 *   schemas:
 *     UserPlan:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           enum: [BASIC, PRO, PREMIUM]
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         syncInterval:
 *           type: integer
 *         syncIntervalMs:
 *           type: integer
 *         features:
 *           type: array
 *           items:
 *             type: string
 */

/**
 * @swagger
 * /api/user-plans:
 *   get:
 *     summary: Lista todos os planos disponíveis
 *     tags: [UserPlans]
 *     responses:
 *       200:
 *         description: Lista de planos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/UserPlan'
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/', userPlanController.getAvailablePlans);

/**
 * @swagger
 * /api/user-plans/sync-interval/{userPlan}:
 *   get:
 *     summary: Obtém o intervalo de sincronização para um plano
 *     tags: [UserPlans]
 *     parameters:
 *       - in: path
 *         name: userPlan
 *         required: true
 *         schema:
 *           type: string
 *           enum: [BASIC, PRO, PREMIUM]
 *         description: Plano do usuário
 *     responses:
 *       200:
 *         description: Intervalo de sincronização
 *       400:
 *         description: Plano inválido
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/sync-interval/:userPlan', userPlanController.getSyncInterval);

/**
 * @swagger
 * /api/user-plans/user/{userId}:
 *   get:
 *     summary: Obtém o plano atual de um usuário
 *     tags: [UserPlans]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do usuário
 *     responses:
 *       200:
 *         description: Plano do usuário
 *       400:
 *         description: ID do usuário inválido
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/user/:userId', userPlanController.getUserPlan);

/**
 * @swagger
 * /api/user-plans/user/{userId}:
 *   put:
 *     summary: Atualiza o plano de um usuário (Admin)
 *     tags: [UserPlans]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do usuário
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userPlan:
 *                 type: string
 *                 enum: [BASIC, PRO, PREMIUM]
 *                 description: Novo plano do usuário
 *     responses:
 *       200:
 *         description: Plano atualizado com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado
 *       500:
 *         description: Erro interno do servidor
 */
router.put('/user/:userId', authenticateApiKey, requireApiAdmin, requirePasswordChange, userPlanController.updateUserPlan);

/**
 * @swagger
 * /api/user-plans/statistics:
 *   get:
 *     summary: Obtém estatísticas dos planos (Admin)
 *     tags: [UserPlans]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: Estatísticas dos planos
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/statistics', authenticateApiKey, requireApiAdmin, requirePasswordChange, userPlanController.getPlanStatistics);

module.exports = router;
