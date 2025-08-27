const express = require('express');
const router = express.Router();
const redisService = require('../services/redis.service');

/**
 * @swagger
 * /api/backup/balance/{publicKey}:
 *   post:
 *     summary: Salvar backup de saldo público (sem autenticação)
 *     tags: [Backup]
 *     parameters:
 *       - in: path
 *         name: publicKey
 *         required: true
 *         schema:
 *           type: string
 *         description: Chave pública do usuário
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               balances:
 *                 type: object
 *                 description: Dados de saldo para backup
 *             required:
 *               - balances
 *     responses:
 *       200:
 *         description: Backup salvo com sucesso
 *       400:
 *         description: Dados inválidos
 *       500:
 *         description: Erro interno
 */
router.post('/balance/:publicKey', async (req, res) => {
  try {
    const { publicKey } = req.params;
    const { balances } = req.body;

    if (!publicKey || !balances || !balances.balancesTable) {
      return res.status(400).json({
        success: false,
        message: 'PublicKey e balances.balancesTable são obrigatórios'
      });
    }

    // Gerar chave única para backup público
    const backupKey = `public_balance_backup:${publicKey}`;
    
    // Dados do backup
    const backupData = {
      publicKey,
      balances,
      timestamp: Date.now(),
      version: '1.0'
    };

    // Salvar no Redis com expiração de 24 horas (86400 segundos)
    await redisService.set(backupKey, JSON.stringify(backupData), { EX: 86400 });
    
    console.log(`💾 [BackupPublic] Backup salvo para chave: ${publicKey}`);
    
    res.json({
      success: true,
      message: 'Backup salvo com sucesso',
      data: { publicKey, timestamp: backupData.timestamp }
    });

  } catch (error) {
    console.error('❌ [BackupPublic] Erro ao salvar backup:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/backup/balance/{publicKey}:
 *   get:
 *     summary: Recuperar backup de saldo público (sem autenticação)
 *     tags: [Backup]
 *     parameters:
 *       - in: path
 *         name: publicKey
 *         required: true
 *         schema:
 *           type: string
 *         description: Chave pública do usuário
 *     responses:
 *       200:
 *         description: Backup encontrado
 *       404:
 *         description: Backup não encontrado ou expirado
 *       500:
 *         description: Erro interno
 */
router.get('/balance/:publicKey', async (req, res) => {
  try {
    const { publicKey } = req.params;

    if (!publicKey) {
      return res.status(400).json({
        success: false,
        message: 'PublicKey é obrigatório'
      });
    }

    // Gerar chave única para backup público
    const backupKey = `public_balance_backup:${publicKey}`;
    
    // Buscar no Redis
    const backupDataStr = await redisService.get(backupKey);
    
    if (!backupDataStr) {
      console.log(`📦 [BackupPublic] Nenhum backup encontrado para chave: ${publicKey}`);
      return res.status(404).json({
        success: false,
        message: 'Backup não encontrado ou expirado'
      });
    }

    const backupData = JSON.parse(backupDataStr);
    
    // Verificar integridade
    if (!backupData.publicKey || !backupData.balances || !backupData.balances.balancesTable) {
      console.warn(`⚠️ [BackupPublic] Backup corrompido para chave: ${publicKey}`);
      // Remover backup corrompido
      await redisService.del(backupKey);
      return res.status(404).json({
        success: false,
        message: 'Backup corrompido, foi removido'
      });
    }

    console.log(`✅ [BackupPublic] Backup encontrado para chave: ${publicKey}`);
    console.log(`📊 [BackupPublic] Tokens no backup:`, Object.keys(backupData.balances.balancesTable));
    
    res.json({
      success: true,
      message: 'Backup encontrado',
      data: backupData.balances
    });

  } catch (error) {
    console.error('❌ [BackupPublic] Erro ao recuperar backup:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/backup/balance/{publicKey}:
 *   delete:
 *     summary: Remover backup de saldo público (sem autenticação)
 *     tags: [Backup]
 *     parameters:
 *       - in: path
 *         name: publicKey
 *         required: true
 *         schema:
 *           type: string
 *         description: Chave pública do usuário
 *     responses:
 *       200:
 *         description: Backup removido com sucesso
 *       404:
 *         description: Backup não encontrado
 *       500:
 *         description: Erro interno
 */
router.delete('/balance/:publicKey', async (req, res) => {
  try {
    const { publicKey } = req.params;

    if (!publicKey) {
      return res.status(400).json({
        success: false,
        message: 'PublicKey é obrigatório'
      });
    }

    // Gerar chave única para backup público
    const backupKey = `public_balance_backup:${publicKey}`;
    
    // Remover do Redis
    const result = await redisService.del(backupKey);
    
    if (result === 0) {
      console.log(`📦 [BackupPublic] Nenhum backup encontrado para remover: ${publicKey}`);
      return res.status(404).json({
        success: false,
        message: 'Backup não encontrado'
      });
    }

    console.log(`🗑️ [BackupPublic] Backup removido para chave: ${publicKey}`);
    
    res.json({
      success: true,
      message: 'Backup removido com sucesso',
      data: { publicKey, timestamp: Date.now() }
    });

  } catch (error) {
    console.error('❌ [BackupPublic] Erro ao remover backup:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

module.exports = router;