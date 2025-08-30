const { PrismaClient } = require('../src/generated/prisma');
const prisma = new PrismaClient();

/**
 * Script para padronizar transações de depósito e saque no banco de dados
 * Corrige inconsistências entre deposit e withdraw
 */

async function standardizeTransactions() {
  try {
    console.log('🔄 Iniciando padronização de transações...\n');

    // 1. Buscar todas as transações
    const transactions = await prisma.transaction.findMany({
      include: {
        user: true
      }
    });

    console.log(`📊 Total de transações encontradas: ${transactions.length}\n`);

    let depositsUpdated = 0;
    let withdrawsUpdated = 0;
    let errors = 0;

    // Endereços padrão do sistema
    const ADMIN_ADDRESS = process.env.ADMIN_WALLET_ADDRESS || '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb3';
    const CONTRACT_ADDRESS = process.env.CBRL_TOKEN_ADDRESS || '0x0A8c73967e4Eee8ffA06484C3fBf65E6Ae3b9804';
    const NETWORK = process.env.BLOCKCHAIN_NETWORK || 'testnet';

    for (const transaction of transactions) {
      try {
        const updateData = {};
        let needsUpdate = false;

        // Identificar tipo de transação baseado no transaction_type atual
        const isDeposit = transaction.transactionType === 'deposit' || 
                         transaction.operation_type === 'deposit' ||
                         (transaction.metadata?.source === 'user_deposit');
                         
        const isWithdraw = transaction.transactionType === 'contract_call' || 
                          transaction.transactionType === 'withdraw' ||
                          transaction.operation_type === 'withdraw' ||
                          (transaction.metadata?.source === 'user_withdraw');

        if (isDeposit) {
          console.log(`\n💰 Processando DEPÓSITO: ${transaction.id}`);
          
          // Padronizar transaction_type
          if (transaction.transactionType !== 'deposit') {
            updateData.transactionType = 'deposit';
            needsUpdate = true;
            console.log('  ✅ Corrigindo transaction_type para "deposit"');
          }

          // Adicionar network se não existir
          if (!transaction.network) {
            updateData.network = NETWORK;
            needsUpdate = true;
            console.log(`  ✅ Adicionando network: ${NETWORK}`);
          }

          // Adicionar contractAddress se não existir
          if (!transaction.contractAddress) {
            updateData.contractAddress = CONTRACT_ADDRESS;
            needsUpdate = true;
            console.log(`  ✅ Adicionando contractAddress: ${CONTRACT_ADDRESS}`);
          }

          // Corrigir from_address (deve ser o endereço admin, não a palavra "admin")
          if (!transaction.fromAddress || transaction.fromAddress === 'admin') {
            updateData.fromAddress = ADMIN_ADDRESS;
            needsUpdate = true;
            console.log(`  ✅ Corrigindo from_address para: ${ADMIN_ADDRESS}`);
          }

          // Adicionar functionName para mint
          if (!transaction.functionName) {
            updateData.functionName = 'mint';
            needsUpdate = true;
            console.log('  ✅ Adicionando functionName: "mint"');
          }

          // Padronizar operation_type
          if (transaction.operation_type !== 'deposit') {
            updateData.operation_type = 'deposit';
            needsUpdate = true;
            console.log('  ✅ Corrigindo operation_type para "deposit"');
          }

          // Unificar tx_hash (usar blockchain_tx_hash como padrão)
          if (transaction.blockchain_tx_hash && !transaction.txHash) {
            updateData.txHash = transaction.blockchain_tx_hash;
            needsUpdate = true;
            console.log('  ✅ Copiando blockchain_tx_hash para txHash');
          }

          // Garantir que fee e net_amount estejam preenchidos
          if (!transaction.fee && transaction.metadata?.fee) {
            updateData.fee = parseFloat(transaction.metadata.fee);
            needsUpdate = true;
            console.log(`  ✅ Adicionando fee: ${transaction.metadata.fee}`);
          }

          if (!transaction.net_amount && transaction.metadata?.netAmount) {
            updateData.net_amount = parseFloat(transaction.metadata.netAmount);
            needsUpdate = true;
            console.log(`  ✅ Adicionando net_amount: ${transaction.metadata.netAmount}`);
          }

          // Padronizar metadata
          const currentMetadata = transaction.metadata || {};
          const standardMetadata = {
            ...currentMetadata,
            type: 'deposit',
            network: NETWORK,
            contractAddress: CONTRACT_ADDRESS,
            functionName: 'mint',
            source: 'user_deposit',
            paymentMethod: currentMetadata.paymentMethod || 'pix',
            description: currentMetadata.description || `Depósito PIX de R$ ${transaction.amount}`,
            timestamp: currentMetadata.timestamp || transaction.createdAt?.toISOString()
          };

          // Adicionar informações PIX se existirem
          if (transaction.pix_transaction_id || transaction.pix_status) {
            standardMetadata.pixInfo = {
              status: transaction.pix_status,
              transactionId: transaction.pix_transaction_id,
              endToEndId: transaction.pix_end_to_end_id,
              confirmedAt: transaction.pix_confirmed_at?.toISOString(),
              key: transaction.pix_key,
              keyType: transaction.pix_key_type
            };
          }

          // Adicionar informações blockchain se existirem
          if (transaction.blockchain_status || transaction.txHash || transaction.blockchain_tx_hash) {
            standardMetadata.blockchainInfo = {
              status: transaction.blockchain_status,
              txHash: transaction.txHash || transaction.blockchain_tx_hash,
              blockNumber: transaction.blockNumber || transaction.blockchain_block_number,
              confirmedAt: transaction.blockchain_confirmed_at?.toISOString(),
              network: NETWORK,
              gasUsed: transaction.gasUsed,
              fromAddress: ADMIN_ADDRESS,
              toAddress: transaction.toAddress || transaction.user?.blockchainAddress || transaction.user?.publicKey
            };
          }

          if (JSON.stringify(currentMetadata) !== JSON.stringify(standardMetadata)) {
            updateData.metadata = standardMetadata;
            needsUpdate = true;
            console.log('  ✅ Padronizando metadata');
          }

          if (needsUpdate) {
            await prisma.transaction.update({
              where: { id: transaction.id },
              data: updateData
            });
            depositsUpdated++;
            console.log(`  ✅ Depósito ${transaction.id} atualizado com sucesso`);
          } else {
            console.log(`  ℹ️ Depósito ${transaction.id} já está padronizado`);
          }

        } else if (isWithdraw) {
          console.log(`\n💸 Processando SAQUE: ${transaction.id}`);
          
          // Padronizar transaction_type
          if (transaction.transactionType !== 'withdraw') {
            updateData.transactionType = 'withdraw';
            needsUpdate = true;
            console.log('  ✅ Corrigindo transaction_type para "withdraw"');
          }

          // Adicionar network se não existir
          if (!transaction.network) {
            updateData.network = NETWORK;
            needsUpdate = true;
            console.log(`  ✅ Adicionando network: ${NETWORK}`);
          }

          // Adicionar contractAddress se não existir
          if (!transaction.contractAddress) {
            updateData.contractAddress = CONTRACT_ADDRESS;
            needsUpdate = true;
            console.log(`  ✅ Adicionando contractAddress: ${CONTRACT_ADDRESS}`);
          }

          // Corrigir from_address (deve ser o endereço do usuário)
          if (!transaction.fromAddress && transaction.user?.publicKey) {
            updateData.fromAddress = transaction.user.publicKey;
            needsUpdate = true;
            console.log(`  ✅ Adicionando from_address: ${transaction.user.publicKey}`);
          }

          // Adicionar function_name para burn
          if (!transaction.function_name) {
            updateData.function_name = 'burn';
            needsUpdate = true;
            console.log('  ✅ Adicionando functionName: "burn"');
          }

          // Padronizar operation_type
          if (transaction.operation_type !== 'withdraw') {
            updateData.operation_type = 'withdraw';
            needsUpdate = true;
            console.log('  ✅ Corrigindo operation_type para "withdraw"');
          }

          // Unificar tx_hash (copiar de tx_hash para blockchain_tx_hash se necessário)
          if (transaction.tx_hash && !transaction.blockchain_tx_hash) {
            updateData.blockchain_tx_hash = transaction.tx_hash;
            needsUpdate = true;
            console.log('  ✅ Copiando tx_hash para blockchain_tx_hash');
          }
          
          // Garantir que txHash também esteja preenchido (compatibilidade)
          if ((transaction.tx_hash || transaction.blockchain_tx_hash) && !transaction.txHash) {
            updateData.txHash = transaction.tx_hash || transaction.blockchain_tx_hash;
            needsUpdate = true;
            console.log('  ✅ Adicionando txHash para compatibilidade');
          }

          // Preencher campos PIX se existir withdrawal relacionado
          const withdrawal = await prisma.withdrawal.findFirst({
            where: { 
              userId: transaction.userId,
              createdAt: {
                gte: new Date(transaction.createdAt.getTime() - 60000), // 1 minuto antes
                lte: new Date(transaction.createdAt.getTime() + 60000)  // 1 minuto depois
              }
            }
          });

          if (withdrawal) {
            if (!transaction.pix_key && withdrawal.pixKey) {
              updateData.pix_key = withdrawal.pixKey;
              needsUpdate = true;
              console.log(`  ✅ Adicionando pix_key: ${withdrawal.pixKey}`);
            }

            if (!transaction.pix_key_type && withdrawal.pixKeyType) {
              updateData.pix_key_type = withdrawal.pixKeyType;
              needsUpdate = true;
              console.log(`  ✅ Adicionando pix_key_type: ${withdrawal.pixKeyType}`);
            }

            if (!transaction.pix_transaction_id && withdrawal.pixTransactionId) {
              updateData.pix_transaction_id = withdrawal.pixTransactionId;
              needsUpdate = true;
              console.log(`  ✅ Adicionando pix_transaction_id: ${withdrawal.pixTransactionId}`);
            }

            if (!transaction.pix_end_to_end_id && withdrawal.pixEndToEndId) {
              updateData.pix_end_to_end_id = withdrawal.pixEndToEndId;
              needsUpdate = true;
              console.log(`  ✅ Adicionando pix_end_to_end_id: ${withdrawal.pixEndToEndId}`);
            }

            if (withdrawal.status === 'CONFIRMED') {
              updateData.pix_status = 'confirmed';
              updateData.pix_confirmed_at = withdrawal.completedAt;
              needsUpdate = true;
              console.log('  ✅ Atualizando pix_status para "confirmed"');
            }
          }

          // Preencher campos blockchain
          if (!transaction.blockchain_status && transaction.status === 'confirmed') {
            updateData.blockchain_status = 'confirmed';
            needsUpdate = true;
            console.log('  ✅ Adicionando blockchain_status: "confirmed"');
          }

          // Garantir que fee e net_amount estejam preenchidos
          if (!transaction.fee && withdrawal?.fee) {
            updateData.fee = parseFloat(withdrawal.fee);
            needsUpdate = true;
            console.log(`  ✅ Adicionando fee: ${withdrawal.fee}`);
          }

          if (!transaction.net_amount && withdrawal?.netAmount) {
            updateData.net_amount = parseFloat(withdrawal.netAmount);
            needsUpdate = true;
            console.log(`  ✅ Adicionando net_amount: ${withdrawal.netAmount}`);
          }

          // Padronizar metadata
          const currentMetadata = transaction.metadata || {};
          const standardMetadata = {
            ...currentMetadata,
            type: 'withdraw',
            network: NETWORK,
            contractAddress: CONTRACT_ADDRESS,
            functionName: 'burn',
            source: 'user_withdraw',
            paymentMethod: 'pix',
            description: currentMetadata.description || `Saque PIX de ${transaction.amount} cBRL`,
            timestamp: currentMetadata.timestamp || transaction.createdAt?.toISOString()
          };

          // Adicionar informações PIX se existirem
          if (withdrawal || transaction.pix_transaction_id || transaction.pix_status) {
            standardMetadata.pixInfo = {
              status: transaction.pix_status || (withdrawal?.status === 'CONFIRMED' ? 'confirmed' : 'pending'),
              transactionId: transaction.pix_transaction_id || withdrawal?.pixTransactionId,
              endToEndId: transaction.pix_end_to_end_id || withdrawal?.pixEndToEndId,
              confirmedAt: transaction.pix_confirmed_at?.toISOString() || withdrawal?.completedAt?.toISOString(),
              key: transaction.pix_key || withdrawal?.pixKey,
              keyType: transaction.pix_key_type || withdrawal?.pixKeyType,
              amount: transaction.net_amount || withdrawal?.netAmount
            };
          }

          // Adicionar informações blockchain se existirem
          if (transaction.blockchain_status || transaction.tx_hash || transaction.txHash || withdrawal?.burnTxHash) {
            standardMetadata.blockchainInfo = {
              status: transaction.blockchain_status || 'confirmed',
              txHash: transaction.txHash || transaction.tx_hash || transaction.blockchain_tx_hash || withdrawal?.burnTxHash,
              blockNumber: transaction.blockNumber || transaction.blockchain_block_number,
              confirmedAt: transaction.blockchain_confirmed_at?.toISOString() || transaction.confirmedAt?.toISOString(),
              network: NETWORK,
              gasUsed: transaction.gasUsed,
              fromAddress: transaction.fromAddress || transaction.user?.publicKey,
              functionName: 'burn',
              burnAmount: transaction.amount
            };
          }

          if (JSON.stringify(currentMetadata) !== JSON.stringify(standardMetadata)) {
            updateData.metadata = standardMetadata;
            needsUpdate = true;
            console.log('  ✅ Padronizando metadata');
          }

          if (needsUpdate) {
            await prisma.transaction.update({
              where: { id: transaction.id },
              data: updateData
            });
            withdrawsUpdated++;
            console.log(`  ✅ Saque ${transaction.id} atualizado com sucesso`);
          } else {
            console.log(`  ℹ️ Saque ${transaction.id} já está padronizado`);
          }
        } else {
          console.log(`\n❓ Transação ${transaction.id} tem tipo desconhecido: ${transaction.transactionType}`);
        }

      } catch (error) {
        console.error(`\n❌ Erro ao processar transação ${transaction.id}:`, error.message);
        errors++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMO DA PADRONIZAÇÃO:');
    console.log('='.repeat(60));
    console.log(`✅ Depósitos atualizados: ${depositsUpdated}`);
    console.log(`✅ Saques atualizados: ${withdrawsUpdated}`);
    console.log(`❌ Erros encontrados: ${errors}`);
    console.log(`📊 Total processado: ${transactions.length}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar script
console.log('🚀 Script de Padronização de Transações');
console.log('=====================================\n');

standardizeTransactions()
  .then(() => {
    console.log('\n✅ Script executado com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro na execução:', error);
    process.exit(1);
  });