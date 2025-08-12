const axios = require('axios');

const BASE_URL = 'http://localhost:8800/api';
let authToken = '';

async function testRestoreSimple() {
  console.log('🧪 Teste simples de restore...\n');

  try {
    // 1. Login
    console.log('🔐 1. Login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'ivan.alberton@navi.inf.br',
      password: 'N@vi@2025'
    });

    authToken = loginResponse.data.data.accessToken;
    console.log('✅ Login OK');

    // 2. Testar restore de uma notificação específica
    const notificationId = 'f7003512-8ab5-4e90-8e0c-99a7e5458070';
    console.log(`\n🔄 2. Testando restore da notificação ${notificationId}...`);
    
    const restoreResponse = await axios.put(
      `${BASE_URL}/notifications/${notificationId}/restore`,
      {},
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    console.log('📊 Status:', restoreResponse.status);
    console.log('📊 Resposta:', JSON.stringify(restoreResponse.data, null, 2));

    if (restoreResponse.data.success) {
      console.log('✅ RESTORE FUNCIONANDO!');
    } else {
      console.log('❌ RESTORE FALHOU!');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
    if (error.response) {
      console.error('📊 Status:', error.response.status);
      console.error('📊 Resposta:', error.response.data);
    }
  }
}

testRestoreSimple();

