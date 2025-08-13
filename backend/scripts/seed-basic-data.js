const { PrismaClient } = require('../src/generated/prisma');
const crypto = require('crypto');
const prisma = new PrismaClient();

async function seedBasicData() {
  try {
    console.log('🌱 Iniciando seed de dados básicos...');

    // Criar um cliente básico
    const client = await prisma.client.upsert({
      where: { alias: 'navi' },
      update: {},
      create: {
        name: 'Navi',
        alias: 'navi',
        isActive: true,
        rateLimit: {
          requestsPerMinute: 1000,
          requestsPerHour: 10000,
          requestsPerDay: 100000
        }
      }
    });

    console.log(`✅ Cliente criado/atualizado: ${client.name}`);

    // Criar usuário Ivan com dados do .env
    const password = 'N@vi@2025';
    const email = 'ivan.alberton@navi.inf.br';
    const hashedPassword = crypto.pbkdf2Sync(password, email, 10000, 64, 'sha512').toString('hex');
    
    const user = await prisma.user.upsert({
      where: { email: 'ivan.alberton@navi.inf.br' },
      update: {
        password: hashedPassword
      },
      create: {
        name: 'Ivan Alberton',
        email: 'ivan.alberton@navi.inf.br',
        cpf: '02308739959',
        phone: '46999716711',
        birthDate: new Date('1979-07-26'),
        publicKey: '0x5528C065931f523CA9F3a6e49a911896fb1D2e6f',
        privateKey: '0x2a09b1aaa664113fd7163a0a4aafbcb16f6b5a16ae9dacfe7c840be2455e3f61',
        password: hashedPassword,
        isFirstAccess: false,
        globalRole: 'SUPER_ADMIN',
        userPlan: 'PREMIUM',
        isActive: true
      }
    });

    console.log(`✅ Usuário criado/atualizado: ${user.email}`);

    // Criar relação user-client
    const userClient = await prisma.userClient.upsert({
      where: {
        userId_clientId: {
          userId: user.id,
          clientId: client.id
        }
      },
      update: {},
      create: {
        userId: user.id,
        clientId: client.id,
        status: 'active',
        clientRole: 'USER',
        linkedAt: new Date(),
        permissions: {},
        canViewPrivateKeys: false
      }
    });

    console.log(`✅ Relação usuário-cliente criada`);

    // Criar um usuário regular adicional para testes
    const regularPassword = 'Test@123';
    const regularEmail = 'teste@navi.inf.br';
    const regularHashedPassword = crypto.pbkdf2Sync(regularPassword, regularEmail, 10000, 64, 'sha512').toString('hex');
    
    const regularUser = await prisma.user.upsert({
      where: { email: 'teste@navi.inf.br' },
      update: {
        password: regularHashedPassword
      },
      create: {
        name: 'Usuário Teste',
        email: 'teste@navi.inf.br',
        cpf: '98765432100',
        phone: '11999999999',
        birthDate: new Date('1990-01-01'),
        publicKey: '0x1234567890123456789012345678901234567890',
        privateKey: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        password: regularHashedPassword,
        isFirstAccess: false,
        globalRole: 'USER',
        userPlan: 'BASIC',
        isActive: true
      }
    });

    // Criar relação user-client para o usuário regular
    const regularUserClient = await prisma.userClient.upsert({
      where: {
        userId_clientId: {
          userId: regularUser.id,
          clientId: client.id
        }
      },
      update: {},
      create: {
        userId: regularUser.id,
        clientId: client.id,
        status: 'active',
        clientRole: 'USER',
        linkedAt: new Date(),
        permissions: {},
        canViewPrivateKeys: false
      }
    });

    console.log(`✅ Usuário regular criado/atualizado: ${regularUser.email}`);
    console.log(`✅ Relação usuário regular-cliente criada`);

    console.log('\n📊 Dados básicos criados com sucesso!');
    console.log(`👤 Usuário Admin ID: ${user.id}`);
    console.log(`👤 Usuário Regular ID: ${regularUser.id}`);
    console.log(`🏢 Cliente ID: ${client.id}`);
    console.log('\n🔑 Credenciais de teste:');
    console.log(`   Admin: ivan.alberton@navi.inf.br / N@vi@2025`);
    console.log(`   Regular: teste@navi.inf.br / Test@123`);

  } catch (error) {
    console.error('❌ Erro durante o seed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o seed se o arquivo for chamado diretamente
if (require.main === module) {
  seedBasicData();
}

module.exports = { seedBasicData };