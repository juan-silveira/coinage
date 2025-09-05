/**
 * Preços dos tokens em BRL (mock)
 * Centralizados para manter consistência - espelhando frontend
 * TODO: Substituir por dados reais de API de preços
 */

const TOKEN_PRICES = {
  'AZE': 1.00,
  'AZE-t': 200.50,  // Preço diferente para testar se funciona
  'cBRL': 1.00,
  'CNT': 0.75,
  'MJD': 1.25,
  'PCN': 0.50,
  'STT': 0.00001     // Preço de teste para STT
};

const TOKEN_NAMES = {
  'AZE': 'Azore',
  'AZE-t': 'Azore (testnet)',
  'cBRL': 'Coinage Real Brasil',
  'CNT': 'Coinage Trade',
  'MJD': 'Meu Jurídico Digital',
  'PCN': 'Pratique Coin',
  'STT': 'Simple Test Token'
};

// Função helper para obter preço de um token
const getTokenPrice = (symbol) => {
  return TOKEN_PRICES[symbol] || 1.00; // Fallback para R$ 1,00
};

// Função helper para obter nome completo de um token
const getTokenName = (symbol) => {
  return TOKEN_NAMES[symbol] || symbol;
};

// Função helper para calcular valor em BRL
const calculateTokenValueBRL = (balance, symbol) => {
  const price = getTokenPrice(symbol);
  return parseFloat(balance) * price;
};

module.exports = {
  TOKEN_PRICES,
  TOKEN_NAMES,
  getTokenPrice,
  getTokenName,
  calculateTokenValueBRL
};