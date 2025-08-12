const express = require('express');
const router = express.Router();
const whitelabelController = require('../controllers/whitelabel.controller');
const { authenticateToken } = require('../middleware/jwt.middleware');
const rateLimit = require('express-rate-limit');

// Função helper para rate limiting
const rateLimitMiddleware = (options) => rateLimit(options);

// Rotas públicas (sem autenticação)
/**
 * @swagger
 * /api/whitelabel/client-branding/{clientAlias}:
 *   get:
 *     summary: Obtém configuração de branding do cliente por alias
 *     tags: [Whitelabel]
 *     parameters:
 *       - in: path
 *         name: clientAlias
 *         required: true
 *         schema:
 *           type: string
 *         description: Alias do cliente
 *     responses:
 *       200:
 *         description: Configuração de branding obtida com sucesso
 *       404:
 *         description: Cliente não encontrado
 */
router.get('/client-branding/:clientAlias', whitelabelController.getClientBrandingByAlias);

/**
 * @swagger
 * /api/whitelabel/branding/{clientId}:
 *   get:
 *     summary: Obtém configuração de branding do cliente
 *     tags: [Whitelabel]
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do cliente
 *     responses:
 *       200:
 *         description: Configuração de branding obtida com sucesso
 *       404:
 *         description: Cliente não encontrado
 */
router.get('/branding/:clientId', whitelabelController.getClientBranding);

/**
 * @swagger
 * /api/whitelabel/login/initiate:
 *   post:
 *     summary: Inicia processo de login whitelabel
 *     tags: [Whitelabel]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - clientId
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email do usuário
 *               clientId:
 *                 type: string
 *                 description: ID do cliente
 *     responses:
 *       200:
 *         description: Processo iniciado com sucesso
 *       400:
 *         description: Dados inválidos
 */
router.post('/login/initiate', 
  rateLimitMiddleware({ windowMs: 15 * 60 * 1000, max: 10 }), // 10 tentativas por 15 minutos
  whitelabelController.initiateLogin
);

/**
 * @swagger
 * /api/whitelabel/login/confirm:
 *   post:
 *     summary: Confirma vinculação de usuário ao cliente
 *     tags: [Whitelabel]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - clientId
 *               - password
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID do usuário
 *               clientId:
 *                 type: string
 *                 description: ID do cliente
 *               password:
 *                 type: string
 *                 description: Senha do usuário
 *     responses:
 *       200:
 *         description: Vinculação confirmada com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Senha incorreta
 */
router.post('/login/confirm',
  rateLimitMiddleware({ windowMs: 15 * 60 * 1000, max: 5 }), // 5 tentativas por 15 minutos
  whitelabelController.confirmLinking
);

/**
 * @swagger
 * /api/whitelabel/login/authenticate:
 *   post:
 *     summary: Autentica usuário em cliente específico
 *     tags: [Whitelabel]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - clientId
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email do usuário
 *               password:
 *                 type: string
 *                 description: Senha do usuário
 *               clientId:
 *                 type: string
 *                 description: ID do cliente
 *     responses:
 *       200:
 *         description: Autenticação realizada com sucesso
 *       401:
 *         description: Credenciais inválidas
 */
router.post('/login/authenticate',
  rateLimitMiddleware({ windowMs: 15 * 60 * 1000, max: 5 }), // 5 tentativas por 15 minutos
  whitelabelController.authenticateUser
);

// Rotas protegidas (com autenticação)
/**
 * @swagger
 * /api/whitelabel/user/clients:
 *   get:
 *     summary: Lista clientes vinculados ao usuário autenticado
 *     tags: [Whitelabel]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: includeInactive
 *         schema:
 *           type: boolean
 *         description: Incluir clientes inativos
 *     responses:
 *       200:
 *         description: Lista de clientes obtida com sucesso
 *       401:
 *         description: Token inválido
 */
router.get('/user/clients', authenticateToken, whitelabelController.getUserClients);

/**
 * @swagger
 * /api/whitelabel/client/{clientId}/users:
 *   get:
 *     summary: Lista usuários vinculados a um cliente
 *     tags: [Whitelabel]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do cliente
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, pending, revoked]
 *         description: Status da vinculação
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [USER, ADMIN, SUPER_ADMIN, APP_ADMIN]
 *         description: Role do usuário no cliente
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Página da listagem
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Limite de itens por página
 *     responses:
 *       200:
 *         description: Lista de usuários obtida com sucesso
 *       403:
 *         description: Sem permissão para acessar usuários deste cliente
 */
router.get('/client/:clientId/users', authenticateToken, whitelabelController.getClientUsers);

/**
 * @swagger
 * /api/whitelabel/client/{clientId}/users/{userId}/role:
 *   put:
 *     summary: Atualiza role de usuário em um cliente
 *     tags: [Whitelabel]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do cliente
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do usuário
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [USER, ADMIN, SUPER_ADMIN, APP_ADMIN]
 *                 description: Nova role do usuário
 *     responses:
 *       200:
 *         description: Role atualizada com sucesso
 *       403:
 *         description: Sem permissão para alterar roles
 */
router.put('/client/:clientId/users/:userId/role', authenticateToken, whitelabelController.updateUserRole);

/**
 * @swagger
 * /api/whitelabel/client/{clientId}/users/{userId}/unlink:
 *   delete:
 *     summary: Remove vinculação de usuário a cliente
 *     tags: [Whitelabel]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do cliente
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do usuário
 *     responses:
 *       200:
 *         description: Usuário desvinculado com sucesso
 *       403:
 *         description: Sem permissão para remover usuários
 */
router.delete('/client/:clientId/users/:userId/unlink', authenticateToken, whitelabelController.unlinkUser);

/**
 * @swagger
 * /api/whitelabel/client/{clientId}/stats:
 *   get:
 *     summary: Obtém estatísticas do cliente
 *     tags: [Whitelabel]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do cliente
 *     responses:
 *       200:
 *         description: Estatísticas obtidas com sucesso
 *       403:
 *         description: Sem permissão para acessar estatísticas
 */
router.get('/client/:clientId/stats', authenticateToken, whitelabelController.getClientStats);

module.exports = router;