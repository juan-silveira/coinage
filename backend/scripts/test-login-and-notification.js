const axios = require('axios');

const API_BASE_URL = 'http://localhost:8800';

async function testLoginAndNotification() {
  try {
    console.log('🧪 Testando login e rota individual de notificação...\n');

    // 1. Fazer login
    console.log('🔐 1. Fazendo login...');
    const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email: 'ivan.alberton@navi.inf.br',
      password: 'N@vi@2025%'
    });

    if (loginResponse.data.success) {
      const { accessToken } = loginResponse.data.data;
      console.log('✅ Login realizado com sucesso');
      console.log(`   Token: ${accessToken.substring(0, 50)}...`);

      // 2. Buscar notificações
      console.log('\n📋 2. Buscando notificações...');
      const notificationsResponse = await axios.get(`${API_BASE_URL}/api/notifications`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (notificationsResponse.data.success) {
        const notifications = notificationsResponse.data.data;
        console.log(`✅ ${notifications.length} notificações encontradas`);

        if (notifications.length > 0) {
          const firstNotification = notifications[0];
          console.log(`   Primeira notificação: ${firstNotification.title}`);
          console.log(`   ID: ${firstNotification.id}`);

          // 3. Testar rota individual
          console.log('\n🔍 3. Testando rota individual...');
          const individualResponse = await axios.get(`${API_BASE_URL}/api/notifications/${firstNotification.id}`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          });

          if (individualResponse.data.success) {
            console.log('✅ Rota individual funcionando!');
            console.log(`   Título: ${individualResponse.data.data.title}`);
            console.log(`   Mensagem: ${individualResponse.data.data.message.substring(0, 100)}...`);
          } else {
            console.log('❌ Erro na rota individual:', individualResponse.data);
          }

          // 4. Testar marcar como favorita
          console.log('\n⭐ 4. Testando marcar como favorita...');
          const favoriteResponse = await axios.put(`${API_BASE_URL}/api/notifications/${firstNotification.id}/favorite`, {}, {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          });

          if (favoriteResponse.data.success) {
            console.log('✅ Favorita marcada com sucesso!');
            console.log(`   É favorita: ${favoriteResponse.data.data.isFavorite}`);
          } else {
            console.log('❌ Erro ao marcar como favorita:', favoriteResponse.data);
          }

          // 5. Testar marcar como não lida
          console.log('\n🙈 5. Testando marcar como não lida...');
          const unreadResponse = await axios.put(`${API_BASE_URL}/api/notifications/${firstNotification.id}/unread`, {}, {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          });

          if (unreadResponse.data.success) {
            console.log('✅ Marcada como não lida com sucesso!');
            console.log(`   É lida: ${unreadResponse.data.data.isRead}`);
          } else {
            console.log('❌ Erro ao marcar como não lida:', unreadResponse.data);
          }

        } else {
          console.log('❌ Nenhuma notificação para testar');
        }
      } else {
        console.log('❌ Erro ao buscar notificações:', notificationsResponse.data);
      }

    } else {
      console.log('❌ Erro no login:', loginResponse.data);
    }

  } catch (error) {
    console.error('❌ Erro durante os testes:', error.response?.data || error.message);
  }
}

// Executar testes
testLoginAndNotification();

