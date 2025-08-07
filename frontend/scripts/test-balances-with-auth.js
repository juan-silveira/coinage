const axios = require('axios');

// Configuração da API
const API_BASE_URL = 'http://localhost:8800';

// Credenciais de teste (credenciais padrão do sistema)
const TEST_EMAIL = 'admin@azore.technology';
const TEST_PASSWORD = 'azore@admin123';

let accessToken = null;

// Função para fazer login
async function login() {
  try {
    console.log('🔐 Fazendo login...');
    
    const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });

    if (response.data.success) {
      accessToken = response.data.data.accessToken;
      console.log('✅ Login realizado com sucesso');
      console.log('User:', response.data.data.user.name);
      console.log('Public Key:', response.data.data.user.publicKey);
      return response.data.data.user;
    } else {
      throw new Error('Falha no login');
    }
  } catch (error) {
    console.error('❌ Erro no login:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    throw error;
  }
}

// Função para testar a API de balances com autenticação
async function testBalancesAPI(user) {
  try {
    console.log('\n🔍 Testando API de balances com autenticação...\n');

    if (!user?.publicKey) {
      console.log('❌ Usuário não tem publicKey');
      return;
    }

    console.log(`📋 Testando endereço: ${user.publicKey}`);
    
    const response = await axios.get(`${API_BASE_URL}/api/users/address/${user.publicKey}/balances`, {
      params: { network: 'testnet' },
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
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
        
        // Verificar especificamente AZE e cBRL
        console.log('\n🎯 Verificação específica:');
        console.log(`  AZE: ${data.balancesTable.AZE || 'NÃO ENCONTRADO'}`);
        console.log(`  cBRL: ${data.balancesTable.cBRL || 'NÃO ENCONTRADO'}`);
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

// Função para testar getUserByEmail
async function testGetUserByEmail() {
  try {
    console.log('\n🔍 Testando getUserByEmail...\n');
    
    const response = await axios.get(`${API_BASE_URL}/api/users/email/${TEST_EMAIL}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (response.data.success) {
      const user = response.data.data;
      console.log('✅ Dados do usuário do cache:');
      console.log('- Name:', user.name);
      console.log('- Email:', user.email);
      console.log('- Public Key:', user.publicKey);
      console.log('- Roles:', user.roles);
      console.log('- Is Active:', user.isActive);
      return user;
    } else {
      console.log('❌ Erro:', response.data.message);
    }
  } catch (error) {
    console.error('❌ Erro ao buscar usuário:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

// Executar testes
async function runTests() {
  try {
    console.log('🚀 Iniciando testes de balances com autenticação...\n');
    
    // 1. Fazer login
    const user = await login();
    
    // 2. Testar getUserByEmail
    await testGetUserByEmail();
    
    // 3. Testar balances
    await testBalancesAPI(user);
    
    console.log('\n✅ Testes concluídos!');
  } catch (error) {
    console.error('\n❌ Erro nos testes:', error.message);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { login, testBalancesAPI, testGetUserByEmail };
