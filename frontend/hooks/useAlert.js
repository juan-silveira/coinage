import { useState, useCallback } from 'react';

/**
 * Hook para gerenciar alerts usando o sistema nativo do tema
 */
const useAlert = () => {
  const [alerts, setAlerts] = useState([]);

  // Adicionar um novo alert
  const addAlert = useCallback((alert) => {
    const id = Date.now() + Math.random();
    const newAlert = {
      id,
      type: 'info', // success, danger, warning, info, primary, secondary
      title: '',
      message: '',
      dismissible: true,
      autoClose: 5000, // Auto-close após 5 segundos
      hideProgressBar: false,
      pauseOnHover: true,
      ...alert
    };

    setAlerts(prev => [...prev, newAlert]);

    return id;
  }, []);

  // Remover alert específico
  const removeAlert = useCallback((id) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  }, []);

  // Limpar todos os alerts
  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  // Funções de conveniência
  const showSuccess = useCallback((message, title = 'Sucesso') => {
    return addAlert({
      type: 'success',
      title,
      message,
      icon: 'heroicons-outline:check-circle'
    });
  }, [addAlert]);

  const showError = useCallback((message, title = 'Erro') => {
    return addAlert({
      type: 'danger',
      title,
      message,
      icon: 'heroicons-outline:x-circle',
      autoClose: 8000 // Erros ficam mais tempo na tela
    });
  }, [addAlert]);

  const showWarning = useCallback((message, title = 'Aviso') => {
    return addAlert({
      type: 'warning',
      title,
      message,
      icon: 'heroicons-outline:exclamation-triangle'
    });
  }, [addAlert]);

  const showInfo = useCallback((message, title = 'Informação') => {
    return addAlert({
      type: 'info',
      title,
      message,
      icon: 'heroicons-outline:information-circle'
    });
  }, [addAlert]);

  return {
    alerts,
    addAlert,
    removeAlert,
    clearAlerts,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
};

export default useAlert;