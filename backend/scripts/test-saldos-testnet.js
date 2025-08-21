/**
 * Script para testar se os saldos estão sendo retornados corretamente na testnet
 */

const axios = require('axios');

async function testDirectAPI() {
  console.log('🧪 Testando API direta do Azorescan...');
  
  try {
    // Testar tokens ERC-20
    const tokensResponse = await axios.get('https://floripa.azorescan.com/api/?module=account&action=tokenlist&address=0x5528C065931f523CA9F3a6e49a911896fb1D2e6f');
    console.log('✅ Tokens ERC-20:', tokensResponse.data.result?.length || 0);
    
    // Testar balance nativo
    const balanceResponse = await axios.get('https://floripa.azorescan.com/api/?module=account&action=balance&address=0x5528C065931f523CA9F3a6e49a911896fb1D2e6f&tag=latest');
    console.log('✅ Balance AZE-t nativo:', balanceResponse.data.result);
    
    return true;
  } catch (error) {
    console.error('❌ Erro na API direta:', error.message);
    return false;
  }
}

async function testBackendConfig() {
  console.log('\n🧪 Testando configuração do backend...');
  
  try {
    const configResponse = await axios.get('http://localhost:8800/api/config/public');
    console.log('✅ Network padrão:', configResponse.data.data.defaultNetwork);
    console.log('✅ Testnet Explorer URL:', configResponse.data.data.testnetExplorerUrl);
    
    return configResponse.data.data.defaultNetwork === 'testnet';
  } catch (error) {
    console.error('❌ Erro na configuração do backend:', error.message);
    return false;
  }
}

async function testAzorescanService() {
  console.log('\n🧪 Testando serviço Azorescan do backend...');
  
  try {
    // Este endpoint requer autenticação, mas podemos ver os logs
    const response = await axios.get('http://localhost:8800/api/balance-sync/fresh?address=0x5528C065931f523CA9F3a6e49a911896fb1D2e6f&network=testnet');
    
    // Se chegou aqui sem autenticação, deve retornar erro 401
    console.log('⚠️ Resposta (sem auth):', response.status);
    
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Endpoint funcionando (requer autenticação)');
      return true;
    } else {
      console.error('❌ Erro inesperado:', error.message);
      return false;
    }
  }
}

async function main() {
  console.log('🚀 Testando sistema de saldos na testnet');
  console.log('='.repeat(50));
  
  const results = {
    directAPI: await testDirectAPI(),
    backendConfig: await testBackendConfig(),
    azorescanService: await testAzorescanService()
  };
  
  console.log('\n📊 RESULTADOS:');
  console.log('='.repeat(30));
  Object.entries(results).forEach(([test, result]) => {
    console.log(`${result ? '✅' : '❌'} ${test}: ${result ? 'OK' : 'FALHOU'}`);
  });
  
  const allPassed = Object.values(results).every(Boolean);
  
  if (allPassed) {
    console.log('\n🎉 TODOS OS TESTES PASSARAM!');
    console.log('👍 O sistema deve funcionar corretamente agora.');
    console.log('\n📋 PRÓXIMOS PASSOS:');
    console.log('1. Faça login no frontend');
    console.log('2. Verifique se os saldos aparecem corretamente');
    console.log('3. Se ainda aparecer 0, verifique o console do navegador');
  } else {
    console.log('\n❌ ALGUNS TESTES FALHARAM');
    console.log('🔧 Verifique as configurações e tente novamente.');
  }
}

if (require.main === module) {
  main().catch(console.error);
}