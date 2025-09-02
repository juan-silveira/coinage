"use client";
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Image from '@/components/ui/Image';
import { 
  ChevronDown,
  ChevronUp,
  Info,
  RefreshCw
} from 'lucide-react';

import stakeContractsService from '@/services/stakeContractsService';
import { useAuth } from '@/hooks/useAuth';
import { useAlertContext } from '@/contexts/AlertContext';
import api from '@/services/api';

const MeuPedacinhoPratique = () => {
  const { user } = useAuth();
  const { showError } = useAlertContext();
  
  const [expandedCards, setExpandedCards] = useState({});
  const [loading, setLoading] = useState(true);
  const [pratiqueContracts, setPratiqueContracts] = useState([]);
  const [tokenInfo, setTokenInfo] = useState({}); // Armazenar informações dos tokens

  // Load contracts que contenham "Pedacinho Pratique" no nome
  useEffect(() => {
    loadPratiqueContracts();
  }, [user]);

  const loadPratiqueContracts = async (forceRefresh = false) => {
    try {
      setLoading(true);
      
      // Limpar cache se forceRefresh
      if (forceRefresh) {
        stakeContractsService.clearCache();
      }
      
      const userAddress = user?.walletAddress || user?.blockchainAddress || user?.publicKey;
      
      
      // Se não há endereço de usuário, não mostrar contratos privados
      if (!userAddress) {
        setPratiqueContracts([]);
        return;
      }
      
      const result = await stakeContractsService.categorizeStakeContracts(userAddress, forceRefresh);
      
      // Para aparecer no Meu Pedacinho Pratique, deve atender TODOS os critérios:
      // 1. Conter "Pedacinho Pratique" no nome
      // 2. Ter whitelistEnabled: true
      // 3. Usuário estar autorizado (userWhitelisted: true)
      const pratiqueContracts = (result.privateOffers || []).filter(contract => 
        contract.name && 
        contract.name.toLowerCase().includes('pedacinho pratique') &&
        contract.whitelistEnabled === true &&
        contract.userWhitelisted === true
      );
      
      
      setPratiqueContracts(pratiqueContracts);
      
      // Carregar informações dos tokens após definir os contratos
      if (pratiqueContracts.length > 0) {
        await loadTokensInfo(pratiqueContracts);
      }
    } catch (error) {
      console.error('Error loading Pratique contracts:', error);
      setPratiqueContracts([]);
      showError('Erro ao carregar contratos Pedacinho Pratique');
    } finally {
      setLoading(false);
    }
  };

  const refetch = useCallback(() => {
    loadPratiqueContracts(true); // Force refresh
  }, [user]);

  // Função para buscar informações de um token específico
  const fetchTokenInfo = async (tokenAddress, network) => {
    try {
      
      // Primeiro tentar via contract call (mais confiável)
      const symbolResponse = await api.post('/api/contracts/read', {
        contractAddress: tokenAddress,
        functionName: 'symbol',
        params: [],
        network
      });
      
      
      if (symbolResponse.data.success && symbolResponse.data.data?.result) {
        const symbol = Array.isArray(symbolResponse.data.data.result) 
          ? symbolResponse.data.data.result[0] 
          : symbolResponse.data.data.result;
        
        
        return {
          symbol: symbol || 'UNKNOWN',
          name: symbol || 'Unknown Token',
          decimals: 18
        };
      }
      
      // Fallback: tentar buscar via GET (pode não estar autenticado)
      try {
        const response = await api.get(`/api/contracts/${tokenAddress}`);
        
        if (response.data.success && response.data.data) {
          const tokenData = response.data.data;
          return {
            symbol: tokenData.symbol || 'UNKNOWN',
            name: tokenData.name || 'Unknown Token',
            decimals: tokenData.decimals || 18
          };
        }
      } catch (apiError) {
      }
      
      return null;
    } catch (error) {
      console.warn(`Failed to fetch token info for ${tokenAddress}:`, error.message);
      return null;
    }
  };

  // Carregar informações dos tokens para todos os contratos
  const loadTokensInfo = async (contracts) => {
    const tokensInfo = {};
    
    for (const contract of contracts) {
      
      // Verificar se existe tokenAddress no metadata
      const tokenAddress = contract.tokenAddress || contract.stakeToken;
      
      
      if (tokenAddress && tokenAddress !== '0x0000000000000000000000000000000000000000') {
        const info = await fetchTokenInfo(tokenAddress, contract.network);
        if (info) {
          tokensInfo[contract.address] = {
            ...info,
            tokenAddress
          };
        } else {
        }
      } else {
      }
    }
    
    setTokenInfo(tokensInfo);
  };

  const getRiskBadge = (contract) => {
    // Determinar risco baseado no tipo de contrato
    let riskLevel = 'Baixo';
    let colorClass = 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    
    if (contract.whitelistEnabled) {
      riskLevel = 'Baixo';
      colorClass = 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    } else {
      riskLevel = 'Médio';
      colorClass = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
    }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
        {riskLevel}
      </span>
    );
  };

  const toggleCard = (index) => {
    setExpandedCards(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };


  // Esconder o componente se está carregando OU se não há contratos disponíveis
  if (loading || pratiqueContracts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Meu Pedacinho Pratique
          </h2>
          <div className="h-1 w-16 bg-red-500 mt-2"></div>
        </div>
        
        <button
          onClick={refetch}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 rounded-lg text-white hover:from-red-600 hover:to-red-700 transition-colors disabled:opacity-50"
          title="Atualizar dados"
        >
          <RefreshCw 
            size={16} 
            className={`text-white ${loading ? 'animate-spin' : ''}`} 
          />
          <span className="text-sm">Atualizar</span>
        </button>
      </div>

      {/* Cards de Stakes */}
      {pratiqueContracts.length === 0 ? (
        <div className="text-center py-12">
          <div className="flex flex-col items-center">
            <Info className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Nenhum contrato Pedacinho Pratique encontrado
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Não há contratos de stake com "Pedacinho Pratique" disponíveis no momento
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {pratiqueContracts.map((contract, index) => (
            <div key={contract.address || index} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <h3 className="text-center text-lg font-semibold text-gray-900 dark:text-white">
                  {contract.name}
                </h3>
                <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-4">
                  (Smart Contract)
                </p>

                <div className="flex justify-between items-center mb-4">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                      <Image 
                        src={`assets/images/currencies/${tokenInfo[contract.address]?.symbol || contract.symbol || 'PCN'}.png`} 
                        alt={tokenInfo[contract.address]?.symbol || contract.symbol || 'PCN'} 
                      />
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {tokenInfo[contract.address]?.symbol || contract.symbol || 'PCN'}
                    </span>
                  </div>

                  <div className="text-center">
                    <div className="flex items-baseline justify-center">
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">0</span>
                      <span className="text-lg">,</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">000000</span>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 uppercase mt-1">
                      {contract.symbol || 'STAKE'} à receber
                    </div>
                  </div>

                  <div className="flex flex-col space-y-2">
                    <button 
                      disabled
                      className="px-3 py-1 text-xs font-medium rounded-full transition-colors text-gray-400 border border-gray-300 cursor-not-allowed"
                    >
                      Receber
                    </button>
                    <button 
                      disabled
                      className="px-3 py-1 text-xs font-medium rounded-full transition-colors text-gray-400 border border-gray-300 cursor-not-allowed"
                    >
                      Reinvestir
                    </button>
                  </div>
                </div>

                {/* Botões de ação */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                  <button 
                    disabled
                    className="px-2 py-1.5 text-xs font-medium text-gray-400 bg-gray-300 rounded-full cursor-not-allowed"
                  >
                    Comprar
                  </button>
                  <button 
                    disabled
                    className="px-2 py-1.5 text-xs font-medium text-gray-400 bg-gray-300 rounded-full cursor-not-allowed"
                  >
                    Vender
                  </button>
                  <button 
                    disabled
                    className="px-2 py-1.5 text-xs font-medium text-gray-400 bg-gray-300 rounded-full cursor-not-allowed"
                  >
                    Investir
                  </button>
                  <button 
                    disabled
                    className="px-2 py-1.5 text-xs font-medium text-gray-400 bg-gray-300 rounded-full cursor-not-allowed"
                  >
                    Retirar
                  </button>
                </div>

                {/* Informações */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Risco:</span>
                    {getRiskBadge(contract)}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Endereço:</span>
                    <span className="font-mono text-xs text-gray-900 dark:text-white">
                      {contract.address ? `${contract.address.slice(0, 6)}...${contract.address.slice(-4)}` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Network:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {contract.network || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Whitelist:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {contract.whitelistEnabled ? 'Privado' : 'Público'}
                    </span>
                  </div>
                  {contract.userWhitelisted && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Status:</span>
                      <span className="font-semibold text-green-600">
                        Autorizado
                      </span>
                    </div>
                  )}
                </div>

                {/* Divider */}
                <hr className="my-4 border-gray-200 dark:border-gray-700" />

                {/* Expandable section */}
                <button
                  onClick={() => toggleCard(index)}
                  className="w-full flex items-center justify-center text-red-600 hover:text-red-700 transition-colors"
                >
                  <span className="text-sm font-medium mr-1">Mais</span>
                  {expandedCards[index] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {expandedCards[index] && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="space-y-2">
                      <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <div className="flex items-center text-red-700 dark:text-red-300">
                          <Info size={16} className="mr-2" />
                          <span className="text-xs font-medium">Meu Pedacinho Pratique</span>
                        </div>
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                          Contrato de stake inteligente para investimento em participação empresarial.
                          {contract.hasError && ' (Erro ao carregar alguns dados)'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MeuPedacinhoPratique;