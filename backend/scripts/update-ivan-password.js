const { PrismaClient } = require('../src/generated/prisma');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function updateIvanPassword() {
  try {
    console.log('🔧 Atualizando senha do usuário Ivan...');

    // Buscar usuário Ivan
    const ivanUser = await prisma.user.findUnique({
      where: { email: 'ivan.alberton@navi.inf.br' }
    });

    if (!ivanUser) {
      console.error('❌ Usuário Ivan não encontrado');
      return;
    }

    console.log('✅ Usuário Ivan encontrado');

    // Nova senha
    const newPassword = 'N@vi@2025%';
    const salt = 'ivan.alberton@navi.inf.br';
    const hashedPassword = crypto.pbkdf2Sync(newPassword, salt, 10000, 64, 'sha512').toString('hex');

    console.log(`🔐 Nova senha: ${newPassword}`);
    console.log(`🔑 Hash gerado: ${hashedPassword.substring(0, 50)}...`);

    // Atualizar senha
    await prisma.user.update({
      where: { id: ivanUser.id },
      data: {
        password: hashedPassword
      }
    });

    console.log('✅ Senha atualizada com sucesso!');

    // Verificar se foi atualizada
    const updatedUser = await prisma.user.findUnique({
      where: { id: ivanUser.id }
    });

    console.log(`🔍 Senha no banco: ${updatedUser.password.substring(0, 50)}...`);
    console.log(`✅ Hash atualizado: ${updatedUser.password === hashedPassword ? 'SIM' : 'NÃO'}`);

  } catch (error) {
    console.error('❌ Erro ao atualizar senha:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
updateIvanPassword();

