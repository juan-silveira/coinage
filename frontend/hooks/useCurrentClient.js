import { useState, useEffect, useCallback } from 'react';
import { whitelabelService } from '@/services/api';
import useAuthStore from '@/store/authStore';

const useCurrentClient = () => {
  const [currentClient, setCurrentClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { isAuthenticated, user } = useAuthStore();

  const fetchCurrentClient = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await whitelabelService.getCurrentClient();
      
      if (response.success) {
        setCurrentClient(response.data.currentClient);
      } else {
        setError(response.message || 'Erro ao obter cliente atual');
      }
    } catch (err) {
      console.error('❌ Erro ao buscar cliente atual:', err);
      setError('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    fetchCurrentClient();
  }, [fetchCurrentClient]);

  const refreshCurrentClient = useCallback(() => {
    fetchCurrentClient();
  }, [fetchCurrentClient]);

  return {
    currentClient,
    loading,
    error,
    refreshCurrentClient
  };
};

export default useCurrentClient;
