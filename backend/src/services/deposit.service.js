const prismaConfig = require('../config/prisma');
const { v4: uuidv4 } = require('uuid');
const amqp = require('amqplib');
const NotificationService = require('./notification.service');

class DepositService {
  constructor() {
    this.prisma = null;
    this.notificationService = new NotificationService();
    this.rabbitMQConnection = null;
    this.rabbitMQChannel = null;
  }

  async init() {
    this.prisma = prismaConfig.getPrisma();
  }

  /**
   * Conectar ao RabbitMQ
   */
  async connectToRabbitMQ() {
    try {
      if (!this.rabbitMQConnection) {
        this.rabbitMQConnection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
        this.rabbitMQChannel = await this.rabbitMQConnection.createChannel();
        
        // Declarar fila de depósitos
        await this.rabbitMQChannel.assertQueue('deposits', {
          durable: true
        });
        
        console.log('✅ Conectado ao RabbitMQ');
      }
    } catch (error) {
      console.error('❌ Erro ao conectar ao RabbitMQ:', error);
      throw error;
    }
  }

  /**
   * Iniciar processo de depósito
   */
  async initiateDeposit(amount, userId) {
    try {
      if (!this.prisma) await this.init();
      
      // Conectar ao RabbitMQ
      await this.connectToRabbitMQ();
      
      // Criar transação no banco de dados
      const transaction = await this.prisma.transaction.create({
        data: {
          id: uuidv4(),
          userId: userId,
          type: 'deposit',
          amount: amount,
          tokenSymbol: 'BRL', // Reais brasileiros
          status: 'pending',
          network: 'mainnet',
          description: `Depósito de R$ ${amount}`,
          metadata: {
            source: 'user_deposit',
            currency: 'BRL',
            timestamp: new Date().toISOString()
          }
        }
      });

      // Enviar para fila do RabbitMQ
      const depositMessage = {
        transactionId: transaction.id,
        userId: userId,
        amount: amount,
        type: 'deposit',
        timestamp: new Date().toISOString()
      };

      await this.rabbitMQChannel.sendToQueue(
        'deposits', 
        Buffer.from(JSON.stringify(depositMessage)),
        { persistent: true }
      );

      console.log(`📤 Depósito enviado para fila: ${transaction.id}`);

      return {
        transactionId: transaction.id,
        amount: amount,
        status: 'pending'
      };

    } catch (error) {
      console.error('❌ Erro ao iniciar depósito:', error);
      throw error;
    }
  }

  /**
   * Confirmar depósito na blockchain
   */
  async confirmDeposit(transactionId, blockchainTxHash, blockNumber, gasUsed) {
    try {
      // Buscar transação
      const transaction = await this.prisma.transaction.findUnique({
        where: { id: transactionId }
      });

      if (!transaction) {
        throw new Error('Transação não encontrada');
      }

      if (transaction.status !== 'pending') {
        throw new Error('Transação não está pendente');
      }

      // Atualizar transação com dados da blockchain
      const updatedTransaction = await this.prisma.transaction.update({
        where: { id: transactionId },
        data: {
          status: 'confirmed',
          blockchainTxHash: blockchainTxHash,
          blockNumber: blockNumber,
          gasUsed: gasUsed,
          confirmedAt: new Date(),
          metadata: {
            ...transaction.metadata,
            blockchainConfirmation: {
              txHash: blockchainTxHash,
              blockNumber: blockNumber,
              gasUsed: gasUsed,
              confirmedAt: new Date().toISOString()
            }
          }
        }
      });

      // Atualizar saldo do usuário
      await this.updateUserBalance(transaction.userId, transaction.amount);

      // Criar notificação de depósito confirmado
      if (transaction.userId) {
        await this.notificationService.createNotification(
          transaction.userId,
          'Depósito Confirmado',
          `Seu depósito de R$ ${transaction.amount} foi confirmado e adicionado ao seu saldo.`,
          'success',
          {
            transactionId: transactionId,
            amount: transaction.amount,
            currency: 'BRL',
            type: 'deposit_confirmed'
          }
        );
      }

      console.log(`✅ Depósito confirmado: ${transactionId}`);

      return updatedTransaction;

    } catch (error) {
      console.error('❌ Erro ao confirmar depósito:', error);
      throw error;
    }
  }

  /**
   * Atualizar saldo do usuário
   */
  async updateUserBalance(userId, amount) {
    try {
      // Buscar ou criar balance do usuário em Reais
      let userBalance = await this.prisma.userBalance.findFirst({
        where: {
          userId: userId,
          tokenSymbol: 'BRL'
        }
      });

      if (userBalance) {
        // Atualizar balance existente
        await this.prisma.userBalance.update({
          where: { id: userBalance.id },
          data: {
            amount: userBalance.amount + amount,
            updatedAt: new Date()
          }
        });
      } else {
        // Criar novo balance
        await this.prisma.userBalance.create({
          data: {
            userId: userId,
            tokenSymbol: 'BRL',
            amount: amount,
            network: 'mainnet'
          }
        });
      }

      console.log(`💰 Saldo atualizado para usuário ${userId}: +R$ ${amount}`);

    } catch (error) {
      console.error('❌ Erro ao atualizar saldo:', error);
      throw error;
    }
  }

  /**
   * Obter status de um depósito
   */
  async getDepositStatus(transactionId) {
    try {
      const transaction = await this.prisma.transaction.findUnique({
        where: { id: transactionId },
        select: {
          id: true,
          status: true,
          amount: true,
          createdAt: true,
          confirmedAt: true,
          blockchainTxHash: true,
          blockNumber: true,
          gasUsed: true
        }
      });

      if (!transaction) {
        throw new Error('Transação não encontrada');
      }

      return transaction;

    } catch (error) {
      console.error('❌ Erro ao obter status do depósito:', error);
      throw error;
    }
  }

  /**
   * Confirmar pagamento PIX e enviar para processamento blockchain
   */
  async confirmPixPayment(transactionId, pixData) {
    try {
      console.log(`💳 Confirmando pagamento PIX para transação ${transactionId}`);
      
      // Buscar transação
      const transaction = await this.prisma.transaction.findUnique({
        where: { id: transactionId }
      });

      if (!transaction) {
        throw new Error('Transação não encontrada');
      }

      // Verificar se já foi confirmado (evitar duplicação)
      if (transaction.metadata?.pix_confirmed) {
        console.log(`✅ PIX já confirmado para transação ${transactionId}`);
        return transaction;
      }

      // Atualizar transação com dados do PIX confirmado
      const updatedTransaction = await this.prisma.transaction.update({
        where: { id: transactionId },
        data: {
          status: 'processing',
          metadata: {
            ...transaction.metadata,
            pix_confirmed: true,
            pix_confirmation_date: new Date().toISOString(),
            pix_id: pixData.pixId,
            pix_payer_document: pixData.payerDocument,
            pix_payer_name: pixData.payerName,
            pix_paid_amount: pixData.paidAmount
          }
        }
      });

      console.log(`✅ PIX confirmado para transação ${transactionId}`);

      // Enviar para fila de processamento blockchain
      if (this.rabbitMQChannel) {
        const message = {
          transactionId: transactionId,
          userId: transaction.user_id,
          amount: transaction.amount,
          type: 'deposit_mint',
          currentRetry: 0,
          timestamp: new Date().toISOString()
        };

        await this.rabbitMQChannel.sendToQueue(
          'deposits.processing',
          Buffer.from(JSON.stringify(message)),
          { persistent: true }
        );

        console.log(`📤 Transação ${transactionId} enviada para processamento blockchain`);
      }

      return updatedTransaction;

    } catch (error) {
      console.error('❌ Erro ao confirmar PIX:', error);
      throw error;
    }
  }

  /**
   * Listar depósitos de um usuário
   */
  async getUserDeposits(userId, page = 1, limit = 10, status = null) {
    try {
      const skip = (page - 1) * limit;
      
      const where = {
        userId: userId,
        type: 'deposit'
      };

      if (status) {
        where.status = status;
      }

      const [deposits, total] = await Promise.all([
        this.prisma.transaction.findMany({
          where: where,
          select: {
            id: true,
            amount: true,
            status: true,
            createdAt: true,
            confirmedAt: true,
            blockchainTxHash: true,
            blockNumber: true,
            gasUsed: true
          },
          orderBy: { createdAt: 'desc' },
          skip: skip,
          take: limit
        }),
        this.prisma.transaction.count({ where: where })
      ]);

      return {
        deposits,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };

    } catch (error) {
      console.error('❌ Erro ao listar depósitos:', error);
      throw error;
    }
  }

  /**
   * Processar depósito da fila (chamado pelo worker)
   */
  async processDepositFromQueue(depositMessage) {
    const maxRetries = depositMessage.retryCount || 0;
    const currentRetry = depositMessage.currentRetry || 0;
    
    try {
      console.log(`🔄 Processando depósito da fila: ${depositMessage.transactionId} (Tentativa ${currentRetry + 1})`);
      
      // Buscar dados da transação
      const transaction = await this.prisma.transaction.findUnique({
        where: { id: depositMessage.transactionId },
        include: { user: true }
      });

      if (!transaction) {
        throw new Error(`Transação não encontrada: ${depositMessage.transactionId}`);
      }

      // VALIDAÇÃO CRÍTICA: Verificar se o PIX foi confirmado
      if (!transaction.metadata?.pix_confirmed) {
        console.log(`⚠️ PIX ainda não confirmado para transação ${transaction.id}`);
        throw new Error('PIX payment not confirmed yet');
      }

      // Verificar se é um depósito confirmado
      if (transaction.type !== 'deposit' || transaction.status !== 'processing') {
        console.log(`⚠️ Transação ${transaction.id} não está pronta para processamento`);
        return;
      }

      // Verificar se já foi processado (evitar duplicação)
      if (transaction.blockchain_data?.tx_hash) {
        console.log(`✅ Transação ${transaction.id} já foi processada na blockchain`);
        return;
      }

      // Obter endereço da carteira do usuário
      const userWallet = transaction.user.public_key;
      if (!userWallet) {
        throw new Error(`Usuário ${transaction.user.id} não possui carteira configurada`);
      }

      // Configurações do token cBRL
      const TOKEN_CONTRACT_ADDRESS = process.env.CBRL_CONTRACT_ADDRESS || '0x0A8c73967e4Eee8ffA06484C3fBf65E6Ae3b9804';
      if (!TOKEN_CONTRACT_ADDRESS || !process.env.ADMIN_WALLET_PRIVATE_KEY) {
        // Se não configurado, usar simulação
        console.warn('⚠️ Contrato cBRL não configurado, usando simulação');
        
        // Simular processamento na blockchain
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Gerar hash simulado da transação
        const blockchainTxHash = `0x${Math.random().toString(16).substr(2, 64)}`;
        const blockNumber = Math.floor(Math.random() * 1000000) + 1;
        const gasUsed = Math.floor(Math.random() * 100000) + 21000;
        
        // Confirmar depósito com dados simulados
        await this.confirmDeposit(
          depositMessage.transactionId,
          blockchainTxHash,
          blockNumber,
          gasUsed
        );
      } else {
        // Executar mint real na blockchain
        const blockchainService = require('./blockchain.service');
        const { loadLocalABI } = require('../contracts');
        const { ethers } = require('ethers');

        // Carregar ABI do token
        const tokenABI = loadLocalABI('default_token_abi');

        // Calcular quantidade a mintar (valor do depósito menos taxas)
        const amountToMint = transaction.amount; // Já descontadas as taxas
        const amountInWei = ethers.parseUnits(amountToMint.toString(), 18);

        console.log(`🏭 Mintando ${amountToMint} cBRL para ${userWallet}`);

        // Executar mint na blockchain
        const mintResult = await blockchainService.executeContractFunction(
          TOKEN_CONTRACT_ADDRESS,
          tokenABI,
          'mint',
          [userWallet, amountInWei],
          'testnet', // ou usar transaction.network se disponível
          {
            privateKey: process.env.ADMIN_WALLET_PRIVATE_KEY,
            gasLimit: 200000
          }
        );

        console.log(`✅ Mint executado: ${mintResult.transactionHash}`);
        
        // Confirmar depósito com dados reais da blockchain
        await this.confirmDeposit(
          depositMessage.transactionId,
          mintResult.transactionHash,
          mintResult.blockNumber,
          mintResult.gasUsed
        );
      }

      console.log(`✅ Depósito processado com sucesso: ${depositMessage.transactionId}`);

    } catch (error) {
      console.error('❌ Erro ao processar depósito da fila:', error);
      
      // Marcar transação como falha
      await this.markTransactionAsFailed(depositMessage.transactionId, error.message);
      
      throw error;
    }
  }

  /**
   * Marcar transação como falha
   */
  async markTransactionAsFailed(transactionId, errorMessage) {
    try {
      await this.prisma.transaction.update({
        where: { id: transactionId },
        data: {
          status: 'failed',
          metadata: {
            error: errorMessage,
            failedAt: new Date().toISOString()
          }
        }
      });

      console.log(`❌ Transação marcada como falha: ${transactionId}`);

    } catch (error) {
      console.error('❌ Erro ao marcar transação como falha:', error);
    }
  }

  /**
   * Fechar conexões
   */
  async closeConnections() {
    try {
      if (this.rabbitMQChannel) {
        await this.rabbitMQChannel.close();
      }
      if (this.rabbitMQConnection) {
        await this.rabbitMQConnection.close();
      }
      await this.prisma.$disconnect();
    } catch (error) {
      console.error('❌ Erro ao fechar conexões:', error);
    }
  }
}

module.exports = DepositService;
