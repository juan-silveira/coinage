import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Textinput from '@/components/ui/Textinput';
import { ArrowDownCircle, AlertTriangle, Info } from 'lucide-react';
import api from '@/services/api';
import { useAlertContext } from '@/contexts/AlertContext';

const UnstakeModal = ({ isOpen, onClose, contract, userAddress, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState(1);
  const [totalStakeBalance, setTotalStakeBalance] = useState('0');
  const [allowPartialWithdrawal, setAllowPartialWithdrawal] = useState(false);
  const { showSuccess, showError } = useAlertContext();

  useEffect(() => {
    if (isOpen) {
      loadStakeInfo();
    } else {
      setStep(1);
      setAmount('');
      setTotalStakeBalance('0');
    }
  }, [isOpen]);

  const loadStakeInfo = async () => {
    try {
      setLoadingBalance(true);
      
      // Buscar saldo em stake
      const balanceResponse = await api.post('/api/contracts/read', {
        contractAddress: contract.address,
        functionName: 'getTotalStakeBalance',
        params: [userAddress],
        network: contract.network
      });

      if (balanceResponse.data.success) {
        const balance = balanceResponse.data.data?.result || '0';
        // Converter de wei para decimal
        const balanceInEther = (parseFloat(balance) / 10**18).toString();
        setTotalStakeBalance(balanceInEther);
      }

      // Verificar se permite retirada parcial
      const partialResponse = await api.post('/api/contracts/read', {
        contractAddress: contract.address,
        functionName: 'allowPartialWithdrawal',
        params: [],
        network: contract.network
      });

      if (partialResponse.data.success) {
        setAllowPartialWithdrawal(partialResponse.data.data?.result === true);
      }
      
      // Se não permite parcial, setar o amount para o total
      if (!partialResponse.data.data?.result) {
        setAmount(balanceInEther);
      }
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
        contractAddress: contract.address,
        functionName: 'unstake',
        params: [userAddress, amountInWei],
        network: contract.network,
        payGasFor: userAddress // Admin paga o gás
      });

      if (response.data.success) {
        showSuccess('Retirada realizada com sucesso!');
        onSuccess && onSuccess();
        onClose();
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

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
        <div className="flex items-start space-x-3">
          <ArrowDownCircle className="text-orange-600 dark:text-orange-400 mt-1" size={20} />
          <div>
            <h4 className="font-medium text-orange-900 dark:text-orange-300">
              Retirar Investimento
            </h4>
            <p className="text-sm text-orange-700 dark:text-orange-400 mt-1">
              Retire seus tokens do stake para sua carteira.
            </p>
          </div>
        </div>
      </div>

      {loadingBalance ? (
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <div className="flex justify-between mb-2">
            <span className="text-gray-600 dark:text-gray-400">Saldo em stake:</span>
            <span className="font-bold">
              {formatBalance(totalStakeBalance)} PCN
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Retirada parcial:</span>
            <span className={`font-medium ${allowPartialWithdrawal ? 'text-green-600' : 'text-red-600'}`}>
              {allowPartialWithdrawal ? 'Permitida' : 'Não permitida'}
            </span>
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-2">
          Valor para retirar {!allowPartialWithdrawal && '(Total obrigatório)'}
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
            disabled={!allowPartialWithdrawal || loadingBalance}
            readOnly={!allowPartialWithdrawal}
          />
          {allowPartialWithdrawal && (
            <Button
              text="Máximo"
              className="btn-outline-primary"
              onClick={handleMaxAmount}
              disabled={loadingBalance}
            />
          )}
        </div>
        {amount && (
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {parseFloat(amount) > parseFloat(totalStakeBalance) ? (
              <span className="text-red-500">Valor excede o saldo em stake</span>
            ) : (
              <span>Valor válido para retirada</span>
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
            Taxas de penalidade podem se aplicar dependendo do contrato.
          </p>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
        <h4 className="font-medium text-orange-900 dark:text-orange-300 mb-2">
          Confirmação de Retirada
        </h4>
        <p className="text-sm text-orange-700 dark:text-orange-400">
          Revise os detalhes antes de confirmar a retirada.
        </p>
      </div>

      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-3">
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Valor a retirar:</span>
          <span className="font-bold text-lg">
            {formatBalance(amount)} PCN
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Saldo restante:</span>
          <span className="font-medium">
            {formatBalance(parseFloat(totalStakeBalance) - parseFloat(amount))} PCN
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

      <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
        <div className="flex items-start space-x-2">
          <AlertTriangle size={16} className="text-red-600 dark:text-red-400 mt-0.5" />
          <p className="text-xs text-red-700 dark:text-red-400">
            <strong>Atenção:</strong> Esta ação não pode ser desfeita. 
            Certifique-se de que deseja retirar este valor do stake.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <Modal
      activeModal={isOpen}
      onClose={onClose}
      title={step === 1 ? "Retirar do Stake" : "Confirmar Retirada"}
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
                  : "Confirmar Retirada"
            }
            className={step === 1 ? "btn-warning" : "btn-danger"}
            onClick={step === 1 ? () => setStep(2) : handleUnstake}
            disabled={
              step === 1 
                ? !amount || parseFloat(amount) <= 0 || parseFloat(amount) > parseFloat(totalStakeBalance) || loadingBalance
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

export default UnstakeModal;