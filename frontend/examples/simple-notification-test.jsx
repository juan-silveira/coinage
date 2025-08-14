import React, { useState, useEffect } from 'react';

/**
 * Teste simplificado de notificações - sem hooks externos
 * Testa apenas o estado básico do React
 */
const SimpleNotificationTest = () => {
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Notificação 1', message: 'Mensagem 1', isRead: false },
    { id: 2, title: 'Notificação 2', message: 'Mensagem 2', isRead: false },
    { id: 3, title: 'Notificação 3', message: 'Mensagem 3', isRead: true },
  ]);
  
  const [unreadCount, setUnreadCount] = useState(2);
  const [lastAction, setLastAction] = useState('Nenhuma');
  const [renderCount, setRenderCount] = useState(0);

  // Contador de re-renderizações
  useEffect(() => {
    setRenderCount(prev => prev + 1);
    console.log('🔄 [SimpleNotificationTest] Componente re-renderizado');
    console.log('  - unreadCount:', unreadCount);
    console.log('  - notifications:', notifications.length);
    console.log('  - renderCount:', renderCount + 1);
  });

  // Marcar como lida
  const markAsRead = (id) => {
    console.log('🔍 [SimpleNotificationTest] Marcando como lida:', id);
    console.log('🔍 [SimpleNotificationTest] Estado ANTES - unreadCount:', unreadCount);
    
    // Atualizar notificações
    setNotifications(prev => {
      const updated = prev.map(n => 
        n.id === id ? { ...n, isRead: true } : n
      );
      console.log('🔄 [SimpleNotificationTest] Notificações atualizadas:', updated.length);
      return updated;
    });
    
    // Atualizar contador
    setUnreadCount(prev => {
      const newCount = Math.max(0, prev - 1);
      console.log('🔄 [SimpleNotificationTest] unreadCount atualizado:', prev, '→', newCount);
      return newCount;
    });
    
    setLastAction(`Marcada como lida: ${id}`);
    console.log('✅ [SimpleNotificationTest] Operação concluída');
  };

  // Marcar como não lida
  const markAsUnread = (id) => {
    console.log('🔍 [SimpleNotificationTest] Marcando como não lida:', id);
    console.log('🔍 [SimpleNotificationTest] Estado ANTES - unreadCount:', unreadCount);
    
    // Atualizar notificações
    setNotifications(prev => {
      const updated = prev.map(n => 
        n.id === id ? { ...n, isRead: false } : n
      );
      console.log('🔄 [SimpleNotificationTest] Notificações atualizadas:', updated.length);
      return updated;
    });
    
    // Atualizar contador
    setUnreadCount(prev => {
      const newCount = prev + 1;
      console.log('🔄 [SimpleNotificationTest] unreadCount atualizado:', prev, '→', newCount);
      return newCount;
    });
    
    setLastAction(`Marcada como não lida: ${id}`);
    console.log('✅ [SimpleNotificationTest] Operação concluída');
  };

  // Marcar todas como lidas
  const markAllAsRead = () => {
    console.log('🔍 [SimpleNotificationTest] Marcando todas como lidas');
    console.log('🔍 [SimpleNotificationTest] Estado ANTES - unreadCount:', unreadCount);
    
    // Atualizar notificações
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, isRead: true }));
      console.log('🔄 [SimpleNotificationTest] Todas as notificações marcadas como lidas');
      return updated;
    });
    
    // Atualizar contador
    setUnreadCount(0);
    console.log('🔄 [SimpleNotificationTest] unreadCount definido como 0');
    
    setLastAction('Todas marcadas como lidas');
    console.log('✅ [SimpleNotificationTest] Operação concluída');
  };

  // Adicionar notificação
  const addNotification = () => {
    const newId = Math.max(...notifications.map(n => n.id)) + 1;
    const newNotification = {
      id: newId,
      title: `Notificação ${newId}`,
      message: `Mensagem ${newId}`,
      isRead: false
    };
    
    console.log('🔍 [SimpleNotificationTest] Adicionando notificação:', newId);
    console.log('🔍 [SimpleNotificationTest] Estado ANTES - unreadCount:', unreadCount);
    
    setNotifications(prev => [...prev, newNotification]);
    setUnreadCount(prev => prev + 1);
    
    setLastAction(`Adicionada: ${newId}`);
    console.log('✅ [SimpleNotificationTest] Notificação adicionada');
  };

  // Resetar tudo
  const resetAll = () => {
    console.log('🔍 [SimpleNotificationTest] Resetando tudo...');
    
    setNotifications([
      { id: 1, title: 'Notificação 1', message: 'Mensagem 1', isRead: false },
      { id: 2, title: 'Notificação 2', message: 'Mensagem 2', isRead: false },
      { id: 3, title: 'Notificação 3', message: 'Mensagem 3', isRead: true },
    ]);
    setUnreadCount(2);
    setLastAction('Resetado');
    
    console.log('✅ [SimpleNotificationTest] Tudo resetado');
  };

  console.log('🔍 [SimpleNotificationTest] Renderizando componente');

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        🧪 Teste Simplificado - Notificações
      </h2>
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 text-gray-700">Status Atual</h3>
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="bg-blue-50 p-3 rounded">
            <div className="text-sm text-blue-600">Total</div>
            <div className="text-xl font-bold text-blue-800">{notifications.length}</div>
          </div>
          <div className="bg-green-50 p-3 rounded">
            <div className="text-sm text-green-600">Não Lidas</div>
            <div className="text-xl font-bold text-green-800">{unreadCount}</div>
          </div>
          <div className="bg-orange-50 p-3 rounded">
            <div className="text-sm text-orange-600">Lidas</div>
            <div className="text-xl font-bold text-orange-800">{notifications.filter(n => n.isRead).length}</div>
          </div>
          <div className="bg-purple-50 p-3 rounded">
            <div className="text-sm text-purple-600">Re-renderizações</div>
            <div className="text-xl font-bold text-purple-800">{renderCount}</div>
          </div>
        </div>
        
        <div className="bg-gray-50 p-3 rounded">
          <div className="text-sm text-gray-600">Última Ação</div>
          <div className="text-sm font-medium text-gray-800">{lastAction}</div>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 text-gray-700">Ações</h3>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={addNotification}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            ➕ Adicionar Notificação
          </button>
          
          <button
            onClick={markAllAsRead}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            📚 Marcar Todas Lidas
          </button>
          
          <button
            onClick={resetAll}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            🔄 Resetar Tudo
          </button>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 text-gray-700">Lista de Notificações</h3>
        <div className="space-y-2">
          {notifications.map((notification) => (
            <div key={notification.id} className={`p-3 rounded border ${
              notification.isRead ? 'bg-gray-50 border-gray-200' : 'bg-blue-50 border-blue-200'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{notification.title}</div>
                  <div className="text-sm text-gray-600">{notification.message}</div>
                  <div className="text-xs text-gray-500">ID: {notification.id}</div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`text-xs px-2 py-1 rounded ${
                    notification.isRead ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {notification.isRead ? 'Lida' : 'Não Lida'}
                  </span>
                  <div className="flex space-x-1">
                    {!notification.isRead ? (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600"
                      >
                        ✓
                      </button>
                    ) : (
                      <button
                        onClick={() => markAsUnread(notification.id)}
                        className="bg-yellow-500 text-white px-2 py-1 rounded text-xs hover:bg-yellow-600"
                      >
                        ↺
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="text-sm text-gray-600">
        <p><strong>Como testar:</strong></p>
        <ol className="list-decimal list-inside mt-2 space-y-1">
          <li>Clique nos botões ✓ para marcar como lida</li>
          <li>Clique nos botões ↺ para marcar como não lida</li>
          <li>Observe se os números mudam na tela</li>
          <li>Verifique o console para logs detalhados</li>
          <li>Teste "Marcar Todas Lidas" e "Adicionar Notificação"</li>
        </ol>
        
        <p className="mt-3"><strong>O que deve acontecer:</strong></p>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>✅ <strong>Não Lidas</strong> deve diminuir ao marcar como lida</li>
          <li>✅ <strong>Não Lidas</strong> deve aumentar ao marcar como não lida</li>
          <li>✅ <strong>Re-renderizações</strong> deve aumentar a cada mudança</li>
          <li>✅ <strong>Console</strong> deve mostrar logs detalhados</li>
        </ul>
      </div>
    </div>
  );
};

export default SimpleNotificationTest;
