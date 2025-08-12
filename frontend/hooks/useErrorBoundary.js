import { useEffect } from 'react';

const useErrorBoundary = () => {
  useEffect(() => {
    // Capturar erros não tratados que podem causar crash/logout
    const handleUnhandledError = (event) => {
      console.error('❌ [ErrorBoundary] Erro não tratado capturado (EVITANDO CRASH):', event.error);
      console.error('❌ [ErrorBoundary] Stack trace:', event.error?.stack);
      console.error('❌ [ErrorBoundary] Source:', event.filename, 'Line:', event.lineno);
      
      // Prevenir que o erro cause crash/logout
      event.preventDefault();
      return true;
    };

    const handleUnhandledRejection = (event) => {
      console.error('❌ [ErrorBoundary] Promise rejeitada não tratada (EVITANDO CRASH):', event.reason);
      console.error('❌ [ErrorBoundary] Stack trace:', event.reason?.stack);
      
      // Prevenir que a rejeição cause crash/logout  
      event.preventDefault();
      return true;
    };

    // Adicionar listeners globais de erro
    window.addEventListener('error', handleUnhandledError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleUnhandledError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);
};

export default useErrorBoundary;