const express = require('express');
const router = express.Router();
const contractTypeController = require('../controllers/contractType.controller');
const jwtMiddleware = require('../middleware/jwt.middleware');
const adminMiddleware = require('../middleware/admin.middleware');

// Middleware de autenticação para todas as rotas
router.use(jwtMiddleware.authenticateToken);

/**
 * @swagger
 * /api/contract-types:
 *   get:
 *     summary: Lista todos os tipos de contrato
 *     tags: [Contract Types]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Tipos de contrato obtidos com sucesso
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
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ContractType'
 *       401:
 *         description: Token inválido
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/', contractTypeController.getAllContractTypes);

/**
 * @swagger
 * /api/contract-types/category/{category}:
 *   get:
 *     summary: Obtém tipos de contrato por categoria
 *     tags: [Contract Types]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *           enum: [token, nft, defi, escrow, governance, bridge, oracle, other]
 *         description: Categoria dos contratos
 *     responses:
 *       200:
 *         description: Tipos de contrato da categoria obtidos com sucesso
 *       400:
 *         description: Categoria inválida
 *       401:
 *         description: Token inválido
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/category/:category', contractTypeController.getContractTypesByCategory);

/**
 * @swagger
 * /api/contract-types/{id}:
 *   get:
 *     summary: Obtém tipo de contrato por ID
 *     tags: [Contract Types]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do tipo de contrato
 *     responses:
 *       200:
 *         description: Tipo de contrato obtido com sucesso
 *       404:
 *         description: Tipo de contrato não encontrado
 *       401:
 *         description: Token inválido
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/:id', contractTypeController.getContractTypeById);

/**
 * @swagger
 * /api/contract-types/{id}/abi:
 *   get:
 *     summary: Obtém ABI de um tipo de contrato
 *     tags: [Contract Types]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do tipo de contrato
 *     responses:
 *       200:
 *         description: ABI obtido com sucesso
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
 *                     contractType:
 *                       type: object
 *                     abi:
 *                       type: array
 *       404:
 *         description: Tipo de contrato não encontrado
 *       401:
 *         description: Token inválido
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/:id/abi', contractTypeController.getContractTypeABI);

/**
 * @swagger
 * /api/contract-types/{contractTypeId}/contracts:
 *   post:
 *     summary: Cria contrato usando tipo específico
 *     tags: [Contract Types, Smart Contracts]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contractTypeId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do tipo de contrato
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - address
 *               - network
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nome do contrato
 *               address:
 *                 type: string
 *                 pattern: "^0x[a-fA-F0-9]{40}$"
 *                 description: Endereço do contrato
 *               network:
 *                 type: string
 *                 enum: [mainnet, testnet]
 *                 description: Rede blockchain
 *               bytecode:
 *                 type: string
 *                 description: Bytecode do contrato (opcional)
 *               metadata:
 *                 type: object
 *                 description: Metadados adicionais
 *     responses:
 *       201:
 *         description: Contrato criado com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Token inválido
 *       404:
 *         description: Tipo de contrato não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/:contractTypeId/contracts', contractTypeController.createContractFromType);

// === ROTAS ADMINISTRATIVAS ===

/**
 * @swagger
 * /api/contract-types:
 *   post:
 *     summary: Cria novo tipo de contrato (Admin)
 *     tags: [Contract Types, Admin]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - category
 *               - abiPath
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nome do tipo de contrato
 *               description:
 *                 type: string
 *                 description: Descrição do tipo
 *               category:
 *                 type: string
 *                 enum: [token, nft, defi, escrow, governance, bridge, oracle, other]
 *                 description: Categoria do contrato
 *               abiPath:
 *                 type: string
 *                 description: Caminho para o arquivo ABI
 *               version:
 *                 type: string
 *                 description: Versão do ABI
 *     responses:
 *       201:
 *         description: Tipo de contrato criado com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Token inválido
 *       403:
 *         description: Acesso negado (apenas admin)
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/', adminMiddleware.requireAnyAdmin, contractTypeController.createContractType);

/**
 * @swagger
 * /api/contract-types/{id}:
 *   put:
 *     summary: Atualiza tipo de contrato (Admin)
 *     tags: [Contract Types, Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               abiPath:
 *                 type: string
 *               version:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Tipo de contrato atualizado com sucesso
 *       401:
 *         description: Token inválido
 *       403:
 *         description: Acesso negado (apenas admin)
 *       404:
 *         description: Tipo de contrato não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.put('/:id', adminMiddleware.requireAnyAdmin, contractTypeController.updateContractType);

/**
 * @swagger
 * /api/contract-types/{id}:
 *   delete:
 *     summary: Exclui tipo de contrato (Admin)
 *     tags: [Contract Types, Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Tipo de contrato excluído com sucesso
 *       401:
 *         description: Token inválido
 *       403:
 *         description: Acesso negado (apenas admin)
 *       404:
 *         description: Tipo de contrato não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.delete('/:id', adminMiddleware.requireAnyAdmin, contractTypeController.deleteContractType);

/**
 * @swagger
 * /api/contract-types/admin/abis:
 *   get:
 *     summary: Lista arquivos ABI disponíveis (Admin)
 *     tags: [Contract Types, Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: ABIs disponíveis obtidos com sucesso
 *       401:
 *         description: Token inválido
 *       403:
 *         description: Acesso negado (apenas admin)
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/admin/abis', adminMiddleware.requireAnyAdmin, contractTypeController.getAvailableABIs);

/**
 * @swagger
 * /api/contract-types/admin/initialize:
 *   post:
 *     summary: Inicializa tipos de contrato padrão (Admin)
 *     tags: [Contract Types, Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Tipos padrão inicializados com sucesso
 *       401:
 *         description: Token inválido
 *       403:
 *         description: Acesso negado (apenas admin)
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/admin/initialize', adminMiddleware.requireAnyAdmin, contractTypeController.initializeDefaultTypes);

/**
 * @swagger
 * /api/contract-types/admin/stats:
 *   get:
 *     summary: Estatísticas dos tipos de contrato (Admin)
 *     tags: [Contract Types, Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Estatísticas obtidas com sucesso
 *       401:
 *         description: Token inválido
 *       403:
 *         description: Acesso negado (apenas admin)
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/admin/stats', adminMiddleware.requireAnyAdmin, contractTypeController.getContractTypeStats);

/**
 * @swagger
 * /api/contract-types/admin/validate-abi:
 *   post:
 *     summary: Valida arquivo ABI (Admin)
 *     tags: [Contract Types, Admin]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - abi
 *             properties:
 *               abi:
 *                 type: array
 *                 description: Array ABI para validação
 *     responses:
 *       200:
 *         description: Validação de ABI concluída
 *       400:
 *         description: ABI é obrigatório
 *       401:
 *         description: Token inválido
 *       403:
 *         description: Acesso negado (apenas admin)
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/admin/validate-abi', adminMiddleware.requireAnyAdmin, contractTypeController.validateABI);

/**
 * @swagger
 * components:
 *   schemas:
 *     ContractType:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         category:
 *           type: string
 *           enum: [token, nft, defi, escrow, governance, bridge, oracle, other]
 *         abiPath:
 *           type: string
 *         version:
 *           type: string
 *         isActive:
 *           type: boolean
 *         contractsCount:
 *           type: integer
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

module.exports = router;