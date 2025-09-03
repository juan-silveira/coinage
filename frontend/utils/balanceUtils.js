/**
 * Utilitários para conversão e formatação de saldos com precisão
 */

/**
 * Converte wei para decimal arredondando a 6ª casa para baixo
 * @param {string|number} weiString - Valor em wei
 * @param {number} decimals - Número de decimais do token (padrão: 18)
 * @returns {string} Valor decimal como string
 */
export const weiToDecimal = (weiString, decimals = 18) => {
  if (!weiString || weiString === '0') return '0.000000';
  
  // Converter wei para decimal usando divisão precisa
  const weiNum = BigInt(weiString.toString());
  const divisor = BigInt(10 ** decimals);
  
  // Parte inteira
  const integerPart = weiNum / divisor;
  
  // Parte decimal em wei
  const remainderWei = weiNum % divisor;
  
  // Converter remainder para decimal com N casas
  const decimalStr = remainderWei.toString().padStart(decimals, '0');
  
  // Pegar apenas as primeiras 6 casas decimais (truncar, não arredondar)
  const sixDecimals = decimalStr.substring(0, 6);
  
  // SEMPRE retornar com 6 casas decimais (não remover zeros)
  return `${integerPart.toString()}.${sixDecimals}`;
};

/**
 * Formata número para exibição brasileira preservando precisão
 * @param {string|number} value - Valor para formatar
 * @param {boolean} addBalanceClass - Se deve adicionar classe 'balance' (padrão: true)
 * @returns {string} Valor formatado para exibição
 */
export const formatForDisplay = (value, addBalanceClass = true) => {
  if (!value || value === '0') return addBalanceClass ? '<span class="balance">0,000000</span>' : '0,000000';
  
  const numValue = parseFloat(value);
  if (isNaN(numValue)) return addBalanceClass ? `<span class="balance">${value}</span>` : value;
  
  const formatted = numValue.toLocaleString('pt-BR', {
    minimumFractionDigits: 6,
    maximumFractionDigits: 6
  });
  
  return addBalanceClass ? `<span class="balance">${formatted}</span>` : formatted;
};

/**
 * Formata saldo para exibição com símbolo e classe balance
 * @param {string|number} value - Valor do saldo
 * @param {string} symbol - Símbolo do token
 * @param {boolean} showSymbol - Se deve mostrar o símbolo (padrão: true)
 * @returns {string} Saldo formatado com classe balance
 */
export const formatBalance = (value, symbol = '', showSymbol = true) => {
  const formatted = formatForDisplay(value, false);
  const symbolText = showSymbol && symbol ? ` ${symbol}` : '';
  return `<span class="balance">${formatted}${symbolText}</span>`;
};

/**
 * Componente React para exibir saldo com classe balance
 * @param {Object} props - Props do componente
 * @param {string|number} props.value - Valor do saldo
 * @param {string} props.symbol - Símbolo do token
 * @param {string} props.className - Classes CSS adicionais
 * @param {boolean} props.showSymbol - Se deve mostrar o símbolo
 * @returns {JSX.Element} Componente de saldo
 */
export const BalanceDisplay = ({ value, symbol = '', className = '', showSymbol = true }) => {
  const numValue = parseFloat(value || '0');
  const formatted = isNaN(numValue) ? '0,000000' : numValue.toLocaleString('pt-BR', {
    minimumFractionDigits: 6,
    maximumFractionDigits: 6
  });
  
  return (
    <span className={`balance ${className}`}>
      {formatted}{showSymbol && symbol ? ` ${symbol}` : ''}
    </span>
  );
};

export default {
  weiToDecimal,
  formatForDisplay,
  formatBalance,
  BalanceDisplay
};