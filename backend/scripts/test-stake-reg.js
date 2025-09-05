const axios = require('axios');

const API_URL = 'http://localhost:8800';

// Gerar um endereço aleatório para teste
function generateRandomAddress() {
  const chars = '0123456789abcdef';
  let address = '0x';
  for (let i = 0; i < 40; i++) {
    address += chars[Math.floor(Math.random() * chars.length)];
  }
  return address;
}

async function testStakeRegistration() {
  try {
    console.log('🎯 Testando registro de contrato de stake...\n');
    
    // Fazer login
    console.log('1️⃣ Fazendo login...');
    const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
      email: 'ivan.alberton@navi.inf.br',
      password: 'N@vi@2025'
    }, {
      headers: {
        'User-Agent': 'TestScript/1.0'
      }
    });
    
    const authToken = loginResponse.data.data.accessToken;
    console.log('✅ Login realizado com sucesso!\n');
    
    // Gerar endereço aleatório
    const randomAddress = generateRandomAddress();
    
    // Dados do novo stake
    const stakeData = {
      name: 'Teste de Stake',
      address: randomAddress,
      tokenAddress: '0x0A8c73967e4Eee8ffA06484C3fBf65E6Ae3b9804', // Token já registrado
      adminAddress: '0x5528C065931f523CA9F3a6e49a911896fb1D2e6f',
      network: 'testnet'
    };
    
    console.log('2️⃣ Registrando novo contrato de stake:');
    console.log('   Nome:', stakeData.name);
    console.log('   Endereço:', randomAddress);
    console.log('   Token:', stakeData.tokenAddress);
    console.log('   Rede:', stakeData.network);
    console.log('   Admin:', stakeData.adminAddress, '\n');
    
    // Registrar o stake
    const registerResponse = await axios.post(
      `${API_URL}/api/stake-contracts`,
      stakeData,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Contrato de stake registrado com sucesso!');
    console.log('📦 Resposta:', JSON.stringify(registerResponse.data, null, 2));
    
    // Verificar se foi registrado como tipo 'stake'
    if (registerResponse.data.success && registerResponse.data.data) {
      console.log('\n📊 Verificações:');
      console.log('   ID do contrato:', registerResponse.data.data.id);
      console.log('   Contract Type ID:', registerResponse.data.data.contractTypeId);
      console.log('   Metadata:', registerResponse.data.data.metadata);
    }
    
  } catch (error) {
    console.error('❌ Erro ao registrar stake:');
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Mensagem:', error.response.data?.message);
      console.error('   Erro:', error.response.data?.error);
      
      if (error.response.status === 500 && error.response.data?.message?.includes('contract type')) {
        console.log('\n⚠️ Problema identificado: Contract type não encontrado');
        console.log('   Verifique se o tipo "stake" existe na tabela contract_types');
      }
    } else {
      console.error('   Erro:', error.message);
    }
  }
}

// Executar o teste
testStakeRegistration();