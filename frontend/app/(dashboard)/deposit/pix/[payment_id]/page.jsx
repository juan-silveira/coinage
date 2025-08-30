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
// import usePixPaymentMonitor from "@/hooks/usePixPaymentMonitor"; // Removido - usando lógica local
// Using fetch directly instead of api service to avoid interceptor issues

const PixPaymentPage = () => {
  const params = useParams();
  const router = useRouter();
  const transactionId = params.payment_id; // UUID real do PostgreSQL
  
  useDocumentTitle('Pagamento PIX', 'Coinage', true);

  const { user, accessToken } = useAuthStore();
  const { showSuccess, showError } = useAlertContext();
  const [isDark] = useDarkmode();

  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estado para controlar se já mostrou os alerts
  const [hasShownPaidAlert, setHasShownPaidAlert] = useState(false);
  const [hasShownExpiredAlert, setHasShownExpiredAlert] = useState(false);

  // Estado local para simular monitoramento (sem usar hook problemático)
  const [status, setStatus] = useState('pending');
  const [monitorLoading, setMonitorLoading] = useState(false);
  const [monitorError, setMonitorError] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(1800); // 30 minutos
  const [processingMint, setProcessingMint] = useState(false);
  const [mintStatus, setMintStatus] = useState('');
  
  // Formatação do tempo
  const timeRemainingFormatted = `${Math.floor(timeRemaining / 60)}:${(timeRemaining % 60).toString().padStart(2, '0')}`;
  
  // Função para forçar pagamento (desenvolvimento) - REDIRECIONA IMEDIATAMENTE
  const forcePayment = async () => {
    try {
      console.log('🔥 [PIX-DEBUG] Clique no botão - confirmando PIX primeiro');
      console.log('🔥 [PIX-DEBUG] TransactionId:', transactionId);
      console.log('🔥 [PIX-DEBUG] AccessToken disponível:', !!accessToken);
      
      // PRIMEIRO: Tentar endpoint de debug (sem JWT)
      console.log('🔄 [PIX-DEBUG] Tentando endpoint debug sem JWT primeiro...');
      
      try {
        const debugResponse = await fetch(`/api/deposits/dev/debug/complete-deposit/${transactionId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (debugResponse.ok) {
          const debugData = await debugResponse.json();
          console.log('✅ [PIX-DEBUG] Debug endpoint funcionou:', debugData);
          
          if (debugData.success) {
            showSuccess('PIX confirmado! Processando mint na blockchain...');
            router.push(`/deposit/tx/${transactionId}`);
            return;
          }
        } else {
          console.log('⚠️ [PIX-DEBUG] Debug endpoint falhou:', debugResponse.status);
        }
      } catch (debugError) {
        console.log('⚠️ [PIX-DEBUG] Debug endpoint erro:', debugError.message);
      }
      
      // SEGUNDO: Tentar endpoint normal com JWT
      console.log('🔄 [PIX-CONFIRM] Tentando endpoint normal com JWT...');
      
      const fetchResponse = await fetch('/api/deposits/confirm-pix', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken || ''}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          transactionId: transactionId,
          pixData: {
            pixId: `debug-pix-${Date.now()}`,
            payerDocument: '000.000.000-00',
            payerName: 'Usuario Debug Test',
            paidAmount: payment?.amount || 0
          }
        })
      });
      
      console.log('🔄 [PIX-CONFIRM] Response status:', fetchResponse.status);
      
      if (!fetchResponse.ok) {
        const errorText = await fetchResponse.text();
        console.log('❌ [PIX-CONFIRM] Error response:', errorText);
        throw new Error(`HTTP ${fetchResponse.status}: ${fetchResponse.statusText}`);
      }
      
      const responseData = await fetchResponse.json();
      const result = responseData;
      
      console.log('✅ [PIX-CONFIRM] PIX response:', result);
      
      if (result.success) {
        console.log('✅ [PIX-CONFIRM] PIX confirmado com sucesso:', result);
        showSuccess('PIX confirmado! Processando mint na blockchain...');
        
        // Redirecionar para página de status
        router.push(`/deposit/tx/${transactionId}`);
      } else {
        console.error('❌ [PIX-CONFIRM] Erro ao confirmar PIX:', result);
        showError('Erro ao confirmar PIX: ' + result.message);
      }
      
    } catch (error) {
      console.error('❌ [PIX-CONFIRM] Erro ao processar PIX:', error);
      showError('Erro ao processar PIX. Tente novamente. Detalhes: ' + error.message);
    }
  };
  
  // Função para redirecionar para transação
  const redirectToTransaction = () => {
    router.push(`/deposit/tx/${transactionId}`);
  };

  // Timer countdown
  useEffect(() => {
    if (status === 'pending') {
      const interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setStatus('expired');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [status]); // Removido timeRemaining para evitar loop

  // Buscar dados do pagamento
  useEffect(() => {
    const fetchPayment = async () => {
      if (!transactionId) return;

      console.log('🚀 [PIX] Recebeu transactionId:', transactionId);
      console.log('🚀 [PIX] Tipo do transactionId:', typeof transactionId);
      console.log('🚀 [PIX] Comprimento do transactionId:', transactionId?.length);
      
      // VERIFICAR SE É UM UUID VÁLIDO DO POSTGRES
      if (!transactionId || transactionId.startsWith('pix_')) {
        console.error('❌ [PIX] TransactionId inválido detectado:', transactionId);
        setError(`ID da transação inválido: ${transactionId}. Esperado UUID do PostgreSQL.`);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Usar fetch direto para evitar problemas com interceptors do axios
        console.log('🔍 [PIX] Fazendo requisição para:', `/api/deposits/dev/status/${transactionId}`);
        
        const fetchResponse = await fetch(`/api/deposits/dev/status/${transactionId}`, {
          headers: {
            'Authorization': `Bearer ${accessToken || ''}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!fetchResponse.ok) {
          throw new Error(`HTTP ${fetchResponse.status}: ${fetchResponse.statusText}`);
        }
        
        const responseData = await fetchResponse.json();
        console.log('✅ [PIX] Resposta do backend:', responseData);
        
        // Simular estrutura do axios para compatibilidade
        const response = { data: responseData };
        
        if (response.data.success && response.data.data) {
          const transaction = response.data.data;
          
          // Usar valores seguros com fallbacks
          const netAmount = parseFloat(transaction.net_amount || transaction.amount || 0);
          const totalAmount = parseFloat(transaction.totalAmount || transaction.amount || 0); // Usar totalAmount (valor bruto) se disponível
          const feeAmount = parseFloat(transaction.fee || 0);
          
          const pixData = {
            id: transaction.id,
            transactionId: transaction.id,
            status: transaction.status === 'confirmed' ? 'paid' : 'pending',
            amount: totalAmount > 0 ? totalAmount : netAmount, // Usar totalAmount (valor bruto com taxa) se disponível
            netAmount: netAmount, // Valor líquido
            feeAmount: feeAmount, // Taxa
            pixKey: 'contato@coinage.com.br',
            qrCode: `00020126580014br.gov.bcb.pix2536pix-qr.mercadopago.com/instore/o/v2/${transactionId}5204000053039865802BR5925Coinage Tecnologia6009Sao Paulo62070503***6304OZ0H`,
            createdAt: transaction.createdAt || new Date().toISOString(),
            expiresAt: transaction.createdAt ? 
              new Date(new Date(transaction.createdAt).getTime() + 30 * 60 * 1000).toISOString() :
              new Date(Date.now() + 30 * 60 * 1000).toISOString(),
            bankData: {
              name: 'Coinage Tecnologia Ltda',
              cnpj: '12.345.678/0001-90',
              bank: 'Banco Inter',
              agency: '0001',
              account: '1234567-8'
            },
            // Adicionar flag de erro se valores estão zerados
            error: totalAmount === 0 && netAmount === 0 ? 'Valores da transação não encontrados' : null
          };
          
          console.log('✅ [PIX] Dados PIX construídos:', pixData);
          setPayment(pixData);
          
          // Atualizar status local baseado no status da transação
          if (transaction.status === 'confirmed') {
            setStatus('paid');
          } else if (transaction.status === 'failed') {
            setStatus('expired');
          } else {
            setStatus('pending');
          }
          
        } else {
          throw new Error(response.data.message || 'Transação não encontrada no backend');
        }
        
      } catch (error) {
        console.error('❌ [PIX] Erro ao buscar dados da transação:', error);
        const errorMessage = error.message || 'Erro desconhecido';
        setError(`Erro ao carregar transação ${transactionId}: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    fetchPayment();
  }, [transactionId]);

  // Resetar estados de alert quando transactionId mudar
  useEffect(() => {
    setHasShownPaidAlert(false);
    setHasShownExpiredAlert(false);
  }, [transactionId]);

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
                  "fa6-brands:pix"
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
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    processingMint 
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                  }`}>
                    {processingMint ? 'Processando Mint' : 'Aguardando Pagamento'}
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

                {/* Botão para forçar pagamento (debug) - só funciona se amount > 0 */}
                <div className="text-center">
                  <Button
                    onClick={forcePayment}
                    disabled={monitorLoading || (payment.amount || 0) === 0 || payment.error}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 text-sm disabled:bg-gray-400"
                  >
                    {monitorLoading ? (
                      <Icon icon="heroicons:arrow-path" className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Icon icon="heroicons:check" className="w-4 h-4 mr-2" />
                    )}
                    {processingMint ? 'Processando...' : 'PIX + Mint Automático (Debug)'}
                  </Button>
                </div>
                
                {/* Status do Processamento Mint */}
                {processingMint && (
                  <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Icon icon="heroicons:arrow-path" className="w-6 h-6 text-blue-600 dark:text-blue-400 animate-spin flex-shrink-0" />
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-1">
                          Processamento Blockchain
                        </h3>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          {mintStatus}
                        </p>
                        <div className="mt-2 w-full bg-blue-200 dark:bg-blue-800 rounded-full h-1.5">
                          <div className="bg-blue-600 dark:bg-blue-400 h-1.5 rounded-full animate-pulse" style={{
                            width: mintStatus.includes('PIX') ? '33%' : 
                                   mintStatus.includes('mint') ? '66%' : 
                                   mintStatus.includes('concluído') ? '100%' : '10%'
                          }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
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
                {/* Erro nos dados */}
                {(payment.error || payment.amount === 0) && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg mb-4">
                    <div className="flex items-center space-x-3">
                      <Icon icon="heroicons:exclamation-triangle" className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0" />
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-red-800 dark:text-red-200 mb-1">
                          Erro nos dados do pagamento
                        </h3>
                        <p className="text-sm text-red-700 dark:text-red-300 mb-2">
                          {payment.error || 'Dados do pagamento não encontrados ou valor inválido (R$ 0,00)'}
                        </p>
                        {payment.solution && (
                          <p className="text-sm text-red-600 dark:text-red-400 font-medium mb-3">
                            💡 {payment.solution}
                          </p>
                        )}
                        {payment.instructions && (
                          <div className="text-sm text-red-700 dark:text-red-300">
                            <p className="font-medium mb-2">📋 Como resolver:</p>
                            <ul className="list-disc list-inside space-y-1 ml-4">
                              {payment.instructions.map((instruction, index) => (
                                <li key={index}>{instruction}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Valor */}
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">
                    Valor:
                  </span>
                  <span className={`text-2xl font-bold ${(payment.amount || 0) === 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                    R$ {(payment.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    {(payment.amount || 0) === 0 && <span className="text-sm ml-2">(ERRO)</span>}
                  </span>
                </div>

                {/* ID do Pagamento */}
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">
                    ID do Pagamento:
                  </span>
                  <span className="font-mono text-sm text-gray-900 dark:text-white">
                    #{payment.id || 'N/A'}
                  </span>
                </div>

                {/* Data de Criação */}
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">
                    Criado em:
                  </span>
                  <span className="text-gray-900 dark:text-white">
                    {payment.createdAt ? new Date(payment.createdAt).toLocaleString('pt-BR') : 'N/A'}
                  </span>
                </div>

                {/* Expira em */}
                {isPending && payment.expiresAt && (
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
                    {payment.bankData?.bank || 'Banco Inter'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">
                    Tipo de Conta:
                  </span>
                  <span className="text-gray-900 dark:text-white">
                    {payment.bankData?.agency || '0001'} / {payment.bankData?.account || '1234567-8'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">
                    Beneficiário:
                  </span>
                  <span className="text-gray-900 dark:text-white">
                    {payment.bankData?.name || 'Coinage Tecnologia Ltda'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">
                    CNPJ:
                  </span>
                  <span className="font-mono text-gray-900 dark:text-white">
                    {payment.bankData?.cnpj || '12.345.678/0001-90'}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* QR Code */}
          {isPending && (payment.amount || 0) > 0 && !payment.error && (
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
          {/* {isPending && (
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
          )} */}

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
                    <li>• Escolha a opção &quot;PIX&quot; ou &quot;Pagar&quot;</li>
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









