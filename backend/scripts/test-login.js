const { PrismaClient } = require('../src/generated/prisma');
const crypto = require('crypto');
const prisma = new PrismaClient();

async function testLogin() {
  try {
    console.log('🧪 Testando login...');

    // Buscar usuário Ivan
    const user = await prisma.user.findUnique({
      where: { email: 'ivan.alberton@navi.inf.br' }
    });

    if (!user) {
      console.log('❌ Usuário Ivan não encontrado');
      return;
    }

    console.log('✅ Usuário encontrado:', {
      id: user.id,
      email: user.email,
      name: user.name,
      isActive: user.isActive,
      passwordLength: user.password?.length || 0
    });

    // Testar hash da senha
    const password = 'N@vi@2025';
    const email = 'ivan.alberton@navi.inf.br';
    const hashedPassword = crypto.pbkdf2Sync(password, email, 10000, 64, 'sha512').toString('hex');

    console.log('🔐 Testando hash da senha:');
    console.log('   Senha original:', password);
    console.log('   Hash gerado:', hashedPassword);
    console.log('   Hash no banco:', user.password);
    console.log('   Hashs são iguais?', hashedPassword === user.password);

    // Verificar se o usuário tem relação com cliente
    const userClient = await prisma.userClient.findFirst({
      where: {
        userId: user.id,
        status: 'active'
      },
      include: {
        client: true
      }
    });

    if (userClient) {
      console.log('✅ Relação user-client encontrada:', {
        clientName: userClient.client.name,
        role: userClient.role,
        status: userClient.status
      });
    } else {
      console.log('❌ Relação user-client não encontrada');
    }

    // Testar autenticação
    const userService = require('../src/services/user.service');
    const isAuthenticated = await userService.authenticate(email, password);
    
    if (isAuthenticated) {
      console.log('✅ Autenticação bem-sucedida!');
    } else {
      console.log('❌ Falha na autenticação');
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testLogin();
