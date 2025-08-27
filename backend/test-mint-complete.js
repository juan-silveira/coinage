const MintTransactionService = require('./src/services/mintTransaction.service');
const prismaConfig = require('./src/config/prisma');

async function testMintComplete() {
  try {
    console.log('🔍 Testando processo completo de mint...');
    
    // Inicializar Prisma
    await prismaConfig.initialize();
    const prisma = prismaConfig.getPrisma();
    console.log('✅ Prisma inicializado');
    
    const mintService = new MintTransactionService();
    
    // Simular parâmetros reais
    const depositTransactionId = 'deposit-real-' + Date.now();
    const userId = '9f5051e3-58fa-4bde-9cac-199effeea35e'; // Ivan's ID
    const amount = '25';
    const recipientAddress = '0x5528C065931f523CA9F3a6e49a911896fb1D2e6f';
    
    console.log(`📋 Criando mint transaction:
    - Depósito: ${depositTransactionId}
    - Usuário: ${userId}
    - Valor: ${amount} cBRL
    - Destinatário: ${recipientAddress}`);
    
    // Criar transação de mint
    const mintTransaction = await mintService.createMintTransaction(
      depositTransactionId,
      userId,
      amount,
      recipientAddress
    );
    
    console.log('✅ Mint transaction criada!');
    console.log('📝 ID:', mintTransaction.id);
    console.log('🎯 Function Name:', mintTransaction.functionName);
    console.log('📍 To Address:', mintTransaction.toAddress);
    console.log('🔄 Status:', mintTransaction.status);
    
    // Verificar se foi salva corretamente
    const savedTransaction = await prisma.transaction.findUnique({
      where: { id: mintTransaction.id }
    });
    
    if (savedTransaction) {
      console.log('\n✅ Verificação no banco:');
      console.log('   Function Name:', savedTransaction.functionName);
      console.log('   Transaction Type:', savedTransaction.transactionType);
      console.log('   To Address:', savedTransaction.toAddress);
      console.log('   Network:', savedTransaction.network);
      console.log('   Status:', savedTransaction.status);
      console.log('   Metadata:', JSON.stringify(savedTransaction.metadata, null, 2));
    }
    
    // Buscar por depositTransactionId
    const foundByDeposit = await mintService.getMintByDepositId(depositTransactionId);
    
    if (foundByDeposit) {
      console.log('\n✅ Busca por depósito funcionando!');
      console.log('   Encontrado ID:', foundByDeposit.id);
    } else {
      console.log('❌ Não encontrou por depositTransactionId');
    }
    
    console.log('\n🎉 Teste completo finalizado com sucesso!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

testMintComplete();