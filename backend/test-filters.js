#!/usr/bin/env node

const fetch = require('node-fetch');

async function testTransactionFilters() {
    const baseUrl = 'http://localhost:3001';
    
    // Login para obter token
    console.log('🔐 Fazendo login...');
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: 'ivan@test.com',
            password: 'N@vi@2025'
        })
    });
    
    const loginData = await loginResponse.json();
    if (!loginData.success) {
        console.error('❌ Erro no login:', loginData);
        return;
    }
    
    const token = loginData.data.access_token;
    console.log('✅ Login realizado com sucesso');
    
    // Testar filtros específicos
    const filtersToTest = [
        { name: 'Depósito', type: 'deposit' },
        { name: 'Saque', type: 'withdraw' },
        { name: 'Troca', type: 'exchange' },
        { name: 'Transferência', type: 'transfer' },
        { name: 'Investimento', type: 'stake' },
        { name: 'Resgate', type: 'unstake' }
    ];
    
    for (const filter of filtersToTest) {
        console.log(`\n🔍 Testando filtro: ${filter.name} (${filter.type})`);
        
        const response = await fetch(`${baseUrl}/api/transactions?transactionType=${filter.type}&limit=50`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        
        if (data.success) {
            console.log(`  ✅ ${data.data.transactions.length} transações encontradas`);
            
            // Mostrar detalhes das primeiras 3 transações
            data.data.transactions.slice(0, 3).forEach((tx, i) => {
                const operation = tx.metadata?.operation || 'N/A';
                console.log(`    ${i+1}. Type: ${tx.transactionType} | Operation: ${operation} | Amount: ${tx.metadata?.amount || 'N/A'}`);
            });
        } else {
            console.log(`  ❌ Erro: ${data.message}`);
        }
    }
    
    // Teste sem filtros
    console.log(`\n🔍 Testando sem filtros (todas as transações)`);
    const allResponse = await fetch(`${baseUrl}/api/transactions?limit=50`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const allData = await allResponse.json();
    if (allData.success) {
        console.log(`  ✅ ${allData.data.transactions.length} transações totais encontradas`);
    }
}

testTransactionFilters().catch(console.error);