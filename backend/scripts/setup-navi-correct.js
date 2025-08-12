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

async function setupNaviCorrect() {
  try {
    console.log('🚀 Configurando cliente Navi com dados corretos...');

    // 1. Criar cliente Navi
    console.log('\n🔄 Configurando cliente Navi...');
    
    let naviClient = await prisma.client.findUnique({
      where: { alias: 'navi' }
    });
    
    if (!naviClient) {
      naviClient = await prisma.client.create({
        data: {
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
      console.log('✅ Cliente Navi criado:', naviClient.id);
    } else {
      console.log('✅ Cliente Navi já existe:', naviClient.id);
    }

    // 2. Criar branding para Navi
    console.log('\n🔄 Configurando branding Navi...');
    
    const existingBranding = await prisma.clientBranding.findUnique({
      where: { clientId: naviClient.id }
    });
    
    if (!existingBranding) {
      const branding = await prisma.clientBranding.create({
        data: {
          clientId: naviClient.id,
          primaryColor: '#007bff',
          secondaryColor: '#6c757d',
          accentColor: '#28a745',
          backgroundColor: '#ffffff',
          textColor: '#000000',
          logoUrl: '/assets/images/brands/navi/logo.svg',
          logoUrlDark: '/assets/images/brands/navi/logo-white.svg',
          loginTitle: 'Acesso Navi',
          loginSubtitle: 'Sua plataforma de gestão financeira digital',
          welcomeMessage: 'Bem-vindo à Navi - sua plataforma de gestão financeira digital',
          footerText: 'Copyright 2025, Navi All Rights Reserved.',
          isActive: true
        }
      });
      console.log('✅ Branding Navi criado:', branding.id);
    } else {
      console.log('✅ Branding Navi já existe');
    }

    // 3. Verificar se o usuário Ivan existe
    console.log('\n🔄 Verificando usuário Ivan...');
    
    let ivanUser = await prisma.user.findUnique({
      where: { email: 'ivan.alberton@navi.inf.br' }
    });
    
    if (!ivanUser) {
      // Usar dados do .env
      const email = process.env.DEFAULT_ADMIN_EMAIL;
      const password = process.env.DEFAULT_ADMIN_PASSWORD;
      const name = process.env.DEFAULT_ADMIN_NAME;
      const cpf = process.env.DEFAULT_ADMIN_CPF;
      const phone = process.env.DEFAULT_ADMIN_PHONE;
      const birthDate = process.env.DEFAULT_ADMIN_BIRTH_DATE;
      const publicKey = process.env.DEFAULT_ADMIN_PUBLIC_KEY;
      const privateKey = process.env.DEFAULT_ADMIN_PRIVATE_KEY;
      
      // Hash da senha usando email como salt
      const hashedPassword = hashPassword(password, email);
      
      ivanUser = await prisma.user.create({
        data: {
          name: name,
          email: email,
          cpf: cpf,
          phone: phone,
          birthDate: new Date(birthDate),
          publicKey: publicKey,
          privateKey: privateKey,
          password: hashedPassword,
          globalRole: 'SUPER_ADMIN',
          isActive: true
        }
      });
      console.log('✅ Usuário Ivan criado:', ivanUser.id);
    } else {
      console.log('✅ Usuário Ivan já existe:', ivanUser.id);
      
      // Atualizar dados se necessário
      const email = process.env.DEFAULT_ADMIN_EMAIL;
      const password = process.env.DEFAULT_ADMIN_PASSWORD;
      const name = process.env.DEFAULT_ADMIN_NAME;
      const cpf = process.env.DEFAULT_ADMIN_CPF;
      const phone = process.env.DEFAULT_ADMIN_PHONE;
      const birthDate = process.env.DEFAULT_ADMIN_BIRTH_DATE;
      const publicKey = process.env.DEFAULT_ADMIN_PUBLIC_KEY;
      const privateKey = process.env.DEFAULT_ADMIN_PRIVATE_KEY;
      
      // Hash da senha usando email como salt
      const hashedPassword = hashPassword(password, email);
      
      await prisma.user.update({
        where: { id: ivanUser.id },
        data: {
          name: name,
          cpf: cpf,
          phone: phone,
          birthDate: new Date(birthDate),
          publicKey: publicKey,
          privateKey: privateKey,
          password: hashedPassword,
          passwordChangedAt: new Date()
        }
      });
      console.log('✅ Dados do usuário Ivan atualizados');
    }

    // 4. Vincular Ivan ao cliente Navi
    console.log('\n🔄 Vinculando Ivan ao cliente Navi...');
    
    const ivanNaviLink = await prisma.userClient.findUnique({
      where: {
        userId_clientId: {
          userId: ivanUser.id,
          clientId: naviClient.id
        }
      }
    });
    
    if (!ivanNaviLink) {
      await prisma.userClient.create({
        data: {
          userId: ivanUser.id,
          clientId: naviClient.id,
          status: 'active',
          clientRole: 'SUPER_ADMIN',
          linkedAt: new Date(),
          approvedBy: ivanUser.id,
          approvedAt: new Date(),
          canViewPrivateKeys: true
        }
      });
      console.log('✅ Ivan vinculado ao Navi');
    } else {
      console.log('✅ Ivan já vinculado ao Navi');
    }

    console.log('\n🎉 Cliente Navi configurado com sucesso!');
    
    // Mostrar informações finais
    console.log('\n📋 Resumo da Configuração:');
    console.log('==========================================');
    console.log('Cliente criado:');
    console.log(`- Navi (alias: navi) - ID: ${naviClient.id}`);
    console.log('\nUsuário Admin:');
    console.log(`- Nome: ${ivanUser.name}`);
    console.log(`- Email: ${ivanUser.email}`);
    console.log(`- CPF: ${ivanUser.cpf}`);
    console.log(`- Telefone: ${ivanUser.phone}`);
    console.log(`- Data de Nascimento: ${ivanUser.birthDate}`);
    console.log(`- Role Global: ${ivanUser.globalRole}`);
    console.log('\nTestes disponíveis:');
    console.log('- API Navi: http://localhost:8800/api/whitelabel/client-branding/navi');
    console.log('- Login Navi: http://localhost:3000/login/navi');
    console.log('- Register Navi: http://localhost:3000/register/navi');

  } catch (error) {
    console.error('❌ Erro ao configurar cliente Navi:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  setupNaviCorrect()
    .catch(console.error);
}

module.exports = { setupNaviCorrect };
