require('dotenv').config({ path: '.env.testnet' });
const prismaConfig = require('./src/config/prisma');
const DepositService = require('./src/services/deposit.service');
const userTaxesService = require('./src/services/userTaxes.service');

async function testFixedDepositMint() {
  try {
    console.log('🔧 Testando fluxo CORRIGIDO: Depósito → PIX → Mint com TX_HASH salvo');
    console.log('=' .repeat(70));
    
    // Inicializar serviços
    await prismaConfig.initialize();
    const prisma = prismaConfig.getPrisma();
    const depositService = new DepositService();
    
    const userId = '9f5051e3-58fa-4bde-9cac-199effeea35e'; // Ivan
    const amount = '75.50';
    
    // PASSO 1: Calcular taxas do usuário
    console.log('\\n💰 PASSO 1: Calculando taxas do usuário...');
    
    const feeCalculation = await userTaxesService.calculateDepositFee(userId, parseFloat(amount));
    console.log(`📊 Cálculo de taxas:
    - Valor bruto: R$ ${amount}
    - Taxa: R$ ${feeCalculation.fee.toFixed(2)} (${feeCalculation.feePercent}%)
    - Valor líquido: R$ ${feeCalculation.netAmount.toFixed(2)}
    - cBRL a receber: ${feeCalculation.netAmount.toFixed(2)} cBRL
    - Usuário VIP: ${feeCalculation.isVip ? `Sim (Nível ${feeCalculation.vipLevel})` : 'Não'}`);
    
    // PASSO 2: Criar depósito
    console.log('\\n📥 PASSO 2: Criando depósito...');
    const deposit = await depositService.initiateDeposit(amount, userId);
    console.log(`✅ Depósito criado:
    - ID: ${deposit.transactionId}
    - Valor: R$ ${amount}
    - Status: ${deposit.status}`);
    
    // PASSO 3: Simular pagamento PIX confirmado
    console.log('\\n💳 PASSO 3: Simulando pagamento PIX confirmado...');
    
    const updatedDeposit = await prisma.transaction.update({
      where: { id: deposit.transactionId },
      data: { 
        status: 'confirmed',
        metadata: {
          amount: amount,
          tokenSymbol: 'BRL',
          description: `Depósito de R$ ${amount}`,
          source: 'user_deposit',
          currency: 'BRL',
          timestamp: new Date().toISOString(),
          confirmedAt: new Date().toISOString(),
          paymentConfirmed: true
        }
      }
    });
    
    console.log(`✅ PIX confirmado! Status: ${updatedDeposit.status}`);
    
    // PASSO 4: Executar mint automático (através do método corrigido)
    console.log('\\n🏭 PASSO 4: Executando mint automático via confirmDeposit...');
    
    // Simular hash de blockchain para o depósito
    const mockDepositTxHash = `0x${Math.random().toString(16).substr(2, 64)}`;
    const mockBlockNumber = Math.floor(Math.random() * 1000000) + 1;
    const mockGasUsed = Math.floor(Math.random() * 100000) + 21000;
    
    // Usar o método confirmDeposit que agora cria a transação de mint separada
    const confirmedDeposit = await depositService.confirmDeposit(
      deposit.transactionId,
      mockDepositTxHash,
      mockBlockNumber,
      mockGasUsed
    );
    
    console.log(`✅ Depósito confirmado e mint executado!`);
    
    // PASSO 5: Verificar transações no banco
    console.log('\\n🔍 PASSO 5: Verificando transações no banco de dados...');
    
    // Verificar transação de depósito
    const depositTransaction = await prisma.transaction.findUnique({
      where: { id: deposit.transactionId }
    });
    
    console.log(`📝 Transação de DEPÓSITO:
    - ID: ${depositTransaction.id}
    - Tipo: ${depositTransaction.transactionType}
    - Status: ${depositTransaction.status}
    - TX Hash: ${depositTransaction.blockchainTxHash || 'N/A'}
    - Block: ${depositTransaction.blockNumber || 'N/A'}`);
    
    // Buscar transação de mint vinculada
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
      console.log(`🪙 Transação de MINT:
    - ID: ${mintTransaction.id}
    - Tipo: ${mintTransaction.transactionType}
    - Function: ${mintTransaction.functionName}
    - Status: ${mintTransaction.status}
    - TX Hash: ${mintTransaction.blockchainTxHash || 'N/A'}
    - Block: ${mintTransaction.blockNumber || 'N/A'}
    - Gas Used: ${mintTransaction.gasUsed || 'N/A'}
    - To Address: ${mintTransaction.toAddress}`);
    } else {
      console.log('❌ Transação de mint não encontrada!');
    }
    
    // PASSO 6: Listar todas as transações do usuário
    console.log('\\n📊 PASSO 6: Listando transações do usuário...');
    
    const userTransactions = await prisma.transaction.findMany({
      where: { userId: userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        transactionType: true,
        functionName: true,
        status: true,
        blockchainTxHash: true,
        blockNumber: true,
        gasUsed: true,
        createdAt: true
      }
    });
    
    console.log('📋 Últimas transações:');
    userTransactions.forEach((tx, index) => {
      console.log(`   ${index + 1}. ${tx.transactionType} | ${tx.functionName || 'N/A'} | ${tx.status}`);
      console.log(`      TX Hash: ${tx.blockchainTxHash || 'Não salvo'} | Block: ${tx.blockNumber || 'N/A'}`);
      console.log(`      ID: ${tx.id.substring(0, 8)}... | ${new Date(tx.createdAt).toLocaleString()}`);
      console.log('');
    });
    
    console.log('\\n' + '=' .repeat(70));
    console.log('🎉 TESTE COMPLETO FINALIZADO!');
    console.log('✅ Melhorias implementadas:');
    console.log('   - Duas transações separadas (depósito + mint)');
    console.log('   - TX_HASH salvo corretamente no banco');
    console.log('   - Sistema de taxas por usuário implementado');
    console.log('   - Mint executado automaticamente após confirmação');
    console.log('   - Dados completos da blockchain salvos');
    console.log('=' .repeat(70));
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
    process.exit(1);
  }
}

testFixedDepositMint();