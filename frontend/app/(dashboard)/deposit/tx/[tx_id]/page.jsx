"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import useAuthStore from "@/store/authStore";
import { useAlertContext } from "@/contexts/AlertContext";
import useDarkmode from "@/hooks/useDarkMode";
import depositService from "@/services/depositService";
// Fallback para mock se o serviço real falhar
import mockDepositService from "@/services/mockDepositService";

const DepositConfirmationPage = () => {
  const params = useParams();
  const router = useRouter();
  const txId = params.tx_id;
  
  useDocumentTitle('Confirmação de Depósito', 'Coinage', true);

  const { user } = useAuthStore();
  const { showSuccess, showError } = useAlertContext();
  const [isDark] = useDarkmode();

  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Buscar dados da transação
  useEffect(() => {
    const fetchTransaction = async () => {
      if (!txId) return;

      try {
        setLoading(true);
        const response = await mockDepositService.getTransaction(txId);
        
        if (response.success) {
          setTransaction(response.transaction);
        } else {
          setError(response.message || 'Transação não encontrada');
        }
      } catch (error) {
        console.error('Erro ao buscar transação:', error);
        setError('Erro ao carregar dados da transação');
      } finally {
        setLoading(false);
      }
    };

    fetchTransaction();
  }, [txId]);

  // Função para abrir transação no explorer
  const openInExplorer = (txHash) => {
    if (txHash) {
      window.open(`https://azorescan.com/tx/${txHash}`, '_blank');
    }
  };

  // Função para copiar hash da transação
  const copyTransactionHash = async (txHash) => {
    try {
      await navigator.clipboard.writeText(txHash);
      showSuccess('Hash copiado!', 'Hash da transação copiado para a área de transferência.');
    } catch (error) {
      console.error('Erro ao copiar hash:', error);
      showError('Erro ao copiar hash', 'Não foi possível copiar o hash da transação.');
    }
  };

  // Função para voltar ao depósito
  const handleNewDeposit = () => {
    router.push('/deposit');
  };

  // Função para ir ao dashboard
  const handleGoToDashboard = () => {
    router.push('/dashboard');
  };

  // DEBUG: Função para confirmar PIX manualmente
  const handleDebugConfirmPix = async () => {
    if (!txId) return;
    
    try {
      setLoading(true);
      
      // Chamar API de debug
      const response = await fetch(`/api/deposits/debug/confirm-pix/${txId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token || ''}`
        },
        body: JSON.stringify({
          amount: transaction?.amount || 100
        })
      });

      const data = await response.json();
      
      if (data.success) {
        showSuccess('PIX Confirmado (DEBUG)', 'O pagamento foi confirmado e enviado para processamento blockchain');
        
        // Recarregar dados da transação
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        showError('Erro ao confirmar PIX', data.message);
      }
    } catch (error) {
      console.error('Erro ao confirmar PIX (DEBUG):', error);
      showError('Erro', 'Não foi possível confirmar o PIX');
    } finally {
      setLoading(false);
    }
  };

  // Renderizar loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Icon icon="heroicons:arrow-path" className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Carregando transação...
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Aguarde enquanto buscamos os detalhes do seu depósito
          </p>
        </div>
      </div>
    );
  }

  // Renderizar erro
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <Icon icon="heroicons:exclamation-triangle" className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Erro ao carregar transação
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error}
          </p>
          <div className="flex justify-center space-x-4">
            <Button
              onClick={handleNewDeposit}
              className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2"
            >
              Novo Depósito
            </Button>
            <Button
              onClick={handleGoToDashboard}
              className="bg-slate-500 hover:bg-slate-600 text-white px-6 py-2"
            >
              Ir ao Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Renderizar confirmação
  if (transaction) {
    const isConfirmed = transaction.status === 'confirmed';
    const isPending = transaction.status === 'pending';
    const isFailed = transaction.status === 'failed';

    return (
      <div className="min-h-screen py-8">
        <div className="max-w-2xl mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-8">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
              isConfirmed ? 'bg-green-100 dark:bg-green-900/30' : 
              isPending ? 'bg-yellow-100 dark:bg-yellow-900/30' : 
              'bg-red-100 dark:bg-red-900/30'
            }`}>
              <Icon 
                icon={
                  isConfirmed ? "heroicons:check-circle" : 
                  isPending ? "heroicons:clock" : 
                  "heroicons:x-circle"
                } 
                className={`w-10 h-10 ${
                  isConfirmed ? 'text-green-600 dark:text-green-400' : 
                  isPending ? 'text-yellow-600 dark:text-yellow-400' : 
                  'text-red-600 dark:text-red-400'
                }`} 
              />
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {isConfirmed ? 'Depósito Confirmado!' : 
               isPending ? 'Depósito em Processamento' : 
               'Depósito Falhou'}
            </h1>
            
            <p className="text-gray-600 dark:text-gray-400">
              {isConfirmed ? 'Seu depósito foi processado com sucesso na blockchain' : 
               isPending ? 'Aguardando confirmação na blockchain' : 
               'Houve um problema ao processar seu depósito'}
            </p>
          </div>

          {/* Detalhes da Transação */}
          <Card className="mb-6">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Detalhes da Transação
              </h2>
              
              <div className="space-y-4">
                {/* ID da Transação */}
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">
                    ID da Transação:
                  </span>
                  <span className="font-mono text-sm text-gray-900 dark:text-white">
                    {transaction.id}
                  </span>
                </div>

                {/* Valor */}
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">
                    Valor:
                  </span>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    R$ {transaction.amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Status */}
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">
                    Status:
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    isConfirmed ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 
                    isPending ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' : 
                    'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    {isConfirmed ? 'Confirmado' : 
                     isPending ? 'Pendente' : 
                     'Falhou'}
                  </span>
                </div>

                {/* Data de Criação */}
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">
                    Data:
                  </span>
                  <span className="text-gray-900 dark:text-white">
                    {new Date(transaction.createdAt).toLocaleString('pt-BR')}
                  </span>
                </div>

                {/* Hash da Transação (se confirmado) */}
                {transaction.blockchainData?.transactionHash && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400 font-medium">
                      Hash da Transação:
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs text-gray-900 dark:text-white max-w-32 truncate">
                        {transaction.blockchainData.transactionHash}
                      </span>
                      <Button
                        onClick={() => copyTransactionHash(transaction.blockchainData.transactionHash)}
                        className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        <Icon icon="heroicons:clipboard-document" className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Bloco (se confirmado) */}
                {transaction.blockchainData?.blockNumber && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400 font-medium">
                      Bloco:
                    </span>
                    <span className="font-mono text-gray-900 dark:text-white">
                      {transaction.blockchainData.blockNumber}
                    </span>
                  </div>
                )}

                {/* Gas Used (se confirmado) */}
                {transaction.blockchainData?.gasUsed && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400 font-medium">
                      Gas Utilizado:
                    </span>
                    <span className="font-mono text-gray-900 dark:text-white">
                      {transaction.blockchainData.gasUsed.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Ações */}
          <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
            {/* Ver no Explorer (se confirmado) */}
            {transaction.blockchainData?.transactionHash && (
              <Button
                onClick={() => openInExplorer(transaction.blockchainData.transactionHash)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 flex items-center justify-center"
              >
                <Icon icon="heroicons:arrow-top-right-on-square" className="w-5 h-5 mr-2" />
                Ver no Explorer
              </Button>
            )}

            {/* Novo Depósito */}
            <Button
              onClick={handleNewDeposit}
              className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 flex items-center justify-center"
            >
              <Icon icon="heroicons:plus" className="w-5 h-5 mr-2" />
              Novo Depósito
            </Button>

            {/* Ir ao Dashboard */}
            <Button
              onClick={handleGoToDashboard}
              className="bg-slate-500 hover:bg-slate-600 text-white px-6 py-3 flex items-center justify-center"
            >
              <Icon icon="heroicons:home" className="w-5 h-5 mr-2" />
              Dashboard
            </Button>
          </div>

          {/* Informações Adicionais */}
          {isPending && (
            <>
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-start space-x-3">
                  <Icon icon="heroicons:information-circle" className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                      Aguardando Confirmação
                    </h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Sua transação está sendo processada na blockchain Azore. 
                      Isso pode levar alguns minutos. Você pode verificar o status 
                      atualizando esta página ou aguardar a confirmação automática.
                    </p>
                  </div>
                </div>
              </div>

              {/* Botão DEBUG - Apenas em desenvolvimento */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-start space-x-3">
                      <Icon icon="heroicons:bug-ant" className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                          Modo Debug
                        </h3>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300">
                          Confirmar PIX manualmente para testes
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={handleDebugConfirmPix}
                      disabled={loading}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 flex items-center"
                    >
                      <Icon icon="heroicons:check-circle" className="w-4 h-4 mr-2" />
                      Confirmar PIX (DEBUG)
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}

          {isConfirmed && (
            <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-start space-x-3">
                <Icon icon="heroicons:check-circle" className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-green-800 dark:text-green-200 mb-1">
                    Depósito Confirmado com Sucesso!
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Seu depósito foi processado e confirmado na blockchain Azore. 
                    Os tokens cBRL foram creditados na sua carteira. 
                    Você pode verificar a transação no explorer clicando no botão acima.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
};

export default DepositConfirmationPage;
