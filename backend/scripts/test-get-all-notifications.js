const axios = require('axios');

const BASE_URL = 'http://localhost:8800/api';
let authToken = '';

async function testGetAllNotifications() {
  console.log('🔍 Testando getAllNotifications...\n');

  try {
    // 1. Login
    console.log('🔐 1. Login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'ivan.alberton@navi.inf.br',
      password: 'N@vi@2025'
    });

    authToken = loginResponse.data.data.accessToken;
    console.log('✅ Login OK');

    // 2. Testar rota /notifications
    console.log('\n📋 2. Testando rota /notifications...');
    const notificationsResponse = await axios.get(`${BASE_URL}/notifications`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (notificationsResponse.data.success) {
      const notifications = notificationsResponse.data.data;
      const activeNotifications = notifications.filter(n => n.isActive);
      const deletedNotifications = notifications.filter(n => !n.isActive);
      
      console.log(`📊 Total retornado: ${notifications.length}`);
      console.log(`✅ Ativas: ${activeNotifications.length}`);
      console.log(`🗑️  Excluídas: ${deletedNotifications.length}`);
      
      if (deletedNotifications.length > 0) {
        console.log('\n📝 Notificações excluídas retornadas:');
        deletedNotifications.forEach((n, i) => {
          console.log(`   ${i + 1}. ID: ${n.id} | Título: ${n.title} | isActive: ${n.isActive}`);
        });
      } else {
        console.log('\n❌ Nenhuma notificação excluída foi retornada pela API');
      }
    } else {
      console.log('❌ Falha na API');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
    if (error.response) {
      console.error('📊 Status:', error.response.status);
      console.error('📊 Resposta:', error.response.data);
    }
  }
}

testGetAllNotifications();

