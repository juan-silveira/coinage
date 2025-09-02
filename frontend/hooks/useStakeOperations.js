/**
 * useStakeOperations Hook - Hook para operações de stake
 * 
 * Este hook gerencia todas as operações de stake (invest, withdraw, claim, compound)
 * incluindo validações, tratamento de erros e atualização de estado.
 */

import { useState, useCallback, useRef } from 'react';
import { stakeService } from '../services/stakeService';
import { getStakeProduct } from '../constants/stakeProducts';
import { useAuth } from './useAuth';

/**
 * Hook para gerenciar operações de stake
 * 
 * @param {string} productId - ID do produto de stake
 * @param {Object} options - Opções de configuração
 */
export const useStakeOperations = (productId, options = {}) => {
  const {
    onSuccess = null,
    onError = null,
    onStatusChange = null,
    autoRefreshData = true
  } = options;

  // States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [transaction, setTransaction] = useState(null);
  const [operationHistory, setOperationHistory] = useState([]);

  // Refs
  const mountedRef = useRef(true);

  // Auth context
  const { user } = useAuth();
  const userAddress = user?.walletAddress;

  // Product config
  const product = getStakeProduct(productId);
  const contractAddress = product?.contracts?.stake?.address;

  /**
   * Executa uma operação de stake genérica
   */
  const executeOperation = useCallback(async (operationType, params = {}) => {
    if (!productId || !contractAddress || !userAddress) {
      const errorMsg = 'Dados insuficientes para executar operação';
      setError(errorMsg);
      if (onError) onError(new Error(errorMsg));
      return null;
    }

    if (loading) {
      console.warn('Operação já em andamento, ignorando nova requisição');
      return null;
    }

    setLoading(true);
    setError(null);
    setTransaction(null);

    try {
      // Notificar início da operação
      if (onStatusChange) {
        onStatusChange('preparing', operationType, params);
      }

      let result;
      const commonParams = { userAddress, ...params };

      switch (operationType) {
        case 'invest':
          if (!params.amount) {
            throw new Error('Quantidade é obrigatória para investir');
          }
          result = await stakeService.invest(
            contractAddress, 
            userAddress, 
            params.amount,
            params.customTimestamp
          );
          break;

        case 'withdraw':
          if (!params.amount) {
            throw new Error('Quantidade é obrigatória para retirar');
          }
          result = await stakeService.withdraw(
            contractAddress, 
            userAddress, 
            params.amount
          );
          break;

        case 'claim':
          result = await stakeService.claimRewards(contractAddress, userAddress);
          break;

        case 'compound':
          result = await stakeService.compound(contractAddress, userAddress);
          break;

        default:
          throw new Error(`Operação não suportada: ${operationType}`);
      }

      if (mountedRef.current) {
        const transactionData = {
          id: Date.now().toString(),
          type: operationType,
          productId,
          contractAddress,
          userAddress,
          params,
          result,
          timestamp: Date.now(),
          status: 'completed'
        };

        setTransaction(transactionData);
        setOperationHistory(prev => [transactionData, ...prev.slice(0, 9)]); // Manter últimas 10

        // Notificar sucesso
        if (onStatusChange) {
          onStatusChange('completed', operationType, params, result);
        }
        
        if (onSuccess) {
          onSuccess(result, operationType, params);
        }
      }

      return result;

    } catch (err) {
      console.error(`Erro na operação ${operationType}:`, err);
      
      if (mountedRef.current) {
        const errorMessage = err.response?.data?.message || err.message || 'Erro na operação';
        setError(errorMessage);

        const transactionData = {
          id: Date.now().toString(),
          type: operationType,
          productId,
          contractAddress,
          userAddress,
          params,
          error: errorMessage,
          timestamp: Date.now(),
          status: 'failed'
        };

        setTransaction(transactionData);
        setOperationHistory(prev => [transactionData, ...prev.slice(0, 9)]);

        // Notificar erro
        if (onStatusChange) {
          onStatusChange('failed', operationType, params, null, errorMessage);
        }
        
        if (onError) {
          onError(err, operationType, params);
        }
      }

      return null;
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [
    productId, 
    contractAddress, 
    userAddress, 
    loading, 
    onSuccess, 
    onError, 
    onStatusChange
  ]);

  /**
   * Investir tokens no stake
   */
  const invest = useCallback(async (amount, customTimestamp = null) => {
    // Validações específicas para invest
    if (!amount || parseFloat(amount) <= 0) {
      const error = new Error('Quantidade deve ser maior que zero');
      setError(error.message);
      if (onError) onError(error);
      return null;
    }

    const minStakeAmount = product?.defaultConfig?.minStakeAmount || '0';
    if (parseFloat(amount) < parseFloat(minStakeAmount)) {
      const error = new Error(`Quantidade mínima é ${minStakeAmount}`);
      setError(error.message);
      if (onError) onError(error);
      return null;
    }

    return executeOperation('invest', { amount, customTimestamp });
  }, [executeOperation, product, onError]);

  /**
   * Retirar tokens do stake
   */
  const withdraw = useCallback(async (amount) => {
    // Validações específicas para withdraw
    if (!amount || parseFloat(amount) <= 0) {
      const error = new Error('Quantidade deve ser maior que zero');
      setError(error.message);
      if (onError) onError(error);
      return null;
    }

    const allowPartialWithdrawal = product?.defaultConfig?.allowPartialWithdrawal;
    if (!allowPartialWithdrawal) {
      const error = new Error('Este produto não permite retirada parcial');
      setError(error.message);
      if (onError) onError(error);
      return null;
    }

    return executeOperation('withdraw', { amount });
  }, [executeOperation, product, onError]);

  /**
   * Resgatar recompensas
   */
  const claimRewards = useCallback(async () => {
    return executeOperation('claim');
  }, [executeOperation]);

  /**
   * Reinvestir recompensas (compound)
   */
  const compound = useCallback(async () => {
    const allowCompound = product?.defaultConfig?.allowCompound;
    if (!allowCompound) {
      const error = new Error('Este produto não permite reinvestimento');
      setError(error.message);
      if (onError) onError(error);
      return null;
    }

    return executeOperation('compound');
  }, [executeOperation, product, onError]);

  /**
   * Limpar erro atual
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Limpar transação atual
   */
  const clearTransaction = useCallback(() => {
    setTransaction(null);
  }, []);

  /**
   * Limpar histórico de operações
   */
  const clearHistory = useCallback(() => {
    setOperationHistory([]);
  }, []);

  // Estados derivados
  const canInvest = Boolean(
    productId && 
    contractAddress && 
    userAddress && 
    product?.defaultConfig?.stakingEnabled &&
    product?.status === 'active'
  );

  const canWithdraw = Boolean(
    canInvest && 
    product?.defaultConfig?.allowPartialWithdrawal
  );

  const canCompound = Boolean(
    canInvest && 
    product?.defaultConfig?.allowCompound
  );

  return {
    // Estados principais
    loading,
    error,
    transaction,
    operationHistory,

    // Operações
    invest,
    withdraw,
    claimRewards,
    compound,

    // Funções utilitárias
    clearError,
    clearTransaction,
    clearHistory,

    // Estados derivados
    canInvest,
    canWithdraw,
    canCompound,
    
    // Dados do produto
    product,
    contractAddress,
    userAddress,

    // Status
    isReady: Boolean(productId && contractAddress && userAddress),
    isProductActive: product?.status === 'active',
    isStakingEnabled: product?.defaultConfig?.stakingEnabled || false
  };
};

/**
 * Hook para operações em batch (múltiplos produtos)
 */
export const useBatchStakeOperations = (options = {}) => {
  const { onBatchComplete = null, onOperationComplete = null } = options;

  // States
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });
  const [batchResults, setBatchResults] = useState([]);
  const [batchErrors, setBatchErrors] = useState([]);

  // Auth context
  const { user } = useAuth();
  const userAddress = user?.walletAddress;

  /**
   * Executa operações em batch
   */
  const executeBatch = useCallback(async (operations) => {
    if (!userAddress || !operations || operations.length === 0) {
      return [];
    }

    setBatchLoading(true);
    setBatchProgress({ current: 0, total: operations.length });
    setBatchResults([]);
    setBatchErrors([]);

    const results = [];
    const errors = [];

    for (let i = 0; i < operations.length; i++) {
      const operation = operations[i];
      setBatchProgress({ current: i + 1, total: operations.length });

      try {
        let result;
        const { productId, type, params } = operation;
        const product = getStakeProduct(productId);
        const contractAddress = product?.contracts?.stake?.address;

        if (!contractAddress) {
          throw new Error(`Contrato não encontrado para produto ${productId}`);
        }

        switch (type) {
          case 'invest':
            result = await stakeService.invest(contractAddress, userAddress, params.amount);
            break;
          case 'withdraw':
            result = await stakeService.withdraw(contractAddress, userAddress, params.amount);
            break;
          case 'claim':
            result = await stakeService.claimRewards(contractAddress, userAddress);
            break;
          case 'compound':
            result = await stakeService.compound(contractAddress, userAddress);
            break;
          default:
            throw new Error(`Operação não suportada: ${type}`);
        }

        const successResult = { ...operation, result, success: true };
        results.push(successResult);

        if (onOperationComplete) {
          onOperationComplete(successResult, i + 1, operations.length);
        }

      } catch (error) {
        console.error(`Erro na operação batch ${i}:`, error);
        
        const errorResult = { 
          ...operation, 
          error: error.message, 
          success: false 
        };
        
        results.push(errorResult);
        errors.push(errorResult);

        if (onOperationComplete) {
          onOperationComplete(errorResult, i + 1, operations.length);
        }
      }

      // Pequena pausa entre operações para não sobrecarregar
      if (i < operations.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    setBatchResults(results);
    setBatchErrors(errors);
    setBatchLoading(false);

    if (onBatchComplete) {
      onBatchComplete(results, errors);
    }

    return results;
  }, [userAddress, onBatchComplete, onOperationComplete]);

  return {
    // Estados
    batchLoading,
    batchProgress,
    batchResults,
    batchErrors,

    // Função principal
    executeBatch,

    // Estados derivados
    hasBatchErrors: batchErrors.length > 0,
    batchSuccessCount: batchResults.filter(r => r.success).length,
    batchErrorCount: batchErrors.length
  };
};

/**
 * Hook para validações de operações stake
 */
export const useStakeValidation = (productId) => {
  const product = getStakeProduct(productId);

  /**
   * Valida uma operação de investimento
   */
  const validateInvestment = useCallback((amount, userBalance = null) => {
    const errors = [];
    const warnings = [];

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      errors.push('Quantidade deve ser um número válido maior que zero');
    }

    if (product) {
      const minStakeAmount = parseFloat(product.defaultConfig?.minStakeAmount || '0');
      if (parseFloat(amount) < minStakeAmount) {
        errors.push(`Quantidade mínima para investir é ${minStakeAmount}`);
      }

      if (!product.defaultConfig?.stakingEnabled) {
        errors.push('Investimentos estão temporariamente desabilitados para este produto');
      }

      if (product.status !== 'active') {
        errors.push('Este produto não está ativo para investimentos');
      }
    }

    if (userBalance !== null && parseFloat(amount) > parseFloat(userBalance)) {
      errors.push('Saldo insuficiente para esta operação');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }, [product]);

  /**
   * Valida uma operação de retirada
   */
  const validateWithdrawal = useCallback((amount, stakedBalance = null) => {
    const errors = [];
    const warnings = [];

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      errors.push('Quantidade deve ser um número válido maior que zero');
    }

    if (product) {
      if (!product.defaultConfig?.allowPartialWithdrawal) {
        errors.push('Este produto não permite retiradas parciais');
      }

      if (product.status === 'ended') {
        warnings.push('Este produto já foi finalizado');
      }
    }

    if (stakedBalance !== null && parseFloat(amount) > parseFloat(stakedBalance)) {
      errors.push('Quantidade maior que o saldo investido');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }, [product]);

  return {
    validateInvestment,
    validateWithdrawal,
    product
  };
};

export default useStakeOperations;