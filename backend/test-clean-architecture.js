require('dotenv').config({ path: '.env.testnet' });
const prismaConfig = require('./src/config/prisma');
const DepositService = require('./src/services/deposit.service');

async function testCleanArchitecture() {
  try {
    console.log('🏗️ Testando NOVA ARQUITETURA LIMPA: PIX vs Blockchain');
    console.log('=' .repeat(70));
    
    // Inicializar serviços
    await prismaConfig.initialize();
    const prisma = prismaConfig.getPrisma();
    const depositService = new DepositService();
    
    const userId = '9f5051e3-58fa-4bde-9cac-199effeea35e'; // Ivan
    const amount = '25.75';
    
    // PASSO 1: Criar depósito PIX (transação financeira)
    console.log('\\n💳 PASSO 1: Criando depósito PIX...');
    const deposit = await depositService.initiateDeposit(amount, userId);
    console.log(`✅ Depósito PIX criado:
    - ID: ${deposit.transactionId}
    - Valor: R$ ${amount}
    - Status: ${deposit.status}
    - Tipo: FINANCEIRO (PIX)`);
    
    // PASSO 2: Confirmar PIX e disparar mint
    console.log('\\n🔄 PASSO 2: Confirmando PIX e criando mint automático...');
    
    const pixConfirmation = await depositService.confirmDeposit(
      deposit.transactionId,
      {
        pixId: `PIX-${Date.now()}`,
        payerDocument: '123.456.789-00',
        payerName: 'João Teste',
        paidAmount: parseFloat(amount)
      }
    );
    
    console.log(`✅ PIX confirmado e mint executado!`);
    
    // PASSO 3: Verificar ambas as transações
    console.log('\\n📊 PASSO 3: Analisando transações criadas...');
    
    // Verificar transação de depósito PIX
    const pixTransaction = await prisma.transaction.findUnique({
      where: { id: deposit.transactionId }
    });
    
    console.log(`\\n💳 TRANSAÇÃO PIX (Financeira):
    ├── ID: ${pixTransaction.id.substring(0, 8)}...
    ├── Tipo: ${pixTransaction.transactionType}
    ├── Status: ${pixTransaction.status}
    ├── Valor: R$ ${pixTransaction.amount}
    ├── Moeda: ${pixTransaction.currency}
    ├── Network: ${pixTransaction.network || 'N/A (correto!)'}
    ├── TX Hash: ${pixTransaction.txHash || 'N/A (correto!)'}
    ├── Contract: ${pixTransaction.contractAddress || 'N/A (correto!)'}
    └── Método Pagamento: ${pixTransaction.metadata?.paymentMethod}`);
    
    // Verificar transação de mint cBRL
    const mintTransaction = await prisma.transaction.findFirst({
      where: {
        transactionType: 'contract_call',
        functionName: 'mint',
        metadata: {
          path: ['depositTransactionId'],
          equals: deposit.transactionId
        }
      }
    });
    
    if (mintTransaction) {
      console.log(`\\n🪙 TRANSAÇÃO MINT (Blockchain):
    ├── ID: ${mintTransaction.id.substring(0, 8)}...
    ├── Tipo: ${mintTransaction.transactionType}
    ├── Status: ${mintTransaction.status}
    ├── Função: ${mintTransaction.functionName}
    ├── Valor: ${mintTransaction.amount} ${mintTransaction.currency}
    ├── Network: ${mintTransaction.network}
    ├── Contract: ${mintTransaction.contractAddress}
    ├── Para: ${mintTransaction.toAddress}
    ├── TX Hash: ${mintTransaction.txHash || 'Em processamento...'}
    ├── Block: ${mintTransaction.blockNumber || 'Aguardando...'}
    └── Gas: ${mintTransaction.gasUsed || 'Calculando...'}`);
      
      // Mostrar metadata detalhada se existir
      if (mintTransaction.metadata?.blockchainResult) {
        console.log(`\\n🔗 Dados da Blockchain:
    ├── Explorer: ${mintTransaction.metadata.blockchainResult.explorerUrl}
    ├── Confirmado: ${mintTransaction.metadata.blockchainResult.confirmedAt}
    └── Saldo: ${mintTransaction.metadata.mintDetails?.balanceIncrease} cBRL`);
      }
    } else {
      console.log('\\n❌ Transação de mint não encontrada');
    }
    
    // PASSO 4: Verificar link entre transações
    console.log('\\n🔗 PASSO 4: Verificando links entre transações...');
    
    const pixHasLinkToMint = pixTransaction.metadata?.linkedMint ? '✅' : '❌';
    const mintLinksToDeposit = mintTransaction?.metadata?.depositTransactionId === deposit.transactionId ? '✅' : '❌';
    
    console.log(`${pixHasLinkToMint} PIX aponta para MINT`);
    console.log(`${mintLinksToDeposit} MINT aponta para PIX`);
    
    // PASSO 5: Resumo da arquitetura
    console.log('\\n' + '=' .repeat(70));
    console.log('📋 RESUMO DA NOVA ARQUITETURA:');
    console.log('');
    
    const pixCorrect = !pixTransaction.txHash && !pixTransaction.contractAddress && pixTransaction.currency === 'BRL' ? '✅' : '❌';
    const mintCorrect = mintTransaction.txHash && mintTransaction.contractAddress && mintTransaction.currency === 'cBRL' ? '✅' : '❌';
    
    console.log(`${pixCorrect} PIX: Transação FINANCEIRA sem dados blockchain`);
    console.log(`${mintCorrect} MINT: Transação BLOCKCHAIN com contrato cBRL`);
    console.log(`${pixHasLinkToMint && mintLinksToDeposit ? '✅' : '❌'} LINK: Transações corretamente vinculadas`);
    
    if (pixCorrect === '✅' && mintCorrect === '✅') {
      console.log('\\n🎉 ARQUITETURA LIMPA FUNCIONANDO PERFEITAMENTE!');
      console.log('');
      console.log('🏗️ Separação correta:');
      console.log('   📱 PIX = Transação financeira (sem blockchain)');
      console.log('   🔗 MINT = Transação blockchain (com contrato)');
      console.log('   💎 Dados organizados e consistentes');
    } else {
      console.log('\\n⚠️ Ainda há ajustes necessários na arquitetura');
    }
    
    console.log('=' .repeat(70));
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
    process.exit(1);
  }
}

testCleanArchitecture();