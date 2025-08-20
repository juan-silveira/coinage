const contractTypeService = require('../services/contractType.service');

/**
 * Arquivo central para gerenciamento de contratos e ABIs
 * Este arquivo exporta funcionalidades para trabalhar com diferentes tipos de contratos
 */

/**
 * Mapeamento de categorias de contratos
 */
const CONTRACT_CATEGORIES = {
  TOKEN: 'token',
  NFT: 'nft',
  DEFI: 'defi',
  ESCROW: 'escrow',
  GOVERNANCE: 'governance',
  BRIDGE: 'bridge',
  ORACLE: 'oracle',
  OTHER: 'other'
};

/**
 * Tipos de contrato padrão disponíveis
 */
const DEFAULT_CONTRACT_TYPES = {
  // Tokens
  ERC20_STANDARD: 'erc20-standard',
  ERC20_MINTABLE: 'erc20-mintable',
  
  // NFTs
  ERC721_STANDARD: 'erc721-standard',
  
  // DeFi
  STAKING_REWARDS: 'staking-rewards',
  
  // Escrow
  SIMPLE_ESCROW: 'simple-escrow',
  
  // Oracle
  PRICE_FEED: 'price-feed'
};

/**
 * Função para obter ABI por tipo de contrato
 * @param {string} contractTypeId - ID do tipo de contrato
 * @returns {Promise<Object>} ABI do contrato
 */
async function getContractABI(contractTypeId) {
  try {
    return await contractTypeService.getContractTypeABI(contractTypeId);
  } catch (error) {
    console.error('Error getting contract ABI:', error);
    throw error;
  }
}

/**
 * Função para obter todos os tipos de uma categoria
 * @param {string} category - Categoria do contrato
 * @returns {Promise<Array>} Lista de tipos de contrato
 */
async function getContractTypesByCategory(category) {
  try {
    return await contractTypeService.getContractTypesByCategory(category);
  } catch (error) {
    console.error('Error getting contract types by category:', error);
    throw error;
  }
}

/**
 * Função para validar endereço de contrato
 * @param {string} address - Endereço do contrato
 * @returns {boolean} True se o endereço é válido
 */
function validateContractAddress(address) {
  const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
  return ethAddressRegex.test(address);
}

/**
 * Função para extrair informações básicas de um ABI
 * @param {Array} abi - ABI do contrato
 * @returns {Object} Informações extraídas
 */
function extractABIInfo(abi) {
  if (!Array.isArray(abi)) {
    throw new Error('ABI must be an array');
  }

  const functions = abi.filter(item => item.type === 'function');
  const events = abi.filter(item => item.type === 'event');
  const constructor = abi.find(item => item.type === 'constructor');

  const viewFunctions = functions.filter(fn => 
    fn.stateMutability === 'view' || fn.stateMutability === 'pure'
  );
  
  const writeFunctions = functions.filter(fn => 
    fn.stateMutability === 'nonpayable' || fn.stateMutability === 'payable'
  );

  return {
    totalItems: abi.length,
    functions: {
      total: functions.length,
      view: viewFunctions.length,
      write: writeFunctions.length,
      list: functions.map(fn => ({
        name: fn.name,
        type: fn.stateMutability,
        inputs: fn.inputs?.length || 0,
        outputs: fn.outputs?.length || 0
      }))
    },
    events: {
      total: events.length,
      list: events.map(ev => ({
        name: ev.name,
        inputs: ev.inputs?.length || 0
      }))
    },
    hasConstructor: !!constructor,
    constructorInputs: constructor?.inputs?.length || 0
  };
}

/**
 * Função para detectar tipo de contrato baseado no ABI
 * @param {Array} abi - ABI do contrato
 * @returns {Object} Tipo detectado e confiança
 */
function detectContractType(abi) {
  if (!Array.isArray(abi)) {
    return { type: 'unknown', confidence: 0 };
  }

  const functions = abi.filter(item => item.type === 'function').map(f => f.name);
  const events = abi.filter(item => item.type === 'event').map(e => e.name);

  // ERC-20 detection
  const erc20Functions = ['transfer', 'transferFrom', 'approve', 'balanceOf', 'totalSupply'];
  const erc20Events = ['Transfer', 'Approval'];
  
  const erc20Score = erc20Functions.filter(fn => functions.includes(fn)).length +
                   erc20Events.filter(ev => events.includes(ev)).length;
  
  if (erc20Score >= 6) {
    const hasMint = functions.includes('mint');
    const hasBurn = functions.includes('burn') || functions.includes('burnFrom');
    return { 
      type: hasMint || hasBurn ? 'erc20-mintable' : 'erc20-standard', 
      confidence: (erc20Score / 7) * 100 
    };
  }

  // ERC-721 detection
  const erc721Functions = ['transferFrom', 'approve', 'setApprovalForAll', 'balanceOf', 'ownerOf'];
  const erc721Events = ['Transfer', 'Approval', 'ApprovalForAll'];
  
  const erc721Score = erc721Functions.filter(fn => functions.includes(fn)).length +
                     erc721Events.filter(ev => events.includes(ev)).length;
  
  if (erc721Score >= 6) {
    return { type: 'erc721-standard', confidence: (erc721Score / 8) * 100 };
  }

  // Staking detection
  const stakingFunctions = ['stake', 'withdraw', 'getReward', 'earned'];
  const stakingScore = stakingFunctions.filter(fn => functions.includes(fn)).length;
  
  if (stakingScore >= 3) {
    return { type: 'staking-rewards', confidence: (stakingScore / 4) * 100 };
  }

  // Escrow detection
  const escrowFunctions = ['deposit', 'complete', 'refund'];
  const escrowScore = escrowFunctions.filter(fn => functions.includes(fn)).length;
  
  if (escrowScore >= 2) {
    return { type: 'simple-escrow', confidence: (escrowScore / 3) * 100 };
  }

  // Oracle detection
  const oracleFeatures = ['latestAnswer', 'latestRoundData', 'getRoundData'];
  const oracleScore = oracleFeatures.filter(fn => functions.includes(fn)).length;
  
  if (oracleScore >= 2) {
    return { type: 'price-feed', confidence: (oracleScore / 3) * 100 };
  }

  return { type: 'unknown', confidence: 0 };
}

/**
 * Função utilitária para formatar funções do ABI para display
 * @param {Array} abi - ABI do contrato
 * @returns {Object} Funções formatadas
 */
function formatABIForDisplay(abi) {
  const functions = abi.filter(item => item.type === 'function');
  
  const grouped = functions.reduce((acc, fn) => {
    const category = fn.stateMutability === 'view' || fn.stateMutability === 'pure' ? 'read' : 'write';
    
    if (!acc[category]) acc[category] = [];
    
    acc[category].push({
      name: fn.name,
      signature: `${fn.name}(${fn.inputs.map(input => `${input.type} ${input.name}`).join(', ')})`,
      returns: fn.outputs?.map(output => output.type).join(', ') || 'void',
      payable: fn.stateMutability === 'payable'
    });
    
    return acc;
  }, {});

  return grouped;
}

module.exports = {
  CONTRACT_CATEGORIES,
  DEFAULT_CONTRACT_TYPES,
  contractTypeService,
  
  // Utility functions
  getContractABI,
  getContractTypesByCategory,
  validateContractAddress,
  extractABIInfo,
  detectContractType,
  formatABIForDisplay
};