#!/usr/bin/env node

// Teste para verificar se os dados da empresa estão chegando do Prisma
const { PrismaClient } = require('./src/generated/prisma');

async function testCompanyData() {
    console.log('🔥 Testando dados da empresa...');
    
    const prisma = new PrismaClient();
    
    try {
        // UserID do Ivan
        const userId = '34290450-ce0d-46fc-a370-6ffa787ea6b9';
        
        console.log('🔍 Buscando transações com dados da empresa...');
        
        const transactions = await prisma.transaction.findMany({
            where: { userId },
            include: {
                company: {
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
                console.log(`  - CompanyID: ${tx.companyId}`);
                console.log(`  - Company Object:`, tx.company);
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

testCompanyData();