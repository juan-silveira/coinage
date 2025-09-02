/**
 * ConfirmationStep - Componente para confirmação de operações de stake
 */

"use client";
import React from 'react';
import { formatFromWei, formatDate, calculateProjectedReward } from '@/utils/stakeHelpers';
import { 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  ArrowRight,
  Clock,
  TrendingUp,
  Shield
} from 'lucide-react';

const ConfirmationStep = ({
  operationType = "invest",
  product,
  amount,
  tokenSymbol = "PCN",
  currentBalance = "0",
  newBalance = null,
  fees = null,
  estimatedGas = null,
  projectedReward = null,
  riskLevel = 1,
  warnings = [],
  additionalInfo = {},
  onConfirm,
  confirmText = "Confirmar Operação"
}) => {
  const operationLabels = {
    invest: { title: "Investir", icon: TrendingUp, color: "green" },
    withdraw: { title: "Retirar", icon: ArrowRight, color: "orange" },
    claim: { title: "Resgatar Recompensas", icon: CheckCircle, color: "blue" },
    compound: { title: "Reinvestir Recompensas", icon: TrendingUp, color: "purple" }
  };

  const operation = operationLabels[operationType] || operationLabels.invest;
  const Icon = operation.icon;

  const amountFormatted = formatFromWei(amount);
  const currentBalanceFormatted = formatFromWei(currentBalance);
  const newBalanceFormatted = newBalance ? formatFromWei(newBalance) : null;

  const getRiskColor = (level) => {
    const colors = {
      0: "text-gray-500",
      1: "text-green-500",
      2: "text-blue-500", 
      3: "text-yellow-500",
      4: "text-red-500"
    };
    return colors[level] || colors[1];
  };

  const getRiskLabel = (level) => {
    const labels = {
      0: "Muito Baixo",
      1: "Baixo",
      2: "Médio",
      3: "Alto", 
      4: "Muito Alto"
    };
    return labels[level] || labels[1];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className={`w-12 h-12 bg-${operation.color}-100 dark:bg-${operation.color}-900/20 rounded-full flex items-center justify-center mx-auto mb-4`}>
          <Icon className={`w-6 h-6 text-${operation.color}-600 dark:text-${operation.color}-400`} />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Confirmar {operation.title}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Revise os detalhes antes de confirmar a operação
        </p>
      </div>

      {/* Operation Summary */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
        <div className="text-center mb-6">
          <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">
            {operation.title}
          </h4>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {amountFormatted.full}
            <span className="text-lg ml-2 text-gray-500">{tokenSymbol}</span>
          </div>
        </div>

        {/* Product Info */}
        {product && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Produto:</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {product.name}
              </span>
            </div>
            
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Categoria:</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {product.category}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Nível de Risco:</span>
              <div className="flex items-center">
                <Shield size={16} className={`mr-1 ${getRiskColor(riskLevel)}`} />
                <span className={`text-sm font-medium ${getRiskColor(riskLevel)}`}>
                  {getRiskLabel(riskLevel)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Balance Changes */}
      {newBalance && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h5 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-3">
            Alterações no Saldo
          </h5>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-700 dark:text-blue-300">Saldo Atual:</span>
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                {currentBalanceFormatted.full} {tokenSymbol}
              </span>
            </div>
            
            <div className="flex items-center justify-center py-2">
              <ArrowRight className="w-4 h-4 text-blue-500" />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-700 dark:text-blue-300">Novo Saldo:</span>
              <span className="text-sm font-bold text-blue-900 dark:text-blue-100">
                {newBalanceFormatted.full} {tokenSymbol}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Projected Rewards */}
      {projectedReward && operationType === 'invest' && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <h5 className="text-sm font-medium text-green-800 dark:text-green-200 mb-3">
            Projeção de Recompensas
          </h5>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-green-700 dark:text-green-300">
              Estimativa Trimestral:
            </span>
            <span className="text-sm font-bold text-green-900 dark:text-green-100">
              {formatFromWei(projectedReward).full} {tokenSymbol}
            </span>
          </div>
          
          <p className="text-xs text-green-600 dark:text-green-400 mt-2">
            * Projeção baseada no desempenho histórico. Não há garantia de rentabilidade.
          </p>
        </div>
      )}

      {/* Fees and Gas */}
      {(fees || estimatedGas) && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h5 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-3">
            Custos da Transação
          </h5>
          
          <div className="space-y-2">
            {fees && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Taxa de Operação:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatFromWei(fees).full} {tokenSymbol}
                </span>
              </div>
            )}
            
            {estimatedGas && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Gas Estimado:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {estimatedGas}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2" />
            <h5 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              Atenção
            </h5>
          </div>
          
          <ul className="space-y-1">
            {warnings.map((warning, index) => (
              <li key={index} className="text-sm text-yellow-700 dark:text-yellow-300">
                • {warning}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Additional Info */}
      {Object.keys(additionalInfo).length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mr-2" />
            <h5 className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Informações Importantes
            </h5>
          </div>
          
          <div className="space-y-2">
            {Object.entries(additionalInfo).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm text-blue-700 dark:text-blue-300">{key}:</span>
                <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Terms and Conditions */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <label className="flex items-start space-x-3">
          <input 
            type="checkbox" 
            className="mt-0.5 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            required
          />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Li e concordo com os{' '}
            <a href="#" className="text-blue-600 hover:text-blue-800 underline">
              termos e condições
            </a>
            {' '}desta operação de stake. Estou ciente dos riscos envolvidos.
          </span>
        </label>
      </div>

      {/* Final Warning */}
      <div className="text-center">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Esta operação será executada imediatamente após a confirmação.
          <br />
          Verifique todos os dados antes de prosseguir.
        </p>
      </div>
    </div>
  );
};

export default ConfirmationStep;