"use client";
import React, { useState, useMemo, useCallback } from 'react';
import Image from '@/components/ui/Image';
import { 
  ChevronDown,
  ChevronUp,
  Info,
  RefreshCw
} from 'lucide-react';

// Import stake system components
import { STAKE_PRODUCTS, getStakeProduct } from '@/constants/stakeProducts';
import { useMultipleStakeData } from '@/hooks/useStakeData';
import { formatFromWei } from '@/utils/stakeHelpers';

// Import wizards
import InvestStakeWizard from '@/components/stakes/wizards/InvestStakeWizard';
import WithdrawStakeWizard from '@/components/stakes/wizards/WithdrawStakeWizard';
import ClaimRewardsWizard from '@/components/stakes/wizards/ClaimRewardsWizard';
import CompoundRewardsWizard from '@/components/stakes/wizards/CompoundRewardsWizard';

const MeuPedacinhoPratique = () => {
  const [expandedCards, setExpandedCards] = useState({});
  
  // Wizard states
  const [activeWizard, setActiveWizard] = useState(null);
  const [selectedProductId, setSelectedProductId] = useState(null);

  // Get Meu Pedacinho Pratique products - memoized to prevent re-renders
  const pratiqueProdutcs = useMemo(() => 
    Object.values(STAKE_PRODUCTS).filter(
      product => product.name.includes('Pratique')
    ), []
  );

  // Memoize product IDs to prevent array recreation
  const productIds = useMemo(() => 
    pratiqueProdutcs.map(p => p.id), 
    [pratiqueProdutcs]
  );

  // Use mock stake data temporarily (until contracts are deployed)
  const {
    stakeDataMap,
    loading: stakesLoading,
    errors,
    refetch
  } = useMultipleStakeData(
    productIds,
    { 
      autoRefresh: false, // Disable auto-refresh 
      refreshInterval: 30000,
      useMockData: false // Now using real contracts - disabled mock data
    }
  );

  // Available balance (mock for now - would come from user context/wallet)
  const availableBalance = "1000000000000000000000"; // 1000 PCN in wei
  const availableBalanceFormatted = useMemo(() => 
    formatFromWei(availableBalance), 
    [availableBalance]
  );

  // Wizard handlers - memoized to prevent re-renders
  const openWizard = useCallback((wizardType, productId) => {
    setSelectedProductId(productId);
    setActiveWizard(wizardType);
  }, []);

  const closeWizard = useCallback(() => {
    setActiveWizard(null);
    setSelectedProductId(null);
  }, []);

  const handleWizardSuccess = useCallback((result) => {
    console.log('Wizard completed successfully:', result);
    // Refetch data after successful operation
    refetch();
  }, [refetch]);

  const getRiskIcon = (risk) => {
    const riskConfig = {
      0: { bars: 0, color: 'text-gray-400', label: 'Muito Baixo' },
      1: { bars: 1, color: 'text-green-500', label: 'Baixo' },
      2: { bars: 2, color: 'text-blue-500', label: 'Médio' },
      3: { bars: 3, color: 'text-yellow-500', label: 'Alto' },
      4: { bars: 4, color: 'text-red-500', label: 'Muito Alto' },
    };

    const config = riskConfig[risk] || riskConfig[0];
    const totalBars = 4;
    
    return (
      <div className="flex items-center space-x-2">
        <div className="flex items-end space-x-0.5">
          {[...Array(totalBars)].map((_, i) => {
            const barHeight = `${(i + 1) * 5}px`;
            const isActive = i < config.bars;
            return (
              <div
                key={i}
                style={{ height: barHeight }}
                className={`w-1 rounded-sm transition-colors ${
                  isActive 
                    ? risk === 1 ? 'bg-green-500' 
                    : risk === 2 ? 'bg-blue-500'
                    : risk === 3 ? 'bg-yellow-500'
                    : risk === 4 ? 'bg-red-500'
                    : 'bg-gray-400'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
              />
            );
          })}
        </div>
        <span className="text-xs text-gray-500">{config.label}</span>
      </div>
    );
  };

  const toggleCard = (index) => {
    setExpandedCards(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header com saldo disponível */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Meu Pedacinho Pratique
          </h2>
          <div className="h-1 w-16 bg-red-500 mt-2"></div>
        </div>
        
        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between space-x-8">
            <div className="flex items-center space-x-2">
              <span className="text-sm opacity-90">Disponível:</span>
              <button
                onClick={refetch}
                disabled={stakesLoading}
                className="p-1 rounded-full hover:bg-white/10 transition-colors disabled:opacity-50"
                title="Atualizar dados"
              >
                <RefreshCw 
                  size={16} 
                  className={`text-white/80 ${stakesLoading ? 'animate-spin' : ''}`} 
                />
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Image src={`assets/images/currencies/PCN.png`} alt="PCN" />
              </div>
              <div className="flex items-baseline">
                <span className="text-2xl font-bold">{availableBalanceFormatted.integer}</span>
                <span className="text-lg">,</span>
                <span className="text-sm opacity-75">{availableBalanceFormatted.decimals}</span>
                <span className="ml-1 text-sm">PCN</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cards de Stakes */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {pratiqueProdutcs.map((product) => {
          const stakeData = stakeDataMap[product.id];
          const hasError = errors[product.id];
          
          return (
            <div key={product.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                {/* Error state */}
                {hasError && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-600 dark:text-red-400">
                      Erro ao carregar dados: {hasError}
                    </p>
                  </div>
                )}
                
                <h3 className="text-center text-lg font-semibold text-gray-900 dark:text-white">
                  {product.name}
                </h3>
                <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-4">
                  {product.subtitle}
                </p>

                <div className="flex justify-between items-center mb-4">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                      <Image 
                        src={`assets/images/currencies/${product.contracts.stakeToken.symbol}.png`} 
                        alt={product.contracts.stakeToken.symbol} 
                      />
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {product.contracts.stakeToken.symbol}
                    </span>
                  </div>

                  <div className="text-center">
                    {stakeData ? (
                      <>
                        <div className="flex items-baseline justify-center">
                          <span className="text-2xl font-bold text-gray-900 dark:text-white">
                            {formatFromWei(stakeData.userData?.pendingReward || '0').integer}
                          </span>
                          <span className="text-lg">,</span>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {formatFromWei(stakeData.userData?.pendingReward || '0').decimals?.substring(0, 6) || '000000'}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 uppercase mt-1">
                          {product.contracts.stakeToken.symbol} à receber
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-500"></div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col space-y-2">
                    <button 
                      onClick={() => openWizard('claim', product.id)}
                      disabled={stakesLoading || !stakeData?.userData?.pendingReward || parseFloat(stakeData.userData.pendingReward) === 0}
                      className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                        !stakesLoading && stakeData?.userData?.pendingReward && parseFloat(stakeData.userData.pendingReward) > 0
                          ? 'text-red-600 border border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
                          : 'text-gray-400 border border-gray-300 cursor-not-allowed'
                      }`}
                    >
                      Receber
                    </button>
                    <button 
                      onClick={() => openWizard('compound', product.id)}
                      disabled={stakesLoading || !stakeData?.userData?.pendingReward || parseFloat(stakeData.userData.pendingReward) === 0 || !product.defaultConfig?.allowCompound}
                      className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                        !stakesLoading && stakeData?.userData?.pendingReward && parseFloat(stakeData.userData.pendingReward) > 0 && product.defaultConfig?.allowCompound
                          ? 'text-red-600 border border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
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
                    onClick={() => openWizard('invest', product.id)}
                    disabled={stakesLoading || product.status !== 'active'}
                    className={`px-2 py-1.5 text-xs font-medium rounded-full transition-colors ${
                      !stakesLoading && product.status === 'active'
                        ? 'text-white bg-red-600 hover:bg-red-700'
                        : 'text-gray-400 bg-gray-300 cursor-not-allowed'
                    }`}
                  >
                    Investir
                  </button>
                  <button 
                    onClick={() => openWizard('withdraw', product.id)}
                    disabled={stakesLoading || !stakeData?.userData?.totalStakeBalance || parseFloat(stakeData.userData.totalStakeBalance) === 0 || !product.defaultConfig?.allowPartialWithdrawal}
                    className={`px-2 py-1.5 text-xs font-medium rounded-full transition-colors ${
                      !stakesLoading && stakeData?.userData?.totalStakeBalance && parseFloat(stakeData.userData.totalStakeBalance) > 0 && product.defaultConfig?.allowPartialWithdrawal
                        ? 'text-white bg-red-600 hover:bg-red-700'
                        : 'text-gray-400 bg-gray-300 cursor-not-allowed'
                    }`}
                  >
                    Retirar
                  </button>
                </div>

                {/* Informações */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Risco:</span>
                    {getRiskIcon(product.risk)}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Último Trimestral:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {product.metadata?.expectedAPY || product.mockData?.quarterlyReturn || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Próximo Vencimento:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {product.mockData?.returnDate || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Meu Stake:</span>
                    {stakeData ? (
                      <div className="flex items-baseline">
                        <span className="text-lg font-bold text-gray-900 dark:text-white">
                          {formatFromWei(stakeData.userData?.totalStakeBalance || '0').integer}
                        </span>
                        <span>,</span>
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {formatFromWei(stakeData.userData?.totalStakeBalance || '0').decimals?.substring(0, 6) || '000000'}
                        </span>
                      </div>
                    ) : (
                      <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-4 w-16 rounded"></div>
                    )}
                  </div>
                </div>

                {/* Divider */}
                <hr className="my-4 border-gray-200 dark:border-gray-700" />

                {/* Expandable section */}
                <button
                  onClick={() => toggleCard(product.id)}
                  className="w-full flex items-center justify-center text-red-600 hover:text-red-700 transition-colors"
                >
                  <span className="text-sm font-medium mr-1">Mais</span>
                  {expandedCards[product.id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {expandedCards[product.id] && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Total Distribuído:
                        </span>
                        <div className="flex items-baseline">
                          <span className="text-lg font-bold text-gray-900 dark:text-white">
                            {product.mockData?.distributedInteger || '0'}
                          </span>
                          <span>,</span>
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            {product.mockData?.distributedDecimals || '000000'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <div className="flex items-center text-red-700 dark:text-red-300">
                          <Info size={16} className="mr-2" />
                          <span className="text-xs font-medium">Meu Pedacinho Pratique</span>
                        </div>
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                          {product.description}
                        </p>
                      </div>
                      
                      {/* Loading indicator for data refresh */}
                      {stakesLoading && (
                        <div className="flex items-center justify-center py-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-500"></div>
                          <span className="ml-2 text-sm text-gray-500">Atualizando dados...</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Wizards */}
      {selectedProductId && (
        <>
          <InvestStakeWizard
            isOpen={activeWizard === 'invest'}
            onClose={closeWizard}
            productId={selectedProductId}
            userBalance={availableBalance}
            onSuccess={handleWizardSuccess}
          />

          <WithdrawStakeWizard
            isOpen={activeWizard === 'withdraw'}
            onClose={closeWizard}
            productId={selectedProductId}
            onSuccess={handleWizardSuccess}
          />

          <ClaimRewardsWizard
            isOpen={activeWizard === 'claim'}
            onClose={closeWizard}
            productId={selectedProductId}
            onSuccess={handleWizardSuccess}
          />

          <CompoundRewardsWizard
            isOpen={activeWizard === 'compound'}
            onClose={closeWizard}
            productId={selectedProductId}
            onSuccess={handleWizardSuccess}
          />
        </>
      )}
    </div>
  );
};

export default MeuPedacinhoPratique;