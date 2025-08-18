const express = require('express');
const router = express.Router();
const configController = require('../controllers/config.controller');

/**
 * @swagger
 * /api/config/public:
 *   get:
 *     summary: Obter configurações públicas da aplicação
 *     tags: [Config]
 *     responses:
 *       200:
 *         description: Configurações obtidas com sucesso
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
 *                     defaultNetwork:
 *                       type: string
 *                       enum: [mainnet, testnet]
 *                       description: Rede padrão configurada
 *                     mainnetRpcUrl:
 *                       type: string
 *                       description: URL RPC da mainnet
 *                     testnetRpcUrl:
 *                       type: string
 *                       description: URL RPC da testnet
 *                     mainnetChainId:
 *                       type: number
 *                       description: Chain ID da mainnet
 *                     testnetChainId:
 *                       type: number
 *                       description: Chain ID da testnet
 *                 message:
 *                   type: string
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/public', configController.getPublicConfig);

// Test route
router.get('/test', (req, res) => {
  console.log('🔧 [Config] Test route called');
  res.json({ test: 'working', timestamp: new Date().toISOString() });
});

module.exports = router;