#!/usr/bin/env node

/**
 * Script para testar o endpoint da API fazendo login primeiro
 */

const path = require('path');
const fetch = require('node-fetch');

// Carregar configurações da testnet
require('dotenv').config({ path: path.join(__dirname, '..', '.env.testnet') });

const balanceSyncService = require('../src/services/balanceSync.service');
const redisService = require('../src/services/redis.service');

const TEST_ADDRESS = '0x5528C065931f523CA9F3a6e49a911896fb1D2e6f';
const API_BASE_URL = 'http://localhost:8800';

// Credenciais do usuário de teste
const TEST_USER = {
  email: 'ivan.alberton@navi.inf.br',
  password: 'N@vi@2025'
};

/**
 * Fazer login e obter token
 */
async function login() {
  try {
    console.log('🔐 Fazendo login...');
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(TEST_USER)
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Login realizado com sucesso');
      return {
        token: data.data.token,
        user: data.data.user
      };
    } else {
      throw new Error(`Login falhou: ${data.message}`);
    }
  } catch (error) {
    throw new Error(`Erro no login: ${error.message}`);
  }
}

/**
 * Simular que o Azorescan está offline
 */
function simulateAzorescanOffline() {
  const azorescanService = require('../src/services/azorescan.service');
  
  // Salvar método original
  const originalGetCompleteBalances = azorescanService.getCompleteBalances;
  
  // Substituir por método que sempre falha
  azorescanService.getCompleteBalances = async (publicKey, network) => {
    console.log('🚫 Simulando Azorescan offline...');
    const error = new Error('Simulated network error - Azorescan offline');
    error.code = 'ENOTFOUND';
    error.response = { status: 503 };
    throw error;
  };
  
  // Retornar função para restaurar
  return () => {
    azorescanService.getCompleteBalances = originalGetCompleteBalances;
  };
}

/**
 * Fazer chamada para API
 */
async function callAPI(endpoint, token) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    return {
      status: response.status,
      ok: response.ok,
      data
    };
    
  } catch (error) {
    console.error('❌ Erro na chamada da API:', error.message);
    throw error;
  }
}

/**
 * Configurar cache de teste
 */
async function setupTestCache(userId) {
  console.log('🏗️ Configurando cache de teste...');
  
  // Inicializar Redis
  await redisService.initialize();
  
  // Cache simulado com cBRL
  const testBalances = {
    network: 'testnet',
    address: TEST_ADDRESS,
    balancesTable: {
      'AZE-t': '85.123456',
      'cBRL': '101390.000000'
    },
    totalTokens: 2,
    lastUpdated: new Date().toISOString(),
    source: 'test-setup'
  };
  
  // Salvar no cache do balanceSync
  await balanceSyncService.updateCache(userId, TEST_ADDRESS, testBalances, 'testnet');
  
  console.log('✅ Cache de teste configurado:', {
    userId: userId,
    address: TEST_ADDRESS,
    balances: testBalances.balancesTable
  });
  
  return testBalances;
}

/**
 * Teste principal
 */
async function testWithLogin() {
  console.log('🔍 Testando API endpoint com login válido');
  console.log('=========================================\n');

  try {
    // 1. Fazer login
    const loginData = await login();
    const { token, user } = loginData;
    console.log(`👤 Usuário logado: ${user.email} (ID: ${user.id})`);
    console.log();

    // 2. Configurar cache com dados válidos
    const originalBalances = await setupTestCache(user.id);
    console.log('1️⃣ Cache configurado com sucesso\n');

    // 3. Teste com API funcionando primeiro
    console.log('2️⃣ Teste com API funcionando');
    console.log('-----------------------------');
    try {
      const workingResult = await callAPI(`/api/balance-sync/fresh?address=${TEST_ADDRESS}&network=testnet`, token);
      console.log(`Status: ${workingResult.status}, Success: ${workingResult.data.success}`);
      if (workingResult.data.success && workingResult.data.data?.balancesTable?.cBRL) {
        console.log(`cBRL: ${workingResult.data.data.balancesTable.cBRL}`);
      }
      console.log();
    } catch (error) {
      console.log('⚠️ API já não está funcionando:', error.message);
      console.log();
    }

    // 4. Simular explorer offline
    console.log('3️⃣ Simulando explorer offline');
    console.log('-----------------------------');
    const restoreAzorescan = simulateAzorescanOffline();
    
    // 5. Testar API com fallback
    const offlineResult = await callAPI(`/api/balance-sync/fresh?address=${TEST_ADDRESS}&network=testnet`, token);
    console.log('🔄 Explorer offline - Resultado da API:');
    console.log(`   - Status HTTP: ${offlineResult.status}`);
    console.log(`   - Success: ${offlineResult.data.success}`);
    console.log(`   - Message: ${offlineResult.data.message}`);
    
    let cBRLOffline = '0';
    
    if (offlineResult.data.success && offlineResult.data.data) {
      const data = offlineResult.data.data;
      console.log(`   - From cache: ${data.fromCache}`);
      console.log(`   - Sync status: ${data.syncStatus}`);
      console.log(`   - Total tokens: ${Object.keys(data.balancesTable || {}).length}`);
      
      if (data.balancesTable && data.balancesTable.cBRL) {
        cBRLOffline = data.balancesTable.cBRL;
        console.log(`   - cBRL mantido: ${cBRLOffline}`);
      } else {
        console.log(`   - ❌ cBRL perdido! Balances: ${JSON.stringify(data.balancesTable)}`);
      }
    } else {
      console.log(`   - ❌ Falha total - nenhum dado retornado`);
      console.log(`   - Erro: ${offlineResult.data.error}`);
    }
    console.log();

    // 6. Testar endpoint de cache direto
    console.log('4️⃣ Testando endpoint de cache direto');
    console.log('------------------------------------');
    try {
      const cacheResult = await callAPI(`/api/balance-sync/cache?userId=${user.id}&address=${TEST_ADDRESS}&network=testnet`, token);
      console.log(`Status: ${cacheResult.status}, Success: ${cacheResult.data.success}`);
      if (cacheResult.data.success && cacheResult.data.data?.balancesTable) {
        console.log(`cBRL no cache: ${cacheResult.data.data.balancesTable.cBRL || 'não encontrado'}`);
      }
    } catch (cacheError) {
      console.log(`Erro ao testar cache direto: ${cacheError.message}`);
    }
    console.log();

    // 7. Restaurar Azorescan
    restoreAzorescan();
    console.log('5️⃣ Azorescan restaurado\n');

    // 8. Verificar resultado final
    const cBRLOriginal = originalBalances.balancesTable?.cBRL || '0';
    
    console.log('📊 Resumo do teste:');
    console.log('===================');
    console.log(`   Cache original: cBRL = ${cBRLOriginal}`);
    console.log(`   API offline: cBRL = ${cBRLOffline} ${cBRLOffline === '0' ? '❌' : '✅'}`);
    console.log(`   HTTP Status: ${offlineResult.status}`);
    console.log(`   API Success: ${offlineResult.data.success}`);
    
    if (offlineResult.data.success && cBRLOffline !== '0' && cBRLOffline === cBRLOriginal) {
      console.log('\n🎉 SUCESSO: API endpoint com cache fallback funcionando!');
      console.log('   O saldo não foi zerado quando o explorer estava offline');
      return true;
    } else {
      console.log('\n❌ FALHA: API endpoint não funcionou corretamente!');
      console.log(`   Esperado: ${cBRLOriginal}, Obtido: ${cBRLOffline}`);
      return false;
    }

  } catch (error) {
    console.error('\n❌ Erro durante o teste:', error.message);
    console.error('Stack trace:', error.stack);
    return false;
  } finally {
    // Cleanup
    try {
      await redisService.close();
    } catch (err) {
      // Ignorar erro de cleanup
    }
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  testWithLogin()
    .then(success => {
      if (success) {
        console.log('\n✅ Teste concluído com sucesso');
        process.exit(0);
      } else {
        console.log('\n❌ Teste falhou');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n❌ Erro não tratado:', error);
      process.exit(1);
    });
}

module.exports = { testWithLogin };