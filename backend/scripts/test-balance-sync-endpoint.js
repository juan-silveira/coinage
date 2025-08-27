require('dotenv').config();

async function testBalanceSyncEndpoint() {
  try {
    console.log('🔍 Testando endpoint /api/balance-sync/fresh diretamente...');
    
    // Simular exatamente o que o frontend faz
    const balanceSyncController = require('../src/controllers/balanceSync.controller');
    
    // Simular req e res como o frontend faz
    const req = {
      query: {
        address: '0x5528C065931f523CA9F3a6e49a911896fb1D2e6f',
        network: 'testnet'
      },
      user: {
        id: '123e4567-e89b-12d3-a456-426614174000', // ID do usuário teste
        publicKey: '0x5528C065931f523CA9F3a6e49a911896fb1D2e6f'
      }
    };
    
    let responseData = null;
    const res = {
      json: (data) => {
        responseData = data;
        console.log('📋 Resposta do endpoint:');
        console.log(JSON.stringify(data, null, 2));
      },
      status: (code) => {
        console.log(`📊 Status HTTP: ${code}`);
        return res;
      }
    };
    
    console.log(`📍 Testando: ${req.query.address}`);
    console.log(`🌐 Network: ${req.query.network}`);
    
    await balanceSyncController.getFreshBalances(req, res);
    
    if (responseData && responseData.success) {
      console.log('\\n✅ Endpoint funcionando corretamente!');
      console.log(`💰 AZE-t: ${responseData.data.balancesTable?.['AZE-t'] || 'N/A'}`);
      console.log(`🪙 cBRL: ${responseData.data.balancesTable?.cBRL || 'N/A'}`);
      console.log(`🎯 STT: ${responseData.data.balancesTable?.STT || 'N/A'}`);
    } else {
      console.log('❌ Endpoint retornou erro:', responseData);
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar endpoint:', error.message);
    console.error('Stack:', error.stack);
  }
}

testBalanceSyncEndpoint();