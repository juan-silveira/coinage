import { useState, useCallback } from 'react';

/**
 * Hook para máscara de moeda brasileira (R$)
 * Suporta conversão automática de ponto para vírgula
 * Limita casas decimais a 2 dígitos
 * Preserva vírgula quando apenas decimais são deletados
 * Formata separadores de milhares automaticamente
 */
const useCurrencyMask = (initialValue = '') => {
  const [value, setValue] = useState(initialValue);

  // Função para formatar valor para entrada em tempo real (separadores de milhares)
  const formatInputValue = useCallback((inputValue) => {
    if (!inputValue) return '';

    // Se o usuário digitou vírgula, permitir decimais
    if (inputValue.includes(',')) {
      const [integerPart, decimalPart] = inputValue.split(',');

      // Formatar parte inteira
      const cleanInteger = integerPart.replace(/\D/g, '');
      if (cleanInteger === '') return '';
      const num = parseInt(cleanInteger);
      if (isNaN(num)) return '';
      const formattedInteger = num.toLocaleString('pt-BR');

      // Limitar parte decimal a 2 dígitos
      const limitedDecimal = decimalPart.replace(/\D/g, '').slice(0, 2);

      return `${formattedInteger},${limitedDecimal}`;
    }

    // Se não tem vírgula, é um número inteiro
    const cleanValue = inputValue.replace(/\D/g, '');
    if (cleanValue === '') return '';
    const num = parseInt(cleanValue);
    if (isNaN(num)) return '';

    return num.toLocaleString('pt-BR');
  }, []);

  // Função para formatar valor para exibição (com 2 casas decimais)
  const formatDisplayValue = useCallback((val) => {
    if (!val) return 'R$ 0,00';

    // Remover formatação e converter para número
    const cleanValue = val.toString().replace(/[^\d,]/g, '').replace(',', '.');
    const amount = parseFloat(cleanValue);

    if (isNaN(amount)) return 'R$ 0,00';

    // Formatar como moeda brasileira com 2 casas decimais
    return amount.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }, []);

  // Função para obter valor numérico limpo
  const getNumericValue = useCallback((val = value) => {
    if (!val) return 0;
    const cleanValue = val.toString().replace(/[^\d,]/g, '').replace(',', '.');
    return parseFloat(cleanValue) || 0;
  }, [value]);

  // Função para validar se o valor é válido (mínimo R$ 10,00)
  const isValidAmount = useCallback((val = value) => {
    return getNumericValue(val) >= 10;
  }, [value, getNumericValue]);

  // Função para lidar com tecla pressionada
  const handleKeyPress = useCallback((e) => {
    const key = e.key;

    // Se pressionou ponto, converter para vírgula
    if (key === '.') {
      e.preventDefault();
      const currentValue = value.replace(/[^\d]/g, '');
      if (currentValue && !value.includes(',')) {
        const formattedValue = formatInputValue(currentValue + ',');
        setValue(formattedValue);
      }
      return;
    }

    // Permitir apenas números, vírgula e backspace
    if (!/[\d,]/.test(key) && key !== 'Backspace' && key !== 'Delete') {
      e.preventDefault();
      return;
    }

    // Se pressionou vírgula e já existe uma, não permitir
    if (key === ',' && value.includes(',')) {
      e.preventDefault();
      return;
    }

    // Se pressionou vírgula, permitir e formatar
    if (key === ',') {
      const currentValue = value.replace(/[^\d]/g, '');
      if (currentValue) {
        const formattedValue = formatInputValue(currentValue + ',');
        setValue(formattedValue);
        e.preventDefault();
      }
      return;
    }

    // Se já tem 2 casas decimais, não permitir mais números
    if (/\d/.test(key) && value.includes(',')) {
      const decimalPart = value.split(',')[1];
      if (decimalPart && decimalPart.length >= 2) {
        e.preventDefault();
        return;
      }
    }
  }, [value, formatInputValue]);

  // Função para lidar com mudanças no input
  const handleChange = useCallback((e) => {
    const inputValue = e.target.value;

          // Se não tem vírgula, formatar como inteiro
      if (!inputValue.includes(',')) {
        const formattedValue = formatInputValue(inputValue);
        setValue(formattedValue);
    } else {
      // Se tem vírgula, formatar parte inteira e manter decimais
      const [integerPart, decimalPart] = inputValue.split(',');

      // Se a parte inteira foi removida, limpar o campo
      if (!integerPart) {
        setValue('');
        return;
      }

      // Se tem vírgula mas não tem decimais, manter vírgula para permitir decimais
      if (integerPart && decimalPart === '') {
        const formattedInteger = formatInputValue(integerPart);
        const finalValue = `${formattedInteger},`;
        setValue(finalValue);
        return;
      }

      // Se a vírgula foi removida (usuário deletou), formatar como inteiro
      // Isso só acontece quando o inputValue não contém vírgula
      if (integerPart && !decimalPart && !inputValue.includes(',')) {
        const formattedInteger = formatInputValue(integerPart);
        setValue(formattedInteger);
        return;
      }

      // Formatar parte inteira e manter decimais (limitado a 2 casas)
      const formattedInteger = formatInputValue(integerPart);
      const limitedDecimal = decimalPart ? decimalPart.slice(0, 2) : '';
      const finalValue = limitedDecimal ? `${formattedInteger},${limitedDecimal}` : formattedInteger;

      setValue(finalValue);
    }
  }, [formatInputValue]);

  // Função para lidar com saída do campo (adicionar ,00 se não tem decimais)
  const handleBlur = useCallback(() => {
    if (value && !value.includes(',')) {
      setValue(value + ',00');
    }
  }, [value]);

  // Função para limpar o valor
  const clearValue = useCallback(() => {
    setValue('');
  }, []);

  // Função para definir um valor específico
  const setValueDirectly = useCallback((newValue) => {
    setValue(newValue);
  }, []);

  return {
    // Estado
    value,
    
    // Funções de formatação
    formatInputValue,
    formatDisplayValue,
    getNumericValue,
    
    // Validação
    isValidAmount,
    
    // Event handlers
    handleKeyPress,
    handleChange,
    handleBlur,
    
    // Controle
    clearValue,
    setValue: setValueDirectly,
    
    // Props para input (para facilitar o uso)
    inputProps: {
      value,
      onKeyPress: handleKeyPress,
      onChange: handleChange,
      onBlur: handleBlur,
      placeholder: '0,00'
    }
  };
};

export default useCurrencyMask;
