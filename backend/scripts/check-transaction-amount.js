const { PrismaClient } = require('../src/generated/prisma');
const prisma = new PrismaClient();

async function checkTransactionAmount() {
  try {
    console.log('🔍 Verificando transações recentes de stake...\n');
    
    // Buscar as 5 transações mais recentes de stake
    const transactions = await prisma.transaction.findMany({
      where: {
        functionName: 'stake'
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5,
      select: {
        id: true,
        txHash: true,
        functionName: true,
        amount: true,
        net_amount: true,
        currency: true,
        metadata: true,
        createdAt: true,
        fromAddress: true,
        contractAddress: true
      }
    });
    
    if (transactions.length === 0) {
      console.log('❌ Nenhuma transação de stake encontrada no banco');
      return;
    }
    
    console.log(`✅ Encontradas ${transactions.length} transações de stake:\n`);
    
    transactions.forEach((tx, index) => {
      console.log(`${index + 1}. Transação ${tx.id}`);
      console.log(`   Hash: ${tx.txHash}`);
      console.log(`   Função: ${tx.functionName}`);
      console.log(`   📊 Amount: ${tx.amount} ${tx.currency || 'TOKEN'}`);
      console.log(`   📊 Net Amount: ${tx.net_amount} ${tx.currency || 'TOKEN'}`);
      console.log(`   De: ${tx.fromAddress}`);
      console.log(`   Contrato: ${tx.contractAddress}`);
      console.log(`   Data: ${tx.createdAt}`);
      
      // Mostrar parâmetros originais se disponíveis
      if (tx.metadata && tx.metadata.params) {
        console.log(`   Parâmetros: [${tx.metadata.params.join(', ')}]`);
      }
      console.log('');
    });
    
    // Verificar especificamente a transação mais recente
    const latestTx = transactions[0];
    if (parseFloat(latestTx.amount) > 0) {
      console.log('🎉 SUCESSO! A transação mais recente tem valor > 0');
      console.log(`   Valor registrado: ${latestTx.amount}`);
    } else {
      console.log('❌ PROBLEMA! A transação mais recente ainda tem valor 0');
      console.log(`   Valor registrado: ${latestTx.amount}`);
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar transações:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTransactionAmount().catch(console.error);