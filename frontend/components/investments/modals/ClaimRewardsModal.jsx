import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { AlertCircle } from 'lucide-react';
import api from '@/services/api';
import { useAlertContext } from '@/contexts/AlertContext';
import useDarkmode from '@/hooks/useDarkMode';
import { BalanceDisplay } from '@/utils/balanceUtils';

const ClaimRewardsModal = ({ isOpen, onClose, contract, userAddress, rewardsAmount, tokenSymbol, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useAlertContext();
  const [isDark] = useDarkmode();

  const handleClaim = async () => {
    try {
      setLoading(true);
      
      console.log('Claiming rewards with params:', {
        contractAddress: contract.address,
        userAddress: userAddress,
        network: contract.network,
        adminAddress: contract.adminAddress || contract.metadata?.adminAddress,
        fullContract: contract
      });
      
      const response = await api.post(`/api/stakes/${contract.address}/claim-rewards`, {
        user: userAddress
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
      // Melhor tratamento de erro
      if (error.response?.data?.message) {
        showError(error.response.data.message);
      } else if (error.response?.data?.error) {
        showError(error.response.data.error);
      } else {
        showError(error.message || 'Erro ao receber rewards');
      }
    } finally {
      setLoading(false);
    }
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
            className="btn-outline-danger"
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
        <div className={`p-4 rounded-lg ${isDark ? "bg-blue-900/20" : "bg-blue-50"}`}>
          <div className="flex items-start space-x-3">
            <AlertCircle className={`mt-1 ${isDark ? "text-blue-400" : "text-blue-600"}`} size={20} />
            <div>
              <h4 className={`font-medium ${isDark ? "text-blue-300" : "text-blue-900"}`}>
                Confirmação de Recebimento
              </h4>
              <p className={`text-sm mt-1 ${isDark ? "text-blue-400" : "text-blue-700"}`}>
                Você está prestes a receber seus rewards acumulados.
              </p>
            </div>
          </div>
        </div>

        <div className={`p-4 rounded-lg border ${isDark ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className={isDark ? "text-gray-400" : "text-gray-600"}>Valor a receber:</span>
              <span className={`font-bold text-lg ${isDark ? "text-white" : "text-gray-900"}`}>
                <BalanceDisplay value={rewardsAmount} symbol={tokenSymbol} />
              </span>
            </div>
            {/* <div className="flex justify-between">
              <span className={isDark ? "text-gray-400" : "text-gray-600"}>Taxa de gás:</span>
              <span className={`font-medium ${isDark ? "text-green-400" : "text-green-600"}`}>
                Grátis (pago pelo admin)
              </span>
            </div> */}
          </div>
        </div>

        <div className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
          Os tokens serão enviados diretamente para sua carteira após a confirmação.
        </div>

        <div className={`p-3 rounded-lg ${isDark ? "bg-blue-900/20" : "bg-blue-50"}`}>
          <p className={`text-sm ${isDark ? "text-blue-400" : "text-blue-700"}`}>
            <strong>⏳ Importante:</strong> Após clicar em "Confirmar", aguarde na tela enquanto 
            a transação é processada na blockchain. A tela fechará automaticamente quando a 
            transação for confirmada.
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default ClaimRewardsModal;