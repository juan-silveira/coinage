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
 * /api/whitelabel/company-branding/{companyAlias}:
 *   get:
 *     summary: Obtém configuração de branding da empresa por alias
 *     tags: [Whitelabel]
 *     parameters:
 *       - in: path
 *         name: companyAlias
 *         required: true
 *         schema:
 *           type: string
 *         description: Alias da empresa
 *     responses:
 *       200:
 *         description: Configuração de branding obtida com sucesso
 *       404:
 *         description: Company não encontrado
 */
router.get('/company-branding/:companyAlias', whitelabelController.getCompanyBrandingByAlias);

/**
 * @swagger
 * /api/whitelabel/companies:
 *   get:
 *     summary: Lista empresas disponíveis para whitelabel
 *     tags: [Whitelabel]
 *     responses:
 *       200:
 *         description: Lista de empresas obtida com sucesso
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/companies', whitelabelController.getAvailableCompanies);

/**
 * @swagger
 * /api/whitelabel/branding/{companyId}:
 *   get:
 *     summary: Obtém configuração de branding da empresa
 *     tags: [Whitelabel]
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da empresa
 *     responses:
 *       200:
 *         description: Configuração de branding obtida com sucesso
 *       404:
 *         description: Company não encontrado
 */
router.get('/branding/:companyId', whitelabelController.getCompanyBranding);

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
 *               - companyId
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email do usuário
 *               companyId:
 *                 type: string
 *                 description: ID da empresa
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
 *     summary: Confirma vinculação de usuário aa empresa
 *     tags: [Whitelabel]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - companyId
 *               - password
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID do usuário
 *               companyId:
 *                 type: string
 *                 description: ID da empresa
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
 *     summary: Autentica usuário em empresa específico
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
 *               - companyId
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email do usuário
 *               password:
 *                 type: string
 *                 description: Senha do usuário
 *               companyId:
 *                 type: string
 *                 description: ID da empresa
 *     responses:
 *       200:
 *         description: Autenticação realizada com sucesso
 *       401:
 *         description: Credenciais inválidas
 */
router.post('/login/authenticate',
  rateLimitMiddleware({ windowMs: 15 * 60 * 1000, max: 50 }), // 50 tentativas por 15 minutos
  whitelabelController.authenticateUser
);

// Rotas protegidas (com autenticação)
/**
 * @swagger
 * /api/whitelabel/user/companies:
 *   get:
 *     summary: Lista empresas vinculadas ao usuário autenticado
 *     tags: [Whitelabel]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: includeInactive
 *         schema:
 *           type: boolean
 *         description: Incluir empresas inativas
 *     responses:
 *       200:
 *         description: Lista de empresas obtida com sucesso
 *       401:
 *         description: Token inválido
 */
router.get('/user/companies', authenticateToken, whitelabelController.getUserCompanies);

/**
 * @swagger
 * /api/whitelabel/user/current-company:
 *   get:
 *     summary: Obtém a empresa atual do usuário autenticado
 *     description: Retorna a empresa com último acesso mais recente
 *     tags: [Whitelabel]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Empresa atual obtida com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     currentCompany:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         name:
 *                           type: string
 *                         alias:
 *                           type: string
 *                         isActive:
 *                           type: boolean
 *                         userRole:
 *                           type: string
 *                         linkedAt:
 *                           type: string
 *                           format: date-time
 *                         lastAccessAt:
 *                           type: string
 *                           format: date-time
 *       401:
 *         description: Token inválido
 *       404:
 *         description: Nenhuma empresa ativa encontrada
 */
router.get('/user/current-company', authenticateToken, whitelabelController.getCurrentCompany);

/**
 * @swagger
 * /api/whitelabel/company/{companyId}/update-access:
 *   post:
 *     summary: Atualiza último acesso do usuário em uma empresa
 *     description: Marca a empresa como acessada mais recentemente pelo usuário
 *     tags: [Whitelabel]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da empresa
 *     responses:
 *       200:
 *         description: Último acesso atualizado com sucesso
 *       400:
 *         description: ID da empresa não fornecido
 *       403:
 *         description: Usuário sem acesso à empresa
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/company/:companyId/update-access', authenticateToken, whitelabelController.updateCompanyAccess);

/**
 * @swagger
 * /api/whitelabel/company/{companyId}/users:
 *   get:
 *     summary: Lista usuários vinculados a uma empresa
 *     tags: [Whitelabel]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da empresa
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
 *         description: Role do usuário na empresa
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
 *         description: Sem permissão para acessar usuários deste empresa
 */
router.get('/company/:companyId/users', authenticateToken, whitelabelController.getCompanyUsers);

/**
 * @swagger
 * /api/whitelabel/company/{companyId}/users/{userId}/role:
 *   put:
 *     summary: Atualiza role de usuário em um empresa
 *     tags: [Whitelabel]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da empresa
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
router.put('/company/:companyId/users/:userId/role', authenticateToken, whitelabelController.updateUserRole);

/**
 * @swagger
 * /api/whitelabel/company/{companyId}/users/{userId}/unlink:
 *   delete:
 *     summary: Remove vinculação de usuário a empresa
 *     tags: [Whitelabel]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da empresa
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
router.delete('/company/:companyId/users/:userId/unlink', authenticateToken, whitelabelController.unlinkUser);

/**
 * @swagger
 * /api/whitelabel/company/{companyId}/stats:
 *   get:
 *     summary: Obtém estatísticas da empresa
 *     tags: [Whitelabel]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da empresa
 *     responses:
 *       200:
 *         description: Estatísticas obtidas com sucesso
 *       403:
 *         description: Sem permissão para acessar estatísticas
 */
router.get('/company/:companyId/stats', authenticateToken, whitelabelController.getCompanyStats);

/**
 * @swagger
 * /api/whitelabel/check-user-status:
 *   post:
 *     summary: Verifica status do usuário por email
 *     tags: [Whitelabel]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - companyAlias
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email do usuário
 *               companyAlias:
 *                 type: string
 *                 description: Alias da empresa
 *     responses:
 *       200:
 *         description: Status verificado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 action:
 *                   type: string
 *                   enum: [register_new_user, login_existing_user, link_existing_user]
 *                   description: Próxima ação a ser tomada
 *                 message:
 *                   type: string
 *                   description: Mensagem explicativa
 *                 data:
 *                   type: object
 *                   description: Dados adicionais baseados na ação
 */
router.post('/check-user-status', whitelabelController.checkUserStatus);

/**
 * @swagger
 * /api/whitelabel/register-new-user:
 *   post:
 *     summary: Registra novo usuário vinculado aa empresa
 *     tags: [Whitelabel]
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
 *               - companyAlias
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nome completo do usuário
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email do usuário
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 description: Senha do usuário
 *               companyAlias:
 *                 type: string
 *                 description: Alias da empresa
 *     responses:
 *       201:
 *         description: Usuário registrado com sucesso
 *       409:
 *         description: Email já está em uso
 */
router.post('/register-new-user', whitelabelController.registerNewUser);

/**
 * @swagger
 * /api/whitelabel/link-existing-user:
 *   post:
 *     summary: Vincula usuário existente aa empresa
 *     tags: [Whitelabel]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - password
 *               - companyAlias
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *                 description: ID do usuário
 *               password:
 *                 type: string
 *                 description: Senha do usuário
 *               companyAlias:
 *                 type: string
 *                 description: Alias da empresa
 *     responses:
 *       200:
 *         description: Usuário vinculado com sucesso
 *       401:
 *         description: Senha incorreta
 */
router.post('/link-existing-user', whitelabelController.linkExistingUser);

/**
 * @swagger
 * /api/whitelabel/complete-first-access:
 *   post:
 *     summary: Completa dados do primeiro acesso do usuário
 *     tags: [Whitelabel]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - cpf
 *               - phone
 *               - birthDate
 *               - companyAlias
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *                 description: ID do usuário
 *               cpf:
 *                 type: string
 *                 pattern: '^[0-9]{11}$'
 *                 description: CPF do usuário (11 dígitos)
 *               phone:
 *                 type: string
 *                 pattern: '^[0-9]{10,11}$'
 *                 description: Telefone do usuário (10-11 dígitos)
 *               birthDate:
 *                 type: string
 *                 format: date
 *                 description: Data de nascimento (YYYY-MM-DD)
 *               companyAlias:
 *                 type: string
 *                 description: Alias da empresa
 *     responses:
 *       200:
 *         description: Dados completados com sucesso, chaves blockchain geradas
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
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         email:
 *                           type: string
 *                         cpf:
 *                           type: string
 *                         phone:
 *                           type: string
 *                         birthDate:
 *                           type: string
 *                         isFirstAccess:
 *                           type: boolean
 *                         isActive:
 *                           type: boolean
 *                     keys:
 *                       type: object
 *                       properties:
 *                         publicKey:
 *                           type: string
 *                           description: Endereço Ethereum gerado
 *                     company:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         alias:
 *                           type: string
 *       400:
 *         description: Dados inválidos ou usuário menor de 18 anos
 *       404:
 *         description: Usuário ou empresa não encontrado
 *       409:
 *         description: CPF já está em uso por outro usuário
 */
router.post('/complete-first-access', whitelabelController.completeFirstAccess);

module.exports = router;