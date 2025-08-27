require('dotenv').config();

async function testBlockchainService() {
  try {
    console.log('🧪 Testando o BlockchainService...');
    
    const blockchainService = require('../src/services/blockchain.service');
    const address = '0x5528C065931f523CA9F3a6e49a911896fb1D2e6f';
    const network = 'testnet';
    
    console.log(`📍 Address: ${address}`);
    console.log(`🌐 Network: ${network}`);
    
    // Debug - verificar configuração interna
    console.log('\n🔧 Verificando configuração interna...');
    console.log('Config networks:', blockchainService.config?.networks);
    console.log('Default network:', blockchainService.config?.defaultNetwork);
    
    // 1. Testar saldo nativo
    console.log('\n1. 💰 Testando saldo nativo...');
    const azeBalance = await blockchainService.getBalance(address, network);
    console.log(`✅ Saldo AZE: ${azeBalance.balanceEth} AZE`);
    console.log(`   Wei: ${azeBalance.balanceWei}`);
    
    // 2. Testar saldo de token
    console.log('\n2. 🪙 Testando saldo cBRL...');
    const { loadLocalABI } = require('../src/contracts');
    const tokenABI = await loadLocalABI('default_token_abi');
    const tokenAddress = '0x0A8c73967e4Eee8ffA06484C3fBf65E6Ae3b9804';
    
    const tokenBalance = await blockchainService.getTokenBalance(
      address,
      tokenAddress,
      tokenABI,
      network
    );
    
    console.log(`✅ Saldo Token: ${tokenBalance.balanceEth} ${tokenBalance.tokenSymbol}`);
    console.log(`   Token Name: ${tokenBalance.tokenName}`);
    console.log(`   Wei: ${tokenBalance.balanceWei}`);
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    console.error('Stack:', error.stack);
  }
}

testBlockchainService();