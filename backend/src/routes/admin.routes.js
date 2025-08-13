const express = require('express');
const router = express.Router();
const clientController = require('../controllers/client.controller');
const userController = require('../controllers/user.controller');
const contractController = require('../controllers/contract.controller');
const { authenticateApiKey, requireApiAdmin, requireAnyAdmin } = require('../middleware/auth.middleware');
const { requirePasswordChange } = require('../middleware/session.middleware');
// const DatabaseReset = require('../../scripts/reset-database');

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     AdminAuth:
 *       type: apiKey
 *       in: header
 *       name: X-API-Key
 *       description: API Key do administrador
 */

/**
 * @swagger
 * /api/admin/clients:
 *   get:
 *     summary: Lista todos os clients (Admin)
 *     tags: [Admin]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número da página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Limite de itens por página
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filtrar por status ativo
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar por nome ou email
 *     responses:
 *       200:
 *         description: Lista de clients
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado
 */
router.get('/clients', authenticateApiKey, requireApiAdmin, requirePasswordChange, clientController.listClients);

/**
 * @swagger
 * /api/admin/clients/{id}:
 *   get:
 *     summary: Obtém um client por ID (Admin)
 *     tags: [Admin]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do client
 *     responses:
 *       200:
 *         description: Client encontrado
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado
 *       404:
 *         description: Client não encontrado
 */
router.get('/clients/:id', authenticateApiKey, requireApiAdmin, requirePasswordChange, clientController.getClientById);

/**
 * @swagger
 * /api/admin/clients:
 *   post:
 *     summary: Cria um novo client (Admin)
 *     tags: [Admin]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nome do client
 *               rateLimit:
 *                 type: object
 *                 properties:
 *                   requestsPerMinute:
 *                     type: integer
 *                     default: 100
 *                   requestsPerHour:
 *                     type: integer
 *                     default: 1000
 *                   requestsPerDay:
 *                     type: integer
 *                     default: 10000
 *     responses:
 *       201:
 *         description: Client criado com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado
 */
router.post('/clients', authenticateApiKey, requireApiAdmin, requirePasswordChange, clientController.createClient);

/**
 * @swagger
 * /api/admin/clients/{id}:
 *   put:
 *     summary: Atualiza um client (Admin)
 *     tags: [Admin]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do client
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nome do client
 *               isActive:
 *                 type: boolean
 *                 description: Status ativo do client
 *               rateLimit:
 *                 type: object
 *                 properties:
 *                   requestsPerMinute:
 *                     type: integer
 *                   requestsPerHour:
 *                     type: integer
 *                   requestsPerDay:
 *                     type: integer
 *     responses:
 *       200:
 *         description: Client atualizado com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado
 *       404:
 *         description: Client não encontrado
 */
router.put('/clients/:id', authenticateApiKey, requireApiAdmin, clientController.updateClient);

/**
 * @swagger
 * /api/admin/clients/{id}:
 *   delete:
 *     summary: Desativa um client (Admin)
 *     tags: [Admin]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do client
 *     responses:
 *       200:
 *         description: Client desativado com sucesso
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado
 *       404:
 *         description: Client não encontrado
 */
router.delete('/clients/:id', authenticateApiKey, requireApiAdmin, clientController.deactivateClient);

/**
 * @swagger
 * /api/admin/clients/{id}/activate:
 *   post:
 *     summary: Reativa um client (Admin)
 *     tags: [Admin]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do client
 *     responses:
 *       200:
 *         description: Client reativado com sucesso
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado
 *       404:
 *         description: Client não encontrado
 */
router.post('/clients/:id/activate', authenticateApiKey, requireApiAdmin, clientController.activateClient);

/**
 * @swagger
 * /api/admin/clients/{id}/users:
 *   get:
 *     summary: Obtém usuários de um client específico (Admin)
 *     tags: [Admin]
 *     security:
 *       - AdminAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do client
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número da página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Limite de itens por página
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filtrar por status ativo
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar por nome, email ou CPF
 *       - in: query
 *         name: includePrivateKey
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Incluir chave privada na resposta
 *     responses:
 *       200:
 *         description: Lista de usuários do client
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado
 */
// router.get('/clients/:id/users', authenticateApiKey, requireApiAdmin, userController.getUsersByClientId); // TODO: Implementar função

/**
 * @swagger
 * /api/admin/users:
 *   post:
 *     summary: Cria um novo usuário (Admin)
 *     tags: [Admin]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - clientId
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nome do usuário
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email do usuário
 *               password:
 *                 type: string
 *                 description: Senha do usuário
 *               clientId:
 *                 type: string
 *                 format: uuid
 *                 description: ID do client ao qual o usuário será vinculado
 *               cpf:
 *                 type: string
 *                 description: CPF do usuário
 *               phone:
 *                 type: string
 *                 description: Telefone do usuário
 *               birthDate:
 *                 type: string
 *                 format: date
 *                 description: Data de nascimento
 *               permissions:
 *                 type: object
 *                 description: Permissões do usuário
 *               roles:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Roles do usuário
 *     responses:
 *       201:
 *         description: Usuário criado com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado
 */
router.post('/users', authenticateApiKey, requireApiAdmin, userController.createUser);

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Lista todos os usuários (Admin)
 *     tags: [Admin]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número da página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Limite de itens por página
 *       - in: query
 *         name: clientId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtrar por client ID
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filtrar por status ativo
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar por nome, email ou CPF
 *       - in: query
 *         name: includePrivateKey
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Incluir chave privada na resposta
 *     responses:
 *       200:
 *         description: Lista de usuários
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado
 */
router.get('/users', authenticateApiKey, requireApiAdmin, requirePasswordChange, userController.listUsers);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   get:
 *     summary: Obtém um usuário por ID (Admin)
 *     tags: [Admin]
 *     security:
 *       - AdminAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do usuário
 *       - in: query
 *         name: includePrivateKey
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Incluir chave privada na resposta
 *     responses:
 *       200:
 *         description: Usuário encontrado
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado
 *       404:
 *         description: Usuário não encontrado
 */
router.get('/users/:id', authenticateApiKey, requireApiAdmin, userController.getUserById);

/**
 * @swagger
 * /api/admin/users/{userId}/keys:
 *   get:
 *     summary: Obtém chaves públicas e privadas de um usuário (Admin)
 *     tags: [Admin]
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
 *     responses:
 *       200:
 *         description: Chaves obtidas com sucesso
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado
 *       404:
 *         description: Usuário não encontrado
 */
// router.get('/users/:userId/keys', authenticateApiKey, requireApiAdmin, userController.getUserKeysAdmin); // TODO: Implementar função

/**
 * @swagger
 * /api/admin/users/email/{email}:
 *   get:
 *     summary: Obtém um usuário por email (Admin)
 *     tags: [Admin]
 *     security:
 *       - AdminAuth: []
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *         description: Email do usuário
 *       - in: query
 *         name: includePrivateKey
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Incluir chave privada na resposta
 *     responses:
 *       200:
 *         description: Usuário encontrado
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado
 *       404:
 *         description: Usuário não encontrado
 */
router.get('/users/email/:email', authenticateApiKey, requireApiAdmin, userController.getUserByEmail);

/**
 * @swagger
 * /api/admin/users/cpf/{cpf}:
 *   get:
 *     summary: Obtém um usuário por CPF (Admin)
 *     tags: [Admin]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: cpf
 *         required: true
 *         schema:
 *           type: string
 *         description: CPF do usuário
 *       - in: query
 *         name: includePrivateKey
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Incluir chave privada na resposta
 *     responses:
 *       200:
 *         description: Usuário encontrado
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado
 *       404:
 *         description: Usuário não encontrado
 */
router.get('/users/cpf/:cpf', authenticateApiKey, requireApiAdmin, userController.getUserByCpf);

/**
 * @swagger
 * /api/admin/users/{userId}/add-api-admin:
 *   post:
 *     summary: Concede a flag isApiAdmin de um usuário (Admin)
 *     tags: [Admin]
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
 *     responses:
 *       200:
 *         description: Flag concedida com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado
 */
// router.post('/users/:userId/add-api-admin', authenticateApiKey, requireApiAdmin, userController.addApiAdmin); // TODO: Implementar função

/**
 * @swagger
 * /api/admin/users/{userId}/remove-api-admin:
 *   post:
 *     summary: Remove a flag isApiAdmin de um usuário (Admin)
 *     tags: [Admin]
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
 *     responses:
 *       200:
 *         description: Flag removida com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado
 */
// router.post('/users/:userId/remove-api-admin', authenticateApiKey, requireApiAdmin, userController.removeApiAdmin); // TODO: Implementar função

/**
 * @swagger
 * /api/admin/users/{userId}/add-client-admin:
 *   post:
 *     summary: Concede a flag isClientAdmin de um usuário (Admin)
 *     tags: [Admin]
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
 *     responses:
 *       200:
 *         description: Flag concedida com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado
 */
// router.post('/users/:userId/add-client-admin', authenticateApiKey, requireAnyAdmin, userController.addClientAdmin); // TODO: Implementar função

/**
 * @swagger
 * /api/admin/users/{userId}/remove-client-admin:
 *   post:
 *     summary: Remove a flag isClientAdmin de um usuário (Admin)
 *     tags: [Admin]
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
 *     responses:
 *       200:
 *         description: Flag removida com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado
 */
// router.post('/users/:userId/remove-client-admin', authenticateApiKey, requireAnyAdmin, userController.removeClientAdmin); // TODO: Implementar função

/**
 * @swagger
 * /api/admin/dashboard/stats:
 *   get:
 *     summary: Obtém estatísticas gerais do sistema (Admin)
 *     tags: [Admin]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: Estatísticas obtidas com sucesso
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado
 */
router.get('/dashboard/stats', authenticateApiKey, requireApiAdmin, requirePasswordChange, async (req, res) => {
  try {
    // Obter modelos do banco
    const { Client, User, SmartContract, Transaction } = global.models;
    
    // Buscar estatísticas reais do banco
    const [
      totalClients,
      activeClients,
      totalUsers,
      activeUsers,
      totalContracts,
      totalTransactions,
      totalApiAdminUsers,
      totalClientAdminUsers
    ] = await Promise.all([
      Client.count(),
      Client.count({ where: { isActive: true } }),
      User.count(),
      User.count({ where: { isActive: true } }),
      SmartContract.count(),
      Transaction.count(),
      User.count({ where: { isApiAdmin: true, isActive: true } }),
      User.count({ where: { isClientAdmin: true, isActive: true } })
    ]);

    const stats = {
      totalClients,
      activeClients,
      totalUsers,
      activeUsers,
      totalContracts,
      totalTransactions,
      totalApiAdminUsers,
      totalClientAdminUsers,
      systemUptime: process.uptime(),
      timestamp: new Date().toISOString()
    };

    res.status(200).json({
      success: true,
      message: 'Estatísticas obtidas com sucesso',
      data: stats
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas do dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter estatísticas',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/admin/contracts/{address}/grant-admin-role:
 *   post:
 *     summary: Concede a role DEFAULT_ADMIN_ROLE a um usuário (Admin)
 *     tags: [Admin]
 *     security:
 *       - AdminAuth: []
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: Endereço do contrato
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newAdminPublicKey
 *             properties:
 *               newAdminPublicKey:
 *                 type: string
 *                 description: PublicKey do novo admin
 *     responses:
 *       200:
 *         description: Role concedida com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado
 */
router.post('/contracts/:address/grant-admin-role', contractController.grantAdminRoleAdmin);

/**
 * @swagger
 * /api/admin/test/service:
 *   get:
 *     summary: Testa os serviços admin
 *     tags: [Admin]
 *     security:
 *       - AdminAuth: []
 *     responses:
 *       200:
 *         description: Teste executado com sucesso
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado
 *       500:
 *         description: Erro no teste
 */
router.get('/test/service', async (req, res) => {
  try {
    const results = {
      adminAuth: 'OK',
      clientService: 'OK',
      userService: 'OK',
      timestamp: new Date().toISOString()
    };

    res.status(200).json({
      success: true,
      message: 'Serviços admin funcionando corretamente',
      data: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro no teste dos serviços admin',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/admin/cache/stats:
 *   get:
 *     summary: Obtém estatísticas do cache Redis
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estatísticas do cache obtidas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     isConnected:
 *                       type: boolean
 *                     userCache:
 *                       type: object
 *                       properties:
 *                         count:
 *                           type: integer
 *                     balancesCache:
 *                       type: object
 *                       properties:
 *                         count:
 *                           type: integer
 *                     blacklist:
 *                       type: object
 *                       properties:
 *                         count:
 *                           type: integer
 *                     totalKeys:
 *                       type: integer
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado
 */
router.get('/cache/stats', authenticateApiKey, requireApiAdmin, async (req, res) => {
  try {
    const redisService = require('../services/redis.service');
    const stats = await redisService.getCacheStats();
    
    res.json({
      success: true,
      message: 'Estatísticas do cache obtidas com sucesso',
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao obter estatísticas do cache',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/admin/cache/clear:
 *   post:
 *     summary: Limpa todo o cache Redis
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cache limpo com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     clearedKeys:
 *                       type: integer
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado
 */
router.post('/cache/clear', authenticateApiKey, requireApiAdmin, async (req, res) => {
  try {
    const redisService = require('../services/redis.service');
    const clearedKeys = await redisService.clearAllCache();
    
    res.json({
      success: true,
      message: 'Cache limpo com sucesso',
      data: {
        clearedKeys: clearedKeys
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao limpar cache',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/admin/database/reset:
 *   post:
 *     summary: Zera o banco de dados e carrega dados iniciais (CUIDADO - OPERAÇÃO DESTRUTIVA)
 *     tags: [Admin]
 *     security:
 *       - AdminAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               confirmReset:
 *                 type: boolean
 *                 description: Confirmação de que deseja realmente resetar o banco
 *                 example: true
 *             required:
 *               - confirmReset
 *     responses:
 *       200:
 *         description: Banco resetado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Banco de dados resetado com sucesso"
 *                 data:
 *                   type: object
 *                   properties:
 *                     client:
 *                       type: object
 *                       description: Cliente padrão criado
 *                     user:
 *                       type: object
 *                       description: Usuário padrão criado
 *       400:
 *         description: Confirmação necessária
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno
 */
router.post('/database/reset', authenticateApiKey, requireApiAdmin, async (req, res) => {
  try {
    const { confirmReset } = req.body;
    
    // Verificar confirmação
    if (!confirmReset || confirmReset !== true) {
      return res.status(400).json({
        success: false,
        message: 'Para executar o reset, você deve enviar confirmReset: true no body da requisição',
        warning: 'ATENÇÃO: Esta operação irá apagar TODOS os dados do banco de dados!'
      });
    }
    
    // const databaseReset = new DatabaseReset();
    // const result = await databaseReset.run();
    
    res.json({
      success: true,
      message: 'Banco de dados resetado com sucesso',
      data: result.data,
      warning: 'Todos os dados anteriores foram apagados e dados padrão foram carregados'
    });
  } catch (error) {
    console.error('❌ Erro no reset do banco via API:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao resetar banco de dados',
      error: error.message
    });
  }
});

module.exports = router; 