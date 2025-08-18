const express = require('express');
const router = express.Router();
const smartContractController = require('../controllers/smartContract.controller');

/**
 * @swagger
 * /api/smart-contracts/types:
 *   get:
 *     summary: Listar todos os tipos de contratos disponíveis
 *     tags: [Smart Contracts]
 *     responses:
 *       200:
 *         description: Tipos de contratos obtidos com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   description: Mapa de tipos de contratos para nomes de arquivos ABI
 *                 message:
 *                   type: string
 */
router.get('/types', smartContractController.getAvailableContractTypes);

/**
 * @swagger
 * /api/smart-contracts/abi/{type}:
 *   get:
 *     summary: Obter ABI por tipo de contrato
 *     tags: [Smart Contracts]
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [token, stake]
 *         description: Tipo do contrato (token, stake, etc.)
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
 *                 data:
 *                   type: object
 *                   properties:
 *                     contractType:
 *                       type: string
 *                     abi:
 *                       type: array
 *                 message:
 *                   type: string
 *       404:
 *         description: Tipo de contrato não encontrado
 */
router.get('/abi/:type', smartContractController.getABIByType);

/**
 * @swagger
 * /api/smart-contracts/abi-info/{abiName}:
 *   get:
 *     summary: Obter informações sobre um ABI específico
 *     tags: [Smart Contracts]
 *     parameters:
 *       - in: path
 *         name: abiName
 *         required: true
 *         schema:
 *           type: string
 *         description: Nome do arquivo ABI (sem extensão)
 *     responses:
 *       200:
 *         description: Informações do ABI obtidas com sucesso
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
 *                     name:
 *                       type: string
 *                     totalItems:
 *                       type: number
 *                     functions:
 *                       type: number
 *                     events:
 *                       type: number
 *                     errors:
 *                       type: number
 *                     constructors:
 *                       type: number
 *                     isValid:
 *                       type: boolean
 *                 message:
 *                   type: string
 */
router.get('/abi-info/:abiName', smartContractController.getABIInfo);

/**
 * @swagger
 * /api/smart-contracts/default-abis:
 *   get:
 *     summary: Obter ABIs padrão (token e stake)
 *     tags: [Smart Contracts]
 *     responses:
 *       200:
 *         description: ABIs padrão obtidos com sucesso
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
 *                     default_token_abi:
 *                       type: array
 *                     default_stake_abi:
 *                       type: array
 *                 message:
 *                   type: string
 */
router.get('/default-abis', smartContractController.getDefaultABIs);

module.exports = router;