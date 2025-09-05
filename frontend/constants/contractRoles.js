/**
 * Contract Roles Configuration
 * 
 * Definições das roles disponíveis nos contratos ERC20 com AccessControl
 */

export const CONTRACT_ROLES = {
  DEFAULT_ADMIN_ROLE: '0x0000000000000000000000000000000000000000000000000000000000000000',
  MINTER_ROLE: '0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6',
  TRANSFER_ROLE: '0x8502233096d909befbda0999bb8ea2f3a6be3c138b9fbf003752a4c8bce86f6c',
  BURNER_ROLE: '0x3c11d16cbaffd01df69ce1c404f6340ee057498f5f00246190ea54220576a848'
};

export const ROLE_NAMES = {
  [CONTRACT_ROLES.DEFAULT_ADMIN_ROLE]: 'Admin',
  [CONTRACT_ROLES.MINTER_ROLE]: 'Minter',
  [CONTRACT_ROLES.TRANSFER_ROLE]: 'Transfer',
  [CONTRACT_ROLES.BURNER_ROLE]: 'Burner'
};

export const ROLE_DESCRIPTIONS = {
  [CONTRACT_ROLES.DEFAULT_ADMIN_ROLE]: 'Administrador principal - pode conceder/revogar outras roles',
  [CONTRACT_ROLES.MINTER_ROLE]: 'Pode criar (mintar) novos tokens',
  [CONTRACT_ROLES.TRANSFER_ROLE]: 'Pode realizar transferências mesmo quando pausado',
  [CONTRACT_ROLES.BURNER_ROLE]: 'Pode queimar (burn) tokens'
};

// Endereços importantes
export const CONTRACT_ADDRESSES = {
  PCN_TOKEN: '0x0b5F5510160E27E6BFDe03914a18d555B590DAF5',
  STAKE_CONTRACT: '0xe21fc42e8c8758f6d999328228721F7952e5988d',
  ADMIN_TOKEN: '0x5528C065931f523CA9F3a6e49a911896fb1D2e6f'
};

export const ROLE_COLORS = {
  [CONTRACT_ROLES.DEFAULT_ADMIN_ROLE]: 'red',
  [CONTRACT_ROLES.MINTER_ROLE]: 'green',
  [CONTRACT_ROLES.TRANSFER_ROLE]: 'blue',
  [CONTRACT_ROLES.BURNER_ROLE]: 'orange'
};

// ABI mínima para gerenciar roles
export const ACCESS_CONTROL_ABI = [
  {
    "inputs": [
      {"internalType": "bytes32", "name": "role", "type": "bytes32"},
      {"internalType": "address", "name": "account", "type": "address"}
    ],
    "name": "hasRole",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "bytes32", "name": "role", "type": "bytes32"},
      {"internalType": "address", "name": "account", "type": "address"}
    ],
    "name": "grantRole",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "bytes32", "name": "role", "type": "bytes32"},
      {"internalType": "address", "name": "account", "type": "address"}
    ],
    "name": "revokeRole",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];