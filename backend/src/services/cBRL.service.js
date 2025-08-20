/**
 * cBRL Service - TEMPORARIAMENTE DESABILITADO
 * Placeholder para evitar erros de require
 */

module.exports = {
  // Placeholder methods para evitar erros
  getBalance: () => ({ success: false, error: 'cBRL service temporarily disabled' }),
  mintTokens: () => ({ success: false, error: 'cBRL service temporarily disabled' }),
  burnTokensFrom: () => ({ success: false, error: 'cBRL service temporarily disabled' }),
  getTokenInfo: () => ({ symbol: 'cBRL', name: 'Central Bank Real', decimals: 18 }),
  healthCheck: () => ({ status: 'disabled' }),
  getExplorerUrl: (txHash) => `https://floripa.azorescan.com/tx/${txHash}`
};