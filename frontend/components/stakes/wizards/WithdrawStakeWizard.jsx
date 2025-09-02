/**
 * WithdrawStakeWizard - Wizard para retirada de stake
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
import { formatFromWei, formatToWei } from '@/utils/stakeHelpers';

const WithdrawStakeWizard = ({
  isOpen,
  onClose,
  productId,
  onSuccess = null
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [amount, setAmount] = useState("");
  const [transactionResult, setTransactionResult] = useState(null);

  // Hooks
  const { product, stakeData, loading: dataLoading, refetch } = useStakeData(productId);
  const { withdraw, loading, error, clearError } = useStakeOperations(productId, {
    onSuccess: (result) => {
      setTransactionResult(result);
      if (onSuccess) onSuccess(result);
      refetch();
    }
  });
  const { validateWithdrawal } = useStakeValidation(productId);

  const steps = [
    {
      title: "Quantidade",
      subtitle: "Digite a quantidade para retirar",
      loadingText: "Validando quantidade...",
    },
    {
      title: "Confirmação",
      subtitle: "Revise os detalhes da retirada",
      loadingText: "Preparando transação...",
    },
    {
      title: "Transação",
      subtitle: "Processando sua retirada",
      loadingText: "Executando transação...",
      finishingText: "Processando...",
      finishText: "Finalizar"
    }
  ];

  const stakedBalance = stakeData?.userData?.totalStakeBalance || "0";
  const tokenSymbol = product?.contracts?.stakeToken?.symbol || "PCN";

  const validation = useMemo(() => {
    if (!amount || amount === "0") {
      return { isValid: false, error: null };
    }
    return validateWithdrawal(amount, stakedBalance);
  }, [amount, stakedBalance, validateWithdrawal]);

  const canGoNext = useMemo(() => {
    switch (currentStep) {
      case 0: return validation.isValid;
      case 1: return true;
      case 2: return false;
      default: return true;
    }
  }, [currentStep, validation.isValid]);

  const canGoPrevious = useMemo(() => {
    if (loading) return false;
    return currentStep > 0 && currentStep < 2;
  }, [currentStep, loading]);

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
      const amountInWei = formatToWei(amount);
      await withdraw(amountInWei);
      setCurrentStep(2);
    } else if (currentStep === 2) {
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
    setCurrentStep(1);
    clearError();
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <AmountStep
            title="Quanto deseja retirar?"
            description="Digite a quantidade de tokens para retirar do stake"
            amount={amount}
            onAmountChange={handleAmountChange}
            balance={stakedBalance}
            tokenSymbol={tokenSymbol}
            placeholder="Digite a quantidade"
            validationError={validation.error}
            showBalance={true}
            showMaxButton={true}
          />
        );

      case 1:
        return (
          <ConfirmationStep
            operationType="withdraw"
            product={product}
            amount={formatToWei(amount)}
            tokenSymbol={tokenSymbol}
            currentBalance={stakedBalance}
            newBalance={formatToWei((parseFloat(stakedBalance || "0") - parseFloat(amount)).toString())}
            riskLevel={product?.risk || 1}
            warnings={[
              "A retirada pode afetar suas recompensas futuras",
              "Certifique-se de que deseja prosseguir com a retirada"
            ]}
            additionalInfo={{
              "Saldo em Stake": `${formatFromWei(stakedBalance).full} ${tokenSymbol}`,
              "Tempo de Processamento": "Imediato"
            }}
          />
        );

      case 2:
        return (
          <TransactionStep
            status={transactionResult ? "success" : loading ? "processing" : error ? "failed" : "pending"}
            transactionHash={transactionResult?.transactionHash}
            operationType="withdraw"
            amount={formatToWei(amount)}
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
      title={`Retirar de ${product.name}`}
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

export default WithdrawStakeWizard;