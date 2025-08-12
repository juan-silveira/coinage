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

// Função de hash de senha (mesma do UserService)
function hashPassword(password, email) {
  return crypto.pbkdf2Sync(password, email, 10000, 64, 'sha512').toString('hex');
}

async function simpleLoginTest() {
  try {
    console.log('🧪 Teste simples de login do usuário Ivan...\n');

    const email = 'ivan.alberton@navi.inf.br';
    const password = 'N@vi@2025';

    // 1. Verificar se o usuário existe
    console.log('1️⃣ Verificando se o usuário existe...');
    const user = await prisma.user.findUnique({
      where: { email: email }
    });

    if (!user) {
      console.log('❌ Usuário não encontrado');
      return;
    }

    console.log('✅ Usuário encontrado:', user.id);
    console.log('📧 Email:', user.email);
    console.log('🔑 Hash da senha:', user.password.substring(0, 20) + '...');

    // 2. Verificar se a senha está correta
    console.log('\n2️⃣ Verificando senha...');
    const expectedHash = hashPassword(password, email);
    const isPasswordCorrect = user.password === expectedHash;

    console.log('🔐 Hash esperado:', expectedHash.substring(0, 20) + '...');
    console.log('🔐 Hash atual:', user.password.substring(0, 20) + '...');
    console.log('✅ Senha correta:', isPasswordCorrect);

    if (!isPasswordCorrect) {
      console.log('\n🔄 Corrigindo senha...');
      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: expectedHash,
          passwordChangedAt: new Date()
        }
      });
      console.log('✅ Senha corrigida!');
    }

    // 3. Testar autenticação simples
    console.log('\n3️⃣ Testando autenticação...');
    const testUser = await prisma.user.findUnique({
      where: { 
        email: email,
        isActive: true
      }
    });

    if (testUser) {
      console.log('✅ Usuário ativo encontrado');
      console.log('🔑 Hash da senha atualizada:', testUser.password.substring(0, 20) + '...');
      
      // Verificar se a senha funciona
      const testHash = hashPassword(password, email);
      if (testHash === testUser.password) {
        console.log('✅ Hash de teste válido!');
        console.log('🎉 Login deve funcionar agora!');
      } else {
        console.log('❌ Hash de teste inválido!');
      }
    } else {
      console.log('❌ Usuário não está ativo');
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  simpleLoginTest()
    .catch(console.error);
}

module.exports = { simpleLoginTest };
