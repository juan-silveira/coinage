const axios = require('axios');

const API_BASE_URL = 'http://localhost:8800';

async function testNotificationRoutes() {
  try {
    console.log('🧪 Testando rotas de notificação...\n');

    // 1. Testar rota de notificações (deve retornar 401 sem token)
    console.log('🔍 1. Testando rota /api/notifications (sem token)...');
    try {
      const response = await axios.get(`${API_BASE_URL}/api/notifications`);
      console.log('❌ Erro: deveria retornar 401, mas retornou:', response.status);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Rota protegida funcionando corretamente (401 Unauthorized)');
      } else {
        console.log('❌ Erro inesperado:', error.response?.status);
      }
    }

    // 2. Testar rota individual (deve retornar 401 sem token)
    console.log('\n🔍 2. Testando rota /api/notifications/123 (sem token)...');
    try {
      const response = await axios.get(`${API_BASE_URL}/api/notifications/123`);
      console.log('❌ Erro: deveria retornar 401, mas retornou:', response.status);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Rota individual protegida funcionando corretamente (401 Unauthorized)');
      } else {
        console.log('❌ Erro inesperado:', error.response?.status);
      }
    }

    // 3. Testar rota de favoritar (deve retornar 401 sem token)
    console.log('\n🔍 3. Testando rota /api/notifications/123/favorite (sem token)...');
    try {
      const response = await axios.put(`${API_BASE_URL}/api/notifications/123/favorite`);
      console.log('❌ Erro: deveria retornar 401, mas retornou:', response.status);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Rota de favoritar protegida funcionando corretamente (401 Unauthorized)');
      } else {
        console.log('❌ Erro inesperado:', error.response?.status);
      }
    }

    // 4. Testar rota de marcar como não lida (deve retornar 401 sem token)
    console.log('\n🔍 4. Testando rota /api/notifications/123/unread (sem token)...');
    try {
      const response = await axios.put(`${API_BASE_URL}/api/notifications/123/unread`);
      console.log('❌ Erro: deveria retornar 401, mas retornou:', response.status);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Rota de marcar como não lida protegida funcionando corretamente (401 Unauthorized)');
      } else {
        console.log('❌ Erro inesperado:', error.response?.status);
      }
    }

    // 5. Verificar se o servidor está rodando
    console.log('\n🔍 5. Verificando se o servidor está rodando...');
    try {
      const response = await axios.get(`${API_BASE_URL}/health`);
      console.log('✅ Servidor respondendo:', response.status);
    } catch (error) {
      console.log('❌ Servidor não está respondendo ou rota /health não existe');
    }

    console.log('\n🎉 Testes de rotas concluídos!');

  } catch (error) {
    console.error('❌ Erro durante os testes:', error.message);
  }
}

// Executar testes
testNotificationRoutes();

