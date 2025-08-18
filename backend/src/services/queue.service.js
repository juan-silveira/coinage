const { v4: uuidv4 } = require('uuid');
const { ethers } = require('ethers');
const rabbitMQConfig = require('../config/rabbitmq');
const blockchainService = require('./blockchain.service');
const transactionService = require('./transaction.service');

class QueueService {
  constructor() {
    this.blockchainService = blockchainService;
    this.transactionService = transactionService;
    this.processingJobs = new Map();
    this.maxRetries = 3;
    this.retryDelay = 5000; // 5 segundos
  }

  /**
   * Inicializa o serviço de fila
   */
  async initialize() {
    try {
      // Garantir que Prisma esteja inicializado para o contexto da fila
      if (!global.prisma) {
        console.log('🔍 Inicializando Prisma no contexto da fila...');
        const { PrismaClient } = require('@prisma/client');
        global.prisma = new PrismaClient();
        console.log('✅ Prisma inicializado no contexto da fila');
      }
      
      console.log('🔍 Tentando conectar ao RabbitMQ...');
      await rabbitMQConfig.connect();
      await this.transactionService.initialize();
      await this.startConsumers();
      console.log('✅ Serviço de fila inicializado com sucesso');
    } catch (error) {
      console.error('⚠️ Erro ao inicializar serviço de fila (continuando sem RabbitMQ):', error.message);
      console.log('ℹ️ O sistema continuará funcionando sem filas de processamento');
      // Não lançar erro para não impedir o início do servidor
    }
  }

  /**
   * Inicia os consumidores das filas
   */
  async startConsumers() {
    // Consumidor para transações da blockchain
    await rabbitMQConfig.consumeQueue(
      rabbitMQConfig.queues.BLOCKCHAIN_TRANSACTIONS,
      this.handleBlockchainTransaction.bind(this)
    );

    // Consumidor para consultas da blockchain
    await rabbitMQConfig.consumeQueue(
      rabbitMQConfig.queues.BLOCKCHAIN_QUERIES,
      this.handleBlockchainQuery.bind(this)
    );

    // Consumidor para operações de contratos
    await rabbitMQConfig.consumeQueue(
      rabbitMQConfig.queues.CONTRACT_OPERATIONS,
      this.handleContractOperation.bind(this)
    );

    // Consumidor para operações de carteira
    await rabbitMQConfig.consumeQueue(
      rabbitMQConfig.queues.WALLET_OPERATIONS,
      this.handleWalletOperation.bind(this)
    );
  }

  /**
   * Adiciona uma transação da blockchain à fila
   */
  async enqueueBlockchainTransaction(transactionData) {
    const jobId = uuidv4();
    const message = {
      id: jobId,
      type: 'blockchain_transaction',
      data: transactionData,
      timestamp: new Date().toISOString(),
      retries: 0
    };

    await rabbitMQConfig.publishToQueue(
      rabbitMQConfig.queues.BLOCKCHAIN_TRANSACTIONS,
      message,
      { priority: this.getPriority(transactionData.type) }
    );

    return { jobId, status: 'queued' };
  }

  /**
   * Adiciona uma consulta da blockchain à fila
   */
  async enqueueBlockchainQuery(queryData) {
    const jobId = uuidv4();
    const message = {
      id: jobId,
      type: 'blockchain_query',
      data: queryData,
      timestamp: new Date().toISOString(),
      retries: 0
    };

    await rabbitMQConfig.publishToQueue(
      rabbitMQConfig.queues.BLOCKCHAIN_QUERIES,
      message,
      { priority: 1 } // Consultas têm prioridade baixa
    );

    return { jobId, status: 'queued' };
  }

  /**
   * Adiciona uma operação de contrato à fila
   */
  async enqueueContractOperation(operationData) {
    const jobId = uuidv4();
    const message = {
      id: jobId,
      type: 'contract_operation',
      data: operationData,
      timestamp: new Date().toISOString(),
      retries: 0
    };

    await rabbitMQConfig.publishToQueue(
      rabbitMQConfig.queues.CONTRACT_OPERATIONS,
      message,
      { priority: this.getPriority(operationData.operation) }
    );

    return { jobId, status: 'queued' };
  }

  /**
   * Adiciona uma operação de carteira à fila
   */
  async enqueueWalletOperation(operationData) {
    const jobId = uuidv4();
    const message = {
      id: jobId,
      type: 'wallet_operation',
      data: operationData,
      timestamp: new Date().toISOString(),
      retries: 0
    };

    await rabbitMQConfig.publishToQueue(
      rabbitMQConfig.queues.WALLET_OPERATIONS,
      message,
      { priority: this.getPriority(operationData.operation) }
    );

    return { jobId, status: 'queued' };
  }

  /**
   * Processa transações da blockchain
   */
  async handleBlockchainTransaction(msg) {
    const channel = await rabbitMQConfig.getChannel();
    const message = JSON.parse(msg.content.toString());
    
    try {
      console.log(`Processando transação blockchain: ${message.id}`);
      this.processingJobs.set(message.id, { status: 'processing', startTime: Date.now() });

      const result = await this.processBlockchainTransaction(message.data);
      
      // Atualizar status do job
      this.processingJobs.set(message.id, { 
        status: 'completed', 
        result,
        endTime: Date.now() 
      });

      // Confirmar processamento
      channel.ack(msg);
      
      console.log(`Transação blockchain processada com sucesso: ${message.id}`);
      
    } catch (error) {
      console.error(`Erro ao processar transação blockchain ${message.id}:`, error);
      
      // Tentar novamente se não excedeu o limite
      if (message.retries < this.maxRetries) {
        message.retries++;
        message.timestamp = new Date().toISOString();
        
        // Aguardar antes de tentar novamente
        setTimeout(async () => {
          await rabbitMQConfig.publishToQueue(
            rabbitMQConfig.queues.BLOCKCHAIN_TRANSACTIONS,
            message,
            { priority: 10 } // Alta prioridade para retry
          );
        }, this.retryDelay * message.retries);
        
        channel.ack(msg);
      } else {
        // Mover para fila de dead letter
        this.processingJobs.set(message.id, { 
          status: 'failed', 
          error: error.message,
          endTime: Date.now() 
        });
        
        channel.nack(msg, false, false);
        console.error(`Transação blockchain falhou definitivamente: ${message.id}`);
      }
    }
  }

  /**
   * Processa consultas da blockchain
   */
  async handleBlockchainQuery(msg) {
    const channel = await rabbitMQConfig.getChannel();
    const message = JSON.parse(msg.content.toString());
    
    try {
      console.log(`Processando consulta blockchain: ${message.id}`);
      this.processingJobs.set(message.id, { status: 'processing', startTime: Date.now() });

      const result = await this.processBlockchainQuery(message.data);
      
      this.processingJobs.set(message.id, { 
        status: 'completed', 
        result,
        endTime: Date.now() 
      });

      channel.ack(msg);
      console.log(`Consulta blockchain processada com sucesso: ${message.id}`);
      
    } catch (error) {
      console.error(`Erro ao processar consulta blockchain ${message.id}:`, error);
      
      if (message.retries < this.maxRetries) {
        message.retries++;
        message.timestamp = new Date().toISOString();
        
        setTimeout(async () => {
          await rabbitMQConfig.publishToQueue(
            rabbitMQConfig.queues.BLOCKCHAIN_QUERIES,
            message
          );
        }, this.retryDelay * message.retries);
        
        channel.ack(msg);
      } else {
        this.processingJobs.set(message.id, { 
          status: 'failed', 
          error: error.message,
          endTime: Date.now() 
        });
        
        channel.nack(msg, false, false);
      }
    }
  }

  /**
   * Processa operações de contratos
   */
  async handleContractOperation(msg) {
    const channel = await rabbitMQConfig.getChannel();
    const message = JSON.parse(msg.content.toString());
    
    try {
      console.log(`Processando operação de contrato: ${message.id}`);
      this.processingJobs.set(message.id, { status: 'processing', startTime: Date.now() });

      const result = await this.processContractOperation(message.data);
      
      this.processingJobs.set(message.id, { 
        status: 'completed', 
        result,
        endTime: Date.now() 
      });

      channel.ack(msg);
      console.log(`Operação de contrato processada com sucesso: ${message.id}`);
      
    } catch (error) {
      console.error(`Erro ao processar operação de contrato ${message.id}:`, error);
      
      if (message.retries < this.maxRetries) {
        message.retries++;
        message.timestamp = new Date().toISOString();
        
        setTimeout(async () => {
          await rabbitMQConfig.publishToQueue(
            rabbitMQConfig.queues.CONTRACT_OPERATIONS,
            message,
            { priority: 10 }
          );
        }, this.retryDelay * message.retries);
        
        channel.ack(msg);
      } else {
        this.processingJobs.set(message.id, { 
          status: 'failed', 
          error: error.message,
          endTime: Date.now() 
        });
        
        channel.nack(msg, false, false);
      }
    }
  }

  /**
   * Processa operações de carteira
   */
  async handleWalletOperation(msg) {
    const channel = await rabbitMQConfig.getChannel();
    const message = JSON.parse(msg.content.toString());
    
    try {
      console.log(`Processando operação de carteira: ${message.id}`);
      this.processingJobs.set(message.id, { status: 'processing', startTime: Date.now() });

      const result = await this.processWalletOperation(message.data);
      
      this.processingJobs.set(message.id, { 
        status: 'completed', 
        result,
        endTime: Date.now() 
      });

      channel.ack(msg);
      console.log(`Operação de carteira processada com sucesso: ${message.id}`);
      
    } catch (error) {
      console.error(`Erro ao processar operação de carteira ${message.id}:`, error);
      
      if (message.retries < this.maxRetries) {
        message.retries++;
        message.timestamp = new Date().toISOString();
        
        setTimeout(async () => {
          await rabbitMQConfig.publishToQueue(
            rabbitMQConfig.queues.WALLET_OPERATIONS,
            message,
            { priority: 10 }
          );
        }, this.retryDelay * message.retries);
        
        channel.ack(msg);
      } else {
        this.processingJobs.set(message.id, { 
          status: 'failed', 
          error: error.message,
          endTime: Date.now() 
        });
        
        channel.nack(msg, false, false);
      }
    }
  }

  /**
   * Processa uma transação da blockchain
   */
  async processBlockchainTransaction(data) {
    const { type, data: operationData, ...transactionData } = data;
    
    // Se os dados estão aninhados, extrair corretamente
    const actualData = operationData || transactionData;
    
    console.log(`🔍 Processando transação blockchain: type=${type}, data=`, JSON.stringify(actualData, null, 2));
    
    try {
      console.log(`🔍 Iniciando processamento para tipo: ${type}`);
      
      // Processamento genérico baseado no tipo de operação
      if (type.startsWith('token_')) {
        console.log(`🔄 Processando token operation: ${type}`);
        return await this.processTokenOperation(type, actualData);
      } else if (type.startsWith('contract_')) {
        console.log(`🔄 Processando contract operation: ${type}`);
        return await this.processContractOperation(type, actualData);
      } else if (type.startsWith('stake_')) {
        console.log(`🔄 Processando stake operation: ${type}`);
        return await this.processStakeOperation(type, actualData);
      } else if (type.startsWith('blockchain_')) {
        console.log(`🔄 Processando blockchain operation: ${type}`);
        return await this.processBlockchainOperation(type, actualData);
      } else {
        console.log(`⚠️ Tipo não reconhecido, usando fallback: ${type}`);
        // Fallback para tipos específicos
        switch (type) {
          case 'mint':
          case 'token_mint':
            return await this.processMintTransaction(actualData);
          case 'burn':
          case 'token_burn':
            return await this.processBurnTransaction(actualData);
          case 'transfer':
          case 'token_transfer_gasless':
            return await this.processTransferTransaction(actualData);
          case 'send_transaction':
            return await this.processSendTransaction(actualData);
          case 'deploy':
          case 'contract_deploy':
            return await this.processContractDeploy(actualData);
          case 'write':
          case 'contract_write':
            return await this.processContractWrite(actualData);
          case 'grant_role':
          case 'contract_grant_role':
            return await this.processContractGrantRole(actualData);
          case 'revoke_role':
          case 'contract_revoke_role':
            return await this.processContractRevokeRole(actualData);
          case 'invest':
          case 'stake_invest':
            return await this.processStakeInvest(actualData);
          case 'withdraw':
          case 'stake_withdraw':
            return await this.processStakeWithdraw(actualData);
          case 'claim_rewards':
          case 'stake_claim_rewards':
            return await this.processStakeClaimRewards(actualData);
          case 'compound':
          case 'stake_compound':
            return await this.processStakeCompound(actualData);
          case 'deposit_rewards':
          case 'stake_deposit_rewards':
            return await this.processStakeDepositRewards(actualData);
          case 'distribute_rewards':
          case 'stake_distribute_rewards':
            return await this.processStakeDistributeRewards(actualData);
          default:
            throw new Error(`Tipo de transação não suportado: ${type}`);
        }
      }
    } catch (error) {
      console.error(`❌ Erro ao processar transação ${type}:`, error);
      throw error;
    }
  }

  /**
   * Processa operações de token de forma genérica
   */
  async processTokenOperation(type, data) {
    console.log(`🔍 processTokenOperation chamado: type=${type}`);
    console.log(`📦 Dados recebidos:`, JSON.stringify(data, null, 2));
    
    try {
      const tokenService = require('./token.service');
      
      switch (type) {
        case 'token_mint':
          return await tokenService.mintToken(
            data.contractAddress,
            data.toAddress,
            data.amount,
            data.gasPayer,
            data.network || 'testnet',
            { description: 'Mint via fila', companyId: data.companyId, userId: data.userId }
          );
        case 'token_burn':
          return await tokenService.burnFromToken(
            data.contractAddress,
            data.fromAddress,
            data.amount,
            data.gasPayer,
            data.network || 'testnet',
            { description: 'Burn via fila', companyId: data.companyId, userId: data.userId }
          );
        case 'token_transfer_gasless':
          return await tokenService.transferFromGasless(
            data.contractAddress,
            data.fromAddress,
            data.toAddress,
            data.amount,
            data.gasPayer,
            data.network || 'testnet',
            { description: 'Transfer via fila', companyId: data.companyId, userId: data.userId }
          );
        case 'token_register':
          return await tokenService.registerToken(data);
        case 'token_get_balance':
          return await tokenService.getTokenBalance(data.contractAddress, data.walletAddress, data.network);
        case 'token_get_aze_balance':
          return await tokenService.getAzeBalance(data.walletAddress, data.network);
        case 'token_get_info':
          return await tokenService.getTokenInfo(data.contractAddress, data.network);
        case 'token_update_info':
          return await tokenService.updateTokenInfo(data.contractAddress, data.updates);
        case 'token_activate':
          return await tokenService.activateToken(data.contractAddress);
        case 'token_deactivate':
          return await tokenService.deactivateToken(data.contractAddress);
        case 'token_list':
          return await tokenService.listTokens(data.page, data.limit, data.network, data.contractType, data.isActive);
        default:
          throw new Error(`Operação de token não suportada: ${type}`);
      }
    } catch (error) {
      console.error(`❌ Erro em processTokenOperation:`, error);
      throw error;
    }
  }

  /**
   * Processa operações de contrato de forma genérica
   */
  async processContractOperation(type, data) {
    console.log(`🔍 processContractOperation chamado: type=${type}`);
    console.log(`📦 Dados recebidos:`, JSON.stringify(data, null, 2));
    
    try {
      console.log(`📦 Current directory: ${process.cwd()}`);
      console.log(`📦 Tentando carregar contractService...`);
      const contractService = require('./contract.service');
      console.log(`✅ contractService carregado com sucesso`);
    
      switch (type) {
        case 'contract_deploy':
          return await contractService.deployContract(data);
        case 'contract_write':
          return await contractService.executeWriteOperation(data);
        case 'contract_grant_role':
          const { contractAddress, role, targetAddress, adminPublicKey } = data;
          console.log(`🔍 Processando contract_grant_role: ${contractAddress}, ${role}, ${targetAddress}, ${adminPublicKey}`);
          const grantResult = await contractService.grantRole(contractAddress, role, targetAddress, adminPublicKey);
          console.log(`✅ Resultado grantRole:`, JSON.stringify(grantResult, null, 2));
          return grantResult;
        case 'contract_has_role':
          const { contractAddress: hasRoleContract, role: hasRoleRole, targetAddress: hasRoleTarget } = data;
          return await contractService.hasRole(hasRoleContract, hasRoleRole, hasRoleTarget);
        case 'contract_revoke_role':
          const { contractAddress: revokeContract, role: revokeRole, targetAddress: revokeTarget, adminPublicKey: revokeAdmin } = data;
          console.log(`🔍 Processando contract_revoke_role: ${revokeContract}, ${revokeRole}, ${revokeTarget}, ${revokeAdmin}`);
          const revokeResult = await contractService.revokeRole(revokeContract, revokeRole, revokeTarget, revokeAdmin);
          console.log(`✅ Resultado revokeRole:`, JSON.stringify(revokeResult, null, 2));
          return revokeResult;
        case 'contract_validate_abi':
          return await contractService.validateABI(data.abi);
        case 'contract_get_functions':
          return await contractService.getContractFunctions(data.contractAddress);
        case 'contract_get_events':
          return await contractService.getContractEventsList(data.contractAddress);
        case 'contract_query_events':
          return await contractService.getContractEvents(data.contractAddress, data.eventName, data.fromBlock, data.toBlock);
        default:
          throw new Error(`Operação de contrato não suportada: ${type}`);
      }
    } catch (error) {
      console.error(`❌ Erro em processContractOperation:`, error);
      console.error(`❌ Stack trace:`, error.stack);
      console.error(`❌ Error name:`, error.name);
      console.error(`❌ Error message:`, error.message);
      throw error;
    }
  }

  /**
   * Processa operações de stake de forma genérica
   */
  async processStakeOperation(type, data) {
    console.log(`🔍 processStakeOperation chamado: type=${type}`);
    console.log(`📦 Dados recebidos:`, JSON.stringify(data, null, 2));
    
    try {
      const stakeService = require('./stake.service');
      switch (type) {
        case 'stake_register':
          return await stakeService.registerStake(data);
        case 'stake_invest':
          // Usar stakeService diretamente para investir
          console.log(`🔄 Processando stake invest: ${data.amount} tokens para ${data.user} no contrato ${data.stakeAddress}`);
          console.log(`📋 Dados da transação: companyId=${data.companyId}, userId=${data.userId}`);

          try {
            console.log(`🔍 Dados completos recebidos:`, JSON.stringify(data, null, 2));
            console.log(`🔍 Chamando stakeService.writeStakeContract com:`);
            console.log(`  - stakeAddress: ${data.stakeAddress || data.address}`);
            console.log(`  - functionName: stake`);
            console.log(`  - params: [${data.user}, ${data.amount}, ${data.customTimestamp || 0}]`);
            console.log(`  - walletAddress: null`);
            
            const result = await stakeService.writeStakeContract(
              data.stakeAddress || data.address,
              'stake',
              [data.user, data.amount, data.customTimestamp || 0],
              null // Não precisamos do adminPublicKey, igual ao controller original
            );
            
            console.log(`✅ Stake invest processado com sucesso: ${result.data?.transactionHash || 'sem hash'}`);
            
            return {
              success: true,
              type: 'stake_invest',
              txHash: result.data?.transactionHash,
              data: {
                stakeAddress: data.stakeAddress,
                user: data.user,
                amount: data.amount,
                gasPayer: data.gasPayer,
                network: data.network || 'testnet',
                description: 'Stake invest via fila'
              },
              result
            };
          } catch (error) {
            console.error(`❌ Erro ao processar stake invest:`, error);
            throw new Error(`Falha no stake invest: ${error.message}`);
          }
        case 'stake_withdraw':
          // Implementar withdraw usando blockchainService
          return await this.processStakeWithdraw(data);
        case 'stake_claim_rewards':
          // Implementar claim rewards usando blockchainService
          return await this.processStakeClaimRewards(data);
        case 'stake_compound':
          // Implementar compound usando blockchainService
          return await this.processStakeCompound(data);
        case 'stake_deposit_rewards':
          // Implementar deposit rewards usando blockchainService
          return await this.processStakeDepositRewards(data);
        case 'stake_distribute_rewards':
          // Implementar distribute rewards usando blockchainService
          return await this.processStakeDistributeRewards(data);
        default:
          throw new Error(`Operação de stake não suportada: ${type}`);
      }
    } catch (error) {
      console.error(`❌ Erro em processStakeOperation:`, error);
      throw error;
    }
  }

  /**
   * Processa operações de blockchain de forma genérica
   */
  async processBlockchainOperation(type, data) {
    const blockchainService = require('./blockchain.service');
    
    switch (type) {
      case 'blockchain_connection_query':
        return await blockchainService.testConnection();
      case 'blockchain_network_query':
        return await blockchainService.getNetworkInfo();
      case 'blockchain_balance_query':
        return await blockchainService.getBalance(data.address);
      case 'blockchain_transaction_query':
        return await blockchainService.getTransaction(data.txHash);
      default:
        throw new Error(`Operação de blockchain não suportada: ${type}`);
    }
  }

  /**
   * Processa uma transação de mint
   */
  async processMintTransaction(data) {
    const {
      contractAddress,
      toAddress,
      amount,
      gasPayer,
      network = 'testnet',
      description = 'Mint via fila',
      companyId,
      userId
    } = data;

    console.log(`🔄 Processando mint: ${amount} tokens para ${toAddress} no contrato ${contractAddress}`);
    console.log(`📋 Dados da transação: companyId=${companyId}, userId=${userId}`);

    try {
      // Executar o mint usando o serviço de tokens
      const tokenService = require('./token.service');
      
      const result = await tokenService.mintToken(
        contractAddress,
        toAddress,
        amount,
        gasPayer,
        network,
        { description }
      );
      
      console.log(`✅ Mint processado com sucesso: ${result.data?.transactionHash || 'sem hash'}`);
      
      // Registrar a transação no banco de dados
      if (result.data?.transactionHash && companyId) {
        try {
          const transactionService = require('./transaction.service');
          
          // O amountWei já vem convertido do token service, não converter novamente
          const amountWei = result.data?.amountWei || amount;
          
          console.log(`📝 Tentando registrar transação no banco com companyId: ${companyId}`);
          
          await transactionService.recordMintTransaction({
            companyId,
            userId,
            contractAddress,
            toAddress,
            amount,
            amountWei,
            gasPayer,
            network,
            txHash: result.data.transactionHash,
            gasUsed: result.data.gasUsed,
            gasPrice: result.data.gasPrice,
            blockNumber: result.data.receipt?.blockNumber,
            status: 'confirmed'
          });
          
          console.log(`📝 Transação registrada no banco: ${result.data.transactionHash}`);
        } catch (dbError) {
          console.error(`⚠️ Erro ao registrar transação no banco:`, dbError.message);
          console.error(`📋 Dados que causaram erro:`, { companyId, userId, txHash: result.data?.transactionHash });
          // Não falhar o processo se o registro no banco falhar
        }
      } else {
        console.log(`⚠️ Não foi possível registrar no banco: companyId=${companyId}, txHash=${result.data?.transactionHash}`);
      }
      
      return {
        success: true,
        type: 'mint',
        txHash: result.data?.transactionHash,
        data: {
          contractAddress,
          toAddress,
          amount,
          gasPayer,
          network,
          description
        },
        result
      };
    } catch (error) {
      console.error(`❌ Erro ao processar mint:`, error);
      throw new Error(`Falha no mint: ${error.message}`);
    }
  }

  /**
   * Processa uma transação de burn
   */
  async processBurnTransaction(data) {
    const {
      contractAddress,
      fromAddress,
      amount,
      gasPayer,
      network = 'testnet',
      description = 'Burn via fila'
    } = data;

    console.log(`🔄 Processando burn: ${amount} tokens de ${fromAddress} no contrato ${contractAddress}`);

    try {
      const tokenService = require('./token.service');
      
      const burnData = {
        contractAddress,
        fromAddress,
        amount,
        gasPayer,
        network,
        description
      };

      const result = await tokenService.burnFromToken(
        contractAddress,
        fromAddress,
        amount,
        gasPayer,
        network,
        { description }
      );
      
      console.log(`✅ Burn processado com sucesso: ${result.txHash || 'sem hash'}`);
      
      return {
        success: true,
        type: 'burn',
        txHash: result.txHash,
        data: burnData,
        result
      };
    } catch (error) {
      console.error(`❌ Erro ao processar burn:`, error);
      throw new Error(`Falha no burn: ${error.message}`);
    }
  }

  /**
   * Processa uma transação de transfer
   */
  async processTransferTransaction(data) {
    const {
      contractAddress,
      fromAddress,
      toAddress,
      amount,
      gasPayer,
      network = 'testnet',
      description = 'Transfer via fila'
    } = data;

    console.log(`🔄 Processando transfer: ${amount} tokens de ${fromAddress} para ${toAddress}`);

    try {
      const tokenService = require('./token.service');
      
      const transferData = {
        contractAddress,
        fromAddress,
        toAddress,
        amount,
        gasPayer,
        network,
        description
      };

      const result = await tokenService.transferFromGasless(
        contractAddress,
        fromAddress,
        toAddress,
        amount,
        gasPayer,
        network,
        { description }
      );
      
      console.log(`✅ Transfer processado com sucesso: ${result.txHash || 'sem hash'}`);
      
      return {
        success: true,
        type: 'transfer',
        txHash: result.txHash,
        data: transferData,
        result
      };
    } catch (error) {
      console.error(`❌ Erro ao processar transfer:`, error);
      throw new Error(`Falha no transfer: ${error.message}`);
    }
  }

  /**
   * Processa uma transação de envio
   */
  async processSendTransaction(data) {
    const {
      fromAddress,
      toAddress,
      amount,
      gasPayer,
      network = 'testnet',
      description = 'Send via fila'
    } = data;

    console.log(`🔄 Processando send: ${amount} de ${fromAddress} para ${toAddress}`);

    try {
      // Aqui você deve integrar com o serviço de transações existente
      const result = await this.blockchainService.sendTransaction(data);
      
      console.log(`✅ Send processado com sucesso: ${result.txHash || 'sem hash'}`);
      
      return {
        success: true,
        type: 'send_transaction',
        txHash: result.txHash,
        data,
        result
      };
    } catch (error) {
      console.error(`❌ Erro ao processar send:`, error);
      throw new Error(`Falha no send: ${error.message}`);
    }
  }

  /**
   * Processa uma consulta da blockchain
   */
  async processBlockchainQuery(data) {
    const { queryType, ...queryData } = data;
    
    switch (queryType) {
      case 'get_balance':
        return await this.blockchainService.getBalance(
          queryData.address, 
          queryData.network
        );
      case 'get_transaction':
        return await this.blockchainService.getTransaction(
          queryData.txHash, 
          queryData.network
        );
      case 'get_block':
        return await this.blockchainService.getBlock(
          queryData.blockNumber, 
          queryData.network
        );
      default:
        throw new Error(`Tipo de consulta não suportado: ${queryType}`);
    }
  }

  /**
   * Processa uma operação de contrato
   */
  async processContractOperation(data) {
    // Implementar lógica para operações de contratos
    return { success: true, operation: data.operation };
  }

  /**
   * Processa uma operação de carteira
   */
  async processWalletOperation(data) {
    // Implementar lógica para operações de carteira
    return { success: true, operation: data.operation };
  }

  /**
   * Processa deploy de contrato
   */
  async processContractDeploy(data) {
    const contractService = require('./contract.service');
    return await contractService.deployContract(data);
  }

  /**
   * Processa operação de escrita em contrato
   */
  async processContractWrite(data) {
    const contractService = require('./contract.service');
    return await contractService.executeWriteOperation(data);
  }

  /**
   * Processa grant de role em contrato
   */
  async processContractGrantRole(data) {
    const contractService = require('./contract.service');
    const { contractAddress, role, targetAddress, adminPublicKey } = data;
    return await contractService.grantRole(contractAddress, role, targetAddress, adminPublicKey);
  }

  /**
   * Processa revoke de role em contrato
   */
  async processContractRevokeRole(data) {
    const contractService = require('./contract.service');
    const { contractAddress, role, targetAddress, adminPublicKey } = data;
    return await contractService.revokeRole(contractAddress, role, targetAddress, adminPublicKey);
  }

  /**
   * Processa investimento em stake
   */
  async processStakeInvest(data) {
    const {
      stakeAddress,
      user,
      amount,
      customTimestamp = 0,
      gasPayer,
      network = 'testnet',
      description = 'Stake invest via fila',
      companyId,
      userId
    } = data;

    console.log(`🔄 Processando stake invest: ${amount} tokens para ${user} no contrato ${stakeAddress}`);
    console.log(`📋 Dados da transação: companyId=${companyId}, userId=${userId}`);

    try {
      // Executar o stake usando o blockchainService diretamente
      const blockchainService = require('./blockchain.service');
      const { ethers } = require('ethers');
      
      // Obter o STAKE_ABI do .env
      const stakeABI = process.env.STAKE_ABI;
      if (!stakeABI) {
        throw new Error('STAKE_ABI não configurado no .env');
      }
      
      console.log(`🔍 Endereço do contrato: ${stakeAddress}`);
      console.log(`🔍 Usando STAKE_ABI do .env para instanciar o contrato`);
      
      // Instanciar o contrato
      const provider = blockchainService.config.getProvider(network);
      const contractInstanceForStake = new ethers.Contract(stakeAddress, JSON.parse(stakeABI), provider);
      
      // Preparar parâmetros
      const params = [user, amount, customTimestamp];
      console.log(`🔍 Executando função: stake com parâmetros:`, params);
      
      // Preparar opções da transação
      const txOptions = {
        gasLimit: 100000,
        network,
        description,
        companyId,
        userId
      };
      console.log(`🔍 Opções da transação:`, txOptions);
      
      // Executar a transação
      const result = await blockchainService.executeWriteFunction(
        contractInstanceForStake,
        'stake',
        params,
        gasPayer,
        txOptions
      );
      
      console.log(`✅ Stake invest processado com sucesso: ${result.data?.transactionHash || 'sem hash'}`);
      
      // Registrar a transação no banco de dados
      if (result.data?.transactionHash && companyId) {
        try {
          const transactionService = require('./transaction.service');
          
          console.log(`📝 Tentando registrar transação no banco com companyId: ${companyId}`);
          
          await transactionService.recordStakeTransaction({
            companyId,
            userId,
            contractAddress: stakeAddress,
            fromAddress: gasPayer,
            toAddress: stakeAddress,
            amount,
            gasPayer,
            network,
            txHash: result.data.transactionHash,
            gasUsed: result.data.gasUsed,
            gasPrice: result.data.gasPrice,
            blockNumber: result.data.receipt?.blockNumber,
            functionName: 'stake',
            functionParams: params,
            status: 'confirmed'
          });
          
          console.log(`📝 Transação registrada no banco: ${result.data.transactionHash}`);
        } catch (dbError) {
          console.error(`⚠️ Erro ao registrar transação no banco:`, dbError.message);
          console.error(`📋 Dados que causaram erro:`, { companyId, userId, txHash: result.data?.transactionHash });
          // Não falhar o processo se o registro no banco falhar
        }
      } else {
        console.log(`⚠️ Não foi possível registrar no banco: companyId=${companyId}, txHash=${result.data?.transactionHash}`);
      }
      
      return {
        success: true,
        type: 'stake_invest',
        txHash: result.data?.transactionHash,
        data: {
          stakeAddress,
          user,
          amount,
          gasPayer,
          network,
          description
        },
        result
      };
    } catch (error) {
      console.error(`❌ Erro ao processar stake invest:`, error);
      throw new Error(`Falha no stake invest: ${error.message}`);
    }
  }

  /**
   * Processa retirada de stake
   */
  async processStakeWithdraw(data) {
    try {
      const stakeService = require('./stake.service');
      
      console.log(`🔄 Processando stake withdraw: ${data.amount} tokens de ${data.user} no contrato ${data.stakeAddress}`);
      console.log(`📋 Dados da transação: companyId=${data.companyId}, userId=${data.userId}`);

      const result = await stakeService.writeStakeContract(
        data.stakeAddress || data.address,
        'unstake',
        [data.user, data.amount],
        null // Não precisamos do adminPublicKey, igual ao controller original
      );

      console.log(`✅ Stake withdraw processado com sucesso: ${result.data?.transactionHash || 'sem hash'}`);

      if (result.data?.transactionHash && data.companyId) {
        try {
          const transactionService = require('./transaction.service');

          console.log(`📝 Tentando registrar transação no banco com companyId: ${data.companyId}`);

          await transactionService.recordStakeTransaction({
            companyId: data.companyId,
            userId: data.userId,
            contractAddress: data.stakeAddress || data.address,
            fromAddress: data.user,
            toAddress: data.stakeAddress || data.address,
            amount: data.amount,
            gasPayer: data.user,
            network: data.network || 'testnet',
            txHash: result.data.transactionHash,
            gasUsed: result.data.gasUsed,
            gasPrice: result.data.gasPrice,
            blockNumber: result.data.receipt?.blockNumber,
            functionName: 'unstake',
            functionParams: [data.user, data.amount],
            status: 'confirmed'
          });

          console.log(`📝 Transação registrada no banco: ${result.data.transactionHash}`);
        } catch (dbError) {
          console.error(`⚠️ Erro ao registrar transação no banco:`, dbError.message);
        }
      }

      return {
        success: true,
        type: 'stake_withdraw',
        txHash: result.data?.transactionHash,
        data: {
          stakeAddress: data.stakeAddress || data.address,
          user: data.user,
          amount: data.amount,
          network: data.network || 'testnet',
          description: 'Stake withdraw via fila'
        },
        result
      };
    } catch (error) {
      console.error(`❌ Erro ao processar stake withdraw:`, error);
      throw new Error(`Falha no stake withdraw: ${error.message}`);
    }
  }

  /**
   * Processa claim de recompensas de stake
   */
  async processStakeClaimRewards(data) {
    try {
      const stakeService = require('./stake.service');
      
      console.log(`🔄 Processando stake claim rewards para ${data.user} no contrato ${data.stakeAddress}`);
      console.log(`📋 Dados da transação: companyId=${data.companyId}, userId=${data.userId}`);

      const result = await stakeService.writeStakeContract(
        data.stakeAddress || data.address,
        'claimReward',
        [data.user],
        null // Não precisamos do adminPublicKey, igual ao controller original
      );

      console.log(`✅ Stake claim rewards processado com sucesso: ${result.data?.transactionHash || 'sem hash'}`);

      if (result.data?.transactionHash && data.companyId) {
        try {
          const transactionService = require('./transaction.service');

          console.log(`📝 Tentando registrar transação no banco com companyId: ${data.companyId}`);

          await transactionService.recordStakeTransaction({
            companyId: data.companyId,
            userId: data.userId,
            contractAddress: data.stakeAddress || data.address,
            fromAddress: data.user,
            toAddress: data.stakeAddress || data.address,
            amount: '0', // Claim não tem amount específico
            gasPayer: data.user,
            network: data.network || 'testnet',
            txHash: result.data.transactionHash,
            gasUsed: result.data.gasUsed,
            gasPrice: result.data.gasPrice,
            blockNumber: result.data.receipt?.blockNumber,
            functionName: 'claimReward',
            functionParams: [data.user],
            status: 'confirmed'
          });

          console.log(`📝 Transação registrada no banco: ${result.data.transactionHash}`);
        } catch (dbError) {
          console.error(`⚠️ Erro ao registrar transação no banco:`, dbError.message);
        }
      }

      return {
        success: true,
        type: 'stake_claim_rewards',
        txHash: result.data?.transactionHash,
        data: {
          stakeAddress: data.stakeAddress || data.address,
          user: data.user,
          network: data.network || 'testnet',
          description: 'Stake claim rewards via fila'
        },
        result
      };
    } catch (error) {
      console.error(`❌ Erro ao processar stake claim rewards:`, error);
      throw new Error(`Falha no stake claim rewards: ${error.message}`);
    }
  }

  /**
   * Processa compound de stake
   */
  async processStakeCompound(data) {
    try {
      const stakeService = require('./stake.service');
      
      console.log(`🔄 Processando stake compound para ${data.user} no contrato ${data.stakeAddress}`);
      console.log(`📋 Dados da transação: companyId=${data.companyId}, userId=${data.userId}`);

      const result = await stakeService.writeStakeContract(
        data.stakeAddress || data.address,
        'compound',
        [data.user],
        null // Não precisamos do adminPublicKey, igual ao controller original
      );

      console.log(`✅ Stake compound processado com sucesso: ${result.data?.transactionHash || 'sem hash'}`);

      if (result.data?.transactionHash && data.companyId) {
        try {
          const transactionService = require('./transaction.service');

          console.log(`📝 Tentando registrar transação no banco com companyId: ${data.companyId}`);

          await transactionService.recordStakeTransaction({
            companyId: data.companyId,
            userId: data.userId,
            contractAddress: data.stakeAddress || data.address,
            fromAddress: data.user,
            toAddress: data.stakeAddress || data.address,
            amount: '0', // Compound não tem amount específico
            gasPayer: data.user,
            network: data.network || 'testnet',
            txHash: result.data.transactionHash,
            gasUsed: result.data.gasUsed,
            gasPrice: result.data.gasPrice,
            blockNumber: result.data.receipt?.blockNumber,
            functionName: 'compound',
            functionParams: [data.user],
            status: 'confirmed'
          });

          console.log(`📝 Transação registrada no banco: ${result.data.transactionHash}`);
        } catch (dbError) {
          console.error(`⚠️ Erro ao registrar transação no banco:`, dbError.message);
        }
      }

      return {
        success: true,
        type: 'stake_compound',
        txHash: result.data?.transactionHash,
        data: {
          stakeAddress: data.stakeAddress || data.address,
          user: data.user,
          network: data.network || 'testnet',
          description: 'Stake compound via fila'
        },
        result
      };
    } catch (error) {
      console.error(`❌ Erro ao processar stake compound:`, error);
      throw new Error(`Falha no stake compound: ${error.message}`);
    }
  }

  /**
   * Processa deposit de recompensas de stake
   */
  async processStakeDepositRewards(data) {
    try {
      const stakeService = require('./stake.service');
      
      console.log(`🔄 Processando stake deposit rewards: ${data.amount} tokens no contrato ${data.stakeAddress}`);
      console.log(`📋 Dados da transação: companyId=${data.companyId}, userId=${data.userId}`);

      const result = await stakeService.writeStakeContract(
        data.stakeAddress || data.address,
        'depositRewards',
        [data.amount],
        null // Não precisamos do adminPublicKey, igual ao controller original
      );

      console.log(`✅ Stake deposit rewards processado com sucesso: ${result.data?.transactionHash || 'sem hash'}`);

      if (result.data?.transactionHash && data.companyId) {
        try {
          const transactionService = require('./transaction.service');

          console.log(`📝 Tentando registrar transação no banco com companyId: ${data.companyId}`);

          await transactionService.recordStakeTransaction({
            companyId: data.companyId,
            userId: data.userId,
            contractAddress: data.stakeAddress || data.address,
            fromAddress: data.user || 'admin',
            toAddress: data.stakeAddress || data.address,
            amount: data.amount,
            gasPayer: data.user || 'admin',
            network: data.network || 'testnet',
            txHash: result.data.transactionHash,
            gasUsed: result.data.gasUsed,
            gasPrice: result.data.gasPrice,
            blockNumber: result.data.receipt?.blockNumber,
            functionName: 'depositRewards',
            functionParams: [data.amount],
            status: 'confirmed'
          });

          console.log(`📝 Transação registrada no banco: ${result.data.transactionHash}`);
        } catch (dbError) {
          console.error(`⚠️ Erro ao registrar transação no banco:`, dbError.message);
        }
      }

      return {
        success: true,
        type: 'stake_deposit_rewards',
        txHash: result.data?.transactionHash,
        data: {
          stakeAddress: data.stakeAddress || data.address,
          amount: data.amount,
          network: data.network || 'testnet',
          description: 'Stake deposit rewards via fila'
        },
        result
      };
    } catch (error) {
      console.error(`❌ Erro ao processar stake deposit rewards:`, error);
      throw new Error(`Falha no stake deposit rewards: ${error.message}`);
    }
  }

  /**
   * Processa distribute de recompensas de stake
   */
  async processStakeDistributeRewards(data) {
    try {
      const stakeService = require('./stake.service');
      
      console.log(`🔄 Processando stake distribute rewards no contrato ${data.stakeAddress}`);
      console.log(`📋 Dados da transação: companyId=${data.companyId}, userId=${data.userId}`);

      const result = await stakeService.writeStakeContract(
        data.stakeAddress || data.address,
        'distributeReward',
        [data.percentageInBasisPoints || 10000], // Default 100% em basis points
        null // Não precisamos do adminPublicKey, igual ao controller original
      );

      console.log(`✅ Stake distribute rewards processado com sucesso: ${result.data?.transactionHash || 'sem hash'}`);

      if (result.data?.transactionHash && data.companyId) {
        try {
          const transactionService = require('./transaction.service');

          console.log(`📝 Tentando registrar transação no banco com companyId: ${data.companyId}`);

          await transactionService.recordStakeTransaction({
            companyId: data.companyId,
            userId: data.userId,
            contractAddress: data.stakeAddress || data.address,
            fromAddress: data.user || 'admin',
            toAddress: data.stakeAddress || data.address,
            amount: '0', // Distribute não tem amount específico
            gasPayer: data.user || 'admin',
            network: data.network || 'testnet',
            txHash: result.data.transactionHash,
            gasUsed: result.data.gasUsed,
            gasPrice: result.data.gasPrice,
            blockNumber: result.data.receipt?.blockNumber,
            functionName: 'distributeReward',
            functionParams: [data.percentageInBasisPoints || 10000],
            status: 'confirmed'
          });

          console.log(`📝 Transação registrada no banco: ${result.data.transactionHash}`);
        } catch (dbError) {
          console.error(`⚠️ Erro ao registrar transação no banco:`, dbError.message);
        }
      }

      return {
        success: true,
        type: 'stake_distribute_rewards',
        txHash: result.data?.transactionHash,
        data: {
          stakeAddress: data.stakeAddress || data.address,
          network: data.network || 'testnet',
          description: 'Stake distribute rewards via fila'
        },
        result
      };
    } catch (error) {
      console.error(`❌ Erro ao processar stake distribute rewards:`, error);
      throw new Error(`Falha no stake distribute rewards: ${error.message}`);
    }
  }

  /**
   * Obtém a prioridade baseada no tipo de operação
   */
  getPriority(operationType) {
    const priorities = {
      'mint': 8,
      'burn': 8,
      'transfer': 6,
      'send_transaction': 5,
      'get_balance': 1,
      'get_transaction': 1,
      'get_block': 1
    };
    
    return priorities[operationType] || 5;
  }

  /**
   * Obtém o status de um job
   */
  getJobStatus(jobId) {
    return this.processingJobs.get(jobId) || { status: 'not_found' };
  }

  /**
   * Obtém estatísticas das filas
   */
  async getQueueStats() {
    const stats = {};
    
    for (const [name, queueName] of Object.entries(rabbitMQConfig.queues)) {
      try {
        stats[name] = await rabbitMQConfig.getQueueStats(queueName);
      } catch (error) {
        stats[name] = { error: error.message };
      }
    }
    
    return stats;
  }

  /**
   * Obtém estatísticas dos jobs em processamento
   */
  getProcessingStats() {
    const stats = {
      total: this.processingJobs.size,
      processing: 0,
      completed: 0,
      failed: 0
    };
    
    for (const job of this.processingJobs.values()) {
      stats[job.status]++;
    }
    
    return stats;
  }

  /**
   * Limpa jobs antigos (mais de 1 hora)
   */
  cleanupOldJobs() {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    
    for (const [jobId, job] of this.processingJobs.entries()) {
      if (job.endTime && job.endTime < oneHourAgo) {
        this.processingJobs.delete(jobId);
      }
    }
  }
}

// Singleton instance
const queueService = new QueueService();

module.exports = queueService; 