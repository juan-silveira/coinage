const axios = require('axios');

const BASE_URL = 'http://localhost:8800/api';
let authToken = '';

async function testRestoreDebug() {
  console.log('🔍 Debug do restore...\n');

  try {
    // 1. Login
    console.log('🔐 1. Login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'ivan.alberton@navi.inf.br',
      password: 'N@vi@2025'
    });

    authToken = loginResponse.data.data.accessToken;
    console.log('✅ Login OK');

    // 2. Verificar notificações antes
    console.log('\n📋 2. Verificando notificações antes do restore...');
    const beforeResponse = await axios.get(`${BASE_URL}/notifications`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (beforeResponse.data.success) {
      const notifications = beforeResponse.data.data;
      const deletedNotifications = notifications.filter(n => !n.isActive);
      console.log(`📊 Total: ${notifications.length}, Excluídas: ${deletedNotifications.length}`);
      
      if (deletedNotifications.length > 0) {
        console.log('📝 Primeira excluída:', deletedNotifications[0].id, deletedNotifications[0].title);
      }
    }

    // 3. Testar restore
    const notificationId = 'f30ea290-f7bb-4feb-ad2a-390bf6a44bb1';
    console.log(`\n🔄 3. Testando restore da notificação ${notificationId}...`);
    
    try {
      const restoreResponse = await axios.put(
        `${BASE_URL}/notifications/${notificationId}/restore`,
        {},
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      console.log('✅ Restore OK');
      console.log('📊 Resposta:', JSON.stringify(restoreResponse.data, null, 2));
    } catch (restoreError) {
      console.log('❌ Erro no restore:', restoreError.message);
      if (restoreError.response) {
        console.log('📊 Status:', restoreError.response.status);
        console.log('📊 Resposta:', restoreError.response.data);
      }
    }

    // 4. Verificar notificações depois
    console.log('\n📋 4. Verificando notificações depois do restore...');
    const afterResponse = await axios.get(`${BASE_URL}/notifications`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (afterResponse.data.success) {
      const notifications = afterResponse.data.data;
      const deletedNotifications = notifications.filter(n => !n.isActive);
      console.log(`📊 Total: ${notifications.length}, Excluídas: ${deletedNotifications.length}`);
      
      const restoredNotification = notifications.find(n => n.id === notificationId);
      if (restoredNotification) {
        console.log('🔍 Notificação restaurada:', {
          id: restoredNotification.id,
          title: restoredNotification.title,
          isActive: restoredNotification.isActive
        });
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    if (error.response) {
      console.error('📊 Status:', error.response.status);
      console.error('📊 Resposta:', error.response.data);
    }
  }
}

testRestoreDebug();

