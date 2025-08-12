const express = require('express');
const router = express.Router();

/**
 * Endpoint para testar conexão com Prisma
 */
router.get('/prisma-connection', async (req, res) => {
  try {
    console.log('🔍 Testando conexão Prisma...');
    
    // Importar configuração do Prisma
    const prismaConfig = require('../config/prisma');
    
    // Testar inicialização
    console.log('🔧 Inicializando Prisma...');
    const prisma = await prismaConfig.initialize();
    console.log('✅ Prisma inicializado');
    
    // Testar conexão
    console.log('🔗 Testando conexão...');
    const connectionTest = await prismaConfig.testConnection();
    console.log('✅ Conexão testada:', connectionTest);
    
    // Testar query simples
    console.log('📊 Testando query...');
    const clientCount = await prisma.client.count();
    console.log('✅ Query executada, clientes encontrados:', clientCount);
    
    res.json({
      success: true,
      message: 'Prisma está funcionando corretamente',
      data: {
        connection: connectionTest,
        clientCount: clientCount,
        prismaConnected: prismaConfig.isConnected
      }
    });
  } catch (error) {
    console.error('❌ Erro no teste do Prisma:', error);
    res.status(500).json({
      success: false,
      message: 'Erro no teste do Prisma',
      error: {
        name: error.name,
        message: error.message,
        code: error.code,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }
    });
  }
});

/**
 * Endpoint para testar busca de usuário
 */
router.get('/test-user', async (req, res) => {
  try {
    console.log('👤 Testando busca de usuário...');
    
    const prismaConfig = require('../config/prisma');
    const prisma = prismaConfig.getPrisma();
    
    const user = await prisma.user.findFirst({
      where: { email: 'test@example.com' },
      include: {
        client: true
      }
    });
    
    if (user) {
      console.log('✅ Usuário encontrado:', user.email);
      res.json({
        success: true,
        message: 'Usuário encontrado',
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          isActive: user.isActive,
          client: user.client ? user.client.name : null
        }
      });
    } else {
      console.log('❌ Usuário não encontrado');
      res.json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }
  } catch (error) {
    console.error('❌ Erro na busca do usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro na busca do usuário',
      error: {
        name: error.name,
        message: error.message,
        code: error.code,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }
    });
  }
});

module.exports = router;
