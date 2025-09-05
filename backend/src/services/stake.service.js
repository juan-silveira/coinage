const { ethers } = require('ethers');
const blockchainService = require('./blockchain.service');
const transactionService = require('./transaction.service');
const earningsService = require('./earnings.service');
const prismaConfig = require('../config/prisma');
const { getTokenPrice, getTokenName } = require('../constants/tokenPrices');

// Função helper para buscar contract type por nome
const getContractTypeByName = async (name) => {
  try {
    const contractType = await global.prisma.contractType.findUnique({
      where: { name }
    });
    return contractType;
  } catch (error) {
    console.warn(`Não foi possível encontrar contract type ${name}:`, error.message);
    return null;
  }
};

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
        contractType = 'stake',
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

      // Buscar primeira empresa disponível
      console.log('🔍 Buscando empresa disponível...');
      const firstCompany = await global.prisma.company.findFirst();
      if (!firstCompany) {
        throw new Error('Nenhuma empresa encontrada no sistema');
      }
      console.log('✅ Company encontrada:', firstCompany.id, firstCompany.name);

      // Buscar contract type dinamicamente
      console.log('🔍 Buscando contract type para:', contractType);
      const contractTypeRecord = await getContractTypeByName(contractType);
      if (!contractTypeRecord) {
        throw new Error(`Contract type '${contractType}' não encontrado no banco de dados`);
      }
      console.log('✅ Contract type encontrado:', contractTypeRecord.id, contractTypeRecord.name);

      // Criar stake no banco usando Prisma
      const stake = await prisma.smartContract.create({
        data: {
          companyId: firstCompany.id,
          contractTypeId: contractTypeRecord.id, // Usar ID dinâmico
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

      // Para claimReward e compound, obter valor pendente antes da transação
      let pendingRewardAmount = 0;
      if (functionName === 'claimReward' || functionName === 'compound') {
        try {
          console.log('🔍 [REWARD] Consultando valor de recompensa pendente...');
          const userAddress = params[0]; // Primeiro parâmetro é o endereço do usuário
          
          if (userAddress) {
            const pendingRewardResult = await this.readStakeContract(stakeAddress, 'getPendingReward', [userAddress]);
            if (pendingRewardResult.success && pendingRewardResult.data.result) {
              // Usar string para preservar precisão decimal até salvar no banco
              const rewardInWei = pendingRewardResult.data.result;
              const rewardFormatted = ethers.formatEther(rewardInWei);
              pendingRewardAmount = rewardFormatted; // Manter como string
              console.log(`💰 [REWARD] Valor pendente encontrado: ${pendingRewardAmount} tokens (wei: ${rewardInWei})`);
            }
          }
        } catch (rewardError) {
          console.warn('⚠️ [REWARD] Não foi possível obter valor pendente:', rewardError.message);
          // Continuar com valor 0 se não conseguir obter
        }
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
        stakeContract: stake,
        pendingRewardAmount: pendingRewardAmount // Incluir o valor de recompensa consultado
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

      // distributeReward não é transação financeira, deve ir para user_actions
      if (txData.functionName === 'distributeReward') {
        return await this._handleDistributeRewardAction(txData, jwtUser, userAddress, prisma);
      }

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
          
          // Valores - lógica específica por função
          amount: this._calculateTransactionAmount(txData),
          net_amount: this._calculateTransactionAmount(txData),
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
          
          // Obter o valor da recompensa - usar o valor consultado antes da transação
          let rewardAmount = 0;
          
          // Prioridade 1: Usar o valor consultado antes da transação
          if (txData.pendingRewardAmount && parseFloat(txData.pendingRewardAmount) > 0) {
            rewardAmount = txData.pendingRewardAmount; // Preservar como string
            console.log(`💰 [EARNINGS] Usando valor consultado: ${rewardAmount} tokens`);
          } 
          // Prioridade 2: Tentar extrair dos logs se não temos valor consultado
          else if (txData.receipt && txData.receipt.logs && txData.receipt.logs.length > 0) {
            try {
              console.log('🔍 [EARNINGS] Tentando extrair valor de recompensa dos logs...');
              
              // Buscar por eventos que contenham valores de transfer ou reward
              for (const log of txData.receipt.logs) {
                if (log.data && log.data !== '0x') {
                  try {
                    // Parse simples - pegar o último tópico que geralmente é o valor
                    const topics = log.topics || [];
                    const data = log.data;
                    
                    // Se há data, tentar converter para número
                    if (data && data.length > 10) { // Ignorar dados muito pequenos
                      const hexValue = data;
                      const bigIntValue = BigInt(hexValue);
                      const ethValue = ethers.formatEther(bigIntValue.toString()); // Preservar precisão
                      
                      if (parseFloat(ethValue) > 0 && parseFloat(ethValue) < 1000000) { // Valor razoável
                        rewardAmount = ethValue; // Manter como string
                        console.log(`💰 [EARNINGS] Valor encontrado nos logs: ${ethValue} tokens`);
                        break;
                      }
                    }
                  } catch (logError) {
                    // Continuar tentando outros logs
                  }
                }
              }
              
            } catch (e) {
              console.warn('⚠️ [EARNINGS] Não foi possível extrair valor de recompensa dos logs:', e.message);
            }
          }
          
          // Prioridade 3: Se não conseguir obter o valor, não registrar earning
          if (!rewardAmount || parseFloat(rewardAmount) === 0) {
            console.log('⚠️ [EARNINGS] Valor de recompensa não determinado, não registrando earning');
            // Não registra earning com valor 0 - melhor não registrar
          } else {
          
          // Obter preço e nome da moeda
          const tokenSymbol = currency || 'REWARD';
          const tokenPrice = getTokenPrice(tokenSymbol);
          const tokenName = getTokenName(tokenSymbol);
          
          console.log(`💰 [EARNINGS] Token: ${tokenSymbol} (${tokenName}), Price: R$ ${tokenPrice}, Amount: ${rewardAmount}`);
          
          // Criar registro de earning
          const earningData = {
            userId: userRecord?.id || null,
            tokenSymbol: tokenSymbol,
            tokenName: tokenName, // Nome completo da moeda
            amount: rewardAmount, // Passar como string/Decimal para preservar precisão
            quote: tokenPrice, // Preço unitário da moeda em BRL
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
          } // Fechar o else da verificação de rewardAmount > 0
          
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

  /**
   * Calcula o amount correto para a transação baseado na função
   */
  _calculateTransactionAmount(txData) {
    try {
      // Para claimReward e compound, usar o valor consultado antes da transação
      if (txData.functionName === 'claimReward' || txData.functionName === 'compound') {
        // Prioridade 1: Usar o valor consultado antes da transação (preservar como string)
        if (txData.pendingRewardAmount && parseFloat(txData.pendingRewardAmount) > 0) {
          console.log(`💰 Amount usando valor consultado: ${txData.pendingRewardAmount} tokens`);
          return txData.pendingRewardAmount; // Retornar como string para preservar precisão
        }

        // Prioridade 2: Extrair dos logs da transação
        if (txData.receipt && txData.receipt.logs && txData.receipt.logs.length > 0) {
          // Buscar por eventos que contenham valores de transfer ou reward
          for (const log of txData.receipt.logs) {
            if (log.data && log.data !== '0x') {
              try {
                // Se há data, tentar converter para número
                if (log.data && log.data.length > 10) { // Ignorar dados muito pequenos
                  const hexValue = log.data;
                  const bigIntValue = BigInt(hexValue);
                  const ethValue = ethers.formatEther(bigIntValue.toString()); // Use ethers.formatEther para preservar precisão
                  
                  if (parseFloat(ethValue) > 0 && parseFloat(ethValue) < 1000000) { // Valor razoável
                    console.log(`💰 Amount calculado dos logs: ${ethValue} tokens`);
                    return ethValue; // Retornar como string
                  }
                }
              } catch (logError) {
                // Continuar tentando outros logs
              }
            }
          }
        }
        
        // Prioridade 3: Fallback valor zero (preferível ao valor fixo)
        console.log('⚠️ Não foi possível determinar amount para claimReward/compound, usando 0');
        return 0;
      }
      
      // Para outras funções (stake, unstake, depositRewards), usar o parâmetro correto
      if (txData.functionName === 'stake') {
        // Para stake: params são [userAddress, amount, customTimestamp] - amount está no índice 1
        return txData.originalParams[1] ? parseFloat(txData.originalParams[1].toString()) : 0;
      } else if (txData.functionName === 'unstake') {
        // Para unstake: params são [userAddress, amount] - amount está no índice 1  
        return txData.originalParams[1] ? parseFloat(txData.originalParams[1].toString()) : 0;
      } else if (txData.functionName === 'depositRewards') {
        // Para depositRewards: params são [amount] - amount está no índice 0
        return txData.originalParams[0] ? parseFloat(txData.originalParams[0].toString()) : 0;
      } else {
        // Para outras funções, usar o primeiro parâmetro como fallback
        return txData.originalParams[0] ? parseFloat(txData.originalParams[0].toString()) : 0;
      }
      
    } catch (error) {
      console.error('❌ Erro ao calcular amount da transação:', error);
      return 0;
    }
  }

  /**
   * Registra distributeReward como user_action (não transação financeira)
   */
  async _handleDistributeRewardAction(txData, jwtUser, userAddress, prisma) {
    try {
      console.log('📊 Registrando distributeReward em user_actions...');
      
      // Importar o userActionsService
      const userActionsService = require('./userActions.service');
      
      // Criar registro em user_actions
      const userActionData = {
        action: 'distributeReward',
        category: 'contractInteraction',
        status: 'success',
        details: {
          contractAddress: txData.contractAddress,
          functionName: txData.functionName,
          percentageInBasisPoints: txData.originalParams[0]?.toString(),
          network: txData.network,
          blockNumber: txData.receipt?.blockNumber,
          gasUsed: txData.gasUsed
        },
        metadata: {
          transactionHash: txData.transactionHash,
          contractInfo: {
            name: txData.stakeContract?.name,
            address: txData.stakeContract?.address,
            metadata: txData.stakeContract?.metadata
          },
          executedBy: {
            jwtUserId: jwtUser?.id,
            jwtUserEmail: jwtUser?.email,
            signerAddress: txData.signer
          },
          distributionData: {
            percentage: `${(parseInt(txData.originalParams[0] || 0) / 100).toFixed(2)}%`,
            basisPoints: txData.originalParams[0]?.toString(),
            executedAt: new Date().toISOString()
          }
        }
      };
      
      // Usar a mesma estrutura do login - usar logAuth mas mudar categoria
      console.log('🔍 [DEBUG] Tentando salvar distributeReward usando logAuth pattern');
      
      // Criar um objeto simulando uma request
      const fakeReq = {
        company: { id: jwtUser?.companyId || '2195b754-83d9-44d1-b5cd-f912ca70636c' },
        headers: { 'user-agent': 'Sistema Interno' },
        ip: '127.0.0.1'
      };
      
      await userActionsService.logAuth(
        jwtUser?.id || '5e8fd1b6-9969-44a8-bcb5-0dd832b1d973',
        'distributeReward',
        fakeReq,
        {
          status: 'success',
          companyId: jwtUser?.companyId || '2195b754-83d9-44d1-b5cd-f912ca70636c',
          details: userActionData.details,
          metadata: userActionData.metadata
        }
      );
      
      console.log('✅ distributeReward registrado em user_actions');
      
      return {
        success: true,
        message: 'distributeReward registrado em user_actions',
        transactionHash: txData.transactionHash
      };
      
    } catch (error) {
      console.error('❌ Erro ao registrar distributeReward em user_actions:', error);
      throw error;
    }
  }
}

module.exports = new StakeService();