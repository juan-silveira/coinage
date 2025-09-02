/**
 * StakeProductCard - Componente de card para produtos de stake
 */

"use client";
import React from 'react';
import Image from '@/components/ui/Image';
import { formatFromWei } from '@/utils/stakeHelpers';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';

const StakeProductCard = ({
  product,
  stakeData = null,
  onInvest,
  onWithdraw, 
  onClaimRewards,
  onCompound,
  expanded = false,
  onToggleExpanded,
  loading = false
}) => {
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

  // Usar dados reais do stake ou mock data
  const userData = stakeData?.userData;
  const pendingReward = userData?.pendingReward || product.mockData?.receivableInteger + '.' + product.mockData?.receivableDecimals || '0';
  const stakedBalance = userData?.totalStakeBalance || product.mockData?.stakedInteger + '.' + product.mockData?.stakedDecimals || '0';
  const distributedAmount = product.mockData?.distributedInteger + '.' + product.mockData?.distributedDecimals || '0';

  const pendingRewardFormatted = formatFromWei(pendingReward);
  const stakedBalanceFormatted = formatFromWei(stakedBalance);
  const tokenSymbol = product.contracts?.stakeToken?.symbol || 'PCN';

  // Check if operations are available
  const canClaim = parseFloat(pendingReward) > 0;
  const canCompound = canClaim && product.defaultConfig?.allowCompound;
  const canWithdraw = parseFloat(stakedBalance) > 0 && product.defaultConfig?.allowPartialWithdrawal;
  const canInvest = product.status === 'active' && product.defaultConfig?.stakingEnabled;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <div className="p-6">
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
                src={`assets/images/currencies/${tokenSymbol}.png`} 
                alt={tokenSymbol}
                width={24}
                height={24}
              />
            </div>
            <span className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {tokenSymbol}
            </span>
          </div>

          <div className="text-center">
            <div className="flex items-baseline justify-center">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {pendingRewardFormatted.integer}
              </span>
              <span className="text-lg">,</span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {pendingRewardFormatted.decimals?.substring(0, 6) || '000000'}
              </span>
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 uppercase mt-1">
              {tokenSymbol} à receber
            </div>
          </div>

          <div className="flex flex-col space-y-2">
            <button 
              onClick={onClaimRewards}
              disabled={!canClaim || loading}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                canClaim && !loading
                  ? 'text-red-600 border border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
                  : 'text-gray-400 border border-gray-300 cursor-not-allowed'
              }`}
            >
              Receber
            </button>
            <button 
              onClick={onCompound}
              disabled={!canCompound || loading}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                canCompound && !loading
                  ? 'text-red-600 border border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
                  : 'text-gray-400 border border-gray-300 cursor-not-allowed'
              }`}
            >
              Reinvestir
            </button>
          </div>
        </div>

        {/* Action Buttons */}
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
            onClick={onInvest}
            disabled={!canInvest || loading}
            className={`px-2 py-1.5 text-xs font-medium rounded-full transition-colors ${
              canInvest && !loading
                ? 'text-white bg-red-600 hover:bg-red-700'
                : 'text-gray-400 bg-gray-300 cursor-not-allowed'
            }`}
          >
            Investir
          </button>
          <button 
            onClick={onWithdraw}
            disabled={!canWithdraw || loading}
            className={`px-2 py-1.5 text-xs font-medium rounded-full transition-colors ${
              canWithdraw && !loading
                ? 'text-white bg-red-600 hover:bg-red-700'
                : 'text-gray-400 bg-gray-300 cursor-not-allowed'
            }`}
          >
            Retirar
          </button>
        </div>

        {/* Information */}
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
            <div className="flex items-baseline">
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                {stakedBalanceFormatted.integer}
              </span>
              <span>,</span>
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {stakedBalanceFormatted.decimals?.substring(0, 6) || '000000'}
              </span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <hr className="my-4 border-gray-200 dark:border-gray-700" />

        {/* Expandable section */}
        <button
          onClick={onToggleExpanded}
          className="w-full flex items-center justify-center text-red-600 hover:text-red-700 transition-colors"
        >
          <span className="text-sm font-medium mr-1">Mais</span>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {expanded && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Total Distribuído:
                </span>
                <div className="flex items-baseline">
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    {distributedAmount.split('.')[0]}
                  </span>
                  <span>,</span>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {distributedAmount.split('.')[1] || '000000'}
                  </span>
                </div>
              </div>
              
              <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="flex items-center text-red-700 dark:text-red-300">
                  <Info size={16} className="mr-2" />
                  <span className="text-xs font-medium">
                    {product.category === 'renda-digital' ? 'Meu Pedacinho Pratique' : product.name}
                  </span>
                </div>
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  {product.description || 'Modalidade de distribuição de lucros baseado na proporcionalidade e no prazo de stake.'}
                </p>
              </div>

              {/* Loading indicator for data */}
              {loading && (
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
};

export default StakeProductCard;