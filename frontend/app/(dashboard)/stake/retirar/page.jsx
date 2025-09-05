"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Textinput from '@/components/ui/Textinput';
import { ArrowDownCircle, AlertTriangle, Info } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAlertContext } from '@/contexts/AlertContext';
import api from '@/services/api';

const RetirarPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const contractAddress = searchParams.get('contract');
  const network = searchParams.get('network') || 'testnet';
  
  const { user } = useAuth();
  const { showSuccess, showError } = useAlertContext();
  
  const [loading, setLoading] = useState(false);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [amount, setAmount] = useState('');
  const [totalStakeBalance, setTotalStakeBalance] = useState('0');
  const [allowPartialWithdrawal, setAllowPartialWithdrawal] = useState(false);
  const [contractInfo, setContractInfo] = useState(null);
  
  const userAddress = user?.walletAddress || user?.blockchainAddress || user?.publicKey;

  useEffect(() => {
    if (!contractAddress) {
      showError('Contrato não especificado');
      router.push('/investments');
      return;
    }
    loadStakeInfo();
  }, [contractAddress]);

  const loadStakeInfo = async () => {
    try {
      setLoadingBalance(true);
      
      // Buscar saldo em stake
      const balanceResponse = await api.post('/api/contracts/read', {
        contractAddress: contractAddress,
        functionName: 'getTotalStakeBalance',
        params: [userAddress],
        network: network
      });

      if (balanceResponse.data.success) {
        const balance = balanceResponse.data.data?.result || '0';
        // Converter de wei para decimal
        const balanceInEther = (parseFloat(balance) / 10**18).toString();
        setTotalStakeBalance(balanceInEther);
      }

      // Verificar se permite retirada parcial
      const partialResponse = await api.post('/api/contracts/read', {
        contractAddress: contractAddress,
        functionName: 'allowPartialWithdrawal',
        params: [],
        network: network
      });

      if (partialResponse.data.success) {
        const allowsPartial = partialResponse.data.data?.result === true;
        setAllowPartialWithdrawal(allowsPartial);
        
        // Se não permite parcial, setar o amount para o total
        if (!allowsPartial) {
          const balance = balanceResponse.data.data?.result || '0';
          const balanceInEther = (parseFloat(balance) / 10**18).toString();
          setAmount(balanceInEther);
        }
      }

      setContractInfo({
        address: contractAddress,
        network: network,
        name: 'Pedacinho Pratique'
      });
    } catch (error) {
      console.error('Error loading stake info:', error);
      showError('Erro ao carregar informações de stake');
    } finally {
      setLoadingBalance(false);
    }
  };

  const handleUnstake = async () => {
    try {
      if (!amount || parseFloat(amount) <= 0) {
        showError('Por favor, insira um valor válido');
        return;
      }

      if (parseFloat(amount) > parseFloat(totalStakeBalance)) {
        showError('Valor maior que o saldo em stake');
        return;
      }

      setLoading(true);
      
      // Converter para wei (18 decimais)
      const amountInWei = (parseFloat(amount) * 10**18).toString();
      
      const response = await api.post('/api/contracts/write', {
        contractAddress: contractAddress,
        functionName: 'unstake',
        params: [userAddress, amountInWei],
        network: network,
        payGasFor: userAddress // Admin paga o gás
      });

      if (response.data.success) {
        showSuccess('Retirada realizada com sucesso!');
        router.push('/investments');
      } else {
        throw new Error(response.data.message || 'Erro ao realizar retirada');
      }
    } catch (error) {
      console.error('Error unstaking:', error);
      showError(error.message || 'Erro ao realizar retirada');
    } finally {
      setLoading(false);
    }
  };

  const formatBalance = (balance) => {
    const parts = balance.toString().split('.');
    const integerPart = parts[0];
    const decimalPart = parts[1] || '000000';
    const formattedIntegerPart = Number(integerPart).toLocaleString('pt-BR');
    return `${formattedIntegerPart},${decimalPart.padEnd(6, '0').slice(0, 6)}`;
  };

  const handleMaxAmount = () => {
    setAmount(totalStakeBalance);
  };

  if (loadingBalance) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-6">
        <Button
          icon="heroicons:arrow-left"
          className="btn-outline-dark"
          onClick={() => router.push('/investments')}
        />
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Retirar do Stake
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Retire seus tokens do stake para sua carteira
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coluna Esquerda - Formulário */}
        <div className="space-y-6">
          <Card title="Informações da Retirada">
            <div className="space-y-4">
              <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                <div className="flex items-start space-x-3">
                  <ArrowDownCircle className="text-orange-600 dark:text-orange-400 mt-1" size={20} />
                  <div>
                    <h4 className="font-medium text-orange-900 dark:text-orange-300">
                      Retirada de Stake
                    </h4>
                    <p className="text-sm text-orange-700 dark:text-orange-400 mt-1">
                      Seus tokens serão desbloqueados e enviados para sua carteira.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Contrato:</span>
                  <span className="font-mono text-xs">
                    {contractAddress?.slice(0, 6)}...{contractAddress?.slice(-4)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Rede:</span>
                  <span className="font-medium">{network}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Taxa de gás:</span>
                  <span className="text-green-600 dark:text-green-400 font-medium">
                    Grátis (pago pelo admin)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Retirada parcial:</span>
                  <span className={`font-medium ${allowPartialWithdrawal ? 'text-green-600' : 'text-red-600'}`}>
                    {allowPartialWithdrawal ? 'Permitida' : 'Não permitida (retirada total obrigatória)'}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          <Card title="Valor da Retirada">
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600 dark:text-gray-400">Saldo em stake:</span>
                  <span className="font-bold">
                    {formatBalance(totalStakeBalance)} PCN
                  </span>
                </div>
                {parseFloat(totalStakeBalance) > 0 && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Este é o valor total que você tem investido neste contrato
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Valor para retirar (PCN) {!allowPartialWithdrawal && '- Total obrigatório'}
                </label>
                <div className="flex space-x-2">
                  <Textinput
                    type="number"
                    placeholder="0.000000"
                    value={amount}
                    onChange={(e) => allowPartialWithdrawal ? setAmount(e.target.value) : null}
                    className="flex-1"
                    step="0.000001"
                    min="0"
                    max={totalStakeBalance}
                    disabled={!allowPartialWithdrawal}
                    readOnly={!allowPartialWithdrawal}
                  />
                  {allowPartialWithdrawal && (
                    <Button
                      text="Máximo"
                      className="btn-outline-primary"
                      onClick={handleMaxAmount}
                    />
                  )}
                </div>
                {amount && (
                  <div className="mt-2 text-sm">
                    {parseFloat(amount) > parseFloat(totalStakeBalance) ? (
                      <span className="text-red-500">Valor excede o saldo em stake</span>
                    ) : parseFloat(amount) <= 0 ? (
                      <span className="text-amber-500">Insira um valor maior que zero</span>
                    ) : (
                      <span className="text-green-500">Valor válido para retirada</span>
                    )}
                  </div>
                )}
              </div>

              {!allowPartialWithdrawal && (
                <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400 mt-0.5" />
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      Este contrato não permite retirada parcial. 
                      Você deve retirar todo o valor em stake de uma só vez.
                    </p>
                  </div>
                </div>
              )}

              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <div className="flex items-start space-x-2">
                  <Info size={16} className="text-blue-600 dark:text-blue-400 mt-0.5" />
                  <p className="text-xs text-blue-700 dark:text-blue-400">
                    Após a retirada, os tokens serão enviados diretamente para sua carteira.
                    Taxas de penalidade podem se aplicar dependendo das regras do contrato.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Coluna Direita - Resumo */}
        <div className="space-y-6">
          <Card title="Resumo da Operação">
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-lg text-white">
                <div className="text-sm opacity-90 mb-1">Valor a retirar</div>
                <div className="text-3xl font-bold">
                  {amount || '0'} PCN
                </div>
                {amount && parseFloat(totalStakeBalance) > parseFloat(amount) && (
                  <div className="text-sm opacity-90 mt-2">
                    Restará em stake: {formatBalance(parseFloat(totalStakeBalance) - parseFloat(amount))} PCN
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">Tipo de operação:</span>
                  <span className="font-medium">Unstake</span>
                </div>
                <div className="flex justify-between py-2 border-b dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">Tempo de processamento:</span>
                  <span className="font-medium">Imediato</span>
                </div>
                <div className="flex justify-between py-2 border-b dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">Destino dos tokens:</span>
                  <span className="font-medium">Sua carteira</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600 dark:text-gray-400">Status:</span>
                  <span className="font-medium text-orange-600">
                    {parseFloat(totalStakeBalance) > 0 ? 'Pronto para retirar' : 'Sem saldo em stake'}
                  </span>
                </div>
              </div>

              {parseFloat(totalStakeBalance) === 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle size={16} className="text-red-600 dark:text-red-400 mt-0.5" />
                    <div className="text-sm text-red-700 dark:text-red-400">
                      <strong>Atenção:</strong> Você não possui tokens em stake neste contrato.
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertTriangle size={16} className="text-red-600 dark:text-red-400 mt-0.5" />
                  <div className="text-sm text-red-700 dark:text-red-400">
                    <strong>Aviso importante:</strong>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>Esta ação não pode ser desfeita</li>
                      <li>Você deixará de receber rewards sobre o valor retirado</li>
                      <li>Verifique as regras de penalidade do contrato</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <Button
                  text="Cancelar"
                  className="btn-outline-dark flex-1"
                  onClick={() => router.push('/investments')}
                  disabled={loading}
                />
                <Button
                  text={loading ? "Processando..." : "Confirmar Retirada"}
                  className="btn-danger flex-1"
                  onClick={handleUnstake}
                  disabled={
                    !amount || 
                    parseFloat(amount) <= 0 || 
                    parseFloat(amount) > parseFloat(totalStakeBalance) ||
                    parseFloat(totalStakeBalance) === 0 ||
                    loading
                  }
                  isLoading={loading}
                />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RetirarPage;