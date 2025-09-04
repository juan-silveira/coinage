const { ethers } = require('ethers');
const blockchainService = require('./blockchain.service');
const transactionService = require('./transaction.service');
const earningsService = require('./earnings.service');
const prismaConfig = require('../config/prisma');

/**
 * Função helper para obter Prisma
 */
const getPrisma = () => prismaConfig.getPrisma();

class StakeService {
  constructor() {
    this.initialized = false;
  }

  async initialize() {
    try {
      // Garantir que o Prisma está inicializado
      if (!this.initialized) {
        await prismaConfig.initialize();
        this.initialized = true;
        console.log('✅ Serviço de stakes inicializado com sucesso');
      }
    } catch (error) {
      console.error('❌ Erro ao inicializar serviço de stakes:', error.message);
      throw error;
    }
  }

  /**
   * Registra um novo stake no banco de dados
   */
  async registerStake(stakeData) {
    try {
      await this.initialize();
      const prisma = getPrisma();

      const {
        name,
        address,
        abi = [],
        network = 'testnet',
        contractType = 'STAKE',
        adminAddress,
        metadata = {}
      } = stakeData;

      // Validar endereço
      if (!ethers.isAddress(address)) {
        throw new Error('Endereço do contrato inválido');
      }

      // Verificar se o stake já existe
      const existingStake = await prisma.smartContract.findUnique({
        where: { address: address }
      });
      
      if (existingStake) {
        throw new Error('Stake já está registrado');
      }

      // Obter informações do stake na blockchain
      let stakeInfo = {};
      let finalABI = abi;
      
      // Usar STAKE_ABI padrão se não tivermos ABI específico
      if (!abi || abi.length === 0) {
        try {
          const stakeABI = process.env.STAKE_ABI;
          if (stakeABI) {
            finalABI = JSON.parse(stakeABI);
          }
        } catch (error) {
          console.warn(`Erro ao parsear STAKE_ABI: ${error.message}`);
        }
      }
      
      if (finalABI && finalABI.length > 0) {
        try {
          const provider = blockchainService.config.getProvider(network);
          const contractInstanceForStakeInfo = new ethers.Contract(address, finalABI, provider);
          
          // Obter informações específicas do stake
          const [stakeToken, rewardToken, minValueStake] = await Promise.all([
            contractInstanceForStakeInfo.stakeToken(),
            contractInstanceForStakeInfo.rewardToken(),
            contractInstanceForStakeInfo.minValueStake()
          ]);

          stakeInfo = {
            stakeToken,
            rewardToken,
            minStake: ethers.formatEther(minValueStake)
          };
        } catch (error) {
          console.warn(`Não foi possível obter informações do stake na blockchain: ${error.message}`);
        }
      }

      // Criar stake no banco usando Prisma
      const stake = await prisma.smartContract.create({
        data: {
          companyId: '2195b754-83d9-44d1-b5cd-f912ca70636c', // ID da empresa padrão
          name: name || `Stake ${address.slice(0, 8)}...`,
          address: address,
          abi: finalABI,
          network: network,
          metadata: {
            ...metadata,
            ...stakeInfo,
            contractType: contractType,
            adminAddress: adminAddress || null,
            explorer: network === 'mainnet' ? 'https://azorescan.com' : 'https://floripa.azorescan.com'
          },
          isActive: true
        }
      });

      return {
        success: true,
        message: 'Stake registrado com sucesso',
        data: stake
      };
    } catch (error) {
      throw new Error(`Erro ao registrar stake: ${error.message}`);
    }
  }

  /**
   * Obtém informações do stake da blockchain
   */
  async getStakeInfo(address) {
    try {
      await this.initialize();
      const prisma = getPrisma();

      const stake = await prisma.smartContract.findUnique({
        where: { address: address }
      });
      
      if (!stake) {
        throw new Error('Stake não encontrado');
      }

      // Obter provider
      const provider = blockchainService.config.getProvider(stake.network);
      
      // Criar instância do contrato
      const contractInstanceForStakeInfo = new ethers.Contract(
        address,
        stake.abi,
        provider
      );

      // Obter informações específicas do stake
      const [stakeToken, rewardToken, minValueStake] = await Promise.all([
        contractInstanceForStakeInfo.stakeToken(),
        contractInstanceForStakeInfo.rewardToken(),
        contractInstanceForStakeInfo.minValueStake()
      ]);

      return {
        success: true,
        message: 'Informações do stake obtidas com sucesso',
        data: {
          address,
          stakeToken,
          rewardToken,
          minStake: ethers.formatEther(minValueStake),
          network: stake.network,
          contractType: stake.contractType,
          metadata: stake.metadata,
          adminAddress: stake.adminAddress
        }
      };
    } catch (error) {
      throw new Error(`Erro ao obter informações do stake: ${error.message}`);
    }
  }

  /**
   * Executa uma operação de escrita no contrato de stake
   */
  async writeStakeContract(stakeAddress, functionName, params = [], walletAddress, jwtUser = null, options = {}) {
    try {
      await this.initialize();
      const prisma = getPrisma();

      // Obter stake do banco
      const stake = await prisma.smartContract.findUnique({
        where: { address: stakeAddress }
      });
      
      if (!stake) {
        throw new Error('Stake não encontrado');
      }

      // Obter função do ABI
      const abiFunction = this.getABIFunction(stake.abi, functionName);
      if (!abiFunction) {
        throw new Error(`Função '${functionName}' não encontrada no ABI`);
      }

      // Verificar se é uma função de escrita
      if (abiFunction.stateMutability === 'view' || abiFunction.stateMutability === 'pure') {
        throw new Error(`Função '${functionName}' não é uma função de escrita`);
      }

      // Converter valores de ETH para wei se necessário
      const convertedParams = params.map((param, index) => {
        // Verificar se é um parâmetro de quantidade (amount, value, etc.)
        const input = abiFunction.inputs[index];
        if (input && input.type === 'uint256' && typeof param === 'string' && !param.startsWith('0x')) {
          // Se o valor não parece ser um endereço (não começa com 0x), converter de ETH para wei
          try {
            return ethers.parseEther(param);
          } catch (error) {
            // Se não conseguir converter, manter o valor original
            return param;
          }
        }
        return param;
      });

      // Usar a chave privada do admin do .env
      const adminPrivateKey = process.env.ADMIN_WALLET_PRIVATE_KEY || process.env.ADMIN_PRIVATE_KEY;
      if (!adminPrivateKey) {
        throw new Error('ADMIN_WALLET_PRIVATE_KEY não encontrada no .env');
      }

      // Obter provider e signer
      const provider = blockchainService.config.getProvider(stake.network);
      const signer = new ethers.Wallet(adminPrivateKey, provider);

      // Forçar uso do ABI padrão do .env se for STAKE
      let abiToUse = stake.abi;
      if (stake.contractType === 'STAKE' && process.env.STAKE_ABI) {
        try {
          abiToUse = JSON.parse(process.env.STAKE_ABI);
        } catch (e) {
          console.error('❌ Erro ao fazer parse do STAKE_ABI do .env:', e.message);
        }
      }

      // Criar instância do contrato com signer
      const contractInstanceForStakeWrite = new ethers.Contract(
        stake.address,
        abiToUse,
        signer
      );

      // Preparar transação
      const txOptions = {
        gasLimit: options.gasLimit || 300000,
        ...options
      };

      console.log('🔥 [BLOCKCHAIN DEBUG] Iniciando transação blockchain...');
      console.log('🔥 [BLOCKCHAIN DEBUG] Contract:', stake.address);
      console.log('🔥 [BLOCKCHAIN DEBUG] Function:', functionName);
      console.log('🔥 [BLOCKCHAIN DEBUG] Converted Params:', convertedParams);
      console.log('🔥 [BLOCKCHAIN DEBUG] Network:', stake.network);
      console.log('🔥 [BLOCKCHAIN DEBUG] Signer Address:', signer.address);
      console.log('🔥 [BLOCKCHAIN DEBUG] Gas Limit:', txOptions.gasLimit);

      // Executar função com parâmetros convertidos
      console.log('🔥 [BLOCKCHAIN DEBUG] Chamando função no contrato...');
      const tx = await contractInstanceForStakeWrite[functionName](...convertedParams);
      
      console.log('🔥 [BLOCKCHAIN DEBUG] Transação enviada! Hash:', tx.hash);
      console.log('🔥 [BLOCKCHAIN DEBUG] Aguardando confirmação...');
      
      // Aguardar confirmação
      const receipt = await tx.wait();
      
      console.log('🔥 [BLOCKCHAIN DEBUG] Transação confirmada!');
      console.log('🔥 [BLOCKCHAIN DEBUG] Block Number:', receipt.blockNumber);
      console.log('🔥 [BLOCKCHAIN DEBUG] Gas Used:', receipt.gasUsed.toString());

      // Montar txData para logging e registro
      const txDataForLog = {
        functionName,
        params: convertedParams,
        originalParams: params,
        transactionHash: tx.hash,
        gasUsed: receipt.gasUsed.toString(),
        contractAddress: stakeAddress,
        network: stake.network,
        signer: signer.address,
        receipt,
        stakeContract: stake
      };

      console.log('📦 [TXDATA DEBUG] Dados completos do txData:');
      console.log('📦 [TXDATA DEBUG] - functionName:', txDataForLog.functionName);
      console.log('📦 [TXDATA DEBUG] - originalParams:', JSON.stringify(txDataForLog.originalParams));
      console.log('📦 [TXDATA DEBUG] - convertedParams:', txDataForLog.params.map(p => p.toString()));
      console.log('📦 [TXDATA DEBUG] - contractAddress:', txDataForLog.contractAddress);
      console.log('📦 [TXDATA DEBUG] - transactionHash:', txDataForLog.transactionHash);
      console.log('📦 [TXDATA DEBUG] - gasUsed:', txDataForLog.gasUsed);
      console.log('📦 [TXDATA DEBUG] - network:', txDataForLog.network);
      console.log('📦 [TXDATA DEBUG] - signer:', txDataForLog.signer);

      // Registrar transação no banco de dados
      console.log('🔍 [DEBUG] functionName recebido:', functionName);
      console.log('🔍 [DEBUG] params[0] recebido:', params[0]);
      console.log('🔍 [DEBUG] Registrando transação para função:', functionName);
      
      // Para distributeReward, usar null como userAddress pois params[0] é o percentage, não um endereço
      const userAddress = (functionName === 'distributeReward') ? null : params[0];
      console.log('🔍 [DEBUG] userAddress determinado:', userAddress);
      
      await this.recordStakeTransaction(txDataForLog, userAddress, jwtUser);

      return {
        success: true,
        message: 'Operação de escrita executada com sucesso',
        data: {
          stakeAddress: stake.address,
          functionName,
          params: convertedParams.map(param => param.toString()),
          originalParams: params,
          transactionHash: tx.hash,
          gasUsed: receipt.gasUsed.toString(),
          network: stake.network,
          walletAddress: signer.address,
          timestamp: new Date().toISOString(),
          receipt: {
            blockNumber: receipt.blockNumber,
            confirmations: receipt.confirmations,
            status: receipt.status
          }
        }
      };
    } catch (error) {
      throw new Error(`Erro na operação de escrita: ${error.message}`);
    }
  }

  /**
   * Registra uma transação de stake no banco de dados
   */
  async recordStakeTransaction(txData, userAddress = null, jwtUser = null) {
    try {
      const prisma = getPrisma();
      
      // Mapear função para tipo de operação
      const operationTypeMap = {
        'stake': 'stake',
        'unstake': 'unstake', 
        'withdraw': 'unstake',
        'claimReward': 'claim_rewards',
        'compound': 'compound'
      };

      const transactionTypeMap = {
        'stake': 'stake',
        'unstake': 'unstake',
        'withdraw': 'unstake', 
        'claimReward': 'stake_reward',
        'compound': 'stake'
      };

      const operationType = operationTypeMap[txData.functionName] || 'stake';
      const transactionType = transactionTypeMap[txData.functionName] || 'stake';

      // Buscar usuário: priorizar JWT user, fallback para blockchain address
      let userRecord = null;
      if (jwtUser && jwtUser.id) {
        // Usar informações do JWT diretamente
        userRecord = await prisma.user.findUnique({
          where: { id: jwtUser.id },
          include: {
            userCompanies: {
              include: {
                company: true
              }
            }
          }
        });
      } else if (userAddress) {
        // Fallback: buscar pelo endereço blockchain
        userRecord = await prisma.user.findFirst({
          where: {
            OR: [
              { blockchainAddress: userAddress },
              { publicKey: userAddress }
            ]
          },
          include: {
            userCompanies: {
              include: {
                company: true
              }
            }
          }
        });
      }

      // Obter informações do token de stake
      let currency = 'UNKNOWN'; // Padrão quando não conseguir buscar
      let tokenAddress = null;
      
      try {
        // Buscar o endereço do token stakeado do contrato
        const provider = blockchainService.config.getProvider(txData.network);
        const contractInstance = new ethers.Contract(
          txData.contractAddress,
          txData.stakeContract.abi,
          provider
        );

        // Tentar buscar o token address (método comum em contratos de stake)
        try {
          tokenAddress = await contractInstance.stakeToken();
          console.log(`📍 Token address encontrado: ${tokenAddress}`);
          
          // Agora buscar o symbol do token
          const tokenContract = new ethers.Contract(
            tokenAddress,
            ['function symbol() view returns (string)'],
            provider
          );
          
          const tokenSymbol = await tokenContract.symbol();
          currency = tokenSymbol;
          console.log(`💰 Token symbol: ${tokenSymbol}`);
          
        } catch (tokenError) {
          console.warn('Não foi possível buscar informações do token:', tokenError.message);
          // Se não conseguir buscar, usar o endereço como fallback
          currency = tokenAddress ? `TOKEN_${tokenAddress.slice(-6)}` : 'STAKE';
        }
        
      } catch (error) {
        console.warn('Erro ao obter informações do token de stake:', error.message);
        currency = 'STAKE'; // Fallback final
      }

      // Criar transação (copiando formato do deposit.service.js)
      const transaction = await prisma.transaction.create({
        data: {
          companyId: jwtUser?.companyId || userRecord?.userCompanies?.[0]?.company?.id || '2195b754-83d9-44d1-b5cd-f912ca70636c',
          userId: jwtUser?.id || userRecord?.id || '5e8fd1b6-9969-44a8-bcb5-0dd832b1d973',
          transactionType: transactionType,
          
          // Status principal
          status: 'confirmed',
          
          // Valores - usar o primeiro parâmetro para amount (igual para depositRewards e distributeReward)
          amount: txData.originalParams[0] ? parseFloat(txData.originalParams[0].toString()) : 0,
          net_amount: txData.originalParams[0] ? parseFloat(txData.originalParams[0].toString()) : 0,
          currency: currency,
          
          // Blockchain fields 
          network: txData.network,
          contractAddress: txData.contractAddress,
          fromAddress: userAddress || txData.signer, // Endereço do usuário que fez a transação
          toAddress: txData.contractAddress,
          functionName: txData.functionName,
          
          // Hashes e blocos
          txHash: txData.transactionHash,
          blockNumber: txData.receipt?.blockNumber ? BigInt(txData.receipt.blockNumber) : null,
          gasUsed: txData.gasUsed ? BigInt(txData.gasUsed) : null,
          
          // Timestamps
          confirmedAt: new Date(),
          
          // Metadata
          metadata: {
            params: txData.originalParams,
            convertedParams: txData.params.map(p => p.toString()),
            receipt: txData.receipt,
            operationType: operationType,
            userAddress: userAddress,
            jwtUserId: jwtUser?.id,
            jwtUserEmail: jwtUser?.email,
            stakeContractInfo: {
              name: txData.stakeContract?.name,
              address: txData.stakeContract?.address,
              metadata: txData.stakeContract?.metadata
            },
            tokenInfo: {
              address: tokenAddress,
              symbol: currency,
              discoveredAt: new Date().toISOString()
            }
          }
        }
      });

      // Registrar earnings para claimReward e compound
      if (txData.functionName === 'claimReward' || txData.functionName === 'compound') {
        try {
          console.log(`💰 Registrando earnings para ${txData.functionName}...`);
          
          // Obter o valor da recompensa dos parâmetros ou da transação
          let rewardAmount = 0;
          
          // Para claimReward e compound, geralmente o valor está nos eventos do receipt
          // Por enquanto, vamos usar o valor dos parâmetros se disponível
          if (txData.originalParams && txData.originalParams.length > 1) {
            rewardAmount = parseFloat(txData.originalParams[1]?.toString() || '0');
          } else if (txData.receipt && txData.receipt.logs && txData.receipt.logs.length > 0) {
            // Tentar extrair o valor dos logs do contrato (eventos)
            // Isso varia dependendo do contrato, mas geralmente há um evento RewardClaimed ou similar
            try {
              // Por enquanto usar um valor padrão se não conseguir extrair
              rewardAmount = 0;
            } catch (e) {
              console.warn('⚠️ Não foi possível extrair valor de recompensa dos logs');
            }
          }
          
          // Criar registro de earning
          const earningData = {
            userId: userRecord?.id || null,
            tokenSymbol: currency || 'REWARD',
            tokenName: `${currency || 'REWARD'} Rewards`,
            amount: rewardAmount || 0,
            quote: 0, // Poderia calcular o valor em USD/BRL aqui
            network: txData.network,
            transactionHash: txData.transactionHash,
            distributionDate: new Date(),
          };
          
          const earningResult = await earningsService.createEarning(earningData);
          
          if (earningResult.success) {
            console.log(`✅ Earning registrado: ${earningResult.data.id}`);
          } else {
            console.warn(`⚠️ Erro ao registrar earning: ${earningResult.message}`);
          }
          
        } catch (earningsError) {
          console.error('❌ Erro ao registrar earnings:', earningsError);
          // Não lançar erro para não interromper o fluxo principal
        }
      }

      console.log('✅ Transação de stake registrada no banco:', transaction.id);
      return transaction;
    } catch (error) {
      console.error('❌ Erro ao registrar transação de stake:', error);
      throw error;
    }
  }

  /**
   * Executa uma operação de leitura no contrato de stake
   */
  async readStakeContract(stakeAddress, functionName, params = [], options = {}) {
    try {
      await this.initialize();
      const prisma = getPrisma();

      // Obter stake do banco
      const stake = await prisma.smartContract.findUnique({
        where: { address: stakeAddress }
      });
      
      if (!stake) {
        throw new Error('Stake não encontrado');
      }

      // Obter função do ABI
      const abiFunction = this.getABIFunction(stake.abi, functionName);
      if (!abiFunction) {
        throw new Error(`Função '${functionName}' não encontrada no ABI`);
      }

      // Verificar se é uma função de leitura
      if (abiFunction.stateMutability === 'payable' || abiFunction.stateMutability === 'nonpayable') {
        throw new Error(`Função '${functionName}' não é uma função de leitura`);
      }

      // Obter provider
      const provider = blockchainService.config.getProvider(stake.network);
      
      // Se a função requer permissões especiais, usar signer admin
      let contractInstanceForStakeRead;
      if (options.useAdminSigner || functionName === 'getAvailableRewardBalance') {
        const adminPrivateKey = process.env.ADMIN_WALLET_PRIVATE_KEY || process.env.ADMIN_PRIVATE_KEY;
        if (!adminPrivateKey) {
          throw new Error('ADMIN_WALLET_PRIVATE_KEY não encontrada no .env');
        }
        const signer = new ethers.Wallet(adminPrivateKey, provider);
        contractInstanceForStakeRead = new ethers.Contract(stake.address, stake.abi, signer);
      } else {
        contractInstanceForStakeRead = new ethers.Contract(stake.address, stake.abi, provider);
      }

      // Executar função
      const result = await contractInstanceForStakeRead[functionName](...params);

      return {
        success: true,
        message: 'Operação de leitura executada com sucesso',
        data: {
          stakeAddress: stake.address,
          functionName,
          params,
          result: result.toString(),
          network: stake.network,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      throw new Error(`Erro na operação de leitura: ${error.message}`);
    }
  }

  /**
   * Obtém uma função do ABI
   */
  getABIFunction(abi, functionName) {
    if (!abi || !Array.isArray(abi)) return null;
    
    return abi.find(item => 
      item.type === 'function' && 
      item.name === functionName
    );
  }

  /**
   * Verifica se um usuário tem a role DEFAULT_ADMIN_ROLE em um stake
   */
  async verifyStakeAdmin(stakeAddress, adminAddress) {
    try {
      await this.initialize();
      const prisma = getPrisma();

      // Obter stake do banco
      const stake = await prisma.smartContract.findUnique({
        where: { address: stakeAddress }
      });
      
      if (!stake) {
        throw new Error('Stake não encontrado');
      }

      // Obter provider
      const provider = blockchainService.config.getProvider(stake.network);
      
      // Criar instância do contrato
      const contractInstanceForStakeAdminVerify = new ethers.Contract(
        stake.address,
        stake.abi,
        provider
      );

      // Verificar se o contrato tem a função hasRole
      const hasRoleFunction = this.getABIFunction(stake.abi, 'hasRole');
      if (!hasRoleFunction) {
        throw new Error('Contrato não possui sistema de roles');
      }

      // Verificar se o usuário tem a role DEFAULT_ADMIN_ROLE
      const DEFAULT_ADMIN_ROLE = '0x0000000000000000000000000000000000000000000000000000000000000000';
      const hasRole = await contractInstanceForStakeAdminVerify.hasRole(DEFAULT_ADMIN_ROLE, adminAddress);

      return hasRole;
    } catch (error) {
      throw new Error(`Erro ao verificar admin do stake: ${error.message}`);
    }
  }

  /**
   * Obtém stake por endereço
   */
  async getStakeByAddress(address) {
    try {
      await this.initialize();
      const prisma = getPrisma();

      const stake = await prisma.smartContract.findUnique({
        where: { address: address }
      });
      
      if (!stake) {
        return {
          success: false,
          message: 'Stake não encontrado'
        };
      }

      return {
        success: true,
        message: 'Stake encontrado com sucesso',
        data: stake
      };
    } catch (error) {
      throw new Error(`Erro ao buscar stake: ${error.message}`);
    }
  }

  /**
   * Lista todos os stakes
   */
  async listStakes(options = {}) {
    try {
      await this.initialize();
      const prisma = getPrisma();

      const { page = 1, limit = 10, network, contractType } = options;
      const skip = (page - 1) * limit;

      const whereClause = { 
        isActive: true
      };
      
      if (network) whereClause.network = network;
      // Filtro por contractType será feito via metadata se necessário

      const [stakes, total] = await Promise.all([
        prisma.smartContract.findMany({
          where: whereClause,
          take: parseInt(limit),
          skip: parseInt(skip),
          orderBy: { createdAt: 'desc' }
        }),
        prisma.smartContract.count({ where: whereClause })
      ]);

      return {
        success: true,
        message: 'Stakes listados com sucesso',
        data: {
          stakes: stakes,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: total,
            pages: Math.ceil(total / limit)
          }
        }
      };
    } catch (error) {
      throw new Error(`Erro ao listar stakes: ${error.message}`);
    }
  }

  /**
   * Testa o serviço de stakes
   */
  async testService() {
    try {
      await this.initialize();
      
      // Teste de validação de ABI
      const testABI = [
        {
          "type": "function",
          "name": "stakeToken",
          "inputs": [],
          "outputs": [{"name": "", "type": "address"}],
          "stateMutability": "view"
        },
        {
          "type": "function",
          "name": "stake",
          "inputs": [
            {"name": "user", "type": "address"},
            {"name": "amount", "type": "uint256"},
            {"name": "_customTimestamp", "type": "uint256"}
          ],
          "outputs": [],
          "stateMutability": "nonpayable"
        }
      ];

      // Validar se conseguimos encontrar as funções no ABI
      const stakeTokenFunction = this.getABIFunction(testABI, 'stakeToken');
      const stakeFunction = this.getABIFunction(testABI, 'stake');

      if (!stakeTokenFunction || !stakeFunction) {
        throw new Error('Erro na validação do ABI');
      }

      return {
        success: true,
        message: 'Teste do serviço de stakes realizado com sucesso',
        data: {
          abiValidation: true,
          serviceInitialized: this.initialized,
          prismaConnected: true
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Falha no teste do serviço de stakes',
        error: error.message
      };
    }
  }
}

module.exports = new StakeService();