const express = require('express');
const router = express.Router();
const banksController = require('../controllers/banks.controller');

/**
 * @swagger
 * /api/banks:
 *   get:
 *     summary: Listar bancos brasileiros
 *     tags: [Banks]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar banco por nome
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [commercial, digital, public, investment, holding]
 *         description: Filtrar por tipo de banco
 *     responses:
 *       200:
 *         description: Lista de bancos
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/', banksController.getAllBanks);

/**
 * @swagger
 * /api/banks/popular:
 *   get:
 *     summary: Listar bancos mais populares
 *     tags: [Banks]
 *     responses:
 *       200:
 *         description: Lista de bancos populares
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/popular', banksController.getPopularBanks);

/**
 * @swagger
 * /api/banks/account-types:
 *   get:
 *     summary: Listar tipos de conta
 *     tags: [Banks]
 *     responses:
 *       200:
 *         description: Lista de tipos de conta
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/account-types', banksController.getAccountTypes);

/**
 * @swagger
 * /api/banks/{bankCode}:
 *   get:
 *     summary: Buscar banco por código
 *     tags: [Banks]
 *     parameters:
 *       - in: path
 *         name: bankCode
 *         required: true
 *         schema:
 *           type: string
 *         description: 'Código do banco (ex: 001, 341, 237)'
 *     responses:
 *       200:
 *         description: Banco encontrado
 *       404:
 *         description: Banco não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/:bankCode', banksController.getBankByCode);

/**
 * @swagger
 * /api/banks/{bankCode}/validate:
 *   get:
 *     summary: Validar código do banco
 *     tags: [Banks]
 *     parameters:
 *       - in: path
 *         name: bankCode
 *         required: true
 *         schema:
 *           type: string
 *         description: Código do banco para validar
 *     responses:
 *       200:
 *         description: Resultado da validação
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/:bankCode/validate', banksController.validateBankCode);

module.exports = router;