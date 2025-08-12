import { useState, useEffect } from 'react';
import useAuthStore from '@/store/authStore';
import api from '@/services/api';

export const useNotifications = () => {
  const { isAuthenticated } = useAuthStore();
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Buscar contagem de não lidas
  const fetchUnreadCount = async () => {
    if (!isAuthenticated) return;
    
    try {
      setLoading(true);
      const response = await api.get('/api/notifications/unread-count');
      
      if (response.data.success) {
        console.log('📊 Footer - Contagem recebida:', response.data.data.count);
        setUnreadCount(response.data.data.count);
      }
    } catch (error) {
      console.error('Erro ao buscar contagem de notificações:', error);
      // Fallback: buscar todas as notificações e contar as não lidas
      try {
        const allResponse = await api.get('/api/notifications');
        if (allResponse.data.success) {
          const unreadCount = allResponse.data.data.filter(n => !n.isRead && n.isActive).length;
          console.log('📊 Footer - Contagem fallback:', unreadCount);
          setUnreadCount(unreadCount);
        }
      } catch (fallbackError) {
        console.error('Erro no fallback:', fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  // Carregar dados iniciais
  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadCount();
    }
  }, [isAuthenticated]);

  // Atualizar a cada 30 segundos
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  return {
    unreadCount,
    loading,
    fetchUnreadCount
  };
};

