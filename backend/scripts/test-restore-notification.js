const axios = require('axios');

const BASE_URL = 'http://localhost:8800/api';
let authToken = '';

async function testRestoreNotification() {
  console.log('🧪 Testando funcionalidade de restaurar notificações...\n');

  try {
    // 1. Fazer login
    console.log('🔐 1. Fazendo login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'ivan.alberton@navi.inf.br',
      password: 'N@vi@2025'
    });

    if (loginResponse.data.success) {
      authToken = loginResponse.data.data.accessToken;
      console.log('✅ Login realizado com sucesso');
      console.log('🔑 Token obtido:', authToken.substring(0, 20) + '...');
    } else {
      throw new Error('Falha no login');
    }

    // 2. Buscar notificações excluídas
    console.log('\n📋 2. Buscando notificações excluídas...');
    const notificationsResponse = await axios.get(`${BASE_URL}/notifications`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (notificationsResponse.data.success) {
      const notifications = notificationsResponse.data.data;
      const deletedNotifications = notifications.filter(n => !n.isActive);
      
      console.log(`✅ ${notifications.length} notificações encontradas`);
      console.log(`🗑️  ${deletedNotifications.length} notificações excluídas`);
      
      if (deletedNotifications.length === 0) {
        console.log('❌ Nenhuma notificação excluída para testar restore');
        return;
      }

      // Mostrar algumas notificações excluídas
      console.log('\n📝 Notificações excluídas:');
      deletedNotifications.slice(0, 3).forEach((notification, index) => {
        console.log(`   ${index + 1}. ID: ${notification.id} | Título: ${notification.title}`);
      });

      // 3. Testar restore da primeira notificação excluída
      const notificationToRestore = deletedNotifications[0];
      console.log(`\n🔄 3. Testando restaurar notificação ${notificationToRestore.id}...`);
      
      const restoreResponse = await axios.put(
        `${BASE_URL}/notifications/${notificationToRestore.id}/restore`,
        {},
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      if (restoreResponse.data.success) {
        console.log('✅ Notificação restaurada com sucesso');
        console.log('📊 Resposta:', JSON.stringify(restoreResponse.data, null, 2));
      } else {
        console.log('❌ Falha ao restaurar notificação');
        console.log('📊 Resposta:', JSON.stringify(restoreResponse.data, null, 2));
      }

      // 4. Verificar se a notificação foi restaurada
      console.log('\n🔍 4. Verificando se a notificação foi restaurada...');
      const checkResponse = await axios.get(`${BASE_URL}/notifications`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      if (checkResponse.data.success) {
        const updatedNotifications = checkResponse.data.data;
        const restoredNotification = updatedNotifications.find(n => n.id === notificationToRestore.id);
        
        if (restoredNotification && restoredNotification.isActive) {
          console.log('✅ Notificação restaurada com sucesso - isActive = true');
        } else {
          console.log('❌ Notificação não foi restaurada corretamente');
        }
      }

    } else {
      console.log('❌ Falha ao buscar notificações');
    }

  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
    if (error.response) {
      console.error('📊 Resposta do servidor:', error.response.data);
    }
  }
}

// Executar o teste
testRestoreNotification();

