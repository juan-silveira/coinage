"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Textinput from '@/components/ui/Textinput';
import Icon from '@/components/ui/Icon';
import { useAlertContext } from '@/contexts/AlertContext';
import useAuthStore from '@/store/authStore';
import useCachedBalances from '@/hooks/useCachedBalances';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import useCurrencyMask from '@/hooks/useCurrencyMask';
import usePixKeys from '@/hooks/usePixKeys';
import api from '@/services/api';

const WithdrawPage = () => {
  useDocumentTitle('Saque', 'Coinage', true);
  
  const router = useRouter();
  const { user } = useAuthStore();
  const { getBalance, reloadBalances, balances, loading: balancesLoading } = useCachedBalances();
  const { pixKeys, loading: pixKeysLoading, getDefaultPixKey } = usePixKeys();
  const [balance, setBalance] = useState(0);
  
  // Estado para controlar timeout do skeleton
  const [skeletonTimeout, setSkeletonTimeout] = useState(false);
  
  // Timeout de 2.5 segundos para parar skeleton mesmo se API falhar
  useEffect(() => {
    const timer = setTimeout(() => {
      setSkeletonTimeout(true);
    }, 2500);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Só mostrar skeleton se está carregando E não passou do timeout E não tem dados válidos
  const shouldShowSkeleton = balancesLoading && !skeletonTimeout && (!balances || !balances.balancesTable || balances.isEmergency);
  const { showSuccess, showError, showInfo, showWarning } = useAlertContext();
  
  // Estados do wizard
  const [currentStep, setCurrentStep] = useState(0); // 0 = verificação PIX, 1 = valor, 2 = confirmação
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  
  // Estados PIX
  const [pixKey, setPixKey] = useState(null);
  
  // Hook para máscara de moeda
  const {
    value: withdrawAmount,
    formatDisplayValue,
    getNumericValue,
    isValidAmount: isValidAmountHook,
    clearValue,
    setValue,
    inputProps: currencyInputProps
  } = useCurrencyMask();
  
  // Estados para cálculo
  const [feeAmount, setFeeAmount] = useState(0); // Taxa será carregada do banco
  const [netAmount, setNetAmount] = useState(0);
  const [feeLoading, setFeeLoading] = useState(false);
  const [feeLoaded, setFeeLoaded] = useState(false); // Flag para saber se já carregou
  
  // Estados da transação
  const [withdrawalData, setWithdrawalData] = useState(null);

  // Carregar taxa inicial do banco de dados
  useEffect(() => {
    const loadInitialFee = async () => {
      if (!user?.id) return;
      
      try {
        console.log('🔍 [WithdrawPage] Carregando taxa inicial para usuário:', user.id);
        const response = await api.post('/api/withdrawals/calculate-fee', {
          amount: 100 // Valor de referência para obter a taxa
        });
        
        if (response.data.success) {
          console.log('✅ [WithdrawPage] Taxa inicial carregada:', response.data.data.fee);
          setFeeAmount(response.data.data.fee);
          setFeeLoaded(true);
        } else {
          console.error('❌ [WithdrawPage] Erro ao carregar taxa inicial:', response.data.message);
          setFeeAmount(1.0); // Fallback mínimo
          setFeeLoaded(true);
        }
      } catch (error) {
        console.error('❌ [WithdrawPage] Erro na chamada inicial:', error);
        setFeeAmount(1.0); // Fallback mínimo
        setFeeLoaded(true);
      }
    };

    loadInitialFee();
  }, [user?.id]);

  // Verificar chave PIX ao carregar e forçar reload de balances (apenas uma vez)
  useEffect(() => {
    let mounted = true;
    
    if (user?.id && user?.publicKey) {
      checkUserPixKey();
      
      // Usar timeout para evitar múltiplas chamadas simultâneas
      const timer = setTimeout(() => {
        if (mounted) {
          console.log('[WITHDRAW] Carregando balances para usuário:', user.id);
          reloadBalances(false); // Usar cache se disponível
        }
      }, 100);
      
      return () => {
        mounted = false;
        clearTimeout(timer);
      };
    }
  }, [user?.id, user?.publicKey]); // Apenas quando ID ou publicKey mudarem

  // Atualizar PIX key quando os dados do hook mudarem
  useEffect(() => {
    if (!pixKeysLoading && pixKeys.length > 0) {
      const defaultPixKey = getDefaultPixKey();
      if (defaultPixKey) {
        setPixKey(defaultPixKey);
        if (currentStep === 0) {
          setCurrentStep(1); // Ir direto para seleção de valor
        }
      }
    }
  }, [pixKeys, pixKeysLoading, getDefaultPixKey, currentStep]);

  // Atualizar balance quando balances mudar
  useEffect(() => {
    // CRÍTICO: Só processar se user?.id estiver disponível
    if (!user?.id) return;
    
    if (balances && balances.balancesTable && balances.userId === user.id) {
      const cbrlBalance = parseFloat(getBalance('cBRL') || 0);
      setBalance(cbrlBalance);
    } else if (balances && balances.userId && balances.userId !== user.id) {
      // CRÍTICO: Detectou balances de outro usuário!
      console.error('[WITHDRAW] ERRO CRÍTICO: Balances de outro usuário detectado!');
      console.error('[WITHDRAW] Balance userId:', balances?.userId, 'User atual:', user?.id);
      setBalance(0); // Forçar zero por segurança
      reloadBalances(false); // Tentar usar cache primeiro
    }
  }, [balances, user?.id, getBalance, reloadBalances]);

  // Buscar taxa real do backend quando o valor mudar (com debounce)
  useEffect(() => {
    const amount = getNumericValue();
    console.log('🔍 [useEffect] Valor mudou:', amount, 'withdrawAmount:', withdrawAmount);
    
    if (amount > 0) {
      console.log('🔍 [useEffect] Valor > 0, iniciando busca da taxa');
      setFeeLoading(true);
      // Debounce para evitar muitas chamadas
      const timeoutId = setTimeout(() => {
        console.log('🔍 [useEffect] Timeout executado, chamando fetchWithdrawFee');
        fetchWithdrawFee(amount);
      }, 500); // Esperar 500ms após parar de digitar
      
      return () => {
        console.log('🔍 [useEffect] Cleanup - cancelando timeout');
        clearTimeout(timeoutId);
      };
    } else {
      console.log('🔍 [useEffect] Valor <= 0, resetando net amount');
      setNetAmount(0);
      setFeeLoading(false);
    }
  }, [withdrawAmount]);

  // Calcular valor líquido quando a taxa mudar
  useEffect(() => {
    const amount = getNumericValue();
    if (amount > 0 && feeAmount >= 0) {
      const net = Math.max(0, amount - feeAmount);
      setNetAmount(net);
    } else {
      setNetAmount(0);
    }
  }, [feeAmount, withdrawAmount]);

  // Função para buscar taxa do backend
  const fetchWithdrawFee = async (amount) => {
    try {
      console.log('🔍 [fetchWithdrawFee] Buscando taxa para valor:', amount);
      console.log('🔍 [fetchWithdrawFee] User ID:', user?.id);
      console.log('🔍 [fetchWithdrawFee] User authenticated:', !!user);
      
      const response = await api.post('/api/withdrawals/calculate-fee', {
        amount: amount
      });
      
      console.log('🔍 [fetchWithdrawFee] Resposta do backend:', response.data);
      
      if (response.data.success) {
        console.log('✅ [fetchWithdrawFee] Taxa obtida:', response.data.data.fee);
        setFeeAmount(response.data.data.fee);
      } else {
        console.error('❌ [fetchWithdrawFee] Erro ao calcular taxa:', response.data.message);
        // Manter a taxa carregada inicialmente, não sobrescrever
      }
    } catch (error) {
      console.error('❌ [fetchWithdrawFee] Erro na chamada API:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers
        }
      });
      // Manter a taxa carregada inicialmente, não sobrescrever
    } finally {
      setFeeLoading(false);
    }
  };

  // Função de teste para chamar diretamente no console
  window.testFeeAPI = async () => {
    console.log('🧪 [TESTE] Testando API de taxa...');
    await fetchWithdrawFee(100);
  };

  const checkUserPixKey = () => {
    // A verificação agora é feita pelo hook usePixKeys
    // Se não há PIX keys carregadas e não está carregando, mostrar tela de cadastro
    if (!pixKeysLoading && pixKeys.length === 0) {
      setCurrentStep(0);
    }
  };

  const handlePixKeySuccess = (pixKeyData) => {
    setPixKey(pixKeyData);
    setCurrentStep(1);
    showSuccess('Chave PIX cadastrada', 'Agora você pode realizar saques');
  };

  const handleMaxAmount = () => {
    if (balance > 0) {
      // Considerar o saldo máximo
      const maxWithdrawable = Math.max(0, balance);
      // Usar o valor formatado diretamente
      setValue(maxWithdrawable.toString());
    }
  };

  const isValidAmount = () => {
    const amount = getNumericValue();
    return amount >= 10 && amount <= balance;
  };

  const handleContinueToConfirmation = () => {
    const amount = getNumericValue();
    
    // Validações
    if (amount < 10) {
      showError('Valor mínimo', 'O valor mínimo para saque é R$ 10,00');
      return;
    }
    
    if (amount > balance) {
      showError('Saldo insuficiente', `Seu saldo disponível é de ${formatDisplayValue(balance)}`);
      return;
    }
    
    // Avançar para confirmação
    setCurrentStep(2);
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleConfirmWithdraw = async () => {
    const amount = getNumericValue();
    
    if (!pixKey) {
      showError('Chave PIX não cadastrada');
      setCurrentStep(0);
      return;
    }
    
    if (!isValidAmount()) {
      showError('Valor inválido');
      setCurrentStep(1);
      return;
    }

    setProcessing(true);
    
    try {
      showInfo('Iniciando saque', 'Preparando transação...');
      
      // 1. Iniciar o saque usando o serviço API configurado
      const initiateResponse = await api.post('/api/withdrawals', {
        amount: amount,
        pixKey: pixKey.keyValue,
        userId: user?.id
      });
      
      if (!initiateResponse.data.success) {
        throw new Error(initiateResponse.data.message || 'Erro ao iniciar saque');
      }
      
      const withdrawalId = initiateResponse.data.data.withdrawalId;
      
      showInfo('Saque iniciado', 'Executando queima de tokens na blockchain...');
      
      // 2. Confirmar o saque (executa burn + PIX)
      const confirmResponse = await api.post('/api/withdrawals/confirm', {
        withdrawalId: withdrawalId
      });
      
      if (!confirmResponse.data.success) {
        throw new Error(confirmResponse.data.message || 'Erro ao confirmar saque');
      }
      
      const withdrawalResult = confirmResponse.data.data;
      
      setWithdrawalData(withdrawalResult);
      
      // Atualizar saldos após o saque (forçar refresh após transação)
      reloadBalances(true);
      
      showSuccess(
        'Saque realizado com sucesso!', 
        `Valor enviado via PIX para sua chave cadastrada`
      );
      
      // Redirecionar para página de confirmação após 3 segundos
      setTimeout(() => {
        router.push(`/withdraw/receipt/${withdrawalId}`);
      }, 3000);
      
    } catch (error) {
      console.error('Erro no saque:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Tente novamente mais tarde';
      showError('Erro ao processar saque', errorMessage);
      setProcessing(false);
    }
  };

  const handleChangePixKey = () => {
    router.push('/withdraw/pix-key');
  };

  // Renderizar conteúdo baseado no passo atual
  const renderStepContent = () => {
    // Passo 0: Verificar/Cadastrar chave PIX
    if (currentStep === 0) {
      return (
        <div className="max-w-2xl mx-auto">
          <Card>
            <div className="text-center py-12">
              <div className="mb-6">
                <div className="mx-auto w-20 h-20 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
                  <Icon icon="fa6-brands:pix" className="h-10 w-10 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Cadastre sua Chave PIX
              </h2>
              
              <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                Para realizar saques, você precisa ter uma chave PIX cadastrada. 
                A chave deve pertencer ao mesmo CPF da sua conta.
              </p>
              
              <div className="flex flex-col space-y-4">
                <Button
                  onClick={() => router.push('/withdraw/pix-key')}
                  className="bg-primary-500 hover:bg-primary-600 text-white px-8 py-3"
                >
                  <Icon icon="heroicons:plus" className="w-5 h-5 mr-2" />
                  Cadastrar Chave PIX
                </Button>
                
                {pixKeysLoading && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Verificando chaves PIX cadastradas...
                  </p>
                )}
              </div>
            </div>
          </Card>
        </div>
      );
    }
    
    // Passo 1: Selecionar valor
    if (currentStep === 1) {
      return (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Valor do Saque
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Digite o valor em cBRL que deseja sacar
            </p>
          </div>

          <div className="max-w-md mx-auto">
            {/* Card de saldo disponível */}
            <Card className="mb-6">
              <div className="text-center py-4">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  Saldo disponível
                </p>
                {shouldShowSkeleton ? (
                  <div className="flex justify-center mb-2">
                    <div className="h-9 w-40 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-500 rounded animate-pulse"></div>
                  </div>
                ) : balance === 0 || !balance ? (
                  <div className="text-2xl font-semibold text-gray-400 dark:text-gray-500">
                    <div className="flex items-center justify-center space-x-3">
                      <div className="w-5 h-5 border-2 border-primary-400 border-t-transparent rounded-full animate-spin"></div>
                      <span>Verificando saldo...</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {formatDisplayValue(balance || 0)}
                  </div>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {balance === 0 || !balance ? (
                    <span className="flex items-center justify-center space-x-1">
                      <span>Sincronizando com a blockchain...</span>
                    </span>
                  ) : (
                    <span>em cBRL</span>
                  )}
                </p>
              </div>
            </Card>

            {/* Input de valor */}
            <div className="space-y-4">
              <div>
                <label className="block capitalize form-label mb-2">
                  Valor do Saque (cBRL)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    {...currencyInputProps}
                    className="form-control py-3 pr-20 text-center text-2xl font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-md text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={handleMaxAmount}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-primary-500 hover:bg-primary-600 text-white text-sm rounded transition-colors"
                  >
                    MAX
                  </button>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-gray-500">Mínimo: R$ 10,00</span>
                  <span className="text-gray-500">
                    Taxa: {feeLoading ? 'Calculando...' : 
                           !feeLoaded && feeAmount === 0 ? 'Carregando...' : 
                           formatDisplayValue(feeAmount)}
                  </span>
                </div>
              </div>

              {/* Chave PIX cadastrada */}
              {pixKey && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Chave PIX cadastrada
                      </p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {pixKey.keyType === 'cpf' ? 'CPF' : 
                         pixKey.keyType === 'email' ? 'E-mail' :
                         pixKey.keyType === 'phone' ? 'Telefone' : 'Chave aleatória'}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {pixKey.keyValue}
                      </p>
                      {pixKey.bankName && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {pixKey.bankName}
                        </p>
                      )}
                    </div>
                    <Button
                      onClick={handleChangePixKey}
                      size="sm"
                      variant="secondary"
                    >
                      Alterar
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Botões de ação */}
            <div className="flex justify-center mt-8">
              <Button
                onClick={handleContinueToConfirmation}
                disabled={!isValidAmount() || balance === 0 || !balance}
                className="bg-primary-500 hover:bg-primary-600 text-white px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
{balance === 0 || !balance ? 'Verificando saldo...' : 'Continuar'}
              </Button>
            </div>
          </div>
        </div>
      );
    }
    
    // Passo 2: Confirmação
    if (currentStep === 2) {
      const amount = getNumericValue();
      
      return (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Confirmar Saque
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Revise os detalhes antes de confirmar
            </p>
          </div>

          <div className="max-w-md mx-auto">
            <Card className="p-6">
              <div className="space-y-4">
                {/* Valor solicitado */}
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">
                    Valor solicitado:
                  </span>
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    {formatDisplayValue(amount)}
                  </span>
                </div>

                {/* Taxa */}
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">
                    Taxa de saque:
                  </span>
                  <span className="text-red-600 dark:text-red-400">
                    - {formatDisplayValue(feeAmount)}
                  </span>
                </div>

                <hr className="border-gray-200 dark:border-gray-700" />

                {/* Valor final */}
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-green-600 dark:text-green-400">
                    Você receberá:
                  </span>
                  <span className="text-xl font-bold text-green-600 dark:text-green-400">
                    {formatDisplayValue(netAmount)}
                  </span>
                </div>

                {/* Chave PIX */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mt-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                    Enviando para:
                  </p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {pixKey?.keyType === 'cpf' ? 'CPF' : 
                     pixKey?.keyType === 'email' ? 'E-mail' :
                     pixKey?.keyType === 'phone' ? 'Telefone' : 'Chave'}: {pixKey?.keyValue}
                  </p>
                </div>

                {/* Aviso importante */}
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mt-4">
                  <p className="text-sm text-yellow-800 dark:text-yellow-300">
                    <strong>Importante:</strong> Ao confirmar, {formatDisplayValue(amount)} cBRL serão 
                    queimados da sua carteira e {formatDisplayValue(netAmount)} serão enviados via PIX.
                  </p>
                </div>
              </div>
            </Card>

            {/* Botões de ação */}
            <div className="flex justify-center space-x-4 mt-6">
              <Button
                onClick={handleBack}
                disabled={processing}
                className="bg-slate-500 hover:bg-slate-600 text-white px-8 py-3"
              >
                Voltar
              </Button>

              <Button
                onClick={handleConfirmWithdraw}
                disabled={processing}
                className="bg-primary-500 hover:bg-primary-600 text-white px-8 py-3"
              >
                {processing ? (
                  <div className="flex items-center">
                    <Icon icon="heroicons:arrow-path" className="w-5 h-5 animate-spin mr-2" />
                    <span>Processando...</span>
                  </div>
                ) : (
                  'Confirmar Saque'
                )}
              </Button>
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Saque
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Transforme seus cBRL em reais e receba via PIX
        </p>
      </div>

      {/* Progress bar - só mostrar após ter PIX cadastrado */}
      {currentStep > 0 && (
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-medium ${currentStep >= 1 ? 'text-primary-600' : 'text-gray-400'}`}>
              Valor
            </span>
            <span className={`text-sm font-medium ${currentStep >= 2 ? 'text-primary-600' : 'text-gray-400'}`}>
              Confirmação
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep - 1) / 1) * 100}%` }}
            />
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        {renderStepContent()}
      </div>

    </div>
  );
};

export default WithdrawPage;