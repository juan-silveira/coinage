const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function createPratiqueClient() {
  try {
    console.log('🔄 Criando cliente Pratique...');

    // Verificar se já existe
    const existingClient = await prisma.client.findUnique({
      where: { alias: 'pratique' }
    });

    if (existingClient) {
      console.log('⚠️ Cliente Pratique já existe');
      console.log('✅ ID:', existingClient.id);
      console.log('✅ Nome:', existingClient.name);
      console.log('✅ Alias:', existingClient.alias);
      
      // Verificar se já tem branding
      const branding = await prisma.clientBranding.findUnique({
        where: { clientId: existingClient.id }
      });
      
      if (branding) {
        console.log('✅ Branding já configurado');
        return;
      }
      
      // Criar branding
      await prisma.clientBranding.create({
        data: {
          clientId: existingClient.id,
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
      
      console.log('✅ Branding criado para cliente existente');
      return;
    }

    // Criar cliente
    const client = await prisma.client.create({
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

    console.log('✅ Cliente criado:', client.id);

    // Criar branding
    const branding = await prisma.clientBranding.create({
      data: {
        clientId: client.id,
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

    console.log('✅ Branding criado:', branding.id);
    console.log('🎉 Cliente Pratique configurado com sucesso!');
    
    // Mostrar as informações
    console.log('\n📋 Informações do Cliente:');
    console.log('Nome:', client.name);
    console.log('Alias:', client.alias);
    console.log('URL de teste: /login/pratique');
    console.log('API endpoint: /api/whitelabel/client-branding/pratique');

  } catch (error) {
    console.error('❌ Erro ao criar cliente:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  createPratiqueClient()
    .catch(console.error);
}

module.exports = { createPratiqueClient };