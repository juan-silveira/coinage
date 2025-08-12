import { useState, useEffect, useCallback } from 'react';
import useAuthStore from '@/store/authStore';
import api from '@/services/api';

export const useNotifications = () => {
  const { isAuthenticated } = useAuthStore();
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Buscar contagem de não lidas
  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      setLoading(true);
      const response = await api.get('/api/notifications/unread-count');
      
      if (response.data.success) {
        const count = response.data.data.count;
        setUnreadCount(count);
        return count;
      }
    } catch (error) {
      // Fallback para contagem local
      const localCount = 0;
      setUnreadCount(localCount);
      return localCount;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Carregar dados iniciais
  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadCount();
    }
  }, [isAuthenticated, fetchUnreadCount]);

  // Atualizar a cada 30 segundos
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [isAuthenticated, fetchUnreadCount]);

  return {
    unreadCount,
    loading,
    fetchUnreadCount
  };
};

