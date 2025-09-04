'use client';

import { useState, useEffect } from 'react';
import { 
  Code2,
  Layers,
  Zap, 
  Eye, 
  Send, 
  Loader2, 
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Coins,
  FileCode,
  Clock,
  XCircle,
  Wifi,
  Settings,
  Shield,
} from 'lucide-react';
import api from '@/services/api';
import { useAlertContext } from '@/contexts/AlertContext';
import { ethers } from 'ethers';
import Image from '@/components/ui/Image';

export default function ContractInteractPage() {
  const { showSuccess, showError } = useAlertContext();
  const [loading, setLoading] = useState(false);
  const [contracts, setContracts] = useState([]);
  const [selectedContract, setSelectedContract] = useState(null);
  const [contractFunctions, setContractFunctions] = useState({
    read: [],
    write: []
  });
  const [expandedFunctions, setExpandedFunctions] = useState({});
  const [functionInputs, setFunctionInputs] = useState({});
  const [functionResults, setFunctionResults] = useState({});
  const [executingFunction, setExecutingFunction] = useState(null);
  const [updatingABI, setUpdatingABI] = useState(false);
  const [updatingAllABIs, setUpdatingAllABIs] = useState(false);

  // Helper functions for error display
  const getErrorBorderColor = (errorType) => {
    switch (errorType) {
      case 'timeout':
      case 'missing_function':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700';
      case 'access_denied':
        return 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700';
      case 'call_exception':
        return 'bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700';
      case 'network':
        return 'bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700';
      case 'gas':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700';
      case 'admin':
        return 'bg-pink-50 dark:bg-pink-900/20 border-pink-300 dark:border-pink-700';
      case 'revert':
        return 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700';
      default:
        return 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700';
    }
  };

  const getErrorIcon = (errorType) => {
    switch (errorType) {
      case 'timeout':
        return <Clock className="w-5 h-5 text-yellow-400 mt-0.5" />;
      case 'missing_function':
        return <XCircle className="w-5 h-5 text-yellow-400 mt-0.5" />;
      case 'access_denied':
        return <Shield className="w-5 h-5 text-red-400 mt-0.5" />;
      case 'call_exception':
        return <AlertCircle className="w-5 h-5 text-orange-400 mt-0.5" />;
      case 'network':
        return <Wifi className="w-5 h-5 text-purple-400 mt-0.5" />;
      case 'gas':
        return <Settings className="w-5 h-5 text-blue-400 mt-0.5" />;
      case 'admin':
        return <Shield className="w-5 h-5 text-pink-400 mt-0.5" />;
      case 'revert':
        return <XCircle className="w-5 h-5 text-red-400 mt-0.5" />;
      default:
        return <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />;
    }
  };

  const getErrorTitle = (errorType) => {
    switch (errorType) {
      case 'timeout':
        return 'Timeout';
      case 'missing_function':
        return 'Função Não Encontrada';
      case 'access_denied':
        return 'Acesso Negado';
      case 'call_exception':
        return 'Erro de Execução';
      case 'network':
        return 'Erro de Rede';
      case 'gas':
        return 'Erro de Gas';
      case 'admin':
        return 'Erro de Permissão';
      case 'revert':
        return 'Transação Revertida';
      default:
        return 'Erro';
    }
  };

  // Fetch registered contracts
  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/contracts/all');
      if (response.data.success) {
        setContracts(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching contracts:', error);
      showError('Erro ao carregar contratos');
    } finally {
      setLoading(false);
    }
  };

  const updateContractABI = async (contractId) => {
    try {
      setUpdatingABI(true);
      const response = await api.patch(`/api/stake-contracts/${contractId}/abi`);
      if (response.data.success) {
        showSuccess('ABI atualizado com sucesso!');
        // Reload contracts
        await fetchContracts();
        // Re-select the contract to load the new ABI
        const updatedContract = contracts.find(c => c.id === contractId);
        if (updatedContract) {
          setSelectedContract({ ...updatedContract, abi: response.data.data.abi });
        }
      }
    } catch (error) {
      console.error('Error updating ABI:', error);
      showError('Erro ao atualizar ABI do contrato');
    } finally {
      setUpdatingABI(false);
    }
  };

  const updateAllABIs = async () => {
    try {
      setUpdatingAllABIs(true);
      const response = await api.post('/api/contracts/update-abis');
      if (response.data.success) {
        showSuccess(`${response.data.message}! Recarregando contratos...`);
        // Reload contracts after updating ABIs
        await fetchContracts();
        // Clear selected contract to force re-selection
        setSelectedContract(null);
      }
    } catch (error) {
      console.error('Error updating all ABIs:', error);
      showError('Erro ao atualizar ABIs dos contratos');
    } finally {
      setUpdatingAllABIs(false);
    }
  };

  // Parse ABI when contract is selected
  useEffect(() => {
    if (selectedContract) {
      console.log('Selected contract:', selectedContract);
      if (selectedContract.abi) {
        parseContractABI(selectedContract.abi);
      } else {
        console.warn('Contract has no ABI:', selectedContract.address);
        showError('Este contrato não possui ABI registrado. Por favor, re-registre o contrato.');
        setContractFunctions({ read: [], write: [] });
      }
    }
  }, [selectedContract]);

  const parseContractABI = (abi) => {
    try {
      const parsedABI = typeof abi === 'string' ? JSON.parse(abi) : abi;
      
      const readFunctions = [];
      const writeFunctions = [];
      const seenFunctions = new Set(); // Track seen functions to avoid duplicates

      parsedABI.forEach(item => {
        if (item.type === 'function') {
          // Create unique key based on function name and inputs
          const inputTypes = (item.inputs || []).map(input => input.type).join(',');
          const functionKey = `${item.name}(${inputTypes})`;
          
          // Skip if we've already seen this function signature
          if (seenFunctions.has(functionKey)) {
            return;
          }
          seenFunctions.add(functionKey);

          const functionData = {
            name: item.name,
            inputs: item.inputs || [],
            outputs: item.outputs || [],
            stateMutability: item.stateMutability,
            payable: item.payable || false,
            constant: item.constant || false,
            key: functionKey // Add unique key for React
          };

          // Separate read and write functions
          if (item.stateMutability === 'view' || item.stateMutability === 'pure' || item.constant) {
            readFunctions.push(functionData);
          } else {
            writeFunctions.push(functionData);
          }
        }
      });

      setContractFunctions({
        read: readFunctions.sort((a, b) => a.name.localeCompare(b.name)),
        write: writeFunctions.sort((a, b) => a.name.localeCompare(b.name))
      });
    } catch (error) {
      console.error('Error parsing ABI:', error);
      showError('Erro ao processar ABI do contrato');
    }
  };

  const toggleFunction = (functionName) => {
    setExpandedFunctions(prev => ({
      ...prev,
      [functionName]: !prev[functionName]
    }));
  };

  const handleInputChange = (functionName, inputIndex, value) => {
    setFunctionInputs(prev => ({
      ...prev,
      [functionName]: {
        ...prev[functionName],
        [inputIndex]: value
      }
    }));
  };

  const formatOutput = (output, outputType) => {
    try {
      if (outputType.includes('uint') || outputType.includes('int')) {
        return ethers.formatUnits(output, 0);
      }
      if (outputType === 'bool') {
        return output ? 'true' : 'false';
      }
      if (outputType === 'address') {
        return output;
      }
      if (Array.isArray(output)) {
        return JSON.stringify(output, null, 2);
      }
      return output.toString();
    } catch (error) {
      return output?.toString() || '';
    }
  };

  const executeReadFunction = async (func) => {
    const functionKey = func.key || func.name;
    try {
      setExecutingFunction(functionKey);
      
      const params = func.inputs.map((input, index) => {
        const value = functionInputs[functionKey]?.[index] || '';
        
        // Handle different input types
        if (input.type.includes('uint') || input.type.includes('int')) {
          return value || '0';
        }
        if (input.type === 'bool') {
          return value === 'true';
        }
        if (input.type === 'address') {
          return value || ethers.ZeroAddress;
        }
        return value;
      });

      const response = await api.post('/api/contracts/read', {
        contractAddress: selectedContract.address,
        functionName: func.name,
        params,
        network: selectedContract.network
      });

      if (response.data.success) {
        setFunctionResults(prev => ({
          ...prev,
          [functionKey]: {
            success: true,
            data: response.data.data.result
          }
        }));
        showSuccess(`Função ${func.name} executada com sucesso`);
      }
    } catch (error) {
      console.error('Error executing read function:', error);
      
      let errorMessage = '';
      let errorType = 'general';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
        
        // Identify specific error types for better user feedback
        if (errorMessage.includes('requires admin permissions')) {
          errorType = 'access_denied';
          // Keep the original message as it's already descriptive
        } else if (errorMessage.includes('timed out') || errorMessage.includes('timeout')) {
          errorType = 'timeout';
          errorMessage = `Função '${func.name}' expirou - Esta função pode não existir no contrato implantado ou a rede pode estar congestionada`;
        } else if (errorMessage.includes('Function call timeout')) {
          errorType = 'timeout';
          errorMessage = `Função '${func.name}' não está disponível no contrato implantado`;
        } else if (errorMessage.includes('CALL_EXCEPTION')) {
          errorType = 'call_exception';
          errorMessage = `Função '${func.name}' falhou - Verifique se os parâmetros estão corretos ou se a função existe no contrato`;
        } else if (errorMessage.includes('missing revert data')) {
          errorType = 'missing_function';
          errorMessage = `Função '${func.name}' não foi encontrada no contrato implantado`;
        } else if (errorMessage.includes('network')) {
          errorType = 'network';
          errorMessage = `Erro de rede ao executar função '${func.name}' - Tente novamente`;
        }
      } else {
        errorMessage = error.message || 'Erro desconhecido';
      }
      
      setFunctionResults(prev => ({
        ...prev,
        [functionKey]: {
          success: false,
          error: errorMessage,
          errorType: errorType
        }
      }));
      
      showError(errorMessage);
    } finally {
      setExecutingFunction(null);
    }
  };

  const executeWriteFunction = async (func) => {
    const functionKey = func.key || func.name;
    
    try {
      setExecutingFunction(functionKey);
      
      const params = func.inputs.map((input, index) => {
        const value = functionInputs[functionKey]?.[index] || '';
        
        // Handle different input types
        if (input.type.includes('uint') || input.type.includes('int')) {
          if (input.type.includes('256')) {
            // Para distributeReward, usar o valor literal (percentual)
            if (func.name === 'distributeReward') {
              return value || '0';
            }
            // Para outras funções, converter para wei
            const weiValue = ethers.parseUnits(value || '0', 18).toString();
            return weiValue;
          }
          return value || '0';
        }
        if (input.type === 'bool') {
          return value === 'true';
        }
        if (input.type === 'address') {
          return value || ethers.ZeroAddress;
        }
        if (input.type === 'bytes32') {
          // Se o valor já está no formato hex correto (0x...), usar diretamente
          if (value && value.startsWith('0x') && value.length === 66) {
            return value;
          }
          // Caso contrário, tratar como string e converter para keccak256
          return ethers.id(value || '');
        }
        if (Array.isArray(value)) {
          return value;
        }
        return value;
      });


      // Get admin address from contract metadata
      const adminAddress = selectedContract.adminAddress || selectedContract.metadata?.adminAddress;
      
      if (!adminAddress) {
        console.log('❌ [FRONTEND ERROR] Admin address not found!');
        throw new Error('Admin address not found for this contract');
      }

      const requestBody = {
        contractAddress: selectedContract.address,
        functionName: func.name,
        params,
        gasPayer: adminAddress,
        network: selectedContract.network
      };
      
      // Para distributeReward, usar a rota específica de stakes que funciona
      let apiUrl;
      let requestBodyFinal;
      
      if (func.name === 'distributeReward') {
        apiUrl = `/api/stakes/${selectedContract.address}/distribute-rewards`;
        requestBodyFinal = {
          percentageInBasisPoints: parseInt(params[0]) // Apenas o parâmetro necessário, igual ao depositRewards
        };

      } else {
        apiUrl = '/api/contracts/write';
        requestBodyFinal = requestBody;
      }
      
      const response = await api.post(apiUrl, requestBodyFinal);
      
      if (response.data.success) {
        // Se foi distributeReward, atualizar metadata do contrato
        if (func.name === 'distributeReward' && params[0]) {
          try {
            // Encode the address properly for URL
            const encodedAddress = encodeURIComponent(selectedContract.address);
            
            await api.patch(`/api/stake-contracts/${encodedAddress}/distribution`, {
              percentage: parseInt(params[0]), // Primeiro parâmetro é o percentage
              network: selectedContract.network // Passar a network para buscar cycleDurationInDays
            });
            
            
            // Refresh MeuPedacinhoPratique component if available
            if (window.refreshMeuPedacinhoPratique) {
              setTimeout(() => {
                window.refreshMeuPedacinhoPratique();
              }, 1000); // Delay para garantir que o backend processou
            }
          } catch (updateError) {
            console.error('Failed to update distribution data:', updateError.response?.data || updateError);
          }
        }
        
        setFunctionResults(prev => ({
          ...prev,
          [functionKey]: {
            success: true,
            data: {
              transactionHash: response.data.data.transactionHash,
              gasUsed: response.data.data.gasUsed
            }
          }
        }));
        showSuccess(`Transação enviada com sucesso! Hash: ${response.data.data.transactionHash}`);
      }
    } catch (error) {
      console.error('Error executing write function:', error);
      
      let errorMessage = '';
      let errorType = 'general';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
        
        // Identify specific error types for better user feedback
        if (errorMessage.includes('timed out') || errorMessage.includes('timeout')) {
          errorType = 'timeout';
          errorMessage = `Transação '${func.name}' expirou - Esta função pode não existir no contrato implantado ou a rede pode estar congestionada`;
        } else if (errorMessage.includes('Function call timeout')) {
          errorType = 'timeout';
          errorMessage = `Função '${func.name}' não está disponível no contrato implantado`;
        } else if (errorMessage.includes('CALL_EXCEPTION')) {
          errorType = 'call_exception';
          errorMessage = `Transação '${func.name}' falhou - Verifique se os parâmetros estão corretos ou se a função existe no contrato`;
        } else if (errorMessage.includes('missing revert data')) {
          errorType = 'missing_function';
          errorMessage = `Função '${func.name}' não foi encontrada no contrato implantado`;
        } else if (errorMessage.includes('insufficient gas')) {
          errorType = 'gas';
          errorMessage = `Gas insuficiente para executar '${func.name}' - Tente aumentar o limite de gas`;
        } else if (errorMessage.includes('revert')) {
          errorType = 'revert';
          errorMessage = `Transação '${func.name}' foi revertida pelo contrato - Verifique as condições da função`;
        } else if (errorMessage.includes('network')) {
          errorType = 'network';
          errorMessage = `Erro de rede ao executar transação '${func.name}' - Tente novamente`;
        } else if (errorMessage.includes('Admin address not found')) {
          errorType = 'admin';
          errorMessage = `Endereço do administrador não configurado para este contrato - Contate o administrador`;
        }
      } else {
        errorMessage = error.message || 'Erro desconhecido';
      }
      
      setFunctionResults(prev => ({
        ...prev,
        [functionKey]: {
          success: false,
          error: errorMessage,
          errorType: errorType
        }
      }));
      
      showError(errorMessage);
    } finally {
      setExecutingFunction(null);
    }
  };

  const renderFunctionCard = (func, isWrite = false) => {
    const functionKey = func.key || func.name;
    const isExpanded = expandedFunctions[functionKey];
    const isExecuting = executingFunction === functionKey;
    const result = functionResults[functionKey];

    return (
      <div key={functionKey} className="border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleFunction(functionKey)}
          className={`w-full px-4 py-3 flex items-center justify-between ${
            isWrite 
              ? 'bg-orange-100 dark:bg-orange-900/20 hover:bg-orange-200 dark:hover:bg-orange-900/30' 
              : 'bg-blue-100 dark:bg-blue-900/20 hover:bg-blue-200 dark:hover:bg-blue-900/30'
          } transition-colors`}
        >
          <div className="flex items-center gap-3">
            {isWrite ? (
              <Zap className="w-5 h-5 text-orange-400" />
            ) : (
              <Eye className="w-5 h-5 text-blue-400" />
            )}
            <span className="font-mono text-sm text-gray-900 dark:text-white">{func.name}</span>
            {func.inputs.length > 0 && (
              <span className="text-xs text-gray-600 dark:text-gray-400">
                ({func.inputs.length} param{func.inputs.length > 1 ? 's' : ''})
              </span>
            )}
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          )}
        </button>

        {isExpanded && (
          <div className="p-4 bg-gray-50 dark:bg-gray-800/50 space-y-4">
            {/* Input Parameters */}
            {func.inputs.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Parameters</h4>
                {func.inputs.map((input, index) => (
                  <div key={`${functionKey}-input-${index}`} className="space-y-1">
                    <label className="text-xs text-gray-600 dark:text-gray-400">
                      {input.name || `param${index}`} ({input.type})
                    </label>
                    <input
                      type="text"
                      placeholder={
                        func.name === 'distributeReward' && input.type.includes('uint256')
                          ? `Enter percentage (e.g., 540 for 5.40%, 1048 for 10.48%)`
                          : input.type.includes('uint256') && input.name?.toLowerCase().includes('amount')
                          ? `Enter amount (1 = 1 token, auto-converts to wei)`
                          : `Enter ${input.type}`
                      }
                      value={functionInputs[functionKey]?.[index] || ''}
                      onChange={(e) => handleInputChange(functionKey, index, e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                      disabled={isExecuting}
                    />
                    {func.name === 'distributeReward' && input.type.includes('uint256') && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                        💡 Percentual: Digite o valor multiplicado por 100 (5,40% = 540, 10,48% = 1048). O valor será enviado exatamente como digitado.
                      </p>
                    )}
                    {func.name !== 'distributeReward' && input.type.includes('uint256') && input.name?.toLowerCase().includes('amount') && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        💡 Tip: Enter whole numbers (e.g., "1" for 1 token). The system automatically converts to wei format.
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Execute Button */}
            <button
              onClick={() => isWrite ? executeWriteFunction(func) : executeReadFunction(func)}
              disabled={isExecuting}
              className={`w-full py-2 px-4 rounded font-medium transition-colors flex items-center justify-center gap-2 ${
                isWrite 
                  ? 'bg-orange-600 hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600 text-white' 
                  : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isExecuting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Executing...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  {isWrite ? 'Send Transaction' : 'Query'}
                </>
              )}
            </button>

            {/* Results */}
            {result && (
              <div className={`p-3 rounded border ${
                result.success 
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700' 
                  : getErrorBorderColor(result.errorType)
              }`}>
                <div className="flex items-start gap-2">
                  {result.success ? (
                    <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                  ) : (
                    getErrorIcon(result.errorType)
                  )}
                  <div className="flex-1 space-y-2">
                    <p className="text-sm font-medium">
                      {result.success ? 'Success' : getErrorTitle(result.errorType)}
                    </p>
                    {result.success && result.data !== undefined && result.data !== null && (
                      <div className="text-xs font-mono bg-gray-100 dark:bg-gray-900 p-2 rounded overflow-x-auto">
                        {typeof result.data === 'object' && result.data.transactionHash ? (
                          <div className="space-y-1">
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">TX Hash: </span>
                              <span className="text-blue-600 dark:text-blue-400">{result.data.transactionHash}</span>
                            </div>
                            {result.data.gasUsed && (
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">Gas Used: </span>
                                <span className="text-green-600 dark:text-green-400">{result.data.gasUsed}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <pre className="text-green-600 dark:text-green-400">
                            {func.outputs.length > 0 
                              ? formatOutput(result.data, func.outputs[0].type)
                              : JSON.stringify(result.data, null, 2)}
                          </pre>
                        )}
                      </div>
                    )}
                    {result.error && (
                      <div className="space-y-2">
                        <p className="text-xs text-red-600 dark:text-red-400">{result.error}</p>
                        {(result.errorType === 'timeout' || result.errorType === 'missing_function') && (
                          <div className="text-xs text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-600 rounded p-2">
                            <p className="font-medium mb-1">💡 Dica:</p>
                            <p>Esta função pode estar definida no ABI mas não implementada no contrato implantado. Verifique se o contrato foi implantado com a versão mais recente.</p>
                          </div>
                        )}
                        {result.errorType === 'access_denied' && (
                          <div className="text-xs text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-600 rounded p-2">
                            <p className="font-medium mb-1">🔒 Acesso Restrito:</p>
                            <p>Esta função requer permissions de administrador no smart contract. Para executar funções com controle de acesso é necessário conectar uma carteira admin diretamente ao contrato.</p>
                          </div>
                        )}
                        {result.errorType === 'call_exception' && (
                          <div className="text-xs text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-600 rounded p-2">
                            <p className="font-medium mb-1">🔧 Sugestão:</p>
                            <p>Verifique se todos os parâmetros estão no formato correto e se você tem as permissões necessárias para executar esta função.</p>
                          </div>
                        )}
                        {result.errorType === 'network' && (
                          <div className="text-xs text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 border border-purple-300 dark:border-purple-600 rounded p-2">
                            <p className="font-medium mb-1">🌐 Rede:</p>
                            <p>Problema de conectividade. Aguarde alguns segundos e tente novamente.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3 text-gray-900 dark:text-white">
          <FileCode className="w-8 h-8 text-blue-500" />
          Contract Interaction
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Execute functions on registered smart contracts
        </p>
      </div>

      {/* Contract Selector */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
            <Coins className="w-5 h-5 text-yellow-500" />
            Select Contract
          </h2>
          <button
            onClick={updateAllABIs}
            disabled={updatingAllABIs}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
          >
            {updatingAllABIs ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <FileCode className="w-4 h-4" />
                Update All ABIs
              </>
            )}
          </button>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {contracts.map(contract => {
              // console.log('Contract full data:', contract);
              return (
              <button
                key={contract.id}
                onClick={() => setSelectedContract(contract)}
                className={`p-4 rounded-lg border transition-all text-left ${
                  selectedContract?.id === contract.id
                    ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-500 dark:border-blue-500'
                    : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {/* Contract Type Icon */}
                    {contract.contractType === 'token' ? (
                      <div className="w-10 h-10 rounded-full flex items-center justify-center">
                        <Image src={`/assets/images/currencies/${contract.symbol}.png`} alt={contract.symbol} />
                      </div>
                    ) : contract.contractType === 'stake' ? (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-400 to-pink-500 flex items-center justify-center">
                        <Layers className="w-5 h-5 text-white" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center">
                        <FileCode className="w-5 h-5 text-white" />
                      </div>
                    )}
                    <div>
                      <span className="font-semibold text-gray-900 dark:text-white">{contract.name}</span>
                      {contract.contractType === 'token' && contract.symbol && (
                        <span className="font-semibold ms-1 text-gray-600 dark:text-gray-400">({contract.symbol})</span>
                      )}
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    contract.contractType === 'token' 
                      ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400' 
                      : contract.contractType === 'stake'
                      ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-400'
                      : 'bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-400'
                  }`}>
                    {contract.contractType}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-mono truncate">
                  {contract.address}
                </p>
                {contract.adminAddress && (
                  <div className="flex items-center gap-1 mt-2">
                    <Shield className="w-3 h-3 text-amber-400" />
                    <span className="text-xs text-gray-600 dark:text-gray-500">Admin:</span>
                    <span className="text-xs text-amber-600 dark:text-amber-400 font-mono truncate">{contract.adminAddress}</span>
                  </div>
                )}
                <p className="text-xs text-gray-600 dark:text-gray-500 mt-2">
                  Network: <span className="text-gray-500 dark:text-gray-400">{contract.network}</span>
                </p>
              </button>
              );
            })}
          </div>
        )}

        {contracts.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-600 dark:text-gray-400">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400 dark:text-gray-500" />
            <p>No contracts registered yet</p>
          </div>
        )}
      </div>

      {/* Contract Functions */}
      {selectedContract && !selectedContract.abi && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-600 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-yellow-600 dark:text-yellow-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-yellow-700 dark:text-yellow-400 mb-2">
            ABI não encontrado
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Este contrato foi registrado sem ABI. Clique no botão abaixo para adicionar o ABI padrão de stake.
          </p>
          <button
            onClick={() => updateContractABI(selectedContract.id)}
            disabled={updatingABI}
            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-500 dark:hover:bg-yellow-600 text-white rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
          >
            {updatingABI ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Atualizando ABI...
              </>
            ) : (
              <>
                <Code2 className="w-4 h-4" />
                Atualizar ABI
              </>
            )}
          </button>
        </div>
      )}


      {/* Contract Functions */}
      {selectedContract && selectedContract.abi && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Read Functions */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
              <Eye className="w-5 h-5 text-blue-400" />
              Read Functions
              <span className="text-xs text-gray-500 dark:text-gray-400">
                (No gas required)
              </span>
            </h2>
            <div className="space-y-3">
              {contractFunctions.read.length > 0 ? (
                contractFunctions.read.map(func => renderFunctionCard(func, false))
              ) : (
                <p className="text-gray-600 dark:text-gray-400 text-sm">No read functions available</p>
              )}
            </div>
          </div>

          {/* Write Functions */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
              <Zap className="w-5 h-5 text-orange-400" />
              Write Functions
              <span className="text-xs text-gray-500 dark:text-gray-400">
                (Requires gas)
              </span>
            </h2>
            <div className="space-y-3">
              {contractFunctions.write.length > 0 ? (
                contractFunctions.write.map(func => renderFunctionCard(func, true))
              ) : (
                <p className="text-gray-600 dark:text-gray-400 text-sm">No write functions available</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}