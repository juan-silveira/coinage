"use client";
import React, { useState, useEffect } from 'react';
import Image from '@/components/ui/Image';
import { 
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';
import Icon from '@/components/ui/Icon';
import Tooltip from '@/components/ui/Tooltip';
import { useRouter } from 'next/navigation';

import stakeContractsService from '@/services/stakeContractsService';
import { useAuth } from '@/hooks/useAuth';
import { useAlertContext } from '@/contexts/AlertContext';
import api from '@/services/api';
import useCachedBalances from '@/hooks/useCachedBalances';
import Card from '@/components/ui/Card';

// Import modals
import ClaimRewardsModal from './modals/ClaimRewardsModal';
import CompoundRewardsModal from './modals/CompoundRewardsModal';

const MeuPedacinhoPratique = () => {
  const { user } = useAuth();
  const { showError } = useAlertContext();
  const router = useRouter();
  
  // Hook para obter saldos
  const {
    getBalance,
    loading: balancesLoading,
  } = useCachedBalances();
  
  const [expandedCards, setExpandedCards] = useState({});
  const [loading, setLoading] = useState(true);
  const [pratiqueContracts, setPratiqueContracts] = useState([]);
  const [tokenInfo, setTokenInfo] = useState({}); // Armazenar informações dos tokens
  const [contractRewards, setContractRewards] = useState({}); // Armazenar rewards por contrato
  const [loadingRewards, setLoadingRewards] = useState({});
  const [contractStakeData, setContractStakeData] = useState({}); // Armazenar dados de stake por contrato
  const [loadingStakeData, setLoadingStakeData] = useState({});
  
  // Modal states
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [compoundModalOpen, setCompoundModalOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);

  // Load contracts que contenham "Pedacinho Pratique" no nome
  useEffect(() => {
    loadPratiqueContracts();
  }, [user]);
  
  // Load rewards and stake data for each contract
  useEffect(() => {
    const userAddress = user?.walletAddress || user?.blockchainAddress || user?.publicKey;
    if (pratiqueContracts.length > 0 && userAddress) {
      pratiqueContracts.forEach(contract => {
        loadContractRewards(contract);
        loadContractStakeData(contract);
      });
    }
  }, [pratiqueContracts, user]);

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


  const toggleCard = (index) => {
    setExpandedCards(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };
  
  // Função para carregar rewards de um contrato
  const loadContractRewards = async (contract) => {
    try {
      setLoadingRewards(prev => ({ ...prev, [contract.address]: true }));
      const userAddress = user?.walletAddress || user?.blockchainAddress || user?.publicKey;
      
      // Se não há endereço de usuário, não tentar carregar
      if (!userAddress) {
        console.warn('No user address available for loading rewards');
        setContractRewards(prev => ({ ...prev, [contract.address]: '0' }));
        return;
      }
      
      const response = await api.post('/api/contracts/read', {
        contractAddress: contract.address,
        functionName: 'getPendingReward',
        params: [userAddress],
        network: contract.network || 'testnet'
      });
      
      if (response.data.success && response.data.data?.result) {
        const rewardsInWei = response.data.data.result;
        // Converter de wei para decimal
        const rewardsInEther = (parseFloat(rewardsInWei) / 10**18).toString();
        setContractRewards(prev => ({ ...prev, [contract.address]: rewardsInEther }));
      } else {
        setContractRewards(prev => ({ ...prev, [contract.address]: '0' }));
      }
    } catch (error) {
      // Silenciar erro 400 pois pode ser normal (função não existe ou usuário sem rewards)
      if (error.response?.status !== 400) {
        console.error('Error loading rewards for contract:', contract.address, error.message);
      }
      setContractRewards(prev => ({ ...prev, [contract.address]: '0' }));
    } finally {
      setLoadingRewards(prev => ({ ...prev, [contract.address]: false }));
    }
  };
  
  // Função para carregar dados de stake de um contrato
  const loadContractStakeData = async (contract) => {
    try {
      setLoadingStakeData(prev => ({ ...prev, [contract.address]: true }));
      const userAddress = user?.walletAddress || user?.blockchainAddress || user?.publicKey;
      
      // Carregar saldo do usuário em stake
      const userStakeResponse = await api.post('/api/contracts/read', {
        contractAddress: contract.address,
        functionName: 'getTotalStakeBalance',
        params: [userAddress],
        network: contract.network
      });
      
      // Carregar total staked supply
      const totalStakedResponse = await api.post('/api/contracts/read', {
        contractAddress: contract.address,
        functionName: 'getTotalStakedSupply',
        params: [],
        network: contract.network
      });
      
      let userStake = '0';
      let totalStaked = '0';
      
      if (userStakeResponse.data.success && userStakeResponse.data.data?.result) {
        const stakeInWei = userStakeResponse.data.data.result;
        userStake = (parseFloat(stakeInWei) / 10**18).toString();
      }
      
      if (totalStakedResponse.data.success && totalStakedResponse.data.data?.result) {
        const totalInWei = totalStakedResponse.data.data.result;
        totalStaked = (parseFloat(totalInWei) / 10**18).toString();
      }
      
      setContractStakeData(prev => ({ 
        ...prev, 
        [contract.address]: {
          userStake,
          totalStaked
        }
      }));
      
    } catch (error) {
      console.error('Error loading stake data for contract:', contract.address, error);
      setContractStakeData(prev => ({ 
        ...prev, 
        [contract.address]: {
          userStake: '0',
          totalStaked: '0'
        }
      }));
    } finally {
      setLoadingStakeData(prev => ({ ...prev, [contract.address]: false }));
    }
  };
  
  // Handlers para modais
  const handleClaimClick = (contract) => {
    setSelectedContract(contract);
    setClaimModalOpen(true);
  };
  
  const handleCompoundClick = (contract) => {
    setSelectedContract(contract);
    setCompoundModalOpen(true);
  };
  
  const handleStakeClick = (contract) => {
    router.push(`/stake/investir?contract=${contract.address}&network=${contract.network}`);
  };
  
  const handleUnstakeClick = (contract) => {
    router.push(`/stake/retirar?contract=${contract.address}&network=${contract.network}`);
  };
  
  const handleBuyClick = () => {
    router.push('/exchange?tab=buy&from=PIX&to=PCN');
  };
  
  const handleSellClick = () => {
    router.push('/exchange?tab=sell&from=PCN&to=PIX');
  };
  
  const handleModalSuccess = () => {
    // Recarregar dados após ação bem-sucedida
    loadPratiqueContracts(true);
    if (selectedContract) {
      loadContractRewards(selectedContract);
    }
  };

  // Função para forçar reload dos contratos (para ser chamada após distributeReward)
  const refreshContractsData = () => {
    // Limpar cache do service
    stakeContractsService.clearCache();
    // Recarregar dados
    loadPratiqueContracts(true);
  };

  // Expor a função para ser chamada externamente
  window.refreshMeuPedacinhoPratique = refreshContractsData;
  
  const formatRewards = (rewards) => {
    const rewardsNum = parseFloat(rewards || '0');
    if (rewardsNum === 0) return '0,000000';
    
    const parts = rewardsNum.toString().split('.');
    const integerPart = parts[0];
    const decimalPart = parts[1] || '000000';
    const formattedIntegerPart = Number(integerPart).toLocaleString('pt-BR');
    return `${formattedIntegerPart},${decimalPart.padEnd(6, '0').slice(0, 6)}`;
  };
  
  const getRiskBadge = (riskLevel) => {
    const riskConfig = {
      0: {
        label: 'Muito Baixo',
        color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
        icon: 'bi:reception-0'
      },
      1: {
        label: 'Baixo',
        color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
        icon: 'bi:reception-1'
      },
      2: {
        label: 'Médio',
        color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
        icon: 'bi:reception-2'
      },
      3: {
        label: 'Alto',
        color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
        icon: 'bi:reception-3'
      },
      4: {
        label: 'Muito Alto',
        color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
        icon: 'bi:reception-4'
      }
    };
    
    const risk = riskConfig[riskLevel] || riskConfig[1];
    
    return (
      <Tooltip content={`Risco: ${risk.label}`} placement="top">
        <span className={`inline-flex items-center px-2 py-1 rounded-full ${risk.color}`}>
          <Icon icon={risk.icon} className="w-4 h-4" />
        </span>
      </Tooltip>
    );
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return '--';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
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
        
        {/* Card com saldo PCN */}
        <Card bodyClass="px-4 py-2">
          <div className="flex items-center space-x-2">
            <img
              src="/assets/images/currencies/PCN.png"
              alt="PCN"
              className="w-6 h-6"
            />
            <div>
              <div className="text-xs">
                Saldo PCN
              </div>
              <div className="balance font-bold">
                {balancesLoading ? (
                  <div className="h-4 w-20 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-500 rounded animate-pulse"></div>
                ) : (
                  <>
                    {(() => {
                      const pcnBalance = getBalance('PCN');
                      const parts = pcnBalance.split('.');
                      const integerPart = parts[0];
                      const decimalPart = parts[1] || '';
                      const formattedIntegerPart = Number(integerPart).toLocaleString('pt-BR');
                      return decimalPart
                        ? `${formattedIntegerPart},${decimalPart}`
                        : formattedIntegerPart;
                    })()}
                  </>
                )}
              </div>
            </div>
          </div>
        </Card>
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
          {pratiqueContracts.map((contract, index) => {
            const stakeData = contractStakeData[contract.address] || { userStake: '0', totalStaked: '0' };
            const isLoadingStake = loadingStakeData[contract.address];
            
            return (
            <div key={contract.address || index} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <h3 className="text-center text-lg font-semibold text-gray-900 dark:text-white">
                  {contract.name}
                </h3>
                <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-4">
                  <a href={`https://floripa.azorescan.com/address/${contract.address}`} target="_blank" rel="noopener noreferrer">{contract.address ? `${contract.address.slice(0, 6)}...${contract.address.slice(-4)}` : 'N/A'}</a>
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
                    {loadingRewards[contract.address] ? (
                      <div className="animate-pulse">
                        <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded mb-1"></div>
                        <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-24 mx-auto"></div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-baseline justify-center">
                          {(() => {
                            const rewards = contractRewards[contract.address] || '0';
                            const parts = formatRewards(rewards).split(',');
                            return (
                              <>
                                <span className="text-2xl font-bold text-gray-900 dark:text-white">{parts[0]}</span>
                                <span className="text-lg">,</span>
                                <span className="text-sm text-gray-600 dark:text-gray-400">{parts[1]}</span>
                              </>
                            );
                          })()}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 uppercase mt-1">
                          {tokenInfo[contract.address]?.symbol || 'PCN'} à receber
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex flex-col space-y-2">
                    <button 
                      disabled={!contractRewards[contract.address] || parseFloat(contractRewards[contract.address]) <= 0}
                      onClick={() => handleClaimClick(contract)}
                      className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                        contractRewards[contract.address] && parseFloat(contractRewards[contract.address]) > 0
                          ? 'text-red-600 border border-red-600 hover:bg-red-50 cursor-pointer'
                          : 'text-gray-400 border border-gray-300 cursor-not-allowed'
                      }`}
                    >
                      Receber
                    </button>
                    <button 
                      disabled={!contractRewards[contract.address] || parseFloat(contractRewards[contract.address]) <= 0}
                      onClick={() => handleCompoundClick(contract)}
                      className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                        contractRewards[contract.address] && parseFloat(contractRewards[contract.address]) > 0
                          ? 'text-red-600 border border-red-600 hover:bg-red-50 cursor-pointer'
                          : 'text-gray-400 border border-gray-300 cursor-not-allowed'
                      }`}
                    >
                      Reinvestir
                    </button>
                  </div>
                </div>

                {/* Botões de ação */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                  <button 
                    onClick={handleBuyClick}
                    className="px-2 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-full cursor-pointer transition-colors"
                  >
                    Comprar
                  </button>
                  <button 
                    onClick={handleSellClick}
                    className="px-2 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-full cursor-pointer transition-colors"
                  >
                    Vender
                  </button>
                  <button 
                    onClick={() => handleStakeClick(contract)}
                    className="px-2 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-full cursor-pointer transition-colors"
                  >
                    Investir
                  </button>
                  <button 
                    onClick={() => handleUnstakeClick(contract)}
                    className="px-2 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-full cursor-pointer transition-colors"
                  >
                    Retirar
                  </button>
                </div>

                {/* Informações principais */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Risco:</span>
                    {getRiskBadge(contract.metadata?.risk ?? 1)}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Último Trimestral:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {contract.metadata?.lastDistribution || '--'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Próximo Vencimento:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {formatDate(contract.metadata?.nextDistribution)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Meu Stake:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {isLoadingStake ? (
                        <div className="h-4 w-16 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
                      ) : (
                        <div className="flex items-baseline">
                          {(() => {
                            const parts = formatRewards(stakeData.userStake).split(',');
                            return (
                              <>
                                <span className="text-lg font-bold">{parts[0]}</span>
                                <span className="text-sm">,</span>
                                <span className="text-xs text-gray-600 dark:text-gray-400">{parts[1]}</span>
                              </>
                            );
                          })()}
                        </div>
                      )}
                    </span>
                  </div>
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
                    <div className="space-y-3">
                      {/* Total Staked Supply */}
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Total em Stake:</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {isLoadingStake ? (
                            <div className="h-4 w-20 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
                          ) : (
                            <div className="flex items-baseline">
                              {(() => {
                                const parts = formatRewards(stakeData.totalStaked).split(',');
                                return (
                                  <>
                                    <span className="text-lg font-bold">{parts[0]}</span>
                                    <span className="text-sm">,</span>
                                    <span className="text-xs text-gray-600 dark:text-gray-400">{parts[1]}</span>
                                  </>
                                );
                              })()}
                            </div>
                          )}
                        </span>
                      </div>
                      
                      {/* Informações técnicas */}
                      <div className="space-y-2 text-xs">
                        {/* <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Endereço:</span>
                          <span className="font-mono text-gray-900 dark:text-white">
                            {contract.address ? `${contract.address.slice(0, 6)}...${contract.address.slice(-4)}` : 'N/A'}
                          </span>
                        </div> */}
                        {/* <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Network:</span>
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {contract.network || 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Status:</span>
                          <span className="font-semibold text-green-600">
                            {contract.userWhitelisted ? 'Autorizado' : 'Público'}
                          </span>
                        </div> */}
                      </div>
                      
                      <Tooltip 
                        content="Contrato de stake inteligente para investimento em participação empresarial."
                        placement="top"
                      >
                        <div className="w-full flex items-center justify-center text-red-600 hover:text-red-700 transition-colors cursor-help mt-3">
                          <Info size={16} className="mr-2" />
                          <span className="text-sm font-medium">Meu Pedacinho Pratique</span>
                        </div>
                      </Tooltip>
                      {contract.hasError && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1 text-center">
                          (Erro ao carregar alguns dados)
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            );
          })}
        </div>
      )}
      
      {/* Modais */}
      {selectedContract && (
        <>
          <ClaimRewardsModal
            isOpen={claimModalOpen}
            onClose={() => setClaimModalOpen(false)}
            contract={selectedContract}
            userAddress={user?.walletAddress || user?.blockchainAddress || user?.publicKey}
            rewardsAmount={contractRewards[selectedContract.address] || '0'}
            onSuccess={handleModalSuccess}
          />
          
          <CompoundRewardsModal
            isOpen={compoundModalOpen}
            onClose={() => setCompoundModalOpen(false)}
            contract={selectedContract}
            userAddress={user?.walletAddress || user?.blockchainAddress || user?.publicKey}
            rewardsAmount={contractRewards[selectedContract.address] || '0'}
            onSuccess={handleModalSuccess}
          />
          
        </>
      )}
    </div>
  );
};

export default MeuPedacinhoPratique;