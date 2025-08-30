"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import { useAlertContext } from '@/contexts/AlertContext';
import useAuthStore from '@/store/authStore';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import api from '@/services/api';

const WithdrawReceiptPage = () => {
  useDocumentTitle('Comprovante de Saque', 'Coinage', true);
  
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const { showSuccess, showError, showInfo } = useAlertContext();
  
  const withdrawalId = params.withdrawalId;
  const [withdrawal, setWithdrawal] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (withdrawalId) {
      fetchWithdrawalData();
    }
  }, [withdrawalId]);

  const fetchWithdrawalData = async () => {
    try {
      setLoading(true);
      
      const response = await api.get(`/api/withdrawals/${withdrawalId}/status`);
      
      if (response.data.success) {
        setWithdrawal(response.data.data);
      } else {
        throw new Error(response.data.message || 'Erro ao buscar dados do saque');
      }
    } catch (error) {
      console.error('Erro ao buscar withdrawal:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Tente novamente';
      showError('Erro ao carregar comprovante', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatDisplayValue = (value) => {
    if (!value) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  const truncateString = (str, maxLength = 20) => {
    if (!str) return '-';
    if (str.length <= maxLength) return str;
    return `${str.slice(0, maxLength)}...`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED':
      case 'CONFIRMED':
        return 'text-green-600 dark:text-green-400';
      case 'PROCESSING':
      case 'BURN_COMPLETED':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'PENDING':
        return 'text-blue-600 dark:text-blue-400';
      case 'FAILED':
      case 'PIX_FAILED':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'COMPLETED':
        return 'Concluído';
      case 'CONFIRMED':
        return 'Confirmado';
      case 'PROCESSING':
        return 'Processando';
      case 'BURN_COMPLETED':
        return 'Tokens queimados - Processando PIX';
      case 'PENDING':
        return 'Pendente';
      case 'FAILED':
        return 'Falhou';
      case 'PIX_FAILED':
        return 'Falha no PIX';
      default:
        return status || 'Desconhecido';
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    if (navigator.share && withdrawal) {
      try {
        await navigator.share({
          title: 'Comprovante de Saque - Coinage',
          text: `Saque realizado: ${formatDisplayValue(withdrawal.amount)} - PIX: ${withdrawal.pixTransactionId}`,
          url: window.location.href
        });
        showSuccess('Comprovante compartilhado com sucesso');
      } catch (error) {
        console.error('Erro ao compartilhar:', error);
        // Fallback: copiar para clipboard
        handleCopyLink();
      }
    } else {
      // Fallback: copiar para clipboard
      handleCopyLink();
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showSuccess('Link copiado para a área de transferência');
    } catch (error) {
      console.error('Erro ao copiar link:', error);
      showError('Não foi possível copiar o link');
    }
  };

  const handleSave = () => {
    // Criar e baixar arquivo PDF/HTML com os dados
    const receiptData = {
      withdrawalId: withdrawal.id,
      amount: withdrawal.amount,
      status: withdrawal.status,
      pixKey: withdrawal.pixKey,
      burnTxHash: withdrawal.burnTxHash,
      pixTransactionId: withdrawal.pixTransactionId,
      createdAt: withdrawal.createdAt,
      completedAt: withdrawal.completedAt
    };
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(receiptData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `saque_${withdrawalId}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    
    showSuccess('Comprovante salvo com sucesso');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Comprovante de Saque
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Carregando dados do saque...
          </p>
        </div>
        
        <div className="max-w-2xl mx-auto">
          <Card className="p-8">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mx-auto"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mx-auto"></div>
              <div className="space-y-3 mt-8">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (!withdrawal) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Comprovante não encontrado
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            O saque solicitado não foi encontrado ou você não tem permissão para visualizá-lo.
          </p>
          <Button onClick={() => router.push('/withdraw')} className="bg-primary-500 hover:bg-primary-600">
            Voltar para Saque
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Comprovante de Saque
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Detalhes da sua transação PIX
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        <Card className="p-8">
          {/* Status do saque */}
          <div className="text-center mb-8">
            <div className="mb-4">
              {withdrawal.status === 'COMPLETED' || withdrawal.status === 'CONFIRMED' ? (
                <div className="mx-auto w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                  <Icon icon="heroicons:check-circle" className="h-12 w-12 text-green-600 dark:text-green-400" />
                </div>
              ) : withdrawal.status === 'FAILED' || withdrawal.status === 'PIX_FAILED' ? (
                <div className="mx-auto w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                  <Icon icon="heroicons:x-circle" className="h-12 w-12 text-red-600 dark:text-red-400" />
                </div>
              ) : (
                <div className="mx-auto w-20 h-20 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center">
                  <Icon icon="heroicons:clock" className="h-12 w-12 text-yellow-600 dark:text-yellow-400" />
                </div>
              )}
            </div>
            
            <h2 className={`text-2xl font-bold mb-2 ${getStatusColor(withdrawal.status)}`}>
              {getStatusText(withdrawal.status)}
            </h2>
            
            <div className="text-4xl font-bold text-gray-900 dark:text-white mb-1">
              {formatDisplayValue(withdrawal.netAmount || (withdrawal.amount - (withdrawal.fee || 0)))}
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Valor líquido recebido
            </p>
            
            <p className="text-gray-500 dark:text-gray-400">
              Saque realizado em {formatDateTime(withdrawal.createdAt)}
            </p>
          </div>

          {/* Detalhes da transação */}
          <div className="space-y-6 border-t border-gray-200 dark:border-gray-700 pt-6">
            {/* ID do saque */}
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400 font-medium">
                ID do Saque:
              </span>
              <span className="text-gray-900 dark:text-white font-mono text-sm">
                {withdrawal.id}
              </span>
            </div>

            {/* Valor solicitado */}
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400 font-medium">
                Valor Solicitado:
              </span>
              <span className="text-gray-900 dark:text-white font-semibold">
                {formatDisplayValue(withdrawal.amount)}
              </span>
            </div>

            {/* Chave PIX */}
            <div className="flex justify-between items-start">
              <span className="text-gray-600 dark:text-gray-400 font-medium">
                Chave PIX:
              </span>
              <div className="text-right">
                <div className="text-gray-900 dark:text-white">
                  {withdrawal.pixKey}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {withdrawal.pixKeyType?.toUpperCase()}
                </div>
              </div>
            </div>

            {/* Taxa */}
            {withdrawal.fee && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400 font-medium">
                  Taxa:
                </span>
                <span className="text-red-600 dark:text-red-400">
                  {formatDisplayValue(withdrawal.fee)}
                </span>
              </div>
            )}

            {/* Valor líquido */}
            {withdrawal.netAmount && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400 font-medium">
                  Valor Recebido:
                </span>
                <span className="text-green-600 dark:text-green-400 font-semibold">
                  {formatDisplayValue(withdrawal.netAmount)}
                </span>
              </div>
            )}

            {/* Hash da blockchain */}
            {withdrawal.burnTxHash && (
              <div className="flex justify-between items-start">
                <span className="text-gray-600 dark:text-gray-400 font-medium">
                  Hash Blockchain:
                </span>
                <div className="text-right">
                  <span className="text-gray-900 dark:text-white font-mono text-sm" title={withdrawal.burnTxHash}>
                    {truncateString(withdrawal.burnTxHash, 16)}
                  </span>
                  <div className="text-xs text-blue-500 dark:text-blue-400 mt-1">
                    <a 
                      href={`https://floripa.azorescan.com/tx/${withdrawal.burnTxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      Ver no Explorer
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* PIX Transaction ID */}
            {withdrawal.pixTransactionId && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400 font-medium">
                  ID PIX:
                </span>
                <span className="text-gray-900 dark:text-white font-mono text-sm" title={withdrawal.pixTransactionId}>
                  {truncateString(withdrawal.pixTransactionId, 24)}
                </span>
              </div>
            )}

            {/* End to End ID */}
            {withdrawal.pixEndToEndId && (
              <div className="flex justify-between items-start">
                <span className="text-gray-600 dark:text-gray-400 font-medium">
                  End-to-End ID:
                </span>
                <div className="text-right">
                  <span className="text-gray-900 dark:text-white font-mono text-sm" title={withdrawal.pixEndToEndId}>
                    {truncateString(withdrawal.pixEndToEndId, 24)}
                  </span>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Identificador único PIX
                  </div>
                </div>
              </div>
            )}

            {/* Data de conclusão */}
            {withdrawal.completedAt && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400 font-medium">
                  Concluído em:
                </span>
                <span className="text-gray-900 dark:text-white">
                  {formatDateTime(withdrawal.completedAt)}
                </span>
              </div>
            )}
          </div>

          {/* Ações do comprovante */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
            <div className="flex flex-wrap justify-center gap-4">
              <Button
                onClick={handlePrint}
                className="bg-gray-500 hover:bg-gray-600 text-white flex items-center"
              >
                <Icon icon="heroicons:printer" className="w-5 h-5 mr-2" />
                Imprimir
              </Button>
              
              <Button
                onClick={handleShare}
                className="bg-blue-500 hover:bg-blue-600 text-white flex items-center"
              >
                <Icon icon="heroicons:share" className="w-5 h-5 mr-2" />
                Compartilhar
              </Button>
              
              <Button
                onClick={handleSave}
                className="bg-green-500 hover:bg-green-600 text-white flex items-center"
              >
                <Icon icon="heroicons:arrow-down-tray" className="w-5 h-5 mr-2" />
                Salvar
              </Button>
            </div>
          </div>

          {/* Navegação */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
            <div className="flex flex-wrap justify-center gap-4">
              <Button
                onClick={() => router.push('/')}
                className="bg-primary-500 hover:bg-primary-600 text-white"
              >
                <Icon icon="heroicons:home" className="w-5 h-5 mr-2" />
                Voltar ao Dashboard
              </Button>
              
              <Button
                onClick={() => router.push('/withdraw')}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                <Icon icon="fa6-brands:pix" className="w-5 h-5 mr-2" />
                Novo Saque
              </Button>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Print styles */}
      <style jsx>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: white !important;
          }
        }
      `}</style>
    </div>
  );
};

export default WithdrawReceiptPage;