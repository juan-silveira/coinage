/**
 * Componente para mostrar status do sistema de backup de balances
 * Ajuda usuário a entender de onde vêm os saldos exibidos
 */

import React, { useState, useEffect } from 'react';
import balanceBackupService from '@/services/balanceBackupService';
import useAuthStore from '@/store/authStore';

const BackupStatusIndicator = () => {
  const [status, setStatus] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const user = useAuthStore(state => state.user);

  useEffect(() => {
    const checkStatus = async () => {
      if (!user?.id) return;
      
      try {
        const diagnostic = await balanceBackupService.getDiagnostic(user.id);
        setStatus(diagnostic);
      } catch (error) {
        console.error('Erro ao obter diagnóstico de backup:', error);
      }
    };

    checkStatus();
    
    // Verificar a cada 5 segundos para ser mais responsivo
    const interval = setInterval(checkStatus, 5000);
    
    // Listener para atualizações de backup
    const handleStorageChange = () => {
      setTimeout(checkStatus, 100); // Pequeno delay para garantir que o storage foi atualizado
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Verificar também quando a página ganha foco
    window.addEventListener('focus', checkStatus);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', checkStatus);
    };
  }, [user?.id]);

  if (!status) return null;

  const getStatusColor = () => {
    if (status.isUsingEmergency) return 'text-amber-600 bg-amber-50';
    if (status.hasSession || status.hasLocal) return 'text-green-600 bg-green-50';
    if (status.hasLastKnown || status.hasIndexedDB) return 'text-blue-600 bg-blue-50';
    return 'text-gray-600 bg-gray-50';
  };

  const getStatusIcon = () => {
    if (status.isUsingEmergency) return '🚨';
    if (status.hasSession || status.hasLocal) return '✅';
    if (status.hasLastKnown || status.hasIndexedDB) return '📦';
    return '⚠️';
  };

  const getStatusText = () => {
    if (status.isUsingEmergency) return 'Modo Emergência';
    if (status.hasSession) return 'Dados da Sessão';
    if (status.hasLocal) return 'Backup Local';
    if (status.hasLastKnown) return 'Último Conhecido';
    if (status.hasIndexedDB) return 'Banco Local';
    return 'Sem Backup';
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div 
        className={`px-3 py-2 rounded-lg shadow-lg cursor-pointer transition-all ${getStatusColor()}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-2">
          <span className="text-lg">{getStatusIcon()}</span>
          <span className="text-sm font-medium">{getStatusText()}</span>
        </div>
      </div>

      {isExpanded && (
        <div className="absolute bottom-16 right-0 bg-white border border-gray-200 rounded-lg shadow-xl p-4 min-w-[300px]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800">Status do Sistema de Backup</h3>
            <button 
              onClick={async () => {
                if (user?.id) {
                  const diagnostic = await balanceBackupService.getDiagnostic(user.id);
                  setStatus(diagnostic);
                }
              }}
              className="text-blue-500 hover:text-blue-700 text-sm"
              title="Atualizar status"
            >
              🔄
            </button>
          </div>
          
          <div className="space-y-2">
            <div className={`flex items-center justify-between ${status.hasSession ? 'text-green-600' : 'text-gray-400'}`}>
              <span>Session Storage</span>
              <span>{status.hasSession ? '✅' : '❌'}</span>
            </div>
            
            <div className={`flex items-center justify-between ${status.hasLocal ? 'text-green-600' : 'text-gray-400'}`}>
              <span>Local Storage</span>
              <span>{status.hasLocal ? '✅' : '❌'}</span>
            </div>
            
            <div className={`flex items-center justify-between ${status.hasLastKnown ? 'text-blue-600' : 'text-gray-400'}`}>
              <span>Último Conhecido</span>
              <span>{status.hasLastKnown ? '📦' : '❌'}</span>
            </div>
            
            <div className={`flex items-center justify-between ${status.hasIndexedDB ? 'text-blue-600' : 'text-gray-400'}`}>
              <span>IndexedDB</span>
              <span>{status.hasIndexedDB ? '📦' : '❌'}</span>
            </div>
            
            <div className={`flex items-center justify-between ${status.emergencyAlwaysAvailable ? 'text-green-600' : 'text-gray-400'}`}>
              <span>Valores Emergência</span>
              <span>🚨 Sempre</span>
            </div>
          </div>
          
          {status.isUsingEmergency && (
            <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded text-amber-700 text-sm">
              <strong>Atenção:</strong> Sistema está usando valores de emergência. 
              Verifique sua conexão.
            </div>
          )}
          
          <div className="mt-3 text-xs text-gray-500">
            Os saldos nunca aparecerão como 0 graças ao sistema de backup robusto.
          </div>
        </div>
      )}
    </div>
  );
};

export default BackupStatusIndicator;