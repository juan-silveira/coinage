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

async function testNewTokenRegistration() {
  try {
    console.log('🔍 Testando registro de novo token...\n');
    
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
    
    // Dados do novo token
    const tokenData = {
      address: randomAddress,
      network: 'testnet',
      adminAddress: '0x5528C065931f523CA9F3a6e49a911896fb1D2e6f',
      website: 'https://example.com',
      description: 'Token de Teste'
    };
    
    console.log('2️⃣ Registrando novo token:');
    console.log('   Endereço:', randomAddress);
    console.log('   Rede:', tokenData.network);
    console.log('   Admin:', tokenData.adminAddress, '\n');
    
    // Registrar o token
    const registerResponse = await axios.post(
      `${API_URL}/api/tokens/register`,
      tokenData,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Token registrado com sucesso!');
    console.log('📦 Resposta:', JSON.stringify(registerResponse.data, null, 2));
    
    // Tentar registrar o mesmo token novamente
    console.log('\n3️⃣ Tentando registrar o mesmo token novamente...');
    try {
      await axios.post(
        `${API_URL}/api/tokens/register`,
        tokenData,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Sistema bloqueou corretamente o registro duplicado!');
        console.log('   Mensagem:', error.response.data.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
  }
}

// Executar o teste
testNewTokenRegistration();