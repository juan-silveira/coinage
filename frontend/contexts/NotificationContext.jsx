"use client";
import React, { createContext, useContext, useCallback, useEffect } from 'react';
import { getNotificationSoundService } from '@/services/notificationSoundService';

const NotificationContext = createContext();

export const useNotificationEvents = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    console.warn('useNotificationEvents: NotificationProvider não encontrado, retornando funções vazias');
    // Retornar funções vazias como fallback
    return {
      notifyMarkAsRead: () => {},
      notifyMarkAsUnread: () => {},
      notifyDeleted: () => {},
      notifyRestored: () => {},
      notifyNewNotification: () => {},
      notifyBatchNotifications: () => {},
      notifyMultipleMarkedAsRead: () => {},
      notifyAllMarkedAsRead: () => {},
      notifyAllMarkedAsUnread: () => {},
      triggerUnreadCountUpdate: () => {},
      triggerUnreadListUpdate: () => {},
      triggerFullRefresh: () => {}
    };
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  
  // Inicializar serviço de som
  useEffect(() => {
    const soundService = getNotificationSoundService();
    if (soundService) {
      console.log('🔊 Serviço de som de notificação inicializado no contexto');
    }
  }, []);
  
  // Trigger para atualizar o badge de notificações não lidas
  const triggerUnreadCountUpdate = useCallback(() => {
    window.dispatchEvent(new CustomEvent('notificationUnreadCountChanged'));
  }, []);

  // Trigger para atualizar a lista de notificações não lidas
  const triggerUnreadListUpdate = useCallback(() => {
    window.dispatchEvent(new CustomEvent('notificationUnreadListChanged'));
  }, []);

  // Trigger para forçar refresh completo (usado atualmente pelo sistema)
  const triggerFullRefresh = useCallback(() => {
    window.dispatchEvent(new CustomEvent('notificationRefresh'));
  }, []);

  // Evento específico para quando uma notificação é marcada como lida
  const notifyMarkAsRead = useCallback((notificationId) => {
    // Decrementa contador
    triggerUnreadCountUpdate();
    // Remove da lista não lida
    triggerUnreadListUpdate();
    // Dispatch evento específico com o ID
    window.dispatchEvent(new CustomEvent('notificationMarkedAsRead', { 
      detail: { notificationId } 
    }));
  }, [triggerUnreadCountUpdate, triggerUnreadListUpdate]);

  // Evento específico para quando uma notificação é marcada como não lida
  const notifyMarkAsUnread = useCallback((notificationId) => {
    // Incrementa contador
    triggerUnreadCountUpdate();
    // Adiciona na lista não lida
    triggerUnreadListUpdate();
    // Dispatch evento específico com o ID
    window.dispatchEvent(new CustomEvent('notificationMarkedAsUnread', { 
      detail: { notificationId } 
    }));
  }, [triggerUnreadCountUpdate, triggerUnreadListUpdate]);

  // Evento para quando uma notificação é excluída (se não lida, decrementa contador)
  const notifyDeleted = useCallback((notificationId, wasUnread = false) => {
    if (wasUnread) {
      triggerUnreadCountUpdate();
      triggerUnreadListUpdate();
    }
    window.dispatchEvent(new CustomEvent('notificationDeleted', { 
      detail: { notificationId, wasUnread } 
    }));
  }, [triggerUnreadCountUpdate, triggerUnreadListUpdate]);

  // Evento para quando múltiplas notificações são marcadas como lidas
  const notifyMultipleMarkedAsRead = useCallback((notificationIds) => {
    triggerUnreadCountUpdate();
    triggerUnreadListUpdate();
    window.dispatchEvent(new CustomEvent('notificationMultipleMarkedAsRead', { 
      detail: { notificationIds } 
    }));
  }, [triggerUnreadCountUpdate, triggerUnreadListUpdate]);

  // Evento para quando todas são marcadas como lidas
  const notifyAllMarkedAsRead = useCallback(() => {
    triggerUnreadCountUpdate();
    triggerUnreadListUpdate();
    window.dispatchEvent(new CustomEvent('notificationAllMarkedAsRead'));
  }, [triggerUnreadCountUpdate, triggerUnreadListUpdate]);

  // Evento para quando todas são marcadas como não lidas
  const notifyAllMarkedAsUnread = useCallback(() => {
    triggerUnreadCountUpdate();
    triggerUnreadListUpdate();
    window.dispatchEvent(new CustomEvent('notificationAllMarkedAsUnread'));
  }, [triggerUnreadCountUpdate, triggerUnreadListUpdate]);

  // Evento para quando uma notificação é restaurada (se não lida, incrementa contador)
  const notifyRestored = useCallback((notificationId, wasUnread = false) => {
    if (wasUnread) {
      triggerUnreadCountUpdate();
      triggerUnreadListUpdate();
    }
    window.dispatchEvent(new CustomEvent('notificationRestored', { 
      detail: { notificationId, wasUnread } 
    }));
  }, [triggerUnreadCountUpdate, triggerUnreadListUpdate]);

  // Evento para quando uma nova notificação é criada
  const notifyNewNotification = useCallback((notification) => {
    triggerUnreadCountUpdate();
    triggerUnreadListUpdate();
    window.dispatchEvent(new CustomEvent('notificationCreated', { 
      detail: { notification } 
    }));
    
    // Tocar som de notificação
    const soundService = getNotificationSoundService();
    if (soundService) {
      soundService.playNotificationSound(1);
    }
  }, [triggerUnreadCountUpdate, triggerUnreadListUpdate]);

  // Evento para quando múltiplas notificações são criadas (batch)
  const notifyBatchNotifications = useCallback((notifications) => {
    triggerUnreadCountUpdate();
    triggerUnreadListUpdate();
    window.dispatchEvent(new CustomEvent('notificationBatchCreated', { 
      detail: { notifications, count: notifications.length } 
    }));
    
    // Tocar som apenas uma vez para o batch
    const soundService = getNotificationSoundService();
    if (soundService && notifications.length > 0) {
      soundService.playNotificationSound(notifications.length);
    }
  }, [triggerUnreadCountUpdate, triggerUnreadListUpdate]);

  const value = {
    // Eventos específicos
    notifyMarkAsRead,
    notifyMarkAsUnread,
    notifyDeleted,
    notifyRestored,
    notifyNewNotification,
    notifyBatchNotifications,
    notifyMultipleMarkedAsRead,
    notifyAllMarkedAsRead,
    notifyAllMarkedAsUnread,
    
    // Triggers gerais
    triggerUnreadCountUpdate,
    triggerUnreadListUpdate,
    triggerFullRefresh
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};