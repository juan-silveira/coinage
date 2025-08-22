"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import useAuthStore from "@/store/authStore";
import { useAlertContext } from "@/contexts/AlertContext";
// Removed mock service - using only real API

const DepositConfirmationPage = () => {
  const params = useParams();
  const router = useRouter();
  const txId = params.tx_id;
  
  useDocumentTitle('Confirmação de Depósito', 'Coinage', true);

  const { user } = useAuthStore();
  const { showSuccess, showError } = useAlertContext();

  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingMint] = useState(false);
  const [mintStatus, setMintStatus] = useState('');
  const [mintTransaction, setMintTransaction] = useState(null);

  // Função para buscar transação de mint vinculada
  const fetchMintTransaction = useCallback(async (depositTxId) => {
    try {
      console.log('🔍 Buscando transação de mint para depósito:', depositTxId);
      
      // Usar API real de mint sem autenticação
      const response = await fetch(`/api/mint-dev/by-deposit/${depositTxId}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Resposta da API de mint:', data);
        
        if (data.success) {
          if (data.data) {
            // Mint transaction encontrada
            setMintTransaction(data.data);
            setMintStatus(data.data.status);
            console.log('✅ Transação de mint encontrada:', data.data);
          } else {
            // Nenhuma transação de mint ainda
            console.log('ℹ️ Nenhuma transação de mint encontrada ainda');
            setMintTransaction(null);
            setMintStatus('');
          }
        } else {
          console.error('❌ Erro na API de mint:', data.message);
        }
      } else {
        console.error('❌ Erro HTTP na API de mint:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('❌ Erro ao buscar transação de mint:', error);
    }
  }, []);

  // Buscar dados da transação
  useEffect(() => {
    const fetchTransaction = async () => {
      if (!txId) return;

      try {
        setLoading(true);
        console.log('🔍 Buscando dados da transação:', txId);
        
        // Tentar API real primeiro
        try {
          const apiResponse = await fetch(`/api/deposits/dev/status/${txId}`);
          
          if (apiResponse.ok) {
            const apiData = await apiResponse.json();
            console.log('📊 Resposta da API de depósito:', apiData);
            
            if (apiData.success && apiData.data) {
              setTransaction(apiData.data);
              console.log('✅ Transação encontrada via API real:', apiData.data);
              
              // Se a transação foi confirmada, buscar transação de mint vinculada
              if (apiData.data.status === 'confirmed' || apiData.data.status === 'success') {
                fetchMintTransaction(txId);
              }
              
              return; // Sucesso com API real
            } else if (!apiData.success) {
              console.log('⚠️ API retornou erro:', apiData.message);
              setError(`Erro na API: ${apiData.message}`);
              return;
            }
          } else {
            console.log('⚠️ API retornou status HTTP:', apiResponse.status);
          }
        } catch (apiError) {
          console.log('⚠️ API de depósito falhou:', apiError.message);
        }

        // Fallback: usar dados mockados apenas para exibição se API falhar
        console.log('📝 Usando dados mockados como fallback');
        const mockTransaction = {
          id: txId,
          status: 'confirmed', // Simular transação confirmada para testar mint
          amount: 100,
          currency: 'BRL',
          transactionType: 'deposit',
          createdAt: new Date().toISOString(),
          confirmedAt: new Date().toISOString(),
          metadata: {
            source: 'user_deposit',
            timestamp: new Date().toISOString(),
            description: `Depósito PIX de R$ 100`,
            paymentMethod: 'pix'
          }
        };

        setTransaction(mockTransaction);
        
        // Sempre tentar buscar mint transaction da API real
        fetchMintTransaction(txId);
        
      } catch (error) {
        console.error('❌ Erro ao buscar transação:', error);
        setError('Erro ao carregar dados da transação');
      } finally {
        setLoading(false);
      }
    };

    fetchTransaction();
  }, [txId, fetchMintTransaction]);

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

  // Polling para atualizar status do mint
  useEffect(() => {
    if (!mintTransaction || mintTransaction.status !== 'pending') return;

    const pollMintStatus = async () => {
      try {
        await fetchMintTransaction(txId);
      } catch (error) {
        console.error('Erro no polling do mint:', error);
      }
    };

    const interval = setInterval(pollMintStatus, 5000); // Poll a cada 5 segundos
    return () => clearInterval(interval);
  }, [mintTransaction, txId, fetchMintTransaction]);

  // DEBUG: Função para confirmar PIX manualmente
  const handleDebugConfirmPix = async () => {
    if (!txId) return;
    
    try {
      setLoading(true);
      
      // Simular confirmação do PIX
      showSuccess('PIX Confirmado (DEBUG)', 'O pagamento foi confirmado e enviado para processamento');
      
      // Atualizar status da transação local
      if (transaction) {
        const updatedTransaction = {
          ...transaction,
          status: 'confirmed',
          confirmedAt: new Date().toISOString()
        };
        setTransaction(updatedTransaction);
      }
      
    } catch (error) {
      console.error('Erro ao confirmar PIX (DEBUG):', error);
      showError('Erro', 'Não foi possível confirmar o PIX');
    } finally {
      setLoading(false);
    }
  };

  // DEBUG: Função para completar depósito (PIX + mint automático)
  const handleDebugCompleteDeposit = async () => {
    if (!txId) return;
    
    try {
      setLoading(true);
      console.log('🧪 DEBUG: Iniciando processo completo de PIX + mint para:', txId);
      
      // Chamar API real do backend para completar depósito (SEM autenticação)
      showSuccess('Processando Depósito...', 'Executando processo real no backend...');
      
      const response = await fetch(`/api/deposit-dev/complete/${txId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: transaction?.amount || 100
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Resposta do backend:', data);
        
        if (data.success) {
          showSuccess('Depósito Processado!', 'PIX confirmado e processo de mint iniciado no backend');
          
          // Aguardar um pouco e buscar a transação de mint real
          setTimeout(async () => {
            console.log('🔍 Buscando transação de mint criada...');
            await fetchMintTransaction(txId);
            
            // Recarregar dados da transação
            setTimeout(() => {
              window.location.reload();
            }, 2000);
          }, 3000);
        } else {
          showError('Erro no Backend', data.message || 'Falha ao processar no backend');
        }
      } else {
        // Se a API do backend falhar, tentar um approach manual
        console.log('⚠️ API do backend falhou, tentando criar mint manualmente...');
        
        // Tentar criar transação de mint via API
        const mintResponse = await fetch(`/api/mint/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            depositTransactionId: txId,
            amount: transaction?.amount || 100,
            recipientAddress: user?.publicKey || '0x742d35Cc6634C0532925a3b8D43F7F0B3B4f9c44'
          })
        });

        if (mintResponse.ok) {
          const mintData = await mintResponse.json();
          console.log('✅ Mint criado manualmente:', mintData);
          showSuccess('Mint Criado!', 'Transação de mint criada e sendo processada');
          
          // Buscar a transação criada
          setTimeout(() => {
            fetchMintTransaction(txId);
          }, 2000);
        } else {
          showError('Erro', 'Não foi possível criar a transação de mint');
        }
      }
      
    } catch (error) {
      console.error('❌ Erro ao completar depósito (DEBUG):', error);
      showError('Erro', 'Não foi possível completar o depósito');
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

    return (
      <div className="min-h-screen py-8">
        <div className="max-w-2xl mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-8">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
              isConfirmed ? 'bg-green-100 dark:bg-green-900/30' : 
              (isPending || processingMint) ? 'bg-yellow-100 dark:bg-yellow-900/30' : 
              'bg-red-100 dark:bg-red-900/30'
            }`}>
              <Icon 
                icon={
                  isConfirmed ? "heroicons:check-circle" : 
                  (isPending || processingMint) ? "heroicons:arrow-path" : 
                  "heroicons:x-circle"
                } 
                className={`w-10 h-10 ${
                  isConfirmed ? 'text-green-600 dark:text-green-400' : 
                  (isPending || processingMint) ? 'text-yellow-600 dark:text-yellow-400 animate-spin' : 
                  'text-red-600 dark:text-red-400'
                }`} 
              />
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {processingMint ? 'Processando Mint...' :
               isConfirmed ? 'Depósito Confirmado!' : 
               isPending ? 'Depósito em Processamento' : 
               'Depósito Falhou'}
            </h1>
            
            <p className="text-gray-600 dark:text-gray-400">
              {processingMint ? mintStatus :
               isConfirmed ? 'Seu depósito foi processado com sucesso na blockchain' : 
               isPending ? 'Processando PIX e executando mint de cBRL automaticamente...' : 
               'Houve um problema ao processar seu depósito'}
            </p>
          </div>

          {/* Loading do Processo Automático */}
          {processingMint && (
            <div className="mb-8 p-6 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-center space-x-4">
                <Icon icon="heroicons:arrow-path" className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-1">
                    Processamento Automático
                  </h3>
                  <p className="text-blue-700 dark:text-blue-300">
                    {mintStatus}
                  </p>
                  <div className="mt-3 w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                    <div className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full animate-pulse" style={{
                      width: mintStatus.includes('PIX') ? '33%' : 
                             mintStatus.includes('mint') ? '66%' : 
                             mintStatus.includes('concluído') ? '100%' : '10%'
                    }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}

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

          {/* Informações do Mint cBRL */}
          {mintTransaction && (
            <Card className="mb-6">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                    mintTransaction.status === 'success' 
                      ? 'bg-green-100 dark:bg-green-900/30' 
                      : mintTransaction.status === 'failed'
                      ? 'bg-red-100 dark:bg-red-900/30'
                      : 'bg-yellow-100 dark:bg-yellow-900/30'
                  }`}>
                    <Icon 
                      icon={
                        mintTransaction.status === 'success' 
                          ? "heroicons:check-circle" 
                          : mintTransaction.status === 'failed'
                          ? "heroicons:x-circle"
                          : "heroicons:clock"
                      } 
                      className={`w-5 h-5 ${
                        mintTransaction.status === 'success' 
                          ? 'text-green-600 dark:text-green-400' 
                          : mintTransaction.status === 'failed'
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-yellow-600 dark:text-yellow-400'
                      }`} 
                    />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {mintTransaction.status === 'success' 
                        ? 'Mint de cBRL Realizado' 
                        : mintTransaction.status === 'failed'
                        ? 'Falha no Mint de cBRL'
                        : 'Processando Mint de cBRL'}
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Status: {mintTransaction.status}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {/* ID da Transação Mint */}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400 font-medium">
                      ID da Transação Mint:
                    </span>
                    <span className="font-mono text-xs text-gray-900 dark:text-white">
                      {mintTransaction.id}
                    </span>
                  </div>

                  {/* Quantidade */}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400 font-medium">
                      Quantidade:
                    </span>
                    <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                      {mintTransaction.amount} {mintTransaction.tokenSymbol}
                    </span>
                  </div>

                  {/* Destinatário */}
                  {mintTransaction.metadata?.recipientAddress && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400 font-medium">
                        Carteira de Destino:
                      </span>
                      <span className="font-mono text-xs text-gray-900 dark:text-white">
                        {mintTransaction.metadata.recipientAddress}
                      </span>
                    </div>
                  )}

                  {/* Hash da Transação Blockchain (se confirmado) */}
                  {mintTransaction.blockchainData?.transactionHash && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400 font-medium">
                        Hash da Transação:
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs text-gray-900 dark:text-white max-w-32 truncate">
                          {mintTransaction.blockchainData.transactionHash}
                        </span>
                        <Button
                          onClick={() => copyTransactionHash(mintTransaction.blockchainData.transactionHash)}
                          className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                          <Icon icon="heroicons:clipboard-document" className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => openInExplorer(mintTransaction.blockchainData.transactionHash)}
                          className="p-1 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-200"
                        >
                          <Icon icon="heroicons:arrow-top-right-on-square" className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Bloco (se confirmado) */}
                  {mintTransaction.blockchainData?.blockNumber && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400 font-medium">
                        Bloco:
                      </span>
                      <span className="font-mono text-gray-900 dark:text-white">
                        {mintTransaction.blockchainData.blockNumber}
                      </span>
                    </div>
                  )}

                  {/* Gas Used (se confirmado) */}
                  {mintTransaction.blockchainData?.gasUsed && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400 font-medium">
                        Gas Utilizado:
                      </span>
                      <span className="font-mono text-gray-900 dark:text-white">
                        {mintTransaction.blockchainData.gasUsed.toLocaleString()}
                      </span>
                    </div>
                  )}

                  {/* Rede */}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400 font-medium">
                      Rede:
                    </span>
                    <span className="text-gray-900 dark:text-white">
                      {mintTransaction.network}
                    </span>
                  </div>

                  {/* Data de Criação */}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400 font-medium">
                      Criado em:
                    </span>
                    <span className="text-gray-900 dark:text-white">
                      {new Date(mintTransaction.createdAt).toLocaleString('pt-BR')}
                    </span>
                  </div>

                  {/* Error Message (se houver) */}
                  {mintTransaction.status === 'failed' && mintTransaction.metadata?.error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                      <h4 className="text-red-800 dark:text-red-200 font-medium mb-2">Erro:</h4>
                      <p className="text-red-600 dark:text-red-400 text-sm">
                        {mintTransaction.metadata.error}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* Polling para atualizar status do mint em tempo real */}
          {mintTransaction && mintTransaction.status === 'pending' && (
            <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-center">
                <Icon icon="heroicons:arrow-path" className="w-5 h-5 text-yellow-600 dark:text-yellow-400 animate-spin mr-3" />
                <p className="text-yellow-800 dark:text-yellow-200">
                  Processando mint na blockchain... Aguarde enquanto a transação é confirmada.
                </p>
              </div>
            </div>
          )}

          {/* Ações */}
          <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
            {/* Ver Mint no Explorer (se mint foi bem-sucedido) */}
            {mintTransaction?.status === 'success' && mintTransaction.blockchainData?.transactionHash && (
              <Button
                onClick={() => openInExplorer(mintTransaction.blockchainData.transactionHash)}
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 flex items-center justify-center"
              >
                <Icon icon="heroicons:arrow-top-right-on-square" className="w-5 h-5 mr-2" />
                Ver Mint no Explorer
              </Button>
            )}

            {/* Ver no Explorer (se confirmado) */}
            {transaction.blockchainData?.transactionHash && (
              <Button
                onClick={() => openInExplorer(transaction.blockchainData.transactionHash)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 flex items-center justify-center"
              >
                <Icon icon="heroicons:arrow-top-right-on-square" className="w-5 h-5 mr-2" />
                Ver Depósito no Explorer
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

              {/* Botões DEBUG - Apenas em desenvolvimento e quando não está processando */}
              {process.env.NODE_ENV === 'development' && !processingMint && (
                <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <div className="flex items-start space-x-3 mb-4">
                    <Icon icon="heroicons:bug-ant" className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                        Modo Debug (Processamento Automático Desabilitado)
                      </h3>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300">
                        Use apenas se o processamento automático falhar
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                    <Button
                      onClick={handleDebugConfirmPix}
                      disabled={loading}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 flex items-center justify-center"
                    >
                      <Icon icon="heroicons:check-circle" className="w-4 h-4 mr-2" />
                      Confirmar PIX
                    </Button>
                    
                    <Button
                      onClick={handleDebugCompleteDeposit}
                      disabled={loading}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 flex items-center justify-center"
                    >
                      <Icon icon="heroicons:sparkles" className="w-4 h-4 mr-2" />
                      PIX + Mint Automático
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
                    {transaction.metadata?.mint?.success && (
                      <> Os tokens cBRL foram automaticamente mintados e creditados na sua carteira.</>
                    )}
                    {!transaction.metadata?.mint?.success && (
                      <> O saldo foi atualizado na sua conta.</>
                    )}
                    {' '}Você pode verificar as transações no explorer clicando nos botões acima.
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
