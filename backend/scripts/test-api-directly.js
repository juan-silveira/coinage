const fetch = require('node-fetch');

async function testAPIDirectly() {
  try {
    console.log('🌐 Testando API diretamente...\n');

    const baseURL = 'http://localhost:8800';
    const loginData = {
      email: 'ivan.alberton@navi.inf.br',
      password: 'N@vi@2025'
    };

    // 1. Testar health check
    console.log('1️⃣ Testando health check...');
    try {
      const healthResponse = await fetch(`${baseURL}/health`);
      console.log('✅ Health check:', healthResponse.status, healthResponse.statusText);
    } catch (error) {
      console.log('❌ Health check falhou:', error.message);
      return;
    }

    // 2. Testar login
    console.log('\n2️⃣ Testando login...');
    try {
      const loginResponse = await fetch(`${baseURL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(loginData)
      });

      console.log('📊 Status da resposta:', loginResponse.status);
      console.log('📋 Headers:', Object.fromEntries(loginResponse.headers.entries()));

      const responseText = await loginResponse.text();
      console.log('📄 Resposta completa:', responseText);

      if (loginResponse.ok) {
        console.log('🎉 Login bem-sucedido!');
        try {
          const responseData = JSON.parse(responseText);
          console.log('📊 Dados da resposta:', JSON.stringify(responseData, null, 2));
        } catch (e) {
          console.log('⚠️ Resposta não é JSON válido');
        }
      } else {
        console.log('❌ Login falhou');
      }

    } catch (error) {
      console.log('❌ Erro na requisição de login:', error.message);
    }

    // 3. Testar endpoint de usuários
    console.log('\n3️⃣ Testando endpoint de usuários...');
    try {
      const usersResponse = await fetch(`${baseURL}/api/users`);
      console.log('📊 Status da resposta usuários:', usersResponse.status);
      
      if (usersResponse.ok) {
        const usersText = await usersResponse.text();
        console.log('📄 Resposta usuários:', usersText.substring(0, 200) + '...');
      }
    } catch (error) {
      console.log('❌ Erro no endpoint de usuários:', error.message);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  testAPIDirectly()
    .catch(console.error);
}

module.exports = { testAPIDirectly };
