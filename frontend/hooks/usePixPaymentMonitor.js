import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/store/authStore';
// Removed mock service - using only real API

/**
 * Hook para monitorar pagamentos PIX em tempo real
 * Aguarda confirmação do pagamento e redireciona automaticamente
 */
const usePixPaymentMonitor = (paymentId, options = {}) => {
  const router = useRouter();
  const { accessToken } = useAuthStore();
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
  const [processingMint, setProcessingMint] = useState(false);
  const [mintStatus, setMintStatus] = useState('');
  
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
      
      // Verificar se temos um refreshToken válido antes de tentar
      const { refreshToken: currentRefreshToken } = useAuthStore.getState();
      
      // Se não temos token de acesso ou refresh, erro direto
      if (!accessToken && !currentRefreshToken) {
        setError('Usuário não autenticado');
        return false;
      }
      
      // Se não temos accessToken mas temos refreshToken, renovar primeiro
      if (!accessToken && currentRefreshToken) {
        try {
          console.log('🔄 Sem accessToken, renovando primeiro...');
          const authService = (await import('@/services/api')).authService;
          const refreshResponse = await authService.refreshToken(currentRefreshToken);
          
          if (refreshResponse.success) {
            useAuthStore.getState().setTokens(
              refreshResponse.data.accessToken, 
              refreshResponse.data.refreshToken
            );
            console.log('✅ Token renovado antes da primeira tentativa');
          }
        } catch (refreshError) {
          console.error('❌ Erro ao renovar token inicial:', refreshError);
          setError('Erro de autenticação');
          return false;
        }
      }
      
      // DESENVOLVIMENTO: Usar endpoint sem autenticação
      console.log('📡 Fazendo chamada PIX para desenvolvimento (sem JWT)');
      let response = await fetch(`/api/pix/dev/payment/${paymentId}`);
      
      const data = response.ok ? await response.json() : { success: false };
      
      if (data.success && data.data?.payment) {
        const paymentData = data.data.payment;
        const newStatus = paymentData?.status;
        
        setPayment(paymentData);
        setStatus(newStatus);
        
        // Calcular tempo restante
        if (newStatus === 'pending' && paymentData?.expiresAt) {
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
        setError(data?.message || 'Erro ao buscar status do pagamento');
        if (onError) onError(data?.message);
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
      
      try {
        const shouldStop = await fetchPaymentStatus();
        
        if (shouldStop || !isActiveRef.current) {
          isActiveRef.current = false;
          return; // Parar polling
        }
      } catch (pollError) {
        console.error('Erro no polling:', pollError);
        // Continuar polling em caso de erro
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
        setProcessingMint(true);
        
        // 1. Marcar PIX como pago (DESENVOLVIMENTO - sem JWT)
        setMintStatus('Confirmando pagamento PIX...');
        let response = await fetch(`/api/pix/dev/payment/${paymentId}/force`, { 
          method: 'POST'
        });
        
        const data = response.ok ? await response.json() : { success: false };
        
        if (!data.success) {
          setError(data.message);
          return;
        }
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 2. PIX confirmado - aguardar processamento real do backend
        setMintStatus('PIX confirmado! Aguarde o processamento da blockchain...');
        
        // REMOVER MOCK: Deixar que o backend processe automaticamente
        // O usuário permanecerá na tela pendente até que o backend confirme
        await new Promise(resolve => setTimeout(resolve, 3000));
        
      } catch (error) {
        console.error('Erro ao forçar pagamento:', error);
        setError('Erro ao forçar pagamento');
      } finally {
        setLoading(false);
        setProcessingMint(false);
        setMintStatus('');
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
      : '00:00',
      
    // Novos estados para processamento mint
    processingMint,
    mintStatus
  };
};

export default usePixPaymentMonitor;
