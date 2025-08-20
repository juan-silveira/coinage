const { PrismaClient } = require('../src/generated/prisma');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const prisma = new PrismaClient();

const isTestnet = process.env.DEFAULT_NETWORK === 'testnet';
const networkName = isTestnet ? 'testnet' : 'mainnet';

async function seedSimple() {
  try {
    console.log('🌱 Criando experiência completa para Ivan Alberton...');
    console.log(`🌍 Network: ${networkName.toUpperCase()}`);

    // 1. EMPRESAS
    const naviCompany = await prisma.company.upsert({
      where: { alias: 'navi' },
      update: {},
      create: {
        name: 'Navi',
        alias: 'navi',
        isActive: true,
        rateLimit: { requestsPerMinute: 500, requestsPerHour: 5000, requestsPerDay: 50000 }
      }
    });

    const coinageCompany = await prisma.company.upsert({
      where: { alias: 'coinage' },
      update: {},
      create: {
        name: 'Coinage',
        alias: 'coinage',
        isActive: true,
        rateLimit: { requestsPerMinute: 1000, requestsPerHour: 10000, requestsPerDay: 100000 }
      }
    });

    console.log('✅ Empresas criadas');

    // 2. USUÁRIO IVAN
    const ivanPassword = 'N@vi@2025';
    const ivanHashedPassword = bcrypt.hashSync(ivanPassword, 12);
    
    const ivanUser = await prisma.user.upsert({
      where: { email: 'ivan.alberton@navi.inf.br' },
      update: { password: ivanHashedPassword },
      create: {
        name: 'Ivan Alberton',
        email: 'ivan.alberton@navi.inf.br',
        cpf: '02308739959',
        phone: '46999716711',
        birthDate: new Date('1979-07-26'),
        publicKey: isTestnet ? '0x7B5A73C4c72f8B2D5B9b8C4F3f8E5A2D1C6B9E8F' : '0x5528C065931f523CA9F3a6e49a911896fb1D2e6f',
        privateKey: isTestnet ? '0x4a15b2aab345132ed7264a1b5aafbcc17f6b4a17ae9dbcfe8c942be3556e4f72' : '0x2a09b1aaa664113fd7163a0a4aafbcb16f6b5a16ae9dacfe7c840be2455e3f61',
        password: ivanHashedPassword,
        isFirstAccess: false,
        userPlan: 'PREMIUM',
        isActive: true,
        emailConfirmed: true
      }
    });

    console.log('✅ Ivan criado');

    // 3. RELAÇÕES USER-COMPANY
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

    await prisma.userCompany.upsert({
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

    console.log('✅ Relações user-company criadas');

    // 4. BRANDINGS
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
        deployedBy: ivanUser.id
      }
    });

    console.log('✅ Brandings criados');

    // 5. TRANSAÇÕES HISTÓRICAS
    const transactions = [
      {
        type: 'deposit',
        description: 'Primeiro depósito na plataforma',
        value: isTestnet ? '5.0' : '2.5',
        hoursAgo: 168,
        status: 'confirmed'
      },
      {
        type: 'transfer',
        description: 'Transferência para DEX',
        value: isTestnet ? '1.0' : '0.5',
        hoursAgo: 144,
        status: 'confirmed'
      },
      {
        type: 'withdraw',
        description: 'Saque para carteira pessoal',
        value: isTestnet ? '500.0' : '800.0',
        hoursAgo: 72,
        status: 'confirmed'
      },
      {
        type: 'transfer',
        description: 'Transferência pendente',
        value: isTestnet ? '0.5' : '0.2',
        hoursAgo: 2,
        status: 'pending'
      }
    ];

    for (let i = 0; i < transactions.length; i++) {
      const tx = transactions[i];
      const timestamp = new Date(Date.now() - (tx.hoursAgo * 60 * 60 * 1000));
      const txHash = `0x${crypto.randomBytes(32).toString('hex')}`;
      
      await prisma.transaction.create({
        data: {
          companyId: naviCompany.id,
          userId: ivanUser.id,
          userCompanyId: ivanNaviRelation.id,
          network: networkName,
          transactionType: tx.type,
          status: tx.status,
          txHash: txHash,
          blockNumber: BigInt(isTestnet ? 15000 + i : 18500000 + i),
          fromAddress: isTestnet ? '0x7B5A73C4c72f8B2D5B9b8C4F3f8E5A2D1C6B9E8F' : '0x5528C065931f523CA9F3a6e49a911896fb1D2e6f',
          toAddress: isTestnet ? '0x8C6A84C5d73f9B3E6C9c8D4F4f9F6A3E2D7C0F9G' : '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
          value: tx.value,
          gasPrice: isTestnet ? '0.000000001' : '0.00000002',
          gasLimit: BigInt(21000),
          gasUsed: BigInt(21000),
          nonce: i + 1,
          functionName: 'transfer',
          confirmations: tx.status === 'confirmed' ? 12 : 0,
          submittedAt: timestamp,
          confirmedAt: tx.status === 'confirmed' ? new Date(timestamp.getTime() + 300000) : null,
          metadata: {
            description: tx.description,
            network: networkName
          }
        }
      });
    }

    console.log(`✅ ${transactions.length} transações criadas`);

    // 6. EARNINGS
    const earnings = [
      { token: 'ETH', amount: isTestnet ? '0.234' : '0.456', daysAgo: 1 },
      { token: 'USDT', amount: isTestnet ? '45.67' : '78.90', daysAgo: 2 },
      { token: 'BTC', amount: isTestnet ? '0.012' : '0.023', daysAgo: 3 }
    ];

    for (const earning of earnings) {
      const distributionDate = new Date(Date.now() - (earning.daysAgo * 24 * 60 * 60 * 1000));
      const quote = earning.token === 'ETH' ? (parseFloat(earning.amount) * 2500) :
                   earning.token === 'BTC' ? (parseFloat(earning.amount) * 30000) :
                   parseFloat(earning.amount);

      await prisma.earnings.create({
        data: {
          userId: ivanUser.id,
          tokenSymbol: earning.token,
          tokenName: earning.token === 'ETH' ? 'Ethereum' : earning.token === 'BTC' ? 'Bitcoin' : 'Tether USD',
          amount: earning.amount,
          quote: quote.toFixed(2),
          network: networkName,
          transactionHash: `0x${crypto.randomBytes(32).toString('hex')}`,
          distributionDate: distributionDate,
          isActive: true
        }
      });
    }

    console.log(`✅ ${earnings.length} earnings criados`);

    // 7. NOTIFICAÇÕES
    const notifications = [
      {
        title: 'Bem-vindo à Navi!',
        message: `Sua conta foi criada com sucesso na ${networkName}.`,
        isRead: true,
        hoursAgo: 240
      },
      {
        title: 'Transação confirmada',
        message: 'Seu depósito foi confirmado na blockchain.',
        isRead: false,
        hoursAgo: 24
      },
      {
        title: 'Novos earnings disponíveis',
        message: `Você recebeu ${earnings[0].amount} ${earnings[0].token} em rewards.`,
        isRead: false,
        hoursAgo: 2
      }
    ];

    for (const notif of notifications) {
      const timestamp = new Date(Date.now() - (notif.hoursAgo * 60 * 60 * 1000));
      
      await prisma.notification.create({
        data: {
          sender: 'coinage',
          title: notif.title,
          message: notif.message,
          isRead: notif.isRead,
          isActive: true,
          userId: ivanUser.id,
          isFavorite: false,
          readDate: notif.isRead ? new Date(timestamp.getTime() + 1800000) : null,
          createdAt: timestamp
        }
      });
    }

    console.log(`✅ ${notifications.length} notificações criadas`);

    // RESUMO
    console.log('\n🎉 EXPERIÊNCIA COMPLETA CRIADA PARA IVAN!');
    console.log(`\n🌍 Network: ${networkName.toUpperCase()}`);
    console.log('\n👤 CREDENCIAIS:');
    console.log(`   Email: ivan.alberton@navi.inf.br`);
    console.log(`   Senha: ${ivanPassword}`);
    console.log(`   Carteira: ${isTestnet ? '0x7B5A73C4c72f8B2D5B9b8C4F3f8E5A2D1C6B9E8F' : '0x5528C065931f523CA9F3a6e49a911896fb1D2e6f'}`);
    
    console.log('\n📊 DADOS CRIADOS:');
    console.log(`   💸 Transações: ${transactions.length}`);
    console.log(`   💰 Earnings: ${earnings.length}`);
    console.log(`   🔔 Notificações: ${notifications.length}`);
    
    console.log('\n🚀 ACESSO:');
    console.log('   URL: http://localhost:3000/login/navi');
    console.log('   Role: SUPER_ADMIN na Navi, ADMIN na Coinage');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedSimple();