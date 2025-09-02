/**
 * TransactionStep - Componente para mostrar status de transação de stake
 */

"use client";
import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ExternalLink,
  Copy,
  RefreshCw,
  TrendingUp
} from 'lucide-react';
import { formatFromWei } from '@/utils/stakeHelpers';
import Button from '@/components/ui/Button';

const TransactionStep = ({
  status = "processing", // processing, success, failed, pending
  transactionHash = null,
  operationType = "invest",
  amount,
  tokenSymbol = "PCN",
  product,
  error = null,
  estimatedTime = null,
  onRetry = null,
  onClose = null,
  explorerUrl = null,
  additionalData = {}
}) => {
  const [copied, setCopied] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);

  // Timer para transações pendentes
  useEffect(() => {
    let interval = null;
    
    if (status === "processing" || status === "pending") {
      interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status]);

  const operationLabels = {
    invest: "Investimento",
    withdraw: "Retirada", 
    claim: "Resgate de Recompensas",
    compound: "Reinvestimento"
  };

  const getStatusConfig = () => {
    switch (status) {
      case "processing":
        return {
          icon: RefreshCw,
          color: "blue",
          title: "Processando Transação",
          description: "Sua transação está sendo processada na blockchain...",
          bgColor: "bg-blue-50 dark:bg-blue-900/20",
          iconColor: "text-blue-600 dark:text-blue-400",
          animate: true
        };
      case "pending":
        return {
          icon: Clock,
          color: "yellow", 
          title: "Aguardando Confirmação",
          description: "Transação enviada, aguardando confirmação da rede...",
          bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
          iconColor: "text-yellow-600 dark:text-yellow-400",
          animate: true
        };
      case "success":
        return {
          icon: CheckCircle2,
          color: "green",
          title: "Transação Confirmada!",
          description: "Sua operação foi executada com sucesso.",
          bgColor: "bg-green-50 dark:bg-green-900/20",
          iconColor: "text-green-600 dark:text-green-400",
          animate: false
        };
      case "failed":
        return {
          icon: AlertCircle,
          color: "red",
          title: "Transação Falhou",
          description: "Ocorreu um erro durante a execução da transação.",
          bgColor: "bg-red-50 dark:bg-red-900/20",
          iconColor: "text-red-600 dark:text-red-400",
          animate: false
        };
      default:
        return {
          icon: Clock,
          color: "gray",
          title: "Status Desconhecido",
          description: "Status da transação não reconhecido.",
          bgColor: "bg-gray-50 dark:bg-gray-800",
          iconColor: "text-gray-600 dark:text-gray-400",
          animate: false
        };
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;
  const amountFormatted = formatFromWei(amount);

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Status Header */}
      <div className="text-center">
        <div className={`w-16 h-16 ${statusConfig.bgColor} rounded-full flex items-center justify-center mx-auto mb-4`}>
          <StatusIcon 
            className={`w-8 h-8 ${statusConfig.iconColor} ${statusConfig.animate ? 'animate-spin' : ''}`} 
          />
        </div>
        
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          {statusConfig.title}
        </h3>
        
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {statusConfig.description}
        </p>
      </div>

      {/* Operation Summary */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <TrendingUp className="w-5 h-5 text-blue-500 mr-2" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
              {operationLabels[operationType]}
            </span>
          </div>
          
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {amountFormatted.full}
            <span className="text-base ml-2 text-gray-500">{tokenSymbol}</span>
          </div>
          
          {product && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              {product.name}
            </p>
          )}
        </div>
      </div>

      {/* Transaction Hash */}
      {transactionHash && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Hash da Transação:
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => copyToClipboard(transactionHash)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                title="Copiar hash"
              >
                <Copy size={16} />
              </button>
              
              {explorerUrl && (
                <a
                  href={`${explorerUrl}/tx/${transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                  title="Ver no explorer"
                >
                  <ExternalLink size={16} />
                </a>
              )}
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-900 rounded p-2 font-mono text-xs break-all">
            {transactionHash}
          </div>
          
          {copied && (
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              Hash copiado para a área de transferência!
            </p>
          )}
        </div>
      )}

      {/* Time Information */}
      {(status === "processing" || status === "pending") && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-700 dark:text-blue-300">
              Tempo decorrido:
            </span>
            <span className="text-sm font-mono text-blue-900 dark:text-blue-100">
              {formatTime(timeElapsed)}
            </span>
          </div>
          
          {estimatedTime && (
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm text-blue-700 dark:text-blue-300">
                Tempo estimado:
              </span>
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                ~{estimatedTime}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Error Details */}
      {error && status === "failed" && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-sm font-medium text-red-800 dark:text-red-200">
              Detalhes do Erro
            </span>
          </div>
          
          <p className="text-sm text-red-700 dark:text-red-300 mb-3">
            {error}
          </p>
          
          {onRetry && (
            <Button
              onClick={onRetry}
              variant="outline"
              size="sm"
              className="text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              Tentar Novamente
            </Button>
          )}
        </div>
      )}

      {/* Additional Transaction Data */}
      {Object.keys(additionalData).length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h5 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-3">
            Detalhes Adicionais
          </h5>
          
          <div className="space-y-2">
            {Object.entries(additionalData).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">{key}:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Success Actions */}
      {status === "success" && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="text-center">
            <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-3" />
            <h4 className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
              Operação Concluída com Sucesso!
            </h4>
            <p className="text-sm text-green-700 dark:text-green-300 mb-4">
              Sua {operationLabels[operationType].toLowerCase()} foi processada com sucesso.
              Os dados serão atualizados em instantes.
            </p>
            
            {onClose && (
              <Button
                onClick={onClose}
                className="btn-brand"
                size="sm"
              >
                Fechar
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Status Footer */}
      <div className="text-center">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {status === "processing" && "Processando transação na blockchain..."}
          {status === "pending" && "Aguardando confirmações da rede..."}
          {status === "success" && "Transação executada com sucesso!"}
          {status === "failed" && "Transação falhou. Tente novamente."}
        </p>
      </div>
    </div>
  );
};

export default TransactionStep;