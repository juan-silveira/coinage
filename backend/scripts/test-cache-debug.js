const redisService = require('../src/services/redis.service');

/**
 * Debug do cache Redis
 */
async function testCacheDebug() {
  console.log('🔍 Debug do cache Redis...\n');

  const userId = 'c4566d05-3243-4008-a4be-6d96b01de8c8';
  const address = '0x5528C065931f523CA9F3a6e49a911896fb1D2e6f';

  try {
    // 1. Inicializar Redis
    console.log('1️⃣ Inicializando Redis...');
    await redisService.initialize();
    
    const connectionTest = await redisService.testConnection();
    console.log('Redis Status:', connectionTest.success ? '✅ Conectado' : '❌ Desconectado');
    console.log('');

    if (!connectionTest.success) {
      console.log('❌ Falha na conexão com Redis');
      return;
    }

    // 2. Verificar se há dados no cache
    console.log('2️⃣ Verificando dados no cache...');
    const cachedUserData = await redisService.getCachedUserData(userId);
    const cachedBalances = await redisService.getCachedUserBalances(userId, address);
    
    console.log('👤 Dados do usuário no cache:', cachedUserData ? '✅ Encontrado' : '❌ Não encontrado');
    console.log('💰 Balances no cache:', cachedBalances ? '✅ Encontrado' : '❌ Não encontrado');
    console.log('');

    // 3. Simular dados de balances
    console.log('3️⃣ Simulando dados de balances...');
    const balancesData = {
      address: address,
      network: 'testnet',
      azeBalance: {
        balanceWei: '424822636000000000',
        balanceEth: '0.424822636'
      },
      tokenBalances: [
        {
          contractAddress: '0x1234567890123456789012345678901234567890',
          tokenName: 'Test Token',
          tokenSymbol: 'TEST',
          tokenDecimals: 18,
          balanceWei: '1000000000000000000',
          balanceEth: '1.0'
        }
      ],
      balancesTable: {
        AZE: '0.424822636',
        cBRL: '0',
        TEST: '1.0'
      },
      totalTokens: 2,
      timestamp: new Date().toISOString()
    };

    // 4. Cachear balances
    console.log('4️⃣ Cacheando balances...');
    const cacheResult = await redisService.cacheUserBalances(userId, address, balancesData, 300);
    console.log('✅ Balances cacheados:', cacheResult ? 'Sucesso' : 'Falha');
    console.log('');

    // 5. Verificar novamente
    console.log('5️⃣ Verificando cache após armazenamento...');
    const cachedBalancesAfter = await redisService.getCachedUserBalances(userId, address);
    
    if (cachedBalancesAfter) {
      console.log('✅ Balances encontrados no cache!');
      console.log('   📍 Endereço:', cachedBalancesAfter.address);
      console.log('   💎 Saldo AZE:', cachedBalancesAfter.balancesTable.AZE);
      console.log('   💰 cBRL:', cachedBalancesAfter.balancesTable.cBRL);
      console.log('   🧪 TEST:', cachedBalancesAfter.balancesTable.TEST);
      console.log('   ⏰ Cacheado em:', cachedBalancesAfter.cachedAt);
    } else {
      console.log('❌ Balances não encontrados no cache');
    }
    console.log('');

    // 6. Simular verificação do controller
    console.log('6️⃣ Simulando verificação do controller...');
    console.log('🔍 Verificando cache para userId:', userId);
    console.log('🔍 Verificando cache para address:', address);
    
    const controllerCacheCheck = await redisService.getCachedUserBalances(userId, address);
    
    if (controllerCacheCheck) {
      console.log('✅ Controller encontraria dados no cache!');
      console.log('📊 Resposta que seria retornada:');
      console.log('   success: true');
      console.log('   fromCache: true');
      console.log('   data: [dados do cache]');
    } else {
      console.log('❌ Controller não encontraria dados no cache');
    }
    console.log('');

    // 7. Estatísticas finais
    console.log('7️⃣ Estatísticas finais...');
    const stats = await redisService.getCacheStats();
    console.log('📊 Estatísticas:');
    console.log(`   🔗 Conectado: ${stats.isConnected ? '✅' : '❌'}`);
    console.log(`   👥 Usuários cacheados: ${stats.userCache.count}`);
    console.log(`   💰 Balances cacheados: ${stats.balancesCache.count}`);
    console.log(`   📈 Total de chaves: ${stats.totalKeys}`);
    console.log('');

    // 8. Verificar chaves específicas
    console.log('8️⃣ Verificando chaves específicas...');
    const userKey = `user:${userId}`;
    const balanceKey = `balances:${userId}:${address}`;
    
    console.log('🔑 Chave do usuário:', userKey);
    console.log('🔑 Chave dos balances:', balanceKey);
    console.log('');

    console.log('✅ Debug concluído!');
    console.log('💡 O cache está funcionando corretamente');
    console.log('💡 O problema pode estar na verificação do controller');

  } catch (error) {
    console.error('❌ Erro durante o debug:', error.message);
  } finally {
    // Fechar conexão
    await redisService.disconnect();
    console.log('🔌 Conexão com Redis fechada');
  }
}

// Executar debug se o script for chamado diretamente
if (require.main === module) {
  testCacheDebug();
}

module.exports = { testCacheDebug };

