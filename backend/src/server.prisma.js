const app = require('./app');

// Importar configuração Prisma ao invés do Sequelize
const prismaConfig = require('./config/prisma');
const redisService = require('./services/redis.service');
const userCacheService = require('./services/userCache.service');

// Importar serviços (mantenha os originais por enquanto, eles serão migrados gradualmente)
const contractService = require('./services/contract.service');
const clientService = require('./services/client.service');
const userService = require('./services/user.service');
const logService = require('./services/log.service');
const adminService = require('./services/admin.service.prisma');
const passwordResetService = require('./services/passwordReset.service');
const tokenInitializerService = require('./services/tokenInitializer.service');
const tokenService = require('./services/token.service');
const stakeService = require('./services/stake.service');
const queueService = require('./services/queue.service');
// const initService = require('./services/init.service.prisma'); // Temporariamente desabilitado

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Função para iniciar o servidor
const startServer = () => {
  try {
    app.listen(PORT, () => {
      console.log('🚀 Azore Blockchain API Service iniciado com sucesso! (PRISMA)');
      console.log(`📍 Servidor rodando em: http://localhost:${PORT}`);
      console.log(`🌍 Ambiente: ${NODE_ENV}`);
      console.log(`🗄️ ORM: Prisma`);
      console.log(`⏰ Iniciado em: ${new Date().toISOString()}`);
      console.log('');
      console.log('📋 Endpoints disponíveis:');
      console.log(`   Health Check: http://localhost:${PORT}/health`);
      console.log(`   API Info: http://localhost:${PORT}/`);
      console.log(`   Test Connection: http://localhost:${PORT}/api/test/connection`);
      console.log(`   Network Info: http://localhost:${PORT}/api/test/network-info`);

      console.log('');
      console.log('🔗 Para testar a conexão com a blockchain:');
      console.log(`   curl http://localhost:${PORT}/api/test/connection`);
      console.log('');
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar o servidor:', error);
    process.exit(1);
  }
};

// Inicialização assíncrona com Prisma
(async () => {
  try {
    console.log('🔍 Inicializando conexão Prisma...');
    const prisma = await prismaConfig.initialize();
    console.log('✅ Conexão Prisma estabelecida');
    
    // Disponibilizar Prisma globalmente (para compatibilidade com código existente)
    global.prisma = prisma;
    global.prismaConfig = prismaConfig;
    
    // Para compatibilidade com código Sequelize existente, criar um mock básico
    global.models = {
      // Os services antigos ainda vão funcionar por enquanto
      // Gradualmente serão migrados para usar Prisma diretamente
    };
    
    // Inicializar Redis
    console.log('🔍 Inicializando Redis...');
    await redisService.initialize();
    console.log('✅ Redis inicializado');
    
    // Inicializar UserCacheService
    console.log('🔍 Inicializando UserCacheService...');
    await userCacheService.initialize();
    console.log('✅ UserCacheService inicializado');
    
    // Inicializar serviços (alguns podem falhar se dependem de Sequelize, mas não vamos quebrar)
    console.log('🔍 Inicializando serviços...');
    
    try {
      await contractService.initialize();
      console.log('✅ Contract service inicializado');
    } catch (error) {
      console.log('⚠️ Contract service: não inicializado (aguardando migração para Prisma)');
    }
    
    try {
      await clientService.initialize();
      console.log('✅ Client service (Prisma) inicializado');
    } catch (error) {
      console.log('⚠️ Client service: erro na inicialização -', error.message);
    }
    
    try {
      await userService.init();
      console.log('✅ User service (Prisma) inicializado');
    } catch (error) {
      console.log('⚠️ User service: erro na inicialização -', error.message);
    }
    
    try {
      await logService.initialize();
      console.log('✅ Log service inicializado');
    } catch (error) {
      console.log('⚠️ Log service: não inicializado (aguardando migração para Prisma)');
    }
    
    try {
      await passwordResetService.initialize();
      console.log('✅ Password reset service inicializado');
    } catch (error) {
      console.log('⚠️ Password reset service: não inicializado (aguardando migração para Prisma)');
    }
    
    try {
      await tokenService.initialize();
      console.log('✅ Token service inicializado');
    } catch (error) {
      console.log('⚠️ Token service: não inicializado (aguardando migração para Prisma)');
    }
    
    try {
      await stakeService.initialize();
      console.log('✅ Stake service inicializado');
    } catch (error) {
      console.log('⚠️ Stake service: não inicializado (aguardando migração para Prisma)');
    }
    
    // Inicializar fila (opcional)
    try {
      await queueService.initialize();
      console.log('✅ Queue service inicializado');
    } catch (error) {
      console.log('⚠️ Queue service: não disponível');
    }
    
    // Tentar inicializar sistema completo
    try {
      await initService.initializeSystem();
      console.log('✅ Sistema inicializado');
    } catch (error) {
      console.log('⚠️ Sistema: inicialização parcial (alguns serviços podem não estar disponíveis)');
    }
    
    // Tentar inicializar tokens padrão
    try {
      // Este precisa ser ajustado para funcionar com Prisma
      console.log('⚠️ Tokens padrão: aguardando migração para Prisma');
    } catch (error) {
      console.log('⚠️ Tokens padrão: não inicializados');
    }
    
    console.log('');
    console.log('🎉 Sistema iniciado com Prisma!');
    console.log('📝 Nota: Alguns serviços podem não estar disponíveis até a migração completa');
    console.log('');
    
    startServer();
  } catch (err) {
    console.error('❌ Erro na inicialização do Prisma:', err);
    
    // Tentar iniciar mesmo com alguns erros (modo degradado)
    console.log('🔄 Tentando iniciar em modo degradado...');
    try {
      startServer();
    } catch (serverError) {
      console.error('❌ Erro crítico ao iniciar servidor:', serverError);
      process.exit(1);
    }
  }
})();

// Tratamento de sinais para graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM recebido, encerrando servidor...');
  try {
    await prismaConfig.close();
    console.log('✅ Conexões Prisma fechadas');
  } catch (error) {
    console.error('❌ Erro ao fechar conexões:', error);
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT recebido, encerrando servidor...');
  try {
    await prismaConfig.close();
    console.log('✅ Conexões Prisma fechadas');
  } catch (error) {
    console.error('❌ Erro ao fechar conexões:', error);
  }
  process.exit(0);
});

// Tratamento de erros não capturados
process.on('uncaughtException', (error) => {
  console.error('⚠️ Erro não capturado (continuando):', error);
  // Não encerrar o processo para permitir que o servidor continue funcionando
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️ Promise rejeitada não tratada (continuando):', reason);
  // Não encerrar o processo para permitir que o servidor continue funcionando
});
