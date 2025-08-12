/**
 * Serviço para integração com a API do AzoreScan
 * Permite consultar balances e tokens diretamente da blockchain
 */

const axios = require('axios');

class AzoreScanService {
  constructor() {
    this.baseUrls = {
      testnet: 'https://floripa.azorescan.com/api',
      mainnet: 'https://azorescan.com/api'
    };
  }

  /**
   * Obter URL base para a rede especificada
   */
  getBaseUrl(network = 'testnet') {
    return this.baseUrls[network] || this.baseUrls.testnet;
  }

  /**
   * Fazer requisição para a API do AzoreScan
   */
  async makeRequest(params, network = 'testnet') {
    try {
      const baseUrl = this.getBaseUrl(network);
      console.log(`🌐 Fazendo requisição para AzoreScan ${network}: ${baseUrl}`);
      
      const response = await axios.get(baseUrl, {
        params,
        timeout: 10000
      });

      if (response.data.status === '1' && response.data.message === 'OK') {
        return {
          success: true,
          data: response.data.result
        };
      } else {
        console.warn(`⚠️ AzoreScan retornou erro: ${response.data.message}`);
        return {
          success: false,
          error: response.data.message || 'Erro desconhecido'
        };
      }
    } catch (error) {
      console.error(`❌ Erro ao consultar AzoreScan ${network}:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Obter balance nativo (AZE) de um endereço
   */
  async getBalance(address, network = 'testnet') {
    const tokenSymbol = network === 'testnet' ? 'AZE-t' : 'AZE';
    console.log(`💰 Consultando balance ${tokenSymbol} para ${address} na ${network}`);
    
    const params = {
      module: 'account',
      action: 'balance',
      address: address
    };

    const response = await this.makeRequest(params, network);
    
    if (response.success) {
      const balanceWei = response.data;
      const balanceEth = (parseFloat(balanceWei) / Math.pow(10, 18)).toString();
      
      console.log(`✅ Balance ${tokenSymbol} obtido: ${balanceEth} ${tokenSymbol}`);
      
      return {
        success: true,
        data: {
          balanceWei,
          balanceEth,
          address,
          network
        }
      };
    }

    return response;
  }

  /**
   * Obter lista de tokens que um endereço possui
   */
  async getTokenList(address, network = 'testnet') {
    console.log(`🪙 Consultando lista de tokens para ${address} na ${network}`);
    
    const params = {
      module: 'account',
      action: 'tokenlist',
      address: address
    };

    const response = await this.makeRequest(params, network);
    
    if (response.success) {
      console.log(`✅ Lista de tokens obtida: ${response.data.length} tokens encontrados`);
      return response;
    }

    console.warn(`⚠️ Erro ao obter lista de tokens: ${response.error}`);
    return response;
  }

  /**
   * Obter balance de um token específico
   */
  async getTokenBalance(contractAddress, address, network = 'testnet') {
    console.log(`🔍 Consultando balance do token ${contractAddress} para ${address}`);
    
    const params = {
      module: 'account',
      action: 'tokenbalance',
      contractaddress: contractAddress,
      address: address
    };

    const response = await this.makeRequest(params, network);
    
    if (response.success) {
      console.log(`✅ Balance do token obtido: ${response.data}`);
      return response;
    }

    console.warn(`⚠️ Erro ao obter balance do token: ${response.error}`);
    return response;
  }

  /**
   * Obter informações completas de balances de um endereço
   * Inclui balance nativo e todos os tokens ERC-20
   * VERSÃO SIMPLIFICADA: apenas 2 chamadas à API
   */
  async getCompleteBalances(address, network = 'testnet') {
    try {
      console.log(`🔄 Iniciando consulta completa de balances para ${address} na ${network}`);
      
      // 1. Obter balance nativo (AZE)
      const azeBalanceResponse = await this.getBalance(address, network);
      
      let azeBalance = {
        balanceWei: '0',
        balanceEth: '0.0'
      };
      
      if (azeBalanceResponse.success) {
        azeBalance = azeBalanceResponse.data;
      } else {
        console.warn(`⚠️ Erro ao obter balance AZE: ${azeBalanceResponse.error}`);
      }

      // 2. Obter TODOS os tokens em uma única chamada (tokenlist já retorna balances!)
      const tokenListResponse = await this.getTokenList(address, network);
      
      let tokenBalances = [];
      // Usar símbolo correto baseado na rede: AZE-t para testnet, AZE para mainnet
      const nativeSymbol = network === 'testnet' ? 'AZE-t' : 'AZE';
      let balancesTable = { [nativeSymbol]: azeBalance.balanceEth };
      
      if (tokenListResponse.success && tokenListResponse.data.length > 0) {
        console.log(`🪙 Processando ${tokenListResponse.data.length} tokens da lista completa`);
        
        // 3. Processar tokens (já vêm com balance na resposta!)
        tokenBalances = tokenListResponse.data.map((token) => {
          try {
            const balanceWei = token.balance || '0';
            const decimals = parseInt(token.decimals) || 18;
            const balanceEth = (parseFloat(balanceWei) / Math.pow(10, decimals)).toString();
            
            console.log(`✅ ${token.symbol}: ${balanceEth} (balance já incluído na resposta)`);
            
            // Adicionar à tabela de balances
            balancesTable[token.symbol] = balanceEth;
            
            return {
              contractAddress: token.contractAddress,
              tokenName: token.name,
              tokenSymbol: token.symbol,
              tokenDecimals: decimals,
              balanceWei,
              balanceEth,
              userAddress: address,
              network
            };
          } catch (error) {
            console.error(`❌ Erro ao processar token ${token.symbol}:`, error.message);
            return null;
          }
        }).filter(token => token !== null);
        
      } else {
        console.log(`ℹ️ Nenhum token ERC-20 encontrado para ${address}`);
      }

      const result = {
        address,
        network,
        azeBalance,
        tokenBalances,
        balancesTable,
        totalTokens: tokenBalances.length + 1, // +1 for native token (AZE/AZE-t)
        timestamp: new Date().toISOString(),
        fromCache: false
      };

      console.log(`✅ Consulta simplificada finalizada: ${result.totalTokens} tokens (${tokenBalances.length} ERC-20 + 1 ${nativeSymbol})`);
      
      return {
        success: true,
        data: result
      };

    } catch (error) {
      console.error(`❌ Erro na consulta completa de balances:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new AzoreScanService();
