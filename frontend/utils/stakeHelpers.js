/**
 * StakeHelpers - Utilitários para o sistema de stakes
 * 
 * Funções auxiliares para formatação, validação e cálculos relacionados ao stake.
 */

import { formatUnits, parseUnits, isAddress } from 'ethers';

// ===== FORMATAÇÃO =====

/**
 * Converte valor de Wei para formato legível
 */
export const formatFromWei = (weiValue, decimals = 18, precision = 6) => {
  try {
    if (!weiValue || weiValue === '0') {
      return {
        integer: '0',
        decimals: '0'.repeat(precision),
        full: '0.0',
        wei: '0'
      };
    }

    const etherValue = formatUnits(weiValue.toString(), decimals);
    const [integerPart, decimalPart = ''] = etherValue.split('.');
    
    const truncatedDecimals = decimalPart.substring(0, precision).padEnd(precision, '0');
    
    return {
      integer: parseInt(integerPart).toLocaleString('pt-BR'),
      decimals: truncatedDecimals,
      full: parseFloat(etherValue).toLocaleString('pt-BR', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: precision 
      }),
      wei: weiValue.toString()
    };
  } catch (error) {
    console.error('Error formatting from wei:', error);
    return {
      integer: '0',
      decimals: '0'.repeat(precision),
      full: '0.0',
      wei: '0'
    };
  }
};

/**
 * Converte valor legível para Wei
 */
export const formatToWei = (value, decimals = 18) => {
  try {
    if (!value || value === '0' || value === '') {
      return '0';
    }

    // Limpar formatação brasileira
    const cleanValue = value.toString().replace(/\./g, '').replace(',', '.');
    return parseUnits(cleanValue, decimals).toString();
  } catch (error) {
    console.error('Error formatting to wei:', error);
    return '0';
  }
};

/**
 * Formatar percentual
 */
export const formatPercentage = (value, precision = 2) => {
  try {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return '0%';
    
    return `${numValue.toFixed(precision)}%`;
  } catch (error) {
    return '0%';
  }
};

/**
 * Formatar data para exibição
 */
export const formatDate = (timestamp, format = 'dd/MM/yyyy') => {
  try {
    const date = new Date(typeof timestamp === 'string' ? timestamp : timestamp * 1000);
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    switch (format) {
      case 'dd/MM/yyyy':
        return `${day}/${month}/${year}`;
      case 'MM/dd/yyyy':
        return `${month}/${day}/${year}`;
      case 'yyyy-MM-dd':
        return `${year}-${month}-${day}`;
      default:
        return date.toLocaleDateString('pt-BR');
    }
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Data inválida';
  }
};

// ===== CÁLCULOS =====

/**
 * Calcular APY baseado em recompensas e período
 */
export const calculateAPY = (principal, rewards, daysElapsed) => {
  try {
    if (!principal || !rewards || !daysElapsed || daysElapsed === 0) {
      return 0;
    }

    const principalFloat = parseFloat(principal);
    const rewardsFloat = parseFloat(rewards);
    
    if (principalFloat <= 0) return 0;
    
    const dailyReturn = rewardsFloat / principalFloat / daysElapsed;
    const apy = (Math.pow(1 + dailyReturn, 365) - 1) * 100;
    
    return Math.max(0, apy);
  } catch (error) {
    console.error('Error calculating APY:', error);
    return 0;
  }
};

/**
 * Calcular recompensa projetada baseada em APY e tempo
 */
export const calculateProjectedReward = (principal, apy, days) => {
  try {
    const principalFloat = parseFloat(principal);
    const apyFloat = parseFloat(apy) / 100;
    
    if (principalFloat <= 0 || apyFloat <= 0 || days <= 0) {
      return '0';
    }
    
    const dailyRate = apyFloat / 365;
    const projectedReward = principalFloat * dailyRate * days;
    
    return projectedReward.toString();
  } catch (error) {
    console.error('Error calculating projected reward:', error);
    return '0';
  }
};

/**
 * Calcular tempo até o próximo ciclo
 */
export const calculateTimeToNextCycle = (lastCycleTimestamp, cycleDurationDays) => {
  try {
    const now = Date.now() / 1000;
    const lastCycle = parseInt(lastCycleTimestamp);
    const cycleDurationSeconds = cycleDurationDays * 24 * 60 * 60;
    
    const nextCycle = lastCycle + cycleDurationSeconds;
    const timeRemaining = Math.max(0, nextCycle - now);
    
    const days = Math.floor(timeRemaining / (24 * 60 * 60));
    const hours = Math.floor((timeRemaining % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((timeRemaining % (60 * 60)) / 60);
    
    return {
      totalSeconds: timeRemaining,
      days,
      hours,
      minutes,
      isOverdue: timeRemaining === 0
    };
  } catch (error) {
    console.error('Error calculating time to next cycle:', error);
    return {
      totalSeconds: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      isOverdue: false
    };
  }
};

// ===== VALIDAÇÕES =====

/**
 * Validar endereço Ethereum
 */
export const isValidAddress = (address) => {
  try {
    return isAddress(address);
  } catch (error) {
    return false;
  }
};

/**
 * Validar quantidade para operações
 */
export const isValidAmount = (amount, minAmount = '0', maxAmount = null) => {
  try {
    const amountFloat = parseFloat(amount);
    const minFloat = parseFloat(minAmount);
    
    if (isNaN(amountFloat) || amountFloat <= 0) {
      return { valid: false, error: 'Quantidade deve ser maior que zero' };
    }
    
    if (amountFloat < minFloat) {
      return { valid: false, error: `Quantidade mínima é ${minFloat}` };
    }
    
    if (maxAmount !== null) {
      const maxFloat = parseFloat(maxAmount);
      if (amountFloat > maxFloat) {
        return { valid: false, error: `Quantidade máxima é ${maxFloat}` };
      }
    }
    
    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Quantidade inválida' };
  }
};

/**
 * Validar configuração de produto stake
 */
export const validateStakeProduct = (product) => {
  const errors = [];
  const warnings = [];
  
  if (!product) {
    errors.push('Produto não fornecido');
    return { valid: false, errors, warnings };
  }
  
  if (!product.id) errors.push('ID do produto é obrigatório');
  if (!product.name) errors.push('Nome do produto é obrigatório');
  
  if (!product.contracts) {
    errors.push('Configuração de contratos é obrigatória');
  } else {
    if (!product.contracts.stake?.network) {
      errors.push('Rede do contrato stake é obrigatória');
    }
    
    if (!product.contracts.stakeToken?.symbol) {
      errors.push('Token de stake é obrigatório');
    }
    
    if (!product.contracts.rewardToken?.symbol) {
      errors.push('Token de recompensa é obrigatório');
    }
  }
  
  if (!product.defaultConfig) {
    warnings.push('Configuração padrão não definida');
  }
  
  if (product.contracts?.stake?.address && !isValidAddress(product.contracts.stake.address)) {
    errors.push('Endereço do contrato stake inválido');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
};

// ===== UTILITÁRIOS DE REDE =====

/**
 * Obter configuração da rede
 */
export const getNetworkConfig = (network = 'testnet') => {
  const configs = {
    mainnet: {
      chainId: parseInt(process.env.NEXT_PUBLIC_MAINNET_CHAIN_ID || '8800'),
      rpcUrl: process.env.NEXT_PUBLIC_MAINNET_RPC_URL,
      explorerUrl: process.env.NEXT_PUBLIC_MAINNET_EXPLORER,
      name: 'Azore Mainnet'
    },
    testnet: {
      chainId: parseInt(process.env.NEXT_PUBLIC_TESTNET_CHAIN_ID || '88001'),
      rpcUrl: process.env.NEXT_PUBLIC_TESTNET_RPC_URL,
      explorerUrl: process.env.NEXT_PUBLIC_TESTNET_EXPLORER,
      name: 'Azore Testnet'
    }
  };
  
  return configs[network] || configs.testnet;
};

/**
 * Gerar link para explorador de blockchain
 */
export const getExplorerLink = (hash, type = 'tx', network = 'testnet') => {
  const config = getNetworkConfig(network);
  if (!config.explorerUrl) return '#';
  
  const baseUrl = config.explorerUrl.replace('/api', '');
  
  switch (type) {
    case 'tx':
      return `${baseUrl}/tx/${hash}`;
    case 'address':
      return `${baseUrl}/address/${hash}`;
    case 'token':
      return `${baseUrl}/token/${hash}`;
    default:
      return `${baseUrl}/tx/${hash}`;
  }
};

// ===== UTILITÁRIOS DE CACHE =====

/**
 * Gerar chave única para cache local
 */
export const generateCacheKey = (...parts) => {
  return parts
    .filter(part => part !== null && part !== undefined)
    .map(part => part.toString().toLowerCase())
    .join('_');
};

/**
 * Verificar se dados do cache ainda são válidos
 */
export const isCacheValid = (cachedItem, ttlMs = 300000) => {
  if (!cachedItem || !cachedItem.timestamp) return false;
  
  const now = Date.now();
  return (now - cachedItem.timestamp) < ttlMs;
};

// ===== UTILITÁRIOS DE DEBUG =====

/**
 * Logger condicional baseado em environment
 */
export const debugLog = (message, data = null, level = 'info') => {
  const isDebug = process.env.NEXT_PUBLIC_DEBUG_STAKES === 'true';
  
  if (!isDebug) return;
  
  const timestamp = new Date().toISOString();
  const prefix = `[StakeDebug ${timestamp}]`;
  
  switch (level) {
    case 'error':
      console.error(prefix, message, data);
      break;
    case 'warn':
      console.warn(prefix, message, data);
      break;
    case 'info':
    default:
      console.log(prefix, message, data);
      break;
  }
};

/**
 * Medir performance de operações
 */
export const measurePerformance = (operationName, fn) => {
  return async (...args) => {
    const startTime = performance.now();
    
    try {
      const result = await fn(...args);
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      debugLog(`Performance: ${operationName} completed in ${duration.toFixed(2)}ms`);
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      debugLog(`Performance: ${operationName} failed after ${duration.toFixed(2)}ms`, error, 'error');
      
      throw error;
    }
  };
};

// ===== EXPORTAÇÕES =====

export default {
  // Formatação
  formatFromWei,
  formatToWei,
  formatPercentage,
  formatDate,
  
  // Cálculos
  calculateAPY,
  calculateProjectedReward,
  calculateTimeToNextCycle,
  
  // Validações
  isValidAddress,
  isValidAmount,
  validateStakeProduct,
  
  // Rede
  getNetworkConfig,
  getExplorerLink,
  
  // Cache
  generateCacheKey,
  isCacheValid,
  
  // Debug
  debugLog,
  measurePerformance
};