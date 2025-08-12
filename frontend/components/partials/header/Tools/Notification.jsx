import React, { useState, useEffect, useCallback } from "react";
import Dropdown from "@/components/ui/Dropdown";
import Icon from "@/components/ui/Icon";
import Link from "next/link";
import { Menu } from "@headlessui/react";
import useAuthStore from "@/store/authStore";
import api from "@/services/api";
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
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);



  // Buscar contagem de não lidas
  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      const response = await api.get('/api/notifications/unread-count');
      
      if (response.data.success) {
        console.log('📊 Contagem recebida:', response.data.data.count);
        setUnreadCount(response.data.data.count);
      }
    } catch (error) {
      console.error('Erro ao buscar contagem de notificações:', error);
      // Fallback: buscar todas as notificações e contar as não lidas
      try {
        const allResponse = await api.get('/api/notifications');
        if (allResponse.data.success) {
          const unreadCount = allResponse.data.data.filter(n => !n.isRead && n.isActive).length;
          console.log('📊 Contagem fallback:', unreadCount);
          setUnreadCount(unreadCount);
        }
      } catch (fallbackError) {
        console.error('Erro no fallback:', fallbackError);
      }
    }
  }, [isAuthenticated]);

  // Buscar notificações não lidas
  const fetchUnreadNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      setLoading(true);
      const response = await api.get('/api/notifications/unread');
      
      if (response.data.success) {
        setNotifications(response.data.data);
        setUnreadCount(response.data.data.length);
      }
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
      // Em caso de erro, tentar buscar a contagem
      fetchUnreadCount();
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, fetchUnreadCount]);

  // Marcar notificação como lida
  const markAsRead = async (notificationId, event = null) => {
    if (!isAuthenticated) return;
    
    // Prevenir navegação se chamado de um botão
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    
    try {
      await api.put(`/api/notifications/${notificationId}/read`);
      
      // Atualizar estado local
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      console.log(`✅ Notificação ${notificationId} marcada como lida`);
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  };

  // Marcar todas as notificações como lidas
  const markAllAsRead = async () => {
    if (!isAuthenticated) return;
    
    try {
      await api.put('/api/notifications/mark-all-read');
      
      // Limpar estado local
      setNotifications([]);
      setUnreadCount(0);
      
      console.log('✅ Todas as notificações foram marcadas como lidas');
    } catch (error) {
      console.error('Erro ao marcar todas as notificações como lidas:', error);
    }
  };

  // Carregar dados iniciais
  useEffect(() => {
    console.log('🔐 Notification - isAuthenticated:', isAuthenticated);
    if (isAuthenticated) {
      console.log('✅ Usuário autenticado, buscando notificações...');
      fetchUnreadNotifications();
      fetchUnreadCount();
    } else {
      console.log('❌ Usuário não autenticado');
    }
  }, [isAuthenticated]);

  // Debug: Log das mudanças de estado
  useEffect(() => {
    console.log('📱 Notification - Estado atual:', {
      isAuthenticated,
      unreadCount,
      notificationsLength: notifications.length,
      loading
    });
  }, [isAuthenticated, unreadCount, notifications.length, loading]);

  // Atualizar a cada 15 segundos (mais frequente)
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 15000);
    
    return () => clearInterval(interval);
  }, [isAuthenticated, fetchUnreadCount]);

  // Ouvir evento personalizado para atualização imediata
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleRefreshNotifications = () => {
      console.log('🔔 [Notification] Evento de refresh recebido - atualizando notificações...');
      
      // Usar funções diretas para evitar problemas de dependência
      if (isAuthenticated) {
        fetchUnreadCount();
        fetchUnreadNotifications();
      }
    };

    window.addEventListener('refreshNotifications', handleRefreshNotifications, { passive: true });
    
    return () => {
      window.removeEventListener('refreshNotifications', handleRefreshNotifications);
    };
  }, [isAuthenticated]);

  return (
    <Dropdown classMenuItems="md:w-[300px] top-[58px]" label={notifyLabel(unreadCount)}>
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
          <Link href="/notifications" className="text-xs text-slate-800 dark:text-slate-200 hover:underline">
            Ver todas
          </Link>
        </div>
      </div>
      
      {loading ? (
        <div className="px-4 py-8 text-center text-slate-500">
          <Icon icon="heroicons-outline:refresh" className="animate-spin mx-auto mb-2 text-2xl" />
          <p>Carregando...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="px-4 py-8 text-center text-slate-500">
          <Icon icon="heroicons-outline:bell" className="mx-auto mb-2 text-2xl" />
          <p>Nenhuma notificação</p>
        </div>
      ) : (
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
      )}
    </Dropdown>
  );
};

export default Notification;
