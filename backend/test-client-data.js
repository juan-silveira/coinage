#!/usr/bin/env node

// Teste para verificar se os dados do cliente estão chegando do Prisma
const { PrismaClient } = require('./src/generated/prisma');

async function testClientData() {
    console.log('🔥 Testando dados do cliente...');
    
    const prisma = new PrismaClient();
    
    try {
        // UserID do Ivan
        const userId = '34290450-ce0d-46fc-a370-6ffa787ea6b9';
        
        console.log('🔍 Buscando transações com dados do cliente...');
        
        const transactions = await prisma.transaction.findMany({
            where: { userId },
            include: {
                client: {
                    select: { id: true, name: true, alias: true }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 3
        });
        
        console.log(`✅ Encontradas ${transactions.length} transações`);
        
        if (transactions.length > 0) {
            transactions.forEach((tx, i) => {
                console.log(`\n📊 Transação ${i + 1}:`);
                console.log(`  - ID: ${tx.id}`);
                console.log(`  - ClientID: ${tx.clientId}`);
                console.log(`  - Client Object:`, tx.client);
                console.log(`  - Type: ${tx.transactionType}`);
                console.log(`  - Status: ${tx.status}`);
            });
        }
        
    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testClientData();