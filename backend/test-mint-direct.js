const MintTransactionService = require('./src/services/mintTransaction.service');
const prismaConfig = require('./src/config/prisma');

async function testMintDirect() {
  try {
    console.log('🔍 Testando criação de mint transaction diretamente...');
    
    // Inicializar Prisma
    await prismaConfig.initialize();
    console.log('✅ Prisma inicializado');
    
    const mintService = new MintTransactionService();
    
    // Simular parâmetros de uma transação de mint
    const depositTransactionId = 'test-deposit-' + Date.now();
    const userId = '9f5051e3-58fa-4bde-9cac-199effeea35e'; // Ivan's ID
    const amount = '50';
    const recipientAddress = '0x5528C065931f523CA9F3a6e49a911896fb1D2e6f';
    
    console.log(`📋 Parâmetros:
    - depositTransactionId: ${depositTransactionId}
    - userId: ${userId}
    - amount: ${amount}
    - recipientAddress: ${recipientAddress}`);
    
    const mintTransaction = await mintService.createMintTransaction(
      depositTransactionId,
      userId,
      amount,
      recipientAddress
    );
    
    console.log('✅ Mint transaction criada com sucesso!');
    console.log('📝 Detalhes:', JSON.stringify(mintTransaction, null, 2));
    
    // Buscar a transação para verificar se foi salva
    const foundTransaction = await mintService.getMintByDepositId(depositTransactionId);
    console.log('🔍 Transação encontrada no banco:', !!foundTransaction);
    
    if (foundTransaction) {
      console.log('📄 Dados salvos:', JSON.stringify(foundTransaction, null, 2));
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

testMintDirect();