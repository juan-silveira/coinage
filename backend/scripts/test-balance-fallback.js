/**
 * Script para testar o sistema de fallback de balances
 * Simula cenários de API offline, Redis offline, etc.
 */

const api = require('../src/services/api');

// Configurações de teste
const TEST_USER = {
  id: '1',
  publicKey: '0x5528C065931f523CA9F3a6e49a911896fb1D2e6f',
  network: 'testnet'
};

const MOCK_BALANCES = {
  balancesTable: {
    'AZE-t': '100.000000',
    'cBRL': '250.500000',
    'cUSD': '75.250000'
  },
  network: 'testnet',
  address: TEST_USER.publicKey,
  lastUpdated: new Date().toISOString(),
  source: 'test'
};

async function testAPIOnline() {
  // console.log('\n🧪 [TESTE 1] API Blockchain Online');
  // console.log('='.repeat(50));
  
  try {
    const response = await fetch(`http://localhost:8800/api/balance-sync/fresh?address=${TEST_USER.publicKey}&network=${TEST_USER.network}`, {
      headers: {
        'Authorization': 'Bearer SEU_TOKEN_AQUI'
      }
    });
    
    const data = await response.json();
    
    console.log('✅ Resposta da API:', {
      success: data.success,
      tokens: data.data ? Object.keys(data.data.balancesTable || {}).length : 0,
      source: data.data?.source || 'unknown'
    });
    
    return data;
    
  } catch (error) {
    console.error('❌ Erro no teste API Online:', error.message);
    return null;
  }
}

async function testRedisCache() {
  console.log('\n🧪 [TESTE 2] Cache Redis');
  console.log('='.repeat(50));
  
  try {
    // Primeiro, inserir dados no cache
    const cacheResponse = await fetch(`http://localhost:8800/api/balance-sync/cache`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer SEU_TOKEN_AQUI'
      },
      body: JSON.stringify({
        userId: TEST_USER.id,
        address: TEST_USER.publicKey,
        balances: MOCK_BALANCES,
        network: TEST_USER.network,
        timestamp: new Date().toISOString(),
        source: 'test'
      })
    });
    
    const cacheData = await cacheResponse.json();
    console.log('✅ Cache inserido:', cacheData.success);
    
    // Agora, buscar do cache
    const getResponse = await fetch(`http://localhost:8800/api/balance-sync/cache?userId=${TEST_USER.id}&address=${TEST_USER.publicKey}&network=${TEST_USER.network}`, {
      headers: {
        'Authorization': 'Bearer SEU_TOKEN_AQUI'
      }
    });
    
    const getData = await getResponse.json();
    console.log('✅ Cache recuperado:', {
      success: getData.success,
      tokens: getData.data?.balances?.balancesTable ? Object.keys(getData.data.balances.balancesTable).length : 0
    });
    
    return getData;
    
  } catch (error) {
    console.error('❌ Erro no teste Redis Cache:', error.message);
    return null;
  }
}

async function testFallbackScenario() {
  console.log('\n🧪 [TESTE 3] Cenário de Fallback');
  console.log('='.repeat(50));
  
  // Simular API offline (comentar endpoint temporariamente)
  console.log('🔄 Para testar fallback, você precisa:');
  console.log('1. Derrubar a API do explorer (ou modificar URL)');
  console.log('2. Garantir que há cache Redis válido');
  console.log('3. Executar o fresh endpoint');
  console.log('4. Verificar se retorna dados do cache');
  
  return true;
}

async function main() {
  console.log('🚀 Iniciando testes do sistema de fallback de balances');
  console.log('=' .repeat(60));
  
  // Teste 1: API funcionando
  await testAPIOnline();
  
  // Teste 2: Cache Redis
  await testRedisCache();
  
  // Teste 3: Cenário de fallback
  await testFallbackScenario();
  
  console.log('\n✅ Testes concluídos');
  console.log('\n📋 INSTRUÇÕES PARA TESTE MANUAL:');
  console.log('1. Execute: node scripts/test-balance-fallback.js');
  console.log('2. No frontend, faça login com ivan.alberton@navi.inf.br');
  console.log('3. Observe os logs no console do navegador');
  console.log('4. Derrube a API do explorer: docker stop azorescan_api');
  console.log('5. Aguarde 1 minuto para o próximo refresh');
  console.log('6. Verifique se os balances persistem (vem do Redis)');
  console.log('7. Faça logout/login para testar AuthStore fallback');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testAPIOnline,
  testRedisCache,
  testFallbackScenario
};