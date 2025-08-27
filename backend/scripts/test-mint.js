#!/usr/bin/env node

/**
 * Script de teste para mint de tokens cBRL
 * Testa a funcionalidade de mint diretamente na blockchain
 */

const path = require('path');
const { ethers } = require('ethers');

// Carregar configurações da testnet
require('dotenv').config({ path: path.join(__dirname, '..', '.env.testnet') });

// Importar serviços necessários
const blockchainService = require('../src/services/blockchain.service');
const { loadLocalABI } = require('../src/contracts');

// Configurações
const CONFIG = {
  // Endereço do contrato cBRL na testnet
  TOKEN_CONTRACT_ADDRESS: process.env.CBRL_CONTRACT_ADDRESS || '0x0A8c73967e4Eee8ffA06484C3fBf65E6Ae3b9804',
  
  // Endereço de teste para receber os tokens (Ivan Alberton)
  TEST_RECIPIENT_ADDRESS: process.env.TEST_WALLET_ADDRESS || '0x5528C065931f523CA9F3a6e49a911896fb1D2e6f',
  
  // Quantidade para mintar (100 cBRL)
  MINT_AMOUNT: '100',
  
  // Rede
  NETWORK: 'testnet',
  
  // Private key do admin (deve ter role MINTER_ROLE)
  ADMIN_PRIVATE_KEY: process.env.ADMIN_WALLET_PRIVATE_KEY,
  
  // Endereço do admin (mesmo que vai receber neste caso)
  ADMIN_ADDRESS: '0x5528C065931f523CA9F3a6e49a911896fb1D2e6f'
};

/**
 * Função principal de teste
 */
async function testMint() {
  console.log('🚀 Iniciando teste de mint de tokens cBRL');
  console.log('================================================\n');

  try {
    // Mostrar configurações
    console.log('📋 Configurações:');
    console.log(`   Contrato cBRL: ${CONFIG.TOKEN_CONTRACT_ADDRESS}`);
    console.log(`   Destinatário: ${CONFIG.TEST_RECIPIENT_ADDRESS}`);
    console.log(`   Admin/Pagador: ${CONFIG.ADMIN_ADDRESS}`);
    console.log(`   Quantidade: ${CONFIG.MINT_AMOUNT} cBRL`);
    console.log(`   Rede: ${CONFIG.NETWORK}\n`);
    
    // Validar configurações
    if (!CONFIG.ADMIN_PRIVATE_KEY) {
      throw new Error('❌ Por favor, configure o ADMIN_WALLET_PRIVATE_KEY no .env.testnet');
    }

    // Carregar ABI do token
    console.log('📄 Carregando ABI do contrato...');
    const tokenABI = loadLocalABI('default_token_abi');
    console.log('✅ ABI carregado com sucesso\n');

    // Obter informações da rede
    console.log('🌐 Conectando à rede...');
    const networkInfo = await blockchainService.getNetwork(CONFIG.NETWORK);
    console.log(`✅ Conectado à rede: ${networkInfo.name} (Chain ID: ${networkInfo.chainId})\n`);

    // Verificar saldo inicial do destinatário
    console.log('💰 Verificando saldo inicial...');
    const initialBalance = await blockchainService.getTokenBalance(
      CONFIG.TEST_RECIPIENT_ADDRESS,
      CONFIG.TOKEN_CONTRACT_ADDRESS,
      tokenABI,
      CONFIG.NETWORK
    );
    console.log(`📊 Saldo inicial: ${initialBalance.balanceEth} ${initialBalance.tokenSymbol}\n`);

    // Preparar parâmetros para mint
    const amountInWei = ethers.parseUnits(CONFIG.MINT_AMOUNT, 18); // cBRL tem 18 decimais
    
    console.log('🏭 Executando mint...');
    console.log(`📍 Contrato: ${CONFIG.TOKEN_CONTRACT_ADDRESS}`);
    console.log(`👤 Destinatário: ${CONFIG.TEST_RECIPIENT_ADDRESS}`);
    console.log(`💵 Quantidade: ${CONFIG.MINT_AMOUNT} cBRL`);
    console.log(`⚙️  Quantidade em Wei: ${amountInWei.toString()}\n`);

    // Executar mint
    const result = await blockchainService.executeContractFunction(
      CONFIG.TOKEN_CONTRACT_ADDRESS,
      tokenABI,
      'mint',
      [CONFIG.TEST_RECIPIENT_ADDRESS, amountInWei],
      CONFIG.NETWORK,
      {
        privateKey: CONFIG.ADMIN_PRIVATE_KEY,
        gasLimit: 200000 // Limite de gas para mint
      }
    );

    console.log('✅ Mint executado com sucesso!');
    console.log(`📝 Hash da transação: ${result.transactionHash}`);
    console.log(`📦 Bloco: ${result.blockNumber}`);
    console.log(`⛽ Gas usado: ${result.gasUsed}`);
    console.log(`🔗 Ver no explorer: https://floripa.azorescan.com/tx/${result.transactionHash}\n`);

    // Aguardar um pouco para a blockchain processar
    console.log('⏳ Aguardando confirmação na blockchain...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Verificar saldo final
    console.log('💰 Verificando saldo final...');
    const finalBalance = await blockchainService.getTokenBalance(
      CONFIG.TEST_RECIPIENT_ADDRESS,
      CONFIG.TOKEN_CONTRACT_ADDRESS,
      tokenABI,
      CONFIG.NETWORK
    );
    console.log(`📊 Saldo final: ${finalBalance.balanceEth} ${finalBalance.tokenSymbol}`);
    
    const difference = parseFloat(finalBalance.balanceEth) - parseFloat(initialBalance.balanceEth);
    console.log(`📈 Diferença: +${difference.toFixed(2)} ${finalBalance.tokenSymbol}\n`);

    console.log('🎉 Teste concluído com sucesso!');
    
    // Retornar dados para uso em outros scripts
    return {
      success: true,
      transactionHash: result.transactionHash,
      blockNumber: result.blockNumber,
      amountMinted: CONFIG.MINT_AMOUNT,
      recipient: CONFIG.TEST_RECIPIENT_ADDRESS,
      contractAddress: CONFIG.TOKEN_CONTRACT_ADDRESS
    };

  } catch (error) {
    console.error('\n❌ Erro durante o teste de mint:');
    console.error(error.message);
    
    if (error.message.includes('MINTER_ROLE')) {
      console.error('\n💡 Dica: Certifique-se de que o endereço admin tem a role MINTER_ROLE no contrato');
    }
    
    if (error.message.includes('insufficient funds')) {
      console.error('\n💡 Dica: Certifique-se de que o endereço admin tem AZE suficiente para pagar o gas');
    }
    
    return {
      success: false,
      error: error.message
    };
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  testMint()
    .then(result => {
      if (result.success) {
        console.log('\n✅ Script finalizado com sucesso');
        process.exit(0);
      } else {
        console.log('\n❌ Script finalizado com erros');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n❌ Erro não tratado:', error);
      process.exit(1);
    });
}

module.exports = { testMint };