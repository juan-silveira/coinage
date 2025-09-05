const axios = require('axios');

const API_URL = 'http://localhost:8800';
const TOKEN_ADDRESS = '0x0A8c73967e4Eee8ffA06484C3fBf65E6Ae3b9804'; // Endereço do token que você tentou registrar

async function testTokenRegistration() {
  try {
    console.log('🔍 Testando registro de token...\n');
    
    // Primeiro, fazer login para obter o token de autenticação
    console.log('1️⃣ Fazendo login...');
    const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
      email: 'ivan.alberton@navi.inf.br',
      password: 'N@vi@2025'
    }, {
      headers: {
        'User-Agent': 'TestScript/1.0'
      }
    });
    
    if (!loginResponse.data.success) {
      throw new Error('Falha no login: ' + loginResponse.data.message);
    }
    
    console.log('✅ Login realizado com sucesso!');
    console.log('📦 Dados completos:', Object.keys(loginResponse.data.data).join(', '));
    
    const authToken = loginResponse.data.data.accessToken || loginResponse.data.data.token || loginResponse.data.token;
    console.log('🔑 Token obtido:', authToken ? authToken.substring(0, 50) + '...' : 'NENHUM TOKEN ENCONTRADO');
    console.log('');
    
    // Configurar headers com o token de autenticação
    const headers = {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    };
    
    // Dados do token para registro
    const tokenData = {
      address: TOKEN_ADDRESS,
      network: 'testnet',
      adminAddress: '0x5528C065931f523CA9F3a6e49a911896fb1D2e6f', // Admin address do formulário
      website: 'https://coinage.trade',
      description: 'Real Brasileiro Digital da Coinage Trade'
    };
    
    console.log('2️⃣ Registrando token com os seguintes dados:');
    console.log(JSON.stringify(tokenData, null, 2), '\n');
    
    // Tentar registrar o token
    const registerResponse = await axios.post(
      `${API_URL}/api/tokens/register`,
      tokenData,
      { headers }
    );
    
    console.log('✅ Token registrado com sucesso!');
    console.log('Resposta:', JSON.stringify(registerResponse.data, null, 2));
    
  } catch (error) {
    console.error('❌ Erro ao registrar token:');
    
    if (error.response) {
      // O servidor respondeu com um código de status de erro
      console.error('Status:', error.response.status);
      console.error('Dados:', JSON.stringify(error.response.data, null, 2));
      
      // Se for erro 400, mostrar detalhes específicos
      if (error.response.status === 400) {
        console.log('\n⚠️ Erro 400 - Bad Request');
        console.log('Possíveis causas:');
        console.log('  1. Contract type "token" não existe no banco');
        console.log('  2. Token já está registrado');
        console.log('  3. Endereço inválido');
        console.log('  4. Dados faltantes');
        
        if (error.response.data.error) {
          console.log('\n📝 Mensagem de erro específica:');
          console.log('  ', error.response.data.error);
        }
      }
    } else if (error.request) {
      // A requisição foi feita mas não houve resposta
      console.error('Sem resposta do servidor. Verifique se o backend está rodando.');
    } else {
      // Algo aconteceu ao configurar a requisição
      console.error('Erro:', error.message);
    }
  }
}

// Executar o teste
testTokenRegistration();