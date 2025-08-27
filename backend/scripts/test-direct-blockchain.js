require('dotenv').config();
const { ethers } = require('ethers');

async function testDirectBlockchain() {
  try {
    console.log('🔥 Teste DIRETO da blockchain sem usar services...');
    
    // Criar provider direto
    const rpcUrl = process.env.TESTNET_RPC_URL;
    const chainId = parseInt(process.env.TESTNET_CHAIN_ID);
    
    console.log(`📡 RPC: ${rpcUrl}`);
    console.log(`🔗 Chain ID: ${chainId}`);
    
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    
    // Testar conexão
    console.log('\n1. 🔗 Testando conexão...');
    const network = await provider.getNetwork();
    console.log(`✅ Conectado ao Chain ID: ${network.chainId}`);
    
    // Testar saldo nativo
    const address = '0x5528C065931f523CA9F3a6e49a911896fb1D2e6f';
    console.log(`\n2. 💰 Consultando saldo de ${address}...`);
    
    const balanceWei = await provider.getBalance(address);
    const balanceEth = ethers.formatEther(balanceWei);
    
    console.log(`✅ Saldo: ${balanceEth} AZE`);
    console.log(`   Wei: ${balanceWei.toString()}`);
    
    // Testar saldo de token cBRL  
    console.log(`\n3. 🪙 Consultando saldo cBRL...`);
    const tokenAddress = '0x0A8c73967e4Eee8ffA06484C3fBf65E6Ae3b9804';
    
    // ABI básico do ERC-20
    const tokenABI = [
      "function balanceOf(address owner) view returns (uint256)",
      "function decimals() view returns (uint8)",
      "function symbol() view returns (string)",
      "function name() view returns (string)"
    ];
    
    const contract = new ethers.Contract(tokenAddress, tokenABI, provider);
    
    const [tokenBalance, decimals, symbol, name] = await Promise.all([
      contract.balanceOf(address),
      contract.decimals(),
      contract.symbol(),
      contract.name()
    ]);
    
    const balanceFormatted = ethers.formatUnits(tokenBalance, decimals);
    
    console.log(`✅ Token: ${name} (${symbol})`);
    console.log(`✅ Saldo: ${balanceFormatted} ${symbol}`);
    console.log(`   Raw: ${tokenBalance.toString()}`);
    console.log(`   Decimals: ${decimals}`);
    
    console.log(`\n🎉 Teste concluído com sucesso!`);
    
  } catch (error) {
    console.error('❌ Erro no teste direto:', error.message);
  }
}

testDirectBlockchain();