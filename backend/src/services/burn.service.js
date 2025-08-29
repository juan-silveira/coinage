const { ethers } = require('ethers');
const blockchainService = require('./blockchain.service');
const { loadLocalABI } = require('../contracts');

class BurnService {
  constructor() {
    // Configurações do contrato cBRL (mesmas do mint)
    this.CONFIG = {
      // Endereço do contrato cBRL (mesmo para mainnet e testnet por enquanto)
      TOKEN_CONTRACT_ADDRESS: process.env.CBRL_CONTRACT_ADDRESS || '0x0A8c73967e4Eee8ffA06484C3fBf65E6Ae3b9804',
      
      // Endereço do admin que paga o gas (sempre o mesmo)
      ADMIN_ADDRESS: '0x5528C065931f523CA9F3a6e49a911896fb1D2e6f',
      
      // Private key do admin (Ivan) - deve estar no .env
      ADMIN_PRIVATE_KEY: process.env.ADMIN_WALLET_PRIVATE_KEY,
      
      // Decimais do cBRL
      TOKEN_DECIMALS: 18
    };
    
    // Cache da ABI
    this.tokenABI = null;
  }

  /**
   * Inicializa o serviço carregando a ABI
   */
  async initialize() {
    try {
      if (!this.tokenABI) {
        this.tokenABI = loadLocalABI('default_token_abi');
        console.log('✅ [BurnService] ABI do token carregada com sucesso');
      }
    } catch (error) {
      console.error('❌ [BurnService] Erro ao carregar ABI:', error);
      throw error;
    }
  }

  /**
   * Executa burnFrom de cBRL de um usuário
   * @param {string} fromAddress - Endereço de onde os tokens serão queimados
   * @param {string} amount - Quantidade em cBRL (ex: "100")
   * @param {string} network - Rede (mainnet ou testnet)
   * @param {string} withdrawId - ID do saque para rastreamento
   */
  async burnFromCBRL(fromAddress, amount, network = 'testnet', withdrawId = null) {
    try {
      await this.initialize();
      
      console.log(`🔥 [BurnService] Iniciando burnFrom de ${amount} cBRL`, {
        from: fromAddress,
        network,
        withdrawId
      });

      // Validar configurações
      if (!this.CONFIG.ADMIN_PRIVATE_KEY) {
        throw new Error('Private key do admin não configurada');
      }

      // Verificar saldo inicial do usuário
      const initialBalance = await blockchainService.getTokenBalance(
        fromAddress,
        this.CONFIG.TOKEN_CONTRACT_ADDRESS,
        this.tokenABI,
        network
      );
      
      console.log(`💰 [BurnService] Saldo inicial do usuário: ${initialBalance.balanceEth} ${initialBalance.tokenSymbol}`);

      // Verificar se o usuário tem saldo suficiente
      const amountFloat = parseFloat(amount);
      const balanceFloat = parseFloat(initialBalance.balanceEth);
      
      if (balanceFloat < amountFloat) {
        throw new Error(`Saldo insuficiente. Disponível: ${initialBalance.balanceEth} ${initialBalance.tokenSymbol}, Solicitado: ${amount}`);
      }

      // Converter quantidade para Wei
      const amountInWei = ethers.parseUnits(amount, this.CONFIG.TOKEN_DECIMALS);
      
      console.log(`🔧 [BurnService] Executando burnFrom...`, {
        contract: this.CONFIG.TOKEN_CONTRACT_ADDRESS,
        from: fromAddress,
        amount: amount,
        amountInWei: amountInWei.toString()
      });

      // Executar burnFrom - O admin queima tokens da conta do usuário
      // IMPORTANTE: burnFrom requer que o admin tenha allowance do usuário
      // ou que o admin tenha BURNER_ROLE no contrato
      const result = await blockchainService.executeContractFunction(
        this.CONFIG.TOKEN_CONTRACT_ADDRESS,
        this.tokenABI,
        'burnFrom',
        [fromAddress, amountInWei],
        network,
        {
          privateKey: this.CONFIG.ADMIN_PRIVATE_KEY,
          gasLimit: 200000 // Limite de gas para burnFrom
        }
      );

      console.log(`✅ [BurnService] BurnFrom executado com sucesso!`, {
        transactionHash: result.transactionHash,
        blockNumber: result.blockNumber,
        gasUsed: result.gasUsed
      });

      // Aguardar confirmação
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Verificar saldo final
      const finalBalance = await blockchainService.getTokenBalance(
        fromAddress,
        this.CONFIG.TOKEN_CONTRACT_ADDRESS,
        this.tokenABI,
        network
      );
      
      const difference = parseFloat(initialBalance.balanceEth) - parseFloat(finalBalance.balanceEth);
      
      console.log(`📊 [BurnService] Saldo final: ${finalBalance.balanceEth} ${finalBalance.tokenSymbol} (-${difference.toFixed(2)})`);

      return {
        success: true,
        transactionHash: result.transactionHash,
        blockNumber: result.blockNumber,
        gasUsed: result.gasUsed,
        amountBurned: amount,
        fromAddress: fromAddress,
        initialBalance: initialBalance.balanceEth,
        finalBalance: finalBalance.balanceEth,
        difference: difference.toFixed(2),
        tokenSymbol: finalBalance.tokenSymbol,
        explorerUrl: `https://floripa.azorescan.com/tx/${result.transactionHash}`,
        withdrawId
      };

    } catch (error) {
      console.error('❌ [BurnService] Erro durante o burnFrom:', error);
      
      // Dicas de erro específicas para burnFrom
      if (error.message.includes('BURNER_ROLE')) {
        console.error('💡 Admin não tem permissão BURNER_ROLE no contrato');
      }
      
      if (error.message.includes('insufficient allowance')) {
        console.error('💡 Admin não tem allowance suficiente para queimar tokens do usuário');
      }
      
      if (error.message.includes('insufficient funds')) {
        console.error('💡 Admin não tem AZE suficiente para pagar o gas');
      }
      
      throw {
        success: false,
        error: error.message,
        withdrawId
      };
    }
  }

  /**
   * Processa burn para um saque confirmado
   */
  async processWithdrawBurn(withdraw) {
    try {
      const { userId, amount, publicKey, id } = withdraw;
      
      console.log(`🎯 [BurnService] Processando burn para saque #${id}`, {
        userId,
        amount,
        publicKey
      });

      // Determinar a rede (usar testnet por padrão)
      const network = process.env.DEFAULT_NETWORK || 'testnet';
      
      // Executar burnFrom
      const burnResult = await this.burnFromCBRL(
        publicKey,
        amount.toString(),
        network,
        id
      );

      console.log(`🎉 [BurnService] Burn concluído para saque #${id}`, burnResult);
      
      return burnResult;
      
    } catch (error) {
      console.error(`❌ [BurnService] Erro ao processar burn do saque #${withdraw.id}:`, error);
      throw error;
    }
  }
}

module.exports = new BurnService();