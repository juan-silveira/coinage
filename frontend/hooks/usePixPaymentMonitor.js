import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import mockPixService from '@/services/mockPixService';

/**
 * Hook para monitorar pagamentos PIX em tempo real
 * Aguarda confirmação do pagamento e redireciona automaticamente
 */
const usePixPaymentMonitor = (paymentId, options = {}) => {
  const router = useRouter();
  const {
    autoRedirect = true,
    redirectPath = '/deposit/tx',
    checkInterval = 3000, // 3 segundos
    maxAttempts = 120, // 10 minutos máximo
    onStatusChange = null,
    onPaid = null,
    onExpired = null,
    onError = null
  } = options;

  const [status, setStatus] = useState(null);
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  
  // Refs para controlar se os callbacks já foram executados
  const hasExecutedPaid = useRef(false);
  const hasExecutedExpired = useRef(false);
  const hasExecutedStatusChange = useRef(false);
  const lastStatus = useRef(null);

  // Função para buscar status do pagamento
  const fetchPaymentStatus = useCallback(async () => {
    if (!paymentId) return;

    try {
      setLoading(true);
      const response = await mockPixService.getPayment(paymentId);
      
      if (response.success) {
        const paymentData = response.payment;
        const newStatus = paymentData.status;
        
        setPayment(paymentData);
        setStatus(newStatus);
        
        // Calcular tempo restante
        if (newStatus === 'pending') {
          const expiresAt = new Date(paymentData.expiresAt);
          const now = new Date();
          const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
          setTimeRemaining(remaining);
        }
        
        // Callback para mudança de status (executar apenas uma vez por mudança)
        if (onStatusChange && lastStatus.current !== newStatus) {
          lastStatus.current = newStatus;
          onStatusChange(newStatus, paymentData);
        }
        
        // Callback para pagamento confirmado (executar apenas uma vez)
        if (newStatus === 'paid' && onPaid && !hasExecutedPaid.current) {
          hasExecutedPaid.current = true;
          onPaid(paymentData);
        }
        
        // Callback para pagamento expirado (executar apenas uma vez)
        if (newStatus === 'expired' && onExpired && !hasExecutedExpired.current) {
          hasExecutedExpired.current = true;
          onExpired(paymentData);
        }
        
        // Redirecionar automaticamente se pago (executar apenas uma vez)
        if (autoRedirect && newStatus === 'paid' && !hasExecutedPaid.current) {
          hasExecutedPaid.current = true;
          if (paymentData.transactionId) {
            router.push(`${redirectPath}/${paymentData.transactionId}`);
          }
        }
        
        // Parar polling se finalizado
        if (['paid', 'expired', 'cancelled'].includes(newStatus)) {
          return true; // Parar polling
        }
      } else {
        setError(response.message || 'Erro ao buscar status do pagamento');
        if (onError) onError(response.message);
      }
    } catch (error) {
      console.error('Erro ao buscar status do pagamento:', error);
      setError('Erro ao verificar status do pagamento');
      if (onError) onError(error.message);
    } finally {
      setLoading(false);
    }
    
    return false; // Continuar polling
  }, [paymentId, autoRedirect, redirectPath, router, onStatusChange, onPaid, onExpired, onError]);

  // Função para resetar os refs
  const resetCallbacks = useCallback(() => {
    hasExecutedPaid.current = false;
    hasExecutedExpired.current = false;
    hasExecutedStatusChange.current = false;
    lastStatus.current = null;
  }, []);

  // Refs para controlar o polling
  const pollingRef = useRef(null);
  const isActiveRef = useRef(false);

  // Função para iniciar monitoramento
  const startMonitoring = useCallback(() => {
    if (!paymentId) return;
    
    // Parar polling anterior se existir
    if (pollingRef.current) {
      clearTimeout(pollingRef.current);
      pollingRef.current = null;
    }
    
    isActiveRef.current = true;
    setAttempts(0);
    setError(null);
    resetCallbacks(); // Resetar callbacks ao iniciar
    
    let currentAttempts = 0;
    
    const pollStatus = async () => {
      if (!isActiveRef.current) return;
      
      const shouldStop = await fetchPaymentStatus();
      
      if (shouldStop || !isActiveRef.current) {
        isActiveRef.current = false;
        return; // Parar polling
      }
      
      currentAttempts++;
      setAttempts(currentAttempts);
      
      if (currentAttempts >= maxAttempts) {
        setError('Tempo limite excedido. Verifique o status manualmente.');
        isActiveRef.current = false;
        return;
      }
      
      // Continuar polling se não atingiu limite
      pollingRef.current = setTimeout(pollStatus, checkInterval);
    };
    
    // Primeira verificação imediata
    pollStatus();
    
    // Função de cleanup
    return () => {
      isActiveRef.current = false;
      if (pollingRef.current) {
        clearTimeout(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [paymentId, fetchPaymentStatus, checkInterval, maxAttempts, resetCallbacks]);

  // Função para parar monitoramento
  const stopMonitoring = useCallback(() => {
    isActiveRef.current = false;
    if (pollingRef.current) {
      clearTimeout(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  // Estabilizar funções com useMemo para evitar re-renderizações
  const stableFunctions = useMemo(() => ({
    startMonitoring,
    stopMonitoring,
    checkStatus: async () => {
      if (!paymentId) return;
      await fetchPaymentStatus();
    },
    forcePayment: async () => {
      if (!paymentId) return;
      
      try {
        setLoading(true);
        const response = await mockPixService.forcePayment(paymentId);
        
        if (response.success) {
          await fetchPaymentStatus(); // Atualizar status
        } else {
          setError(response.message);
        }
      } catch (error) {
        console.error('Erro ao forçar pagamento:', error);
        setError('Erro ao forçar pagamento');
      } finally {
        setLoading(false);
      }
    },
    redirectToTransaction: () => {
      if (payment?.transactionId) {
        router.push(`${redirectPath}/${payment.transactionId}`);
      }
    }
  }), [startMonitoring, stopMonitoring, paymentId, fetchPaymentStatus, redirectPath, router, payment]);



  // Ref para a última versão do startMonitoring
  const startMonitoringRef = useRef(startMonitoring);
  startMonitoringRef.current = startMonitoring;

  // Iniciar monitoramento quando paymentId mudar
  useEffect(() => {
    if (paymentId) {
      const cleanup = startMonitoringRef.current();
      return cleanup;
    }
    return () => {
      stopMonitoring();
    };
  }, [paymentId, stopMonitoring]);

  // Atualizar tempo restante a cada segundo
  useEffect(() => {
    if (status === 'pending' && timeRemaining > 0) {
      const interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [status, timeRemaining]);

  return {
    // Estado
    status,
    payment,
    loading,
    error,
    attempts,
    timeRemaining,
    
    // Funções estáveis
    startMonitoring: stableFunctions.startMonitoring,
    stopMonitoring: stableFunctions.stopMonitoring,
    checkStatus: stableFunctions.checkStatus,
    forcePayment: stableFunctions.forcePayment,
    redirectToTransaction: stableFunctions.redirectToTransaction,
    
    // Utilitários
    isPending: status === 'pending',
    isPaid: status === 'paid',
    isExpired: status === 'expired',
    isCancelled: status === 'cancelled',
    isFinalized: ['paid', 'expired', 'cancelled'].includes(status),
    
    // Progresso
    progress: maxAttempts > 0 ? Math.min((attempts / maxAttempts) * 100, 100) : 0,
    
    // Formatação de tempo
    timeRemainingFormatted: timeRemaining > 0 
      ? `${Math.floor(timeRemaining / 60)}:${(timeRemaining % 60).toString().padStart(2, '0')}`
      : '00:00'
  };
};

export default usePixPaymentMonitor;
