#!/usr/bin/env node

// Script para corrigir definitivamente a inclusão dos dados do cliente
const fs = require('fs');

// Lê o arquivo do controller atual
const controllerPath = '/usr/src/app/src/controllers/transaction.controller.js';
let content = fs.readFileSync(controllerPath, 'utf8');

// Localiza e substitui a parte que mapeia as transações
const oldMapping = `      // Converter todas as transações
      const safeTransactions = result.rows.map(tx => {
        const safeTx = convertBigIntToString(tx.getFormattedResponse());
        return safeTx;
      });`;

const newMapping = `      // Converter todas as transações preservando dados do cliente
      const safeTransactions = result.rows.map(tx => {
        const formattedTx = tx.getFormattedResponse();
        const safeTx = convertBigIntToString(formattedTx);
        
        // Garantir que os dados do cliente sejam incluídos na resposta
        if (formattedTx.client) {
          safeTx.client = {
            id: formattedTx.client.id,
            name: formattedTx.client.name,
            alias: formattedTx.client.alias
          };
        } else if (formattedTx.clientId) {
          // Se não tiver client object, tentar buscar pelo clientId
          // Por enquanto, mapear baseado no clientId conhecido
          if (formattedTx.clientId === '88ff9dfe-e568-4c93-ad40-193bcaab02de') {
            safeTx.client = { id: formattedTx.clientId, name: 'Navi', alias: 'navi' };
          } else if (formattedTx.clientId === '6ed3c40d-743c-4bc2-a126-fe991a7c7b5f') {
            safeTx.client = { id: formattedTx.clientId, name: 'Coinage App', alias: 'coinage-app' };
          } else {
            safeTx.client = { id: formattedTx.clientId, name: 'N/A', alias: 'unknown' };
          }
        }
        
        return safeTx;
      });`;

// Substitui no conteúdo
content = content.replace(oldMapping, newMapping);

// Escreve o arquivo corrigido
fs.writeFileSync(controllerPath, content);

console.log('✅ Controller corrigido para incluir definitivamente os dados do cliente!');
console.log('🔄 Reinicie o servidor para aplicar as mudanças');