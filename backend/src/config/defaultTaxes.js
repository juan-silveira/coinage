/**
 * Configuração de taxas padrão para novos usuários
 * Estas taxas serão aplicadas automaticamente quando um novo usuário for criado
 */

const DEFAULT_USER_TAXES = {
  // Taxa de câmbio (exchange) em porcentagem
  exchangeFeePercent: 0.3,
  
  // Taxa de transferência em porcentagem
  transferFeePercent: 0.1,
  
  // Subsídio de gas
  gasSubsidyEnabled: false,
  gasSubsidyPercent: 0,
  
  // Status VIP
  isVip: false,
  vipLevel: 0,
  
  // Taxa de depósito em reais
  depositFee: 3.0,
  
  // Taxa de saque em reais
  withdrawFee: 5.0,
  
  // Taxa de validação PIX em reais
  pixValidation: 1.0,
  
  // Taxas customizadas (JSON)
  customFees: {
    // Pode adicionar taxas específicas aqui
    instantWithdraw: 10.0,  // Taxa para saque instantâneo
    priorityTransaction: 2.0, // Taxa para transação prioritária
  }
};

// Taxas especiais para usuários VIP
const VIP_USER_TAXES = {
  exchangeFeePercent: 0.15,  // 50% de desconto
  transferFeePercent: 0.05,  // 50% de desconto
  gasSubsidyEnabled: true,
  gasSubsidyPercent: 50,     // 50% de subsídio em gas
  isVip: true,
  vipLevel: 1,
  depositFee: 0,              // Sem taxa de depósito
  withdrawFee: 2.5,           // 50% de desconto
  pixValidation: 0,           // Validação PIX gratuita
  customFees: {
    instantWithdraw: 5.0,     // 50% de desconto
    priorityTransaction: 0,   // Gratuito para VIP
  }
};

// Função para obter taxas baseado no tipo de usuário
function getUserTaxes(isVip = false) {
  return isVip ? VIP_USER_TAXES : DEFAULT_USER_TAXES;
}

module.exports = {
  DEFAULT_USER_TAXES,
  VIP_USER_TAXES,
  getUserTaxes
};