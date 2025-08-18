const app = require('./app');

// Importar configuração Prisma
const prismaConfig = require('./config/prisma');
const redisService = require('./services/redis.service');
const userCacheService = require('./services/userCache.service');

// Importar serviços Prisma
const companyService = require('./services/company.service');
const userService = require('./services/user.service');

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Função para iniciar o servidor
const startServer = () => {
  try {
    app.listen(PORT, () => {
      console.log('🚀 Coinage API Service iniciado com sucesso! (PRISMA)');
      console.log(`📍 Servidor rodando em: http://localhost:${PORT}`);
      console.log(`🌍 Ambiente: ${NODE_ENV}`);
      console.log(`🗄️ ORM: Prisma`);
      console.log(`⏰ Iniciado em: ${new Date().toISOString()}`);
      console.log('');
      console.log('📋 Endpoints disponíveis:');
      console.log(`   Health Check: http://localhost:${PORT}/health`);
      console.log(`   API Info: http://localhost:${PORT}/`);
      console.log(`   Swagger UI: http://localhost:${PORT}/api-docs`);

      console.log('');
      console.log('🔗 Para testar a API:');
      console.log(`   curl http://localhost:${PORT}/health`);
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
    
    // Disponibilizar Prisma globalmente
    global.prisma = prisma;
    global.prismaConfig = prismaConfig;
    
    // Inicializar Redis
    console.log('🔍 Inicializando Redis...');
    try {
      await redisService.initialize();
      console.log('✅ Redis inicializado');
    } catch (error) {
      console.log('⚠️ Redis: não inicializado -', error.message);
    }
    
    // Inicializar UserCacheService
    console.log('🔍 Inicializando UserCacheService...');
    try {
      await userCacheService.initialize();
      console.log('✅ UserCacheService inicializado');
    } catch (error) {
      console.log('⚠️ UserCacheService: não inicializado -', error.message);
    }
    
    // Inicializar serviços Prisma
    console.log('🔍 Inicializando serviços...');
    
    try {
      await companyService.initialize();
      console.log('✅ Company service (Prisma) inicializado');
    } catch (error) {
      console.log('⚠️ Company service: erro na inicialização -', error.message);
    }
    
    try {
      await userService.init();
      console.log('✅ User service (Prisma) inicializado');
    } catch (error) {
      console.log('⚠️ User service: erro na inicialização -', error.message);
    }
    
    // Inicializar dados padrão
    console.log('🔍 Verificando dados padrão...');
    try {
      // Verificar se existem empresas
      const companiesCount = await prisma.company.count();
      console.log(`📊 Companies existentes: ${companiesCount}`);
      
      if (companiesCount === 0) {
        console.log('🏗️ Crianda empresa padrão...');
        const defaultCompany = await companyService.createCompany({
          name: 'Company Padrão',
          rateLimit: {
            requestsPerMinute: 1000,
            requestsPerHour: 10000,
            requestsPerDay: 100000
          }
        });
        console.log('✅ Company padrão criado:', defaultCompany.data.name);
      }
      
      // Verificar se existem usuários
      const usersCount = await prisma.user.count();
      console.log(`👥 Usuários existentes: ${usersCount}`);
      
    } catch (error) {
      console.log('⚠️ Erro ao verificar dados padrão:', error.message);
    }
    
    console.log('');
    console.log('✅ Todos os serviços foram inicializados!');
    console.log('🚀 Iniciando servidor...');
    console.log('');
    
    // Iniciar o servidor
    startServer();
    
  } catch (error) {
    console.error('❌ Erro durante a inicialização:', error);
    console.error('Stack trace:', error.stack);
    
    // Tentar fechar conexões abertas
    try {
      await prismaConfig.close();
    } catch (closeError) {
      console.error('❌ Erro ao fechar Prisma:', closeError.message);
    }
    
    process.exit(1);
  }
})();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Recebido SIGINT. Fechando servidor graciosamente...');
  
  try {
    console.log('📦 Parando cache automático de usuários...');
    userCacheService.stopAllSessions();
    
    console.log('🔗 Fechando conexão Prisma...');
    await prismaConfig.close();
    
    console.log('🔴 Fechando conexão Redis...');
    await redisService.close();
    
    console.log('✅ Servidor fechado graciosamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro durante o shutdown:', error);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Recebido SIGTERM. Fechando servidor graciosamente...');
  
  try {
    console.log('📦 Parando cache automático de usuários...');
    userCacheService.stopAllSessions();
    
    console.log('🔗 Fechando conexão Prisma...');
    await prismaConfig.close();
    
    console.log('🔴 Fechando conexão Redis...');
    await redisService.close();
    
    console.log('✅ Servidor fechado graciosamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro durante o shutdown:', error);
    process.exit(1);
  }
});

// Tratar exceções não capturadas
process.on('uncaughtException', (error) => {
  console.error('❌ Exceção não capturada:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promise rejeitada não tratada:', reason);
  console.error('Promise:', promise);
  process.exit(1);
});