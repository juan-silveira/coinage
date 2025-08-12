'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useAuthStore from '@/store/authStore';
import api from '@/services/api';
import Icon from '@/components/ui/Icon';
import Button from '@/components/ui/Button';

const NotificationDetailPage = () => {
  const { id } = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Buscar notificação específica
  const fetchNotification = async () => {
    if (!isAuthenticated) return;
    
    try {
      setLoading(true);
      const response = await api.get(`/api/notifications/${id}`);
      
      if (response.data.success) {
        setNotification(response.data.data);
        // Marcar como lida automaticamente
        await api.put(`/api/notifications/${id}/read`);
      }
    } catch (error) {
      console.error('Erro ao buscar notificação:', error);
      setError('Erro ao carregar notificação');
    } finally {
      setLoading(false);
    }
  };

  // Carregar dados iniciais
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotification();
    }
  }, [isAuthenticated, id]);

  // Marcar/desmarcar como favorita
  const toggleFavorite = async () => {
    if (!notification) return;
    
    try {
      const response = await api.put(`/api/notifications/${id}/favorite`);
      if (response.data.success) {
        setNotification(prev => ({
          ...prev,
          isFavorite: !prev.isFavorite
        }));
      }
    } catch (error) {
      console.error('Erro ao alternar favorito:', error);
    }
  };

  // Marcar como não lida
  const markAsUnread = async () => {
    if (!notification) return;
    
    try {
      const response = await api.put(`/api/notifications/${id}/unread`);
      if (response.data.success) {
        setNotification(prev => ({
          ...prev,
          isRead: false,
          readDate: null
        }));
      }
    } catch (error) {
      console.error('Erro ao marcar como não lida:', error);
    }
  };

  // Excluir notificação
  const deleteNotification = async () => {
    if (!notification) return;
    
    if (confirm('Tem certeza que deseja excluir esta notificação?')) {
      try {
        await api.delete(`/api/notifications/${id}`);
        router.push('/notifications');
      } catch (error) {
        console.error('Erro ao excluir notificação:', error);
      }
    }
  };

  // Função para renderizar markdown básico
  const renderMarkdown = (text) => {
    if (!text) return '';
    
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">$1</code>')
      .replace(/\n/g, '<br />');
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Icon icon="heroicons-outline:lock-closed" className="mx-auto mb-4 text-6xl text-red-500" />
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            Acesso Negado
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Você precisa estar logado para acessar esta página.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Icon icon="heroicons-outline:refresh" className="mx-auto mb-4 text-6xl text-blue-500 animate-spin" />
          <p className="text-gray-600 dark:text-gray-400">Carregando notificação...</p>
        </div>
      </div>
    );
  }

  if (error || !notification) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Icon icon="heroicons-outline:exclamation-triangle" className="mx-auto mb-4 text-6xl text-red-500" />
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            Erro ao carregar notificação
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error || 'Notificação não encontrada'}
          </p>
          <Button onClick={() => router.push('/notifications')} className="btn-outline">
            Voltar para notificações
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => router.push('/notifications')}
                className="btn-outline flex items-center space-x-2"
              >
                <Icon icon="heroicons-outline:arrow-left" className="w-4 h-4" />
                <span>Voltar</span>
              </Button>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Detalhes da Notificação
              </h1>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                onClick={markAsUnread}
                disabled={!notification.isRead}
                className={`btn-outline ${!notification.isRead ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Icon icon="heroicons-outline:eye-off" className="w-4 h-4 mr-2" />
                Marcar como não lida
              </Button>
              
              <Button
                onClick={toggleFavorite}
                className={`${notification.isFavorite ? 'bg-yellow-500 text-white' : 'btn-outline'}`}
              >
                <Icon 
                  icon={notification.isFavorite ? "heroicons-solid:star" : "heroicons-outline:star"} 
                  className="w-4 h-4 mr-2" 
                />
                {notification.isFavorite ? 'Favorita' : 'Favoritar'}
              </Button>
              
              <Button
                onClick={deleteNotification}
                className="bg-red-500 text-white hover:bg-red-600"
              >
                <Icon icon="heroicons-outline:trash" className="w-4 h-4 mr-2" />
                Excluir
              </Button>
            </div>
          </div>
        </div>

        {/* Conteúdo da notificação */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden">
          {/* Header da notificação */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {notification.title}
                </h2>
                <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center">
                    <Icon icon="heroicons-outline:user" className="w-4 h-4 mr-1" />
                    {notification.sender}
                  </span>
                  <span className="flex items-center">
                    <Icon icon="heroicons-outline:clock" className="w-4 h-4 mr-1" />
                    {new Date(notification.createdAt).toLocaleString('pt-BR')}
                  </span>
                  {notification.readDate && (
                    <span className="flex items-center">
                      <Icon icon="heroicons-outline:check-circle" className="w-4 h-4 mr-1" />
                      Lida em {new Date(notification.readDate).toLocaleString('pt-BR')}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {notification.isRead && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    <Icon icon="heroicons-outline:check-circle" className="w-3 h-3 mr-1" />
                    Lida
                  </span>
                )}
                {notification.isFavorite && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                    <Icon icon="heroicons-solid:star" className="w-3 h-3 mr-1" />
                    Favorita
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Corpo da mensagem */}
          <div className="px-6 py-8">
            <div 
              className="prose prose-lg max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ 
                __html: renderMarkdown(notification.message) 
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationDetailPage;
