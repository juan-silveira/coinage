#!/usr/bin/env node

const { PrismaClient } = require('./src/generated/prisma');

async function analyzeTransactionTypes() {
    const prisma = new PrismaClient();
    
    try {
        console.log('🔍 Analisando tipos de transação no banco...');
        
        const transactions = await prisma.transaction.findMany({
            where: { userId: '34290450-ce0d-46fc-a370-6ffa787ea6b9' },
            select: {
                id: true,
                transactionType: true,
                metadata: true
            },
            orderBy: { createdAt: 'desc' }
        });
        
        console.log(`📊 Total de transações: ${transactions.length}`);
        
        const typeMap = {};
        transactions.forEach(tx => {
            const type = tx.transactionType;
            const operation = tx.metadata?.operation;
            
            if (!typeMap[type]) typeMap[type] = { count: 0, operations: new Set() };
            typeMap[type].count++;
            if (operation) typeMap[type].operations.add(operation);
        });
        
        console.log('\n📋 Tipos encontrados:');
        Object.entries(typeMap).forEach(([type, info]) => {
            console.log(`  - ${type}: ${info.count} transações`);
            if (info.operations.size > 0) {
                console.log(`    Operations: ${Array.from(info.operations).join(', ')}`);
            }
        });
        
        // Verificar algumas transações específicas
        console.log('\n🔎 Detalhes de algumas transações:');
        transactions.slice(0, 5).forEach(tx => {
            console.log(`  ID: ${tx.id.slice(0, 8)}... | Type: ${tx.transactionType} | Operation: ${tx.metadata?.operation || 'N/A'}`);
        });
        
    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        await prisma.$disconnect();
    }
}

analyzeTransactionTypes();