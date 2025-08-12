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

async function setupCompleteSystem() {
  try {
    console.log('🚀 Configurando sistema completo...');

    // 1. Criar cliente Coinage (padrão)
    console.log('\n🔄 Configurando cliente padrão Coinage...');
    
    let coinageClient = await prisma.client.findUnique({
      where: { alias: 'coinage' }
    });
    
    if (!coinageClient) {
      coinageClient = await prisma.client.create({
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
    } else {
      console.log('✅ Cliente Coinage já existe:', coinageClient.id);
    }

    // 2. Criar cliente Pratique
    console.log('\n🔄 Configurando cliente Pratique...');
    
    let pratiqueClient = await prisma.client.findUnique({
      where: { alias: 'pratique' }
    });
    
    if (!pratiqueClient) {
      pratiqueClient = await prisma.client.create({
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
    } else {
      console.log('✅ Cliente Pratique já existe:', pratiqueClient.id);
    }

    // 3. Criar branding para Pratique
    console.log('\n🔄 Configurando branding Pratique...');
    
    const existingBranding = await prisma.clientBranding.findUnique({
      where: { clientId: pratiqueClient.id }
    });
    
    if (!existingBranding) {
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
          welcomeMessage: 'Bem-vindo à Pratique - sua plataforma de gestão financeira digital',
          footerText: 'Copyright 2025, Pratique All Rights Reserved.',
          isActive: true
        }
      });
      console.log('✅ Branding Pratique criado:', branding.id);
    } else {
      console.log('✅ Branding Pratique já existe');
    }

    // 4. Criar usuário admin padrão baseado no .env
    console.log('\n🔄 Configurando usuário admin padrão...');
    
    const defaultEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@coinage.com';
    const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123';
    const defaultName = process.env.DEFAULT_ADMIN_NAME || 'Admin Coinage';
    const defaultCpf = process.env.DEFAULT_ADMIN_CPF || '00000000000';
    const defaultPublicKey = process.env.DEFAULT_ADMIN_PUBLIC_KEY || '0x1234567890abcdef';
    const defaultPrivateKey = process.env.DEFAULT_ADMIN_PRIVATE_KEY || '0xabcdef1234567890';
    
    let adminUser = await prisma.user.findUnique({
      where: { email: defaultEmail }
    });
    
    if (!adminUser) {
      const hashedPassword = hashPassword(defaultPassword, defaultEmail);
      
      adminUser = await prisma.user.create({
        data: {
          name: defaultName,
          email: defaultEmail,
          cpf: defaultCpf,
          publicKey: defaultPublicKey,
          privateKey: defaultPrivateKey,
          password: hashedPassword,
          globalRole: 'SUPER_ADMIN',
          isFirstAccess: false,
          isActive: true
        }
      });
      console.log('✅ Usuário admin criado:', adminUser.id);
    } else {
      console.log('✅ Usuário admin já existe:', adminUser.id);
    }

    // 5. Vincular admin ao cliente Coinage
    console.log('\n🔄 Vinculando admin ao cliente Coinage...');
    
    const adminCoinageLink = await prisma.userClient.findUnique({
      where: {
        userId_clientId: {
          userId: adminUser.id,
          clientId: coinageClient.id
        }
      }
    });
    
    if (!adminCoinageLink) {
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
      console.log('✅ Admin vinculado ao Coinage');
    } else {
      console.log('✅ Admin já vinculado ao Coinage');
    }

    // 6. Vincular admin ao cliente Pratique
    console.log('\n🔄 Vinculando admin ao cliente Pratique...');
    
    const adminPratiqueLink = await prisma.userClient.findUnique({
      where: {
        userId_clientId: {
          userId: adminUser.id,
          clientId: pratiqueClient.id
        }
      }
    });
    
    if (!adminPratiqueLink) {
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
      console.log('✅ Admin vinculado ao Pratique');
    } else {
      console.log('✅ Admin já vinculado ao Pratique');
    }

    console.log('\n🎉 Sistema configurado com sucesso!');
    
    // Mostrar informações finais
    console.log('\n📋 Resumo da Configuração:');
    console.log('==========================================');
    console.log('Clientes criados:');
    console.log(`- Coinage (alias: coinage) - ID: ${coinageClient.id}`);
    console.log(`- Pratique (alias: pratique) - ID: ${pratiqueClient.id}`);
    console.log('\nUsuário Admin:');
    console.log(`- Nome: ${adminUser.name}`);
    console.log(`- Email: ${adminUser.email}`);
    console.log(`- Role Global: ${adminUser.globalRole}`);
    console.log('\nTestes disponíveis:');
    console.log('- API Coinage: http://localhost:8800/api/whitelabel/client-branding/coinage');
    console.log('- API Pratique: http://localhost:8800/api/whitelabel/client-branding/pratique');
    console.log('- Login Coinage: http://localhost:3000/login');
    console.log('- Login Pratique: http://localhost:3000/login/pratique');
    console.log('- Register Pratique: http://localhost:3000/register/pratique');

  } catch (error) {
    console.error('❌ Erro ao configurar sistema:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  setupCompleteSystem()
    .catch(console.error);
}

module.exports = { setupCompleteSystem };