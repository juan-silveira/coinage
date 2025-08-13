const { PrismaClient } = require('../src/generated/prisma');
const prisma = new PrismaClient();

// Dados de exemplo para transactions com os novos tipos
const sampleTransactions = [
  // Transfer transactions
  {
    txHash: '0xa1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6',
    network: 'testnet',
    transactionType: 'transfer',
    status: 'confirmed',
    blockNumber: 1234567n,
    fromAddress: '0x1234567890123456789012345678901234567890',
    toAddress: '0x0987654321098765432109876543210987654321',
    value: '150750000000000000000', // 150.75 tokens
    gasPrice: '20000000000', // 20 gwei
    gasLimit: 21000n,
    gasUsed: 21000n,
    nonce: 42,
    confirmations: 12,
    submittedAt: new Date('2025-01-15T10:30:00Z'),
    confirmedAt: new Date('2025-01-15T10:31:00Z'),
    metadata: {
      tokenSymbol: 'AZE-t',
      tokenName: 'Azore',
      amount: -150.75,
      subType: 'debit'
    }
  },
  {
    txHash: '0xb3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8',
    network: 'testnet',
    transactionType: 'transfer',
    status: 'confirmed',
    blockNumber: 1234568n,
    fromAddress: '0x0987654321098765432109876543210987654321',
    toAddress: '0x1234567890123456789012345678901234567890',
    value: '1500000250000000000000000', // 1500000.25 tokens
    gasPrice: '20000000000',
    gasLimit: 21000n,
    gasUsed: 21000n,
    nonce: 43,
    confirmations: 11,
    submittedAt: new Date('2025-01-15T11:00:00Z'),
    confirmedAt: new Date('2025-01-15T11:01:00Z'),
    metadata: {
      tokenSymbol: 'STT',
      tokenName: 'Stake Token',
      amount: 1500000.25,
      subType: 'credit'
    }
  },

  // Deposit transactions
  {
    txHash: '0xb2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a1',
    network: 'testnet',
    transactionType: 'deposit',
    status: 'confirmed',
    blockNumber: 1234550n,
    fromAddress: '0x0000000000000000000000000000000000000000',
    toAddress: '0x1234567890123456789012345678901234567890',
    value: '250000000000000000000', // 250.0 tokens
    gasPrice: '25000000000',
    gasLimit: 50000n,
    gasUsed: 45000n,
    nonce: 40,
    confirmations: 25,
    submittedAt: new Date('2025-01-14T09:15:00Z'),
    confirmedAt: new Date('2025-01-14T09:16:30Z'),
    metadata: {
      tokenSymbol: 'cBRL',
      tokenName: 'Coinage Real Brasil',
      amount: 250.0,
      subType: 'credit'
    }
  },

  // Withdraw transactions
  {
    txHash: '0xc3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a1b2',
    network: 'testnet',
    transactionType: 'withdraw',
    status: 'confirmed',
    blockNumber: 1234540n,
    fromAddress: '0x1234567890123456789012345678901234567890',
    toAddress: '0x0000000000000000000000000000000000000000',
    value: '75500000000000000000', // 75.50 tokens
    gasPrice: '22000000000',
    gasLimit: 35000n,
    gasUsed: 32000n,
    nonce: 39,
    confirmations: 35,
    submittedAt: new Date('2025-01-13T14:20:00Z'),
    confirmedAt: new Date('2025-01-13T14:21:15Z'),
    metadata: {
      tokenSymbol: 'CNT',
      tokenName: 'Coinage Trade',
      amount: -75.50,
      subType: 'debit'
    }
  },

  // Stake transactions
  {
    txHash: '0xd4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a1b2c3',
    network: 'testnet',
    transactionType: 'stake',
    status: 'confirmed',
    blockNumber: 1234535n,
    fromAddress: '0x1234567890123456789012345678901234567890',
    toAddress: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    value: '500000000000000000000', // 500.0 tokens
    gasPrice: '30000000000',
    gasLimit: 80000n,
    gasUsed: 75000n,
    nonce: 38,
    confirmations: 40,
    submittedAt: new Date('2025-01-12T16:45:00Z'),
    confirmedAt: new Date('2025-01-12T16:47:30Z'),
    metadata: {
      tokenSymbol: 'MJD',
      tokenName: 'Meu Jurídico Digital',
      amount: -500.0,
      subType: 'debit'
    }
  },

  // Unstake transactions
  {
    txHash: '0xf6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a1b2c3d4e5',
    network: 'testnet',
    transactionType: 'unstake',
    status: 'confirmed',
    blockNumber: 1234525n,
    fromAddress: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    toAddress: '0x1234567890123456789012345678901234567890',
    value: '750000000000000000000000', // 750000.0 tokens
    gasPrice: '28000000000',
    gasLimit: 90000n,
    gasUsed: 85000n,
    nonce: 37,
    confirmations: 50,
    submittedAt: new Date('2025-01-10T12:30:00Z'),
    confirmedAt: new Date('2025-01-10T12:33:45Z'),
    metadata: {
      tokenSymbol: 'STT',
      tokenName: 'Stake Token',
      amount: 750000.0,
      subType: 'credit'
    }
  },

  // Exchange transactions (par de transações)
  {
    txHash: '0xe5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a1b2c3d4',
    network: 'testnet',
    transactionType: 'exchange',
    status: 'confirmed',
    blockNumber: 1234520n,
    fromAddress: '0x1234567890123456789012345678901234567890',
    toAddress: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    value: '200000000000000000000', // 200.0 tokens
    gasPrice: '35000000000',
    gasLimit: 120000n,
    gasUsed: 110000n,
    nonce: 36,
    confirmations: 55,
    submittedAt: new Date('2025-01-11T08:15:00Z'),
    confirmedAt: new Date('2025-01-11T08:18:20Z'),
    metadata: {
      tokenSymbol: 'AZE-t',
      tokenName: 'Azore',
      amount: -200.0,
      subType: 'debit',
      exchangeId: 'exchange_001'
    }
  },
  {
    txHash: '0xf6g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2',
    network: 'testnet',
    transactionType: 'exchange',
    status: 'confirmed',
    blockNumber: 1234521n,
    fromAddress: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    toAddress: '0x1234567890123456789012345678901234567890',
    value: '400000000000000000000', // 400.0 tokens
    gasPrice: '35000000000',
    gasLimit: 120000n,
    gasUsed: 110000n,
    nonce: 37,
    confirmations: 54,
    submittedAt: new Date('2025-01-11T08:18:30Z'),
    confirmedAt: new Date('2025-01-11T08:21:45Z'),
    metadata: {
      tokenSymbol: 'PCN',
      tokenName: 'Pratique Coin',
      amount: 400.0,
      subType: 'credit',
      exchangeId: 'exchange_001'
    }
  },

  // Stake reward transactions
  {
    txHash: '0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7',
    network: 'testnet',
    transactionType: 'stake_reward',
    status: 'confirmed',
    blockNumber: 1234515n,
    fromAddress: '0xcccccccccccccccccccccccccccccccccccccccc',
    toAddress: '0x1234567890123456789012345678901234567890',
    value: '25750000000000000000', // 25.75 tokens
    gasPrice: '18000000000',
    gasLimit: 60000n,
    gasUsed: 55000n,
    nonce: 35,
    confirmations: 60,
    submittedAt: new Date('2025-01-09T06:00:00Z'),
    confirmedAt: new Date('2025-01-09T06:02:30Z'),
    metadata: {
      tokenSymbol: 'AZE-t',
      tokenName: 'Azore',
      amount: 25.75,
      subType: 'credit',
      rewardType: 'staking'
    }
  },

  // Mais algumas transações para ter dados suficientes
  {
    txHash: '0x2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8',
    network: 'testnet',
    transactionType: 'deposit',
    status: 'confirmed',
    blockNumber: 1234510n,
    fromAddress: '0x0000000000000000000000000000000000000000',
    toAddress: '0x1234567890123456789012345678901234567890',
    value: '125250000000000000000', // 125.25 tokens
    gasPrice: '24000000000',
    gasLimit: 50000n,
    gasUsed: 47000n,
    nonce: 34,
    confirmations: 65,
    submittedAt: new Date('2025-01-09T15:30:00Z'),
    confirmedAt: new Date('2025-01-09T15:31:45Z'),
    metadata: {
      tokenSymbol: 'CNT',
      tokenName: 'Coinage Trade',
      amount: 125.25,
      subType: 'credit'
    }
  },

  {
    txHash: '0x3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9',
    network: 'testnet',
    transactionType: 'withdraw',
    status: 'confirmed',
    blockNumber: 1234505n,
    fromAddress: '0x1234567890123456789012345678901234567890',
    toAddress: '0x0000000000000000000000000000000000000000',
    value: '300000000000000000000', // 300.0 tokens
    gasPrice: '26000000000',
    gasLimit: 40000n,
    gasUsed: 38000n,
    nonce: 33,
    confirmations: 70,
    submittedAt: new Date('2025-01-08T11:20:00Z'),
    confirmedAt: new Date('2025-01-08T11:21:30Z'),
    metadata: {
      tokenSymbol: 'MJD',
      tokenName: 'Meu Jurídico Digital',
      amount: -300.0,
      subType: 'debit'
    }
  }
];

async function seedTransactions() {
  try {
    console.log('🌱 Iniciando seed de transactions...');

    // Primeiro, vamos obter um usuário e cliente existentes
    const user = await prisma.user.findFirst({
      where: { isActive: true },
      select: { id: true, email: true }
    });

    if (!user) {
      console.error('❌ Nenhum usuário ativo encontrado. Crie um usuário primeiro.');
      return;
    }

    const client = await prisma.client.findFirst({
      where: { isActive: true },
      select: { id: true, name: true }
    });

    if (!client) {
      console.error('❌ Nenhum cliente ativo encontrado. Crie um cliente primeiro.');
      return;
    }

    console.log(`👤 Usando usuário: ${user.email}`);
    console.log(`🏢 Usando cliente: ${client.name}`);

    // Limpar transactions existentes (opcional)
    const deleteCount = await prisma.transaction.deleteMany({
      where: { 
        userId: user.id,
        clientId: client.id
      }
    });
    console.log(`🗑️  Removidas ${deleteCount.count} transactions existentes`);

    // Inserir novas transactions
    const transactionsData = sampleTransactions.map(transaction => ({
      ...transaction,
      userId: user.id,
      clientId: client.id,
    }));

    const createdTransactions = await prisma.transaction.createMany({
      data: transactionsData,
    });

    console.log(`✅ Criadas ${createdTransactions.count} transactions com sucesso!`);

    // Verificar se foram criadas
    const totalTransactions = await prisma.transaction.count({
      where: { 
        userId: user.id,
        clientId: client.id
      }
    });

    console.log(`📊 Total de transactions no banco: ${totalTransactions}`);

    // Mostrar estatísticas
    const transactionsByType = await prisma.transaction.groupBy({
      by: ['transactionType'],
      where: { 
        userId: user.id,
        clientId: client.id
      },
      _count: { id: true }
    });

    console.log('\n📈 Estatísticas por tipo:');
    transactionsByType.forEach(type => {
      console.log(`  ${type.transactionType}: ${type._count.id} transações`);
    });

    const transactionsByStatus = await prisma.transaction.groupBy({
      by: ['status'],
      where: { 
        userId: user.id,
        clientId: client.id
      },
      _count: { id: true }
    });

    console.log('\n📊 Estatísticas por status:');
    transactionsByStatus.forEach(status => {
      console.log(`  ${status.status}: ${status._count.id} transações`);
    });

  } catch (error) {
    console.error('❌ Erro durante o seed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o seed se o arquivo for chamado diretamente
if (require.main === module) {
  seedTransactions();
}

module.exports = { seedTransactions };