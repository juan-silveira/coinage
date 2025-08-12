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

// Função de hash de senha (mesma do UserService)
function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

async function fixIvanPassword() {
  try {
    console.log('🔧 Corrigindo senha do usuário Ivan...');

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

    // Gerar nova senha com hash correto
    const newPassword = 'N@vi@2025';
    const salt = crypto.randomBytes(16).toString('hex');
    const hashedPassword = hashPassword(newPassword, salt);

    console.log('🔄 Atualizando senha...');
    
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
    console.log('🧂 Salt usado:', salt);
    console.log('🔐 Hash gerado:', hashedPassword.substring(0, 20) + '...');

    // Testar login
    console.log('\n🧪 Testando login...');
    const testHash = hashPassword(newPassword, salt);
    if (testHash === hashedPassword) {
      console.log('✅ Hash de teste válido!');
    } else {
      console.log('❌ Hash de teste inválido!');
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
  fixIvanPassword()
    .catch(console.error);
}

module.exports = { fixIvanPassword };
