const { PrismaClient } = require('../src/generated/prisma');
const crypto = require('crypto');
require('dotenv').config();

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:postgres123@localhost:5433/coinage_db'
    }
  }
});

// Função de hash de senha (mesma do UserService - usando email como salt)
function hashPassword(password, email) {
  return crypto.pbkdf2Sync(password, email, 10000, 64, 'sha512').toString('hex');
}

async function fixIvanPasswordEmailSalt() {
  try {
    console.log('🔧 Corrigindo senha do usuário Ivan (usando email como salt)...');

    // Buscar usuário Ivan
    const ivanUser = await prisma.user.findUnique({
      where: { email: 'ivan.alberton@navi.inf.br' }
    });

    if (!ivanUser) {
      console.log('❌ Usuário Ivan não encontrado');
      return;
    }

    console.log('✅ Usuário Ivan encontrado:', ivanUser.id);
    console.log('📧 Email:', ivanUser.email);
    console.log('🔑 Senha atual (hash):', ivanUser.password.substring(0, 20) + '...');

    // Gerar nova senha com hash correto (usando email como salt)
    const newPassword = 'N@vi@2025';
    const email = ivanUser.email;
    const hashedPassword = hashPassword(newPassword, email);

    console.log('🔄 Atualizando senha...');
    console.log('🧂 Salt usado (email):', email);
    
    // Atualizar senha
    await prisma.user.update({
      where: { id: ivanUser.id },
      data: {
        password: hashedPassword,
        passwordChangedAt: new Date()
      }
    });

    console.log('✅ Senha atualizada com sucesso!');
    console.log('🔑 Nova senha:', newPassword);
    console.log('🔐 Hash gerado:', hashedPassword.substring(0, 20) + '...');

    // Testar login
    console.log('\n🧪 Testando login...');
    const testHash = hashPassword(newPassword, email);
    if (testHash === hashedPassword) {
      console.log('✅ Hash de teste válido!');
    } else {
      console.log('❌ Hash de teste inválido!');
    }

    // Testar com a API
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
    console.error('❌ Erro ao corrigir senha:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  fixIvanPasswordEmailSalt()
    .catch(console.error);
}

module.exports = { fixIvanPasswordEmailSalt };
