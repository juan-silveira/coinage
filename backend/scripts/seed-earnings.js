const { PrismaClient } = require('../src/generated/prisma');
const prisma = new PrismaClient();

// Dados de exemplo para earnings
const sampleEarnings = [
  // AZE-t - Azore Testnet
  {
    tokenSymbol: 'AZE-t',
    tokenName: 'Azore',
    amount: 5.42342017,
    quote: 2.50,
    network: 'testnet',
    transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    distributionDate: new Date('2025-01-15'),
  },
  {
    tokenSymbol: 'AZE-t',
    tokenName: 'Azore',
    amount: 3.38451203,
    quote: 2.50,
    network: 'testnet',
    transactionHash: '0x2345678901bcdef12345678901bcdef12345678901bcdef12345678901bcdef',
    distributionDate: new Date('2025-01-10'),
  },
  {
    tokenSymbol: 'AZE-t',
    tokenName: 'Azore',
    amount: 1.51234567,
    quote: 2.50,
    network: 'testnet',
    transactionHash: '0x3456789012cdef123456789012cdef123456789012cdef123456789012cdef',
    distributionDate: new Date('2025-01-05'),
  },
  {
    tokenSymbol: 'AZE-t',
    tokenName: 'Azore',
    amount: 3.39876543,
    quote: 2.50,
    network: 'testnet',
    transactionHash: '0x4567890123def1234567890123def1234567890123def1234567890123def',
    distributionDate: new Date('2024-12-31'),
  },

  // STT - Stake Token Test
  {
    tokenSymbol: 'STT',
    tokenName: 'Stake Token',
    amount: 17.5000012,
    quote: 0.01,
    network: 'testnet',
    transactionHash: '0x5678901234ef12345678901234ef12345678901234ef12345678901234ef',
    distributionDate: new Date('2025-01-14'),
  },
  {
    tokenSymbol: 'STT',
    tokenName: 'Stake Token',
    amount: 120.7500025,
    quote: 0.01,
    network: 'testnet',
    transactionHash: '0x6789012345f123456789012345f123456789012345f123456789012345f',
    distributionDate: new Date('2025-01-09'),
  },
  {
    tokenSymbol: 'STT',
    tokenName: 'Stake Token',
    amount: 87.2500015,
    quote: 0.01,
    network: 'testnet',
    transactionHash: '0x789012345612345678901234561234567890123456123456789012345612',
    distributionDate: new Date('2025-01-04'),
  },
  {
    tokenSymbol: 'STT',
    tokenName: 'Stake Token',
    amount: 246.1250035,
    quote: 0.01,
    network: 'testnet',
    transactionHash: '0x890123456723456789012345672345678901234567234567890123456723',
    distributionDate: new Date('2024-12-30'),
  },

  // cBRL - Coinage Real Brasil
  {
    tokenSymbol: 'cBRL',
    tokenName: 'Coinage Real Brasil',
    amount: 1.33,
    quote: 0.75,
    network: 'testnet',
    transactionHash: '0x901234567834567890123456783456789012345678345678901234567834',
    distributionDate: new Date('2025-01-12'),
  },
  {
    tokenSymbol: 'cBRL',
    tokenName: 'Coinage Real Brasil',
    amount: 1.15,
    quote: 0.75,
    network: 'testnet',
    transactionHash: '0xa012345678945678901234567894567890123456789456789012345678945',
    distributionDate: new Date('2025-01-07'),
  },
  {
    tokenSymbol: 'cBRL',
    tokenName: 'Coinage Real Brasil',
    amount: 1.67,
    quote: 0.75,
    network: 'testnet',
    transactionHash: '0xb012345678956789012345678956789012345678956789012345678956',
    distributionDate: new Date('2025-01-02'),
  },
  {
    tokenSymbol: 'cBRL',
    tokenName: 'Coinage Real Brasil',
    amount: 1.42,
    quote: 0.75,
    network: 'testnet',
    transactionHash: '0xc012345678967890123456789678901234567896789012345678967',
    distributionDate: new Date('2024-12-28'),
  },

  // AZE - Azore Mainnet
  {
    tokenSymbol: 'AZE',
    tokenName: 'Azore',
    amount: 2.15000000,
    quote: 2.75,
    network: 'mainnet',
    transactionHash: '0xd012345678978901234567897890123456789789012345678978',
    distributionDate: new Date('2025-01-13'),
  },
  {
    tokenSymbol: 'AZE',
    tokenName: 'Azore',
    amount: 100.97000000,
    quote: 2.75,
    network: 'mainnet',
    transactionHash: '0xe012345678989012345678989012345678989012345678989',
    distributionDate: new Date('2025-01-08'),
  },
  {
    tokenSymbol: 'AZE',
    tokenName: 'Azore',
    amount: 200.43000000,
    quote: 2.75,
    network: 'mainnet',
    transactionHash: '0xf012345678990123456789901234567899012345678990',
    distributionDate: new Date('2025-01-03'),
  },
  {
    tokenSymbol: 'AZE',
    tokenName: 'Azore',
    amount: 188.88000000,
    quote: 2.75,
    network: 'mainnet',
    transactionHash: '0x0012345678901234567890123456789012345678901234567890',
    distributionDate: new Date('2024-12-29'),
  },
];

async function seedEarnings() {
  try {
    console.log('🌱 Iniciando seed de earnings...');

    // Primeiro, vamos obter um usuário existente para associar os earnings
    const user = await prisma.user.findFirst({
      where: { isActive: true },
      select: { id: true, email: true }
    });

    if (!user) {
      console.error('❌ Nenhum usuário ativo encontrado. Crie um usuário primeiro.');
      return;
    }

    console.log(`👤 Usando usuário: ${user.email}`);

    // Limpar earnings existentes (opcional)
    const deleteCount = await prisma.earnings.deleteMany({
      where: { userId: user.id }
    });
    console.log(`🗑️  Removidos ${deleteCount.count} earnings existentes`);

    // Inserir novos earnings
    const earningsData = sampleEarnings.map(earning => ({
      ...earning,
      userId: user.id,
    }));

    const createdEarnings = await prisma.earnings.createMany({
      data: earningsData,
    });

    console.log(`✅ Criados ${createdEarnings.count} earnings com sucesso!`);

    // Verificar se foram criados
    const totalEarnings = await prisma.earnings.count({
      where: { userId: user.id }
    });

    console.log(`📊 Total de earnings no banco: ${totalEarnings}`);

    // Mostrar estatísticas
    const earningsByToken = await prisma.earnings.groupBy({
      by: ['tokenSymbol'],
      where: { userId: user.id },
      _count: { id: true },
      _sum: { amount: true }
    });

    console.log('\n📈 Estatísticas por token:');
    earningsByToken.forEach(token => {
      console.log(`  ${token.tokenSymbol}: ${token._count.id} proventos, ${parseFloat(token._sum.amount || 0).toFixed(6)} tokens`);
    });

  } catch (error) {
    console.error('❌ Erro durante o seed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o seed se o arquivo for chamado diretamente
if (require.main === module) {
  seedEarnings();
}

module.exports = { seedEarnings };
