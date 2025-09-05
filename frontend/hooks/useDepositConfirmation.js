import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/store/authStore';
// Removed mock service - using only real API

/**
 * Hook para aguardar confirmação de depósito
 * Monitora o status da transação e redireciona quando confirmada
 */
const useDepositConfirmation = (transactionId, options = {}) => {
  const router = useRouter();
  const { accessToken } = useAuthStore();
  const {
    autoRedirect = true,
    redirectPath = '/deposit/tx',
    checkInterval = 5000, // 5 segundos
    maxAttempts = 60, // 5 minutos máximo
    onStatusChange = null,
    onConfirmed = null,
    onFailed = null
  } = options;

  const [status, setStatus] = useState(null);
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [attempts, setAttempts] = useState(0);

  // Função para buscar status da transação
  const fetchTransactionStatus = useCallback(async () => {
    if (!transactionId) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/deposits/status/${transactionId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken || ''}`
        }
      });
      const data = response.ok ? await response.json() : { success: false };
      
      if (data.success) {
        const tx = data.data; // Corrigir: data.data ao invés de data.transaction
        const newStatus = tx.status;
        
        setTransaction(tx);
        setStatus(newStatus);
        
        // Callback para mudança de status
        if (onStatusChange && status !== newStatus) {
          onStatusChange(newStatus, tx);
        }
        
        // Callback para confirmação
        if (newStatus === 'confirmed' && onConfirmed) {
          onConfirmed(tx);
        }
        
        // Callback para falha
        if (newStatus === 'failed' && onFailed) {
          onFailed(tx);
        }
        
        // Redirecionar automaticamente se confirmado
        if (autoRedirect && newStatus === 'confirmed') {
          router.push(`${redirectPath}/${transactionId}`);
        }
        
        // Parar polling se finalizado
        if (['confirmed', 'failed'].includes(newStatus)) {
          return true; // Parar polling
        }
      } else {
        setError(response.message || 'Erro ao buscar status da transação');
      }
    } catch (error) {
      console.error('Erro ao buscar status da transação:', error);
      setError('Erro ao verificar status da transação');
    } finally {
      setLoading(false);
    }
    
    return false; // Continuar polling
  }, [transactionId, autoRedirect, redirectPath, router, onStatusChange, onConfirmed, onFailed, status]);

  // Função para iniciar monitoramento
  const startMonitoring = useCallback(() => {
    if (!transactionId) return;
    
    setAttempts(0);
    setError(null);
    
    const pollStatus = async () => {
      const shouldStop = await fetchTransactionStatus();
      
      if (shouldStop) {
        return; // Parar polling
      }
      
      setAttempts(prev => {
        if (prev >= maxAttempts) {
          setError('Tempo limite excedido. Verifique o status manualmente.');
          return prev;
        }
        return prev + 1;
      });
      
      // Continuar polling se não atingiu limite
      if (attempts < maxAttempts) {
        setTimeout(pollStatus, checkInterval);
      }
    };
    
    // Primeira verificação imediata
    pollStatus();
  }, [transactionId, fetchTransactionStatus, checkInterval, maxAttempts, attempts]);

  // Função para parar monitoramento
  const stopMonitoring = useCallback(() => {
    setAttempts(maxAttempts); // Força parada
  }, [maxAttempts]);

  // Função para verificar status manualmente
  const checkStatus = useCallback(async () => {
    if (!transactionId) return;
    await fetchTransactionStatus();
  }, [transactionId, fetchTransactionStatus]);

  // Função para redirecionar manualmente
  const redirectToConfirmation = useCallback(() => {
    if (transactionId) {
      router.push(`${redirectPath}/${transactionId}`);
    }
  }, [transactionId, redirectPath, router]);

  // Iniciar monitoramento quando transactionId mudar
  useEffect(() => {
    if (transactionId) {
      startMonitoring();
    }
    
    // Cleanup ao desmontar
    return () => {
      stopMonitoring();
    };
  }, [transactionId, startMonitoring, stopMonitoring]);

  return {
    // Estado
    status,
    transaction,
    loading,
    error,
    attempts,
    
    // Funções
    startMonitoring,
    stopMonitoring,
    checkStatus,
    redirectToConfirmation,
    
    // Utilitários
    isPending: status === 'pending',
    isConfirmed: status === 'confirmed',
    isFailed: status === 'failed',
    isFinalized: ['confirmed', 'failed'].includes(status),
    
    // Progresso
    progress: maxAttempts > 0 ? Math.min((attempts / maxAttempts) * 100, 100) : 0,
    timeRemaining: maxAttempts > attempts ? (maxAttempts - attempts) * (checkInterval / 1000) : 0
  };
};

export default useDepositConfirmation;
