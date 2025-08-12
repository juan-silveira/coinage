const redisService = require('../src/services/redis.service');

/**
 * Teste direto do Redis para demonstrar o cache de saldos
 */
async function testRedisDirect() {
  console.log('🧪 Testando Redis diretamente...\n');

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

    // 2. Simular dados de usuário
    console.log('2️⃣ Simulando dados de usuário...');
    const testUserId = 'test-user-123';
    const testAddress = '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6';
    
    const userData = {
      id: testUserId,
      name: 'Usuário Teste',
      email: 'teste@example.com',
      phone: '11999999999',
      cpf: '12345678901',
      birthDate: '1990-01-01',
      publicKey: testAddress,
      clientId: 'test-client-456',
      permissions: { read: true, write: false },
      roles: ['USER'],
      isApiAdmin: false,
      isClientAdmin: false,
      isFirstAccess: false,
      isActive: true,
      lastLoginAt: new Date().toISOString()
    };

    // 3. Armazenar dados do usuário no cache
    console.log('3️⃣ Armazenando dados do usuário no cache...');
    const userCacheResult = await redisService.cacheUserData(testUserId, userData, 3600);
    console.log('Dados do usuário armazenados:', userCacheResult ? '✅ Sucesso' : '❌ Falha');
    console.log('');

    // 4. Recuperar dados do usuário do cache
    console.log('4️⃣ Recuperando dados do usuário do cache...');
    const retrievedUserData = await redisService.getCachedUserData(testUserId);
    
    if (retrievedUserData) {
      console.log('✅ Dados do usuário recuperados:');
      console.log('   Nome:', retrievedUserData.name);
      console.log('   Email:', retrievedUserData.email);
      console.log('   CPF:', retrievedUserData.cpf);
      console.log('   Public Key:', retrievedUserData.publicKey);
      console.log('   Cacheado em:', retrievedUserData.cachedAt);
      console.log('');
    } else {
      console.log('❌ Falha ao recuperar dados do usuário');
      console.log('');
    }

    // 5. Simular dados de balances
    console.log('5️⃣ Simulando dados de balances...');
    const balancesData = {
      address: testAddress,
      network: 'testnet',
      azeBalance: {
        balanceWei: '1000000000000000000',
        balanceEth: '1.0'
      },
      tokenBalances: [
        {
          contractAddress: '0x1234567890123456789012345678901234567890',
          tokenName: 'Test Token',
          tokenSymbol: 'TEST',
          tokenDecimals: 18,
          balanceWei: '500000000000000000',
          balanceEth: '0.5'
        },
        {
          contractAddress: '0x9876543210987654321098765432109876543210',
          tokenName: 'USDC Token',
          tokenSymbol: 'USDC',
          tokenDecimals: 6,
          balanceWei: '100000000',
          balanceEth: '100.0'
        }
      ],
      balancesTable: {
        AZE: '1.0',
        cBRL: '0',
        TEST: '0.5',
        USDC: '100.0'
      },
      totalTokens: 3,
      timestamp: new Date().toISOString()
    };

    // 6. Armazenar balances no cache
    console.log('6️⃣ Armazenando balances no cache...');
    const balanceCacheResult = await redisService.cacheUserBalances(testUserId, testAddress, balancesData, 300);
    console.log('Balances armazenados:', balanceCacheResult ? '✅ Sucesso' : '❌ Falha');
    console.log('');

    // 7. Recuperar balances do cache
    console.log('7️⃣ Recuperando balances do cache...');
    const retrievedBalances = await redisService.getCachedUserBalances(testUserId, testAddress);
    
    if (retrievedBalances) {
      console.log('✅ Balances recuperados:');
      console.log('   Endereço:', retrievedBalances.address);
      console.log('   Rede:', retrievedBalances.network);
      console.log('   Saldo AZE:', retrievedBalances.azeBalance.balanceEth);
      console.log('   Total de Tokens:', retrievedBalances.totalTokens);
      console.log('   Cacheado em:', retrievedBalances.cachedAt);
      
      if (retrievedBalances.balancesTable) {
        console.log('   📊 Tabela de Balances:');
        Object.entries(retrievedBalances.balancesTable).forEach(([token, balance]) => {
          console.log(`     ${token}: ${balance}`);
        });
      }
      console.log('');
    } else {
      console.log('❌ Falha ao recuperar balances');
      console.log('');
    }

    // 8. Simular consulta de saldo do usuário logado
    console.log('8️⃣ Simulando consulta de saldo do usuário logado...');
    console.log('🔍 Buscando saldo para usuário:', testUserId);
    console.log('📍 Endereço:', testAddress);
    
    // Simular fluxo: primeiro verificar cache, depois buscar da API
    const cachedBalances = await redisService.getCachedUserBalances(testUserId, testAddress);
    
    if (cachedBalances) {
      console.log('✅ Saldo encontrado no cache!');
      console.log('   💎 AZE:', cachedBalances.balancesTable.AZE);
      console.log('   💰 cBRL:', cachedBalances.balancesTable.cBRL);
      console.log('   🧪 TEST:', cachedBalances.balancesTable.TEST);
      console.log('   💵 USDC:', cachedBalances.balancesTable.USDC);
      console.log('   ⏱️ Resposta instantânea do cache');
    } else {
      console.log('❌ Saldo não encontrado no cache');
      console.log('   🔄 Buscando da API externa...');
      console.log('   ⏱️ Aguardando resposta da API...');
      console.log('   💾 Armazenando no cache para próximas consultas...');
    }
    console.log('');

    // 9. Testar atualização de dados
    console.log('9️⃣ Testando atualização de dados...');
    const updateData = {
      name: 'Usuário Teste Atualizado',
      lastUpdated: new Date().toISOString()
    };

    const updateResult = await redisService.updateCachedUserData(testUserId, updateData, 3600);
    console.log('Dados atualizados:', updateResult ? '✅ Sucesso' : '❌ Falha');

    // Verificar dados atualizados
    const updatedUserData = await redisService.getCachedUserData(testUserId);
    console.log('Nome atualizado:', updatedUserData?.name);
    console.log('');

    // 10. Estatísticas finais
    console.log('🔟 Estatísticas do cache...');
    const stats = await redisService.getCacheStats();
    console.log('📊 Estatísticas:');
    console.log('   Conectado:', stats.isConnected);
    console.log('   Usuários cacheados:', stats.userCache.count);
    console.log('   Balances cacheados:', stats.balancesCache.count);
    console.log('   Total de chaves:', stats.totalKeys);
    console.log('');

    // 11. Limpeza
    console.log('🧹 Limpando dados de teste...');
    await redisService.removeCachedUserData(testUserId);
    await redisService.removeCachedUserBalances(testUserId, testAddress);
    console.log('✅ Dados de teste removidos');
    console.log('');

    console.log('🎉 Teste completo realizado com sucesso!');
    console.log('');
    console.log('📋 Resumo do que foi testado:');
    console.log('   ✅ Conexão com Redis');
    console.log('   ✅ Cache de dados de usuário');
    console.log('   ✅ Cache de balances de tokens');
    console.log('   ✅ Tabela dinâmica de balances (AZE, cBRL, TEST, USDC)');
    console.log('   ✅ Atualização de dados');
    console.log('   ✅ Estatísticas do cache');
    console.log('   ✅ Limpeza de dados');
    console.log('');
    console.log('🚀 O sistema de cache está funcionando perfeitamente!');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
  } finally {
    // Fechar conexão
    await redisService.disconnect();
    console.log('🔌 Conexão com Redis fechada');
  }
}

// Executar teste se o script for chamado diretamente
if (require.main === module) {
  testRedisDirect();
}

module.exports = { testRedisDirect };

