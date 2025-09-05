/**
 * WizardModal - Componente base para wizards de operações de stake
 * 
 * Este componente fornece a estrutura básica para todos os wizards de stake,
 * incluindo navegação entre steps, validação e estados de loading.
 */

"use client";
import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  AlertCircle,
  Loader2 
} from 'lucide-react';

const WizardModal = ({
  isOpen,
  onClose,
  title,
  steps = [],
  currentStep = 0,
  onStepChange,
  loading = false,
  error = null,
  onFinish,
  canGoNext = true,
  canGoPrevious = true,
  showStepsIndicator = true,
  size = 'lg',
  children
}) => {
  const [internalCurrentStep, setInternalCurrentStep] = useState(0);
  
  // Use currentStep controlado externamente se fornecido
  const activeStep = currentStep !== undefined ? currentStep : internalCurrentStep;
  
  // Reset step when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setInternalCurrentStep(0);
      if (onStepChange) onStepChange(0);
    }
  }, [isOpen, onStepChange]);

  const handleStepChange = (newStep) => {
    if (onStepChange) {
      onStepChange(newStep);
    } else {
      setInternalCurrentStep(newStep);
    }
  };

  const goToNextStep = () => {
    if (activeStep < steps.length - 1 && canGoNext) {
      handleStepChange(activeStep + 1);
    }
  };

  const goToPreviousStep = () => {
    if (activeStep > 0 && canGoPrevious) {
      handleStepChange(activeStep - 1);
    }
  };

  const isFirstStep = activeStep === 0;
  const isLastStep = activeStep === steps.length - 1;
  const currentStepData = steps[activeStep] || {};

  const handleFinish = () => {
    if (onFinish) {
      onFinish();
    }
  };

  // Fechar modal
  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose}
      size={size}
      closeOnOverlayClick={!loading}
    >
      <div className="flex flex-col h-full max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {title}
            </h2>
            {currentStepData.subtitle && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {currentStepData.subtitle}
              </p>
            )}
          </div>
          
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Steps Indicator */}
        {showStepsIndicator && steps.length > 1 && (
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <React.Fragment key={index}>
                  <div className="flex flex-col items-center flex-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                      index < activeStep 
                        ? 'bg-green-500 text-white' 
                        : index === activeStep
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                    }`}>
                      {index < activeStep ? (
                        <Check size={16} />
                      ) : (
                        index + 1
                      )}
                    </div>
                    <span className={`text-xs mt-1 text-center transition-colors ${
                      index === activeStep 
                        ? 'text-gray-900 dark:text-white font-medium' 
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {step.title}
                    </span>
                  </div>
                  
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 transition-colors ${
                      index < activeStep 
                        ? 'bg-green-500' 
                        : 'bg-gray-200 dark:bg-gray-700'
                    }`} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {error && (
            <div className="mx-6 mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
                <div>
                  <h4 className="text-sm font-medium text-red-800 dark:text-red-200">
                    Erro na operação
                  </h4>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="p-6">
            {children}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center space-x-2">
            {loading && (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {currentStepData.loadingText || 'Processando...'}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center space-x-3">
            {!isFirstStep && (
              <Button
                variant="outline"
                onClick={goToPreviousStep}
                disabled={loading || !canGoPrevious}
                className="flex items-center"
              >
                <ChevronLeft size={16} className="mr-1" />
                Voltar
              </Button>
            )}

            {!isLastStep ? (
              <Button
                onClick={goToNextStep}
                disabled={loading || !canGoNext}
                className="flex items-center btn-brand"
              >
                Próximo
                <ChevronRight size={16} className="ml-1" />
              </Button>
            ) : (
              <Button
                onClick={handleFinish}
                disabled={loading || !canGoNext}
                className="flex items-center btn-brand"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    {currentStepData.finishingText || 'Finalizando...'}
                  </>
                ) : (
                  <>
                    <Check size={16} className="mr-2" />
                    {currentStepData.finishText || 'Finalizar'}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default WizardModal;