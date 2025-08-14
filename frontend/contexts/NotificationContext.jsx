"use client";
import React, { createContext, useContext, useCallback } from 'react';

const NotificationContext = createContext();

export const useNotificationEvents = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationEvents must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  
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

  const value = {
    // Eventos específicos
    notifyMarkAsRead,
    notifyMarkAsUnread,
    notifyDeleted,
    notifyRestored,
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