import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Textinput from '@/components/ui/Textinput';
import { PiggyBank, Info } from 'lucide-react';
import api from '@/services/api';
import { useAlertContext } from '@/contexts/AlertContext';
import useCachedBalances from '@/hooks/useCachedBalances';

const StakeModal = ({ isOpen, onClose, contract, userAddress, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState(1);
  const { showSuccess, showError } = useAlertContext();
  const { getBalance } = useCachedBalances();
  
  const pcnBalance = parseFloat(getBalance('PCN')) || 0;

  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setAmount('');
    }
  }, [isOpen]);

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
        contractAddress: contract.address,
        functionName: 'stake',
        params: [
          userAddress,
          amountInWei,
          '0' // customTimestamp sempre 0 para usuários comuns
        ],
        network: contract.network,
        payGasFor: userAddress // Admin paga o gás
      });

      if (response.data.success) {
        showSuccess('Investimento realizado com sucesso!');
        onSuccess && onSuccess();
        onClose();
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

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
        <div className="flex items-start space-x-3">
          <PiggyBank className="text-blue-600 dark:text-blue-400 mt-1" size={20} />
          <div>
            <h4 className="font-medium text-blue-900 dark:text-blue-300">
              Investir em Stake
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
              Invista seus PCN para gerar rendimentos passivos.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
        <div className="flex justify-between mb-2">
          <span className="text-gray-600 dark:text-gray-400">Saldo disponível:</span>
          <span className="font-bold">
            {formatBalance(pcnBalance)} PCN
          </span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Valor para investir</label>
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
          />
        </div>
        {amount && (
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {parseFloat(amount) > pcnBalance ? (
              <span className="text-red-500">Saldo insuficiente</span>
            ) : (
              <span>Valor válido para investimento</span>
            )}
          </div>
        )}
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
        <div className="flex items-start space-x-2">
          <Info size={16} className="text-amber-600 dark:text-amber-400 mt-0.5" />
          <p className="text-xs text-amber-700 dark:text-amber-400">
            Após investir, seus tokens ficarão bloqueados no contrato. 
            Verifique as condições de retirada antes de prosseguir.
          </p>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
        <h4 className="font-medium text-green-900 dark:text-green-300 mb-2">
          Confirmação do Investimento
        </h4>
        <p className="text-sm text-green-700 dark:text-green-400">
          Revise os detalhes antes de confirmar.
        </p>
      </div>

      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-3">
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Valor a investir:</span>
          <span className="font-bold text-lg">
            {formatBalance(amount)} PCN
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Contrato:</span>
          <span className="font-mono text-xs">
            {contract.address.slice(0, 6)}...{contract.address.slice(-4)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Taxa de gás:</span>
          <span className="text-green-600 dark:text-green-400 font-medium">
            Grátis (pago pelo admin)
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <Modal
      activeModal={isOpen}
      onClose={onClose}
      title={step === 1 ? "Investir PCN" : "Confirmar Investimento"}
      centered
      footerContent={
        <div className="flex space-x-3">
          {step === 2 && (
            <Button
              text="Voltar"
              className="btn-outline-dark"
              onClick={() => setStep(1)}
              disabled={loading}
            />
          )}
          <Button
            text="Cancelar"
            className="btn-outline-dark"
            onClick={onClose}
            disabled={loading}
          />
          <Button
            text={
              step === 1 
                ? "Continuar" 
                : loading 
                  ? "Processando..." 
                  : "Confirmar Investimento"
            }
            className={step === 1 ? "btn-primary" : "btn-success"}
            onClick={step === 1 ? () => setStep(2) : handleStake}
            disabled={
              step === 1 
                ? !amount || parseFloat(amount) <= 0 || parseFloat(amount) > pcnBalance
                : loading
            }
            isLoading={loading}
          />
        </div>
      }
    >
      {step === 1 ? renderStep1() : renderStep2()}
    </Modal>
  );
};

export default StakeModal;