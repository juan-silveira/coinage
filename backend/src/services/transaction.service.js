const { ethers } = require('ethers');
const prismaConfig = require('../config/prisma');

// Função para obter o serviço de webhook
const getWebhookService = () => {
  if (!global.webhookService) {
    global.webhookService = require('./webhook.service');
  }
  return global.webhookService;
};

class TransactionService {
  constructor() {
    this.prisma = null;
  }

  async initialize() {
    this.prisma = await prismaConfig.initialize();
  }

  /**
   * Dispara webhooks para eventos de transação
   */
  async triggerTransactionWebhooks(event, transaction, clientId) {
    try {
      const webhookService = getWebhookService();
      await webhookService.triggerWebhooks(event, {
        transactionId: transaction.id,
        txHash: transaction.txHash,
        type: transaction.type,
        status: transaction.status,
        fromAddress: transaction.fromAddress,
        toAddress: transaction.toAddress,
        amount: transaction.amount,
        network: transaction.network,
        blockNumber: transaction.blockNumber,
        timestamp: transaction.createdAt
      }, clientId);
    } catch (error) {
      console.error('Erro ao disparar webhooks de transação:', error.message);
      // Não falhar a operação principal por erro de webhook
    }
  }

  /**
   * Cria um registro de transação
   */
  async createTransaction(transactionData) {
    try {
      if (!this.Transaction) {
        await this.initialize();
      }

      const transaction = await this.Transaction.create(transactionData);
      
      // Disparar webhook de transação criada
      if (transaction.clientId) {
        await this.triggerTransactionWebhooks('transaction.created', transaction, transaction.clientId);
      }
      
      return transaction;
    } catch (error) {
      console.error('Erro ao criar transação:', error.message);
      throw error;
    }
  }

  /**
   * Atualiza uma transação com dados da blockchain
   */
  async updateTransaction(transactionId, updateData) {
    try {
      if (!this.Transaction) {
        await this.initialize();
      }

      const transaction = await this.Transaction.findByPk(transactionId);
      if (!transaction) {
        throw new Error('Transação não encontrada');
      }

      const oldStatus = transaction.status;
      await transaction.update(updateData);
      
      // Disparar webhook se o status mudou
      if (updateData.status && updateData.status !== oldStatus) {
        await this.triggerTransactionWebhooks('transaction.status_updated', transaction, transaction.clientId);
      }
      
      return transaction;
    } catch (error) {
      console.error('Erro ao atualizar transação:', error.message);
      throw error;
    }
  }

  /**
   * Atualiza uma transação pelo hash
   */
  async updateTransactionByHash(txHash, updateData) {
    try {
      if (!this.Transaction) {
        await this.initialize();
      }

      const transaction = await this.Transaction.findOne({
        where: { txHash }
      });

      if (!transaction) {
        throw new Error('Transação não encontrada');
      }

      await transaction.update(updateData);
      return transaction;
    } catch (error) {
      console.error('Erro ao atualizar transação por hash:', error.message);
      throw error;
    }
  }

  /**
   * Registra uma transação de mint
   */
  async recordMintTransaction(data) {
    const {
      clientId,
      userId,
      contractAddress,
      toAddress,
      amount,
      amountWei,
      gasPayer,
      network,
      txHash,
      gasUsed,
      gasPrice,
      blockNumber,
      status = 'confirmed'
    } = data;

    const transactionData = {
      clientId,
      userId,
      network: network || 'testnet',
      transactionType: 'contract_call',
      status,
      txHash,
      blockNumber,
      fromAddress: gasPayer,
      toAddress: contractAddress,
      functionName: 'mint',
      functionParams: [toAddress, amountWei],
      gasUsed,
      gasPrice,
      metadata: {
        operation: 'mint',
        contractAddress,
        toAddress,
        amount,
        amountWei: amountWei.toString(),
        gasPayer,
        targetAddress: toAddress,
        amount: amount.toString()
      }
    };

    const transaction = await this.createTransaction(transactionData);
    
    // Disparar webhook específico de mint
    if (clientId) {
      await this.triggerTransactionWebhooks('transaction.mint', transaction, clientId);
    }
    
    return transaction;
  }

  /**
   * Registra uma transação de burn
   */
  async recordBurnTransaction(data) {
    const {
      clientId,
      userId,
      contractAddress,
      fromAddress,
      amount,
      amountWei,
      gasPayer,
      network,
      txHash,
      gasUsed,
      gasPrice,
      blockNumber,
      status = 'confirmed'
    } = data;

    const transactionData = {
      clientId,
      userId,
      network: network || 'testnet',
      transactionType: 'contract_call',
      status,
      txHash,
      blockNumber,
      fromAddress: gasPayer,
      toAddress: contractAddress,
      functionName: 'burnFrom',
      functionParams: [fromAddress, amountWei],
      gasUsed,
      gasPrice,
      metadata: {
        operation: 'burn',
        contractAddress,
        fromAddress,
        amount,
        amountWei: amountWei.toString(),
        gasPayer,
        targetAddress: fromAddress,
        amount: amount.toString()
      }
    };

    const transaction = await this.createTransaction(transactionData);
    
    // Disparar webhook específico de burn
    if (clientId) {
      await this.triggerTransactionWebhooks('transaction.burn', transaction, clientId);
    }
    
    return transaction;
  }

  /**
   * Registra uma transação de transfer
   */
  async recordTransferTransaction(data) {
    const {
      clientId,
      userId,
      contractAddress,
      fromAddress,
      toAddress,
      amount,
      amountWei,
      gasPayer,
      network,
      txHash,
      gasUsed,
      gasPrice,
      blockNumber,
      status = 'confirmed'
    } = data;

    const transactionData = {
      clientId,
      userId,
      network: network || 'testnet',
      transactionType: 'contract_call',
      status,
      txHash,
      blockNumber,
      fromAddress: gasPayer,
      toAddress: contractAddress,
      functionName: 'transferFromGasless',
      functionParams: [fromAddress, toAddress, amountWei],
      gasUsed,
      gasPrice,
      metadata: {
        operation: 'transfer',
        contractAddress,
        fromAddress,
        toAddress,
        amount,
        amountWei: amountWei.toString(),
        gasPayer,
        fromAddress: fromAddress,
        toAddress: toAddress,
        amount: amount.toString()
      }
    };

    const transaction = await this.createTransaction(transactionData);
    
    // Disparar webhook específico de transfer
    if (clientId) {
      await this.triggerTransactionWebhooks('transaction.transfer', transaction, clientId);
    }
    
    return transaction;
  }

  /**
   * Registra uma transação de grant role
   */
  async recordGrantRoleTransaction(data) {
    const {
      clientId,
      userId,
      contractAddress,
      role,
      targetAddress,
      gasPayer,
      network,
      txHash,
      gasUsed,
      gasPrice,
      blockNumber,
      status = 'confirmed'
    } = data;

    const transactionData = {
      clientId,
      userId,
      network: network || 'testnet',
      transactionType: 'contract_call',
      status,
      txHash,
      blockNumber,
      fromAddress: gasPayer,
      toAddress: contractAddress,
      functionName: 'grantRole',
      functionParams: [role, targetAddress],
      gasUsed,
      gasPrice,
      metadata: {
        operation: 'grant_role',
        contractAddress,
        role,
        targetAddress,
        gasPayer
      }
    };

    return await this.createTransaction(transactionData);
  }

  /**
   * Registra uma transação de revoke role
   */
  async recordRevokeRoleTransaction(data) {
    const {
      clientId,
      userId,
      contractAddress,
      role,
      targetAddress,
      gasPayer,
      network,
      txHash,
      gasUsed,
      gasPrice,
      blockNumber,
      status = 'confirmed'
    } = data;

    const transactionData = {
      clientId,
      userId,
      network: network || 'testnet',
      transactionType: 'contract_call',
      status,
      txHash,
      blockNumber,
      fromAddress: gasPayer,
      toAddress: contractAddress,
      functionName: 'revokeRole',
      functionParams: [role, targetAddress],
      gasUsed,
      gasPrice,
      metadata: {
        operation: 'revoke_role',
        contractAddress,
        role,
        targetAddress,
        gasPayer
      }
    };

    return await this.createTransaction(transactionData);
  }

  /**
   * Busca transações por cliente
   */
  async getTransactionsByClient(clientId, options = {}) {
    try {
      if (!this.Transaction) {
        await this.initialize();
      }

      return await this.Transaction.findByClientId(clientId, options);
    } catch (error) {
      console.error('Erro ao buscar transações do cliente:', error.message);
      throw error;
    }
  }

  /**
   * Busca transações por usuário (versão corrigida)
   */
  async getTransactionsByUser(userId, options = {}) {
    try {
      console.log('🔍 [TransactionService] Buscando TODAS as transações para userId:', userId);
      
      if (!this.prisma) {
        console.log('🔍 [TransactionService] Inicializando Prisma...');
        await this.initialize();
      }
      
      if (!userId) {
        console.error('❌ [TransactionService] UserID é obrigatório');
        return {
          rows: [],
          count: 0
        };
      }

      const { 
        page = 1, 
        limit = 50, 
        status, 
        network, 
        transactionType, 
        tokenSymbol, 
        startDate, 
        endDate 
      } = options;

      // Construir filtros
      const where = { 
        userId: userId  // SEMPRE filtrar por userId, independente do cliente
      };
      
      // Adicionar filtros opcionais
      if (status) where.status = status;
      if (network) where.network = network; 
      if (transactionType) where.transactionType = transactionType;
      
      if (tokenSymbol && tokenSymbol !== '') {
        where.metadata = {
          path: ['tokenSymbol'],
          equals: tokenSymbol
        };
      }
      
      if (startDate && endDate) {
        where.createdAt = {
          gte: new Date(startDate),
          lte: new Date(endDate)
        };
      }
      
      console.log('🔍 [TransactionService] Filtros aplicados:', where);

      // Executar query no Prisma com tratamento específico de BigInt
      console.log('🔍 [TransactionService] Executando queries Prisma...');
      
      let transactions, count;
      try {
        [transactions, count] = await Promise.all([
          this.prisma.transaction.findMany({
            where,
            include: {
              client: {
                select: {
                  id: true,
                  name: true,
                  alias: true
                }
              }
            },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit
          }),
          this.prisma.transaction.count({ where })
        ]);
        
        console.log('🔍 [TransactionService] Queries executadas com sucesso');
      } catch (prismaError) {
        console.error('❌ [TransactionService] Erro na query Prisma:', {
          error: prismaError.message,
          stack: prismaError.stack
        });
        throw prismaError;
      }
      
      console.log(`🔍 [TransactionService] Query executada: ${transactions.length} transações encontradas de ${count} total`);

      console.log(`✅ [TransactionService] Encontradas ${count} transações para userId ${userId}`);
      
      // Comprehensive BigInt to string conversion function
      const convertBigIntToString = (obj) => {
        if (obj === null || obj === undefined) return obj;
        if (typeof obj === 'bigint') return obj.toString();
        if (Array.isArray(obj)) return obj.map(convertBigIntToString);
        if (typeof obj === 'object' && obj.constructor === Object) {
          const converted = {};
          for (const [key, value] of Object.entries(obj)) {
            converted[key] = convertBigIntToString(value);
          }
          return converted;
        }
        if (typeof obj === 'object') {
          // Handle Prisma models and other objects
          const converted = {};
          for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
              converted[key] = convertBigIntToString(obj[key]);
            }
          }
          return converted;
        }
        return obj;
      };

      // Convert all transactions with comprehensive BigInt handling
      const formattedTransactions = transactions.map(tx => {
        const converted = convertBigIntToString(tx);
        return {
          ...converted,
          getFormattedResponse: function() { return this; }
        };
      });

      return {
        rows: formattedTransactions,
        count
      };
    } catch (error) {
      console.error('❌ [TransactionService] Erro ao buscar transações:', {
        userId,
        error: error.message,
        stack: error.stack
      });
      
      // Retornar resultado vazio ao invés de lançar erro
      return {
        rows: [],
        count: 0
      };
    }
  }

  /**
   * Debug - busca transações com logs detalhados
   */
  async debugGetTransactionsByUser(userId, options = {}) {
    try {
      if (!this.prisma) {
        await this.initialize();
      }

      console.log('🐛 DEBUG - Parâmetros recebidos:', options);
      
      const { page = 1, limit = 50, tokenSymbol } = options;
      
      const where = { userId };
      
      if (tokenSymbol) {
        where.metadata = {
          path: ['tokenSymbol'],
          equals: tokenSymbol
        };
        console.log('🐛 DEBUG - Aplicando filtro tokenSymbol:', tokenSymbol);
      }
      
      console.log('🐛 DEBUG - Where final:', JSON.stringify(where, null, 2));
      
      const [transactions, count] = await Promise.all([
        this.prisma.transaction.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit
        }),
        this.prisma.transaction.count({ where })
      ]);
      
      console.log('🐛 DEBUG - Resultados: count =', count, ', rows =', transactions.length);
      
      return { rows: transactions, count };
    } catch (error) {
      console.error('Erro no debug:', error.message);
      throw error;
    }
  }

  /**
   * Busca transação por hash
   */
  async getTransactionByHash(txHash) {
    try {
      if (!this.Transaction) {
        await this.initialize();
      }

      return await this.Transaction.findByTxHash(txHash);
    } catch (error) {
      console.error('Erro ao buscar transação por hash:', error.message);
      throw error;
    }
  }

  /**
   * Obtém estatísticas de transações
   */
  async getTransactionStats(options = {}) {
    try {
      if (!this.Transaction) {
        await this.initialize();
      }

      return await this.Transaction.getStats(options);
    } catch (error) {
      console.error('Erro ao obter estatísticas de transações:', error.message);
      throw error;
    }
  }

  /**
   * Obtém estatísticas por status
   */
  async getStatusStats(options = {}) {
    try {
      if (!this.Transaction) {
        await this.initialize();
      }

      return await this.Transaction.getStatusStats(options);
    } catch (error) {
      console.error('Erro ao obter estatísticas por status:', error.message);
      throw error;
    }
  }

  /**
   * Obtém estatísticas por tipo
   */
  async getTypeStats(options = {}) {
    try {
      if (!this.Transaction) {
        await this.initialize();
      }

      return await this.Transaction.getTypeStats(options);
    } catch (error) {
      console.error('Erro ao obter estatísticas por tipo:', error.message);
      throw error;
    }
  }

  /**
   * Testa o serviço
   */
  async testService() {
    try {
      await this.initialize();
      return {
        success: true,
        message: 'TransactionService inicializado com sucesso',
        data: {
          service: 'TransactionService',
          status: 'ready',
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Erro ao inicializar TransactionService',
        error: error.message
      };
    }
  }
}

module.exports = new TransactionService(); 