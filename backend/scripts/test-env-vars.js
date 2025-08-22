require('dotenv').config();

console.log('🔧 Verificando variáveis de ambiente blockchain...');

console.log(`MAINNET_RPC_URL: ${process.env.MAINNET_RPC_URL}`);
console.log(`MAINNET_CHAIN_ID: ${process.env.MAINNET_CHAIN_ID}`);
console.log(`TESTNET_RPC_URL: ${process.env.TESTNET_RPC_URL}`);
console.log(`TESTNET_CHAIN_ID: ${process.env.TESTNET_CHAIN_ID}`);
console.log(`DEFAULT_NETWORK: ${process.env.DEFAULT_NETWORK}`);

const blockchainConfig = require('../src/config/blockchain');

console.log('\n🌐 Testando configuração blockchain...');
console.log('Networks:', blockchainConfig.networks);
console.log('Default Network:', blockchainConfig.defaultNetwork);

try {
  const provider = blockchainConfig.getProvider('testnet');
  console.log('✅ Provider testnet criado com sucesso');
} catch (error) {
  console.error('❌ Erro ao criar provider testnet:', error.message);
}