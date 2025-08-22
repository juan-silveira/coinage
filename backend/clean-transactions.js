require('dotenv').config({ path: '.env.testnet' });
const prismaConfig = require('./src/config/prisma');

async function cleanTransactions() {
  try {
    console.log('🧹 Limpando tabela transactions...');
    
    await prismaConfig.initialize();
    const prisma = prismaConfig.getPrisma();
    
    // Deletar todas as transações
    const deletedCount = await prisma.transaction.deleteMany({});
    
    console.log(`✅ ${deletedCount.count} transações removidas`);
    
    // Mostrar contagem atual
    const currentCount = await prisma.transaction.count();
    console.log(`📊 Transações restantes: ${currentCount}`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erro ao limpar transações:', error);
    process.exit(1);
  }
}

cleanTransactions();