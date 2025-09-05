const prismaConfig = require('../config/prisma');
const { v4: uuidv4 } = require('uuid');

/**
 * Serviço para criar transações padronizadas de saque
 */
class WithdrawTransactionService {
  constructor() {
    this.prisma = null;
  }

  async init() {
    this.prisma = prismaConfig.getPrisma();
  }

  /**
   * Criar transação de saque padronizada
   */
  async createWithdrawTransaction(data) {
    try {
      if (!this.prisma) await this.init();

      const {
        userId,
        companyId,
        amount,
        fee,
        netAmount,
        pixKey,
        pixKeyType,
        userAddress,
        withdrawalId
      } = data;

      // Configurações padrão
      const CONTRACT_ADDRESS = process.env.CBRL_TOKEN_ADDRESS || '0x0A8c73967e4Eee8ffA06484C3fBf65E6Ae3b9804';
      const NETWORK = process.env.BLOCKCHAIN_NETWORK || 'testnet';

      // Criar transação padronizada
      const transaction = await this.prisma.transaction.create({
        data: {
          id: uuidv4(),
          userId: userId,
          companyId: companyId,
          transactionType: 'withdraw', // Padronizado como 'withdraw'
          
          // Status principal
          status: 'pending',
          
          // Valores
          amount: parseFloat(amount), // Valor total do saque (cBRL queimado)
          fee: parseFloat(fee || 0),
          net_amount: parseFloat(netAmount || amount), // Valor líquido que o usuário recebe via PIX
          currency: 'cBRL', // Saque de cBRL
          
          // Blockchain fields
          network: NETWORK,
          contractAddress: CONTRACT_ADDRESS,
          fromAddress: userAddress, // Endereço do usuário (burn vem do usuário)
          toAddress: null, // Burn não tem destino
          functionName: 'burn',
          
          // PIX - Inicialmente pendente
          pix_status: 'pending',
          pix_key: pixKey,
          pix_key_type: pixKeyType || 'UNKNOWN',
          
          // Blockchain - Inicialmente pendente (saque inicia com burn)
          blockchain_status: 'pending',
          
          // Tipo de operação
          operation_type: 'withdraw',
          
          // Metadata completa
          metadata: {
            type: 'withdraw',
            withdrawalId: withdrawalId,
            paymentMethod: 'pix',
            description: `Saque PIX de ${amount} cBRL`,
            source: 'user_withdraw',
            network: NETWORK,
            contractAddress: CONTRACT_ADDRESS,
            functionName: 'burn',
            timestamp: new Date().toISOString(),
            fee: fee,
            grossAmount: amount,
            netAmount: netAmount,
            userAddress: userAddress,
            pixInfo: {
              key: pixKey,
              keyType: pixKeyType,
              status: 'pending'
            },
            blockchainInfo: {
              status: 'pending',
              network: NETWORK,
              contractAddress: CONTRACT_ADDRESS,
              functionName: 'burn',
              burnAmount: amount
            }
          }
        }
      });

      console.log(`✅ Transação de saque criada: ${transaction.id}`);
      return transaction;

    } catch (error) {
      console.error('❌ Erro ao criar transação de saque:', error);
      throw error;
    }
  }

  /**
   * Atualizar transação com dados do burn
   */
  async updateWithBurnData(transactionId, burnData) {
    try {
      if (!this.prisma) await this.init();

      const transaction = await this.prisma.transaction.findUnique({
        where: { id: transactionId }
      });

      if (!transaction) {
        throw new Error('Transação não encontrada');
      }

      const updateData = {
        // Atualizar status blockchain
        blockchain_status: 'confirmed',
        blockchain_confirmed_at: new Date(),
        blockchain_tx_hash: burnData.transactionHash,
        blockchain_block_number: burnData.blockNumber,
        
        // Campo unificado de hash
        txHash: burnData.transactionHash,
        
        // Outros campos blockchain
        blockNumber: burnData.blockNumber,
        gasUsed: burnData.gasUsed,
        
        // Metadata atualizada
        metadata: {
          ...transaction.metadata,
          blockchainInfo: {
            ...transaction.metadata?.blockchainInfo,
            status: 'confirmed',
            txHash: burnData.transactionHash,
            blockNumber: burnData.blockNumber,
            gasUsed: burnData.gasUsed,
            confirmedAt: new Date().toISOString(),
            burnResult: burnData
          }
        }
      };

      // Se PIX também está confirmado, marcar transação como completa
      if (transaction.pix_status === 'confirmed') {
        updateData.status = 'confirmed';
        updateData.confirmedAt = new Date();
      }

      const updated = await this.prisma.transaction.update({
        where: { id: transactionId },
        data: updateData
      });

      console.log(`✅ Transação atualizada com dados do burn: ${transactionId}`);
      return updated;

    } catch (error) {
      console.error('❌ Erro ao atualizar transação com burn:', error);
      throw error;
    }
  }

  /**
   * Atualizar transação com dados do PIX
   */
  async updateWithPixData(transactionId, pixData) {
    try {
      console.log('🔍 [updateWithPixData] Iniciando atualização:', { transactionId, pixData });
      
      if (!this.prisma) await this.init();

      const transaction = await this.prisma.transaction.findUnique({
        where: { id: transactionId }
      });

      if (!transaction) {
        console.error('❌ [updateWithPixData] Transação não encontrada:', transactionId);
        throw new Error('Transação não encontrada');
      }
      
      console.log('🔍 [updateWithPixData] Transação encontrada:', {
        id: transaction.id,
        status: transaction.status,
        blockchain_status: transaction.blockchain_status,
        pix_status: transaction.pix_status
      });

      const updateData = {
        // Atualizar status PIX
        pix_status: 'confirmed',
        pix_confirmed_at: new Date(),
        pix_transaction_id: pixData.pixTransactionId,
        pix_end_to_end_id: pixData.pixEndToEndId,
        
        // Metadata atualizada
        metadata: {
          ...transaction.metadata,
          pixInfo: {
            ...transaction.metadata?.pixInfo,
            status: 'confirmed',
            transactionId: pixData.pixTransactionId,
            endToEndId: pixData.pixEndToEndId,
            confirmedAt: new Date().toISOString(),
            processedAmount: pixData.amount || transaction.net_amount
          }
        }
      };

      // Se blockchain também está confirmado, marcar transação como completa
      if (transaction.blockchain_status === 'confirmed') {
        console.log('🎯 [updateWithPixData] Blockchain confirmado, atualizando status para confirmed');
        updateData.status = 'confirmed';
        updateData.confirmedAt = new Date();
      } else {
        console.log('⚠️ [updateWithPixData] Blockchain ainda não confirmado:', transaction.blockchain_status);
      }

      console.log('🔍 [updateWithPixData] Dados que serão atualizados:', updateData);

      const updated = await this.prisma.transaction.update({
        where: { id: transactionId },
        data: updateData
      });

      console.log(`✅ [updateWithPixData] Transação atualizada com sucesso:`, {
        id: updated.id,
        status: updated.status,
        blockchain_status: updated.blockchain_status,
        pix_status: updated.pix_status
      });
      return updated;

    } catch (error) {
      console.error('❌ Erro ao atualizar transação com PIX:', error);
      throw error;
    }
  }

  /**
   * Buscar transação por withdrawalId
   */
  async findByWithdrawalId(withdrawalId) {
    try {
      if (!this.prisma) await this.init();

      const transaction = await this.prisma.transaction.findFirst({
        where: {
          metadata: {
            path: ['withdrawalId'],
            equals: withdrawalId
          }
        }
      });

      return transaction;

    } catch (error) {
      console.error('❌ Erro ao buscar transação por withdrawalId:', error);
      throw error;
    }
  }

  /**
   * Marcar transação como falha
   */
  async markAsFailed(transactionId, reason) {
    try {
      if (!this.prisma) await this.init();

      const transaction = await this.prisma.transaction.findUnique({
        where: { id: transactionId }
      });

      if (!transaction) {
        throw new Error('Transação não encontrada');
      }

      const updated = await this.prisma.transaction.update({
        where: { id: transactionId },
        data: {
          status: 'failed',
          failedAt: new Date(),
          metadata: {
            ...transaction.metadata,
            failureReason: reason,
            failedAt: new Date().toISOString()
          }
        }
      });

      console.log(`❌ Transação marcada como falha: ${transactionId}`);
      return updated;

    } catch (error) {
      console.error('❌ Erro ao marcar transação como falha:', error);
      throw error;
    }
  }
}

// Exportar instância singleton
module.exports = new WithdrawTransactionService();