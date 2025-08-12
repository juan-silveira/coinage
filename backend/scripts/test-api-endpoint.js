const fetch = require('node-fetch');

async function testAPIEndpoint() {
  try {
    console.log('🌐 Testando endpoint específico da API...\n');

    const baseURL = 'http://localhost:8800';

    // 1. Testar health check
    console.log('1️⃣ Testando health check...');
    try {
      const healthResponse = await fetch(`${baseURL}/health`);
      console.log('✅ Health check:', healthResponse.status, healthResponse.statusText);
    } catch (error) {
      console.log('❌ Health check falhou:', error.message);
      return;
    }

    // 2. Testar endpoint de usuários (deve retornar 401 sem token)
    console.log('\n2️⃣ Testando endpoint de usuários...');
    try {
      const usersResponse = await fetch(`${baseURL}/api/users`);
      console.log('📊 Status da resposta usuários:', usersResponse.status);
      
      if (usersResponse.status === 401) {
        console.log('✅ Endpoint protegido funcionando (401 esperado)');
      } else {
        console.log('⚠️ Status inesperado:', usersResponse.status);
      }
    } catch (error) {
      console.log('❌ Erro no endpoint de usuários:', error.message);
    }

    // 3. Testar login com dados corretos
    console.log('\n3️⃣ Testando login...');
    try {
      const loginResponse = await fetch(`${baseURL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'ivan.alberton@navi.inf.br',
          password: 'N@vi@2025'
        })
      });

      console.log('📊 Status da resposta login:', loginResponse.status);
      console.log('📋 Headers da resposta:', Object.fromEntries(loginResponse.headers.entries()));

      const responseText = await loginResponse.text();
      console.log('📄 Corpo da resposta:', responseText);

      if (loginResponse.ok) {
        console.log('🎉 Login bem-sucedido!');
      } else {
        console.log('❌ Login falhou');
        
        // Se for 500, tentar ver os logs
        if (loginResponse.status === 500) {
          console.log('\n🔍 Verificando logs do backend...');
          const { execSync } = require('child_process');
          try {
            const logs = execSync('docker-compose logs api --tail=10', { encoding: 'utf8' });
            console.log('📋 Últimos logs:', logs);
          } catch (e) {
            console.log('❌ Não foi possível obter logs:', e.message);
          }
        }
      }

    } catch (error) {
      console.log('❌ Erro na requisição de login:', error.message);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  testAPIEndpoint()
    .catch(console.error);
}

module.exports = { testAPIEndpoint };
