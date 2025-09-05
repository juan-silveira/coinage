const axios = require('axios');

const API_URL = 'http://localhost:8800';

async function testStakeAmount() {
  try {
    console.log('🎯 Testando se o valor do stake é registrado corretamente...\n');
    
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
    
    // Dados do stake de teste - usar um contrato existente
    const stakeData = {
      user: '0x5528C065931f523CA9F3a6e49a911896fb1D2e6f', 
      amount: '100.5', // Valor de teste específico
      customTimestamp: 0
    };
    
    console.log('2️⃣ Fazendo stake de teste:');
    console.log('   Usuário:', stakeData.user);
    console.log('   Valor:', stakeData.amount);
    console.log('   Contrato:', 'Pedacinho Piatique Teste (se existir)\n');
    
    // Primeiro, listar contratos de stake disponíveis
    try {
      const stakesListResponse = await axios.get(`${API_URL}/api/stake-contracts`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      if (stakesListResponse.data.success && stakesListResponse.data.data?.length > 0) {
        const firstStake = stakesListResponse.data.data[0];
        console.log('📋 Usando contrato de stake existente:');
        console.log('   Nome:', firstStake.name);
        console.log('   Endereço:', firstStake.address);
        console.log('   Status:', firstStake.status, '\n');
        
        // Fazer o stake
        const stakeResponse = await axios.post(
          `${API_URL}/api/stakes/${firstStake.address}/invest`,
          stakeData,
          {
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (stakeResponse.data.success) {
          console.log('✅ Stake realizado com sucesso!');
          console.log('📦 Resposta:', JSON.stringify(stakeResponse.data, null, 2));
          
          // Verificar se há informações sobre o valor na resposta
          if (stakeResponse.data.data?.amount) {
            console.log('\n💰 Valor registrado:', stakeResponse.data.data.amount);
          } else {
            console.log('\n⚠️ Valor não encontrado na resposta - verificar no banco de dados');
          }
        } else {
          console.log('❌ Erro no stake:', stakeResponse.data.message);
        }
      } else {
        console.log('⚠️ Nenhum contrato de stake encontrado');
        console.log('   Para testar, registre um contrato de stake primeiro');
      }
    } catch (error) {
      console.error('❌ Erro:', error.response?.data || error.message);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.response?.data || error.message);
  }
}

// Executar o teste
testStakeAmount();