import { useEffect, useRef } from 'react';
import { useNotifications } from './useNotifications';

/**
 * Hook para gerenciar o título da aba do navegador com contagem de notificações
 * Funciona similar ao Gmail, mostrando "(X)" quando há mensagens não lidas
 * 
 * @param {string} baseTitle - Título base da página (ex: "Dashboard", "Perfil")
 * @param {string} appName - Nome da aplicação (padrão: "Coinage")
 * @param {boolean} showNotifications - Se deve mostrar contagem de notificações (padrão: true)
 */
export const useDocumentTitle = (baseTitle = '', appName = 'Coinage', showNotifications = true) => {
  const { unreadCount, fetchUnreadCount } = useNotifications();
  const lastUnreadCount = useRef(unreadCount);
  
  // Construir título completo
  const buildTitle = (count = 0) => {
    const notificationSuffix = count > 0 ? ` (${count > 99 ? '99+' : count})` : '';
    
    if (baseTitle && baseTitle.trim()) {
      return `${appName}${notificationSuffix} - ${baseTitle}`;
    }
    return `${appName}${notificationSuffix}`;
  };
  
  // Função para atualizar o título
  const updateTitle = (count) => {
    if (!showNotifications) {
      // Se não deve mostrar notificações, usar apenas o título base
      const title = baseTitle && baseTitle.trim() ? `${appName} - ${baseTitle}` : appName;
      document.title = title;
      return;
    }
    
    // Atualizar o título da aba baseado na contagem de notificações
    const newTitle = buildTitle(count);
    document.title = newTitle;
  };
  
  // Atualizar título sempre que qualquer parâmetro mudar
  useEffect(() => {
    updateTitle(unreadCount);
    lastUnreadCount.current = unreadCount;
  }, [unreadCount, baseTitle, appName, showNotifications]);
  
  // Escutar eventos de notificação em tempo real
  useEffect(() => {
    if (!showNotifications) return;
    
    // Função para atualizar contagem quando eventos de notificação acontecerem
    const handleNotificationUpdate = async () => {
      try {
        const newCount = await fetchUnreadCount();
        if (newCount !== undefined && newCount !== lastUnreadCount.current) {
          lastUnreadCount.current = newCount;
          updateTitle(newCount);
        }
      } catch (error) {
        console.warn('⚠️ [useDocumentTitle] Erro ao atualizar contagem:', error);
      }
    };
    
    // Escutar eventos de mudança na contagem de notificações
    window.addEventListener('notificationUnreadCountChanged', handleNotificationUpdate);
    window.addEventListener('notificationMarkedAsRead', handleNotificationUpdate);
    window.addEventListener('notificationMarkedAsUnread', handleNotificationUpdate);
    window.addEventListener('notificationDeleted', handleNotificationUpdate);
    window.addEventListener('notificationRestored', handleNotificationUpdate);
    window.addEventListener('notificationCreated', handleNotificationUpdate);
    window.addEventListener('notificationMultipleMarkedAsRead', handleNotificationUpdate);
    window.addEventListener('notificationAllMarkedAsRead', handleNotificationUpdate);
    window.addEventListener('notificationAllMarkedAsUnread', handleNotificationUpdate);
    
    // Cleanup: remover event listeners
    return () => {
      window.removeEventListener('notificationUnreadCountChanged', handleNotificationUpdate);
      window.removeEventListener('notificationMarkedAsRead', handleNotificationUpdate);
      window.removeEventListener('notificationMarkedAsUnread', handleNotificationUpdate);
      window.removeEventListener('notificationDeleted', handleNotificationUpdate);
      window.removeEventListener('notificationRestored', handleNotificationUpdate);
      window.removeEventListener('notificationCreated', handleNotificationUpdate);
      window.removeEventListener('notificationMultipleMarkedAsRead', handleNotificationUpdate);
      window.removeEventListener('notificationAllMarkedAsRead', handleNotificationUpdate);
      window.removeEventListener('notificationAllMarkedAsUnread', handleNotificationUpdate);
    };
  }, [showNotifications, fetchUnreadCount]);
  
  // Função para atualizar o título base manualmente
  const updateBaseTitle = (newTitle) => {
    const newFullTitle = buildTitle(unreadCount);
    document.title = newFullTitle;
  };
  
  // Função para atualizar o nome da aplicação
  const updateAppName = (newAppName) => {
    const newFullTitle = buildTitle(unreadCount);
    document.title = newFullTitle;
  };
  
  return {
    updateBaseTitle,
    updateAppName,
    unreadCount,
    currentTitle: document.title
  };
};
