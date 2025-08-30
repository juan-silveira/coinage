const prismaConfig = require('../config/prisma');
const { v4: uuidv4 } = require('uuid');
const amqp = require('amqplib');
const NotificationService = require('./notification.service');
const mintService = require('./mint.service');
const userTaxesService = require('./userTaxes.service');

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
   * Iniciar processo de depósito (TRANSAÇÃO ÚNICA)
   */
  async initiateDeposit(amount, userId) {
    try {
      if (!this.prisma) await this.init();
      
      // Buscar empresa do usuário
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

      // Calcular taxa usando UserTaxesService
      const feeCalculation = await userTaxesService.calculateDepositFee(userId, amount);
      const fee = feeCalculation.fee;
      const totalAmount = feeCalculation.totalAmount; // Valor total que o usuário deve pagar
      const netAmount = amount; // Valor que será creditado em cBRL

      // Endereços e configurações padrão
      const ADMIN_ADDRESS = process.env.ADMIN_WALLET_ADDRESS || '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb3';
      const CONTRACT_ADDRESS = process.env.CBRL_TOKEN_ADDRESS || '0x0A8c73967e4Eee8ffA06484C3fBf65E6Ae3b9804';
      const NETWORK = process.env.BLOCKCHAIN_NETWORK || 'testnet';

      // CRIAR TRANSAÇÃO ÚNICA com campos unificados e padronizados
      const transaction = await this.prisma.transaction.create({
        data: {
          id: uuidv4(),
          userId: userId,
          companyId: companyId,
          transactionType: 'deposit', // Padronizado como 'deposit'
          
          // Status principal
          status: 'pending',
          
          // Valores
          amount: parseFloat(totalAmount), // Total a pagar (amount + fee)
          fee: parseFloat(fee),
          net_amount: parseFloat(netAmount), // Valor que será creditado
          currency: 'cBRL', // Depósito resulta em cBRL
          
          // Blockchain fields (preenchidos desde o início)
          network: NETWORK,
          contractAddress: CONTRACT_ADDRESS,
          fromAddress: ADMIN_ADDRESS, // Endereço admin (mint vem do admin)
          toAddress: user?.blockchainAddress || user?.publicKey, // Endereço do usuário
          functionName: 'mint',
          
          // PIX - Inicialmente pendente
          pix_status: 'pending',
          pix_key: 'contato@coinage.com.br',
          pix_key_type: 'EMAIL',
          
          // Blockchain - Inicialmente null (só inicia após PIX confirmado)
          blockchain_status: null,
          
          // Tipo de operação
          operation_type: 'deposit',
          
          // Metadata
          metadata: {
            type: 'deposit',
            paymentMethod: 'pix',
            description: `Depósito PIX de R$ ${netAmount}`,
            source: 'user_deposit',
            network: NETWORK,
            contractAddress: CONTRACT_ADDRESS,
            functionName: 'mint',
            timestamp: new Date().toISOString(),
            fee: fee,
            totalAmount: totalAmount,
            netAmount: netAmount,
            adminAddress: ADMIN_ADDRESS,
            userAddress: user?.blockchainAddress || user?.publicKey
          }
        }
      });

      // MOCK: Criar dados PIX simulados
      const pixPaymentId = `pix_${transaction.id}_${Date.now()}`;
      const pixData = {
        pixPaymentId,
        transactionId: transaction.id,
        amount: parseFloat(totalAmount), // Total a pagar
        netAmount: parseFloat(netAmount), // Valor líquido
        fee: parseFloat(fee),
        status: 'pending',
        qrCode: `00020126580014br.gov.bcb.pix2536pix-qr.mercadopago.com/instore/o/v2/${pixPaymentId}5204000053039865802BR5925Coinage Tecnologia6009Sao Paulo62070503***6304${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        pixKey: 'contato@coinage.com.br',
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutos
        createdAt: new Date()
      };

      console.log(`📱 PIX mock criado: ${pixPaymentId} para transação única ${transaction.id}`);

      return {
        transactionId: transaction.id,
        amount: netAmount, // Valor líquido
        totalAmount: totalAmount, // Total a pagar
        fee: fee,
        status: 'pending',
        pixPaymentId: pixPaymentId,
        pixData: pixData
      };

    } catch (error) {
      console.error('❌ Erro ao iniciar depósito:', error);
      throw error;
    }
  }

  /**
   * Confirmar depósito PIX (atualizar apenas status PIX)
   */
  async confirmPixDeposit(transactionId, pixData = null) {
    try {
      if (!this.prisma) await this.init();
      
      // Buscar transação
      const transaction = await this.prisma.transaction.findUnique({
        where: { id: transactionId }
      });

      if (!transaction) {
        throw new Error('Transação não encontrada');
      }

      if (transaction.pix_status !== 'pending') {
        throw new Error('PIX não está pendente');
      }

      // TRANSAÇÃO ATÔMICA: Atualizar PIX e controlar fila blockchain
      const updatedTransaction = await this.prisma.$transaction(async (prisma) => {
        // Verificar se blockchain já foi iniciado (prevenir múltiplos envios para fila)
        const currentTransaction = await prisma.transaction.findUnique({
          where: { id: transactionId }
        });

        if (currentTransaction.blockchain_status !== null) {
          console.log(`🛡️ BLOCKCHAIN JÁ INICIADO: ${transactionId} (status: ${currentTransaction.blockchain_status})`);
          return currentTransaction; // Retornar sem enviar novamente para fila
        }

        // Atualizar atomicamente PIX e iniciar blockchain
        return await prisma.transaction.update({
          where: { id: transactionId },
          data: {
            // PIX confirmado
            pix_status: 'confirmed',
            pix_confirmed_at: new Date(),
            pix_transaction_id: pixData?.pixId || `mock_pix_${Date.now()}`,
            pix_end_to_end_id: pixData?.endToEndId || `E${Date.now()}`,
            
            // Iniciar blockchain ATOMICAMENTE
            blockchain_status: 'pending',
            
            // Status geral ainda pendente (aguardando blockchain)
            status: 'pending',
            
            // Atualizar metadata
            metadata: {
              ...currentTransaction.metadata,
              pixConfirmation: {
                confirmedAt: new Date().toISOString(),
                ...(pixData && {
                  pixId: pixData.pixId,
                  payerDocument: pixData.payerDocument,
                  payerName: pixData.payerName,
                  paidAmount: pixData.paidAmount
                })
              }
            }
          }
        });
      });

      // VERIFICAR SE JÁ FOI ENVIADO PARA FILA (blockchain_status mudou de null para pending)
      if (transaction.blockchain_status === null && updatedTransaction.blockchain_status === 'pending') {
        // Buscar endereço blockchain do usuário
        const user = await this.prisma.user.findUnique({
          where: { id: transaction.userId },
          select: { blockchainAddress: true, publicKey: true }
        });
        
        const recipientAddress = user?.blockchainAddress || user?.publicKey;
        if (!recipientAddress) {
          throw new Error('Usuário não possui endereço blockchain configurado');
        }

        // ENVIAR PARA FILA APENAS UMA VEZ
        await this.connectToRabbitMQ();
        const mintData = {
          transactionId: transactionId,
          userId: transaction.userId,
          recipientAddress: recipientAddress, // Endereço para receber os tokens
          amount: transaction.net_amount, // Usar valor líquido
          network: 'testnet'
        };

        await this.rabbitMQChannel.sendToQueue('blockchain.mint', Buffer.from(JSON.stringify(mintData)), {
          persistent: true
        });

        console.log(`✅ PIX confirmado para transação ${transactionId}, enviado para mint (PRIMEIRA VEZ)`);
      } else {
        console.log(`🛡️ PIX confirmado para ${transactionId}, mas blockchain JÁ INICIADO - NÃO enviado para fila novamente`);
      }

      return updatedTransaction;

    } catch (error) {
      console.error('❌ Erro ao confirmar PIX:', error);
      throw error;
    }
  }

  /**
   * Confirmar mint blockchain (atualizar apenas status blockchain) - COM LOCK ATÔMICO
   */
  async confirmBlockchainMint(transactionId, blockchainData) {
    try {
      if (!this.prisma) await this.init();
      
      // TRANSAÇÃO ATÔMICA COM LOCK PARA PREVENIR DUPLICAÇÃO
      const result = await this.prisma.$transaction(async (prisma) => {
        // Buscar E LOCKEAR transação atomicamente
        const transaction = await prisma.transaction.findUnique({
          where: { id: transactionId }
        });

        if (!transaction) {
          throw new Error('Transação não encontrada');
        }

        // VERIFICAÇÃO CRÍTICA: Se já foi processado, ABORTAR imediatamente
        if (transaction.blockchain_status === 'confirmed') {
          console.log(`🛡️ DUPLICATA DETECTADA E BLOQUEADA: ${transactionId} já foi processado`);
          return { already_processed: true, transaction };
        }

        if (transaction.blockchain_status !== 'pending') {
          throw new Error(`Blockchain status inválido: ${transaction.blockchain_status}. Esperado: pending`);
        }

        // VALIDAR: PIX deve estar confirmado antes de confirmar status geral
        if (transaction.pix_status !== 'confirmed') {
          throw new Error(`PIX deve estar confirmado antes da blockchain. PIX status: ${transaction.pix_status}`);
        }

        // Atualizar ATOMICAMENTE para confirmed
        return await prisma.transaction.update({
          where: { id: transactionId },
          data: {
            // Blockchain confirmado
            blockchain_status: 'confirmed',
            blockchain_confirmed_at: new Date(),
            blockchain_tx_hash: blockchainData.txHash,
            blockchain_block_number: blockchainData.blockNumber,
            
            // Dados blockchain (usar txHash como campo principal)
            txHash: blockchainData.txHash, // Campo principal unificado
            blockNumber: blockchainData.blockNumber,
            fromAddress: blockchainData.fromAddress || transaction.fromAddress,
            toAddress: blockchainData.toAddress || transaction.toAddress,
            gasUsed: blockchainData.gasUsed,
            
            // Status geral CONFIRMADO (só agora que PIX + Blockchain estão ok)
            status: 'confirmed',
            confirmedAt: new Date(),
            
            // Atualizar metadata
            metadata: {
              ...transaction.metadata,
              blockchainConfirmation: {
                confirmedAt: new Date().toISOString(),
                txHash: blockchainData.txHash,
                blockNumber: blockchainData.blockNumber,
                gasUsed: blockchainData.gasUsed
              }
            }
          }
        });
      });

      // Se já foi processado, retornar sem fazer nada
      if (result.already_processed) {
        return result.transaction;
      }

      // Notificar usuário (somente se não foi processado anteriormente)
      await this.notificationService.createNotification({
        userId: result.userId,
        type: 'success',
        title: 'Depósito Confirmado',
        message: `Seu depósito de ${result.net_amount} cBRL foi confirmado com sucesso!`,
        data: {
          transactionId: result.id,
          amount: result.net_amount,
          type: 'deposit_confirmed'
        }
      });

      console.log(`✅ Blockchain confirmado para transação ${transactionId}`);

      return result;

    } catch (error) {
      console.error('❌ Erro ao confirmar blockchain:', error);
      throw error;
    }
  }

  /**
   * Marcar falha no PIX
   */
  async failPixDeposit(transactionId, reason) {
    try {
      if (!this.prisma) await this.init();
      
      const transaction = await this.prisma.transaction.findUnique({
        where: { id: transactionId }
      });
      
      return await this.prisma.transaction.update({
        where: { id: transactionId },
        data: {
          pix_status: 'failed',
          pix_failed_at: new Date(),
          status: 'failed',
          failedAt: new Date(),
          metadata: {
            ...(transaction?.metadata || {}),
            failureReason: reason,
            failedAt: new Date().toISOString()
          }
        }
      });

    } catch (error) {
      console.error('❌ Erro ao marcar falha PIX:', error);
      throw error;
    }
  }

  /**
   * Marcar falha no blockchain
   */
  async failBlockchainMint(transactionId, reason) {
    try {
      if (!this.prisma) await this.init();
      
      const transaction = await this.prisma.transaction.findUnique({
        where: { id: transactionId }
      });
      
      return await this.prisma.transaction.update({
        where: { id: transactionId },
        data: {
          blockchain_status: 'failed',
          blockchain_failed_at: new Date(),
          status: 'failed',
          failedAt: new Date(),
          metadata: {
            ...(transaction?.metadata || {}),
            blockchainFailureReason: reason,
            failedAt: new Date().toISOString()
          }
        }
      });

    } catch (error) {
      console.error('❌ Erro ao marcar falha blockchain:', error);
      throw error;
    }
  }

  /**
   * Obter status do depósito
   */
  async getDepositStatus(transactionId) {
    try {
      if (!this.prisma) await this.init();
      
      const transaction = await this.prisma.transaction.findUnique({
        where: { id: transactionId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true
            }
          }
        }
      });
      
      if (!transaction) {
        throw new Error('Transação não encontrada');
      }
      
      return {
        id: transaction.id,
        amount: transaction.net_amount || transaction.amount,
        fee: transaction.fee,
        totalAmount: transaction.amount,
        status: transaction.status,
        pixStatus: transaction.pix_status,
        blockchainStatus: transaction.blockchain_status,
        pixTransactionId: transaction.pix_transaction_id,
        blockchainTxHash: transaction.blockchain_tx_hash || transaction.txHash,
        createdAt: transaction.createdAt,
        confirmedAt: transaction.confirmedAt,
        metadata: transaction.metadata
      };
      
    } catch (error) {
      console.error('❌ Erro ao obter status do depósito:', error);
      throw error;
    }
  }
}

module.exports = new DepositService();