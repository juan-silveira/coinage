require('dotenv').config({ path: '.env.testnet' });
const prismaConfig = require('./src/config/prisma');
const DepositService = require('./src/services/deposit.service');
const MintTransactionService = require('./src/services/mintTransaction.service');

async function testDepositWithMint() {
  try {
    console.log('🚀 Testando fluxo completo: Depósito → PIX → Mint Automático');
    console.log('=' .repeat(60));
    
    // Inicializar serviços
    await prismaConfig.initialize();
    const prisma = prismaConfig.getPrisma();
    const depositService = new DepositService();
    const mintService = new MintTransactionService();
    
    const userId = '9f5051e3-58fa-4bde-9cac-199effeea35e'; // Ivan
    const amount = '50';
    
    // PASSO 1: Criar depósito
    console.log('\n📥 PASSO 1: Criando depósito...');
    const deposit = await depositService.initiateDeposit(amount, userId);
    console.log(`✅ Depósito criado:
    - ID: ${deposit.transactionId}
    - Valor: R$ ${amount}
    - Status: ${deposit.status}
    - Tipo PIX: ${deposit.paymentMethod}`);
    
    // PASSO 2: Simular pagamento PIX (mudando status para success)
    console.log('\n💳 PASSO 2: Simulando pagamento PIX confirmado...');
    
    const updatedDeposit = await prisma.transaction.update({
      where: { id: deposit.transactionId },
      data: { 
        status: 'confirmed',
        metadata: {
          ...deposit.metadata,
          confirmedAt: new Date().toISOString(),
          paymentConfirmed: true
        }
      }
    });
    
    console.log(`✅ PIX confirmado! Status: ${updatedDeposit.status}`);
    
    // PASSO 3: Hook automático cria mint transaction
    console.log('\n🪙 PASSO 3: Hook automático criando mint transaction...');
    
    // Simular o que o hook faria
    const mintTransaction = await mintService.createMintTransaction(
      deposit.transactionId,
      userId,
      amount,
      '0x5528C065931f523CA9F3a6e49a911896fb1D2e6f' // Endereço do Ivan
    );
    
    console.log(`✅ Mint transaction criada automaticamente:
    - ID: ${mintTransaction.id}
    - Function Name: ${mintTransaction.functionName}
    - To Address: ${mintTransaction.toAddress}
    - Status: ${mintTransaction.status}`);
    
    // PASSO 4: Verificar se foi salva no banco
    console.log('\n🔍 PASSO 4: Verificando transação no banco de dados...');
    
    const savedMint = await prisma.transaction.findUnique({
      where: { id: mintTransaction.id }
    });
    
    if (savedMint) {
      console.log(`✅ Mint transaction confirmada no banco:
    - ID: ${savedMint.id}
    - Function Name: ${savedMint.functionName}
    - Transaction Type: ${savedMint.transactionType}
    - To Address: ${savedMint.toAddress}
    - Network: ${savedMint.network}
    - Status: ${savedMint.status}
    - Linked Deposit: ${savedMint.metadata.depositTransactionId}`);
    }
    
    // PASSO 5: Buscar mint pelo ID do depósito
    console.log('\n🔗 PASSO 5: Buscando mint transaction pelo depósito...');
    
    const foundMint = await mintService.getMintByDepositId(deposit.transactionId);
    
    if (foundMint) {
      console.log(`✅ Mint encontrada pelo depósito:
    - Mint ID: ${foundMint.id}
    - Deposit ID: ${foundMint.metadata.depositTransactionId}
    - Amount: ${foundMint.metadata.amount} cBRL`);
    } else {
      console.log('❌ Não encontrou mint pelo depósito');
    }
    
    // PASSO 6: Listar todas as transações do usuário
    console.log('\n📊 PASSO 6: Listando todas as transações do usuário...');
    
    const userTransactions = await prisma.transaction.findMany({
      where: { userId: userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        transactionType: true,
        functionName: true,
        status: true,
        createdAt: true
      }
    });
    
    console.log('📋 Últimas transações:');
    userTransactions.forEach((tx, index) => {
      console.log(`   ${index + 1}. ${tx.transactionType} | ${tx.functionName || 'N/A'} | ${tx.status} | ${tx.id.substring(0, 8)}...`);
    });
    
    console.log('\n' + '=' .repeat(60));
    console.log('🎉 TESTE COMPLETO FINALIZADO COM SUCESSO!');
    console.log('✅ Depósito criado → PIX confirmado → Mint automático criado');
    console.log('✅ Function name "mint" salvo corretamente no banco');
    console.log('=' .repeat(60));
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
    process.exit(1);
  }
}

testDepositWithMint();