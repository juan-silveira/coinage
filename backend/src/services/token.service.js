const { ethers } = require('ethers');
const axios = require('axios');
const blockchainService = require('./blockchain.service');
const contractService = require('./contract.service');
const transactionService = require('./transaction.service');
const prismaConfig = require('../config/prisma');

// Função para obter o userCacheService
const getUserCacheService = () => {
  if (!global.userCacheService) {
    global.userCacheService = require('./userCache.service');
  }
  return global.userCacheService;
};

// Função para obter o serviço de webhook
const getWebhookService = () => {
  if (!global.webhookService) {
    global.webhookService = require('./webhook.service');
  }
  return global.webhookService;
};

class TokenService {
  constructor() {
    // Inicializar Prisma
    this.getPrisma = () => prismaConfig.getPrisma();
  }

  /**
   * Get admin address from contract metadata
   * @param {string} contractAddress - Contract address
   * @returns {Promise<string|null>} Admin address or null
   */
  async getContractAdmin(contractAddress) {
    try {
      const prisma = this.getPrisma();
      
      const contract = await prisma.smartContract.findUnique({
        where: { address: contractAddress },
        select: { metadata: true }
      });
      
      return contract?.metadata?.adminAddress || null;
    } catch (error) {
      console.log(`Could not find admin for contract ${contractAddress}:`, error.message);
      return null;
    }
  }

  /**
   * Determine the gas payer address using priority: gasPayer > admin > fallback
   * @param {string} contractAddress - Contract address
   * @param {string} providedGasPayer - Provided gas payer (optional)
   * @returns {Promise<string>} Final gas payer address
   */
  async determineGasPayer(contractAddress, providedGasPayer) {
    const adminAddress = await this.getContractAdmin(contractAddress);
    const fallbackAddress = '0x5528C065931f523CA9F3a6e49a911896fb1D2e6f';
    
    const finalGasPayer = providedGasPayer || adminAddress || fallbackAddress;
    
    console.log(`Token function - using gasPayer: ${finalGasPayer} (provided: ${providedGasPayer || 'none'}, admin: ${adminAddress || 'not set'})`);
    
    return finalGasPayer;
  }

  async initialize() {
    try {
      await prismaConfig.initialize();
      await contractService.initialize();
      console.log('✅ Serviço de tokens inicializado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao inicializar serviço de tokens:', error.message);
      // Não lançar erro para evitar quebrar a aplicação
      console.log('⚠️ Serviço de tokens inicializado com limitações');
    }
  }

  /**
   * Dispara webhooks para eventos de token
   */
  async triggerTokenWebhooks(event, tokenData, companyId, additionalData = {}) {
    try {
      const webhookService = getWebhookService();
      await webhookService.triggerWebhooks(event, {
        contractAddress: tokenData.contractAddress,
        operation: tokenData.operation,
        amount: tokenData.amount,
        fromAddress: tokenData.fromAddress,
        toAddress: tokenData.toAddress,
        network: tokenData.network,
        transactionHash: tokenData.transactionHash,
        timestamp: new Date().toISOString(),
        ...additionalData
      }, companyId);
    } catch (error) {
      console.error('Erro ao disparar webhooks de token:', error.message);
      // Não falhar a operação principal por erro de webhook
    }
  }

  /**
   * Obtém o saldo de um token ERC20 usando a API do AzoreScan
   * @param {string} contractAddress - Endereço do contrato do token
   * @param {string} walletAddress - Endereço da carteira
   * @param {string} network - Rede (mainnet ou testnet)
   * @returns {Promise<Object>} Saldo do token
   */
  async getTokenBalance(contractAddress, walletAddress, network = 'testnet') {
    try {
      // Validar endereços
      if (!ethers.isAddress(contractAddress)) {
        throw new Error('Endereço do contrato inválido');
      }
      if (!ethers.isAddress(walletAddress)) {
        throw new Error('Endereço da carteira inválido');
      }

      // Determinar URL da API baseada na rede
      const apiUrl = network === 'mainnet' 
        ? 'https://azorescan.com/api'
        : 'https://floripa.azorescan.com/api';

      // Fazer requisição para a API do AzoreScan
      const response = await axios.get(`${apiUrl}`, {
        params: {
          module: 'account',
          action: 'tokenbalance',
          contractaddress: contractAddress,
          address: walletAddress
        },
        timeout: 10000
      });

      if (response.data.status === '0') {
        throw new Error(`Erro na API: ${response.data.message}`);
      }

      const balanceWei = response.data.result;
      const balanceEth = ethers.formatUnits(balanceWei, 18);

      return {
        success: true,
        message: 'Saldo do token obtido com sucesso',
        data: {
          contractAddress: require('../utils/address').toChecksumAddress(contractAddress),
          walletAddress: require('../utils/address').toChecksumAddress(walletAddress),
          balanceWei: balanceWei,
          balanceEth: balanceEth,
          network: network,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      throw new Error(`Erro ao consultar saldo do token: ${error.message}`);
    }
  }

  /**
   * Executa função mint do token (requer gás)
   * @param {string} contractAddress - Endereço do contrato do token
   * @param {string} toAddress - Endereço que receberá os tokens
   * @param {string} amount - Quantidade em ETH (será convertida para wei)
   * @param {string} companyWalletAddress - Endereço da carteira do company que pagará o gás
   * @param {string} network - Rede (mainnet ou testnet)
   * @param {Object} options - Opções da transação
   * @returns {Promise<Object>} Resultado da operação
   */
  async mintToken(contractAddress, toAddress, amount, gasPayer, network = 'testnet', options = {}) {
    try {
      // Determine gas payer using admin logic
      const finalGasPayer = await this.determineGasPayer(contractAddress, gasPayer);
      
      // Validar parâmetros
      if (!contractAddress || !toAddress || !amount || !finalGasPayer) {
        throw new Error('Parâmetros obrigatórios: contractAddress, toAddress, amount, e gasPayer válido');
      }

      // Converter amount para Wei se necessário
      let amountWei;
      if (typeof amount === 'string' && amount.includes('.')) {
        amountWei = ethers.utils.parseEther(amount);
      } else if (typeof amount === 'number') {
        amountWei = ethers.BigNumber.from(amount);
      } else {
        amountWei = ethers.BigNumber.from(amount);
      }

      // Verificar se finalGasPayer tem MINTER_ROLE
      const hasMinterRoleResult = await contractService.hasRole(contractAddress, 'MINTER_ROLE', finalGasPayer);
      
      if (!hasMinterRoleResult.success) {
        // Conceder MINTER_ROLE
        await contractService.grantRole(contractAddress, 'MINTER_ROLE', finalGasPayer);
      }

      // Executar mint
      const result = await contractService.callContractFunction(
        contractAddress,
        'mint',
        [toAddress, amountWei],
        options
      );

      if (result.success) {
        // Registrar transação
        const transaction = await transactionService.recordMintTransaction({
          companyId: options.companyId,
          userId: options.userId,
          contractAddress: require('../utils/address').toChecksumAddress(contractAddress),
          fromAddress: require('../utils/address').toChecksumAddress(finalGasPayer),
          toAddress: require('../utils/address').toChecksumAddress(toAddress),
          amount: amountWei.toString(),
          amountWei: amountWei.toString(),
          gasPayer: require('../utils/address').toChecksumAddress(finalGasPayer),
          network,
          txHash: result.transactionHash,
          gasUsed: result.data.gasUsed,
          gasPrice: result.data.gasPrice,
          blockNumber: result.data.receipt.blockNumber,
          status: result.data.receipt.status === 1 ? 'confirmed' : 'failed'
        });

        // Atualizar cache do usuário
        try {
          const user = await global.prisma.user.findFirst({
            where: { publicKey: toAddress }
          });
          
          if (user) {
            const userCacheService = getUserCacheService();
            await userCacheService.refreshUserCache(user.id);
          }
        } catch (cacheError) {
          console.warn('⚠️ Erro ao atualizar cache:', cacheError.message);
        }

        return {
          success: true,
          message: 'Token mintado com sucesso',
          data: {
            transactionHash: result.transactionHash,
            amount: amountWei.toString(),
            amountEth: ethers.utils.formatEther(amountWei),
            toAddress,
            contractAddress
          }
        };
      } else {
        throw new Error('Falha na execução do mint');
      }

    } catch (error) {
      console.error('❌ Erro ao mintar token:', error);
      throw error;
    }
  }

  /**
   * Executa função burnFrom do token (requer gás)
   * @param {string} contractAddress - Endereço do contrato do token
   * @param {string} fromAddress - Endereço de onde os tokens serão queimados
   * @param {string} amount - Quantidade em ETH (será convertida para wei)
   * @param {string} companyWalletAddress - Endereço da carteira do company que pagará o gás
   * @param {string} network - Rede (mainnet ou testnet)
   * @param {Object} options - Opções da transação
   * @returns {Promise<Object>} Resultado da operação
   */
  async burnFromToken(contractAddress, fromAddress, amount, gasPayer, network = 'testnet', options = {}) {
    try {
      console.log('🚀 INICIANDO burnFromToken...');
      // Validar endereços
      if (!ethers.isAddress(contractAddress)) {
        throw new Error('Endereço do contrato inválido');
      }
      if (!ethers.isAddress(fromAddress)) {
        throw new Error('Endereço de origem inválido');
      }

      // Determine gas payer using admin logic
      const finalGasPayer = await this.determineGasPayer(contractAddress, gasPayer);
      
      if (!ethers.isAddress(finalGasPayer)) {
        throw new Error('Endereço do pagador de gás inválido');
      }

      // Use the determined gas payer
      const companyWalletAddress = finalGasPayer;

      // Validar quantidade
      if (!amount || parseFloat(amount) <= 0) {
        throw new Error('Quantidade deve ser maior que zero');
      }

      // Usar 18 decimais (padrão ERC20) - o valor do usuário já é o valor final desejado  
      const amountWei = ethers.parseUnits(amount.toString(), 18);

      // Verificar se o gasPayer tem BURNER_ROLE, se não tiver, conceder
      console.log('🔍 INICIANDO VERIFICAÇÃO DE BURNER_ROLE...');
      try {
        console.log('🔍 Verificando se gasPayer tem BURNER_ROLE...');
        console.log('🔍 contractService disponível:', !!contractService);
        console.log('🔍 contractService.hasRole disponível:', !!contractService.hasRole);
        const hasBurnerRoleResult = await contractService.hasRole(contractAddress, 'burner', companyWalletAddress);
        console.log('🔍 Resultado da verificação BURNER_ROLE:', JSON.stringify(hasBurnerRoleResult));
        
        if (!hasBurnerRoleResult.data.hasRole) {
          console.log('🔍 GasPayer não tem BURNER_ROLE, concedendo...');
          await contractService.grantRole(contractAddress, 'burner', companyWalletAddress);
          console.log('✅ BURNER_ROLE concedida com sucesso');
        } else {
          console.log('✅ GasPayer já tem BURNER_ROLE');
        }
      } catch (error) {
        console.error('❌ Erro ao verificar/conceder BURNER_ROLE:', error.message);
        console.error('❌ Stack trace:', error.stack);
        // Continuar mesmo com erro na verificação de role
      }
      console.log('🔍 FINALIZANDO VERIFICAÇÃO DE BURNER_ROLE...');

      // Executar função burnFrom através do serviço de contratos
      const result = await contractService.writeContract(
        contractAddress,
        'burnFrom',
        [fromAddress, amountWei],
        companyWalletAddress,
        {
          network,
          gasLimit: options.gasLimit || 100000,
          ...options
        }
      );

      // Registrar transação na tabela
      try {
        await transactionService.recordBurnTransaction({
          companyId: options.companyId,
          userId: options.userId,
          contractAddress,
          fromAddress,
          amount,
          amountWei: ethers.parseUnits(amount.toString(), 18).toString(),
          gasPayer: companyWalletAddress,
          network,
          txHash: result.data.transactionHash,
          gasUsed: result.data.gasUsed,
          gasPrice: result.data.gasPrice,
          blockNumber: result.data.receipt.blockNumber,
          status: result.data.receipt.status === 1 ? 'confirmed' : 'failed'
        });
        console.log('✅ Transação registrada na tabela com sucesso');
      } catch (error) {
        console.error('❌ Erro ao registrar transação na tabela:', error.message);
        // Não falhar a operação se o registro da transação falhar
      }

      return {
        success: true,
        message: 'Tokens queimados com sucesso',
        data: {
          contractAddress: result.data.contractAddress,
          functionName: result.data.functionName,
          params: result.data.params.map(param => param.toString()),
          transactionHash: result.data.transactionHash,
          gasUsed: result.data.gasUsed,
          network: result.data.network,
          walletAddress: result.data.walletAddress,
          timestamp: result.data.timestamp,
          receipt: {
            blockNumber: result.data.receipt.blockNumber.toString(),
            confirmations: result.data.receipt.confirmations.toString(),
            status: result.data.receipt.status
          },
          amountWei: ethers.parseUnits(amount.toString(), 18).toString(),
          amountTokens: amount.toString(),
          fromAddress: require('../utils/address').toChecksumAddress(fromAddress)
        }
      };
    } catch (error) {
      throw new Error(`Erro ao queimar tokens: ${error.message}`);
    }
  }

  /**
   * Executa função transferFromGasless do token (requer gás)
   * @param {string} contractAddress - Endereço do contrato do token
   * @param {string} fromAddress - Endereço de origem
   * @param {string} toAddress - Endereço de destino
   * @param {string} amount - Quantidade em ETH (será convertida para wei)
   * @param {string} companyWalletAddress - Endereço da carteira do company que pagará o gás
   * @param {string} network - Rede (mainnet ou testnet)
   * @param {Object} options - Opções da transação
   * @returns {Promise<Object>} Resultado da operação
   */
  async transferFromGasless(contractAddress, fromAddress, toAddress, amount, gasPayer, network = 'testnet', options = {}) {
    try {
      // Validar endereços
      if (!ethers.isAddress(contractAddress)) {
        throw new Error('Endereço do contrato inválido');
      }
      if (!ethers.isAddress(fromAddress)) {
        throw new Error('Endereço de origem inválido');
      }
      if (!ethers.isAddress(toAddress)) {
        throw new Error('Endereço de destino inválido');
      }

      // Determine gas payer using admin logic
      const finalGasPayer = await this.determineGasPayer(contractAddress, gasPayer);
      
      if (!ethers.isAddress(finalGasPayer)) {
        throw new Error('Endereço do pagador de gás inválido');
      }

      // Use the determined gas payer
      const companyWalletAddress = finalGasPayer;

      // Validar quantidade
      if (!amount || parseFloat(amount) <= 0) {
        throw new Error('Quantidade deve ser maior que zero');
      }

      // Usar 18 decimais (padrão ERC20) - o valor do usuário já é o valor final desejado  
      const amountWei = ethers.parseUnits(amount.toString(), 18);

      // Verificar se o gasPayer tem TRANSFER_ROLE, se não tiver, conceder
      try {
        console.log('🔍 Verificando se gasPayer tem TRANSFER_ROLE...');
        const hasTransferRoleResult = await contractService.hasRole(contractAddress, 'transfer', companyWalletAddress);
        console.log('🔍 Resultado da verificação TRANSFER_ROLE:', JSON.stringify(hasTransferRoleResult));
        
        if (!hasTransferRoleResult.data.hasRole) {
          console.log('🔍 GasPayer não tem TRANSFER_ROLE, concedendo...');
          await contractService.grantRole(contractAddress, 'transfer', companyWalletAddress);
          console.log('✅ TRANSFER_ROLE concedida com sucesso');
        } else {
          console.log('✅ GasPayer já tem TRANSFER_ROLE');
        }
      } catch (error) {
        console.error('❌ Erro ao verificar/conceder TRANSFER_ROLE:', error.message);
        // Continuar mesmo com erro na verificação de role
      }

      // Executar função transferFromGasless através do serviço de contratos
      const result = await contractService.writeContract(
        contractAddress,
        'transferFromGasless',
        [fromAddress, toAddress, amountWei],
        companyWalletAddress,
        {
          network,
          gasLimit: options.gasLimit || 100000,
          ...options
        }
      );

      // Registrar transação na tabela
      try {
        await transactionService.recordTransferTransaction({
          companyId: options.companyId,
          userId: options.userId,
          contractAddress,
          fromAddress,
          toAddress,
          amount,
          amountWei: ethers.parseUnits(amount.toString(), 18).toString(),
          gasPayer: companyWalletAddress,
          network,
          txHash: result.data.transactionHash,
          gasUsed: result.data.gasUsed,
          gasPrice: result.data.gasPrice,
          blockNumber: result.data.receipt.blockNumber,
          status: result.data.receipt.status === 1 ? 'confirmed' : 'failed'
        });
        console.log('✅ Transação registrada na tabela com sucesso');
      } catch (error) {
        console.error('❌ Erro ao registrar transação na tabela:', error.message);
        // Não falhar a operação se o registro da transação falhar
      }

      return {
        success: true,
        message: 'Transferência sem gás executada com sucesso',
        data: {
          contractAddress: result.data.contractAddress,
          functionName: result.data.functionName,
          params: result.data.params.map(param => param.toString()),
          transactionHash: result.data.transactionHash,
          gasUsed: result.data.gasUsed,
          network: result.data.network,
          walletAddress: result.data.walletAddress,
          timestamp: result.data.timestamp,
          receipt: {
            blockNumber: result.data.receipt.blockNumber.toString(),
            confirmations: result.data.receipt.confirmations.toString(),
            status: result.data.receipt.status
          },
          amountWei: ethers.parseUnits(amount.toString(), 18).toString(),
          amountTokens: amount.toString(),
          fromAddress: require('../utils/address').toChecksumAddress(fromAddress),
          toAddress: require('../utils/address').toChecksumAddress(toAddress)
        }
      };
    } catch (error) {
      throw new Error(`Erro na transferência sem gás: ${error.message}`);
    }
  }

  /**
   * Registra um contrato de token no sistema
   */
  async registerToken(tokenData) {
    try {
      const { address, network = 'testnet', adminAddress, website, description } = tokenData;

      // Validar endereço
      if (!ethers.isAddress(address)) {
        throw new Error('Endereço do contrato inválido');
      }

      // Validar adminAddress se fornecido
      if (adminAddress && !ethers.isAddress(adminAddress)) {
        throw new Error('adminAddress inválido se fornecido');
      }

      // Usar o serviço de contratos para registrar
      const contractData = {
        address,
        network,
        adminAddress: adminAddress ? adminAddress.toLowerCase() : null,
        contractType: 'ERC20', // Assumindo que todos os tokens registrados são ERC20
        metadata: {
          website,
          description,
          explorer: network === 'mainnet' ? 'https://azorescan.com' : 'https://floripa.azorescan.com'
        }
      };

      const result = await contractService.registerContract(contractData);
      
      return {
        success: true,
        message: 'Token registrado com sucesso',
        data: {
          ...result.data,
          tokenInfo: {
            isUpdate: false, // Será atualizado pelo contractService
            address: require('../utils/address').toChecksumAddress(address),
            network,
            adminAddress: adminAddress ? adminAddress.toLowerCase() : null
          }
        }
      };
    } catch (error) {
      throw new Error(`Erro ao registrar token: ${error.message}`);
    }
  }

  /**
   * Lista todos os tokens registrados
   */
  async listTokens(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        network,
        contractType,
        isActive
      } = options;

      const offset = (page - 1) * limit;
      const where = {};

      if (isActive !== undefined) where.isActive = isActive;
      if (network) where.network = network;
      if (contractType) where.contractType = contractType;

      const prisma = this.getPrisma();

      // Buscar tokens usando Prisma
      const [tokens, total] = await Promise.all([
        prisma.smartContract.findMany({
          where,
          take: limit,
          skip: offset,
          orderBy: {
            createdAt: 'desc'
          }
        }),
        prisma.smartContract.count({ where })
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        success: true,
        message: 'Tokens listados com sucesso',
        data: {
          tokens,
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
          }
        }
      };
    } catch (error) {
      throw new Error(`Erro ao listar tokens: ${error.message}`);
    }
  }

  /**
   * Desativa um token
   */
  async deactivateToken(contractAddress) {
    try {
      // Validar endereço
      if (!ethers.isAddress(contractAddress)) {
        throw new Error('Endereço do contrato inválido');
      }

      // Buscar e atualizar o contrato diretamente
      const contract = await global.prisma.smartContract.findFirst({ 
        where: { 
          address: contractAddress
        } 
      });
      
      if (!contract) {
        throw new Error('Token não encontrado');
      }

      // Atualizar usando Prisma
      await global.prisma.smartContract.update({
        where: { id: contract.id },
        data: { isActive: false }
      });
      
      return {
        success: true,
        message: 'Token desativado com sucesso',
        data: {
          address: require('../utils/address').toChecksumAddress(contractAddress),
          isActive: false
        }
      };
    } catch (error) {
      throw new Error(`Erro ao desativar token: ${error.message}`);
    }
  }

  /**
   * Ativa um token
   */
  async activateToken(contractAddress) {
    try {
      // Validar endereço
      if (!ethers.isAddress(contractAddress)) {
        throw new Error('Endereço do contrato inválido');
      }

      // Buscar e atualizar o contrato diretamente (incluindo inativos)
      const contract = await global.prisma.smartContract.findFirst({
        where: { 
          address: contractAddress
        }
      });
      
      if (!contract) {
        throw new Error('Token não encontrado');
      }

      // Atualizar usando Prisma
      await global.prisma.smartContract.update({
        where: { id: contract.id },
        data: { isActive: true }
      });
      
      return {
        success: true,
        message: 'Token ativado com sucesso',
        data: {
          address: require('../utils/address').toChecksumAddress(contractAddress),
          isActive: true
        }
      };
    } catch (error) {
      throw new Error(`Erro ao ativar token: ${error.message}`);
    }
  }

  /**
   * Obtém informações básicas do token
   * @param {string} contractAddress - Endereço do contrato do token
   * @param {string} network - Rede (mainnet ou testnet)
   * @returns {Promise<Object>} Informações do token
   */
  async getTokenInfo(contractAddress, network = 'testnet') {
    try {
      // Validar endereço
      if (!ethers.isAddress(contractAddress)) {
        throw new Error('Endereço do contrato inválido');
      }

      // Buscar informações do contrato no banco (incluindo inativos)
      const contract = await global.prisma.smartContract.findUnique({ where: { address: require('../utils/address').normalizeAddress(contractAddress) } });
      
      if (!contract) {
        throw new Error('Token não encontrado');
      }

      // Obter informações da blockchain
      const provider = blockchainService.config.getProvider(network);
      const contractInstanceForInfo = new ethers.Contract(contractAddress, contract.abi, provider);
      
      const [name, symbol, decimals, totalSupply] = await Promise.all([
        contractInstanceForInfo.name(),
        contractInstanceForInfo.symbol(),
        contractInstanceForInfo.decimals(),
        contractInstanceForInfo.totalSupply()
      ]);
      
      return {
        success: true,
        message: 'Informações do token obtidas com sucesso',
        data: {
          address: require('../utils/address').toChecksumAddress(contractAddress),
          name,
          symbol,
          decimals: decimals.toString(),
          totalSupply: totalSupply.toString(),
          network: network,
          contractType: contract.contractType,
          isActive: contract.isActive,
          metadata: contract.metadata
        }
      };
    } catch (error) {
      throw new Error(`Erro ao obter informações do token: ${error.message}`);
    }
  }

  /**
   * Atualiza informações do token
   */
  async updateTokenInfo(contractAddress, metadata) {
    try {
      // Validar endereço
      if (!ethers.isAddress(contractAddress)) {
        throw new Error('Endereço do contrato inválido');
      }

      // Buscar e atualizar o contrato diretamente (incluindo inativos)
      const contract = await global.prisma.smartContract.findUnique({ where: { address: require('../utils/address').normalizeAddress(contractAddress) } });
      
      if (!contract) {
        throw new Error('Token não encontrado');
      }

      // Atualizar metadados
      const updatedMetadata = {
        ...contract.metadata,
        ...metadata
      };

      await contract.update({ metadata: updatedMetadata });
      
      return {
        success: true,
        message: 'Informações do token atualizadas com sucesso',
        data: {
          address: require('../utils/address').toChecksumAddress(contractAddress),
          metadata: updatedMetadata
        }
      };
    } catch (error) {
      throw new Error(`Erro ao atualizar informações do token: ${error.message}`);
    }
  }

  /**
   * Obtém o saldo da moeda nativa AZE
   * @param {string} walletAddress - Endereço da carteira
   * @param {string} network - Rede (mainnet ou testnet)
   * @returns {Promise<Object>} Saldo da moeda AZE
   */
  async getAzeBalance(walletAddress, network = 'testnet') {
    try {
      if (!ethers.isAddress(walletAddress)) {
        throw new Error('Endereço da carteira inválido');
      }
      // Obter provider da rede
      const provider = blockchainService.config.getProvider(network);
      // Consultar saldo
      const balanceWei = await provider.getBalance(walletAddress);
      const balanceEth = ethers.formatUnits(balanceWei, 18);
      return {
        success: true,
        message: 'Saldo da moeda AZE obtido com sucesso',
        data: {
          walletAddress: require('../utils/address').toChecksumAddress(walletAddress),
          balanceWei: balanceWei.toString(),
          balanceEth: balanceEth,
          network: network,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      throw new Error(`Erro ao consultar saldo da moeda AZE: ${error.message}`);
    }
  }

  /**
   * Mint tokens para um endereço (apenas para tokens com função mint)
   * @param {string} contractAddress - Endereço do contrato do token
   * @param {string} toAddress - Endereço de destino
   * @param {string} amount - Quantidade a mintar
   * @param {string} network - Rede (mainnet ou testnet)
   * @returns {Promise<Object>} Resultado da transação
   */
  async mintTokens(contractAddress, toAddress, amount, network = 'testnet') {
    try {
      // Validar endereços
      if (!ethers.isAddress(contractAddress)) {
        throw new Error('Endereço do contrato inválido');
      }
      if (!ethers.isAddress(toAddress)) {
        throw new Error('Endereço de destino inválido');
      }

      // Buscar contrato e ABI
      const contract = await contractService.getContract(contractAddress);
      if (!contract || !contract.abi) {
        throw new Error('Contrato não encontrado ou ABI indisponível');
      }

      // Executar mint
      const result = await blockchainService.executeContractFunction(
        contractAddress,
        contract.abi,
        'mint',
        [toAddress, ethers.parseUnits(amount, 18)], // Assumindo 18 decimais
        network
      );

      return {
        success: true,
        message: 'Tokens mintados com sucesso',
        data: result
      };
    } catch (error) {
      return {
        success: false,
        message: 'Erro ao mintar tokens',
        error: error.message
      };
    }
  }

  /**
   * Burn tokens de um endereço (apenas para tokens com função burnFrom)
   * @param {string} contractAddress - Endereço do contrato do token
   * @param {string} fromAddress - Endereço de origem
   * @param {string} amount - Quantidade a queimar
   * @param {string} network - Rede (mainnet ou testnet)
   * @returns {Promise<Object>} Resultado da transação
   */
  async burnTokensFrom(contractAddress, fromAddress, amount, network = 'testnet') {
    try {
      // Validar endereços
      if (!ethers.isAddress(contractAddress)) {
        throw new Error('Endereço do contrato inválido');
      }
      if (!ethers.isAddress(fromAddress)) {
        throw new Error('Endereço de origem inválido');
      }

      // Buscar contrato e ABI
      const contract = await contractService.getContract(contractAddress);
      if (!contract || !contract.abi) {
        throw new Error('Contrato não encontrado ou ABI indisponível');
      }

      // Executar burnFrom
      const result = await blockchainService.executeContractFunction(
        contractAddress,
        contract.abi,
        'burnFrom',
        [fromAddress, ethers.parseUnits(amount, 18)], // Assumindo 18 decimais
        network
      );

      return {
        success: true,
        message: 'Tokens queimados com sucesso',
        data: result
      };
    } catch (error) {
      return {
        success: false,
        message: 'Erro ao queimar tokens',
        error: error.message
      };
    }
  }

  /**
   * Transfer gasless de tokens (meta-transação)
   * @param {string} contractAddress - Endereço do contrato do token
   * @param {string} fromAddress - Endereço de origem
   * @param {string} toAddress - Endereço de destino
   * @param {string} amount - Quantidade a transferir
   * @param {string} network - Rede (mainnet ou testnet)
   * @returns {Promise<Object>} Resultado da transação
   */
  async transferFromGasless(contractAddress, fromAddress, toAddress, amount, network = 'testnet') {
    try {
      // Validar endereços
      if (!ethers.isAddress(contractAddress)) {
        throw new Error('Endereço do contrato inválido');
      }
      if (!ethers.isAddress(fromAddress)) {
        throw new Error('Endereço de origem inválido');
      }
      if (!ethers.isAddress(toAddress)) {
        throw new Error('Endereço de destino inválido');
      }

      // Buscar contrato e ABI
      const contract = await contractService.getContract(contractAddress);
      if (!contract || !contract.abi) {
        throw new Error('Contrato não encontrado ou ABI indisponível');
      }

      // Executar transferFromGasless
      const result = await blockchainService.executeContractFunction(
        contractAddress,
        contract.abi,
        'transferFromGasless',
        [fromAddress, toAddress, ethers.parseUnits(amount, 18)], // Assumindo 18 decimais
        network
      );

      return {
        success: true,
        message: 'Transferência gasless realizada com sucesso',
        data: result
      };
    } catch (error) {
      return {
        success: false,
        message: 'Erro na transferência gasless',
        error: error.message
      };
    }
  }

  /**
   * Testa o serviço de tokens
   * @returns {Promise<Object>} Resultado do teste
   */
  async testService() {
    try {
      // Token de teste na testnet
      const testTokenAddress = '0x0A8c73967e4Eee8ffA06484C3fBf65E6Ae3b9804';
      const testWalletAddress = '0x95aDDd264023038D7Aa77B0974Ef3C4dc43E3bd6';

      // Teste básico de conectividade
      const balanceTest = await this.getTokenBalance(testTokenAddress, testWalletAddress, 'testnet');

      return {
        success: true,
        message: 'Teste do serviço de tokens realizado com sucesso',
        data: {
          balanceTest: balanceTest.success,
          testTokenAddress,
          testWalletAddress,
          serviceStatus: 'operational'
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Falha no teste do serviço de tokens',
        error: error.message,
        data: {
          serviceStatus: 'error',
          error: error.message
        }
      };
    }
  }
}

module.exports = new TokenService(); 