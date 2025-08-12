const { ethers } = require('ethers');
const blockchainConfig = require('../config/blockchain');
const azorescanService = require('./azorescan.service');

// Import fetch para Node.js (disponível a partir do Node.js 18)
const fetch = globalThis.fetch || require('node-fetch');

class BlockchainService {
  constructor() {
    this.config = blockchainConfig;
  }

  /**
   * Testa a conexão com a blockchain
   * @param {string} network - Rede para testar
   * @returns {Promise<Object>} Resultado do teste
   */
  async testConnection(network) {
    return await this.config.testConnection(network);
  }

  /**
   * Obtém informações da rede atual
   * @returns {Object} Informações da rede
   */
  getNetworkInfo() {
    return this.config.getNetworkInfo();
  }

  /**
   * Obtém o saldo de um endereço
   * @param {string} address - Endereço para consultar
   * @param {string} network - Rede para consultar
   * @returns {Promise<Object>} Saldo formatado
   */
  async getBalance(address, network) {
    try {
      // Validar endereço
      if (!ethers.isAddress(address)) {
        throw new Error('Endereço inválido');
      }

      const balanceWei = await this.config.getBalance(address, network);
      const balanceEth = ethers.formatEther(balanceWei);

      return {
        address: address,
        balanceWei: balanceWei,
        balanceEth: balanceEth,
        network: network || this.config.defaultNetwork
      };
    } catch (error) {
      throw new Error(`Erro ao consultar saldo: ${error.message}`);
    }
  }

  /**
   * Obtém o saldo de um token ERC-20 para um endereço
   * @param {string} userAddress - Endereço do usuário
   * @param {string} tokenAddress - Endereço do contrato do token
   * @param {Array} tokenABI - ABI do token
   * @param {string} network - Rede para consultar
   * @returns {Promise<Object>} Saldo formatado do token
   */
  async getTokenBalance(userAddress, tokenAddress, tokenABI, network) {
    try {
      // Validar endereços
      if (!ethers.isAddress(userAddress)) {
        throw new Error('Endereço do usuário inválido');
      }
      if (!ethers.isAddress(tokenAddress)) {
        throw new Error('Endereço do contrato inválido');
      }

      const provider = this.config.getProvider(network);
      const contract = new ethers.Contract(tokenAddress, tokenABI, provider);
      
      // Obter informações do token
      const [balance, decimals, name, symbol] = await Promise.all([
        contract.balanceOf(userAddress),
        contract.decimals(),
        contract.name(),
        contract.symbol()
      ]);

      const balanceFormatted = ethers.formatUnits(balance, decimals);

      return {
        contractAddress: tokenAddress,
        tokenName: name,
        tokenSymbol: symbol,
        tokenDecimals: Number(decimals),
        balanceWei: balance.toString(),
        balanceEth: balanceFormatted,
        userAddress: userAddress,
        network: network || this.config.defaultNetwork
      };
    } catch (error) {
      throw new Error(`Erro ao consultar saldo do token: ${error.message}`);
    }
  }

  /**
   * Obtém informações de um bloco
   * @param {number|string} blockNumber - Número do bloco ou 'latest'
   * @param {string} network - Rede para consultar
   * @returns {Promise<Object>} Informações do bloco
   */
  async getBlock(blockNumber, network) {
    try {
      const block = await this.config.getBlock(blockNumber, network);
      return {
        ...block,
        network: network || this.config.defaultNetwork
      };
    } catch (error) {
      throw new Error(`Erro ao obter bloco: ${error.message}`);
    }
  }

  /**
   * Obtém informações de uma transação
   * @param {string} txHash - Hash da transação
   * @param {string} network - Rede para consultar
   * @returns {Promise<Object>} Informações da transação
   */
  async getTransaction(txHash, network) {
    try {
      const provider = this.config.getProvider(network);
      const tx = await provider.getTransaction(txHash);
      
      if (!tx) {
        throw new Error('Transação não encontrada');
      }

      const receipt = await provider.getTransactionReceipt(txHash);

      return {
        hash: tx.hash || '',
        from: tx.from || '',
        to: tx.to || '',
        value: tx.value ? tx.value.toString() : '0',
        valueEth: tx.value ? ethers.formatEther(tx.value) : '0',
        gasPrice: tx.gasPrice ? tx.gasPrice.toString() : '0',
        gasLimit: tx.gasLimit ? tx.gasLimit.toString() : '0',
        nonce: tx.nonce || 0,
        data: tx.data || '',
        blockNumber: tx.blockNumber || null,
        confirmations: tx.confirmations || 0,
        status: receipt ? (receipt.status === 1 ? 'success' : 'failed') : 'pending',
        gasUsed: receipt && receipt.gasUsed ? receipt.gasUsed.toString() : null,
        effectiveGasPrice: receipt && receipt.effectiveGasPrice ? receipt.effectiveGasPrice.toString() : null,
        network: network || this.config.defaultNetwork
      };
    } catch (error) {
      throw new Error(`Erro ao obter transação: ${error.message}`);
    }
  }

  /**
   * Obtém o preço atual do gás
   * @param {string} network - Rede para consultar
   * @returns {Promise<Object>} Preço do gás
   */
  async getGasPrice(network) {
    try {
      const provider = this.config.getProvider(network);
      const feeData = await provider.getFeeData();
      
      return {
        gasPriceWei: feeData.gasPrice ? feeData.gasPrice.toString() : '0',
        gasPriceGwei: feeData.gasPrice ? ethers.formatUnits(feeData.gasPrice, 'gwei') : '0',
        maxFeePerGas: feeData.maxFeePerGas ? feeData.maxFeePerGas.toString() : null,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ? feeData.maxPriorityFeePerGas.toString() : null,
        network: network || this.config.defaultNetwork
      };
    } catch (error) {
      throw new Error(`Erro ao obter preço do gás: ${error.message}`);
    }
  }

  /**
   * Obtém informações da rede
   * @param {string} network - Rede para consultar
   * @returns {Promise<Object>} Informações da rede
   */
  async getNetwork(network) {
    try {
      const provider = this.config.getProvider(network);
      const networkInfo = await provider.getNetwork();
      
      return {
        name: networkInfo.name,
        chainId: Number(networkInfo.chainId),
        network: network || this.config.defaultNetwork
      };
    } catch (error) {
      throw new Error(`Erro ao obter informações da rede: ${error.message}`);
    }
  }

  /**
   * Valida se um endereço é válido
   * @param {string} address - Endereço para validar
   * @returns {boolean} True se válido
   */
  isValidAddress(address) {
    return ethers.isAddress(address);
  }

  /**
   * Converte um valor de ETH para Wei
   * @param {string|number} ethValue - Valor em ETH
   * @returns {string} Valor em Wei
   */
  ethToWei(ethValue) {
    return ethers.parseEther(ethValue.toString()).toString();
  }

  /**
   * Converte um valor de Wei para ETH
   * @param {string|number} weiValue - Valor em Wei
   * @returns {string} Valor em ETH
   */
  weiToEth(weiValue) {
    return ethers.formatEther(weiValue.toString());
  }

  /**
   * Obtém informações detalhadas de uma transação usando a API do AzoreScan
   * @param {string} txHash - Hash da transação
   * @param {string} network - Rede para consultar
   * @returns {Promise<Object>} Informações detalhadas da transação
   */
  async getTransactionDetails(txHash, network = this.config.defaultNetwork) {
    try {
      const baseUrl = network === 'mainnet' 
        ? 'https://azorescan.com/api' 
        : 'https://floripa.azorescan.com/api';
      
      const response = await fetch(`${baseUrl}?module=transaction&action=gettxinfo&txhash=${txHash}`);
      const data = await response.json();

      if (data.status === '1' && data.result) {
        return {
          ...data.result,
          network: network
        };
      } else {
        throw new Error(data.message || 'Transação não encontrada');
      }
    } catch (error) {
      throw new Error(`Erro ao obter detalhes da transação: ${error.message}`);
    }
  }

  /**
   * Obtém informações detalhadas de um bloco usando a API do AzoreScan
   * @param {string} blockNumber - Número do bloco
   * @param {string} network - Rede para consultar
   * @returns {Promise<Object>} Informações detalhadas do bloco
   */
  async getBlockDetails(blockNumber, network = this.config.defaultNetwork) {
    try {
      const baseUrl = network === 'mainnet' 
        ? 'https://azorescan.com/api' 
        : 'https://floripa.azorescan.com/api';
      
      const response = await fetch(`${baseUrl}?module=block&action=getblocknobytime&timestamp=${Date.now() / 1000}&closest=before`);
      const data = await response.json();

      // Para obter informações específicas do bloco, usamos o provider ethers
      const provider = this.config.getProvider(network);
      const block = await provider.getBlock(blockNumber);
      
      if (!block) {
        throw new Error('Bloco não encontrado');
      }

      return {
        number: block.number,
        hash: block.hash,
        timestamp: block.timestamp,
        transactions: block.transactions.length,
        gasLimit: block.gasLimit.toString(),
        gasUsed: block.gasUsed.toString(),
        miner: block.miner,
        difficulty: block.difficulty?.toString(),
        totalDifficulty: block.totalDifficulty?.toString(),
        network: network
      };
    } catch (error) {
      throw new Error(`Erro ao obter detalhes do bloco: ${error.message}`);
    }
  }

  /**
   * Obtém o saldo de múltiplos endereços usando a API do AzoreScan
   * @param {string[]} addresses - Array de endereços
   * @param {string} network - Rede para consultar
   * @returns {Promise<Object>} Saldos dos endereços
   */
  async getMultipleBalances(addresses, network = this.config.defaultNetwork) {
    try {
      const baseUrl = network === 'mainnet' 
        ? 'https://azorescan.com/api' 
        : 'https://floripa.azorescan.com/api';
      
      const addressList = addresses.join(',');
      const response = await fetch(`${baseUrl}?module=account&action=balancemulti&address=${addressList}`);
      const data = await response.json();

      if (data.status === '1' && data.result) {
        return {
          balances: data.result,
          network: network
        };
      } else {
        throw new Error(data.message || 'Erro ao consultar saldos');
      }
    } catch (error) {
      throw new Error(`Erro ao obter saldos múltiplos: ${error.message}`);
    }
  }

  /**
   * Obtém saldos completos de um usuário (AZE + todos os tokens ERC-20)
   * Usa o Azorescan Service para buscar dados da blockchain
   * @param {string} publicKey - Endereço público do usuário
   * @param {string} network - Rede para consultar (testnet/mainnet)
   * @returns {Promise<Object>} Saldos completos formatados para o cache
   */
  async getUserBalances(publicKey, network = 'testnet') {
    try {
      console.log(`🔄 Obtendo saldos completos para ${publicKey} na ${network}`);
      
      // Usar o serviço Azorescan para obter todos os saldos
      const azorescanResponse = await azorescanService.getCompleteBalances(publicKey, network);
      
      if (!azorescanResponse.success) {
        console.warn(`⚠️ Erro no Azorescan: ${azorescanResponse.error}`);
        return {
          balances: {},
          tokenBalances: [],
          balancesTable: {},
          network,
          totalTokens: 0,
          error: azorescanResponse.error,
          address: publicKey,
          timestamp: new Date().toISOString()
        };
      }

      const azorescanData = azorescanResponse.data;
      
      // Formatar dados para o formato esperado pelo cache
      const result = {
        balances: azorescanData.balancesTable || {}, // Tabela de balances por símbolo
        tokenBalances: azorescanData.tokenBalances || [], // Array detalhado de tokens
        balancesTable: azorescanData.balancesTable || {}, // Mesma tabela (compatibilidade)
        network,
        totalTokens: azorescanData.totalTokens || 0,
        address: publicKey,
        azeBalance: azorescanData.azeBalance,
        timestamp: new Date().toISOString(),
        fromCache: false
      };

      console.log(`✅ Saldos obtidos: ${result.totalTokens} tokens`);
      console.log(`📊 Tokens disponíveis:`, Object.keys(result.balances));
      
      return result;
    } catch (error) {
      console.error(`❌ Erro ao obter saldos do usuário ${publicKey}:`, error.message);
      
      // Retornar estrutura vazia em caso de erro
      return {
        balances: {},
        tokenBalances: [],
        balancesTable: {},
        network,
        totalTokens: 0,
        error: error.message,
        address: publicKey,
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = new BlockchainService(); 