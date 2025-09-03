import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { TrendingUp } from 'lucide-react';
import api from '@/services/api';
import { useAlertContext } from '@/contexts/AlertContext';
import useDarkmode from '@/hooks/useDarkMode';
import { BalanceDisplay } from '@/utils/balanceUtils';

const CompoundRewardsModal = ({ isOpen, onClose, contract, userAddress, rewardsAmount, tokenSymbol, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useAlertContext();
  const [isDark] = useDarkmode();

  const handleCompound = async () => {
    try {
      setLoading(true);
      
      console.log('Compounding rewards with params:', {
        contractAddress: contract.address,
        userAddress: userAddress,
        network: contract.network
      });
      
      // Usar o endereço do admin do contrato para pagar o gás
      // O adminAddress vem diretamente no contract
      const adminAddress = contract.adminAddress || '0x5528C065931f523CA9F3a6e49a911896fb1D2e6f';
      
      const response = await api.post('/api/contracts/write', {
        contractAddress: contract.address,
        functionName: 'compound',
        params: [userAddress],
        network: contract.network,
        gasPayer: adminAddress // Admin paga o gás usando o endereço real
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
      // Melhor tratamento de erro
      if (error.response?.data?.message) {
        showError(error.response.data.message);
      } else if (error.response?.data?.error) {
        showError(error.response.data.error);
      } else {
        showError(error.message || 'Erro ao reinvestir rewards');
      }
    } finally {
      setLoading(false);
    }
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
            className="btn-outline-danger"
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
        <div className={`p-4 rounded-lg ${isDark ? "bg-green-900/20" : "bg-green-50"}`}>
          <div className="flex items-start space-x-3">
            <TrendingUp className={`mt-1 ${isDark ? "text-green-400" : "text-green-600"}`} size={20} />
            <div>
              <h4 className={`font-medium ${isDark ? "text-green-300" : "text-green-900"}`}>
                Reinvestimento Automático
              </h4>
              <p className={`text-sm mt-1 ${isDark ? "text-green-400" : "text-green-700"}`}>
                Seus rewards serão automaticamente reinvestidos para gerar mais rendimentos.
              </p>
            </div>
          </div>
        </div>

        <div className={`p-4 rounded-lg border ${isDark ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className={isDark ? "text-gray-400" : "text-gray-600"}>Valor a reinvestir:</span>
              <span className={`font-bold text-lg ${isDark ? "text-white" : "text-gray-900"}`}>
                <BalanceDisplay value={rewardsAmount} symbol={tokenSymbol} />
              </span>
            </div>
            {/* <div className="flex justify-between">
              <span className={isDark ? "text-gray-400" : "text-gray-600"}>Taxa de gás:</span>
              <span className={`font-medium ${isDark ? "text-green-400" : "text-green-600"}`}>
                Grátis (pago pelo admin)
              </span>
            </div>
            <div className="flex justify-between">
              <span className={isDark ? "text-gray-400" : "text-gray-600"}>Efeito:</span>
              <span className={`font-medium ${isDark ? "text-blue-400" : "text-blue-600"}`}>
                Aumenta seu stake total
              </span>
            </div> */}
          </div>
        </div>

        <div className={`p-3 rounded-lg ${isDark ? "bg-amber-900/20" : "bg-amber-50"}`}>
          <p className={`text-sm ${isDark ? "text-amber-400" : "text-amber-700"}`}>
            <strong>Nota:</strong> O reinvestimento aumentará seu saldo em stake, 
            potencializando seus rendimentos futuros através de juros compostos.
          </p>
        </div>

        <div className={`p-3 rounded-lg ${isDark ? "bg-blue-900/20" : "bg-blue-50"}`}>
          <p className={`text-sm ${isDark ? "text-blue-400" : "text-blue-700"}`}>
            <strong>⏳ Importante:</strong> Após clicar em "Confirmar Reinvestimento", aguarde na tela enquanto 
            a transação é processada na blockchain. A tela fechará automaticamente quando a 
            transação for confirmada.
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default CompoundRewardsModal;