/**
 * Preços dos tokens em BRL (mock)
 * Centralizados para manter consistência entre todos os componentes
 * TODO: Substituir por dados reais do backend/API de preços
 */

export const TOKEN_PRICES = {
  'AZE': 1.00,
  'AZE-t': 200.50,  // Preço diferente para testar se funciona
  'cBRL': 1.00,
  'CNT': 0.75,
  'MJD': 1.25,
  'PCN': 0.50,
  'STT': 0.00001     // Preço de teste para STT
};

// Função helper para obter preço de um token
export const getTokenPrice = (symbol) => {
  return TOKEN_PRICES[symbol] || 1.00; // Fallback para R$ 1,00
};

// Função helper para calcular valor em BRL
export const calculateTokenValueBRL = (balance, symbol) => {
  const price = getTokenPrice(symbol);
  return parseFloat(balance) * price;
};

// Função para formatar valor em BRL
export const formatCurrency = (value) => {
  if (!value || isNaN(value)) return 'R$ 0,00';
  
  const numericValue = parseFloat(value);
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numericValue);
};