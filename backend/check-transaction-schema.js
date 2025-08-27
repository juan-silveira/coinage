const prismaConfig = require('./src/config/prisma');

async function checkTransactionSchema() {
  try {
    console.log('🔍 Verificando schema de transações...');
    
    // Inicializar Prisma
    await prismaConfig.initialize();
    const prisma = prismaConfig.getPrisma();
    console.log('✅ Prisma inicializado');
    
    // Buscar uma transação existente para ver o schema
    const existingTransaction = await prisma.transaction.findFirst({
      take: 1
    });
    
    if (existingTransaction) {
      console.log('📄 Exemplo de transação existente:');
      console.log('   ID:', existingTransaction.id);
      console.log('   User ID:', existingTransaction.userId);
      console.log('   Company ID:', existingTransaction.companyId);
      console.log('   Transaction Type:', existingTransaction.transactionType);
      console.log('   Status:', existingTransaction.status);
      console.log('   Network:', existingTransaction.network);
    } else {
      console.log('❌ Nenhuma transação encontrada no banco');
    }
    
    // Buscar usuário Ivan para obter companyId
    const user = await prisma.user.findUnique({
      where: { id: '9f5051e3-58fa-4bde-9cac-199effeea35e' },
      include: {
        userCompanies: {
          include: {
            company: true
          }
        }
      }
    });
    
    if (user && user.userCompanies.length > 0) {
      console.log('👤 Usuário encontrado com empresa:');
      console.log(`   Nome: ${user.name}`);
      console.log(`   Empresa: ${user.userCompanies[0].company.name}`);
      console.log(`   Company ID: ${user.userCompanies[0].company.id}`);
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

checkTransactionSchema();