const express = require('express');
const router = express.Router();
const pixKeysController = require('../controllers/pixKeys.controller');
const { authenticateJWT } = require('../middleware/jwt.middleware');
const { body, param } = require('express-validator');
const { validateRequest } = require('../middleware/validation.middleware');

// Middleware de autenticação para todas as rotas
router.use(authenticateJWT);

// Validações
const createPixKeyValidation = [
  body('keyType')
    .isIn(['cpf', 'email', 'phone', 'random'])
    .withMessage('Tipo de chave inválido'),
  body('keyValue')
    .notEmpty()
    .withMessage('Valor da chave é obrigatório')
];

const pixKeyIdValidation = [
  param('pixKeyId')
    .isUUID()
    .withMessage('ID da chave PIX inválido')
];

// Rotas

/**
 * @swagger
 * /api/pix-keys:
 *   get:
 *     summary: Listar chaves PIX do usuário
 *     tags: [PIX Keys]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de chaves PIX
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/', pixKeysController.getUserPixKeys.bind(pixKeysController));

/**
 * @swagger
 * /api/pix-keys:
 *   post:
 *     summary: Criar nova chave PIX
 *     tags: [PIX Keys]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - keyType
 *               - keyValue
 *               - holderName
 *               - holderDocument
 *             properties:
 *               keyType:
 *                 type: string
 *                 enum: [cpf, email, phone, random]
 *               keyValue:
 *                 type: string
 *               holderName:
 *                 type: string
 *               holderDocument:
 *                 type: string
 *               isDefault:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Chave PIX criada com sucesso
 *       400:
 *         description: Dados inválidos
 *       409:
 *         description: Chave PIX já existe
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/', createPixKeyValidation, validateRequest, pixKeysController.createPixKey.bind(pixKeysController));

/**
 * @swagger
 * /api/pix-keys/{pixKeyId}:
 *   put:
 *     summary: Atualizar chave PIX
 *     tags: [PIX Keys]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pixKeyId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Chave PIX atualizada com sucesso
 *       404:
 *         description: Chave PIX não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.put('/:pixKeyId', pixKeyIdValidation, validateRequest, (req, res) => pixKeysController.updatePixKey(req, res));

/**
 * @swagger
 * /api/pix-keys/{pixKeyId}:
 *   delete:
 *     summary: Excluir chave PIX
 *     tags: [PIX Keys]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pixKeyId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Chave PIX removida com sucesso
 *       404:
 *         description: Chave PIX não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.delete('/:pixKeyId', pixKeyIdValidation, validateRequest, (req, res) => pixKeysController.deletePixKey(req, res));

/**
 * @swagger
 * /api/pix-keys/{pixKeyId}/set-default:
 *   patch:
 *     summary: Definir chave PIX como padrão
 *     tags: [PIX Keys]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pixKeyId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Chave PIX definida como padrão
 *       404:
 *         description: Chave PIX não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.patch('/:pixKeyId/set-default', pixKeyIdValidation, validateRequest, (req, res) => pixKeysController.setDefaultPixKey(req, res));

/**
 * @swagger
 * /api/pix-keys/{pixKeyId}/verify:
 *   post:
 *     summary: Verificar chave PIX
 *     tags: [PIX Keys]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pixKeyId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Chave PIX verificada com sucesso
 *       404:
 *         description: Chave PIX não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/:pixKeyId/verify', pixKeyIdValidation, validateRequest, (req, res) => pixKeysController.verifyPixKey(req, res));

/**
 * @swagger
 * /api/pix-keys/validation-history:
 *   get:
 *     summary: Obter histórico de validações PIX
 *     tags: [PIX Keys]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Histórico de validações carregado
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/validation-history', (req, res) => pixKeysController.getValidationHistory(req, res));

/**
 * @swagger
 * /api/pix-keys/validation-costs:
 *   get:
 *     summary: Obter custos de validações PIX
 *     tags: [PIX Keys]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Número de dias para calcular
 *     responses:
 *       200:
 *         description: Custos calculados com sucesso
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/validation-costs', (req, res) => pixKeysController.getValidationCosts(req, res));

/**
 * @swagger
 * /api/pix-keys/validation-health:
 *   get:
 *     summary: Health check do serviço de validação PIX
 *     tags: [PIX Keys]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Status do serviço
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/validation-health', (req, res) => pixKeysController.validationHealthCheck(req, res));

/**
 * @swagger
 * /api/pix-keys/{pixKeyId}/validate-for-withdraw:
 *   post:
 *     summary: Validar chave PIX para saque (cobra taxa se necessário)
 *     tags: [PIX Keys]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pixKeyId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Chave PIX validada com sucesso
 *       400:
 *         description: Erro na validação
 *       404:
 *         description: Chave PIX não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/:pixKeyId/validate-for-withdraw', pixKeyIdValidation, validateRequest, (req, res) => pixKeysController.validateForWithdraw(req, res));

/**
 * @swagger
 * /api/pix-keys/{pixKeyId}/check-validation:
 *   get:
 *     summary: Verificar se chave PIX precisa de validação paga
 *     tags: [PIX Keys]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pixKeyId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Status da validação verificado
 *       404:
 *         description: Chave PIX não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/:pixKeyId/check-validation', pixKeyIdValidation, validateRequest, (req, res) => pixKeysController.checkValidationNeeded(req, res));

module.exports = router;