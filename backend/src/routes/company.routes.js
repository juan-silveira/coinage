const express = require('express');
const router = express.Router();
const companyController = require('../controllers/company.controller');
const authMiddleware = require('../middleware/auth.middleware');
const jwtMiddleware = require('../middleware/jwt.middleware');
const { requirePasswordChange } = require('../middleware/session.middleware');

/**
 * @swagger
 * components:
 *   schemas:
 *     Company:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: ID único do empresa
 *         name:
 *           type: string
 *           description: Nome da instituição
 *         isActive:
 *           type: boolean
 *           description: Se o empresa está ativo
 *         rateLimit:
 *           type: object
 *           description: Limites de rate limit
 *           properties:
 *             requestsPerMinute:
 *               type: integer
 *             requestsPerHour:
 *               type: integer
 *             requestsPerDay:
 *               type: integer
 *         lastActivityAt:
 *           type: string
 *           format: date-time
 *           description: Última atividade
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Data de criação
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Data de atualização
 */

/**
 * @swagger
 * /api/companies:
 *   post:
 *     summary: Cria uma nova empresa (instituição)
 *     tags: [Companies]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Company'
 *     responses:
 *       201:
 *         description: Empresa criada com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 */
router.post('/', authMiddleware.authenticateApiKey, authMiddleware.requireApiAdmin, requirePasswordChange, companyController.createCompany);

/**
 * @swagger
 * /api/companies:
 *   get:
 *     summary: Lista empresas com paginação
 *     tags: [Companies]
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
 *         description: Buscar por nome
 *     responses:
 *       200:
 *         description: Lista de empresas
 *       400:
 *         description: Parâmetros inválidos
 *       401:
 *         description: Não autorizado
 */
// Rota para API Key (mantida para compatibilidade)
router.get('/', authMiddleware.authenticateApiKey, authMiddleware.requireApiAdmin, companyController.listCompanies);

// Rota para frontend usando JWT (para admins do sistema)
router.get('/frontend', jwtMiddleware.authenticateToken, companyController.listCompanies);

/**
 * @swagger
 * /api/companies/{id}:
 *   get:
 *     summary: Obtém uma empresa por ID (acessível pela própria empresa)
 *     tags: [Companies]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da empresa
 *     responses:
 *       200:
 *         description: Empresa encontrada
 *       404:
 *         description: Empresa não encontrada
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado (só pode ver própria empresa)
 */
router.get('/:id', authMiddleware.authenticateApiKey, companyController.getCompanyById);

/**
 * @swagger
 * /api/companies/{id}:
 *   put:
 *     summary: Atualiza uma empresa
 *     tags: [Companies]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da empresa
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Company'
 *     responses:
 *       200:
 *         description: Empresa atualizada com sucesso
 *       400:
 *         description: Dados inválidos
 *       404:
 *         description: Empresa não encontrada
 *       401:
 *         description: Não autorizado
 */
router.put('/:id', authMiddleware.authenticateApiKey, authMiddleware.requireApiAdmin, companyController.updateCompany);

/**
 * @swagger
 * /api/companies/{id}/deactivate:
 *   post:
 *     summary: Desativa uma empresa
 *     tags: [Companies]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da empresa
 *     responses:
 *       200:
 *         description: Empresa desativada com sucesso
 *       400:
 *         description: Erro ao desativar
 *       401:
 *         description: Não autorizado
 */
router.post('/:id/deactivate', authMiddleware.authenticateApiKey, authMiddleware.requireApiAdmin, companyController.deactivateCompany);

/**
 * @swagger
 * /api/companies/{id}/activate:
 *   post:
 *     summary: Reativa um empresa
 *     tags: [Companies]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do empresa
 *     responses:
 *       200:
 *         description: empresa reativado com sucesso
 *       400:
 *         description: Erro ao reativar
 *       401:
 *         description: Não autorizado
 */
router.post('/:id/activate', authMiddleware.authenticateApiKey, authMiddleware.requireApiAdmin, companyController.activateCompany);

/**
 * @swagger
 * /api/companies/{id}/rate-limits:
 *   put:
 *     summary: Atualiza rate limits de um empresa
 *     tags: [Companies]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do empresa
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rateLimit
 *             properties:
 *               rateLimit:
 *                 $ref: '#/components/schemas/Company/properties/rateLimit'
 *     responses:
 *       200:
 *         description: Rate limits atualizados com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 */
router.put('/:id/rate-limits', authMiddleware.authenticateApiKey, authMiddleware.requireApiAdmin, companyController.updateRateLimits);

/**
 * @swagger
 * /api/companies/{id}/usage-stats:
 *   get:
 *     summary: Obtém estatísticas de uso de um empresa (acessível pelo próprio empresa)
 *     tags: [Companies]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do empresa
 *     responses:
 *       200:
 *         description: Estatísticas obtidas com sucesso
 *       400:
 *         description: Erro ao obter estatísticas
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado (só pode ver próprio empresa)
 */
router.get('/:id/usage-stats', authMiddleware.authenticateApiKey, companyController.getCompanyUsageStats);

/**
 * @swagger
 * /api/companies/{id}/users:
 *   get:
 *     summary: Lista usuários de um empresa (acessível pelo próprio empresa)
 *     tags: [Companies]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do empresa
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
 *         description: Lista de usuários
 *       400:
 *         description: Parâmetros inválidos
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado (só pode ver próprio empresa)
 */
router.get('/:id/users', authMiddleware.authenticateApiKey, companyController.getCompanyUsers);

/**
 * @swagger
 * /api/companies/{id}/users/stats:
 *   get:
 *     summary: Obtém estatísticas dos usuários de um empresa
 *     tags: [Companies]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do empresa
 *     responses:
 *       200:
 *         description: Estatísticas obtidas com sucesso
 *       400:
 *         description: Erro ao obter estatísticas
 *       401:
 *         description: Não autorizado
 */
router.get('/:id/users/stats', authMiddleware.authenticateApiKey, companyController.getCompanyUsersStats);

/**
 * @swagger
 * /api/companies/{id}/requests/stats:
 *   get:
 *     summary: Obtém estatísticas de requests de um empresa
 *     tags: [Companies]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do empresa
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [day, week, month, year]
 *           default: day
 *         description: Período para as estatísticas
 *     responses:
 *       200:
 *         description: Estatísticas obtidas com sucesso
 *       400:
 *         description: Erro ao obter estatísticas
 *       401:
 *         description: Não autorizado
 */
router.get('/:id/requests/stats', authMiddleware.authenticateApiKey, companyController.getCompanyRequestsStats);

/**
 * @swagger
 * /api/companies/test/service:
 *   get:
 *     summary: Testa o serviço de empresas
 *     tags: [Companies]
 *     responses:
 *       200:
 *         description: Teste executado com sucesso
 *       500:
 *         description: Erro no teste
 */
router.get('/test/service', companyController.testService);

module.exports = router; 