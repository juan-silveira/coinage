const rabbitmqConfig = require('../config/rabbitmq');
const blockchainService = require('./blockchain.service');
const transactionService = require('./transaction.service');
const userActionsService = require('./userActions.service');
const webhookService = require('./webhook.service');

class BlockchainQueueService {
  constructor() {
    this.isInitialized = false;
  }

  /**
   * Inicializa o serviço de fila blockchain
   */
  async initialize() {
    try {
      if (!rabbitmqConfig.isConnected) {
        await rabbitmqConfig.initialize();
      }

      this.isInitialized = true;
      console.log('✅ BlockchainQueueService: Initialized');
      return true;

    } catch (error) {
      console.error('❌ BlockchainQueueService: Initialization failed:', error);
      return false;
    }
  }

  /**
   * Envia transação para processamento assíncrono
   */
  async queueTransaction(transactionData, options = {}) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const message = {
        type: 'blockchain_transaction',
        transactionId: transactionData.transactionId,
        userId: transactionData.userId,
        companyId: transactionData.companyId,
        network: transactionData.network,
        operation: transactionData.operation,
        data: transactionData,
        priority: options.priority || this.getPriorityByOperation(transactionData.operation),
        webhookUrl: transactionData.webhookUrl,
        createdAt: new Date().toISOString()
      };

      const routingKey = `transaction.${transactionData.operation}`;
      
      await rabbitmqConfig.publishMessage(
        rabbitmqConfig.exchanges.BLOCKCHAIN,
        routingKey,
        message,
        {
          priority: message.priority,
          correlationId: transactionData.transactionId,
          headers: {
            'x-transaction-type': transactionData.operation,
            'x-network': transactionData.network,
            'x-user-id': transactionData.userId
          }
        }
      );

      console.log(`📤 Transaction queued: ${transactionData.transactionId} (${transactionData.operation})`);
      
      return {
        success: true,
        messageId: message.messageId,
        transactionId: transactionData.transactionId,
        queuedAt: message.createdAt
      };

    } catch (error) {
      console.error('❌ Error queuing transaction:', error);
      throw error;
    }
  }

  /**
   * Envia depósito para processamento
   */
  async queueDeposit(depositData, options = {}) {
    try {
      const message = {
        type: 'deposit_processing',
        depositId: depositData.depositId,
        userId: depositData.userId,
        amount: depositData.amount,
        pixData: depositData.pixData,
        blockchainAddress: depositData.blockchainAddress,
        network: depositData.network || 'testnet',
        status: 'pending',
        priority: options.priority || 8,
        webhookUrl: depositData.webhookUrl,
        createdAt: new Date().toISOString()
      };

      const routingKey = 'deposit.pix';
      
      await rabbitmqConfig.publishMessage(
        rabbitmqConfig.exchanges.BLOCKCHAIN,
        routingKey,
        message,
        {
          priority: message.priority,
          correlationId: depositData.depositId
        }
      );

      console.log(`📤 Deposit queued: ${depositData.depositId}`);
      return { success: true, depositId: depositData.depositId };

    } catch (error) {
      console.error('❌ Error queuing deposit:', error);
      throw error;
    }
  }

  /**
   * Envia saque para processamento
   */
  async queueWithdrawal(withdrawalData, options = {}) {
    try {
      const message = {
        type: 'withdrawal_processing',
        withdrawalId: withdrawalData.withdrawalId,
        userId: withdrawalData.userId,
        amount: withdrawalData.amount,
        pixKey: withdrawalData.pixKey,
        blockchainAddress: withdrawalData.blockchainAddress,
        network: withdrawalData.network || 'testnet',
        status: 'pending',
        priority: options.priority || 9,
        webhookUrl: withdrawalData.webhookUrl,
        createdAt: new Date().toISOString()
      };

      const routingKey = 'withdrawal.pix';
      
      await rabbitmqConfig.publishMessage(
        rabbitmqConfig.exchanges.BLOCKCHAIN,
        routingKey,
        message,
        {
          priority: message.priority,
          correlationId: withdrawalData.withdrawalId
        }
      );

      console.log(`📤 Withdrawal queued: ${withdrawalData.withdrawalId}`);
      return { success: true, withdrawalId: withdrawalData.withdrawalId };

    } catch (error) {
      console.error('❌ Error queuing withdrawal:', error);
      throw error;
    }
  }

  /**
   * Envia operação de contrato para processamento
   */
  async queueContractOperation(contractData, options = {}) {
    try {
      const message = {
        type: 'contract_operation',
        operationId: contractData.operationId,
        contractAddress: contractData.contractAddress,
        contractType: contractData.contractType,
        functionName: contractData.functionName,
        functionParams: contractData.functionParams,
        fromAddress: contractData.fromAddress,
        network: contractData.network,
        userId: contractData.userId,
        priority: options.priority || 7,
        webhookUrl: contractData.webhookUrl,
        createdAt: new Date().toISOString()
      };

      const routingKey = `contract.${contractData.functionName}`;
      
      await rabbitmqConfig.publishMessage(
        rabbitmqConfig.exchanges.BLOCKCHAIN,
        routingKey,
        message,
        {
          priority: message.priority,
          correlationId: contractData.operationId
        }
      );

      console.log(`📤 Contract operation queued: ${contractData.operationId}`);
      return { success: true, operationId: contractData.operationId };

    } catch (error) {
      console.error('❌ Error queuing contract operation:', error);
      throw error;
    }
  }

  /**
   * Envia notificação de e-mail
   */
  async queueEmailNotification(emailData, options = {}) {
    try {
      const message = {
        type: 'email_notification',
        to: emailData.to,
        subject: emailData.subject,
        template: emailData.template,
        data: emailData.data,
        userId: emailData.userId,
        priority: options.priority || 5,
        createdAt: new Date().toISOString()
      };

      const routingKey = `email.${emailData.template}`;
      
      await rabbitmqConfig.publishMessage(
        rabbitmqConfig.exchanges.NOTIFICATIONS,
        routingKey,
        message,
        {
          priority: message.priority,
          correlationId: emailData.correlationId
        }
      );

      console.log(`📤 Email notification queued: ${emailData.to}`);
      return { success: true };

    } catch (error) {
      console.error('❌ Error queuing email:', error);
      throw error;
    }
  }

  /**
   * Envia webhook
   */
  async queueWebhook(webhookData, options = {}) {
    try {
      const message = {
        type: 'webhook_notification',
        url: webhookData.url,
        method: webhookData.method || 'POST',
        headers: webhookData.headers || {},
        data: webhookData.data,
        event: webhookData.event,
        userId: webhookData.userId,
        priority: options.priority || 6,
        maxRetries: webhookData.maxRetries || 3,
        createdAt: new Date().toISOString()
      };

      const routingKey = `webhook.${webhookData.event}`;
      
      await rabbitmqConfig.publishMessage(
        rabbitmqConfig.exchanges.NOTIFICATIONS,
        routingKey,
        message,
        {
          priority: message.priority,
          correlationId: webhookData.correlationId
        }
      );

      console.log(`📤 Webhook queued: ${webhookData.url}`);
      return { success: true };

    } catch (error) {
      console.error('❌ Error queuing webhook:', error);
      throw error;
    }
  }

  /**
   * Processa mensagem de transação blockchain
   */
  async processBlockchainTransaction(message, messageInfo) {
    try {
      const { transactionId, operation, data, webhookUrl, userId } = message;
      
      console.log(`🔄 Processing blockchain transaction: ${transactionId} (${operation})`);

      // Atualizar status para processing
      await transactionService.updateTransactionStatus(transactionId, {
        status: 'processing',
        metadata: {
          queueProcessedAt: new Date().toISOString(),
          messageId: messageInfo.properties.messageId
        }
      });

      let result;

      switch (operation) {
        case 'transfer':
          result = await this.processTransfer(data);
          break;
        case 'mint':
          result = await this.processMint(data);
          break;
        case 'burn':
          result = await this.processBurn(data);
          break;
        case 'stake':
          result = await this.processStake(data);
          break;
        case 'unstake':
          result = await this.processUnstake(data);
          break;
        default:
          throw new Error(`Unknown operation: ${operation}`);
      }

      // Atualizar transação com resultado
      await transactionService.updateTransactionStatus(transactionId, {
        status: result.success ? 'confirmed' : 'failed',
        txHash: result.txHash,
        blockNumber: result.blockNumber,
        gasUsed: result.gasUsed,
        actualGasCost: result.gasCost,
        confirmedAt: result.success ? new Date() : null,
        failedAt: result.success ? null : new Date(),
        error: result.success ? null : { message: result.error },
        receipt: result.receipt
      });

      // Log da ação
      if (userId) {
        await userActionsService.logBlockchain(userId, `transaction_${result.success ? 'confirmed' : 'failed'}`, {}, {
          status: result.success ? 'success' : 'failed',
          details: {
            operation,
            txHash: result.txHash,
            network: data.network,
            gasUsed: result.gasUsed
          },
          relatedId: transactionId,
          relatedType: 'blockchain_transaction'
        });
      }

      // Chamar webhook se fornecido
      if (webhookUrl) {
        await this.queueWebhook({
          url: webhookUrl,
          event: result.success ? 'transaction_confirmed' : 'transaction_failed',
          data: {
            transactionId,
            operation,
            status: result.success ? 'confirmed' : 'failed',
            txHash: result.txHash,
            blockNumber: result.blockNumber,
            error: result.error
          },
          userId
        });
      }

      console.log(`✅ Transaction processed: ${transactionId} - ${result.success ? 'Success' : 'Failed'}`);

    } catch (error) {
      console.error(`❌ Error processing transaction ${message.transactionId}:`, error);
      
      // Atualizar status para failed
      await transactionService.updateTransactionStatus(message.transactionId, {
        status: 'failed',
        failedAt: new Date(),
        error: { message: error.message }
      });

      throw error;
    }
  }

  /**
   * Processa mensagem de depósito
   */
  async processDeposit(message, messageInfo) {
    try {
      const { depositId, userId, amount, pixData, blockchainAddress, network } = message;
      
      console.log(`🔄 Processing deposit: ${depositId}`);

      // 1. Verificar status do pagamento PIX
      const pixService = require('./pix.service');
      const pixStatus = await pixService.checkPaymentStatus(pixData.paymentId);
      
      if (!pixStatus.success || pixStatus.status !== 'approved') {
        throw new Error(`PIX payment not approved: ${pixStatus.status}`);
      }

      // 2. Mint tokens na blockchain Azore
      // Usar token service genérico para mint
      const tokenService = require('./token.service');
      const mintResult = await tokenService.mintTokens(
        depositData.tokenContract, // contrato do token
        blockchainAddress,
        amount,
        depositData.network || 'testnet'
      );
      
      if (!mintResult.success) {
        throw new Error(`Failed to mint tokens: ${mintResult.error}`);
      }
      //   depositId,
      //   pixPaymentId: pixData.paymentId,
      //   pixEndToEndId: pixStatus.endToEndId,
      //   pixTxId: pixStatus.txId,
      //   paidAt: pixStatus.paidAt,
      //   paidAmount: pixStatus.paidAmount
      // });
      
      if (!mintResult.success) {
        throw new Error(`Failed to mint cBRL tokens: ${mintResult.error}`);
      }

      // 3. Log da ação do usuário
      if (userId) {
        await userActionsService.logFinancial(userId, 'deposit_completed', {}, {
          status: 'success',
          details: {
            amount,
            pixPaymentId: pixData.paymentId,
            txHash: mintResult.txHash,
            blockNumber: mintResult.blockNumber,
            network,
            contractAddress: mintResult.contractAddress
          },
          relatedId: depositId,
          relatedType: 'deposit'
        });
      }

      console.log(`✅ Deposit processed successfully: ${depositId} - TX: ${mintResult.txHash}`);

      // 4. Notificar usuário por email
      await this.queueEmailNotification({
        to: pixData.userEmail,
        subject: 'Depósito Confirmado - cBRL',
        template: 'deposit_confirmed',
        data: {
          amount,
          currency: 'cBRL',
          txHash: mintResult.txHash,
          blockNumber: mintResult.blockNumber,
          network,
          explorerUrl: cBRLService.getExplorerUrl(mintResult.txHash),
          pixEndToEndId: pixStatus.endToEndId
        },
        userId
      });

      return mintResult;

    } catch (error) {
      console.error(`❌ Error processing deposit ${message.depositId}:`, error);
      
      // Log da falha
      if (message.userId) {
        await userActionsService.logFinancial(message.userId, 'deposit_failed', {}, {
          status: 'failed',
          details: {
            amount: message.amount,
            pixPaymentId: message.pixData.paymentId,
            error: error.message,
            network: message.network
          },
          relatedId: message.depositId,
          relatedType: 'deposit'
        });
      }
      
      // Notificar falha
      await this.queueEmailNotification({
        to: message.pixData.userEmail,
        subject: 'Falha no Depósito - cBRL',
        template: 'deposit_failed',
        data: {
          amount: message.amount,
          currency: 'cBRL',
          error: error.message,
          supportEmail: process.env.SUPPORT_EMAIL || 'suporte@coinage.com'
        },
        userId: message.userId
      });

      throw error;
    }
  }

  /**
   * Processa diferentes tipos de transação
   */
  async processTransfer(data) {
    try {
      const result = await blockchainService.transferTokens(
        data.fromAddress,
        data.toAddress,
        data.amount,
        data.contractAddress,
        data.network
      );
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async processMint(data) {
    try {
      // Mint genérico para qualquer token ERC20
      const tokenService = require('./token.service');
      
      const result = await tokenService.mintTokens(
        data.contractAddress,
        data.toAddress,
        data.amount,
        data.network || 'testnet'
      );
      
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async processBurn(data) {
    try {
      // Burn genérico para qualquer token ERC20
      const tokenService = require('./token.service');
      
      const result = await tokenService.burnTokensFrom(
        data.contractAddress,
        data.fromAddress || data.toAddress,
        data.amount,
        data.network || 'testnet'
      );
      
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async processStake(data) {
    try {
      const result = await blockchainService.stakeTokens(
        data.amount,
        data.stakingContract,
        data.network
      );
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async processUnstake(data) {
    try {
      const result = await blockchainService.unstakeTokens(
        data.amount,
        data.stakingContract,
        data.network
      );
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Processa saque cBRL 
   */
  async processWithdrawal(withdrawalData) {
    try {
      const { withdrawalId, userId, amount, pixKey, blockchainAddress } = withdrawalData;
      
      console.log(`🔄 Processing cBRL withdrawal: ${withdrawalId}`);

      // 1. Verificar saldo do token
      const tokenService = require('./token.service');
      const tokenContract = data.tokenContract || process.env.DEFAULT_TOKEN_CONTRACT;
      
      const balanceResult = await tokenService.getTokenBalance(
        tokenContract,
        blockchainAddress,
        data.network || 'testnet'
      );
      
      if (!balanceResult.success || parseFloat(balanceResult.data.balance) < parseFloat(amount)) {
        throw new Error(`Insufficient token balance: ${balanceResult.data?.balance || 0} < ${amount}`);
      }

      // 2. Queimar tokens (burn)
      const burnResult = await tokenService.burnTokensFrom(
        tokenContract,
        blockchainAddress,
        amount,
        data.network || 'testnet'
      );
      
      if (!burnResult.success) {
        throw new Error(`Failed to burn cBRL tokens: ${burnResult.error}`);
      }

      // 3. Processar PIX
      const pixService = require('./pix.service');
      const pixResult = await pixService.processPixWithdrawal({
        amount,
        pixKey,
        pixKeyType: pixService.detectPixKeyType(pixKey),
        userInfo: { id: userId },
        externalId: withdrawalId
      });
      
      if (!pixResult.success) {
        // Se PIX falhar, tentar reverter o burn (mint novamente)
        console.error('PIX failed, attempting to mint tokens back');
        // Reverter mint em caso de erro
        const tokenService = require('./token.service');
        const revertResult = await tokenService.mintTokens(
          tokenContract,
          blockchainAddress,
          amount,
          data.network || 'testnet'
        );
        
        if (revertResult.success) {
          console.log(`✅ Tokens reverted due to PIX failure: ${revertResult.txHash}`);
        } else {
          console.error(`❌ Failed to revert tokens: ${revertResult.error}`);
        }
        
        throw new Error(`PIX withdrawal failed: ${pixResult.error}`);
      }

      return {
        success: true,
        withdrawalId,
        burnTxHash: burnResult.txHash,
        pixTransactionId: pixResult.withdrawalId,
        pixEndToEndId: pixResult.endToEndId,
        amount,
        processedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error(`❌ Error processing withdrawal:`, error);
      throw error;
    }
  }

  /**
   * Obtém prioridade baseada na operação
   */
  getPriorityByOperation(operation) {
    const priorities = {
      'withdraw': 10,    // Maior prioridade
      'deposit': 9,
      'transfer': 8,
      'stake': 7,
      'unstake': 7,
      'mint': 6,
      'burn': 6,
      'default': 5
    };
    
    return priorities[operation] || priorities.default;
  }

  /**
   * Obtém estatísticas das filas
   */
  async getQueueStats() {
    try {
      return await rabbitmqConfig.getAllQueueStats();
    } catch (error) {
      console.error('❌ Error getting queue stats:', error);
      return {};
    }
  }

  /**
   * Purga uma fila específica
   */
  async purgeQueue(queueName) {
    try {
      return await rabbitmqConfig.purgeQueue(queueName);
    } catch (error) {
      console.error(`❌ Error purging queue ${queueName}:`, error);
      throw error;
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const rabbitmqHealth = await rabbitmqConfig.healthCheck();
      const queueStats = await this.getQueueStats();
      
      return {
        service: 'BlockchainQueueService',
        status: this.isInitialized && rabbitmqHealth.healthy ? 'healthy' : 'unhealthy',
        rabbitmq: rabbitmqHealth,
        queues: queueStats,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      return {
        service: 'BlockchainQueueService',
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = new BlockchainQueueService();