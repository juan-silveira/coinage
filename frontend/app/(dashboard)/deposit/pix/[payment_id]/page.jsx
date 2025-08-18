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
import usePixPaymentMonitor from "@/hooks/usePixPaymentMonitor";
import mockPixService from "@/services/mockPixService";

const PixPaymentPage = () => {
  const params = useParams();
  const router = useRouter();
  const paymentId = params.payment_id;
  
  useDocumentTitle('Pagamento PIX', 'Coinage', true);

  const { user } = useAuthStore();
  const { showSuccess, showError } = useAlertContext();
  const [isDark] = useDarkmode();

  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estado para controlar se já mostrou os alerts
  const [hasShownPaidAlert, setHasShownPaidAlert] = useState(false);
  const [hasShownExpiredAlert, setHasShownExpiredAlert] = useState(false);

  // Hook para monitorar pagamento
  const {
    status,
    loading: monitorLoading,
    error: monitorError,
    timeRemaining,
    timeRemainingFormatted,
    forcePayment,
    redirectToTransaction
  } = usePixPaymentMonitor(paymentId, {
    autoRedirect: false, // Não redirecionar automaticamente
    onPaid: (paymentData) => {
      console.log('Pagamento PIX confirmado:', paymentData);
      if (!hasShownPaidAlert) {
        setHasShownPaidAlert(true);
        showSuccess('Pagamento confirmado!', 'Redirecionando para processamento na blockchain...');
        
        // Aguardar um pouco antes de redirecionar
        setTimeout(() => {
          redirectToTransaction();
        }, 2000);
      }
    },
    onExpired: (paymentData) => {
      console.log('Pagamento PIX expirado:', paymentData);
      if (!hasShownExpiredAlert) {
        setHasShownExpiredAlert(true);
        showError('Pagamento expirado', 'O tempo para pagamento expirou. Crie um novo depósito.');
      }
    }
  });

  // Buscar dados do pagamento
  useEffect(() => {
    const fetchPayment = async () => {
      if (!paymentId) return;

      try {
        setLoading(true);
        const response = await mockPixService.getPayment(paymentId);
        
        if (response.success) {
          setPayment(response.payment);
        } else {
          setError(response.message || 'Pagamento PIX não encontrado');
        }
      } catch (error) {
        console.error('Erro ao buscar pagamento PIX:', error);
        setError('Erro ao carregar dados do pagamento');
      } finally {
        setLoading(false);
      }
    };

    fetchPayment();
  }, [paymentId]);

  // Resetar estados de alert quando paymentId mudar
  useEffect(() => {
    setHasShownPaidAlert(false);
    setHasShownExpiredAlert(false);
  }, [paymentId]);

  // Função para copiar chave PIX
  const copyPixKey = async () => {
    if (payment?.pixKey) {
      try {
        await navigator.clipboard.writeText(payment.pixKey);
        showSuccess('Chave PIX copiada!', 'Chave copiada para a área de transferência.');
      } catch (error) {
        console.error('Erro ao copiar chave PIX:', error);
        showError('Erro ao copiar chave', 'Não foi possível copiar a chave PIX.');
      }
    }
  };

  // Função para copiar código PIX
  const copyPixCode = async () => {
    if (payment?.qrCode) {
      try {
        // Extrair dados do QR Code (simulado)
        const pixData = `00020126580014br.gov.bcb.pix0136${payment.pixKey}520400005303986540${payment.amount.toFixed(2)}5802BR5913Coinage LTDA6008Sao Paulo62070503***6304`;
        await navigator.clipboard.writeText(pixData);
        showSuccess('Código PIX copiado!', 'Código copiado para a área de transferência.');
      } catch (error) {
        console.error('Erro ao copiar código PIX:', error);
        showError('Erro ao copiar código', 'Não foi possível copiar o código PIX.');
      }
    }
  };

  // Função para voltar ao depósito
  const handleBackToDeposit = () => {
    router.push('/deposit');
  };

  // Função para cancelar pagamento
  const handleCancelPayment = () => {
    if (confirm('Tem certeza que deseja cancelar este pagamento?')) {
      router.push('/deposit');
    }
  };

  // Renderizar loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Icon icon="heroicons:arrow-path" className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Carregando pagamento...
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Aguarde enquanto buscamos os detalhes do seu pagamento
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
            Erro ao carregar pagamento
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error}
          </p>
          <Button
            onClick={handleBackToDeposit}
            className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2"
          >
            Voltar ao Depósito
          </Button>
        </div>
      </div>
    );
  }

  // Renderizar página de pagamento
  if (payment) {
    const isPending = status === 'pending';
    const isPaid = status === 'paid';
    const isExpired = status === 'expired';

    return (
      <div className="min-h-screen py-8">
        <div className="max-w-2xl mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-8">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
              isPaid ? 'bg-green-100 dark:bg-green-900/30' : 
              isExpired ? 'bg-red-100 dark:bg-red-900/30' : 
              'bg-blue-100 dark:bg-blue-900/30'
            }`}>
              <Icon 
                icon={
                  isPaid ? "heroicons:check-circle" : 
                  isExpired ? "heroicons:x-circle" : 
                  "heroicons:credit-card"
                } 
                className={`w-10 h-10 ${
                  isPaid ? 'text-green-600 dark:text-green-400' : 
                  isExpired ? 'text-red-600 dark:text-red-400' : 
                  'text-blue-600 dark:text-blue-400'
                }`} 
              />
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {isPaid ? 'Pagamento Confirmado!' : 
               isExpired ? 'Pagamento Expirado' : 
               'Pagamento PIX'}
            </h1>
            
            <p className="text-gray-600 dark:text-gray-400">
              {isPaid ? 'Seu pagamento foi confirmado. Redirecionando para processamento...' : 
               isExpired ? 'O tempo para pagamento expirou' : 
               'Escaneie o QR Code ou copie a chave PIX para realizar o pagamento'}
            </p>
          </div>

          {/* Status do Pagamento */}
          {isPending && (
            <Card className="mb-6">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Status do Pagamento
                  </h2>
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-full text-sm font-medium">
                    Aguardando Pagamento
                  </span>
                </div>
                
                {/* Timer */}
                <div className="text-center mb-4">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {timeRemainingFormatted}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Tempo restante para pagamento
                  </div>
                </div>

                {/* Barra de progresso */}
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
                  <div 
                    className="bg-yellow-500 h-2 rounded-full transition-all duration-1000"
                    style={{ 
                      width: `${Math.max(0, ((timeRemaining / (30 * 60)) * 100))}%` 
                    }}
                  ></div>
                </div>

                {/* Botão para forçar pagamento (debug) */}
                <div className="text-center">
                  <Button
                    onClick={forcePayment}
                    disabled={monitorLoading}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 text-sm"
                  >
                    {monitorLoading ? (
                      <Icon icon="heroicons:arrow-path" className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Icon icon="heroicons:check" className="w-4 h-4 mr-2" />
                    )}
                    Simular Pagamento (Debug)
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Detalhes do Pagamento */}
          <Card className="mb-6">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Detalhes do Pagamento
              </h2>
              
              <div className="space-y-4">
                {/* Valor */}
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">
                    Valor:
                  </span>
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    R$ {payment.amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {/* ID do Pagamento */}
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">
                    ID do Pagamento:
                  </span>
                  <span className="font-mono text-sm text-gray-900 dark:text-white">
                    #{payment.id}
                  </span>
                </div>

                {/* Data de Criação */}
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">
                    Criado em:
                  </span>
                  <span className="text-gray-900 dark:text-white">
                    {new Date(payment.createdAt).toLocaleString('pt-BR')}
                  </span>
                </div>

                {/* Expira em */}
                {isPending && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400 font-medium">
                      Expira em:
                    </span>
                    <span className="text-gray-900 dark:text-white">
                      {new Date(payment.expiresAt).toLocaleString('pt-BR')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* QR Code */}
          {isPending && (
            <Card className="mb-6">
              <div className="p-6 text-center">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  QR Code PIX
                </h2>
                
                <div className="mb-4">
                  <img 
                    src={payment.qrCode} 
                    alt="QR Code PIX"
                    className="mx-auto w-64 h-64 border-2 border-gray-200 dark:border-gray-700 rounded-lg"
                  />
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Use o aplicativo do seu banco para escanear o QR Code
                </p>
                
                <Button
                  onClick={copyPixCode}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2"
                >
                  <Icon icon="heroicons:clipboard-document" className="w-4 h-4 mr-2" />
                  Copiar Código PIX
                </Button>
              </div>
            </Card>
          )}

          {/* Chave PIX */}
          {isPending && (
            <Card className="mb-6">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Chave PIX
                </h2>
                
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-lg text-gray-900 dark:text-white break-all">
                      {payment.pixKey}
                    </span>
                    <Button
                      onClick={copyPixKey}
                      className="ml-4 bg-gray-500 hover:bg-gray-600 text-white p-2"
                    >
                      <Icon icon="heroicons:clipboard-document" className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Copie esta chave e cole no aplicativo do seu banco para realizar o pagamento
                </p>
              </div>
            </Card>
          )}

          {/* Informações da Instituição */}
          <Card className="mb-6">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Informações da Instituição
              </h2>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">
                    Instituição:
                  </span>
                  <span className="text-gray-900 dark:text-white">
                    {payment.metadata.institution}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">
                    Tipo de Conta:
                  </span>
                  <span className="text-gray-900 dark:text-white">
                    {payment.metadata.accountType}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">
                    Beneficiário:
                  </span>
                  <span className="text-gray-900 dark:text-white">
                    {payment.metadata.beneficiary}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">
                    CNPJ:
                  </span>
                  <span className="font-mono text-gray-900 dark:text-white">
                    {payment.metadata.cnpj}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Ações */}
          <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
            {isPending && (
              <>
                <Button
                  onClick={handleCancelPayment}
                  className="bg-red-500 hover:bg-red-600 text-white px-6 py-3"
                >
                  <Icon icon="heroicons:x-mark" className="w-5 h-5 mr-2" />
                  Cancelar Pagamento
                </Button>
                
                <Button
                  onClick={handleBackToDeposit}
                  className="bg-slate-500 hover:bg-slate-600 text-white px-6 py-3"
                >
                  <Icon icon="heroicons:arrow-left" className="w-5 h-5 mr-2" />
                  Voltar ao Depósito
                </Button>
              </>
            )}
            
            {isPaid && (
              <Button
                onClick={redirectToTransaction}
                className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3"
              >
                <Icon icon="heroicons:arrow-right" className="w-5 h-5 mr-2" />
                Continuar para Blockchain
              </Button>
            )}
            
            {isExpired && (
              <Button
                onClick={handleBackToDeposit}
                className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3"
              >
                <Icon icon="heroicons:plus" className="w-5 h-5 mr-2" />
                Novo Depósito
              </Button>
            )}
          </div>

          {/* Informações Adicionais */}
          {isPending && (
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start space-x-3">
                <Icon icon="heroicons:information-circle" className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                    Como realizar o pagamento
                  </h3>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    <li>• Abra o aplicativo do seu banco</li>
                    <li>• Escolha a opção "PIX" ou "Pagar"</li>
                    <li>• Escaneie o QR Code ou cole a chave PIX</li>
                    <li>• Confirme o valor e os dados</li>
                    <li>• Realize o pagamento</li>
                  </ul>
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

export default PixPaymentPage;


