require('dotenv').config({ path: '.env.testnet' });
const prismaConfig = require('./src/config/prisma');
const DepositService = require('./src/services/deposit.service');

async function testMintFix() {
  try {
    console.log('🔧 Testando correção do MINT com TX_HASH salvo no banco');
    console.log('=' .repeat(60));
    
    // Inicializar serviços
    await prismaConfig.initialize();
    const prisma = prismaConfig.getPrisma();
    const depositService = new DepositService();
    
    const userId = '9f5051e3-58fa-4bde-9cac-199effeea35e'; // Ivan
    const amount = '42.30';
    
    // PASSO 1: Criar depósito
    console.log('\\n📥 PASSO 1: Criando depósito...');
    const deposit = await depositService.initiateDeposit(amount, userId);
    console.log(`✅ Depósito criado:
    - ID: ${deposit.transactionId}
    - Valor: R$ ${amount}
    - Status: ${deposit.status}`);
    
    // PASSO 2: Pular simulação de PIX para focar no mint
    console.log('\\n💳 PASSO 2: Mantendo depósito como pendente para teste do confirmDeposit...');
    
    // PASSO 3: Executar mint através do confirmDeposit (método corrigido)
    console.log('\\n🏭 PASSO 3: Executando confirmDeposit (que irá criar e executar o mint)...');
    
    // Dados mockados para o depósito
    const mockDepositTxHash = `0x${Math.random().toString(16).substr(2, 64)}`;
    const mockBlockNumber = Math.floor(Math.random() * 1000000) + 1;
    const mockGasUsed = Math.floor(Math.random() * 100000) + 21000;
    
    // Confirmar depósito - isso deve criar automaticamente a transação de mint
    const confirmedDeposit = await depositService.confirmDeposit(
      deposit.transactionId,
      mockDepositTxHash,
      mockBlockNumber,
      mockGasUsed
    );
    
    console.log(`✅ Mint executado via confirmDeposit!`);
    
    // PASSO 4: Verificar se ambas transações foram salvas
    console.log('\\n🔍 PASSO 4: Verificando transações no banco...');
    
    // Verificar transação de depósito
    const depositTx = await prisma.transaction.findUnique({
      where: { id: deposit.transactionId }
    });
    
    console.log(`📝 DEPÓSITO:
    - ID: ${depositTx.id.substring(0, 8)}...
    - Tipo: ${depositTx.transactionType}
    - Status: ${depositTx.status}
    - TX Hash: ${depositTx.txHash || 'Não salvo'}
    - Block: ${depositTx.blockNumber || 'N/A'}`);
    
    // Verificar transação de mint
    const mintTx = await prisma.transaction.findFirst({
      where: {
        transactionType: 'contract_call',
        functionName: 'mint',
        metadata: {
          path: ['depositTransactionId'],
          equals: deposit.transactionId
        }
      }
    });
    
    if (mintTx) {
      console.log(`🪙 MINT:
    - ID: ${mintTx.id.substring(0, 8)}...
    - Tipo: ${mintTx.transactionType}
    - Function: ${mintTx.functionName}
    - Status: ${mintTx.status}
    - TX Hash: ${mintTx.txHash || 'Não salvo ❌'}
    - Block: ${mintTx.blockNumber || 'N/A'}
    - Gas Used: ${mintTx.gasUsed || 'N/A'}
    - To Address: ${mintTx.toAddress}`);
      
      // Verificar se tem dados da blockchain na metadata
      if (mintTx.metadata && mintTx.metadata.mintResult) {
        console.log(`📊 Dados do blockchain na metadata:
    - TX Hash: ${mintTx.metadata.mintResult.transactionHash}
    - Block: ${mintTx.metadata.mintResult.blockNumber}
    - Gas: ${mintTx.metadata.mintResult.gasUsed}
    - Explorer: ${mintTx.metadata.mintResult.explorerUrl}`);
      }
    } else {
      console.log('❌ Transação de mint não encontrada!');
    }
    
    // PASSO 5: Resumo final
    console.log('\\n' + '=' .repeat(60));
    console.log('📋 RESUMO DO TESTE:');
    
    const hasTxHashInDepositField = depositTx.txHash ? '✅' : '❌';
    const hasTxHashInMintField = mintTx && mintTx.txHash ? '✅' : '❌';
    const hasMintMetadata = mintTx && mintTx.metadata && mintTx.metadata.mintResult ? '✅' : '❌';
    
    console.log(`${hasTxHashInDepositField} TX Hash salvo no campo da transação de DEPÓSITO`);
    console.log(`${hasTxHashInMintField} TX Hash salvo no campo da transação de MINT`);
    console.log(`${hasMintMetadata} Metadata da blockchain salva na transação de MINT`);
    console.log(`${mintTx ? '✅' : '❌'} Transação de mint criada separadamente`);
    
    if (hasTxHashInMintField === '✅' && hasMintMetadata === '✅') {
      console.log('\\n🎉 CORREÇÃO FUNCIONOU! TX_HASH está sendo salvo corretamente!');
    } else {
      console.log('\\n⚠️ Ainda há problemas com o salvamento do TX_HASH');
    }
    
    console.log('=' .repeat(60));
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
    process.exit(1);
  }
}

testMintFix();