import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { MinusCircle } from 'lucide-react';
import api from '@/services/api';
import { useAlertContext } from '@/contexts/AlertContext';
import useDarkmode from '@/hooks/useDarkMode';
import useTokenMask from '@/hooks/useTokenMask';
import { BalanceDisplay } from '@/utils/balanceUtils';

const UnstakeModal = ({ isOpen, onClose, contract, userAddress, userStake, tokenSymbol, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useAlertContext();
  const [isDark] = useDarkmode();

  // Hook para máscara de token
  const {
    value: amount,
    getNumericValue,
    isValidAmount,
    clearValue: clearAmount,
    setValue: setAmount,
    inputProps: tokenInputProps
  } = useTokenMask();


  const handleMaxAmount = () => {
    if (userStake && userStake !== '0') {
      // Usar o valor exato do stake sem conversões que introduzam erro
      setAmount(parseFloat(userStake));
    }
  };

  const handleUnstake = async () => {
    if (!isValidAmount()) {
      showError('Digite um valor válido para fazer unstake');
      return;
    }

    // Obter valor numérico do hook
    const numericValue = getNumericValue();
    
    if (numericValue > parseFloat(userStake)) {
      showError('Valor maior que o saldo disponível');
      return;
    }

    try {
      setLoading(true);
      
      console.log('Unstaking with params:', {
        contractAddress: contract.address,
        userAddress: userAddress,
        displayAmount: amount,
        numericValue: numericValue,
        network: contract.network
      });
      
      // Usar o endereço do admin do contrato para pagar o gás
      // Converter o valor numeral para wei (assumindo 18 decimais)
      const amountInWei = (numericValue * Math.pow(10, 18)).toString();
      
      const response = await api.post(`/api/stakes/${contract.address}/withdraw`, {
        user: userAddress,
        amount: amountInWei
      });

      if (response.data.success) {
        showSuccess(`Unstake de ${amount} ${tokenSymbol} realizado com sucesso!`);
        onSuccess && onSuccess();
        onClose();
        clearAmount();
      } else {
        throw new Error(response.data.message || 'Erro ao fazer unstake');
      }
    } catch (error) {
      console.error('Error unstaking:', error);
      if (error.response?.data?.message) {
        showError(error.response.data.message);
      } else if (error.response?.data?.error) {
        showError(error.response.data.error);
      } else {
        showError(error.message || 'Erro ao fazer unstake');
      }
    } finally {
      setLoading(false);
    }
  };


  return (
    <Modal
      activeModal={isOpen}
      onClose={onClose}
      title="Fazer Unstake do Contrato"
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
            text={loading ? "Processando..." : "Confirmar Unstake"}
            className="btn-warning"
            onClick={handleUnstake}
            disabled={loading || !amount}
            isLoading={loading}
          />
        </div>
      }
    >
      <div className="space-y-4">
        <div className={`p-4 rounded-lg ${isDark ? "bg-orange-900/20" : "bg-orange-50"}`}>
          <div className="flex items-start space-x-3">
            <MinusCircle className={`mt-1 ${isDark ? "text-orange-400" : "text-orange-600"}`} size={20} />
            <div>
              <h4 className={`font-medium ${isDark ? "text-orange-300" : "text-orange-900"}`}>
                Unstake de Tokens
              </h4>
              <p className={`text-sm mt-1 ${isDark ? "text-orange-400" : "text-orange-700"}`}>
                Digite o valor que deseja fazer unstake do contrato.
              </p>
            </div>
          </div>
        </div>

        <div className={`p-4 rounded-lg border ${isDark ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className={isDark ? "text-gray-400" : "text-gray-600"}>Saldo disponível:</span>
              <span className={`font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                <BalanceDisplay value={userStake} symbol={tokenSymbol} />
              </span>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className={`block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                  Valor para unstake ({tokenSymbol})
                </label>
                <Button
                  text="MAX"
                  className="btn-sm btn-outline-primary"
                  onClick={handleMaxAmount}
                  disabled={loading || parseFloat(userStake) <= 0}
                />
              </div>
              <input
                {...tokenInputProps}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                  isDark 
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" 
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                }`}
                disabled={loading}
              />
              <p className={`text-xs mt-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                Use vírgula para decimais (ex: 1.197,654365) ou ponto que será convertido automaticamente
              </p>
            </div>
            
            {/* {amount && getNumericValue() > 0 && (
              <div className={`p-3 rounded-md ${isDark ? "bg-blue-900/20" : "bg-blue-50"}`}>
                <p className={`text-sm ${isDark ? "text-blue-400" : "text-blue-700"}`}>
                  <strong>Valor numérico:</strong> {getNumericValue()} {tokenSymbol}
                </p>
              </div>
            )} */}
          </div>
        </div>

        <div className={`p-3 rounded-lg ${isDark ? "bg-amber-900/20" : "bg-amber-50"}`}>
          <p className={`text-sm ${isDark ? "text-amber-400" : "text-amber-700"}`}>
            <strong>Nota:</strong> O unstake será processado na blockchain e o valor será 
            removido do seu saldo de stake no contrato.
          </p>
        </div>

        <div className={`p-3 rounded-lg ${isDark ? "bg-blue-900/20" : "bg-blue-50"}`}>
          <p className={`text-sm ${isDark ? "text-blue-400" : "text-blue-700"}`}>
            <strong>⏳ Importante:</strong> Após clicar em "Confirmar Unstake", aguarde na tela enquanto 
            a transação é processada na blockchain. A tela fechará automaticamente quando a 
            transação for confirmada.
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default UnstakeModal;