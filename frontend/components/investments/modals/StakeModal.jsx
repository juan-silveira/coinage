import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { PlusCircle } from 'lucide-react';
import api from '@/services/api';
import { useAlertContext } from '@/contexts/AlertContext';
import useDarkmode from '@/hooks/useDarkMode';
import useTokenMask from '@/hooks/useTokenMask';
import { weiToDecimal, BalanceDisplay } from '@/utils/balanceUtils';

const StakeModal = ({ isOpen, onClose, contract, userAddress, tokenSymbol, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [userBalance, setUserBalance] = useState('0');
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [minStakeValue, setMinStakeValue] = useState('0');
  const [loadingMinStake, setLoadingMinStake] = useState(false);
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

  // Carregar saldo do usuário e valor mínimo de stake quando o modal abrir
  useEffect(() => {
    if (isOpen && contract && userAddress) {
      loadUserBalance();
      loadMinStakeValue();
    }
  }, [isOpen, contract, userAddress]);


  const loadUserBalance = async () => {
    try {
      setLoadingBalance(true);
      
      // Buscar saldo do token do contrato
      const tokenAddress = contract.tokenAddress || contract.stakeToken;
      if (!tokenAddress || tokenAddress === '0x0000000000000000000000000000000000000000') {
        setUserBalance('0');
        return;
      }

      const response = await api.post('/api/contracts/read', {
        contractAddress: tokenAddress,
        functionName: 'balanceOf',
        params: [userAddress],
        network: contract.network || 'testnet'
      });

      if (response.data.success && response.data.data?.result) {
        const balanceInWei = response.data.data.result;
        // Converter de wei para decimal sem perda de precisão
        const balanceInEther = weiToDecimal(balanceInWei, 18);
        setUserBalance(balanceInEther);
      } else {
        setUserBalance('0');
      }
    } catch (error) {
      console.error('Error loading user balance:', error);
      setUserBalance('0');
    } finally {
      setLoadingBalance(false);
    }
  };

  const loadMinStakeValue = async () => {
    try {
      setLoadingMinStake(true);
      
      const response = await api.post('/api/contracts/read', {
        contractAddress: contract.address,
        functionName: 'minValueStake',
        params: [],
        network: contract.network || 'testnet'
      });

      if (response.data.success && response.data.data?.result) {
        const minValueInWei = response.data.data.result;
        // Converter de wei para decimal sem perda de precisão
        const minValueInEther = weiToDecimal(minValueInWei, 18);
        setMinStakeValue(minValueInEther);
      } else {
        setMinStakeValue('0');
      }
    } catch (error) {
      console.error('Error loading min stake value:', error);
      setMinStakeValue('0');
    } finally {
      setLoadingMinStake(false);
    }
  };

  const handleMaxAmount = () => {
    if (userBalance && userBalance !== '0') {
      // Usar o valor exato do saldo sem conversões que introduzam erro
      setAmount(parseFloat(userBalance));
    }
  };

  const handleStake = async () => {
    if (!isValidAmount()) {
      showError('Digite um valor válido para fazer stake');
      return;
    }

    // Obter valor numérico do hook
    const numericValue = getNumericValue();
    
    // Verificar se tem saldo suficiente
    const userBalanceNum = parseFloat(userBalance);
    if (numericValue > userBalanceNum) {
      showError('Saldo insuficiente');
      return;
    }

    // Verificar valor mínimo de stake
    const minStakeNum = parseFloat(minStakeValue);
    if (numericValue < minStakeNum) {
      showError(`Valor mínimo para stake é ${minStakeNum.toLocaleString('pt-BR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 6
      })} ${tokenSymbol}`);
      return;
    }

    try {
      setLoading(true);
      
      console.log('Staking with params:', {
        contractAddress: contract.address,
        userAddress: userAddress,
        displayAmount: amount,
        numericValue: numericValue,
        network: contract.network
      });
      
      // Usar o endereço do admin do contrato para pagar o gás
      const adminAddress = contract.adminAddress || '0x5528C065931f523CA9F3a6e49a911896fb1D2e6f';
      
      // Converter o valor numeral para wei (assumindo 18 decimais)
      const amountInWei = (numericValue * Math.pow(10, 18)).toString();
      
      const response = await api.post('/api/contracts/write', {
        contractAddress: contract.address,
        functionName: 'stake',
        params: [userAddress, amountInWei, 0], // userAddress, amount, _customTimestamp (sempre 0)
        network: contract.network,
        gasPayer: adminAddress
      });

      if (response.data.success) {
        showSuccess(`Stake de ${amount} ${tokenSymbol} realizado com sucesso!`);
        onSuccess && onSuccess();
        onClose();
        clearAmount();
      } else {
        throw new Error(response.data.message || 'Erro ao realizar stake');
      }
    } catch (error) {
      console.error('Error staking:', error);
      if (error.response?.data?.message) {
        showError(error.response.data.message);
      } else if (error.response?.data?.error) {
        showError(error.response.data.error);
      } else {
        showError(error.message || 'Erro ao realizar stake');
      }
    } finally {
      setLoading(false);
    }
  };


  return (
    <Modal
      activeModal={isOpen}
      onClose={onClose}
      title="Fazer Stake no Contrato"
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
            text={loading ? "Processando..." : "Confirmar Stake"}
            className="btn-success"
            onClick={handleStake}
            disabled={loading || !isValidAmount() || getNumericValue() < parseFloat(minStakeValue) || getNumericValue() > parseFloat(userBalance)}
            isLoading={loading}
          />
        </div>
      }
    >
      <div className="space-y-4">
        <div className={`p-4 rounded-lg ${isDark ? "bg-green-900/20" : "bg-green-50"}`}>
          <div className="flex items-start space-x-3">
            <PlusCircle className={`mt-1 ${isDark ? "text-green-400" : "text-green-600"}`} size={20} />
            <div>
              <h4 className={`font-medium ${isDark ? "text-green-300" : "text-green-900"}`}>
                Novo Stake
              </h4>
              <p className={`text-sm mt-1 ${isDark ? "text-green-400" : "text-green-700"}`}>
                Digite o valor que deseja fazer stake no contrato.
              </p>
            </div>
          </div>
        </div>

        <div className={`p-4 rounded-lg border ${isDark ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className={isDark ? "text-gray-400" : "text-gray-600"}>Saldo disponível:</span>
              {loadingBalance ? (
                <span className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>Carregando...</span>
              ) : (
                <span className={`font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                  <BalanceDisplay value={userBalance} symbol={tokenSymbol} />
                </span>
              )}
            </div>

            <div className="flex justify-between">
              <span className={isDark ? "text-gray-400" : "text-gray-600"}>Valor mínimo de stake:</span>
              {loadingMinStake ? (
                <span className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>Carregando...</span>
              ) : (
                <span className={`font-medium ${isDark ? "text-orange-400" : "text-orange-600"}`}>
                  <BalanceDisplay value={minStakeValue} symbol={tokenSymbol} />
                </span>
              )}
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className={`block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                  Valor para stake ({tokenSymbol})
                </label>
                <Button
                  text="MAX"
                  className="btn-sm btn-outline-primary"
                  onClick={handleMaxAmount}
                  disabled={loading || loadingBalance || parseFloat(userBalance) <= 0}
                />
              </div>
              <input
                {...tokenInputProps}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
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

            {amount && getNumericValue() > 0 && getNumericValue() < parseFloat(minStakeValue) && (
              <div className={`p-3 rounded-md ${isDark ? "bg-red-900/20" : "bg-red-50"}`}>
                <p className={`text-sm ${isDark ? "text-red-400" : "text-red-700"}`}>
                  <strong>⚠️ Valor insuficiente:</strong> O valor mínimo para stake é {parseFloat(minStakeValue).toLocaleString('pt-BR', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 6
                  })} {tokenSymbol}
                </p>
              </div>
            )}

            {amount && getNumericValue() > 0 && getNumericValue() > parseFloat(userBalance) && (
              <div className={`p-3 rounded-md ${isDark ? "bg-red-900/20" : "bg-red-50"}`}>
                <p className={`text-sm ${isDark ? "text-red-400" : "text-red-700"}`}>
                  <strong>⚠️ Saldo insuficiente:</strong> Você não tem saldo suficiente para esta operação
                </p>
              </div>
            )}
          </div>
        </div>

        <div className={`p-3 rounded-lg ${isDark ? "bg-amber-900/20" : "bg-amber-50"}`}>
          <p className={`text-sm ${isDark ? "text-amber-400" : "text-amber-700"}`}>
            <strong>Nota:</strong> O stake será processado na blockchain e você começará a 
            receber rewards baseados no valor investido.
          </p>
        </div>

        <div className={`p-3 rounded-lg ${isDark ? "bg-blue-900/20" : "bg-blue-50"}`}>
          <p className={`text-sm ${isDark ? "text-blue-400" : "text-blue-700"}`}>
            <strong>⏳ Importante:</strong> Após clicar em "Confirmar Stake", aguarde na tela enquanto 
            a transação é processada na blockchain. A tela fechará automaticamente quando a 
            transação for confirmada.
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default StakeModal;