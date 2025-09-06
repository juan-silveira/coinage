// Configurar dotenv para ler o .env da raiz do projeto
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { PrismaClient } = require('../src/generated/prisma');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const prisma = new PrismaClient();

// Detectar network baseado no .env
const isTestnet = process.env.DEFAULT_NETWORK === 'testnet';
const networkName = isTestnet ? 'testnet' : 'mainnet';

async function seedBasicData() {
  try {
    console.log('🌱 Iniciando seed COMPLETO do sistema...');
    console.log(`🌍 Network detectada: ${networkName.toUpperCase()}`);
    
    // Validar variáveis de ambiente obrigatórias
    if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
      throw new Error('❌ ADMIN_EMAIL e ADMIN_PASSWORD são obrigatórios no .env');
    }
    
    console.log(`👤 Criando usuário admin: ${process.env.ADMIN_EMAIL}...`);

    // ========================================
    // 1. CRIAR EMPRESAS
    // ========================================
    console.log('\n🏢 Criando empresas...');

    // Empresa principal - Coinage
    const coinageCompany = await prisma.company.upsert({
      where: { alias: 'coinage' },
      update: {},
      create: {
        name: 'Coinage',
        alias: 'coinage',
        isActive: true,
        rateLimit: {
          requestsPerMinute: 1000,
          requestsPerHour: 10000,
          requestsPerDay: 100000
        }
      }
    });
    console.log(`✅ Empresa principal criada: ${coinageCompany.name} (${coinageCompany.alias})`);

    // Empresa Navi
    const naviCompany = await prisma.company.upsert({
      where: { alias: 'navi' },
      update: {},
      create: {
        name: 'Navi',
        alias: 'navi',
        isActive: true,
        rateLimit: {
          requestsPerMinute: 500,
          requestsPerHour: 5000,
          requestsPerDay: 50000
        }
      }
    });
    console.log(`✅ Empresa Navi criada: ${naviCompany.name} (${naviCompany.alias})`);

    // ========================================
    // 2. CRIAR USUÁRIOS
    // ========================================
    console.log('\n👥 Criando usuários...');

    // Usuário principal - Ivan
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminHashedPassword = bcrypt.hashSync(adminPassword, 12);
    
    const adminUser = await prisma.user.upsert({
      where: { email: process.env.ADMIN_EMAIL },
      update: {
        password: adminHashedPassword
      },
      create: {
        name: process.env.ADMIN_NAME,
        email: process.env.ADMIN_EMAIL,
        cpf: process.env.ADMIN_CPF,
        phone: process.env.ADMIN_PHONE,
        birthDate: new Date(process.env.ADMIN_BIRTH_DATE),
        publicKey: process.env.ADMIN_WALLET_PUBLIC_KEY,
        privateKey: process.env.ADMIN_WALLET_PRIVATE_KEY,
        password: adminHashedPassword,
        isFirstAccess: false,
        userPlan: 'PREMIUM',
        isActive: true
      }
    });
    console.log(`✅ Usuário principal criado: ${adminUser.name} (${adminUser.email})`);

    // Usuário dumb 1
    const dumb1Password = 'Test@2025';
    const dumb1HashedPassword = bcrypt.hashSync(dumb1Password, 12);
    
    const dumb1User = await prisma.user.upsert({
      where: { email: 'user1@coinage.com' },
      update: {
        password: dumb1HashedPassword
      },
      create: {
        name: 'Usuário Teste 1',
        email: 'user1@coinage.com',
        cpf: '12345678901',
        phone: '11999999999',
        birthDate: new Date('1990-01-01'),
        publicKey: '0x1234567890123456789012345678901234567890',
        privateKey: '0x1234567890123456789012345678901234567890123456789012345678901234',
        password: dumb1HashedPassword,
        isFirstAccess: false,
        userPlan: 'BASIC',
        isActive: true
      }
    });
    console.log(`✅ Usuário dumb 1 criado: ${dumb1User.name} (${dumb1User.email})`);

    // Usuário dumb 2
    const dumb2Password = 'Test@2025';
    const dumb2HashedPassword = bcrypt.hashSync(dumb2Password, 12);
    
    const dumb2User = await prisma.user.upsert({
      where: { email: 'user2@coinage.com' },
      update: {
        password: dumb2HashedPassword
      },
      create: {
        name: 'Usuário Teste 2',
        email: 'user2@coinage.com',
        cpf: '98765432109',
        phone: '21888888888',
        birthDate: new Date('1985-05-15'),
        publicKey: '0x9876543210987654321098765432109876543210',
        privateKey: '0x9876543210987654321098765432109876543210987654321098765432109876',
        password: dumb2HashedPassword,
        isFirstAccess: false,
        userPlan: 'BASIC',
        isActive: true
      }
    });
    console.log(`✅ Usuário dumb 2 criado: ${dumb2User.name} (${dumb2User.email})`);

    // ========================================
    // 3. CRIAR RELAÇÕES USER-COMPANY
    // ========================================
    console.log('\n🔗 Criando relações user-company...');

    // Ivan como SUPER_ADMIN na Navi
    const adminNaviRelation = await prisma.userCompany.upsert({
      where: {
        userId_companyId: {
          userId: adminUser.id,
          companyId: naviCompany.id
        }
      },
      update: {},
      create: {
        userId: adminUser.id,
        companyId: naviCompany.id,
        status: 'active',
        role: 'SUPER_ADMIN',
        linkedAt: new Date(),
        approvedAt: new Date(),
        permissions: {}
      }
    });
    console.log(`✅ Ivan vinculado à Navi como SUPER_ADMIN`);

    // Ivan como ADMIN na Coinage (empresa principal)
    await prisma.userCompany.upsert({
      where: {
        userId_companyId: {
          userId: adminUser.id,
          companyId: coinageCompany.id
        }
      },
      update: {},
      create: {
        userId: adminUser.id,
        companyId: coinageCompany.id,
        status: 'active',
        role: 'ADMIN',
        linkedAt: new Date(),
        approvedAt: new Date(),
        permissions: {}
      }
    });
    console.log(`✅ Ivan vinculado à Coinage como ADMIN`);

    // Usuários dumb na Coinage
    await prisma.userCompany.upsert({
      where: {
        userId_companyId: {
          userId: dumb1User.id,
          companyId: coinageCompany.id
        }
      },
      update: {},
      create: {
        userId: dumb1User.id,
        companyId: coinageCompany.id,
        status: 'active',
        role: 'USER',
        linkedAt: new Date(),
        approvedAt: new Date(),
        permissions: {}
      }
    });
    console.log(`✅ Usuário 1 vinculado à Coinage como USER`);

    await prisma.userCompany.upsert({
      where: {
        userId_companyId: {
          userId: dumb2User.id,
          companyId: coinageCompany.id
        }
      },
      update: {},
      create: {
        userId: dumb2User.id,
        companyId: coinageCompany.id,
        status: 'active',
        role: 'USER',
        linkedAt: new Date(),
        approvedAt: new Date(),
        permissions: {}
      }
    });
    console.log(`✅ Usuário 2 vinculado à Coinage como USER`);

    // ========================================
    // 4. CRIAR CONTRACT TYPES COMPLETOS
    // ========================================
    console.log('\n⚙️ Criando tipos de contratos completos...');

    // Contract types para criar (consolidando com seed-contract-types.js)
    const contractTypes = [
      {
        name: 'ERC20',
        description: 'Standard ERC20 Token Contract',
        category: 'token',
        abiPath: 'default_token_abi.json',
        version: '1.0.0',
        isActive: true
      },
      {
        name: 'STAKE',
        description: 'Staking Contract for Token Rewards',
        category: 'defi',
        abiPath: 'default_stake_abi.json',
        version: '1.0.0',
        isActive: true
      },
      {
        name: 'NFT',
        description: 'ERC721 Non-Fungible Token Contract',
        category: 'nft',
        abiPath: 'default_nft_abi.json',
        version: '1.0.0',
        isActive: true
      },
      {
        name: 'token',
        description: 'Contratos de tokens ERC20 padrão',
        category: 'token',
        abiPath: '',
        version: '',
        isActive: true
      },
      {
        name: 'stake',
        description: 'Contratos de staking e rewards',
        category: 'defi',
        abiPath: '',
        version: '',
        isActive: true
      },
      {
        name: 'exchange',
        description: 'Contratos de exchange e DEX',
        category: 'defi',
        abiPath: '',
        version: '',
        isActive: true
      }
    ];

    for (const contractType of contractTypes) {
      try {
        // Verificar se já existe
        const existing = await prisma.contractType.findUnique({
          where: { name: contractType.name }
        });

        if (existing) {
          console.log(`✅ Contract type ${contractType.name} já existe`);
          continue;
        }

        // Criar novo contract type
        const created = await prisma.contractType.create({
          data: contractType
        });

        console.log(`✅ Contract type ${contractType.name} criado com ID: ${created.id}`);
      } catch (error) {
        console.error(`❌ Erro ao criar contract type ${contractType.name}:`, error.message);
      }
    }

    // ========================================
    // 5. CRIAR COMPANY BRANDINGS
    // ========================================
    console.log('\n🎨 Criando company brandings...');

    // Branding da Navi
    await prisma.companyBranding.upsert({
      where: { companyId: naviCompany.id },
      update: {},
      create: {
        companyId: naviCompany.id,
        primaryColor: '#1E40AF',
        secondaryColor: '#3B82F6',
        accentColor: '#60A5FA',
        backgroundColor: '#FFFFFF',
        textColor: '#1F2937',
        logoUrl: '/assets/images/companies/navi.png',
        logoUrlDark: '/assets/images/companies/navi.png',
        faviconUrl: '/assets/images/companies/navi-favicon.ico',
        layoutStyle: 'default',
        borderRadius: 12,
        fontFamily: 'Inter, sans-serif',
        fontSize: 'medium',
        loginTitle: 'Bem-vindo à Navi',
        loginSubtitle: 'Sua plataforma de criptomoedas',
        welcomeMessage: 'Bem-vindo à Navi! Acesse sua conta para gerenciar suas criptomoedas.',
        footerText: '© 2025 Navi. Todos os direitos reservados.',
        supportUrl: 'https://support.navi.com',
        privacyPolicyUrl: 'https://navi.com/privacy',
        termsOfServiceUrl: 'https://navi.com/terms',
        contactEmail: 'support@navi.com',
        isActive: true,
        deployedAt: new Date(),
        deployedBy: adminUser.id
      }
    });
    console.log(`✅ Branding da Navi criado`);

    // Branding da Coinage (empresa principal)
    await prisma.companyBranding.upsert({
      where: { companyId: coinageCompany.id },
      update: {},
      create: {
        companyId: coinageCompany.id,
        primaryColor: '#10B981',
        secondaryColor: '#059669',
        accentColor: '#34D399',
        backgroundColor: '#FFFFFF',
        textColor: '#111827',
        logoUrl: '/assets/images/companies/coinage.png',
        logoUrlDark: '/assets/images/companies/coinage.png',
        faviconUrl: '/assets/images/companies/coinage-favicon.ico',
        layoutStyle: 'default',
        borderRadius: 8,
        fontFamily: 'Roboto, sans-serif',
        fontSize: 'medium',
        loginTitle: 'Bem-vindo à Coinage',
        loginSubtitle: 'Plataforma líder em criptomoedas',
        welcomeMessage: 'Bem-vindo à Coinage! A plataforma mais confiável para suas operações com criptomoedas.',
        footerText: '© 2025 Coinage. Todos os direitos reservados.',
        supportUrl: 'https://support.coinage.com',
        privacyPolicyUrl: 'https://coinage.com/privacy',
        termsOfServiceUrl: 'https://coinage.com/terms',
        contactEmail: 'support@coinage.com',
        isActive: true,
        deployedAt: new Date(),
        deployedBy: adminUser.id
      }
    });
    console.log(`✅ Branding da Coinage criado`);

    console.log('\n✅ Dados básicos criados com sucesso!');

    console.log('\n✅ Sistema básico inicializado com sucesso!');

  } catch (error) {
    console.error('❌ Erro durante o seed:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o seed
if (require.main === module) {
  seedBasicData().then(() => {
    console.log('\n');
    console.log('🎉 ===============================================');
    console.log('✨ SEED COMPLETO EXECUTADO COM SUCESSO!');
    console.log('===============================================');
    console.log(`🌍 Network: ${networkName.toUpperCase()}`);
    console.log(`🏢 Empresas: Coinage (principal) + Navi`);
    console.log(`👤 Usuário admin: ${process.env.ADMIN_EMAIL}`);
    console.log(`👥 Usuários teste: user1@coinage.com, user2@coinage.com`);
    console.log(`⚙️ Contract types: ERC20, STAKE, NFT, token, stake, exchange`);
    console.log(`🎨 Company brandings: Configurados para ambas empresas`);
    console.log(`⚙️ Contract types: 6 tipos de contratos configurados`);
    console.log(`🎨 Company brandings: 2 empresas com visual personalizado`);
    console.log(`🔗 User-Company relations: Permissões configuradas`);
    console.log('===============================================');
    console.log('🚀 Sistema pronto para uso com dados completos!');
    console.log('===============================================');
    process.exit(0);
  }).catch((error) => {
    console.error('❌ Erro durante o seed:', error);
    process.exit(1);
  });
}

module.exports = { seedBasicData };