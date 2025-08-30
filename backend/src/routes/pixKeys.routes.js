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
    .withMessage('Valor da chave é obrigatório'),
  body('bankCode')
    .notEmpty()
    .withMessage('Código do banco é obrigatório'),
  body('bankName')
    .notEmpty()
    .withMessage('Nome do banco é obrigatório'),
  body('agency')
    .notEmpty()
    .withMessage('Agência é obrigatória'),
  body('accountNumber')
    .notEmpty()
    .withMessage('Número da conta é obrigatório'),
  body('accountDigit')
    .notEmpty()
    .withMessage('Dígito da conta é obrigatório'),
  body('accountType')
    .isIn(['corrente', 'poupanca', 'pagamentos', 'salario'])
    .withMessage('Tipo de conta inválido'),
  body('holderName')
    .notEmpty()
    .withMessage('Nome do titular é obrigatório'),
  body('holderDocument')
    .notEmpty()
    .withMessage('Documento do titular é obrigatório')
];

const pixKeyIdValidation = [
  param('pixKeyId')
    .isInt({ min: 1 })
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
router.get('/', pixKeysController.getUserPixKeys);

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
 *               - bankCode
 *               - bankName
 *               - agency
 *               - accountNumber
 *               - accountDigit
 *               - accountType
 *               - holderName
 *               - holderDocument
 *             properties:
 *               keyType:
 *                 type: string
 *                 enum: [cpf, email, phone, random]
 *               keyValue:
 *                 type: string
 *               bankCode:
 *                 type: string
 *               bankName:
 *                 type: string
 *               bankLogo:
 *                 type: string
 *               agency:
 *                 type: string
 *               agencyDigit:
 *                 type: string
 *               accountNumber:
 *                 type: string
 *               accountDigit:
 *                 type: string
 *               accountType:
 *                 type: string
 *                 enum: [corrente, poupanca, pagamentos, salario]
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
router.post('/', createPixKeyValidation, validateRequest, pixKeysController.createPixKey);

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
router.put('/:pixKeyId', pixKeyIdValidation, validateRequest, pixKeysController.updatePixKey);

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
router.delete('/:pixKeyId', pixKeyIdValidation, validateRequest, pixKeysController.deletePixKey);

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
router.patch('/:pixKeyId/set-default', pixKeyIdValidation, validateRequest, pixKeysController.setDefaultPixKey);

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
router.post('/:pixKeyId/verify', pixKeyIdValidation, validateRequest, pixKeysController.verifyPixKey);

module.exports = router;