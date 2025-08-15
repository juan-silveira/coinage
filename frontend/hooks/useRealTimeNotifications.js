import { useEffect } from 'react';
import { useNotificationEvents } from '@/contexts/NotificationContext';
import useAuthStore from '@/store/authStore';
import api from '@/services/api';

/**
 * Hook para conectar com notificações em tempo real
 * Por enquanto simula via polling, mas pode ser expandido para WebSocket
 */
export const useRealTimeNotifications = () => {
  const { isAuthenticated, user } = useAuthStore();
  const { notifyNewNotification, notifyBatchNotifications } = useNotificationEvents();

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    let pollInterval;

    // Simular conexão de notificações em tempo real
    // Futuramente pode ser substituído por WebSocket
    const connectToNotifications = () => {
      // console.log('🔌 Conectando ao sistema de notificações em tempo real...');
      
      let lastNotificationCount = 0;
      
      // Por enquanto, vamos usar polling leve a cada 30 segundos
      // para detectar novas notificações
      pollInterval = setInterval(async () => {
        try {
          // Buscar contagem atual de notificações usando api service
          const countResponse = await api.get('/api/notifications/unread-count');
          
          if (countResponse.data.success) {
            const currentCount = countResponse.data.data?.count || 0;
            
            // Se houve aumento na contagem, buscar as novas notificações
            if (currentCount > lastNotificationCount && lastNotificationCount > 0) {
              const newNotificationsCount = currentCount - lastNotificationCount;
              // console.log(`🔔 ${newNotificationsCount} nova(s) notificação(ões) detectada(s) via polling`);
              
              // Buscar as notificações mais recentes usando api service
              const response = await api.get(`/api/notifications/unread?limit=${newNotificationsCount}`);
              
              if (response.data.success && response.data.data?.length > 0) {
                const recentNotifications = response.data.data.filter(notification => {
                  const notificationTime = new Date(notification.createdAt);
                  const now = new Date();
                  const diffInSeconds = (now - notificationTime) / 1000;
                  return diffInSeconds <= 35; // Últimos 35 segundos
                });
                
                if (recentNotifications.length > 0) {
                  if (recentNotifications.length === 1) {
                    // Uma única notificação
                    notifyNewNotification(recentNotifications[0]);
                  } else {
                    // Múltiplas notificações (batch) - tocar som apenas 1x
                    notifyBatchNotifications(recentNotifications);
                  }
                }
              }
            }
            
            lastNotificationCount = currentCount;
          }
        } catch (error) {
          console.warn('⚠️ Erro no polling de notificações:', error.message);
        }
      }, 30000); // Poll a cada 30 segundos
    };

    // Conectar após um delay para não sobrecarregar no login
    const connectTimeout = setTimeout(connectToNotifications, 5000);

    return () => {
      clearTimeout(connectTimeout);
      if (pollInterval) {
        clearInterval(pollInterval);
      }
      // console.log('🔌 Desconectando do sistema de notificações em tempo real...');
    };
  }, [isAuthenticated, user]);

  // Função para simular nova notificação (para debug)
  const simulateNotification = (notification) => {
    console.log('🧪 Simulando nova notificação:', notification);
    notifyNewNotification(notification);
  };

  // Função para simular batch de notificações (para debug)
  const simulateBatchNotifications = (notifications) => {
    console.log('🧪 Simulando batch de notificações:', notifications);
    notifyBatchNotifications(notifications);
  };

  // Função para testar som diretamente
  const testNotificationSound = () => {
    // Simular uma notificação de teste com som
    const testNotification = {
      id: 'test-' + Date.now(),
      title: '🧪 Teste de Som',
      message: 'Esta é uma notificação de teste para o som!',
      createdAt: new Date().toISOString(),
      isRead: false
    };
    
    simulateNotification(testNotification);
  };

  return {
    simulateNotification,
    simulateBatchNotifications,
    testNotificationSound
  };
};

export default useRealTimeNotifications;