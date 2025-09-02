/**
 * CompoundRewardsWizard - Wizard para reinvestimento de recompensas (compound)
 */

"use client";
import React, { useState, useMemo } from 'react';
import WizardModal from './WizardModal';
import ConfirmationStep from '../steps/ConfirmationStep';
import TransactionStep from '../steps/TransactionStep';
import { useStakeOperations } from '@/hooks/useStakeOperations';
import { useStakeData } from '@/hooks/useStakeData';
import { formatFromWei, formatToWei } from '@/utils/stakeHelpers';
import { RotateCcw, TrendingUp, Info } from 'lucide-react';

const CompoundRewardsWizard = ({
  isOpen,
  onClose,
  productId,
  onSuccess = null
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [transactionResult, setTransactionResult] = useState(null);

  // Hooks
  const { product, stakeData, loading: dataLoading, refetch } = useStakeData(productId);
  const { compound, loading, error, clearError, canCompound } = useStakeOperations(productId, {
    onSuccess: (result) => {
      setTransactionResult(result);
      if (onSuccess) onSuccess(result);
      refetch();
    }
  });

  const steps = [
    {
      title: "Confirmação",
      subtitle: "Confirme o reinvestimento de suas recompensas",
      loadingText: "Preparando transação...",
    },
    {
      title: "Transação",
      subtitle: "Processando reinvestimento",
      loadingText: "Executando transação...",
      finishingText: "Processando...",
      finishText: "Finalizar"
    }
  ];

  const pendingRewards = stakeData?.userData?.pendingReward || "0";
  const currentStakeBalance = stakeData?.userData?.totalStakeBalance || "0";
  const tokenSymbol = product?.contracts?.stakeToken?.symbol || "PCN";
  const rewardsFormatted = formatFromWei(pendingRewards);
  const currentStakeFormatted = formatFromWei(currentStakeBalance);

  // Check if there are rewards to compound and if compound is allowed
  const hasRewards = parseFloat(pendingRewards) > 0;
  const isCompoundAllowed = product?.defaultConfig?.allowCompound || false;

  const canGoNext = useMemo(() => {
    switch (currentStep) {
      case 0: return hasRewards && isCompoundAllowed && canCompound;
      case 1: return false;
      default: return true;
    }
  }, [currentStep, hasRewards, isCompoundAllowed, canCompound]);

  const canGoPrevious = useMemo(() => {
    if (loading) return false;
    return currentStep > 0 && currentStep < 1;
  }, [currentStep, loading]);

  const handleStepChange = (step) => {
    setCurrentStep(step);
    clearError();
  };

  const handleFinish = async () => {
    if (currentStep === 0) {
      await compound();
      setCurrentStep(1);
    } else if (currentStep === 1) {
      handleClose();
    }
  };

  const handleClose = () => {
    setCurrentStep(0);
    setTransactionResult(null);
    clearError();
    onClose();
  };

  const handleRetry = () => {
    setCurrentStep(0);
    clearError();
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        // Check for various conditions
        if (!isCompoundAllowed) {
          return (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <RotateCcw className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Reinvestimento Não Disponível
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Este produto não permite reinvestimento automático de recompensas.
              </p>
            </div>
          );
        }

        if (!hasRewards) {
          return (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <RotateCcw className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Nenhuma Recompensa Disponível
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Você não possui recompensas pendentes para reinvestir no momento.
              </p>
            </div>
          );
        }

        return (
          <>
            {/* Compound Summary */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <RotateCcw className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Reinvestir Recompensas
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Reinvista suas recompensas automaticamente para maximizar seus ganhos
              </p>
            </div>

            {/* Compound Details */}
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-6 mb-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-purple-700 dark:text-purple-300">
                    Recompensas a Reinvestir:
                  </span>
                  <span className="text-lg font-bold text-purple-800 dark:text-purple-200">
                    {rewardsFormatted.full} {tokenSymbol}
                  </span>
                </div>
                
                <div className="flex items-center justify-center py-2">
                  <TrendingUp className="w-5 h-5 text-purple-500" />
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-purple-700 dark:text-purple-300">
                    Novo Saldo em Stake:
                  </span>
                  <span className="text-lg font-bold text-purple-800 dark:text-purple-200">
                    {formatFromWei((parseFloat(currentStakeBalance) + parseFloat(pendingRewards)).toString()).full} {tokenSymbol}
                  </span>
                </div>
              </div>
            </div>

            {/* Compound Benefits */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
              <div className="flex items-center mb-3">
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
                <h5 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Vantagens do Reinvestimento
                </h5>
              </div>
              <ul className="space-y-1 text-sm text-blue-700 dark:text-blue-300">
                <li>• Juros compostos: seus ganhos geram mais ganhos</li>
                <li>• Aumento automático da sua participação no stake</li>
                <li>• Maximização do potencial de retorno</li>
                <li>• Sem taxas adicionais para reinvestimento</li>
              </ul>
            </div>

            <ConfirmationStep
              operationType="compound"
              product={product}
              amount={pendingRewards}
              tokenSymbol={tokenSymbol}
              currentBalance={currentStakeBalance}
              newBalance={formatToWei((parseFloat(currentStakeBalance) + parseFloat(pendingRewards)).toString())}
              riskLevel={product?.risk || 1}
              warnings={[]}
              additionalInfo={{
                "Recompensas a Reinvestir": `${rewardsFormatted.full} ${tokenSymbol}`,
                "Stake Atual": `${currentStakeFormatted.full} ${tokenSymbol}`,
                "Novo Total em Stake": `${formatFromWei((parseFloat(currentStakeBalance) + parseFloat(pendingRewards)).toString()).full} ${tokenSymbol}`,
                "Taxa de Operação": "0%"
              }}
            />
          </>
        );

      case 1:
        return (
          <TransactionStep
            status={transactionResult ? "success" : loading ? "processing" : error ? "failed" : "pending"}
            transactionHash={transactionResult?.transactionHash}
            operationType="compound"
            amount={pendingRewards}
            tokenSymbol={tokenSymbol}
            product={product}
            error={error}
            estimatedTime="1-2 minutos"
            onRetry={handleRetry}
            onClose={handleClose}
            explorerUrl={process.env.NEXT_PUBLIC_TESTNET_EXPLORER}
            additionalData={transactionResult ? {
              "Valor Reinvestido": `${rewardsFormatted.full} ${tokenSymbol}`,
              "Novo Saldo Total": `${formatFromWei((parseFloat(currentStakeBalance) + parseFloat(pendingRewards)).toString()).full} ${tokenSymbol}`
            } : {}}
          />
        );

      default:
        return null;
    }
  };

  if (!product) {
    return (
      <WizardModal isOpen={isOpen} onClose={onClose} title="Carregando..." steps={[]} showStepsIndicator={false}>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Carregando informações do produto...</p>
        </div>
      </WizardModal>
    );
  }

  return (
    <WizardModal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Reinvestir Recompensas - ${product.name}`}
      steps={steps}
      currentStep={currentStep}
      onStepChange={handleStepChange}
      loading={loading}
      error={error}
      onFinish={handleFinish}
      canGoNext={canGoNext}
      canGoPrevious={canGoPrevious}
      showStepsIndicator={steps.length > 1}
      size="lg"
    >
      {renderStepContent()}
    </WizardModal>
  );
};

export default CompoundRewardsWizard;