import React, { useState, useEffect, useCallback } from "react";
import Dropdown from "@/components/ui/Dropdown";
import Icon from "@/components/ui/Icon";
import Link from "next/link";
import { Menu } from "@headlessui/react";
import useAuthStore from "@/store/authStore";
import useProactiveTokenRefresh from "@/hooks/useProactiveTokenRefresh";
import api from "@/services/api";
import { useNotificationEvents } from "@/contexts/NotificationContext";
import NotificationSoundSettings from "./NotificationSoundSettings";

const notifyLabel = (unreadCount) => {
  return (
    <span className="relative h-[32px] w-[32px] bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white cursor-pointer rounded-full text-[20px] flex flex-col items-center justify-center">
      <Icon icon="heroicons-outline:bell" className="animate-tada" />
      {unreadCount > 0 && (
        <span className="absolute -top-2 -right-2 h-5 w-5 bg-red-500 text-[10px] font-bold flex flex-col items-center justify-center rounded-full text-white z-[99] shadow-sm">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </span>
  );
};

const Notification = () => {
  const { isAuthenticated } = useAuthStore();
  const { ensureValidToken } = useProactiveTokenRefresh();
  const { notifyMarkAsRead } = useNotificationEvents();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showSoundSettings, setShowSoundSettings] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastError, setLastError] = useState(null);

  // Buscar contagem de não lidas
  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      // Garantir que o token seja válido antes da requisição
      await ensureValidToken();
      
      const response = await api.get('/api/notifications/unread-count');
      
      if (response.data.success) {
        const count = response.data.data.count;
        setUnreadCount(count);
        setLastError(null); // Limpar erro anterior
        return count;
      }
    } catch (error) {
      console.warn('⚠️ [Notification] Erro ao buscar contagem:', error.message);
      setLastError(error);
      // Fallback para contagem local sem usar notifications no callback
      setUnreadCount(0);
      return 0;
    }
  }, [isAuthenticated, ensureValidToken]);

  // Buscar notificações não lidas
  const fetchUnreadNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      setLoading(true);
      
      // Garantir que o token seja válido antes da requisição
      await ensureValidToken();
      
      const response = await api.get('/api/notifications/unread');
      
      if (response.data.success) {
        const notificationsData = response.data.data || [];
        setNotifications(notificationsData);
        setLastError(null); // Limpar erro anterior
      }
    } catch (error) {
      console.warn('⚠️ [Notification] Erro ao buscar notificações:', error.message);
      setLastError(error);
      // Em caso de erro, mantém o estado atual
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, ensureValidToken]);

  // Marcar notificação como lida
  const markAsRead = async (notificationId, event = null) => {
    if (!isAuthenticated) return;
    
    // Prevenir navegação se chamado de um botão
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    
    try {
      // Garantir que o token seja válido antes da requisição
      await ensureValidToken();
      
      await api.put(`/api/notifications/${notificationId}/read`);
      
      // Atualizar estado local
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      // Notificar outros componentes sobre a mudança
      notifyMarkAsRead(notificationId);
      
    } catch (error) {
      console.warn('⚠️ [Notification] Erro ao marcar como lida:', error.message);
      // Em caso de erro, ainda remove da lista local para melhor UX
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => Math.max(0, prev - 1));
      // Ainda assim notifica para manter sincronia
      notifyMarkAsRead(notificationId);
    }
  };

  // Marcar todas as notificações como lidas
  const markAllAsRead = async () => {
    if (!isAuthenticated) return;
    
    try {
      // Garantir que o token seja válido antes da requisição
      await ensureValidToken();
      
      await api.put('/api/notifications/mark-all-read');
      
      // Limpar estado local
      setNotifications(prev => 
        prev.map(n => ({ ...n, isRead: true }))
      );
      setUnreadCount(0);
      
    } catch (error) {
      console.warn('⚠️ [Notification] Erro ao marcar todas como lidas:', error.message);
      // Em caso de erro, ainda limpa o estado local
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  // Carregar dados iniciais
  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadNotifications();
      fetchUnreadCount();
    } else {
      // Reset do estado quando não autenticado
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
    }
  }, [isAuthenticated]); // Removidas as dependências das funções

  // Event listeners para atualizações em tempo real
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const handleUnreadCountChanged = () => {
      fetchUnreadCount();
    };

    const handleUnreadListChanged = () => {
      fetchUnreadNotifications();
    };

    const handleNotificationMarkedAsRead = (event) => {
      const { notificationId } = event.detail;
      // Remove da lista local se presente
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const handleNotificationMarkedAsUnread = (event) => {
      const { notificationId } = event.detail;
      // Recarrega a lista para incluir a nova notificação não lida
      fetchUnreadNotifications();
      setUnreadCount(prev => prev + 1);
    };

    const handleAllMarkedAsRead = () => {
      setNotifications([]);
      setUnreadCount(0);
    };

    const handleNotificationRestored = (event) => {
      const { notificationId, wasUnread } = event.detail;
      // Se a notificação restaurada estava não lida, incrementa o contador e recarrega a lista
      if (wasUnread) {
        setUnreadCount(prev => prev + 1);
        fetchUnreadNotifications();
      }
    };

    const handleNotificationCreated = (event) => {
      const { notification } = event.detail;
      // Adicionar nova notificação à lista
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // Log para debug
      console.log('🔔 Nova notificação recebida em tempo real:', notification);
    };

    const handleNotificationBatchCreated = (event) => {
      const { notifications, count } = event.detail;
      // Adicionar múltiplas notificações à lista
      setNotifications(prev => [...notifications, ...prev]);
      setUnreadCount(prev => prev + count);
      
      // Log para debug
      console.log(`🔔 ${count} notificações recebidas em batch:`, notifications);
    };

    // Registrar event listeners
    window.addEventListener('notificationUnreadCountChanged', handleUnreadCountChanged);
    window.addEventListener('notificationUnreadListChanged', handleUnreadListChanged);
    window.addEventListener('notificationMarkedAsRead', handleNotificationMarkedAsRead);
    window.addEventListener('notificationMarkedAsUnread', handleNotificationMarkedAsUnread);
    window.addEventListener('notificationRestored', handleNotificationRestored);
    window.addEventListener('notificationCreated', handleNotificationCreated);
    window.addEventListener('notificationBatchCreated', handleNotificationBatchCreated);
    window.addEventListener('notificationAllMarkedAsRead', handleAllMarkedAsRead);
    window.addEventListener('notificationAllMarkedAsUnread', handleUnreadListChanged);
    
    return () => {
      window.removeEventListener('notificationUnreadCountChanged', handleUnreadCountChanged);
      window.removeEventListener('notificationUnreadListChanged', handleUnreadListChanged);
      window.removeEventListener('notificationMarkedAsRead', handleNotificationMarkedAsRead);
      window.removeEventListener('notificationMarkedAsUnread', handleNotificationMarkedAsUnread);
      window.removeEventListener('notificationRestored', handleNotificationRestored);
      window.removeEventListener('notificationCreated', handleNotificationCreated);
      window.removeEventListener('notificationBatchCreated', handleNotificationBatchCreated);
      window.removeEventListener('notificationAllMarkedAsRead', handleAllMarkedAsRead);
      window.removeEventListener('notificationAllMarkedAsUnread', handleUnreadListChanged);
    };
  }, [isAuthenticated, fetchUnreadCount, fetchUnreadNotifications]);

  // Fallback: Listener para eventos de refresh (compatibilidade com sistema antigo)
  useEffect(() => {
    const handleRefresh = async () => {
      try {
        // Garantir que o token seja válido antes das requisições
        await ensureValidToken();
        
        // Atualização completa quando há evento de refresh
        await fetchUnreadCount();
        await fetchUnreadNotifications();
      } catch (error) {
        console.warn('⚠️ [Notification] Erro no refresh por evento:', error.message);
      }
    };

    window.addEventListener('notificationRefresh', handleRefresh);
    return () => window.removeEventListener('notificationRefresh', handleRefresh);
  }, [ensureValidToken, fetchUnreadCount, fetchUnreadNotifications]);

  // Fallback polling (reduzido): atualização a cada 60 segundos como backup
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const interval = setInterval(async () => {
      try {
        await fetchUnreadCount();
      } catch (error) {
        console.warn('⚠️ [Notification] Erro no polling de backup:', error.message);
      }
    }, 60000); // 60 segundos como backup
    
    return () => clearInterval(interval);
  }, [isAuthenticated, fetchUnreadCount]);

  return (
    <>
    <Dropdown classMenuItems="md:w-[300px] top-[58px] z-[99999]" label={notifyLabel(unreadCount)}>
      <div className="flex justify-between items-center px-4 py-4 border-b border-slate-100 dark:border-slate-600">
        <div className="text-sm text-slate-800 dark:text-slate-200 font-medium leading-6">
          Notificações {unreadCount > 0 && <span className="text-xs text-slate-500">({unreadCount})</span>}
        </div>
        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              Marcar todas lidas
            </button>
          )}
          <button
            onClick={() => setShowSoundSettings(true)}
            className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:underline"
            title="Configurações de som"
          >
            🔊 Som
          </button>
          <Link href="/notifications" className="text-xs text-slate-800 dark:text-slate-200 hover:underline">
            Ver todas
          </Link>
        </div>
      </div>
      
      {(() => {
        
        if (loading) {
          return (
            <div className="px-4 py-8 text-center text-slate-500">
              <Icon icon="heroicons-outline:refresh" className="animate-spin mx-auto mb-2 text-2xl" />
              <p>Carregando...</p>
            </div>
          );
        }
        
        if (notifications.length === 0) {
          return (
            <div className="px-4 py-8 text-center text-slate-500">
              <Icon icon="heroicons-outline:bell" className="mx-auto mb-2 text-2xl" />
              <p>Nenhuma notificação</p>
            </div>
          );
        }
        
        return (
        <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[400px] overflow-y-auto">
          {notifications.map((item) => (
            <Menu.Item key={item.id}>
              {({ active }) => (
                <div
                  className={`${
                    active
                      ? "bg-slate-100 dark:bg-slate-700 dark:bg-opacity-70 text-slate-800"
                      : "text-slate-600 dark:text-slate-300"
                  } block w-full px-4 py-3 text-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700`}
                  onClick={async () => {
                    // Marcar como lida automaticamente
                    await markAsRead(item.id);
                    
                    // Navegar para a página de notificações
                    window.location.href = '/notifications?open=' + item.id;
                  }}
                >
                  <div className="flex ltr:text-left rtl:text-right">
                    <div className="flex-none ltr:mr-3 rtl:ml-3">
                      <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        <Icon 
                          icon="heroicons-outline:bell" 
                          className="text-blue-600 dark:text-blue-400 text-lg" 
                        />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-slate-800 dark:text-slate-200 mb-1">
                        {item.title.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1')}
                      </div>
                      <div className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed mb-2">
                        {item.message.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1')}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-slate-400 dark:text-slate-400 text-xs">
                          {new Date(item.createdAt).toLocaleString('pt-BR')}
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={(e) => markAsRead(item.id, e)}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                            title="Marcar como lida"
                          >
                            ✓
                          </button>
                          <div className="text-xs text-blue-600 dark:text-blue-400">
                            {item.sender}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Menu.Item>
          ))}
        </div>
        );
      })()}
    </Dropdown>
    
    {/* Modal de Configurações de Som */}
    <NotificationSoundSettings 
      isOpen={showSoundSettings}
      onClose={() => setShowSoundSettings(false)}
    />
  </>
  );
};

export default Notification;
