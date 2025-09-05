/**
 * AmountStep - Componente para entrada de quantidade em operações de stake
 */

"use client";
import React, { useState, useEffect } from 'react';
import { formatFromWei, formatToWei, isValidAmount } from '@/utils/stakeHelpers';
import { AlertCircle, Info, DollarSign } from 'lucide-react';

const AmountStep = ({
  title = "Quantidade",
  description = "Digite a quantidade para a operação",
  amount = "",
  onAmountChange,
  balance = "0",
  tokenSymbol = "PCN",
  minAmount = "0",
  maxAmount = null,
  placeholder = "0.00",
  showBalance = true,
  showMaxButton = true,
  validationError = null,
  disabled = false,
  customValidation = null
}) => {
  const [inputValue, setInputValue] = useState(amount);
  const [localError, setLocalError] = useState(null);
  const [focused, setFocused] = useState(false);

  // Sync with external amount
  useEffect(() => {
    setInputValue(amount);
  }, [amount]);

  // Validation
  useEffect(() => {
    if (!inputValue || inputValue === "0" || inputValue === "") {
      setLocalError(null);
      return;
    }

    // Validation básica
    const basicValidation = isValidAmount(inputValue, minAmount, maxAmount);
    if (!basicValidation.valid) {
      setLocalError(basicValidation.error);
      return;
    }

    // Verificar saldo se fornecido
    if (balance && parseFloat(inputValue) > parseFloat(balance)) {
      setLocalError('Quantidade maior que o saldo disponível');
      return;
    }

    // Validação customizada
    if (customValidation) {
      const customResult = customValidation(inputValue);
      if (!customResult.valid) {
        setLocalError(customResult.error);
        return;
      }
    }

    setLocalError(null);
  }, [inputValue, minAmount, maxAmount, balance, customValidation]);

  const handleInputChange = (e) => {
    let value = e.target.value;
    
    // Permitir apenas números e vírgula/ponto
    value = value.replace(/[^0-9.,]/g, '');
    
    // Substituir vírgula por ponto
    value = value.replace(',', '.');
    
    // Permitir apenas um ponto
    const pointCount = (value.match(/\./g) || []).length;
    if (pointCount > 1) {
      return;
    }
    
    setInputValue(value);
    
    if (onAmountChange) {
      onAmountChange(value);
    }
  };

  const handleMaxClick = () => {
    const maxValue = maxAmount || balance || "0";
    setInputValue(maxValue);
    
    if (onAmountChange) {
      onAmountChange(maxValue);
    }
  };

  const handlePercentageClick = (percentage) => {
    const availableAmount = maxAmount || balance || "0";
    const calculatedAmount = (parseFloat(availableAmount) * percentage / 100).toString();
    
    setInputValue(calculatedAmount);
    
    if (onAmountChange) {
      onAmountChange(calculatedAmount);
    }
  };

  const currentError = validationError || localError;
  const hasError = Boolean(currentError);
  const balanceFormatted = formatFromWei(balance);
  const minAmountFormatted = formatFromWei(minAmount);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {title}
        </h3>
        {description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            {description}
          </p>
        )}
      </div>

      {/* Amount Input */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Quantidade ({tokenSymbol})
          </label>
          
          <div className="relative">
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder={placeholder}
              disabled={disabled}
              className={`w-full px-4 py-3 text-lg font-medium border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                hasError 
                  ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20' 
                  : focused
                  ? 'border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
            
            {tokenSymbol && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {tokenSymbol}
                </span>
              </div>
            )}
          </div>

          {/* Error Message */}
          {currentError && (
            <div className="mt-2 flex items-center text-red-600 dark:text-red-400">
              <AlertCircle size={16} className="mr-2" />
              <span className="text-sm">{currentError}</span>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        {!disabled && (showMaxButton || balance) && (
          <div className="flex items-center justify-between">
            {/* Percentage buttons */}
            <div className="flex space-x-2">
              {[25, 50, 75].map((percentage) => (
                <button
                  key={percentage}
                  onClick={() => handlePercentageClick(percentage)}
                  className="px-3 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                >
                  {percentage}%
                </button>
              ))}
            </div>

            {/* Max button */}
            {showMaxButton && (
              <button
                onClick={handleMaxClick}
                className="px-3 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
              >
                Máximo
              </button>
            )}
          </div>
        )}

        {/* Balance Info */}
        {showBalance && balance && (
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Saldo disponível:
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {balanceFormatted.full} {tokenSymbol}
              </span>
            </div>
          </div>
        )}

        {/* Min Amount Info */}
        {minAmount && parseFloat(minAmount) > 0 && (
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center">
              <Info className="w-4 h-4 text-blue-500 mr-2" />
              <span className="text-sm text-blue-700 dark:text-blue-300">
                Quantidade mínima: {minAmountFormatted.full} {tokenSymbol}
              </span>
            </div>
          </div>
        )}

        {/* Additional Info */}
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Digite a quantidade desejada para a operação
          </p>
        </div>
      </div>
    </div>
  );
};

export default AmountStep;