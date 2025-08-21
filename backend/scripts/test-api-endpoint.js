#!/usr/bin/env node

/**
 * Script para testar o endpoint da API que o frontend usa
 * Testa o comportamento do /api/balance-sync/fresh quando o explorer está offline
 */

const path = require('path');
const fetch = require('node-fetch');

// Carregar configurações da testnet
require('dotenv').config({ path: path.join(__dirname, '..', '.env.testnet') });

const balanceSyncService = require('../src/services/balanceSync.service');
const redisService = require('../src/services/redis.service');

const TEST_ADDRESS = '0x5528C065931f523CA9F3a6e49a911896fb1D2e6f';
const TEST_USER_ID = '1'; // ID do usuário ivan.alberton@navi.inf.br
const TEST_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoiaXZhbi5hbGJlcnRvbkBuYXZpLmluZi5iciIsImlhdCI6MTczNDg2MDc0MCwiZXhwIjoxNzM0ODY0MzQwfQ.oJ8eWUr0GH67r6lLvJh-0oA7gWn1TYVx6nL2L-R4y2c'; // Token válido do ivan
const API_BASE_URL = 'http://localhost:8800';

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
 * Fazer chamada para API como o frontend faria
 */
async function callFreshBalancesAPI(address, network = 'testnet', token = null) {
  try {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(
      `${API_BASE_URL}/api/balance-sync/fresh?address=${address}&network=${network}`,
      {
        method: 'GET',
        headers
      }
    );
    
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
async function setupTestCache() {
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
  await balanceSyncService.updateCache(TEST_USER_ID, TEST_ADDRESS, testBalances, 'testnet');
  
  console.log('✅ Cache de teste configurado:', {
    userId: TEST_USER_ID,
    address: TEST_ADDRESS,
    balances: testBalances.balancesTable
  });
  
  return testBalances;
}

/**
 * Teste principal
 */
async function testAPIEndpoint() {
  console.log('🔍 Testando API endpoint com explorer offline');
  console.log('==============================================\n');

  try {
    // 1. Configurar cache com dados válidos
    const originalBalances = await setupTestCache();
    console.log('1️⃣ Cache configurado com sucesso\n');

    // 2. Teste com API funcionando primeiro
    console.log('2️⃣ Teste com API funcionando');
    console.log('-----------------------------');
    try {
      const workingResult = await callFreshBalancesAPI(TEST_ADDRESS, 'testnet', TEST_JWT);
      console.log(`Status: ${workingResult.status}, Success: ${workingResult.data.success}`);
      if (workingResult.data.success && workingResult.data.data?.balancesTable?.cBRL) {
        console.log(`cBRL: ${workingResult.data.data.balancesTable.cBRL}`);
      }
      console.log();
    } catch (error) {
      console.log('⚠️ API já não está funcionando:', error.message);
      console.log();
    }

    // 3. Simular explorer offline
    console.log('3️⃣ Simulando explorer offline');
    console.log('-----------------------------');
    const restoreAzorescan = simulateAzorescanOffline();
    
    // 4. Testar API com fallback
    const offlineResult = await callFreshBalancesAPI(TEST_ADDRESS, 'testnet', TEST_JWT);
    console.log('🔄 Explorer offline - Resultado da API:');
    console.log(`   - Status HTTP: ${offlineResult.status}`);
    console.log(`   - Success: ${offlineResult.data.success}`);
    console.log(`   - Message: ${offlineResult.data.message}`);
    
    if (offlineResult.data.success && offlineResult.data.data) {
      const data = offlineResult.data.data;
      console.log(`   - From cache: ${data.fromCache}`);
      console.log(`   - Sync status: ${data.syncStatus}`);
      console.log(`   - Total tokens: ${Object.keys(data.balancesTable || {}).length}`);
      
      if (data.balancesTable && data.balancesTable.cBRL) {
        console.log(`   - cBRL mantido: ${data.balancesTable.cBRL}`);
      } else {
        console.log(`   - ❌ cBRL perdido! Balances: ${JSON.stringify(data.balancesTable)}`);
      }
    } else {
      console.log(`   - ❌ Falha total - nenhum dado retornado`);
      console.log(`   - Erro: ${offlineResult.data.error}`);
    }
    console.log();

    // 5. Testar endpoint de cache direto
    console.log('4️⃣ Testando endpoint de cache direto');
    console.log('------------------------------------');
    try {
      const cacheResult = await callAPIEndpoint(`/api/balance-sync/cache?userId=${TEST_USER_ID}&address=${TEST_ADDRESS}&network=testnet`, TEST_JWT);
      console.log(`Status: ${cacheResult.status}, Success: ${cacheResult.data.success}`);
      if (cacheResult.data.success && cacheResult.data.data?.balancesTable) {
        console.log(`cBRL no cache: ${cacheResult.data.data.balancesTable.cBRL || 'não encontrado'}`);
      }
    } catch (cacheError) {
      console.log(`Erro ao testar cache direto: ${cacheError.message}`);
    }
    console.log();

    // 6. Restaurar Azorescan
    restoreAzorescan();
    console.log('5️⃣ Azorescan restaurado\n');

    // 7. Verificar resultado final
    const cBRLOriginal = originalBalances.balancesTable?.cBRL || '0';
    let cBRLOffline = '0';
    
    if (offlineResult.data.success && offlineResult.data.data?.balancesTable?.cBRL) {
      cBRLOffline = offlineResult.data.data.balancesTable.cBRL;
    }
    
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
      console.log(`   Status: ${offlineResult.status}, Success: ${offlineResult.data.success}`);
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

/**
 * Chamada genérica para API
 */
async function callAPIEndpoint(endpoint, token = null) {
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'GET',
    headers
  });
  
  const data = await response.json();
  
  return {
    status: response.status,
    ok: response.ok,
    data
  };
}

// Executar se chamado diretamente
if (require.main === module) {
  testAPIEndpoint()
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

module.exports = { testAPIEndpoint };