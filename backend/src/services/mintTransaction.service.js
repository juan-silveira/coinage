const prismaConfig = require('../config/prisma');
const { v4: uuidv4 } = require('uuid');
const rabbitmqConfig = require('../config/rabbitmq');

class MintTransactionService {
  constructor() {
    this.prisma = null;
  }

  async init() {
    this.prisma = prismaConfig.getPrisma();
  }

  /**
   * Criar transação de mint vinculada ao depósito
   */
  async createMintTransaction(depositTransactionId, userId, amount, recipientAddress) {
    try {
      if (!this.prisma) await this.init();

      console.log(`🏭 Criando transação de mint para depósito ${depositTransactionId}`);

      // Buscar companyId do usuário
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          userCompanies: {
            include: {
              company: true
            }
          }
        }
      });

      const companyId = user?.userCompanies?.[0]?.company?.id;
      if (!companyId) {
        throw new Error('Usuário não possui empresa associada');
      }

      // Criar transação BLOCKCHAIN (mint cBRL)
      const mintTransaction = await this.prisma.transaction.create({
        data: {
          id: uuidv4(),
          userId: userId,
          companyId: companyId,
          transactionType: 'contract_call',
          status: 'pending',
          // CAMPOS BLOCKCHAIN
          network: 'testnet',
          contractAddress: '0x0A8c73967e4Eee8ffA06484C3fBf65E6Ae3b9804', // cBRL Contract
          toAddress: recipientAddress, // Para quem vai o token
          functionName: 'mint',
          // CAMPOS FINANCEIROS
          amount: parseFloat(amount),
          currency: 'cBRL',
          // METADATA
          metadata: {
            depositTransactionId: depositTransactionId,
            source: 'deposit_confirmed',
            tokenSymbol: 'cBRL',
            description: `Mint de ${amount} cBRL para ${recipientAddress}`,
            createdAt: new Date().toISOString()
          }
        }
      });

      // Enviar para fila RabbitMQ
      await this.sendToMintQueue(mintTransaction);

      console.log(`✅ Transação de mint criada: ${mintTransaction.id}`);
      return mintTransaction;

    } catch (error) {
      console.error('❌ Erro ao criar transação de mint:', error);
      throw error;
    }
  }

  /**
   * Enviar transação para fila de processamento
   */
  async sendToMintQueue(mintTransaction) {
    try {
      // Conectar ao RabbitMQ se necessário
      if (!rabbitmqConfig.isConnected) {
        await rabbitmqConfig.initialize();
      }

      const message = {
        transactionId: mintTransaction.id,
        depositTransactionId: mintTransaction.metadata.depositTransactionId,
        userId: mintTransaction.userId,
        amount: mintTransaction.amount,
        recipientAddress: recipientAddress,
        type: 'mint_cbrl',
        network: mintTransaction.network,
        timestamp: new Date().toISOString()
      };

      await rabbitmqConfig.publishMessage('blockchain.exchange', 'transaction.mint', message);
      
      console.log(`📤 Transação de mint enviada para fila: ${mintTransaction.id}`);

    } catch (error) {
      console.error('❌ Erro ao enviar para fila, processando diretamente:', error.message);
      
      // Fallback: processar mint diretamente sem fila
      await this.processMintDirectly(mintTransaction);
    }
  }

  /**
   * Processar mint diretamente (fallback quando RabbitMQ não está disponível)
   */
  async processMintDirectly(mintTransaction) {
    try {
      console.log(`🔄 Processando mint diretamente: ${mintTransaction.id}`);
      
      const mintService = require('./mint.service');
      
      // Processar mint na blockchain
      const result = await mintService.mintCBRL(
        mintTransaction.toAddress,
        mintTransaction.amount.toString(),
        mintTransaction.network,
        mintTransaction.id
      );

      // Atualizar transação com resultado
      await this.updateMintResult(mintTransaction.id, result);
      
      console.log(`✅ Mint processado diretamente: ${mintTransaction.id}`);
      
    } catch (error) {
      console.error(`❌ Erro ao processar mint diretamente:`, error);
      await this.updateMintResult(mintTransaction.id, {
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Atualizar transação de mint com resultado da blockchain
   */
  async updateMintResult(transactionId, result) {
    try {
      if (!this.prisma) await this.init();

      // Buscar transação atual para preservar metadata
      const currentTransaction = await this.prisma.transaction.findUnique({
        where: { id: transactionId }
      });

      const updateData = {
        status: result.success ? 'confirmed' : 'failed',
        updatedAt: new Date()
      };

      if (result.success) {
        // SALVAR dados BLOCKCHAIN nos campos corretos
        updateData.txHash = result.transactionHash;
        updateData.blockNumber = result.blockNumber; 
        updateData.gasUsed = result.gasUsed;
        updateData.confirmedAt = new Date();
        
        // Atualizar metadata com resultado detalhado
        updateData.metadata = {
          ...currentTransaction.metadata,
          blockchainResult: {
            transactionHash: result.transactionHash,
            blockNumber: result.blockNumber,
            gasUsed: result.gasUsed,
            explorerUrl: result.explorerUrl,
            confirmedAt: new Date().toISOString()
          },
          mintDetails: {
            amountMinted: result.amountMinted,
            recipient: result.recipient,
            initialBalance: result.initialBalance,
            finalBalance: result.finalBalance,
            balanceIncrease: result.difference
          }
        };
      } else {
        updateData.metadata = {
          ...currentTransaction.metadata,
          error: result.error,
          failedAt: new Date().toISOString()
        };
      }

      const updatedTransaction = await this.prisma.transaction.update({
        where: { id: transactionId },
        data: updateData
      });

      console.log(`${result.success ? '✅' : '❌'} Transação de mint atualizada: ${transactionId}`);
      if (result.success) {
        console.log(`📝 TX Hash salvo no banco: ${result.transactionHash}`);
      }
      return updatedTransaction;

    } catch (error) {
      console.error('❌ Erro ao atualizar resultado do mint:', error);
      throw error;
    }
  }

  /**
   * Buscar transação de mint por depósito
   */
  async getMintByDepositId(depositTransactionId) {
    try {
      if (!this.prisma) await this.init();

      const mintTransaction = await this.prisma.transaction.findFirst({
        where: {
          transactionType: 'contract_call',
          functionName: 'mint',
          metadata: {
            path: ['depositTransactionId'],
            equals: depositTransactionId
          }
        }
      });

      return mintTransaction;

    } catch (error) {
      console.error('❌ Erro ao buscar mint por depósito:', error);
      throw error;
    }
  }

  /**
   * Listar transações de mint do usuário
   */
  async getUserMintTransactions(userId) {
    try {
      if (!this.prisma) await this.init();

      const mintTransactions = await this.prisma.transaction.findMany({
        where: {
          userId: userId,
          type: 'mint'
        },
        orderBy: { createdAt: 'desc' }
      });

      return mintTransactions;

    } catch (error) {
      console.error('❌ Erro ao listar transações de mint:', error);
      throw error;
    }
  }
}

module.exports = MintTransactionService;