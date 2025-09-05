const axios = require('axios');

async function testStakeRegistration() {
  try {
    console.log('🧪 Testando registro de stake contract...');
    
    const data = {
      address: "0xe21fc42e8c8758f6d999328228721F7952e5988d",
      tokenAddress: "0x0b5F5510160E27E6BFDe03914a18d555B590DAF5", 
      network: "testnet",
      name: "Pedacinho Pratique Teste",
      description: "Teste de Stake de PCN",
      adminAddress: "0x5528C065931f523CA9F3a6e49a911896fb1D2e6f"
    };

    console.log('📤 Enviando dados:', data);
    
    // Teste sem token primeiro (deveria funcionar com authenticateHybrid)
    const response = await axios.post('http://localhost:8800/api/stake-contracts', data, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.data.success) {
      console.log('✅ Stake contract registrado com sucesso!');
      console.log('📋 Dados retornados:', response.data.data);
    } else {
      console.log('❌ Falha no registro:', response.data.message);
    }

  } catch (error) {
    console.error('❌ Erro ao testar registro:', error.response?.data || error.message);
  }
}

testStakeRegistration();