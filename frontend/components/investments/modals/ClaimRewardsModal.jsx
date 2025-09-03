import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { AlertCircle } from 'lucide-react';
import api from '@/services/api';
import { useAlertContext } from '@/contexts/AlertContext';

const ClaimRewardsModal = ({ isOpen, onClose, contract, userAddress, rewardsAmount, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useAlertContext();

  const handleClaim = async () => {
    try {
      setLoading(true);
      
      const response = await api.post('/api/contracts/write', {
        contractAddress: contract.address,
        functionName: 'claimReward',
        params: [userAddress],
        network: contract.network,
        payGasFor: userAddress // Admin paga o gás
      });

      if (response.data.success) {
        showSuccess('Rewards recebidos com sucesso!');
        onSuccess && onSuccess();
        onClose();
      } else {
        throw new Error(response.data.message || 'Erro ao receber rewards');
      }
    } catch (error) {
      console.error('Error claiming rewards:', error);
      showError(error.message || 'Erro ao receber rewards');
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount) => {
    const parts = amount.toString().split('.');
    const integerPart = parts[0];
    const decimalPart = parts[1] || '000000';
    const formattedIntegerPart = Number(integerPart).toLocaleString('pt-BR');
    return `${formattedIntegerPart},${decimalPart.padEnd(6, '0').slice(0, 6)}`;
  };

  return (
    <Modal
      activeModal={isOpen}
      onClose={onClose}
      title="Receber Rewards"
      centered
      footerContent={
        <div className="flex space-x-3">
          <Button
            text="Cancelar"
            className="btn-outline-dark"
            onClick={onClose}
            disabled={loading}
          />
          <Button
            text={loading ? "Processando..." : "Confirmar"}
            className="btn-primary"
            onClick={handleClaim}
            disabled={loading}
            isLoading={loading}
          />
        </div>
      }
    >
      <div className="space-y-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <div className="flex items-start space-x-3">
            <AlertCircle className="text-blue-600 dark:text-blue-400 mt-1" size={20} />
            <div>
              <h4 className="font-medium text-blue-900 dark:text-blue-300">
                Confirmação de Recebimento
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                Você está prestes a receber seus rewards acumulados.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Valor a receber:</span>
              <span className="font-bold text-lg">
                {formatAmount(rewardsAmount)} {contract.symbol || 'STAKE'}
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

        <div className="text-sm text-gray-600 dark:text-gray-400">
          Os tokens serão enviados diretamente para sua carteira após a confirmação.
        </div>
      </div>
    </Modal>
  );
};

export default ClaimRewardsModal;