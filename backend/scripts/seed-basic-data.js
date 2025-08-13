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
        role: 'SUPER_ADMIN',
        linkedAt: new Date(),
        approvedAt: new Date(),
        permissions: {}
      }
    });

    console.log(`✅ Relação user-client criada/atualizada: ${user.email} -> ${client.name}`);

    // Criar segundo usuário para teste
    const password2 = 'Test@2025';
    const email2 = 'test@navi.inf.br';
    const hashedPassword2 = crypto.pbkdf2Sync(password2, email2, 10000, 64, 'sha512').toString('hex');
    
    const user2 = await prisma.user.upsert({
      where: { email: 'test@navi.inf.br' },
      update: {
        password: hashedPassword2
      },
      create: {
        name: 'Usuário Teste',
        email: 'test@navi.inf.br',
        cpf: '12345678901',
        phone: '11999999999',
        birthDate: new Date('1990-01-01'),
        publicKey: '0x1234567890123456789012345678901234567890',
        privateKey: '0x1234567890123456789012345678901234567890123456789012345678901234',
        password: hashedPassword2,
        isFirstAccess: false,
        userPlan: 'BASIC',
        isActive: true
      }
    });

    console.log(`✅ Segundo usuário criado/atualizado: ${user2.email}`);

    // Criar relação user-client para o segundo usuário
    const userClient2 = await prisma.userClient.upsert({
      where: {
        userId_clientId: {
          userId: user2.id,
          clientId: client.id
        }
      },
      update: {},
      create: {
        userId: user2.id,
        clientId: client.id,
        status: 'active',
        role: 'USER',
        linkedAt: new Date(),
        approvedAt: new Date(),
        permissions: {}
      }
    });

    console.log(`✅ Relação user-client criada/atualizada: ${user2.email} -> ${client.name}`);

    console.log('✅ Seed concluído com sucesso!');
    console.log('\n👤 Credenciais de acesso:');
    console.log(`   Email: ${email}`);
    console.log(`   Senha: ${password}`);
    console.log(`   Role: SUPER_ADMIN no cliente ${client.name}`);
    console.log('\n👤 Segundo usuário:');
    console.log(`   Email: ${email2}`);
    console.log(`   Senha: ${password2}`);
    console.log(`   Role: USER no cliente ${client.name}`);

  } catch (error) {
    console.error('❌ Erro durante o seed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedBasicData();