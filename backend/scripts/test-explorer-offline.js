#!/usr/bin/env node

/**
 * Script para testar o comportamento quando o explorer está offline
 * Simula falha do Azorescan e verifica se o cache está funcionando
 */

const path = require('path');

// Carregar configurações da testnet
require('dotenv').config({ path: path.join(__dirname, '..', '.env.testnet') });

const blockchainService = require('../src/services/blockchain.service');
const balanceSyncService = require('../src/services/balanceSync.service');
const redisService = require('../src/services/redis.service');

const TEST_ADDRESS = '0x5528C065931f523CA9F3a6e49a911896fb1D2e6f';
const TEST_USER_ID = 'test-user-123';

/**
 * Simular que o Azorescan está offline
 */
function simulateAzorescanOffline() {
  const azorescanService = require('../src/services/azorescan.service');
  
  // Salvar método original
  const originalGetCompleteBalances = azorescanService.getCompleteBalances;
  const originalGetTokenBalances = azorescanService.getTokenBalances;
  const originalGetNativeBalance = azorescanService.getNativeBalance;
  
  // Substituir por métodos que sempre falham
  azorescanService.getCompleteBalances = async (publicKey, network) => {
    console.log('🚫 Simulando Azorescan offline...');
    const error = new Error('Simulated network error - Azorescan offline');
    error.code = 'ENOTFOUND';
    error.response = { status: 503 };
    throw error;
  };
  
  azorescanService.getTokenBalances = async (publicKey, network) => {
    console.log('🚫 Simulando Azorescan offline (tokens)...');
    const error = new Error('Simulated network error - Azorescan offline');
    error.code = 'ENOTFOUND';
    error.response = { status: 503 };
    throw error;
  };
  
  azorescanService.getNativeBalance = async (publicKey, network) => {
    console.log('🚫 Simulando Azorescan offline (native)...');
    const error = new Error('Simulated network error - Azorescan offline');
    error.code = 'ENOTFOUND';
    error.response = { status: 503 };
    throw error;
  };
  
  // Retornar função para restaurar
  return () => {
    azorescanService.getCompleteBalances = originalGetCompleteBalances;
    azorescanService.getTokenBalances = originalGetTokenBalances;
    azorescanService.getNativeBalance = originalGetNativeBalance;
  };
}

/**
 * Criar dados de cache simulados
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
async function testExplorerOffline() {
  console.log('🔍 Testando comportamento com explorer offline');
  console.log('===============================================\n');

  try {
    // 1. Configurar cache com dados válidos
    const originalBalances = await setupTestCache();
    console.log('1️⃣ Cache configurado com sucesso\n');

    // 2. Teste com API funcionando (para comparação)
    console.log('2️⃣ Teste com API funcionando');
    console.log('-----------------------------');
    try {
      const workingResult = await blockchainService.getUserBalances(TEST_ADDRESS, 'testnet');
      console.log('✅ API funcionando - Resultado:');
      console.log(`   - Status: ${workingResult.syncStatus}`);
      console.log(`   - Total tokens: ${workingResult.totalTokens}`);
      if (workingResult.balancesTable && workingResult.balancesTable.cBRL) {
        console.log(`   - cBRL: ${workingResult.balancesTable.cBRL}`);
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
    
    // 4. Testar getUserBalances com fallback
    const offlineResult = await blockchainService.getUserBalances(TEST_ADDRESS, 'testnet');
    console.log('🔄 Explorer offline - Resultado do fallback:');
    console.log(`   - Status: ${offlineResult.syncStatus}`);
    console.log(`   - From cache: ${offlineResult.fromCache}`);
    console.log(`   - Total tokens: ${offlineResult.totalTokens || 0}`);
    
    if (offlineResult.balancesTable && offlineResult.balancesTable.cBRL) {
      console.log(`   - cBRL mantido: ${offlineResult.balancesTable.cBRL}`);
    } else {
      console.log(`   - ❌ cBRL perdido! Balances: ${JSON.stringify(offlineResult.balancesTable)}`);
    }
    console.log();

    // 5. Testar balanceSyncService diretamente
    console.log('4️⃣ Testando BalanceSyncService');
    console.log('-----------------------------');
    const cacheResult = await balanceSyncService.getCache(TEST_USER_ID, TEST_ADDRESS, 'testnet');
    console.log('📦 Cache direto do BalanceSyncService:');
    if (cacheResult && cacheResult.balancesTable) {
      console.log(`   - Status: disponível`);
      console.log(`   - Total tokens: ${Object.keys(cacheResult.balancesTable).length}`);
      console.log(`   - cBRL: ${cacheResult.balancesTable.cBRL || 'não encontrado'}`);
    } else {
      console.log(`   - ❌ Cache vazio ou inválido`);
    }
    console.log();

    // 6. Restaurar Azorescan
    restoreAzorescan();
    console.log('5️⃣ Azorescan restaurado\n');

    // 7. Verificar resultado final
    const cBRLOriginal = originalBalances.balancesTable?.cBRL || '0';
    const cBRLOffline = offlineResult.balancesTable?.cBRL || '0';
    
    console.log('📊 Resumo do teste:');
    console.log('===================');
    console.log(`   Cache original: cBRL = ${cBRLOriginal}`);
    console.log(`   Explorer offline: cBRL = ${cBRLOffline} ${cBRLOffline === '0' ? '❌' : '✅'}`);
    console.log(`   Status: ${offlineResult.syncStatus}`);
    console.log(`   From cache: ${offlineResult.fromCache}`);
    
    if (cBRLOffline !== '0' && cBRLOffline === cBRLOriginal) {
      console.log('\n🎉 SUCESSO: Cache fallback funcionando corretamente!');
      console.log('   O saldo não foi zerado quando o explorer estava offline');
      return true;
    } else {
      console.log('\n❌ FALHA: Cache fallback não funcionou corretamente!');
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
  testExplorerOffline()
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

module.exports = { testExplorerOffline };