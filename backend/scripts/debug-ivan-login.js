const { PrismaClient } = require('../src/generated/prisma');
const crypto = require('crypto');
require('dotenv').config();

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://coinage_user:coinage_password@localhost:5433/coinage_db?sslmode=disable'
    }
  }
});

// Função de hash de senha (mesma do UserService - usando email como salt)
function hashPassword(password, email) {
  return crypto.pbkdf2Sync(password, email, 10000, 64, 'sha512').toString('hex');
}

async function debugIvanLogin() {
  try {
    console.log('🔍 Debugando login do usuário Ivan...');

    // 1. Buscar usuário Ivan
    const ivanUser = await prisma.user.findUnique({
      where: { email: 'ivan.alberton@navi.inf.br' }
    });

    if (!ivanUser) {
      console.log('❌ Usuário Ivan não encontrado');
      return;
    }

    console.log('✅ Usuário Ivan encontrado:');
    console.log(`   ID: ${ivanUser.id}`);
    console.log(`   Nome: ${ivanUser.name}`);
    console.log(`   Email: ${ivanUser.email}`);
    console.log(`   CPF: ${ivanUser.cpf}`);
    console.log(`   Role: ${ivanUser.globalRole}`);
    console.log(`   Ativo: ${ivanUser.isActive}`);
    console.log(`   Senha atual (hash): ${ivanUser.password.substring(0, 20)}...`);

    // 2. Testar hash da senha
    const testPassword = 'N@vi@2025';
    const email = ivanUser.email;
    
    console.log('\n🧪 Testando hash da senha...');
    console.log(`   Senha de teste: ${testPassword}`);
    console.log(`   Email (salt): ${email}`);
    
    const testHash = hashPassword(testPassword, email);
    console.log(`   Hash gerado: ${testHash.substring(0, 20)}...`);
    console.log(`   Hash armazenado: ${ivanUser.password.substring(0, 20)}...`);
    
    if (testHash === ivanUser.password) {
      console.log('✅ Hash da senha está correto!');
    } else {
      console.log('❌ Hash da senha está incorreto!');
      
      // 3. Corrigir a senha
      console.log('\n🔧 Corrigindo senha...');
      
      await prisma.user.update({
        where: { id: ivanUser.id },
        data: {
          password: testHash,
          passwordChangedAt: new Date()
        }
      });
      
      console.log('✅ Senha corrigida!');
      
      // 4. Verificar novamente
      const updatedUser = await prisma.user.findUnique({
        where: { id: ivanUser.id }
      });
      
      const newTestHash = hashPassword(testPassword, email);
      if (newTestHash === updatedUser.password) {
        console.log('✅ Hash da senha corrigida está correto!');
      } else {
        console.log('❌ Ainda há problema com o hash!');
      }
    }

    // 5. Testar com a API
    console.log('\n🌐 Testando com a API...');
    const testResponse = await fetch('http://localhost:8800/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'ivan.alberton@navi.inf.br',
        password: 'N@vi@2025'
      })
    });

    if (testResponse.ok) {
      const responseData = await testResponse.json();
      console.log('✅ Login bem-sucedido!', responseData);
    } else {
      const errorData = await testResponse.json();
      console.log('❌ Login falhou:', errorData);
    }

  } catch (error) {
    console.error('❌ Erro ao debugar login:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  debugIvanLogin()
    .catch(console.error);
}

module.exports = { debugIvanLogin };
