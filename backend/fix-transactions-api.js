#!/usr/bin/env node

// Script para corrigir a API de transações diretamente no container
const fs = require('fs');

// Lê o arquivo do controller atual
const controllerPath = '/usr/src/app/src/controllers/transaction.controller.js';
let content = fs.readFileSync(controllerPath, 'utf8');

// Substitui o método problemático por uma versão que trata BigInt corretamente
const newMethod = `
  async getTransactionsByClient(req, res) {
    try {
      const { page = 1, limit = 50, status, network, transactionType, tokenSymbol, startDate, endDate } = req.query;
      const userId = req.user.id;

      console.log('🔍 [TransactionController] Buscar transações:', {
        userId,
        filters: { page, limit, status, network, transactionType, tokenSymbol, startDate, endDate }
      });

      if (!userId) {
        console.error('❌ [TransactionController] UserID não encontrado');
        return res.status(400).json({
          success: false,
          message: 'ID do usuário não encontrado'
        });
      }

      console.log('🔍 [TransactionController] Chamando transactionService.getTransactionsByUser...');
      
      const result = await transactionService.getTransactionsByUser(userId, {
        page: parseInt(page),
        limit: parseInt(limit),
        status,
        network,
        transactionType,
        tokenSymbol,
        startDate,
        endDate
      });

      console.log('🔍 [TransactionController] Result obtido:', {
        count: result.count,
        rowsLength: result.rows?.length,
        firstRow: result.rows?.[0] ? Object.keys(result.rows[0]) : null
      });

      // Função para converter BigInt em string recursivamente
      function convertBigIntToString(obj) {
        if (obj === null || obj === undefined) return obj;
        if (typeof obj === 'bigint') return obj.toString();
        if (Array.isArray(obj)) return obj.map(convertBigIntToString);
        if (typeof obj === 'object') {
          const converted = {};
          for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
              converted[key] = convertBigIntToString(obj[key]);
            }
          }
          return converted;
        }
        return obj;
      }

      // Converter todas as transações
      const safeTransactions = result.rows.map(tx => {
        const safeTx = convertBigIntToString(tx.getFormattedResponse());
        return safeTx;
      });

      const responseData = {
        success: true,
        message: 'Transações obtidas com sucesso',
        data: {
          transactions: safeTransactions,
          pagination: {
            total: result.count,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(result.count / parseInt(limit))
          }
        }
      };

      // Serializar manualmente com tratamento de BigInt
      const jsonString = JSON.stringify(responseData, (key, value) => {
        if (typeof value === 'bigint') {
          return value.toString();
        }
        return value;
      });

      res.setHeader('Content-Type', 'application/json');
      res.status(200).send(jsonString);
      
    } catch (error) {
      console.error('❌ [TransactionController] Erro ao buscar transações:', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id
      });
      res.status(400).json({
        success: false,
        message: 'Erro ao obter transações',
        error: error.message
      });
    }
  }`;

// Localiza o método atual e substitui
const methodRegex = /async getTransactionsByClient\(req, res\) \{[\s\S]*?\n  \}/;
content = content.replace(methodRegex, newMethod.trim());

// Escreve o arquivo corrigido
fs.writeFileSync(controllerPath, content);

console.log('✅ Controller de transações corrigido!');
console.log('🔄 Reinicie o servidor para aplicar as mudanças');