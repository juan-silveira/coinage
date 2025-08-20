const axios = require('axios');

const API_BASE = 'http://localhost:8800/api';
const API_KEY = process.env.API_KEY || 'test-api-key';

const testData = {
  userId: '550e8400-e29b-41d4-a716-446655440000', // UUID de exemplo
  amount: 100.00,
  pixKey: 'test@example.com',
  userEmail: 'test@example.com'
};

async function testWithdrawFlow() {
  console.log('🧪 Testando fluxo de saque...\n');

  try {
    // 1. Testar cálculo de taxa
    console.log('1. Testando cálculo de taxa...');
    const feeResponse = await axios.post(`${API_BASE}/withdrawals/calculate-fee`, {
      amount: testData.amount
    }, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Taxa calculada:', feeResponse.data);
    console.log('');

    // 2. Testar validação de chave PIX
    console.log('2. Testando validação de chave PIX...');
    const pixValidationResponse = await axios.post(`${API_BASE}/withdrawals/validate-pix`, {
      pixKey: testData.pixKey
    }, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Validação PIX:', pixValidationResponse.data);
    console.log('');

    // 3. Testar criação de saque (vai falhar se usuário não existir ou não tiver saldo)
    console.log('3. Testando criação de saque...');
    try {
      const withdrawResponse = await axios.post(`${API_BASE}/withdrawals`, {
        userId: testData.userId,
        amount: testData.amount,
        pixKey: testData.pixKey
      }, {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Saque criado:', withdrawResponse.data);
      
      const withdrawalId = withdrawResponse.data.data.withdrawalId;
      
      // 4. Testar consulta de status
      console.log('4. Testando consulta de status...');
      const statusResponse = await axios.get(`${API_BASE}/withdrawals/status/${withdrawalId}`, {
        headers: {
          'Authorization': `Bearer ${API_KEY}`
        }
      });
      
      console.log('✅ Status do saque:', statusResponse.data);
      console.log('');
      
    } catch (withdrawError) {
      console.log('⚠️ Erro esperado ao criar saque (usuário pode não existir):', withdrawError.response?.data?.message || withdrawError.message);
      console.log('');
    }

    // 5. Testar listagem de saques (vai retornar vazio se usuário não existir)
    console.log('5. Testando listagem de saques...');
    try {
      const listResponse = await axios.get(`${API_BASE}/withdrawals/user/${testData.userId}`, {
        headers: {
          'Authorization': `Bearer ${API_KEY}`
        }
      });
      
      console.log('✅ Lista de saques:', listResponse.data);
      
    } catch (listError) {
      console.log('⚠️ Erro ao listar saques:', listError.response?.data?.message || listError.message);
    }

    console.log('\n✅ Teste do fluxo de saque concluído!');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.response?.data || error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Dica: Verifique se o servidor está rodando em http://localhost:8800');
    }
  }
}

// Executar teste
testWithdrawFlow().catch(console.error);