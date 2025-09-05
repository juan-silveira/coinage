/**
 * Configuração dos tokens padrão que serão criados automaticamente
 * quando o banco de dados for inicializado
 */

// Função para obter o ABI completo do token ERC-20
const getTokenABI = () => {
  // Usar ABI ERC-20 completo com todas as funções necessárias (incluindo mint, roles, etc.)
  try {
    const fs = require('fs');
    const path = require('path');
    const abiPath = path.join(__dirname, 'complete_erc20_abi.json');
    return JSON.parse(fs.readFileSync(abiPath, 'utf8'));
  } catch (error) {
    console.warn('Erro ao carregar ABI completo, usando minimal:', error.message);
    // Fallback para ABI mínimo com função mint
    return [
      { "constant": true, "inputs": [{"name": "_owner", "type": "address"}], "name": "balanceOf", "outputs": [{"name": "balance", "type": "uint256"}], "type": "function" },
      { "constant": true, "inputs": [], "name": "decimals", "outputs": [{"name": "", "type": "uint8"}], "type": "function" },
      { "constant": true, "inputs": [], "name": "name", "outputs": [{"name": "", "type": "string"}], "type": "function" },
      { "constant": true, "inputs": [], "name": "symbol", "outputs": [{"name": "", "type": "string"}], "type": "function" },
      { "inputs": [{"internalType": "address", "name": "to", "type": "address"}, {"internalType": "uint256", "name": "amount", "type": "uint256"}], "name": "mint", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
      { "inputs": [{"internalType": "bytes32", "name": "role", "type": "bytes32"}, {"internalType": "address", "name": "account", "type": "address"}], "name": "grantRole", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
      { "inputs": [{"internalType": "bytes32", "name": "role", "type": "bytes32"}, {"internalType": "address", "name": "account", "type": "address"}], "name": "hasRole", "outputs": [{"internalType": "bool", "name": "", "type": "bool"}], "stateMutability": "view", "type": "function" },
      { "inputs": [], "name": "MINTER_ROLE", "outputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}], "stateMutability": "view", "type": "function" }
    ];
  }
};

// Função para obter o ABI do stake da variável de ambiente  
const getStakeABI = () => {
  // Usar ABI stake padrão diretamente (para futuro uso)
  return [
    {
      "constant": true,
      "inputs": [{"name": "_owner", "type": "address"}],
      "name": "balanceOf",
      "outputs": [{"name": "balance", "type": "uint256"}],
      "type": "function"
    }
  ];
};

const defaultTokens = [
  // Token nativo da Mainnet - Azore (AZE)
  {
    name: 'Azore',
    symbol: 'AZE',
    address: '0x0000000000000000000000000000000000000000', // Endereço zero para token nativo
    network: 'mainnet',
    contractType: 'NATIVE',
    version: '1.0.0',
    isVerified: true,
    isActive: true,
    adminAddress: null, // Token nativo não tem admin
    metadata: {
      decimals: 18,
      totalSupply: null, // Supply ilimitado para token nativo
      description: 'Token nativo da rede Azore Mainnet',
      website: 'https://azore.technology',
      explorer: 'https://explorer.azore.technology',
      isNative: true
    },
    abi: [] // Token nativo não tem ABI
  },
  
  // Token nativo da Testnet - Azore (AZE-t)
  {
    name: 'Azore',
    symbol: 'AZE-t',
    address: '0x0000000000000000000000000000000000000000', // Endereço zero para token nativo
    network: 'testnet',
    contractType: 'NATIVE',
    version: '1.0.0',
    isVerified: true,
    isActive: true,
    adminAddress: null, // Token nativo não tem admin
    metadata: {
      decimals: 18,
      totalSupply: null, // Supply ilimitado para token nativo
      description: 'Token nativo da rede Azore Testnet',
      website: 'https://azore.technology',
      explorer: 'https://testnet-explorer.azore.technology',
      isNative: true
    },
    abi: [] // Token nativo não tem ABI
  },
  
  // cBRL - Token ERC20 da Testnet
  {
    name: 'Coinage Real Brasil',
    symbol: 'cBRL',
    address: '0x0A8c73967e4Eee8ffA06484C3fBf65E6Ae3b9804',
    network: 'testnet',
    contractType: 'ERC20',
    version: '1.0.0',
    isVerified: true,
    isActive: true,
    adminAddress: '0x5528C065931f523CA9F3a6e49a911896fb1D2e6f',
    metadata: {
      decimals: 18,
      totalSupply: '1000000000000000000000000', // 1 milhão de tokens
      description: 'Token cBRL da rede Azore Testnet',
      website: 'https://',
      explorer: 'https://floripa.azorescan.com',
      isNative: false
    },
    abi: getTokenABI()
  },
  
  // cBRL - Token ERC20 da Mainnet (placeholder)
  {
    name: 'Coinage Real Brasil',
    symbol: 'cBRL',
    address: '0x2f8d31627a1f014691eb6e56c235b2382702f4b9',
    network: 'mainnet',
    contractType: 'ERC20',
    version: '1.0.0',
    isVerified: true,
    isActive: true,
    adminAddress: '0x5528C065931f523CA9F3a6e49a911896fb1D2e6f',
    metadata: {
      decimals: 18,
      totalSupply: '1000000000000000000000000', // 1 milhão de tokens
      description: 'Token cBRL da rede Azore Mainnet',
      website: 'https://',
      explorer: 'https://azorescan.com',
      isNative: false
    },
    abi: getTokenABI()
  },
  
  // STT - Stake Token da Testnet (usa TOKEN_ABI para balanceOf)
  {
    name: 'Stake Token Test',
    symbol: 'STT',
    address: '0x575b05df92b1a2e7782322bb86a9ee1e5bf2edcd',
    network: 'testnet',
    contractType: 'ERC20',
    version: '1.0.0',
    isVerified: true,
    isActive: true,
    adminAddress: '0x5528C065931f523CA9F3a6e49a911896fb1D2e6f',
    metadata: {
      decimals: 18,
      totalSupply: '1000000000000000000000000000', // 1 bilhão de tokens
      description: 'Token STT da rede Azore Testnet para testes de staking',
      website: 'https://',
      explorer: 'https://floripa.azorescan.com',
      isNative: false
    },
    abi: getTokenABI() // Usa TOKEN_ABI para funções ERC20 como balanceOf
  }
];

module.exports = defaultTokens; 