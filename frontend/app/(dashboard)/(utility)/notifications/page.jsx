"use client";
import React, { useState, useEffect, useCallback } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Icon from "@/components/ui/Icon";
import Card from "@/components/ui/Card";
import useAuthStore from "@/store/authStore";
import api from "@/services/api";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import NotificationItem from "@/components/partials/app/notifications/NotificationItem";
import NotificationDetails from "@/components/partials/app/notifications/NotificationDetails";
import { useNotificationEvents } from "@/contexts/NotificationContext";
const NotificationPage = () => {
  const { isAuthenticated } = useAuthStore();
  const { 
    notifyMarkAsRead,
    notifyMarkAsUnread,
    notifyDeleted,
    notifyRestored,
    notifyMultipleMarkedAsRead,
    notifyAllMarkedAsRead,
    notifyAllMarkedAsUnread
  } = useNotificationEvents();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [filter, setFilter] = useState('all'); // all, unread, read, favorite
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const notificationsPerPage = 10;
  
  // Estados para modais de confirmação
  const [showDeleteMultipleModal, setShowDeleteMultipleModal] = useState(false);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);



  // Buscar todas as notificações
  const fetchNotifications = async () => {
    if (!isAuthenticated) return;
    
    try {
      setLoading(true);
      const response = await api.get('/api/notifications');
      
      if (response.data.success) {
        const notificationsData = response.data.data;
        setNotifications(notificationsData);
        setLoading(false);
      }
    } catch (error) {
      console.error('❌ Erro ao buscar notificações:', error);
      setLoading(false);
    }
  };

  // Marcar notificação como lida
  const markAsRead = useCallback(async (notificationId) => {
    if (!isAuthenticated) return;
    
    try {
      await api.put(`/api/notifications/${notificationId}/read`);
      
      // Atualizar estado local
      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, isRead: true, readDate: new Date().toISOString() } : n
      ));
      
      // Atualizar selectedNotification se estiver aberta
      if (selectedNotification && selectedNotification.id === notificationId) {
        setSelectedNotification(prev => ({ ...prev, isRead: true, readDate: new Date().toISOString() }));
      }

      // Notificar o sistema sobre a mudança
      notifyMarkAsRead(notificationId);
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  }, [isAuthenticated, selectedNotification, notifyMarkAsRead]);

  // Marcar notificação como não lida
  const markAsUnread = async (notificationId) => {
    if (!isAuthenticated) return;
    
    try {
      await api.put(`/api/notifications/${notificationId}/unread`);
      
      // Atualizar estado local
      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, isRead: false, readDate: null } : n
      ));
      
      // Atualizar selectedNotification se estiver aberta
      if (selectedNotification && selectedNotification.id === notificationId) {
        setSelectedNotification(prev => ({ ...prev, isRead: false, readDate: null }));
      }

      // Notificar o sistema sobre a mudança
      notifyMarkAsUnread(notificationId);
    } catch (error) {
      console.error('Erro ao marcar notificação como não lida:', error);
    }
  };

  // Marcar/desmarcar como favorita
  const toggleFavorite = async (notificationId) => {
    if (!isAuthenticated) return;
    
    try {
      const response = await api.put(`/api/notifications/${notificationId}/favorite`);
      
      if (response.data.success) {
        // Atualizar estado local
        setNotifications(prev => prev.map(n => 
          n.id === notificationId ? { ...n, isFavorite: !n.isFavorite } : n
        ));
        
        // Atualizar selectedNotification se estiver aberta
        if (selectedNotification && selectedNotification.id === notificationId) {
          setSelectedNotification(prev => ({ ...prev, isFavorite: !prev.isFavorite }));
        }
      }
    } catch (error) {
      console.error('Erro ao alternar favorito:', error);
    }
  };

  // Excluir notificação
  const deleteNotification = async (notificationId) => {
    if (!isAuthenticated) return;
    
    try {
      await api.delete(`/api/notifications/${notificationId}`);
      
      // Verificar se a notificação estava não lida antes de excluir
      const notification = notifications.find(n => n.id === notificationId);
      const wasUnread = notification && !notification.isRead;

      // Atualizar estado local (soft delete)
      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, isActive: false } : n
      ));
      
      // Fechar modal se a notificação excluída estava aberta
      if (selectedNotification && selectedNotification.id === notificationId) {
        setSelectedNotification(null);
      }

      // Notificar o sistema sobre a exclusão
      notifyDeleted(notificationId, wasUnread);

      // Mostrar toast de sucesso
      toast.success(
        <div>
          <span>Conversa movida para a Lixeira. </span>
          <button 
            onClick={() => {
              try {
                restoreNotification(notificationId);
              } catch (error) {
                console.error('Erro ao restaurar:', error);
                toast.error('Erro ao restaurar notificação');
              }
            }}
            className="text-blue-600 underline hover:text-blue-800"
          >
            Desfazer
          </button>
        </div>,
        {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        }
      );
    } catch (error) {
      console.error('Erro ao excluir notificação:', error);
    }
  };

  // Restaurar notificação
  const restoreNotification = async (notificationId) => {
    if (!isAuthenticated) return;
    
    try {
      // Verificar se a notificação estava não lida antes de restaurar
      const notification = notifications.find(n => n.id === notificationId);
      const wasUnread = notification && !notification.isRead;

      await api.put(`/api/notifications/${notificationId}/restore`);
      
      // Atualizar estado local
      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, isActive: true } : n
      ));

      // Notificar o sistema sobre a restauração
      notifyRestored(notificationId, wasUnread);

      toast.success('Notificação restaurada com sucesso!', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } catch (error) {
      console.error('Erro ao restaurar notificação:', error);
      toast.error('Erro ao restaurar notificação', {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  // Abrir modal de detalhes
  const openNotificationDetails = useCallback((notification) => {
    setSelectedNotification(notification);
    // Marcar como lida automaticamente
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
  }, [markAsRead]);

  // Fechar modal de detalhes
  const closeNotificationDetails = () => {
    setSelectedNotification(null);
  };

  // Selecionar/deselecionar notificação
  const toggleSelection = (notificationId) => {
    const newSelection = new Set(selectedNotifications);
    if (newSelection.has(notificationId)) {
      newSelection.delete(notificationId);
    } else {
      newSelection.add(notificationId);
    }
    setSelectedNotifications(newSelection);
  };

  // Selecionar todas as notificações
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedNotifications(new Set());
      setSelectAll(false);
    } else {
      setSelectedNotifications(new Set(notifications.map(n => n.id)));
      setSelectAll(true);
    }
  };

  // Marcar múltiplas como lidas
  const markMultipleAsRead = async () => {
    if (selectedNotifications.size === 0) return;
    
    try {
      await api.put('/api/notifications/mark-multiple-read', {
        notificationIds: Array.from(selectedNotifications)
      });
      
      // Atualizar estado local
      setNotifications(prev => prev.map(n => 
        selectedNotifications.has(n.id) ? { ...n, isRead: true, readDate: new Date().toISOString() } : n
      ));
      
      setSelectedNotifications(new Set());
      setSelectAll(false);

      // Notificar o sistema sobre as mudanças
      notifyMultipleMarkedAsRead(Array.from(selectedNotifications));
    } catch (error) {
      console.error('Erro ao marcar múltiplas notificações como lidas:', error);
    }
  };

  // Marcar todas como lidas
  const markAllAsRead = async () => {
    try {
      await api.put('/api/notifications/mark-all-read');
      
      // Atualizar estado local
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true, readDate: new Date().toISOString() })));

      // Notificar o sistema sobre a mudança
      notifyAllMarkedAsRead();
    } catch (error) {
      console.error('Erro ao marcar todas as notificações como lidas:', error);
    }
  };

  // Marcar todas como não lidas
  const markAllAsUnread = async () => {
    try {
      await api.put('/api/notifications/mark-all-unread');
      
      // Atualizar estado local
      setNotifications(prev => prev.map(n => ({ ...n, isRead: false, readDate: null })));

      // Notificar o sistema sobre a mudança
      notifyAllMarkedAsUnread();
    } catch (error) {
      console.error('Erro ao marcar todas as notificações como não lidas:', error);
    }
  };

  // Excluir múltiplas notificações
  const deleteMultipleNotifications = async () => {
    if (selectedNotifications.size === 0) return;
    
    try {
      await api.delete('/api/notifications/delete-multiple', {
        data: { notificationIds: Array.from(selectedNotifications) }
      });
      
      // Atualizar estado local (soft delete)
      setNotifications(prev => prev.map(n => 
        selectedNotifications.has(n.id) ? { ...n, isActive: false } : n
      ));
      
      // Fechar modal se alguma notificação excluída estava aberta
      if (selectedNotification && selectedNotifications.has(selectedNotification.id)) {
        setSelectedNotification(null);
      }
      
      // Limpar seleções
      setSelectedNotifications(new Set());
      setSelectAll(false);
      
      // Fechar modal de confirmação
      setShowDeleteMultipleModal(false);
      
      // Mostrar toast de sucesso
      toast.success(
        <div>
          <span>Notificações movidas para a Lixeira. </span>
          <button 
            onClick={() => restoreMultipleNotifications(Array.from(selectedNotifications))}
            className="text-blue-600 underline hover:text-blue-800"
          >
            Desfazer
          </button>
        </div>,
        {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        }
      );
    } catch (error) {
      console.error('Erro ao excluir múltiplas notificações:', error);
      toast.error('Erro ao excluir notificações', {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  // Excluir todas as notificações
  const deleteAllNotifications = async () => {
    try {
      // Excluir todas as notificações filtradas
      const notificationIds = filteredNotifications.map(n => n.id);
      
      await api.delete('/api/notifications/delete-multiple', {
        data: { notificationIds }
      });
      
      // Atualizar estado local (soft delete)
      setNotifications(prev => prev.map(n => 
        notificationIds.includes(n.id) ? { ...n, isActive: false } : n
      ));
      
      // Fechar modal se alguma notificação excluída estava aberta
      if (selectedNotification && notificationIds.includes(selectedNotification.id)) {
        setSelectedNotification(null);
      }
      
      // Limpar seleções
      setSelectedNotifications(new Set());
      setSelectAll(false);
      
      // Fechar modal de confirmação
      setShowDeleteAllModal(false);
      
      // Mostrar toast de sucesso
      toast.success(
        <div>
          <span>Todas as notificações foram movidas para a Lixeira. </span>
          <button 
            onClick={() => restoreAllNotifications(notificationIds)}
            className="text-blue-600 underline hover:text-blue-800"
          >
            Desfazer
          </button>
        </div>,
        {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        }
      );
    } catch (error) {
      console.error('Erro ao excluir todas as notificações:', error);
      toast.error('Erro ao excluir notificações', {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  // Restaurar múltiplas notificações excluídas
  const restoreMultipleNotifications = async (notificationIds) => {
    try {
      // Verificar quais estavam não lidas antes de restaurar
      const unreadIds = notificationIds.filter(id => {
        const notification = notifications.find(n => n.id === id);
        return notification && !notification.isRead;
      });

      // Restaurar cada notificação
      for (const id of notificationIds) {
        await api.put(`/api/notifications/${id}/restore`);
        
        // Notificar individualmente cada restauração
        const wasUnread = unreadIds.includes(id);
        notifyRestored(id, wasUnread);
      }
      
      // Atualizar estado local
      setNotifications(prev => prev.map(n => 
        notificationIds.includes(n.id) ? { ...n, isActive: true } : n
      ));
      
      toast.success('Notificações restauradas com sucesso!', {
        position: "top-right",
        autoClose: 3000,
      });
    } catch (error) {
      console.error('Erro ao restaurar notificações:', error);
      toast.error('Erro ao restaurar notificações', {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  // Restaurar todas as notificações excluídas
  const restoreAllNotifications = async (notificationIds) => {
    try {
      // Verificar quais estavam não lidas antes de restaurar
      const unreadIds = notificationIds.filter(id => {
        const notification = notifications.find(n => n.id === id);
        return notification && !notification.isRead;
      });

      // Restaurar cada notificação
      for (const id of notificationIds) {
        await api.put(`/api/notifications/${id}/restore`);
        
        // Notificar individualmente cada restauração
        const wasUnread = unreadIds.includes(id);
        notifyRestored(id, wasUnread);
      }
      
      // Atualizar estado local
      setNotifications(prev => prev.map(n => 
        notificationIds.includes(n.id) ? { ...n, isActive: true } : n
      ));
      
      toast.success('Todas as notificações foram restauradas!', {
        position: "top-right",
        autoClose: 3000,
      });
    } catch (error) {
      console.error('Erro ao restaurar notificações:', error);
      toast.error('Erro ao restaurar notificações', {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  // Filtrar notificações
  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return !notification.isRead && notification.isActive;
      case 'read':
        return notification.isRead && notification.isActive;
      case 'favorite':
        return notification.isFavorite && notification.isActive;
      case 'deleted':
        return !notification.isActive;
      default:
        return notification.isActive;
    }
  });

  // Calcular paginação
  const totalPages = Math.ceil(filteredNotifications.length / notificationsPerPage);
  const startIndex = (currentPage - 1) * notificationsPerPage;
  const endIndex = startIndex + notificationsPerPage;
  const paginatedNotifications = filteredNotifications.slice(startIndex, endIndex);

  // Resetar página quando não há notificações na página atual
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);



  // Carregar dados iniciais
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    } else {
      console.log('❌ Usuário não autenticado');
    }
  }, [isAuthenticated]);

  // Verificar se há notificação para abrir automaticamente
  useEffect(() => {
    if (notifications.length > 0) {
      const urlParams = new URLSearchParams(window.location.search);
      const openNotificationId = urlParams.get('open');
      
      if (openNotificationId) {
        const notification = notifications.find(n => n.id === openNotificationId);
        if (notification) {
          openNotificationDetails(notification);
          // Limpar o parâmetro da URL
          window.history.replaceState({}, document.title, '/notifications');
        }
      }
    }
  }, [notifications, openNotificationDetails]);

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-8">
        <div className="px-2 sm:px-4 lg:px-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Notificações
                </h1>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  Gerencie suas notificações do sistema
                </p>
              </div>
            </div>
          </div>

          {/* Botões de ação em lote - Entre header e filtros */}
          {!selectedNotification && (
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Button
                  onClick={markAllAsRead}
                  disabled={notifications.filter(n => !n.isRead).length === 0}
                  className="btn-outline flex items-center justify-center"
                >
                  <Icon icon="heroicons-outline:check-circle" className="w-4 h-4 mr-2" />
                  Marcar todas como lidas
                </Button>
                
                <Button
                  onClick={markAllAsUnread}
                  disabled={notifications.filter(n => n.isRead).length === 0}
                  className="btn-outline flex items-center justify-center"
                >
                  <Icon icon="heroicons-outline:eye-off" className="w-4 h-4 mr-2" />
                  Marcar todas como não lidas
                </Button>
              </div>
            </div>
          )}

          {/* Filtros e ações em lote - Escondidos quando uma notificação está aberta */}
          {!selectedNotification && (
            <div className="mb-6 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-4">
              {/* Layout responsivo: Grid no mobile, linha única no desktop */}
              
              {/* Mobile: Grid 2x3, Desktop: Linha única */}
              <div className="grid grid-cols-2 gap-3 lg:flex lg:items-center lg:justify-between lg:space-x-4 lg:gap-0">
                
                {/* PRIMEIRA LINHA: Filtros + Contador de notificações */}
                {/* Elemento 1: Filtros */}
                <div className="col-span-1 lg:col-span-1 flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filtrar:</span>
                  <select
                    value={filter}
                    onChange={(e) => {
                      setFilter(e.target.value);
                      setCurrentPage(1); // Reset para primeira página
                    }}
                    className="border border-gray-300 dark:border-slate-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white min-w-[120px]"
                  >
                    <option value="all">Todas</option>
                    <option value="unread">Não lidas</option>
                    <option value="read">Lidas</option>
                    <option value="favorite">Favoritas</option>
                    <option value="deleted">Excluídas</option>
                  </select>
                </div>

                {/* Elemento 2: Contador de notificações */}
                <div className="col-span-1 text-sm text-gray-600 dark:text-gray-400 flex items-center justify-end">
                  {notifications.length} notificação{notifications.length !== 1 ? 'es' : ''}
                </div>

                {/* SEGUNDA LINHA: Selecionar todas + Contador de seleções */}
                {/* Elemento 3: Selecionar todas */}
                <div className="col-span-1 flex items-center justify-start">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Selecionar todas
                    </span>
                  </label>
                </div>

                {/* Elemento 4: Contador de seleções (só aparece quando há seleções) */}
                {selectedNotifications.size > 0 && (
                  <div className="col-span-1 text-sm text-gray-700 dark:text-gray-300 flex items-center justify-end">
                    {selectedNotifications.size} selecionada(s)
                  </div>
                )}

                {/* TERCEIRA LINHA: Botões de ação (só aparece quando há seleções) */}
                {/* Elemento 5: Botão Marcar como lidas */}
                {selectedNotifications.size > 0 && (
                  <div className="col-span-1">
                    <Button
                      onClick={markMultipleAsRead}
                      className="btn-outline w-full flex items-center justify-center"
                    >
                      <Icon icon="heroicons-outline:check-circle" className="w-4 h-4 mr-2" />
                      Marcar como lidas
                    </Button>
                  </div>
                )}

                {/* Elemento 6: Botão Excluir selecionadas */}
                {selectedNotifications.size > 0 && filter !== 'deleted' && (
                  <div className="col-span-1">
                                            <Button
                          onClick={() => setShowDeleteMultipleModal(true)}
                          className="bg-red-500 text-white hover:bg-red-600 w-full flex items-center justify-center"
                        >
                          <Icon icon="heroicons-outline:trash" className="w-4 h-4 mr-2" />
                          Excluir selecionadas
                        </Button>
                  </div>
                )}
              </div>
            </div>
          )}

                  {/* Lista de notificações */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden relative w-full">
            {loading ? (
              <div className="text-center py-12">
                <Icon icon="heroicons-outline:refresh" className="mx-auto mb-4 text-6xl text-blue-500 animate-spin" />
                <p className="text-gray-600 dark:text-gray-400">Carregando notificações...</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="text-center py-12">
                <Icon icon="heroicons-outline:bell" className="mx-auto mb-4 text-6xl text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Nenhuma notificação
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {filter === 'all' ? 'Você não tem notificações no momento.' : 
                   filter === 'unread' ? 'Nenhuma notificação não lida encontrada.' :
                   filter === 'read' ? 'Nenhuma notificação lida encontrada.' :
                   filter === 'favorite' ? 'Nenhuma notificação favorita encontrada.' :
                   filter === 'deleted' ? 'Nenhuma notificação excluída encontrada.' :
                   'Nenhuma notificação encontrada.'}
                </p>
              </div>
            ) : (
              <>
                {/* Lista de notificações - Sem scroll, todas as 10 mensagens visíveis */}
                <div className="w-full">
                  <div className="w-full">
                    {paginatedNotifications.map((notification, index) => (
                      <div key={notification.id} className="w-full">
                        <NotificationItem
                          notification={notification}
                          isSelected={selectedNotifications.has(notification.id)}
                          onToggleSelection={toggleSelection}
                          onToggleFavorite={toggleFavorite}
                          onMarkAsRead={markAsRead}
                          onMarkAsUnread={markAsUnread}
                          onDelete={deleteNotification}
                          onRestore={filter === 'deleted' ? restoreNotification : undefined}
                          onViewDetails={openNotificationDetails}
                          isLast={index === paginatedNotifications.length - 1}
                        />
                        {index < paginatedNotifications.length - 1 && (
                          <div className="border-b border-gray-200 dark:border-slate-700"></div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Paginação fixa - fora da área scrollável */}
                {totalPages > 1 && (
                  <div className="px-4 py-3 border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed dark:text-slate-400 dark:hover:text-slate-300"
                        title="Primeira página"
                      >
                        <Icon icon="heroicons-outline:chevron-double-left" className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed dark:text-slate-400 dark:hover:text-slate-300"
                        title="Página anterior"
                      >
                        <Icon icon="heroicons-outline:chevron-left" className="w-4 h-4" />
                      </button>
                      
                      {/* Números das páginas */}
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`px-2 py-1 text-xs font-medium rounded ${
                              currentPage === page
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-500 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-700'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                      </div>
                      
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed dark:text-slate-400 dark:hover:text-slate-300"
                        title="Próxima página"
                      >
                        <Icon icon="heroicons-outline:chevron-right" className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed dark:text-slate-400 dark:hover:text-slate-300"
                        title="Última página"
                      >
                        <Icon icon="heroicons-outline:chevron-double-right" className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
            
            {/* Slide de detalhes da notificação */}
            {selectedNotification && (
              <NotificationDetails
                notification={selectedNotification}
                onClose={closeNotificationDetails}
                onMarkAsRead={markAsRead}
                onMarkAsUnread={markAsUnread}
                onToggleFavorite={toggleFavorite}
                onDelete={deleteNotification}
              />
            )}
          </div>
        </div>
      </div>
      
      {/* Modais de confirmação */}
      
      {/* Modal para excluir múltiplas notificações */}
      <ConfirmationModal
        activeModal={showDeleteMultipleModal}
        onClose={() => setShowDeleteMultipleModal(false)}
        onConfirm={deleteMultipleNotifications}
        title="Excluir notificações"
        message={`Tem certeza que deseja excluir ${selectedNotifications.size} notificação(ões)?`}
        confirmText="Sim, excluir!"
        cancelText="Cancelar"
        confirmButtonColor="red"
        icon="warning"
      />
      
      {/* Modal para excluir todas as notificações */}
      <ConfirmationModal
        activeModal={showDeleteAllModal}
        onClose={() => setShowDeleteAllModal(false)}
        onConfirm={deleteAllNotifications}
        title="Excluir todas as notificações"
        message={`Tem certeza que deseja excluir todas as ${filteredNotifications.length} notificações?`}
        confirmText="Sim, excluir todas!"
        cancelText="Cancelar"
        confirmButtonColor="red"
        icon="danger"
      />
      
      <ToastContainer />
    </>
  );
};

export default NotificationPage;
