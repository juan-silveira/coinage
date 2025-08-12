const { PrismaClient } = require('../src/generated/prisma');
require('dotenv').config();

const prisma = new PrismaClient();

async function setupSimpleDatabase() {
  try {
    console.log('🚀 Resetando e configurando banco de dados...');

    // 1. Limpar banco
    console.log('🔄 Limpando banco de dados...');
    await prisma.userClient.deleteMany({});
    await prisma.clientBranding.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.client.deleteMany({});
    console.log('✅ Banco limpo');

    // 2. Criar cliente Coinage (padrão)
    console.log('🔄 Criando cliente Coinage...');
    const coinageClient = await prisma.client.create({
      data: {
        name: 'Coinage',
        alias: 'coinage',
        isActive: true,
        rateLimit: {
          requestsPerMinute: 100,
          requestsPerHour: 1000,
          requestsPerDay: 10000
        }
      }
    });
    console.log('✅ Cliente Coinage criado:', coinageClient.id);

    // 3. Criar cliente Pratique
    console.log('🔄 Criando cliente Pratique...');
    const pratiqueClient = await prisma.client.create({
      data: {
        name: 'Pratique',
        alias: 'pratique',
        isActive: true,
        rateLimit: {
          requestsPerMinute: 100,
          requestsPerHour: 1000,
          requestsPerDay: 10000
        }
      }
    });
    console.log('✅ Cliente Pratique criado:', pratiqueClient.id);

    // 4. Criar branding para Pratique
    console.log('🔄 Criando branding Pratique...');
    const branding = await prisma.clientBranding.create({
      data: {
        clientId: pratiqueClient.id,
        primaryColor: '#e41958',
        secondaryColor: '#98254f',
        accentColor: '#372c41',
        backgroundColor: '#ffffff',
        textColor: '#000000',
        logoUrl: '/assets/images/brands/pratique/logo.svg',
        logoUrlDark: '/assets/images/brands/pratique/logo-white.svg',
        loginTitle: 'Acesso Pratique',
        loginSubtitle: 'Sua plataforma de gestão financeira digital',
        welcomeMessage: 'Bem-vindo à Pratique',
        footerText: 'Copyright 2025, Pratique All Rights Reserved.',
        isActive: true
      }
    });
    console.log('✅ Branding Pratique criado:', branding.id);

    // 5. Criar usuário admin baseado no .env (SEM alterar sistema de senha)
    console.log('🔄 Criando usuário admin baseado no .env...');
    const defaultEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@coinage.com';
    const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123';
    const defaultName = process.env.DEFAULT_ADMIN_NAME || 'Admin Coinage';
    const defaultCpf = process.env.DEFAULT_ADMIN_CPF || '00000000000';
    const defaultPublicKey = process.env.DEFAULT_ADMIN_PUBLIC_KEY || '0x1234567890abcdef';
    const defaultPrivateKey = process.env.DEFAULT_ADMIN_PRIVATE_KEY || '0xabcdef1234567890';

    // Usar o UserService existente para manter o sistema de senha inalterado
    const UserService = require('../src/services/user.service');
    const userService = new UserService();
    await userService.init();

    const adminUser = await userService.createUser({
      name: defaultName,
      email: defaultEmail,
      cpf: defaultCpf,
      publicKey: defaultPublicKey,
      privateKey: defaultPrivateKey,
      password: defaultPassword,
      globalRole: 'SUPER_ADMIN'
    });
    console.log('✅ Usuário admin criado:', adminUser.id);

    // 6. Vincular admin aos dois clientes
    console.log('🔄 Vinculando admin aos clientes...');
    
    await prisma.userClient.create({
      data: {
        userId: adminUser.id,
        clientId: coinageClient.id,
        status: 'active',
        clientRole: 'SUPER_ADMIN',
        linkedAt: new Date(),
        approvedBy: adminUser.id,
        approvedAt: new Date(),
        canViewPrivateKeys: true
      }
    });

    await prisma.userClient.create({
      data: {
        userId: adminUser.id,
        clientId: pratiqueClient.id,
        status: 'active',
        clientRole: 'SUPER_ADMIN',
        linkedAt: new Date(),
        approvedBy: adminUser.id,
        approvedAt: new Date(),
        canViewPrivateKeys: true
      }
    });

    console.log('✅ Admin vinculado aos dois clientes');

    console.log('\n🎉 Banco de dados configurado com sucesso!');
    
    console.log('\n📋 Resumo:');
    console.log('==========================================');
    console.log('📁 2 Clients criados:');
    console.log(`   - Coinage (alias: coinage) - ID: ${coinageClient.id}`);
    console.log(`   - Pratique (alias: pratique) - ID: ${pratiqueClient.id}`);
    console.log('\n👤 1 User admin:');
    console.log(`   - Nome: ${adminUser.name}`);
    console.log(`   - Email: ${adminUser.email}`);
    console.log(`   - Role: ${adminUser.globalRole}`);
    console.log('\n🔗 Testes da API:');
    console.log('   - http://localhost:8800/api/whitelabel/client-branding/coinage');
    console.log('   - http://localhost:8800/api/whitelabel/client-branding/pratique');

  } catch (error) {
    console.error('❌ Erro ao configurar banco:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
if (require.main === module) {
  setupSimpleDatabase()
    .catch(console.error);
}

module.exports = { setupSimpleDatabase };