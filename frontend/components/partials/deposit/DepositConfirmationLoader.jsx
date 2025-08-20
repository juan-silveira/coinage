import React from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import useDepositConfirmation from '@/hooks/useDepositConfirmation';

const DepositConfirmationLoader = ({ transactionId, onCancel }) => {
  const {
    status,
    loading,
    error,
    attempts,
    progress,
    timeRemaining,
    checkStatus,
    redirectToConfirmation
  } = useDepositConfirmation(transactionId, {
    autoRedirect: false, // Não redirecionar automaticamente
    onStatusChange: (newStatus, transaction) => {
      console.log('Status da transação mudou:', newStatus, transaction);
    },
    onConfirmed: (transaction) => {
      console.log('Depósito confirmado:', transaction);
    }
  });

  const isPending = status === 'pending';
  const isConfirmed = status === 'confirmed';
  const isFailed = status === 'failed';

  // Renderizar confirmação se finalizada
  if (isConfirmed || isFailed) {
    return (
      <div className="text-center py-8">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
          isConfirmed ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'
        }`}>
          <Icon 
            icon={isConfirmed ? "heroicons:check-circle" : "heroicons:x-circle"} 
            className={`w-10 h-10 ${
              isConfirmed ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`} 
          />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {isConfirmed ? 'Depósito Confirmado!' : 'Depósito Falhou'}
        </h2>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {isConfirmed 
            ? 'Seu depósito foi processado com sucesso na blockchain' 
            : 'Houve um problema ao processar seu depósito'
          }
        </p>
        
        <Button
          onClick={redirectToConfirmation}
          className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3"
        >
          Ver Detalhes Completos
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <Card className="p-6">
        <div className="text-center">
          {/* Ícone de Loading */}
          <div className="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-6">
            <Icon icon="heroicons:arrow-path" className="w-10 h-10 text-blue-600 dark:text-blue-400 animate-spin" />
          </div>
          
          {/* Título */}
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Aguardando Confirmação
          </h2>
          
          {/* Descrição */}
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Seu depósito está sendo processado na blockchain Azore. 
            Isso pode levar alguns minutos.
          </p>
          
          {/* Barra de Progresso */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
              <span>Progresso</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
          
          {/* Informações de Status */}
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-6">
            <div className="flex justify-between">
              <span>Status:</span>
              <span className="font-medium">
                {isPending ? 'Processando' : 'Verificando...'}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span>Tentativas:</span>
              <span className="font-medium">{attempts}</span>
            </div>
            
            {timeRemaining > 0 && (
              <div className="flex justify-between">
                <span>Tempo restante:</span>
                <span className="font-medium">
                  {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                </span>
              </div>
            )}
          </div>
          
          {/* Botões de Ação */}
          <div className="flex justify-center space-x-3">
            <Button
              onClick={checkStatus}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2"
            >
              {loading ? (
                <Icon icon="heroicons:arrow-path" className="w-4 h-4 animate-spin" />
              ) : (
                <Icon icon="heroicons:arrow-path" className="w-4 h-4" />
              )}
              <span className="ml-2">Verificar Agora</span>
            </Button>
            
            {onCancel && (
              <Button
                onClick={onCancel}
                className="bg-slate-500 hover:bg-slate-600 text-white px-4 py-2"
              >
                Cancelar
              </Button>
            )}
          </div>
          
          {/* Mensagem de Erro */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-300">
                {error}
              </p>
            </div>
          )}
          
          {/* Dica */}
          <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              <strong>Dica:</strong> Você pode fechar esta página e verificar o status 
              posteriormente através do seu histórico de transações.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default DepositConfirmationLoader;





