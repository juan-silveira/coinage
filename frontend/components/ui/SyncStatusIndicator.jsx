"use client";
import React from "react";
import Icon from "@/components/ui/Icon";
import Tooltip from "@/components/ui/Tooltip";

/**
 * Componente para indicar status de sincronização de saldos
 * @param {Object} syncStatus - Status da sincronização
 * @param {string} syncStatus.status - 'success', 'error', 'loading'
 * @param {string} syncStatus.error - Mensagem de erro se houver
 * @param {string} syncStatus.lastSuccessfulSync - Timestamp da última sincronização bem-sucedida
 * @param {boolean} syncStatus.fromCache - Se os dados são do cache
 * @param {string} className - Classes CSS adicionais
 */
const SyncStatusIndicator = ({ syncStatus, className = "" }) => {

  // Não mostrar se não há status ou se está sincronizado perfeitamente
  // Também não mostrar se é um backup inicial (não é um erro)
  if (!syncStatus || 
      (syncStatus.status === 'success' && !syncStatus.fromCache) ||
      (syncStatus.status === 'success' && syncStatus.fromCache && syncStatus.isBackupInitial)) {
    return null;
  }
  
  // Para loading, mostrar apenas por no máximo 10 segundos
  const shouldShowLoading = syncStatus.status === 'loading' && (
    !syncStatus.loadingStartTime || 
    Date.now() - syncStatus.loadingStartTime < 10000
  );

  const getIndicatorStyle = () => {
    // Loading inicial (primeira vez)
    if (syncStatus.status === 'loading' && shouldShowLoading && syncStatus.isInitialLoad) {
      return {
        icon: 'heroicons:arrow-path',
        containerClass: 'w-4 h-4 animate-spin text-yellow-500',
        badgeClass: null // Sem badge para loading inicial
      };
    }
    
    // Atualização em background (muito discreto)
    if (syncStatus.status === 'updating' && syncStatus.isBackgroundUpdate) {
      return {
        icon: 'heroicons:arrow-path',
        containerClass: 'w-3 h-3 animate-spin text-blue-400 opacity-60',
        badgeClass: null // Sem badge para atualização discreta
      };
    }
    
    if (syncStatus.status === 'error') {
      return {
        icon: 'heroicons:exclamation-triangle',
        containerClass: 'w-4 h-4 text-orange-500 hover:text-orange-600',
        badgeClass: 'bg-orange-500'
      };
    }
    
    // Para status success com cache (mostrar discretamente)
    if (syncStatus.fromCache) {
      return {
        icon: 'heroicons:clock',
        containerClass: 'w-4 h-4 text-blue-400 hover:text-blue-500',
        badgeClass: 'bg-blue-400'
      };
    }
    
    return null; // Não mostrar nada
  };

  const indicatorStyle = getIndicatorStyle();
  
  // Se não há estilo, não renderizar nada
  if (!indicatorStyle) {
    return null;
  }

  const formatLastSync = (timestamp) => {
    if (!timestamp) return 'Nunca';
    
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now - date;
      const diffMinutes = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMinutes / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMinutes < 1) return 'Agora mesmo';
      if (diffMinutes < 60) return `${diffMinutes}m atrás`;
      if (diffHours < 24) return `${diffHours}h atrás`;
      return `${diffDays}d atrás`;
    } catch {
      return 'Data inválida';
    }
  };

  const getTooltipContent = () => {
    if (syncStatus.status === 'loading' && shouldShowLoading && syncStatus.isInitialLoad) {
      return (
        <div className="text-sm space-y-2 max-w-xs">
          <div className="font-semibold text-gray-900 dark:text-white">
            🔄 Carregando dados...
          </div>
          <div className="text-gray-600 dark:text-gray-400 text-xs">
            🔗 Consultando a API da Azore pela primeira vez
          </div>
        </div>
      );
    }

    if (syncStatus.status === 'updating' && syncStatus.isBackgroundUpdate) {
      return (
        <div className="text-sm space-y-2 max-w-xs">
          <div className="font-semibold text-gray-900 dark:text-white">
            🔄 Atualizando dados...
          </div>
          <div className="text-gray-600 dark:text-gray-400 text-xs">
            🔗 Sincronizando com a blockchain em segundo plano
          </div>
        </div>
      );
    }

    if (syncStatus.status === 'error') {
      return (
        <div className="text-sm space-y-2 max-w-xs">
          <div className="font-semibold text-gray-900 dark:text-white">
            ⚠️ API da Azore Instável
          </div>
          
          {syncStatus.fromCache && (
            <div className="text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 p-2 rounded">
              📦 Exibindo dados salvos (última versão disponível)
            </div>
          )}
          
          {syncStatus.lastSuccessfulSync && (
            <div className="text-gray-700 dark:text-gray-300">
              🕒 <strong>Última atualização:</strong> {formatLastSync(syncStatus.lastSuccessfulSync)}
            </div>
          )}
          
          {syncStatus.syncError && (
            <div className="text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-900/30 p-2 rounded">
              ⚠️ {syncStatus.syncError}
            </div>
          )}
          
          <div className="text-gray-600 dark:text-gray-400 mt-3 pt-2 border-t border-gray-200 dark:border-gray-600 text-xs">
            💡 Os saldos podem não refletir transações muito recentes. A API será consultada novamente em breve.
          </div>
        </div>
      );
    }

    if (syncStatus.fromCache) {
      return (
        <div className="text-sm space-y-2 max-w-xs">
          <div className="font-semibold text-gray-900 dark:text-white">
            🕒 Dados em Cache
          </div>
          
          <div className="text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 p-2 rounded">
            📦 Exibindo dados salvos (última versão disponível)
          </div>
          
          {syncStatus.lastSuccessfulSync && (
            <div className="text-gray-700 dark:text-gray-300">
              🕒 <strong>Última atualização:</strong> {formatLastSync(syncStatus.lastSuccessfulSync)}
            </div>
          )}
          
          <div className="text-gray-600 dark:text-gray-400 mt-3 pt-2 border-t border-gray-200 dark:border-gray-600 text-xs">
            💡 A próxima atualização será em breve
          </div>
        </div>
      );
    }
    
    return 'Sincronizado';
  };

  return (
    <div className={`inline-flex items-center relative ${className}`}>
      <Tooltip 
        content={getTooltipContent()}
        placement="top"
        className="max-w-sm z-50"
      >
        <div className="relative inline-flex items-center">
          <Icon 
            icon={indicatorStyle.icon} 
            className={`${indicatorStyle.containerClass} transition-colors duration-200`}
          />
          {/* Badge pequeno no canto superior direito para indicar problema */}
          {indicatorStyle.badgeClass && (
            <div className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${indicatorStyle.badgeClass} animate-pulse`} />
          )}
        </div>
      </Tooltip>
    </div>
  );
};

export default SyncStatusIndicator;