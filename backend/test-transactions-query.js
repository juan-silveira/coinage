#!/usr/bin/env node

// Teste simples para verificar as transações do Ivan
const { PrismaClient } = require('./src/generated/prisma');

async function testTransactions() {
    console.log('🔥 Iniciando teste de transações...');
    
    const prisma = new PrismaClient();
    
    try {
        // UserID do Ivan
        const userId = '34290450-ce0d-46fc-a370-6ffa787ea6b9';
        
        console.log('🔍 Buscando transações para userId:', userId);
        
        const transactions = await prisma.transaction.findMany({
            where: { userId },
            include: {
                client: {
                    select: { id: true, name: true, alias: true }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 10
        });
        
        console.log(`✅ Encontradas ${transactions.length} transações`);
        
        if (transactions.length > 0) {
            console.log('📊 Primeira transação:');
            const tx = transactions[0];
            console.log({
                id: tx.id,
                client: tx.client?.name,
                type: tx.transactionType,
                status: tx.status,
                txHash: tx.txHash,
                blockNumber: tx.blockNumber ? tx.blockNumber.toString() : null,
                gasUsed: tx.gasUsed ? tx.gasUsed.toString() : null,
                date: tx.createdAt
            });
            
            console.log('\n📋 Todas as transações encontradas:');
            transactions.forEach((tx, i) => {
                console.log(`${i + 1}. Client: ${tx.client?.name || 'N/A'}, Type: ${tx.transactionType}, Status: ${tx.status}, Hash: ${tx.txHash}`);
            });
        } else {
            console.log('❌ Nenhuma transação encontrada para este usuário');
        }
        
    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testTransactions();