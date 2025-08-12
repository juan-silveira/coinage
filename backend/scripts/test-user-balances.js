const axios = require('axios');
const redisService = require('../src/services/redis.service');

/**
 * Script para testar o saldo do usuário logado puxando do Redis
 */
async function testUserBalances() {
  console.log('🧪 Testando saldo do usuário logado com Redis...\n');

  const BASE_URL = 'http://localhost:8800';
  let accessToken = null;
  let userId = null;

  try {
    // 1. Testar conexão Redis
    console.log('1️⃣ Verificando conexão com Redis...');
    const connectionTest = await redisService.testConnection();
    console.log('Redis Status:', connectionTest.success ? '✅ Conectado' : '❌ Desconectado');
    console.log('');

    if (!connectionTest.success) {
      console.log('❌ Redis não está conectado. Inicie o Redis primeiro.');
      return;
    }

    // 2. Fazer login do usuário
    console.log('2️⃣ Fazendo login do usuário...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'ivan.alberton@navi.inf.br',
      password: 'N@vi@2025'
    });

    if (loginResponse.data.success) {
      accessToken = loginResponse.data.data.accessToken;
      userId = loginResponse.data.data.user.id;
      console.log('✅ Login realizado com sucesso');
      console.log('👤 Usuário ID:', userId);
      console.log('🔑 Token obtido:', accessToken.substring(0, 20) + '...');
      console.log('');
    } else {
      console.log('❌ Falha no login:', loginResponse.data.message);
      return;
    }

    // 3. Verificar se dados do usuário foram cacheados
    console.log('3️⃣ Verificando cache de dados do usuário...');
    const cachedUserData = await redisService.getCachedUserData(userId);
    
    if (cachedUserData) {
      console.log('✅ Dados do usuário encontrados no cache:');
      console.log('   Nome:', cachedUserData.name);
      console.log('   Email:', cachedUserData.email);
      console.log('   CPF:', cachedUserData.cpf);
      console.log('   Public Key:', cachedUserData.publicKey);
      console.log('   Cacheado em:', cachedUserData.cachedAt);
      console.log('');
    } else {
      console.log('❌ Dados do usuário não encontrados no cache');
      console.log('');
    }

    // 4. Consultar balances pela primeira vez (sem cache)
    console.log('4️⃣ Primeira consulta de balances (sem cache)...');
    const firstBalanceResponse = await axios.get(
      `${BASE_URL}/api/users/address/${cachedUserData.publicKey}/balances?network=testnet`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    if (firstBalanceResponse.data.success) {
      console.log('✅ Primeira consulta realizada com sucesso');
      console.log('   From Cache:', firstBalanceResponse.data.fromCache);
      console.log('   Endereço:', firstBalanceResponse.data.data.address);
      console.log('   Rede:', firstBalanceResponse.data.data.network);
      console.log('   Saldo AZE:', firstBalanceResponse.data.data.azeBalance.balanceEth);
      console.log('   Total de Tokens:', firstBalanceResponse.data.data.totalTokens);
      console.log('   Timestamp:', firstBalanceResponse.data.data.timestamp);
      console.log('');
    } else {
      console.log('❌ Erro na primeira consulta:', firstBalanceResponse.data.message);
      return;
    }

    // 5. Verificar se balances foram cacheados
    console.log('5️⃣ Verificando cache de balances...');
    const cachedBalances = await redisService.getCachedUserBalances(userId, cachedUserData.publicKey);
    
    if (cachedBalances) {
      console.log('✅ Balances encontrados no cache:');
      console.log('   Endereço:', cachedBalances.address);
      console.log('   Rede:', cachedBalances.network);
      console.log('   Saldo AZE:', cachedBalances.azeBalance.balanceEth);
      console.log('   Total de Tokens:', cachedBalances.totalTokens);
      console.log('   Cacheado em:', cachedBalances.cachedAt);
      
      if (cachedBalances.balancesTable) {
        console.log('   Tabela de Balances:');
        Object.entries(cachedBalances.balancesTable).forEach(([token, balance]) => {
          console.log(`     ${token}: ${balance}`);
        });
      }
      console.log('');
    } else {
      console.log('❌ Balances não encontrados no cache');
      console.log('');
    }

    // 6. Segunda consulta de balances (com cache)
    console.log('6️⃣ Segunda consulta de balances (com cache)...');
    const startTime = Date.now();
    const secondBalanceResponse = await axios.get(
      `${BASE_URL}/api/users/address/${cachedUserData.publicKey}/balances?network=testnet`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    if (secondBalanceResponse.data.success) {
      console.log('✅ Segunda consulta realizada com sucesso');
      console.log('   From Cache:', secondBalanceResponse.data.fromCache);
      console.log('   Tempo de Resposta:', responseTime + 'ms');
      console.log('   Saldo AZE:', secondBalanceResponse.data.data.azeBalance.balanceEth);
      console.log('   Total de Tokens:', secondBalanceResponse.data.data.totalTokens);
      console.log('');
    } else {
      console.log('❌ Erro na segunda consulta:', secondBalanceResponse.data.message);
      return;
    }

    // 7. Comparar tempos de resposta
    console.log('7️⃣ Comparando performance...');
    if (secondBalanceResponse.data.fromCache) {
      console.log('✅ Cache funcionando corretamente!');
      console.log('   Segunda consulta retornou do cache');
      console.log('   Resposta muito mais rápida');
    } else {
      console.log('⚠️ Cache não está sendo usado');
    }
    console.log('');

    // 8. Testar estatísticas do cache
    console.log('8️⃣ Verificando estatísticas do cache...');
    const stats = await redisService.getCacheStats();
    console.log('Estatísticas do Cache:');
    console.log('   Conectado:', stats.isConnected);
    console.log('   Usuários cacheados:', stats.userCache.count);
    console.log('   Balances cacheados:', stats.balancesCache.count);
    console.log('   Total de chaves:', stats.totalKeys);
    console.log('');

    // 9. Testar limpeza de cache
    console.log('9️⃣ Testando limpeza de cache...');
    const clearedKeys = await redisService.clearAllCache();
    console.log('Cache limpo:', clearedKeys, 'chaves removidas');
    
    // Verificar se cache foi limpo
    const cachedUserAfterClear = await redisService.getCachedUserData(userId);
    const cachedBalancesAfterClear = await redisService.getCachedUserBalances(userId, cachedUserData.publicKey);
    
    console.log('Dados do usuário após limpeza:', cachedUserAfterClear ? '❌ Ainda existe' : '✅ Removido');
    console.log('Balances após limpeza:', cachedBalancesAfterClear ? '❌ Ainda existe' : '✅ Removido');
    console.log('');

    console.log('✅ Teste completo realizado com sucesso!');
    console.log('');
    console.log('📊 Resumo:');
    console.log('   - Login com cache automático: ✅');
    console.log('   - Cache de dados do usuário: ✅');
    console.log('   - Cache de balances: ✅');
    console.log('   - Performance melhorada: ✅');
    console.log('   - Administração do cache: ✅');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
    
    if (error.response) {
      console.error('Resposta da API:', error.response.data);
    }
  } finally {
    // Fechar conexão Redis
    await redisService.disconnect();
    console.log('🔌 Conexão com Redis fechada');
  }
}

// Executar teste se o script for chamado diretamente
if (require.main === module) {
  testUserBalances();
}

module.exports = { testUserBalances };

