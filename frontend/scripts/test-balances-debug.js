const axios = require('axios');

// Configuração da API
const API_BASE_URL = 'http://localhost:8800';

// Função para testar a API de balances
async function testBalancesAPI() {
  try {
    console.log('🔍 Testando API de balances...\n');

    // 1. Testar endpoint de balances diretamente
    console.log('1. Testando endpoint de balances...');
    
    // Substitua pelo endereço real de um usuário
    const testAddress = '0x5528C065931f523CA9F3a6e49a911896fb1D2e6f';
    
    const response = await axios.get(`${API_BASE_URL}/api/users/address/${testAddress}/balances`, {
      params: { network: 'testnet' }
    });

    console.log('✅ Resposta da API:');
    console.log('Status:', response.status);
    console.log('Success:', response.data.success);
    console.log('From Cache:', response.data.fromCache);
    
    if (response.data.success && response.data.data) {
      const data = response.data.data;
      console.log('\n📊 Estrutura dos dados:');
      console.log('- Address:', data.address);
      console.log('- Network:', data.network);
      console.log('- Total Tokens:', data.totalTokens);
      console.log('- Timestamp:', data.timestamp);
      
      if (data.balancesTable) {
        console.log('\n💰 Balances Table:');
        Object.entries(data.balancesTable).forEach(([symbol, balance]) => {
          console.log(`  ${symbol}: ${balance}`);
        });
      }
      
      if (data.tokenBalances && Array.isArray(data.tokenBalances)) {
        console.log('\n🪙 Token Balances:');
        data.tokenBalances.forEach((token, index) => {
          console.log(`  ${index + 1}. ${token.tokenSymbol} (${token.tokenName}): ${token.balanceEth}`);
        });
      }
      
      if (data.azeBalance) {
        console.log('\n🪙 AZE Balance:');
        console.log(`  Balance Wei: ${data.azeBalance.balanceWei}`);
        console.log(`  Balance Eth: ${data.azeBalance.balanceEth}`);
      }
    } else {
      console.log('❌ Erro na resposta:', response.data.message);
    }

  } catch (error) {
    console.error('❌ Erro ao testar API:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

// Função para testar com diferentes endereços
async function testMultipleAddresses() {
  const testAddresses = [
    '0x5528C065931f523CA9F3a6e49a911896fb1D2e6f', // Admin address
    '0x1234567890123456789012345678901234567890', // Endereço de teste
  ];

  for (const address of testAddresses) {
    console.log(`\n🔍 Testando endereço: ${address}`);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/users/address/${address}/balances`, {
        params: { network: 'testnet' }
      });

      if (response.data.success) {
        const balances = response.data.data.balancesTable;
        console.log(`✅ AZE: ${balances?.AZE || '0'}`);
        console.log(`✅ cBRL: ${balances?.cBRL || '0'}`);
      } else {
        console.log('❌ Erro:', response.data.message);
      }
    } catch (error) {
      console.log('❌ Erro:', error.message);
    }
  }
}

// Executar testes
async function runTests() {
  console.log('🚀 Iniciando testes de balances...\n');
  
  await testBalancesAPI();
  await testMultipleAddresses();
  
  console.log('\n✅ Testes concluídos!');
}

// Executar se chamado diretamente
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testBalancesAPI, testMultipleAddresses };
