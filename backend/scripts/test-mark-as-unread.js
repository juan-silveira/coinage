const axios = require('axios');

const API_BASE_URL = 'http://localhost:8800';

async function testMarkAsUnread() {
  try {
    console.log('🧪 Testando funcionalidade de marcar como não lidas...\n');

    // 1. Primeiro, fazer login para obter o token
    console.log('🔐 1. Fazendo login...');
    const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email: 'ivan.alberton@navi.inf.br',
      password: 'N@vi@2025'
    });

    if (loginResponse.data.success) {
      const { accessToken } = loginResponse.data.data;
      console.log('✅ Login realizado com sucesso');
      console.log('🔑 Token obtido:', accessToken.substring(0, 20) + '...');

      // 2. Buscar notificações para ver o estado atual
      console.log('\n📋 2. Buscando notificações...');
      const notificationsResponse = await axios.get(`${API_BASE_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (notificationsResponse.data.success) {
        const notifications = notificationsResponse.data.data;
        console.log(`✅ ${notifications.length} notificações encontradas`);
        
        // Mostrar status de cada notificação
        notifications.forEach((notification, index) => {
          console.log(`   ${index + 1}. ID: ${notification.id} | Lida: ${notification.isRead} | Título: ${notification.title}`);
        });

        // 3. Testar marcar uma notificação como não lida
        if (notifications.length > 0) {
          const notificationToTest = notifications.find(n => n.isRead) || notifications[0];
          console.log(`\n🔄 3. Testando marcar notificação ${notificationToTest.id} como não lida...`);
          
          try {
            const markUnreadResponse = await axios.put(
              `${API_BASE_URL}/api/notifications/${notificationToTest.id}/unread`,
              {},
              { headers: { Authorization: `Bearer ${accessToken}` } }
            );

            if (markUnreadResponse.data.success) {
              console.log('✅ Notificação marcada como não lida com sucesso');
              console.log('📊 Resposta:', markUnreadResponse.data);
            } else {
              console.log('❌ Falha ao marcar como não lida:', markUnreadResponse.data);
            }
          } catch (error) {
            console.log('❌ Erro ao marcar como não lida:', error.response?.data || error.message);
          }

          // 4. Verificar se a mudança foi aplicada
          console.log('\n🔍 4. Verificando mudança...');
          const checkResponse = await axios.get(`${API_BASE_URL}/api/notifications/${notificationToTest.id}`, {
            headers: { Authorization: `Bearer ${accessToken}` }
          });

          if (checkResponse.data.success) {
            const updatedNotification = checkResponse.data.data;
            console.log(`✅ Status atualizado: isRead = ${updatedNotification.isRead}`);
          }
        }

        // 5. Testar marcar todas como não lidas
        console.log('\n🔄 5. Testando marcar todas como não lidas...');
        try {
          const markAllUnreadResponse = await axios.put(
            `${API_BASE_URL}/api/notifications/mark-all-unread`,
            {},
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );

          if (markAllUnreadResponse.data.success) {
            console.log('✅ Todas as notificações marcadas como não lidas');
            console.log('📊 Resposta:', markAllUnreadResponse.data);
          } else {
            console.log('❌ Falha ao marcar todas como não lidas:', markAllUnreadResponse.data);
          }
        } catch (error) {
          console.log('❌ Erro ao marcar todas como não lidas:', error.response?.data || error.message);
        }

      } else {
        console.log('❌ Falha ao buscar notificações:', notificationsResponse.data);
      }

    } else {
      console.log('❌ Falha no login:', loginResponse.data);
    }

  } catch (error) {
    console.error('❌ Erro durante os testes:', error.message);
    if (error.response) {
      console.error('📊 Resposta do servidor:', error.response.data);
    }
  }
}

// Executar testes
testMarkAsUnread();

