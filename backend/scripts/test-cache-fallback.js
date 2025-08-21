#!/usr/bin/env node

/**
 * Script para testar o sistema de cache quando a API falha
 */

const path = require('path');

// Carregar configurações da testnet
require('dotenv').config({ path: path.join(__dirname, '..', '.env.testnet') });

const blockchainService = require('../src/services/blockchain.service');
const balanceSyncService = require('../src/services/balanceSync.service');
const userCacheService = require('../src/services/userCache.service');

const TEST_ADDRESS = '0x5528C065931f523CA9F3a6e49a911896fb1D2e6f';

/**
 * Simular falha da API Azorescan
 */
function simulateAPIFailure() {
  const azorescanService = require('../src/services/azorescan.service');
  
  // Salvar método original
  const originalGetCompleteBalances = azorescanService.getCompleteBalances;
  
  // Substituir por método que sempre falha
  azorescanService.getCompleteBalances = async (publicKey, network) => {
    console.log('🚫 Simulando falha da API Azorescan...');
    throw new Error('Simulated API failure - Azorescan down');
  };
  
  // Retornar função para restaurar
  return () => {
    azorescanService.getCompleteBalances = originalGetCompleteBalances;
  };
}

/**
 * Teste principal
 */
async function testCacheFallback() {
  console.log('🔍 Testando sistema de cache com falha da API');
  console.log('================================================\n');

  try {
    console.log('1️⃣ Primeira consulta - API funcionando');
    console.log('---------------------------------------');
    
    // Primeira consulta com API funcionando
    const result1 = await blockchainService.getUserBalances(TEST_ADDRESS, 'testnet');
    console.log('✅ API funcionando - Saldos obtidos:');
    console.log(`   - Tokens: ${result1.totalTokens}`);
    console.log(`   - Status: ${result1.syncStatus}`);
    console.log(`   - Cache: ${result1.fromCache}`);
    
    if (result1.balancesTable && result1.balancesTable.cBRL) {
      console.log(`   - cBRL: ${result1.balancesTable.cBRL}`);
    }
    console.log();

    console.log('2️⃣ Simulando falha da API');
    console.log('-------------------------');
    
    // Simular falha da API
    const restoreAPI = simulateAPIFailure();
    
    // Segunda consulta com API falhando (deve usar cache)
    const result2 = await blockchainService.getUserBalances(TEST_ADDRESS, 'testnet');
    console.log('🔄 API falhando - Resultado:');
    console.log(`   - Status: ${result2.syncStatus}`);
    console.log(`   - Cache: ${result2.fromCache}`);
    console.log(`   - Erro: ${result2.syncError}`);
    
    if (result2.balancesTable && result2.balancesTable.cBRL) {
      console.log(`   - cBRL mantido: ${result2.balancesTable.cBRL}`);
    } else {
      console.log(`   - ❌ cBRL perdido! Saldos:`, result2.balancesTable);
    }
    console.log();

    console.log('3️⃣ Testando UserCacheService');
    console.log('-----------------------------');
    
    // Testar o UserCacheService também
    const userCacheResult = await userCacheService.loadBlockchainData(TEST_ADDRESS);
    console.log('🏗️ UserCacheService resultado:');
    console.log(`   - Status: ${userCacheResult.syncStatus}`);
    console.log(`   - Cache: ${userCacheResult.fromCache}`);
    
    if (userCacheResult.balancesTable && userCacheResult.balancesTable.cBRL) {
      console.log(`   - cBRL: ${userCacheResult.balancesTable.cBRL}`);
    } else {
      console.log(`   - ❌ cBRL perdido no UserCache!`);
    }
    console.log();

    // Restaurar API
    restoreAPI();
    
    console.log('4️⃣ Restaurando API');
    console.log('------------------');
    
    // Terceira consulta com API restaurada
    const result3 = await blockchainService.getUserBalances(TEST_ADDRESS, 'testnet');
    console.log('✅ API restaurada - Resultado:');
    console.log(`   - Status: ${result3.syncStatus}`);
    console.log(`   - Cache: ${result3.fromCache}`);
    
    if (result3.balancesTable && result3.balancesTable.cBRL) {
      console.log(`   - cBRL: ${result3.balancesTable.cBRL}`);
    }
    console.log();

    // Comparar resultados
    const cBRL1 = result1.balancesTable?.cBRL || '0';
    const cBRL2 = result2.balancesTable?.cBRL || '0';
    const cBRL3 = result3.balancesTable?.cBRL || '0';
    
    console.log('📊 Resumo do teste:');
    console.log('===================');
    console.log(`   API OK:       cBRL = ${cBRL1}`);
    console.log(`   API FALHOU:   cBRL = ${cBRL2} ${cBRL2 === '0' ? '❌' : '✅'}`);
    console.log(`   API RESTORE:  cBRL = ${cBRL3}`);
    
    if (cBRL2 !== '0' && cBRL2 === cBRL1) {
      console.log('\n🎉 SUCESSO: Cache funcionando corretamente!');
      return true;
    } else {
      console.log('\n❌ FALHA: Cache não está mantendo os saldos!');
      return false;
    }

  } catch (error) {
    console.error('\n❌ Erro durante o teste:', error.message);
    return false;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  testCacheFallback()
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

module.exports = { testCacheFallback };