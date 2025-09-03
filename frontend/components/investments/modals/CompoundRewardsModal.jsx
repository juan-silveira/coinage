import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { TrendingUp } from 'lucide-react';
import api from '@/services/api';
import { useAlertContext } from '@/contexts/AlertContext';

const CompoundRewardsModal = ({ isOpen, onClose, contract, userAddress, rewardsAmount, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useAlertContext();

  const handleCompound = async () => {
    try {
      setLoading(true);
      
      const response = await api.post('/api/contracts/write', {
        contractAddress: contract.address,
        functionName: 'compound',
        params: [userAddress],
        network: contract.network,
        payGasFor: userAddress // Admin paga o gás
      });

      if (response.data.success) {
        showSuccess('Rewards reinvestidos com sucesso!');
        onSuccess && onSuccess();
        onClose();
      } else {
        throw new Error(response.data.message || 'Erro ao reinvestir rewards');
      }
    } catch (error) {
      console.error('Error compounding rewards:', error);
      showError(error.message || 'Erro ao reinvestir rewards');
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
      title="Reinvestir Rewards"
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
            text={loading ? "Processando..." : "Confirmar Reinvestimento"}
            className="btn-success"
            onClick={handleCompound}
            disabled={loading}
            isLoading={loading}
          />
        </div>
      }
    >
      <div className="space-y-4">
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <div className="flex items-start space-x-3">
            <TrendingUp className="text-green-600 dark:text-green-400 mt-1" size={20} />
            <div>
              <h4 className="font-medium text-green-900 dark:text-green-300">
                Reinvestimento Automático
              </h4>
              <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                Seus rewards serão automaticamente reinvestidos para gerar mais rendimentos.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Valor a reinvestir:</span>
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
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Efeito:</span>
              <span className="text-blue-600 dark:text-blue-400 font-medium">
                Aumenta seu stake total
              </span>
            </div>
          </div>
        </div>

        <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
          <p className="text-sm text-amber-700 dark:text-amber-400">
            <strong>Nota:</strong> O reinvestimento aumentará seu saldo em stake, 
            potencializando seus rendimentos futuros através de juros compostos.
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default CompoundRewardsModal;