import { useState, useEffect, useCallback } from 'react';
import { whitelabelService } from '@/services/api';
import useAuthStore from '@/store/authStore';

const useCurrentCompany = () => {
  const [currentCompany, setCurrentCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { isAuthenticated, user } = useAuthStore();

  const fetchCurrentCompany = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await whitelabelService.getCurrentCompany();
      
      if (response.success) {
        setCurrentCompany(response.data.currentCompany);
      } else {
        setError(response.message || 'Erro ao obter empresa atual');
      }
    } catch (err) {
      console.error('❌ Erro ao buscar empresa atual:', err);
      setError('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    fetchCurrentCompany();
  }, [fetchCurrentCompany]);

  const refreshCurrentCompany = useCallback(() => {
    fetchCurrentCompany();
  }, [fetchCurrentCompany]);

  return {
    currentCompany,
    loading,
    error,
    refreshCurrentCompany
  };
};

export default useCurrentCompany;
