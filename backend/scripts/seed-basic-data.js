const { PrismaClient } = require('../src/generated/prisma');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function seedBasicData() {
  try {
    console.log('🌱 Iniciando seed completo do sistema...');

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
    const ivanPassword = 'N@vi@2025';
    const ivanHashedPassword = bcrypt.hashSync(ivanPassword, 12);
    
    const ivanUser = await prisma.user.upsert({
      where: { email: 'ivan.alberton@navi.inf.br' },
      update: {
        password: ivanHashedPassword
      },
      create: {
        name: 'Ivan Alberton',
        email: 'ivan.alberton@navi.inf.br',
        cpf: '02308739959',
        phone: '46999716711',
        birthDate: new Date('1979-07-26'),
        publicKey: '0x5528C065931f523CA9F3a6e49a911896fb1D2e6f',
        privateKey: '0x2a09b1aaa664113fd7163a0a4aafbcb16f6b5a16ae9dacfe7c840be2455e3f61',
        password: ivanHashedPassword,
        isFirstAccess: false,
        userPlan: 'PREMIUM',
        isActive: true
      }
    });
    console.log(`✅ Usuário principal criado: ${ivanUser.name} (${ivanUser.email})`);

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
    const ivanNaviRelation = await prisma.userCompany.upsert({
      where: {
        userId_companyId: {
          userId: ivanUser.id,
          companyId: naviCompany.id
        }
      },
      update: {},
      create: {
        userId: ivanUser.id,
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
    const ivanCoinageRelation = await prisma.userCompany.upsert({
      where: {
        userId_companyId: {
          userId: ivanUser.id,
          companyId: coinageCompany.id
        }
      },
      update: {},
      create: {
        userId: ivanUser.id,
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
    const dumb1CoinageRelation = await prisma.userCompany.upsert({
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

    const dumb2CoinageRelation = await prisma.userCompany.upsert({
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
    // 4. CRIAR COMPANY BRANDINGS
    // ========================================
    console.log('\n🎨 Criando company brandings...');

    // Branding da Navi
    const naviBranding = await prisma.companyBranding.upsert({
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
        deployedBy: ivanUser.id
      }
    });
    console.log(`✅ Branding da Navi criado`);

    // Branding da Coinage (empresa principal)
    const coinageBranding = await prisma.companyBranding.upsert({
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
        deployedBy: ivanUser.id
      }
    });
    console.log(`✅ Branding da Coinage criado`);

    // ========================================
    // 5. CRIAR TRANSACTIONS PARA IVAN
    // ========================================
    console.log('\n💸 Criando transações para Ivan...');

    // Transaction 1 - Transfer
    const transaction1 = await prisma.transaction.create({
      data: {
        companyId: naviCompany.id,
        userId: ivanUser.id,
        userCompanyId: ivanNaviRelation.id,
        network: 'mainnet',
        transactionType: 'transfer',
        status: 'confirmed',
        txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        blockNumber: BigInt(18500000),
        fromAddress: '0x5528C065931f523CA9F3a6e49a911896fb1D2e6f',
        toAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
        value: '0.5',
        gasPrice: '0.00000002',
        gasLimit: BigInt(21000),
        gasUsed: BigInt(21000),
        nonce: 5,
        functionName: 'transfer',
        confirmations: 12,
        submittedAt: new Date(Date.now() - 3600000), // 1 hora atrás
        confirmedAt: new Date(Date.now() - 1800000), // 30 min atrás
        metadata: {
          description: 'Transferência de ETH para carteira pessoal',
          category: 'personal'
        }
      }
    });
    console.log(`✅ Transaction 1 criada: Transferência de ETH`);

    // Transaction 2 - Contract Call
    const transaction2 = await prisma.transaction.create({
      data: {
        companyId: naviCompany.id,
        userId: ivanUser.id,
        userCompanyId: ivanNaviRelation.id,
        network: 'mainnet',
        transactionType: 'contract_call',
        status: 'confirmed',
        txHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        blockNumber: BigInt(18500001),
        fromAddress: '0x5528C065931f523CA9F3a6e49a911896fb1D2e6f',
        toAddress: '0xA0b86a33E6441b8C4C8C8C8C8C8C8C8C8C8C8C8C',
        value: '0',
        gasPrice: '0.000000025',
        gasLimit: BigInt(150000),
        gasUsed: BigInt(120000),
        nonce: 6,
        functionName: 'approve',
        functionParams: {
          spender: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
          amount: '1000000000000000000000'
        },
        confirmations: 8,
        submittedAt: new Date(Date.now() - 7200000), // 2 horas atrás
        confirmedAt: new Date(Date.now() - 5400000), // 1.5 horas atrás
        metadata: {
          description: 'Aprovação de tokens USDT para DEX',
          category: 'defi',
          token: 'USDT'
        }
      }
    });
    console.log(`✅ Transaction 2 criada: Aprovação de USDT`);

    // Transaction 3 - Deposit
    const transaction3 = await prisma.transaction.create({
      data: {
        companyId: naviCompany.id,
        userId: ivanUser.id,
        userCompanyId: ivanNaviRelation.id,
        network: 'mainnet',
        transactionType: 'deposit',
        status: 'confirmed',
        txHash: '0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba',
        blockNumber: BigInt(18500002),
        fromAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
        toAddress: '0x5528C065931f523CA9F3a6e49a911896fb1D2e6f',
        value: '2.5',
        gasPrice: '0.00000002',
        gasLimit: BigInt(21000),
        gasUsed: BigInt(21000),
        nonce: 15,
        functionName: 'transfer',
        confirmations: 25,
        submittedAt: new Date(Date.now() - 10800000), // 3 horas atrás
        confirmedAt: new Date(Date.now() - 9000000), // 2.5 horas atrás
        metadata: {
          description: 'Depósito de ETH na carteira Navi',
          category: 'deposit'
        }
      }
    });
    console.log(`✅ Transaction 3 criada: Depósito de ETH`);

    // ========================================
    // 6. CRIAR EARNINGS PARA IVAN
    // ========================================
    console.log('\n💰 Criando earnings para Ivan...');

    // Earnings 1 - ETH
    const earnings1 = await prisma.earnings.create({
      data: {
        userId: ivanUser.id,
        tokenSymbol: 'ETH',
        tokenName: 'Ethereum',
        amount: '0.5',
        quote: '1250.00',
        network: 'mainnet',
        transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        distributionDate: new Date(Date.now() - 86400000), // 1 dia atrás
        isActive: true
      }
    });
    console.log(`✅ Earnings 1 criado: 0.5 ETH`);

    // Earnings 2 - USDT
    const earnings2 = await prisma.earnings.create({
      data: {
        userId: ivanUser.id,
        tokenSymbol: 'USDT',
        tokenName: 'Tether USD',
        amount: '1000.00',
        quote: '1000.00',
        network: 'mainnet',
        transactionHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        distributionDate: new Date(Date.now() - 172800000), // 2 dias atrás
        isActive: true
      }
    });
    console.log(`✅ Earnings 2 criado: 1000 USDT`);

    // Earnings 3 - BTC
    const earnings3 = await prisma.earnings.create({
      data: {
        userId: ivanUser.id,
        tokenSymbol: 'BTC',
        tokenName: 'Bitcoin',
        amount: '0.025',
        quote: '1500.00',
        network: 'mainnet',
        transactionHash: '0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba',
        distributionDate: new Date(Date.now() - 259200000), // 3 dias atrás
        isActive: true
      }
    });
    console.log(`✅ Earnings 3 criado: 0.025 BTC`);

    // ========================================
    // 7. CRIAR NOTIFICAÇÕES PARA IVAN
    // ========================================
    console.log('\n🔔 Criando notificações para Ivan...');

    const notification1 = await prisma.notification.create({
      data: {
        sender: 'coinage',
        title: 'Bem-vindo à Navi!',
        message: 'Sua conta foi criada com sucesso. Aproveite todos os recursos da plataforma.',
        isRead: false,
        isActive: true,
        userId: ivanUser.id,
        isFavorite: true
      }
    });

    const notification2 = await prisma.notification.create({
      data: {
        sender: 'coinage',
        title: 'Transação confirmada',
        message: 'Sua transferência de 0.5 ETH foi confirmada na blockchain.',
        isRead: false,
        isActive: true,
        userId: ivanUser.id,
        isFavorite: false
      }
    });

    const notification3 = await prisma.notification.create({
      data: {
        sender: 'coinage',
        title: 'Novos earnings disponíveis',
        message: 'Você recebeu 1000 USDT em sua conta. Verifique o histórico de earnings.',
        isRead: true,
        isActive: true,
        userId: ivanUser.id,
        isFavorite: false,
        readDate: new Date()
      }
    });

    console.log(`✅ 3 notificações criadas para Ivan`);

    // ========================================
    // RESUMO FINAL
    // ========================================
    console.log('\n🎉 SEED COMPLETO EXECUTADO COM SUCESSO!');
    console.log('\n📊 RESUMO DOS DADOS CRIADOS:');
    console.log('🏢 Empresas: 2 (Coinage + Navi)');
    console.log('👥 Usuários: 3 (Ivan + 2 dumb users)');
    console.log('🔗 Relações User-Company: 5');
    console.log('🎨 Company Brandings: 2');
    console.log('💸 Transações para Ivan: 3');
    console.log('💰 Earnings para Ivan: 3');
    console.log('🔔 Notificações para Ivan: 3');
    
    console.log('\n👤 CREDENCIAIS DE ACESSO:');
    console.log('   🔑 Ivan Alberton (SUPER_ADMIN na Navi, ADMIN na Coinage):');
    console.log(`      Email: ivan.alberton@navi.inf.br`);
    console.log(`      Senha: ${ivanPassword}`);
    console.log('   🔑 Usuário Teste 1 (USER na Coinage):');
    console.log(`      Email: user1@coinage.com`);
    console.log(`      Senha: ${dumb1Password}`);
    console.log('   🔑 Usuário Teste 2 (USER na Coinage):');
    console.log(`      Email: user2@coinage.com`);
    console.log(`      Senha: ${dumb2Password}`);

    console.log('\n🎨 BRANDINGS:');
    console.log(`   🟦 Navi: Logo em /assets/images/companies/navi.png`);
    console.log(`   🟩 Coinage: Logo em /assets/images/companies/coinage.png`);

  } catch (error) {
    console.error('❌ Erro durante o seed:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

seedBasicData();