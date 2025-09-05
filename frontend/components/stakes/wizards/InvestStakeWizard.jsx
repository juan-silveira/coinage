/**
 * InvestStakeWizard - Wizard para investimentos em stake
 */

"use client";
import React, { useState, useMemo } from 'react';
import WizardModal from './WizardModal';
import AmountStep from '../steps/AmountStep';
import ConfirmationStep from '../steps/ConfirmationStep';
import TransactionStep from '../steps/TransactionStep';
import { useStakeOperations } from '@/hooks/useStakeOperations';
import { useStakeData } from '@/hooks/useStakeData';
import { useStakeValidation } from '@/hooks/useStakeOperations';
import { formatFromWei, formatToWei, calculateProjectedReward } from '@/utils/stakeHelpers';

const InvestStakeWizard = ({
  isOpen,
  onClose,
  productId,
  userBalance = "1000000000000000000000", // 1000 tokens default for demo
  onSuccess = null
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [amount, setAmount] = useState("");
  const [transactionResult, setTransactionResult] = useState(null);

  // Hooks
  const { product, stakeData, loading: dataLoading, refetch } = useStakeData(productId);
  const { invest, loading, error, clearError } = useStakeOperations(productId, {
    onSuccess: (result) => {
      setTransactionResult(result);
      if (onSuccess) onSuccess(result);
      refetch(); // Atualizar dados
    }
  });
  const { validateInvestment } = useStakeValidation(productId);

  // Steps configuration
  const steps = [
    {
      title: "Quantidade",
      subtitle: "Digite a quantidade para investir",
      loadingText: "Validando quantidade...",
    },
    {
      title: "Confirmação", 
      subtitle: "Revise os detalhes do investimento",
      loadingText: "Preparando transação...",
    },
    {
      title: "Transação",
      subtitle: "Processando seu investimento",
      loadingText: "Executando transação...",
      finishingText: "Processando...",
      finishText: "Finalizar"
    }
  ];

  // Validations
  const validation = useMemo(() => {
    if (!amount || amount === "0") {
      return { isValid: false, error: null };
    }
    return validateInvestment(amount, userBalance);
  }, [amount, userBalance, validateInvestment]);

  // Calculated values
  const minAmount = product?.defaultConfig?.minStakeAmount || "0";
  const tokenSymbol = product?.contracts?.stakeToken?.symbol || "PCN";
  const currentBalance = stakeData?.userData?.totalStakeBalance || "0";
  const projectedReward = useMemo(() => {
    if (!amount || !product?.metadata?.expectedAPY) return null;
    
    // Extract average APY from range like "18-24%"
    const apyMatch = product.metadata.expectedAPY.match(/(\d+)-(\d+)%/);
    if (!apyMatch) return null;
    
    const avgAPY = (parseInt(apyMatch[1]) + parseInt(apyMatch[2])) / 2;
    return calculateProjectedReward(amount, avgAPY, 90); // 90 days = 1 quarter
  }, [amount, product?.metadata?.expectedAPY]);

  // Navigation control
  const canGoNext = useMemo(() => {
    switch (currentStep) {
      case 0: // Amount step
        return validation.isValid;
      case 1: // Confirmation step
        return true;
      case 2: // Transaction step
        return false; // No navigation during transaction
      default:
        return true;
    }
  }, [currentStep, validation.isValid]);

  const canGoPrevious = useMemo(() => {
    if (loading) return false;
    return currentStep > 0 && currentStep < 2; // Can't go back during transaction
  }, [currentStep, loading]);

  // Handlers
  const handleStepChange = (step) => {
    setCurrentStep(step);
    clearError();
  };

  const handleAmountChange = (value) => {
    setAmount(value);
    clearError();
  };

  const handleFinish = async () => {
    if (currentStep === 1) {
      // Execute investment
      const amountInWei = formatToWei(amount);
      await invest(amountInWei);
      setCurrentStep(2); // Move to transaction step
    } else if (currentStep === 2) {
      // Close wizard after transaction
      handleClose();
    }
  };

  const handleClose = () => {
    setCurrentStep(0);
    setAmount("");
    setTransactionResult(null);
    clearError();
    onClose();
  };

  const handleRetry = () => {
    setCurrentStep(1); // Go back to confirmation
    clearError();
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <AmountStep
            title="Quanto deseja investir?"
            description="Digite a quantidade de tokens para investir no stake"
            amount={amount}
            onAmountChange={handleAmountChange}
            balance={userBalance}
            tokenSymbol={tokenSymbol}
            minAmount={minAmount}
            placeholder="Digite a quantidade"
            validationError={validation.error}
            showBalance={true}
            showMaxButton={true}
          />
        );

      case 1:
        return (
          <ConfirmationStep
            operationType="invest"
            product={product}
            amount={formatToWei(amount)}
            tokenSymbol={tokenSymbol}
            currentBalance={currentBalance}
            newBalance={formatToWei((parseFloat(currentBalance || "0") + parseFloat(amount)).toString())}
            projectedReward={projectedReward}
            riskLevel={product?.risk || 1}
            warnings={validation.warnings || []}
            additionalInfo={{
              "Ciclo de Distribuição": `${product?.defaultConfig?.cycleDurationDays || 90} dias`,
              "Permite Retirada Parcial": product?.defaultConfig?.allowPartialWithdrawal ? "Sim" : "Não",
              "Permite Reinvestimento": product?.defaultConfig?.allowCompound ? "Sim" : "Não"
            }}
          />
        );

      case 2:
        return (
          <TransactionStep
            status={transactionResult ? "success" : loading ? "processing" : error ? "failed" : "pending"}
            transactionHash={transactionResult?.transactionHash}
            operationType="invest"
            amount={formatToWei(amount)}
            tokenSymbol={tokenSymbol}
            product={product}
            error={error}
            estimatedTime="2-3 minutos"
            onRetry={handleRetry}
            onClose={handleClose}
            explorerUrl={process.env.NEXT_PUBLIC_TESTNET_EXPLORER}
            additionalData={transactionResult ? {
              "Block Number": transactionResult.blockNumber,
              "Gas Used": transactionResult.gasUsed,
              "Status": "Confirmada"
            } : {}}
          />
        );

      default:
        return null;
    }
  };

  if (!product) {
    return (
      <WizardModal
        isOpen={isOpen}
        onClose={onClose}
        title="Carregando..."
        steps={[]}
        showStepsIndicator={false}
      >
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
      title={`Investir em ${product.name}`}
      steps={steps}
      currentStep={currentStep}
      onStepChange={handleStepChange}
      loading={loading}
      error={error}
      onFinish={handleFinish}
      canGoNext={canGoNext}
      canGoPrevious={canGoPrevious}
      showStepsIndicator={true}
      size="lg"
    >
      {renderStepContent()}
    </WizardModal>
  );
};

export default InvestStakeWizard;