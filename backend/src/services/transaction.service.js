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
  async triggerTransactionWebhooks(event, transaction, companyId) {
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
      }, companyId);
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
      if (!this.prisma) {
        await this.initialize();
      }

      const transaction = await this.prisma.transaction.create({
        data: transactionData
      });
      
      // Disparar webhook de transação criada
      if (transaction.companyId) {
        await this.triggerTransactionWebhooks('transaction.created', transaction, transaction.companyId);
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
        await this.triggerTransactionWebhooks('transaction.status_updated', transaction, transaction.companyId);
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
      companyId,
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
      companyId,
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
    if (companyId) {
      await this.triggerTransactionWebhooks('transaction.mint', transaction, companyId);
    }
    
    return transaction;
  }

  /**
   * Registra uma transação de burn
   */
  async recordBurnTransaction(data) {
    const {
      companyId,
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
      companyId,
      userId,
      network: network || 'testnet',
      transactionType: 'contract_call',
      status,
      txHash,
      blockNumber: blockNumber.toString(),
      fromAddress: gasPayer,
      toAddress: contractAddress,
      contractAddress: contractAddress,
      functionName: 'burnFrom',
      gasUsed: gasUsed.toString(),
      amount: parseFloat(amount),
      currency: 'cBRL',
      confirmedAt: new Date(),
      metadata: {
        operation: 'burn',
        contractAddress,
        fromAddress,
        amount,
        amountWei: amountWei.toString(),
        gasPayer,
        targetAddress: fromAddress,
        functionParams: [fromAddress, amountWei.toString()],
        tokenSymbol: 'cBRL',
        tokenName: 'Coinage Real Brasil'
      }
    };

    const transaction = await this.createTransaction(transactionData);
    
    // Disparar webhook específico de burn
    if (companyId) {
      await this.triggerTransactionWebhooks('transaction.burn', transaction, companyId);
    }
    
    return transaction;
  }

  /**
   * Registra uma transação de transfer
   */
  async recordTransferTransaction(data) {
    const {
      companyId,
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
      companyId,
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
    if (companyId) {
      await this.triggerTransactionWebhooks('transaction.transfer', transaction, companyId);
    }
    
    return transaction;
  }

  /**
   * Registra uma transação de grant role
   */
  async recordGrantRoleTransaction(data) {
    const {
      companyId,
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
      companyId,
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
      companyId,
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
      companyId,
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
   * Busca transações por empresa
   */
  async getTransactionsByCompany(companyId, options = {}) {
    try {
      if (!this.Transaction) {
        await this.initialize();
      }

      return await this.Transaction.findByCompanyId(companyId, options);
    } catch (error) {
      console.error('Erro ao buscar transações da empresa:', error.message);
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
        userId: userId  // SEMPRE filtrar por userId, independente da empresa
      };
      
      // Adicionar filtros opcionais
      if (status) where.status = status;
      if (network) where.network = network; 
      
      // Filtro de tipo de transação complexo - considerar tanto transactionType quanto operation nos metadados
      console.log('🔍 [TransactionService] Verificando filtro transactionType:', transactionType, 'tipo:', typeof transactionType);
      if (transactionType) {
        // Mapear tipos do frontend para tipos/operations do backend
        const typeMapping = {
          'deposit': {
            OR: [
              { transactionType: 'deposit' },
              { transactionType: 'contract_call', metadata: { path: ['operation'], equals: 'deposit' } },
              { transactionType: 'contract_call', metadata: { path: ['operation'], equals: 'mint' } }
            ]
          },
          'withdraw': {
            OR: [
              { transactionType: 'withdraw' },
              { transactionType: 'contract_call', metadata: { path: ['operation'], equals: 'withdraw' } },
              { transactionType: 'contract_call', metadata: { path: ['operation'], equals: 'burn' } }
            ]
          },
          'exchange': {
            OR: [
              { transactionType: 'exchange' },
              { transactionType: 'contract_call', metadata: { path: ['operation'], equals: 'exchange' } },
              { transactionType: 'transfer', metadata: { path: ['operation'], equals: 'exchange' } }
            ]
          },
          'transfer': {
            AND: [
              { 
                OR: [
                  { transactionType: 'transfer' },
                  { transactionType: 'contract_call', metadata: { path: ['operation'], equals: 'transfer' } }
                ]
              },
              {
                NOT: {
                  metadata: { path: ['operation'], equals: 'exchange' }
                }
              }
            ]
          },
          'stake': {
            OR: [
              { transactionType: 'stake' },
              { transactionType: 'contract_call', metadata: { path: ['operation'], equals: 'stake' } }
            ]
          },
          'unstake': {
            OR: [
              { transactionType: 'unstake' },
              { transactionType: 'contract_call', metadata: { path: ['operation'], equals: 'unstake' } }
            ]
          }
        };
        
        console.log('🔍 [TransactionService] transactionType solicitado:', transactionType);
        console.log('🔍 [TransactionService] typeMapping disponível:', Object.keys(typeMapping));
        
        if (typeMapping[transactionType]) {
          console.log('🔍 [TransactionService] Aplicando mapeamento complexo para:', transactionType);
          where.AND = where.AND || [];
          where.AND.push(typeMapping[transactionType]);
        } else {
          console.log('🔍 [TransactionService] Usando fallback para tipo não mapeado:', transactionType);
          where.transactionType = transactionType;
        }
      }
      
      if (tokenSymbol && tokenSymbol !== '') {
        where.AND = where.AND || [];
        where.AND.push({
          metadata: {
            path: ['tokenSymbol'],
            equals: tokenSymbol
          }
        });
      }
      
      if (startDate && endDate) {
        where.createdAt = {
          gte: new Date(startDate),
          lte: new Date(endDate)
        };
      }
      
      console.log('🔍 [TransactionService] Filtros aplicados:', JSON.stringify(where, null, 2));

      // Executar query no Prisma com tratamento específico de BigInt
      console.log('🔍 [TransactionService] Executando queries Prisma...');
      
      let transactions, count;
      try {
        [transactions, count] = await Promise.all([
          this.prisma.transaction.findMany({
            where,
            include: {
              company: {
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
        
        // Preserve Date objects by converting to ISO string
        if (obj instanceof Date) {
          return obj.toISOString();
        }
        
        if (Array.isArray(obj)) return obj.map(convertBigIntToString);
        if (typeof obj === 'object' && obj.constructor === Object) {
          const converted = {};
          for (const [key, value] of Object.entries(obj)) {
            converted[key] = convertBigIntToString(value);
          }
          return converted;
        }
        if (typeof obj === 'object') {
          // Handle Prisma models and other objects, but preserve Date objects
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

      // Enriquecer transações de stake com informações do token real
      const enrichedTransactions = await Promise.all(transactions.map(async (tx) => {
        let enrichedTx = { ...tx };
        
        // Se for uma transação de stake/unstake/stake_reward, buscar o token real do contrato
        if ((tx.transactionType === 'stake' || tx.transactionType === 'unstake' || 
             tx.transactionType === 'stake_reward') && tx.contractAddress) {
          
          try {
            console.log(`🔍 [TransactionService] Enriquecendo transação de stake: ${tx.id}`);
            
            // Buscar o contrato de stake
            const stakeContract = await this.prisma.smartContract.findUnique({
              where: { address: tx.contractAddress },
              select: { metadata: true }
            });
            
            if (stakeContract && stakeContract.metadata) {
              // Extrair o tokenAddress dos metadados do contrato de stake
              const metadata = typeof stakeContract.metadata === 'string' 
                ? JSON.parse(stakeContract.metadata) 
                : stakeContract.metadata;
              
              const tokenAddress = metadata.tokenAddress || metadata.stakeToken;
              
              if (tokenAddress) {
                console.log(`📍 [TransactionService] Token address encontrado: ${tokenAddress}`);
                
                // Buscar o contrato do token
                const tokenContract = await this.prisma.smartContract.findUnique({
                  where: { address: tokenAddress },
                  select: { name: true, metadata: true }
                });
                
                if (tokenContract) {
                  const tokenMetadata = typeof tokenContract.metadata === 'string'
                    ? JSON.parse(tokenContract.metadata)
                    : tokenContract.metadata;
                  
                  // Sobrescrever currency e adicionar informações do token aos metadados
                  const tokenSymbol = tokenMetadata.symbol || tokenMetadata.tokenSymbol || tx.currency;
                  const tokenName = tokenContract.name || tokenMetadata.name || tokenSymbol;
                  
                  enrichedTx.currency = tokenSymbol;
                  enrichedTx.metadata = {
                    ...enrichedTx.metadata,
                    tokenSymbol: tokenSymbol,
                    tokenName: tokenName,
                    tokenAddress: tokenAddress,
                    enrichedFromContract: true
                  };
                  
                  console.log(`✅ [TransactionService] Token enriquecido: ${tokenSymbol} - ${tokenName}`);
                }
              }
            }
          } catch (error) {
            console.warn(`⚠️ [TransactionService] Erro ao enriquecer transação ${tx.id}:`, error.message);
            // Continuar com os dados originais se houver erro
          }
        }
        
        return enrichedTx;
      }));
      
      // Convert all transactions with comprehensive BigInt handling
      const formattedTransactions = enrichedTransactions.map(tx => {
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