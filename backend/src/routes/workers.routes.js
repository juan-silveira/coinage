const express = require('express');
const { workerManager } = require('../workers');
const blockchainQueueService = require('../services/blockchainQueue.service');
const { authenticateToken } = require('../middleware/jwt.middleware');
const { requireAnyAdmin } = require('../middleware/admin.middleware');

const router = express.Router();

/**
 * GET /api/workers/status
 * Obtém status de todos os workers
 */
router.get('/status', authenticateToken, requireAnyAdmin, async (req, res) => {
  try {
    const status = await workerManager.getStatus();
    
    res.json({
      success: true,
      data: status
    });
    
  } catch (error) {
    console.error('Error getting workers status:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting workers status',
      error: error.message
    });
  }
});

/**
 * GET /api/workers/health
 * Health check completo dos workers
 */
router.get('/health', authenticateToken, requireAnyAdmin, async (req, res) => {
  try {
    const health = await workerManager.healthCheck();
    
    res.status(health.healthy ? 200 : 503).json({
      success: health.healthy,
      data: health
    });
    
  } catch (error) {
    console.error('Error checking workers health:', error);
    res.status(503).json({
      success: false,
      message: 'Error checking workers health',
      error: error.message
    });
  }
});

/**
 * GET /api/workers/queues/stats
 * Obtém estatísticas das filas
 */
router.get('/queues/stats', authenticateToken, requireAnyAdmin, async (req, res) => {
  try {
    const stats = await workerManager.getQueueStats();
    
    res.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('Error getting queue stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting queue stats',
      error: error.message
    });
  }
});

/**
 * POST /api/workers/:workerName/restart
 * Reinicia um worker específico
 */
router.post('/:workerName/restart', authenticateToken, requireAnyAdmin, async (req, res) => {
  try {
    const { workerName } = req.params;
    
    await workerManager.restartWorker(workerName);
    
    res.json({
      success: true,
      message: `Worker ${workerName} restarted successfully`
    });
    
  } catch (error) {
    console.error(`Error restarting worker ${req.params.workerName}:`, error);
    res.status(500).json({
      success: false,
      message: `Error restarting worker ${req.params.workerName}`,
      error: error.message
    });
  }
});

/**
 * DELETE /api/workers/queues/:queueName/purge
 * Purga uma fila específica (remove todas as mensagens)
 */
router.delete('/queues/:queueName/purge', authenticateToken, requireAnyAdmin, async (req, res) => {
  try {
    const { queueName } = req.params;
    
    const result = await workerManager.purgeQueue(queueName);
    
    res.json({
      success: true,
      message: `Queue ${queueName} purged successfully`,
      data: result
    });
    
  } catch (error) {
    console.error(`Error purging queue ${req.params.queueName}:`, error);
    res.status(500).json({
      success: false,
      message: `Error purging queue ${req.params.queueName}`,
      error: error.message
    });
  }
});

/**
 * POST /api/workers/test/transaction
 * Endpoint para testar o sistema de filas com uma transação de exemplo
 */
router.post('/test/transaction', authenticateToken, requireAnyAdmin, async (req, res) => {
  try {
    const testTransaction = {
      transactionId: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: req.user.id,
      companyId: req.user.companyId,
      network: 'testnet',
      operation: 'transfer',
      fromAddress: '0x1234567890123456789012345678901234567890',
      toAddress: '0x0987654321098765432109876543210987654321',
      amount: '1.0',
      contractAddress: '0x1111111111111111111111111111111111111111'
    };
    
    const result = await blockchainQueueService.queueTransaction(testTransaction);
    
    res.json({
      success: true,
      message: 'Test transaction queued successfully',
      data: result
    });
    
  } catch (error) {
    console.error('Error queuing test transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Error queuing test transaction',
      error: error.message
    });
  }
});

/**
 * POST /api/workers/test/email
 * Endpoint para testar o sistema de email
 */
router.post('/test/email', authenticateToken, requireAnyAdmin, async (req, res) => {
  try {
    const { to, template = 'test' } = req.body;
    
    if (!to) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required'
      });
    }
    
    const result = await blockchainQueueService.queueEmailNotification({
      to,
      subject: 'Test Email from Coinage',
      template,
      data: {
        userName: req.user.name,
        testData: 'This is a test email',
        timestamp: new Date().toISOString()
      },
      userId: req.user.id
    });
    
    res.json({
      success: true,
      message: 'Test email queued successfully',
      data: result
    });
    
  } catch (error) {
    console.error('Error queuing test email:', error);
    res.status(500).json({
      success: false,
      message: 'Error queuing test email',
      error: error.message
    });
  }
});

/**
 * POST /api/workers/test/webhook
 * Endpoint para testar o sistema de webhooks
 */
router.post('/test/webhook', authenticateToken, requireAnyAdmin, async (req, res) => {
  try {
    const { url, event = 'test' } = req.body;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'Webhook URL is required'
      });
    }
    
    const result = await blockchainQueueService.queueWebhook({
      url,
      event,
      data: {
        testMessage: 'This is a test webhook',
        userId: req.user.id,
        timestamp: new Date().toISOString()
      },
      userId: req.user.id
    });
    
    res.json({
      success: true,
      message: 'Test webhook queued successfully',
      data: result
    });
    
  } catch (error) {
    console.error('Error queuing test webhook:', error);
    res.status(500).json({
      success: false,
      message: 'Error queuing test webhook',
      error: error.message
    });
  }
});

module.exports = router;