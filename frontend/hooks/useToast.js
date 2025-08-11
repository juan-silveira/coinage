import { useCallback } from 'react';
import { toast } from 'react-toastify';

const useToast = () => {
  const showToast = useCallback((type, message, options = {}) => {
    const defaultOptions = {
      position: "top-right",
      autoClose: 1500,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      ...options
    };

    switch (type) {
      case 'success':
        toast.success(message, defaultOptions);
        break;
      case 'error':
        toast.error(message, defaultOptions);
        break;
      case 'warning':
        toast.warning(message, defaultOptions);
        break;
      case 'info':
        toast.info(message, defaultOptions);
        break;
      case 'loading':
        toast.loading(message, { ...defaultOptions, autoClose: false });
        break;
      default:
        toast(message, defaultOptions);
    }
  }, []);

  const hideToast = useCallback(() => {
    toast.dismiss();
  }, []);

  const showSuccess = useCallback((message, options = {}) => {
    showToast('success', message, { autoClose: 1500, ...options });
  }, [showToast]);

  const showError = useCallback((message, options = {}) => {
    showToast('error', message, { autoClose: 3000, ...options });
  }, [showToast]);

  const showWarning = useCallback((message, options = {}) => {
    showToast('warning', message, { autoClose: 2500, ...options });
  }, [showToast]);

  const showLoading = useCallback((message = 'Carregando...', options = {}) => {
    showToast('loading', message, { autoClose: false, ...options });
  }, [showToast]);

  const showInfo = useCallback((message, options = {}) => {
    showToast('info', message, { autoClose: 2500, ...options });
  }, [showToast]);

  // Helpers de processo com um toastId fixo (deduplicado)
  const startProcessToast = useCallback((message = 'Carregando...', toastId = 'cache-load') => {
    if (!toast.isActive(toastId)) {
      toast.loading(message, { toastId, autoClose: false, closeOnClick: false });
    }
    return toastId;
  }, []);

  const finishProcessToastSuccess = useCallback((toastId = 'cache-load', message = 'Concluído com sucesso') => {
    toast.update(toastId, {
      render: message,
      type: 'success',
      isLoading: false,
      autoClose: 1500,
      closeOnClick: true,
      draggable: true,
    });
  }, []);

  const finishProcessToastError = useCallback((toastId = 'cache-load', message = 'Ocorreu um erro') => {
    toast.update(toastId, {
      render: message,
      type: 'error',
      isLoading: false,
      autoClose: 1500,
      closeOnClick: true,
      draggable: true,
    });
  }, []);

  return {
    showToast,
    hideToast,
    showSuccess,
    showError,
    showWarning,
    showLoading,
    showInfo,
    startProcessToast,
    finishProcessToastSuccess,
    finishProcessToastError,
    toast
  };
};

export default useToast;
