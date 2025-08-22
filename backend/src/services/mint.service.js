const { ethers } = require('ethers');
const blockchainService = require('./blockchain.service');
const { loadLocalABI } = require('../contracts');

class MintService {
  constructor() {
    // Configurações do contrato cBRL
    this.CONFIG = {
      // Endereço do contrato cBRL (mesmo para mainnet e testnet por enquanto)
      TOKEN_CONTRACT_ADDRESS: process.env.CBRL_CONTRACT_ADDRESS || '0x0A8c73967e4Eee8ffA06484C3fBf65E6Ae3b9804',
      
      // Endereço do Ivan que paga o gas (sempre o mesmo)
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
        console.log('✅ [MintService] ABI do token carregada com sucesso');
      }
    } catch (error) {
      console.error('❌ [MintService] Erro ao carregar ABI:', error);
      throw error;
    }
  }

  /**
   * Executa mint de cBRL para um usuário
   * @param {string} recipientAddress - Endereço que receberá os tokens
   * @param {string} amount - Quantidade em cBRL (ex: "100")
   * @param {string} network - Rede (mainnet ou testnet)
   * @param {string} depositId - ID do depósito para rastreamento
   */
  async mintCBRL(recipientAddress, amount, network = 'testnet', depositId = null) {
    try {
      await this.initialize();
      
      console.log(`🏭 [MintService] Iniciando mint de ${amount} cBRL`, {
        recipient: recipientAddress,
        network,
        depositId
      });

      // Validar configurações
      if (!this.CONFIG.ADMIN_PRIVATE_KEY) {
        throw new Error('Private key do admin não configurada');
      }

      // Verificar saldo inicial
      const initialBalance = await blockchainService.getTokenBalance(
        recipientAddress,
        this.CONFIG.TOKEN_CONTRACT_ADDRESS,
        this.tokenABI,
        network
      );
      
      console.log(`💰 [MintService] Saldo inicial: ${initialBalance.balanceEth} ${initialBalance.tokenSymbol}`);

      // Converter quantidade para Wei
      const amountInWei = ethers.parseUnits(amount, this.CONFIG.TOKEN_DECIMALS);
      
      console.log(`🔧 [MintService] Executando mint...`, {
        contract: this.CONFIG.TOKEN_CONTRACT_ADDRESS,
        recipient: recipientAddress,
        amount: amount,
        amountInWei: amountInWei.toString()
      });

      // Executar mint
      const result = await blockchainService.executeContractFunction(
        this.CONFIG.TOKEN_CONTRACT_ADDRESS,
        this.tokenABI,
        'mint',
        [recipientAddress, amountInWei],
        network,
        {
          privateKey: this.CONFIG.ADMIN_PRIVATE_KEY,
          gasLimit: 200000 // Limite de gas para mint
        }
      );

      console.log(`✅ [MintService] Mint executado com sucesso!`, {
        transactionHash: result.transactionHash,
        blockNumber: result.blockNumber,
        gasUsed: result.gasUsed
      });

      // Aguardar confirmação
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Verificar saldo final
      const finalBalance = await blockchainService.getTokenBalance(
        recipientAddress,
        this.CONFIG.TOKEN_CONTRACT_ADDRESS,
        this.tokenABI,
        network
      );
      
      const difference = parseFloat(finalBalance.balanceEth) - parseFloat(initialBalance.balanceEth);
      
      console.log(`📊 [MintService] Saldo final: ${finalBalance.balanceEth} ${finalBalance.tokenSymbol} (+${difference.toFixed(2)})`);

      return {
        success: true,
        transactionHash: result.transactionHash,
        blockNumber: result.blockNumber,
        gasUsed: result.gasUsed,
        amountMinted: amount,
        recipient: recipientAddress,
        initialBalance: initialBalance.balanceEth,
        finalBalance: finalBalance.balanceEth,
        difference: difference.toFixed(2),
        tokenSymbol: finalBalance.tokenSymbol,
        explorerUrl: `https://floripa.azorescan.com/tx/${result.transactionHash}`,
        depositId
      };

    } catch (error) {
      console.error('❌ [MintService] Erro durante o mint:', error);
      
      // Dicas de erro
      if (error.message.includes('MINTER_ROLE')) {
        console.error('💡 Admin não tem permissão MINTER_ROLE no contrato');
      }
      
      if (error.message.includes('insufficient funds')) {
        console.error('💡 Admin não tem AZE suficiente para pagar o gas');
      }
      
      throw {
        success: false,
        error: error.message,
        depositId
      };
    }
  }

  /**
   * Processa mint para um depósito confirmado
   */
  async processDepositMint(deposit) {
    try {
      const { userId, amount, publicKey, id } = deposit;
      
      console.log(`🎯 [MintService] Processando mint para depósito #${id}`, {
        userId,
        amount,
        publicKey
      });

      // Determinar a rede (usar testnet por padrão)
      const network = process.env.DEFAULT_NETWORK || 'testnet';
      
      // Executar mint
      const mintResult = await this.mintCBRL(
        publicKey,
        amount.toString(),
        network,
        id
      );

      console.log(`🎉 [MintService] Mint concluído para depósito #${id}`, mintResult);
      
      return mintResult;
      
    } catch (error) {
      console.error(`❌ [MintService] Erro ao processar mint do depósito #${deposit.id}:`, error);
      throw error;
    }
  }
}

module.exports = new MintService();