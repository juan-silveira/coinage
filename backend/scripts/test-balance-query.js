const blockchainService = require('../src/services/blockchain.service');

async function testBalanceQuery() {
  try {
    console.log('🧪 Testando consulta de saldos na blockchain...');
    
    // Endereço de teste (Ivan)
    const testAddress = '0x5528C065931f523CA9F3a6e49a911896fb1D2e6f';
    const network = 'testnet';
    
    console.log(`📍 Address: ${testAddress}`);
    console.log(`🌐 Network: ${network}`);
    
    // 1. Testar saldo de AZE (nativo)
    console.log('\n1. 📊 Testando saldo nativo (AZE)...');
    try {
      const azeBalance = await blockchainService.getBalance(testAddress, network);
      console.log(`✅ Saldo AZE: ${azeBalance.balanceEth} AZE`);
      console.log(`   Wei: ${azeBalance.balanceWei}`);
    } catch (azeError) {
      console.error(`❌ Erro AZE: ${azeError.message}`);
    }
    
    // 2. Testar saldo de cBRL (token ERC-20)
    console.log('\n2. 🪙 Testando saldo cBRL token...');
    try {
      const { loadLocalABI } = require('../src/contracts');
      const tokenABI = await loadLocalABI('default_token_abi');
      const cBRLAddress = '0x0A8c73967e4Eee8ffA06484C3fBf65E6Ae3b9804'; // cBRL testnet
      
      console.log(`   Token Address: ${cBRLAddress}`);
      
      const tokenBalance = await blockchainService.getTokenBalance(
        testAddress,
        cBRLAddress,
        tokenABI,
        network
      );
      
      console.log(`✅ Saldo cBRL: ${tokenBalance.balanceEth} ${tokenBalance.tokenSymbol}`);
      console.log(`   Token Name: ${tokenBalance.tokenName}`);
      console.log(`   Wei: ${tokenBalance.balanceWei}`);
      console.log(`   Decimals: ${tokenBalance.tokenDecimals}`);
      
    } catch (tokenError) {
      console.error(`❌ Erro cBRL: ${tokenError.message}`);
    }
    
    // 3. Testar conexão com a blockchain
    console.log('\n3. 🔗 Testando conexão blockchain...');
    try {
      const connectionTest = await blockchainService.testConnection(network);
      console.log(`✅ Conexão: ${connectionTest.success ? 'OK' : 'FALHOU'}`);
      if (connectionTest.chainId) {
        console.log(`   Chain ID: ${connectionTest.chainId}`);
      }
    } catch (connError) {
      console.error(`❌ Erro conexão: ${connError.message}`);
    }
    
    console.log('\n🏁 Teste concluído!');
    
  } catch (error) {
    console.error('❌ Erro geral no teste:', error);
  }
}

testBalanceQuery();