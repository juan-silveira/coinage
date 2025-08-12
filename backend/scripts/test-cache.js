const redisService = require('../src/services/redis.service');

/**
 * Script para testar as funcionalidades de cache Redis
 */
async function testCache() {
  console.log('🧪 Iniciando testes do cache Redis...\n');

  try {
    // 1. Testar conexão
    console.log('1️⃣ Testando conexão com Redis...');
    const connectionTest = await redisService.testConnection();
    console.log('Resultado:', connectionTest);
    console.log('');

    if (!connectionTest.success) {
      console.log('❌ Falha na conexão com Redis. Abortando testes.');
      return;
    }

    // 2. Testar cache de dados de usuário
    console.log('2️⃣ Testando cache de dados de usuário...');
    const testUserData = {
      id: 'test-user-123',
      name: 'Usuário Teste',
      email: 'teste@example.com',
      phone: '11999999999',
      cpf: '12345678901',
      birthDate: '1990-01-01',
      publicKey: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
      clientId: 'test-client-456',
      permissions: { read: true, write: false },
      roles: ['USER'],
      isApiAdmin: false,
      isClientAdmin: false,
      isFirstAccess: false,
      isActive: true
    };

    // Armazenar dados
    const cacheResult = await redisService.cacheUserData('test-user-123', testUserData, 60);
    console.log('Cache armazenado:', cacheResult);

    // Recuperar dados
    const retrievedData = await redisService.getCachedUserData('test-user-123');
    console.log('Dados recuperados:', retrievedData ? '✅ Sucesso' : '❌ Falha');
    console.log('');

    // 3. Testar cache de balances
    console.log('3️⃣ Testando cache de balances...');
    const testBalancesData = {
      address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
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
        }
      ],
      balancesTable: {
        AZE: '1.0',
        cBRL: '0',
        TEST: '0.5'
      },
      totalTokens: 2,
      timestamp: new Date().toISOString()
    };

    // Armazenar balances
    const balanceCacheResult = await redisService.cacheUserBalances('test-user-123', '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6', testBalancesData, 60);
    console.log('Balances armazenados:', balanceCacheResult);

    // Recuperar balances
    const retrievedBalances = await redisService.getCachedUserBalances('test-user-123', '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6');
    console.log('Balances recuperados:', retrievedBalances ? '✅ Sucesso' : '❌ Falha');
    console.log('');

    // 4. Testar atualização de dados
    console.log('4️⃣ Testando atualização de dados...');
    const updateData = {
      name: 'Usuário Teste Atualizado',
      lastUpdated: new Date().toISOString()
    };

    const updateResult = await redisService.updateCachedUserData('test-user-123', updateData, 60);
    console.log('Dados atualizados:', updateResult);

    // Verificar dados atualizados
    const updatedData = await redisService.getCachedUserData('test-user-123');
    console.log('Nome atualizado:', updatedData?.name);
    console.log('');

    // 5. Testar estatísticas
    console.log('5️⃣ Testando estatísticas do cache...');
    const stats = await redisService.getCacheStats();
    console.log('Estatísticas:', stats);
    console.log('');

    // 6. Testar blacklist
    console.log('6️⃣ Testando blacklist...');
    const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token';
    
    // Adicionar à blacklist
    const blacklistAdd = await redisService.addToBlacklist(testToken, 60);
    console.log('Token adicionado à blacklist:', blacklistAdd);

    // Verificar se está na blacklist
    const isBlacklisted = await redisService.isBlacklisted(testToken);
    console.log('Token está na blacklist:', isBlacklisted);

    // Remover da blacklist
    const blacklistRemove = await redisService.removeFromBlacklist(testToken);
    console.log('Token removido da blacklist:', blacklistRemove);
    console.log('');

    // 7. Limpar dados de teste
    console.log('7️⃣ Limpando dados de teste...');
    await redisService.removeCachedUserData('test-user-123');
    await redisService.removeCachedUserBalances('test-user-123', '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6');
    console.log('✅ Dados de teste removidos');
    console.log('');

    // 8. Estatísticas finais
    console.log('8️⃣ Estatísticas finais...');
    const finalStats = await redisService.getCacheStats();
    console.log('Estatísticas finais:', finalStats);
    console.log('');

    console.log('✅ Todos os testes concluídos com sucesso!');

  } catch (error) {
    console.error('❌ Erro durante os testes:', error.message);
  } finally {
    // Fechar conexão
    await redisService.disconnect();
    console.log('🔌 Conexão com Redis fechada');
  }
}

// Executar testes se o script for chamado diretamente
if (require.main === module) {
  testCache();
}

module.exports = { testCache };

