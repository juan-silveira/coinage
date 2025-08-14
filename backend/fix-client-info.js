#!/usr/bin/env node

// Script para corrigir a inclusão dos dados do cliente na resposta
const fs = require('fs');

// Lê o arquivo do serviço atual
const servicePath = '/usr/src/app/src/services/transaction.service.js';
let content = fs.readFileSync(servicePath, 'utf8');

// Localiza e substitui a parte da query para garantir que o cliente seja incluído na resposta final
const oldQuery = `      // Convert all transactions with comprehensive BigInt handling
      const formattedTransactions = transactions.map(tx => {
        const converted = convertBigIntToString(tx);
        return {
          ...converted,
          getFormattedResponse: function() { return this; }
        };
      });`;

const newQuery = `      // Convert all transactions with comprehensive BigInt handling and ensure client is included
      const formattedTransactions = transactions.map(tx => {
        const converted = convertBigIntToString(tx);
        return {
          ...converted,
          // Ensure client data is preserved
          client: tx.client ? {
            id: tx.client.id,
            name: tx.client.name,
            alias: tx.client.alias
          } : null,
          getFormattedResponse: function() { 
            return {
              ...this,
              client: this.client
            };
          }
        };
      });`;

// Substitui no conteúdo
content = content.replace(oldQuery, newQuery);

// Escreve o arquivo corrigido
fs.writeFileSync(servicePath, content);

console.log('✅ Serviço de transações corrigido para incluir dados do cliente!');
console.log('🔄 Reinicie o servidor para aplicar as mudanças');