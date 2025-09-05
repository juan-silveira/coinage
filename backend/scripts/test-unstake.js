const axios = require('axios');

const API_URL = 'http://localhost:8800';

async function testUnstake() {
  try {
    console.log('🔄 Testando unstake...\n');
    
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
    
    // Pegar o contrato de stake
    const stakesListResponse = await axios.get(`${API_URL}/api/stake-contracts`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (!stakesListResponse.data.success || !stakesListResponse.data.data?.length) {
      console.log('❌ Nenhum contrato de stake encontrado');
      return;
    }
    
    const stakeContract = stakesListResponse.data.data[0];
    console.log('📋 Usando contrato de stake:');
    console.log('   Nome:', stakeContract.name);
    console.log('   Endereço:', stakeContract.address);
    
    // Dados do unstake - testando diferentes formatos
    const testCases = [
      {
        name: 'Formato ETH (como stake)',
        data: {
          user: '0x5528C065931f523CA9F3a6e49a911896fb1D2e6f',
          amount: '15'  // Formato em ETH
        }
      },
      {
        name: 'Formato Wei (como UnstakeModal atual)',
        data: {
          user: '0x5528C065931f523CA9F3a6e49a911896fb1D2e6f',
          amount: '15000000000000000000'  // 15 ETH em Wei
        }
      }
    ];
    
    for (const testCase of testCases) {
      console.log(`\n2️⃣ Testando ${testCase.name}:`);
      console.log('   Dados:', JSON.stringify(testCase.data, null, 2));
      
      try {
        const response = await axios.post(
          `${API_URL}/api/stakes/${stakeContract.address}/withdraw`,
          testCase.data,
          {
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (response.data.success) {
          console.log('   ✅ SUCESSO!');
          console.log('   📦 Hash:', response.data.data?.transactionHash);
          break; // Se funcionou, parar aqui
        } else {
          console.log('   ❌ Falhou:', response.data.message);
        }
      } catch (error) {
        console.log('   ❌ Erro:', error.response?.status, error.response?.data?.message || error.message);
        if (error.response?.data?.error) {
          console.log('   📝 Detalhes:', error.response.data.error);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.response?.data || error.message);
  }
}

// Executar o teste
testUnstake();