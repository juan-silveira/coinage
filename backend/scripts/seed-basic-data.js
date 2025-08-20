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
    console.log('👤 Criando experiência completa para Ivan Alberton...');

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
        publicKey: isTestnet ? '0x7B5A73C4c72f8B2D5B9b8C4F3f8E5A2D1C6B9E8F' : '0x5528C065931f523CA9F3a6e49a911896fb1D2e6f',
        privateKey: isTestnet ? '0x4a15b2aab345132ed7264a1b5aafbcc17f6b4a17ae9dbcfe8c942be3556e4f72' : '0x2a09b1aaa664113fd7163a0a4aafbcb16f6b5a16ae9dacfe7c840be2455e3f61',
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
    // 4. CRIAR COMPANY BRANDINGS
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
        deployedBy: ivanUser.id
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
        deployedBy: ivanUser.id
      }
    });
    console.log(`✅ Branding da Coinage criado`);

    // ========================================
    // 5. CRIAR HISTÓRICO COMPLETO DE TRANSAÇÕES PARA IVAN
    // ========================================
    console.log('\n💸 Criando histórico completo de transações para Ivan...');
    console.log(`📊 Gerando transações para ${networkName}...`);
    
    const transactionData = {
      mainnet: {
        chainId: 1,
        baseBlockNumber: 18500000,
        addresses: {
          ivan: '0x5528C065931f523CA9F3a6e49a911896fb1D2e6f',
          external1: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
          external2: '0xA0b86a33E6441b8C4C8C8C8C8C8C8C8C8C8C8C8C',
          usdtContract: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
          uniswapRouter: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D'
        }
      },
      testnet: {
        chainId: 88001,
        baseBlockNumber: 15000,
        addresses: {
          ivan: '0x7B5A73C4c72f8B2D5B9b8C4F3f8E5A2D1C6B9E8F',
          external1: '0x8C6A84C5d73f9B3E6C9c8D4F4f9F6A3E2D7C0F9G',
          external2: '0xB1c97a44F7551c9E7E9c9E5F5f0G7B4F3E8D1G0H',
          usdtContract: '0xTest17F958D2ee523a2206206994597C13D831ec7',
          uniswapRouter: '0xTest0d5630B4cF539739dF2C5dAcb4c659F2488D'
        }
      }
    };
    
    const currentNetworkData = transactionData[networkName];

    // Criar múltiplas transações para dar um histórico rico
    const transactions = [
      // 1. Primeiro depósito - Onboarding
      {
        type: 'deposit',
        description: 'Primeiro depósito na plataforma Navi',
        value: isTestnet ? '5.0' : '2.5',
        token: 'ETH',
        hoursAgo: 168, // 7 dias
        status: 'confirmed',
        category: 'onboarding'
      },
      // 2. Transferência para DEX
      {
        type: 'transfer',
        description: 'Transferência para Uniswap V3',
        value: isTestnet ? '1.0' : '0.5',
        token: 'ETH',
        hoursAgo: 144, // 6 dias
        status: 'confirmed',
        category: 'defi'
      },
      // 3. Aprovação de USDT
      {
        type: 'contract_call',
        description: 'Aprovação de USDT para trading',
        value: '0',
        token: 'USDT',
        functionName: 'approve',
        hoursAgo: 120, // 5 dias
        status: 'confirmed',
        category: 'defi'
      },
      // 4. Swap ETH -> USDT
      {
        type: 'contract_call',
        description: 'Swap ETH por USDT no Uniswap',
        value: isTestnet ? '0.8' : '0.3',
        token: 'ETH',
        functionName: 'swapExactETHForTokens',
        hoursAgo: 96, // 4 dias
        status: 'confirmed',
        category: 'defi'
      },
      // 5. Withdraw para carteira pessoal
      {
        type: 'withdraw',
        description: 'Saque para carteira pessoal',
        value: isTestnet ? '500.0' : '800.0',
        token: 'USDT',
        hoursAgo: 72, // 3 dias
        status: 'confirmed',
        category: 'personal'
      },
      // 6. Novo depósito
      {
        type: 'deposit',
        description: 'Depósito adicional de ETH',
        value: isTestnet ? '3.2' : '1.8',
        token: 'ETH',
        hoursAgo: 48, // 2 dias
        status: 'confirmed',
        category: 'investment'
      },
      // 7. Staking
      {
        type: 'contract_call',
        description: 'Stake de ETH para Ethereum 2.0',
        value: isTestnet ? '2.0' : '1.0',
        token: 'ETH',
        functionName: 'stake',
        hoursAgo: 24, // 1 dia
        status: 'confirmed',
        category: 'staking'
      },
      // 8. Transação pendente
      {
        type: 'transfer',
        description: 'Transferência para exchange',
        value: isTestnet ? '0.5' : '0.2',
        token: 'ETH',
        hoursAgo: 2,
        status: 'pending',
        category: 'trading'
      },
      // 9. Transação falhada
      {
        type: 'contract_call',
        description: 'Tentativa de mint NFT (falhou)',
        value: isTestnet ? '0.1' : '0.05',
        token: 'ETH',
        functionName: 'mint',
        hoursAgo: 6,
        status: 'failed',
        category: 'nft'
      }
    ];
    
    let createdTransactions = [];
    
    for (let i = 0; i < transactions.length; i++) {
      const tx = transactions[i];
      const timestamp = new Date(Date.now() - (tx.hoursAgo * 60 * 60 * 1000));
      const txHash = `0x${crypto.randomBytes(32).toString('hex')}`;
      
      const transaction = await prisma.transaction.create({
        data: {
          companyId: naviCompany.id,
          userId: ivanUser.id,
          userCompanyId: ivanNaviRelation.id,
          network: networkName,
          transactionType: tx.type,
          status: tx.status,
          txHash: txHash,
          blockNumber: BigInt(currentNetworkData.baseBlockNumber + i),
          fromAddress: tx.type === 'deposit' ? currentNetworkData.addresses.external1 : currentNetworkData.addresses.ivan,
          toAddress: tx.type === 'withdraw' ? currentNetworkData.addresses.external1 : 
                    (tx.functionName ? currentNetworkData.addresses.uniswapRouter : currentNetworkData.addresses.external2),
          value: tx.value,
          gasPrice: isTestnet ? '0.000000001' : '0.00000002',
          gasLimit: BigInt(tx.functionName ? 200000 : 21000),
          gasUsed: BigInt(tx.functionName ? (180000 + Math.floor(Math.random() * 20000)) : 21000),
          nonce: i + 1,
          functionName: tx.functionName || 'transfer',
          functionParams: tx.functionName ? {
            amount: tx.value,
            token: tx.token
          } : null,
          confirmations: tx.status === 'confirmed' ? (Math.floor(Math.random() * 50) + 10) : 
                        (tx.status === 'pending' ? 0 : null),
          submittedAt: timestamp,
          confirmedAt: tx.status === 'confirmed' ? new Date(timestamp.getTime() + (5 * 60 * 1000)) : null,
          failedAt: tx.status === 'failed' ? new Date(timestamp.getTime() + (2 * 60 * 1000)) : null,
          metadata: {
            description: tx.description,
            category: tx.category,
            token: tx.token,
            network: networkName,
            estimatedValue: tx.token === 'ETH' ? (parseFloat(tx.value) * (isTestnet ? 1500 : 2500)) : 
                          (tx.token === 'USDT' ? parseFloat(tx.value) : 0)
          }
        }
      });
      
      createdTransactions.push(transaction);
      console.log(`✅ Transação ${i + 1} criada: ${tx.description} (${tx.status})`);
    }
    
    console.log(`✅ Total de ${createdTransactions.length} transações criadas para Ivan`);

    // ========================================
    // 6. CRIAR PORTFOLIOS E BALANCES PARA IVAN
    // ========================================
    console.log('\n💼 Criando portfolios e balances para Ivan...');
    
    // Portfolio principal
    const portfolio = await prisma.portfolio.upsert({
      where: {
        userId_network: {
          userId: ivanUser.id,
          network: networkName
        }
      },
      update: {},
      create: {
        userId: ivanUser.id,
        network: networkName,
        totalValue: isTestnet ? '12567.89' : '28945.67',
        lastUpdated: new Date(),
        metadata: {
          autoUpdate: true,
          updateFrequency: '5min',
          riskProfile: 'moderate'
        }
      }
    });
    console.log(`✅ Portfolio criado para ${networkName}`);
    
    // Balances diversos
    const balances = [
      {
        token: 'ETH',
        name: 'Ethereum',
        balance: isTestnet ? '4.567' : '8.234',
        quote: isTestnet ? '6850.50' : '20585.00',
        price: isTestnet ? '1500.00' : '2500.00'
      },
      {
        token: 'USDT',
        name: 'Tether USD',
        balance: isTestnet ? '3200.00' : '5500.00',
        quote: isTestnet ? '3200.00' : '5500.00',
        price: '1.00'
      },
      {
        token: 'BTC',
        name: 'Bitcoin',
        balance: isTestnet ? '0.125' : '0.078',
        quote: isTestnet ? '2517.39' : '2360.67',
        price: isTestnet ? '20139.12' : '30265.00'
      },
      {
        token: 'MATIC',
        name: 'Polygon',
        balance: isTestnet ? '1500.00' : '2200.00',
        quote: isTestnet ? '1275.00' : '1870.00',
        price: isTestnet ? '0.85' : '0.85'
      }
    ];
    
    for (const bal of balances) {
      await prisma.balance.upsert({
        where: {
          portfolioId_tokenSymbol: {
            portfolioId: portfolio.id,
            tokenSymbol: bal.token
          }
        },
        update: {
          balance: bal.balance,
          quote: bal.quote,
          lastPrice: bal.price
        },
        create: {
          portfolioId: portfolio.id,
          tokenSymbol: bal.token,
          tokenName: bal.name,
          balance: bal.balance,
          quote: bal.quote,
          lastPrice: bal.price,
          network: networkName,
          lastUpdated: new Date()
        }
      });
      console.log(`✅ Balance criado: ${bal.balance} ${bal.token} ($${bal.quote})`);
    }
    
    // ========================================
    // 7. CRIAR EARNINGS HISTÓRICO PARA IVAN
    // ========================================
    console.log('\n💰 Criando histórico de earnings para Ivan...');

    const earningsHistory = [
      {
        token: 'ETH',
        name: 'Ethereum',
        amount: isTestnet ? '0.234' : '0.456',
        source: 'staking_rewards',
        daysAgo: 1
      },
      {
        token: 'USDT',
        name: 'Tether USD',
        amount: isTestnet ? '45.67' : '78.90',
        source: 'liquidity_mining',
        daysAgo: 2
      },
      {
        token: 'BTC',
        name: 'Bitcoin',
        amount: isTestnet ? '0.012' : '0.023',
        source: 'trading_fees',
        daysAgo: 3
      },
      {
        token: 'MATIC',
        name: 'Polygon',
        amount: isTestnet ? '125.00' : '234.50',
        source: 'validator_rewards',
        daysAgo: 5
      },
      {
        token: 'ETH',
        name: 'Ethereum',
        amount: isTestnet ? '0.189' : '0.278',
        source: 'defi_yield',
        daysAgo: 7
      },
      {
        token: 'USDT',
        name: 'Tether USD',
        amount: isTestnet ? '89.12' : '156.78',
        source: 'lending_interest',
        daysAgo: 10
      }
    ];
    
    let totalEarnings = 0;
    for (const earning of earningsHistory) {
      const distributionDate = new Date(Date.now() - (earning.daysAgo * 24 * 60 * 60 * 1000));
      const txHash = `0x${crypto.randomBytes(32).toString('hex')}`;
      
      const quote = earning.token === 'ETH' ? (parseFloat(earning.amount) * (isTestnet ? 1500 : 2500)) :
                   earning.token === 'BTC' ? (parseFloat(earning.amount) * (isTestnet ? 20000 : 30000)) :
                   earning.token === 'MATIC' ? (parseFloat(earning.amount) * 0.85) :
                   parseFloat(earning.amount);
      
      await prisma.earnings.create({
        data: {
          userId: ivanUser.id,
          tokenSymbol: earning.token,
          tokenName: earning.name,
          amount: earning.amount,
          quote: quote.toFixed(2),
          network: networkName,
          transactionHash: txHash,
          distributionDate: distributionDate,
          isActive: true,
          metadata: {
            source: earning.source,
            apy: earning.source === 'staking_rewards' ? '4.5%' : 
                 earning.source === 'liquidity_mining' ? '12.3%' :
                 earning.source === 'lending_interest' ? '8.7%' : '6.2%'
          }
        }
      });
      
      totalEarnings += quote;
      console.log(`✅ Earning criado: ${earning.amount} ${earning.token} ($${quote.toFixed(2)}) - ${earning.source}`);
    }
    
    console.log(`✅ Total de ${earningsHistory.length} earnings criados ($${totalEarnings.toFixed(2)})`);

    // ========================================
    // 8. CRIAR HISTÓRICO DE PIX (DEPÓSITOS/SAQUES)
    // ========================================
    console.log('\n💳 Criando histórico de PIX para Ivan...');
    
    const pixTransactions = [
      {
        type: 'deposit',
        amount: isTestnet ? '1500.00' : '2500.00',
        status: 'completed',
        description: 'Depósito via PIX - Primeira recarga',
        hoursAgo: 240 // 10 dias
      },
      {
        type: 'deposit',
        amount: isTestnet ? '800.00' : '1200.00',
        status: 'completed',
        description: 'Depósito via PIX - Recarga adicional',
        hoursAgo: 120 // 5 dias
      },
      {
        type: 'withdraw',
        amount: isTestnet ? '600.00' : '900.00',
        status: 'completed',
        description: 'Saque via PIX - Lucros realizados',
        hoursAgo: 72 // 3 dias
      },
      {
        type: 'deposit',
        amount: isTestnet ? '300.00' : '500.00',
        status: 'processing',
        description: 'Depósito via PIX - Em processamento',
        hoursAgo: 2
      }
    ];
    
    for (const pix of pixTransactions) {
      const pixId = crypto.randomUUID();
      const timestamp = new Date(Date.now() - (pix.hoursAgo * 60 * 60 * 1000));
      
      await prisma.depositRequest.create({
        data: {
          id: pixId,
          userId: ivanUser.id,
          type: pix.type,
          amount: pix.amount,
          status: pix.status,
          description: pix.description,
          paymentMethod: 'pix',
          paymentId: pixId,
          createdAt: timestamp,
          completedAt: pix.status === 'completed' ? new Date(timestamp.getTime() + (5 * 60 * 1000)) : null,
          metadata: {
            endToEndId: `E${String(Date.now()).slice(-8)}${String(Math.random()).slice(-8)}`,
            txId: `${pixId.slice(0, 8)}-${pixId.slice(-4)}`,
            originalAmount: pix.amount,
            exchangeRate: pix.type === 'deposit' ? '1.00' : '0.99'
          }
        }
      });
      
      console.log(`✅ PIX ${pix.type} criado: R$ ${pix.amount} (${pix.status})`);
    }
    
    // ========================================
    // 9. CRIAR NOTIFICAÇÕES COMPLETAS PARA IVAN
    // ========================================
    console.log('\n🔔 Criando sistema completo de notificações para Ivan...');

    const notifications = [
      {
        type: 'welcome',
        title: 'Bem-vindo à Navi!',
        message: `Sua conta foi criada com sucesso na ${networkName}. Aproveite todos os recursos da plataforma.`,
        isRead: true,
        isFavorite: true,
        hoursAgo: 240,
        priority: 'high'
      },
      {
        type: 'transaction',
        title: 'Primeiro depósito confirmado',
        message: `Seu depósito de R$ ${isTestnet ? '1.500,00' : '2.500,00'} via PIX foi confirmado.`,
        isRead: true,
        isFavorite: false,
        hoursAgo: 239,
        priority: 'medium'
      },
      {
        type: 'security',
        title: 'Login de novo dispositivo',
        message: 'Detectamos um login em um novo dispositivo. Se não foi você, altere sua senha.',
        isRead: true,
        isFavorite: false,
        hoursAgo: 168,
        priority: 'high'
      },
      {
        type: 'earnings',
        title: 'Novos rewards de staking',
        message: `Você recebeu ${isTestnet ? '0.234' : '0.456'} ETH em rewards de staking.`,
        isRead: false,
        isFavorite: true,
        hoursAgo: 24,
        priority: 'medium'
      },
      {
        type: 'transaction',
        title: 'Transação pendente',
        message: `Sua transferência de ${isTestnet ? '0.5' : '0.2'} ETH está sendo processada na blockchain.`,
        isRead: false,
        isFavorite: false,
        hoursAgo: 2,
        priority: 'low'
      },
      {
        type: 'system',
        title: 'Manutenção programada',
        message: 'Haverá manutenção do sistema amanhã das 2h às 4h. Suas operações não serão afetadas.',
        isRead: false,
        isFavorite: false,
        hoursAgo: 12,
        priority: 'low'
      },
      {
        type: 'promo',
        title: 'Nova funcionalidade: DeFi Yield',
        message: 'Agora você pode fazer staking de ETH diretamente na plataforma com APY de 4.5%.',
        isRead: true,
        isFavorite: true,
        hoursAgo: 48,
        priority: 'medium'
      },
      {
        type: 'warning',
        title: 'Transação falhou',
        message: 'Sua tentativa de mint de NFT falhou. Verifique se você tem ETH suficiente para gas.',
        isRead: false,
        isFavorite: false,
        hoursAgo: 6,
        priority: 'high'
      }
    ];
    
    for (const notif of notifications) {
      const timestamp = new Date(Date.now() - (notif.hoursAgo * 60 * 60 * 1000));
      
      await prisma.notification.create({
        data: {
          sender: 'coinage',
          title: notif.title,
          message: notif.message,
          type: notif.type,
          priority: notif.priority,
          isRead: notif.isRead,
          isActive: true,
          userId: ivanUser.id,
          isFavorite: notif.isFavorite,
          readDate: notif.isRead ? new Date(timestamp.getTime() + (30 * 60 * 1000)) : null,
          createdAt: timestamp,
          metadata: {
            network: networkName,
            category: notif.type,
            source: 'system'
          }
        }
      });
      
      console.log(`✅ Notificação criada: ${notif.title} (${notif.isRead ? 'lida' : 'não lida'})`);
    }
    
    console.log(`✅ Total de ${notifications.length} notificações criadas para Ivan`);

    // ========================================
    // RESUMO FINAL
    // ========================================
    // ========================================
    // 10. CRIAR USER ACTIONS (HISTÓRICO DE AÇÕES)
    // ========================================
    console.log('\n📋 Criando histórico de ações do usuário...');
    
    const userActions = [
      { action: 'login', description: 'Login realizado com sucesso', hoursAgo: 0.5 },
      { action: 'transaction_created', description: 'Nova transação criada', hoursAgo: 2 },
      { action: 'profile_updated', description: 'Perfil atualizado', hoursAgo: 24 },
      { action: 'security_settings', description: '2FA ativado', hoursAgo: 168 },
      { action: 'first_login', description: 'Primeiro acesso à plataforma', hoursAgo: 240 }
    ];
    
    for (const action of userActions) {
      const timestamp = new Date(Date.now() - (action.hoursAgo * 60 * 60 * 1000));
      
      await prisma.userAction.create({
        data: {
          userId: ivanUser.id,
          action: action.action,
          description: action.description,
          metadata: {
            network: networkName,
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            ipAddress: '192.168.1.100'
          },
          createdAt: timestamp
        }
      });
    }
    
    console.log(`✅ ${userActions.length} ações de usuário criadas`);
    
    // ========================================
    // RESUMO FINAL COMPLETO
    // ========================================
    console.log('\n🎉 SEED COMPLETO EXECUTADO COM SUCESSO!');
    console.log(`\n🌍 NETWORK: ${networkName.toUpperCase()}`);
    console.log('\n📊 RESUMO COMPLETO DOS DADOS CRIADOS:');
    console.log('🏢 Empresas: 2 (Coinage + Navi)');
    console.log('👥 Usuários: 3 (Ivan + 2 dumb users)');
    console.log('🔗 Relações User-Company: 5');
    console.log('🎨 Company Brandings: 2');
    console.log(`💸 Transações para Ivan: ${transactions.length} (histórico completo)`);
    console.log(`💼 Portfolio: 1 com ${balances.length} tokens`);
    console.log(`💰 Earnings para Ivan: ${earningsHistory.length} (múltiplas fontes)`);
    console.log(`💳 Transações PIX: ${pixTransactions.length}`);
    console.log(`🔔 Notificações para Ivan: ${notifications.length} (sistema completo)`);
    console.log(`📋 Ações de usuário: ${userActions.length}`);
    
    console.log('\n👤 CREDENCIAIS DE ACESSO:');
    console.log('   🔑 Ivan Alberton (SUPER_ADMIN na Navi, ADMIN na Coinage):');
    console.log(`      Email: ivan.alberton@navi.inf.br`);
    console.log(`      Senha: ${ivanPassword}`);
    console.log(`      Carteira ${networkName}: ${isTestnet ? '0x7B5A73C4c72f8B2D5B9b8C4F3f8E5A2D1C6B9E8F' : '0x5528C065931f523CA9F3a6e49a911896fb1D2e6f'}`);
    console.log('   🔑 Usuário Teste 1 (USER na Coinage):');
    console.log(`      Email: user1@coinage.com`);
    console.log(`      Senha: ${dumb1Password}`);
    console.log('   🔑 Usuário Teste 2 (USER na Coinage):');
    console.log(`      Email: user2@coinage.com`);
    console.log(`      Senha: ${dumb2Password}`);

    console.log('\n💼 PORTFÓLIO IVAN:');
    console.log(`   💰 Valor total: $${isTestnet ? '12,567.89' : '28,945.67'}`);
    console.log(`   🪙 ETH: ${isTestnet ? '4.567' : '8.234'} ($${isTestnet ? '6,850.50' : '20,585.00'})`);
    console.log(`   💵 USDT: ${isTestnet ? '3,200.00' : '5,500.00'} ($${isTestnet ? '3,200.00' : '5,500.00'})`);
    console.log(`   ₿ BTC: ${isTestnet ? '0.125' : '0.078'} ($${isTestnet ? '2,517.39' : '2,360.67'})`);
    console.log(`   ⬡ MATIC: ${isTestnet ? '1,500.00' : '2,200.00'} ($${isTestnet ? '1,275.00' : '1,870.00'})`);
    
    console.log('\n📊 EXPERIÊNCIA COMPLETA IVAN:');
    console.log(`   📈 Total earnings: $${totalEarnings.toFixed(2)}`);
    console.log(`   🔔 Notificações não lidas: ${notifications.filter(n => !n.isRead).length}`);
    console.log(`   ✅ Transações confirmadas: ${transactions.filter(t => t.status === 'confirmed').length}`);
    console.log(`   ⏳ Transações pendentes: ${transactions.filter(t => t.status === 'pending').length}`);
    console.log(`   ❌ Transações falhadas: ${transactions.filter(t => t.status === 'failed').length}`);

    console.log('\n🎨 BRANDINGS:');
    console.log(`   🟦 Navi: Logo em /assets/images/companies/navi.png`);
    console.log(`   🟩 Coinage: Logo em /assets/images/companies/coinage.png`);
    
    console.log('\n🚀 PRÓXIMOS PASSOS:');
    console.log(`   1. Acesse: http://localhost:3000/login/navi`);
    console.log(`   2. Use as credenciais do Ivan para fazer login`);
    console.log(`   3. Explore o dashboard completo com dados reais`);
    console.log(`   4. Teste todas as funcionalidades da plataforma`);

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
    console.log('\n✨ Seed executado com sucesso! Ivan tem agora uma experiência completa.');
    process.exit(0);
  }).catch((error) => {
    console.error('❌ Erro durante o seed:', error);
    process.exit(1);
  });
}

module.exports = { seedBasicData };