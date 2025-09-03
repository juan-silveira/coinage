"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Textinput from '@/components/ui/Textinput';
import { ArrowLeft, PiggyBank, Info, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAlertContext } from '@/contexts/AlertContext';
import useCachedBalances from '@/hooks/useCachedBalances';
import api from '@/services/api';

const InvestirPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const contractAddress = searchParams.get('contract');
  const network = searchParams.get('network') || 'testnet';
  
  const { user } = useAuth();
  const { showSuccess, showError } = useAlertContext();
  const { getBalance, loading: balancesLoading } = useCachedBalances();
  
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState('');
  const [contractInfo, setContractInfo] = useState(null);
  const [loadingContract, setLoadingContract] = useState(true);
  
  const pcnBalance = parseFloat(getBalance('PCN')) || 0;
  const userAddress = user?.walletAddress || user?.blockchainAddress || user?.publicKey;

  useEffect(() => {
    if (!contractAddress) {
      showError('Contrato não especificado');
      router.push('/investments');
      return;
    }
    loadContractInfo();
  }, [contractAddress]);

  const loadContractInfo = async () => {
    try {
      setLoadingContract(true);
      // Aqui você pode carregar informações adicionais do contrato se necessário
      setContractInfo({
        address: contractAddress,
        network: network,
        name: 'Pedacinho Pratique'
      });
    } catch (error) {
      console.error('Error loading contract:', error);
      showError('Erro ao carregar informações do contrato');
    } finally {
      setLoadingContract(false);
    }
  };

  const handleStake = async () => {
    try {
      if (!amount || parseFloat(amount) <= 0) {
        showError('Por favor, insira um valor válido');
        return;
      }

      if (parseFloat(amount) > pcnBalance) {
        showError('Saldo insuficiente');
        return;
      }

      setLoading(true);
      
      // Converter para wei (18 decimais)
      const amountInWei = (parseFloat(amount) * 10**18).toString();
      
      const response = await api.post('/api/contracts/write', {
        contractAddress: contractAddress,
        functionName: 'stake',
        params: [
          userAddress,
          amountInWei,
          '0' // customTimestamp sempre 0 para usuários comuns
        ],
        network: network,
        payGasFor: userAddress // Admin paga o gás
      });

      if (response.data.success) {
        showSuccess('Investimento realizado com sucesso!');
        router.push('/investments');
      } else {
        throw new Error(response.data.message || 'Erro ao realizar investimento');
      }
    } catch (error) {
      console.error('Error staking:', error);
      showError(error.message || 'Erro ao realizar investimento');
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
    setAmount(pcnBalance.toString());
  };

  if (loadingContract) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
            Investir em Stake
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Invista seus PCN para gerar rendimentos passivos
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coluna Esquerda - Formulário */}
        <div className="space-y-6">
          <Card title="Informações do Investimento">
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div className="flex items-start space-x-3">
                  <PiggyBank className="text-blue-600 dark:text-blue-400 mt-1" size={20} />
                  <div>
                    <h4 className="font-medium text-blue-900 dark:text-blue-300">
                      Stake de PCN
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                      Seus tokens serão bloqueados no contrato inteligente e começarão a gerar rendimentos imediatamente.
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
              </div>
            </div>
          </Card>

          <Card title="Valor do Investimento">
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600 dark:text-gray-400">Saldo disponível:</span>
                  <span className="font-bold">
                    {balancesLoading ? (
                      <div className="h-4 w-20 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
                    ) : (
                      formatBalance(pcnBalance) + ' PCN'
                    )}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Valor para investir (PCN)</label>
                <div className="flex space-x-2">
                  <Textinput
                    type="number"
                    placeholder="0.000000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="flex-1"
                    step="0.000001"
                    min="0"
                    max={pcnBalance}
                  />
                  <Button
                    text="Máximo"
                    className="btn-outline-primary"
                    onClick={handleMaxAmount}
                    disabled={balancesLoading}
                  />
                </div>
                {amount && (
                  <div className="mt-2 text-sm">
                    {parseFloat(amount) > pcnBalance ? (
                      <span className="text-red-500">Saldo insuficiente</span>
                    ) : parseFloat(amount) <= 0 ? (
                      <span className="text-amber-500">Insira um valor maior que zero</span>
                    ) : (
                      <span className="text-green-500">Valor válido para investimento</span>
                    )}
                  </div>
                )}
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
                <div className="flex items-start space-x-2">
                  <Info size={16} className="text-amber-600 dark:text-amber-400 mt-0.5" />
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    Após investir, seus tokens ficarão bloqueados no contrato. 
                    Você poderá acompanhar seus rendimentos e solicitar retiradas conforme as regras do contrato.
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
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-lg text-white">
                <div className="text-sm opacity-90 mb-1">Valor a investir</div>
                <div className="text-3xl font-bold">
                  {amount || '0'} PCN
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">Tipo de operação:</span>
                  <span className="font-medium">Stake</span>
                </div>
                <div className="flex justify-between py-2 border-b dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">Tempo de bloqueio:</span>
                  <span className="font-medium">Conforme contrato</span>
                </div>
                <div className="flex justify-between py-2 border-b dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">Rendimento estimado:</span>
                  <span className="font-medium text-green-600">Variável</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600 dark:text-gray-400">Status:</span>
                  <span className="font-medium text-blue-600">Pronto para investir</span>
                </div>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertCircle size={16} className="text-green-600 dark:text-green-400 mt-0.5" />
                  <div className="text-sm text-green-700 dark:text-green-400">
                    <strong>Benefícios do Stake:</strong>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>Rendimentos passivos automáticos</li>
                      <li>Participação em rewards do protocolo</li>
                      <li>Sem taxas de transação (pagas pelo admin)</li>
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
                  text={loading ? "Processando..." : "Confirmar Investimento"}
                  className="btn-success flex-1"
                  onClick={handleStake}
                  disabled={
                    !amount || 
                    parseFloat(amount) <= 0 || 
                    parseFloat(amount) > pcnBalance ||
                    loading ||
                    balancesLoading
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

export default InvestirPage;