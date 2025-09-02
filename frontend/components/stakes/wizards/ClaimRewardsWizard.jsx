/**
 * ClaimRewardsWizard - Wizard para resgate de recompensas
 */

"use client";
import React, { useState, useMemo } from 'react';
import WizardModal from './WizardModal';
import ConfirmationStep from '../steps/ConfirmationStep';
import TransactionStep from '../steps/TransactionStep';
import { useStakeOperations } from '@/hooks/useStakeOperations';
import { useStakeData } from '@/hooks/useStakeData';
import { formatFromWei, formatToWei } from '@/utils/stakeHelpers';
import { Gift, TrendingUp } from 'lucide-react';

const ClaimRewardsWizard = ({
  isOpen,
  onClose,
  productId,
  onSuccess = null
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [transactionResult, setTransactionResult] = useState(null);

  // Hooks
  const { product, stakeData, loading: dataLoading, refetch } = useStakeData(productId);
  const { claimRewards, loading, error, clearError } = useStakeOperations(productId, {
    onSuccess: (result) => {
      setTransactionResult(result);
      if (onSuccess) onSuccess(result);
      refetch();
    }
  });

  const steps = [
    {
      title: "Confirmação",
      subtitle: "Confirme o resgate de suas recompensas",
      loadingText: "Preparando transação...",
    },
    {
      title: "Transação",
      subtitle: "Processando resgate de recompensas",
      loadingText: "Executando transação...",
      finishingText: "Processando...",
      finishText: "Finalizar"
    }
  ];

  const pendingRewards = stakeData?.userData?.pendingReward || "0";
  const tokenSymbol = product?.contracts?.rewardToken?.symbol || "PCN";
  const rewardsFormatted = formatFromWei(pendingRewards);

  // Check if there are rewards to claim
  const hasRewards = parseFloat(pendingRewards) > 0;

  const canGoNext = useMemo(() => {
    switch (currentStep) {
      case 0: return hasRewards;
      case 1: return false;
      default: return true;
    }
  }, [currentStep, hasRewards]);

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
      await claimRewards();
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
        // Show rewards summary or no rewards message
        if (!hasRewards) {
          return (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Gift className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Nenhuma Recompensa Disponível
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Você não possui recompensas pendentes para resgate no momento.
              </p>
            </div>
          );
        }

        return (
          <>
            {/* Rewards Summary */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Gift className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Resgatar Recompensas
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Você tem recompensas disponíveis para resgate
              </p>
            </div>

            {/* Rewards Amount */}
            <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-6 mb-6">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
                  <span className="text-sm font-medium text-green-700 dark:text-green-300 uppercase tracking-wide">
                    Recompensas Disponíveis
                  </span>
                </div>
                
                <div className="text-3xl font-bold text-green-800 dark:text-green-200">
                  {rewardsFormatted.full}
                  <span className="text-lg ml-2 text-green-600 dark:text-green-400">{tokenSymbol}</span>
                </div>
              </div>
            </div>

            <ConfirmationStep
              operationType="claim"
              product={product}
              amount={pendingRewards}
              tokenSymbol={tokenSymbol}
              riskLevel={product?.risk || 1}
              warnings={[]}
              additionalInfo={{
                "Valor a Receber": `${rewardsFormatted.full} ${tokenSymbol}`,
                "Taxa de Operação": "0%",
                "Tempo de Processamento": "Imediato"
              }}
            />
          </>
        );

      case 1:
        return (
          <TransactionStep
            status={transactionResult ? "success" : loading ? "processing" : error ? "failed" : "pending"}
            transactionHash={transactionResult?.transactionHash}
            operationType="claim"
            amount={pendingRewards}
            tokenSymbol={tokenSymbol}
            product={product}
            error={error}
            estimatedTime="1-2 minutos"
            onRetry={handleRetry}
            onClose={handleClose}
            explorerUrl={process.env.NEXT_PUBLIC_TESTNET_EXPLORER}
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
      title={`Resgatar Recompensas - ${product.name}`}
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

export default ClaimRewardsWizard;