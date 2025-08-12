import React, { useState, useEffect } from "react";
import Dropdown from "@/components/ui/Dropdown";
import Icon from "@/components/ui/Icon";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import useIntegratedBalanceSync from "@/hooks/useIntegratedBalanceSync";
import { cn } from "@/lib/utils";

const BalanceSyncDropdown = () => {
  
  const integratedData = useIntegratedBalanceSync();
  
  const {
    lastSync,
    syncError,
    balanceChanges,
    clearChanges,
    formatLastSync,
  } = integratedData.sync;
  
  // Debug: Log do estado atual
  useEffect(() => {
    // Estado silencioso - sem logs
  }, [integratedData]);

  const [dropdownOpen, setDropdownOpen] = useState(false);

  const recentChanges = balanceChanges.slice(-5).reverse(); // Últimas 5 mudanças

  const formatChangeType = (type) => {
    switch (type) {
      case 'increase':
        return { icon: 'heroicons:arrow-trending-up', color: 'text-green-500', label: 'Aumento' };
      case 'decrease':
        return { icon: 'heroicons:arrow-trending-down', color: 'text-red-500', label: 'Redução' };
      case 'new_token':
        return { icon: 'heroicons:plus-circle', color: 'text-blue-500', label: 'Novo Token' };
      default:
        return { icon: 'heroicons:minus', color: 'text-gray-500', label: 'Mudança' };
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins}m atrás`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h atrás`;
    return date.toLocaleDateString('pt-BR');
  };

  const getSyncStatusColor = () => {
    if (syncError) return 'text-red-500';
    return 'text-green-500'; // Sempre verde (sempre ativo)
  };

  const getSyncStatusIcon = () => {
    if (syncError) return 'heroicons:exclamation-triangle';
    return 'heroicons:arrow-path'; // Sempre sincronizando
  };

  return (
    <Dropdown
      classMenuItems="md:w-[360px] top-[58px]"
      label={
        <div className="relative flex items-center">
          <div 
            className="relative flex items-center justify-center w-8 h-8 rounded-full transition-colors bg-success-500/10 hover:bg-success-500/20"
          >
            <Icon 
              icon={getSyncStatusIcon()} 
              className={cn("w-4 h-4", getSyncStatusColor(), "animate-spin")} 
            />
          </div>
          {balanceChanges.length > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 min-w-[18px] h-[18px] text-xs flex items-center justify-center p-0"
              color="warning"
            >
              {balanceChanges.length > 99 ? '99+' : balanceChanges.length}
            </Badge>
          )}
        </div>
      }
      className="md:block hidden"
    >
      <div className="flex flex-col space-y-3 p-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
          <div>
            <h6 className="font-medium text-slate-600 dark:text-slate-300">
              Sincronização de Saldos
            </h6>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Última: {formatLastSync()}
            </p>
          </div>
          <div className={cn("flex items-center space-x-1", getSyncStatusColor())}>
            <Icon icon={getSyncStatusIcon()} className="w-4 h-4" />
            <span className="text-xs font-medium">
              Sempre Ativo
            </span>
          </div>
        </div>

        {/* Error Message */}
        {syncError && (
          <div className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-xs text-red-600 dark:text-red-400">
              Erro: {syncError}
            </p>
          </div>
        )}

        {/* Status Info - Auto-sync sempre ativo */}
        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
          <div className="flex items-center space-x-2">
            <Icon 
              icon="heroicons:arrow-path" 
              className="w-4 h-4 text-green-500 animate-spin" 
            />
            <p className="text-sm font-medium text-green-700 dark:text-green-400">
              Sincronização Automática Ativa
            </p>
          </div>
          <p className="text-xs text-green-600 dark:text-green-400 mt-1">
            Verificando mudanças automaticamente a cada 1 minuto
          </p>
        </div>

        {/* Recent Changes */}
        {recentChanges.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h6 className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Mudanças Recentes
              </h6>
              <Button
                size="sm"
                color="light"
                onClick={clearChanges}
                className="text-xs px-2 py-1 h-6"
              >
                Limpar
              </Button>
            </div>
            
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {recentChanges.map((change, index) => {
                const typeInfo = formatChangeType(change.type);
                return (
                  <div
                    key={index}
                    className="flex items-center space-x-3 p-2 bg-slate-50 dark:bg-slate-700/50 rounded-md"
                  >
                    <div className={cn("flex items-center justify-center w-6 h-6 rounded-full", typeInfo.color)}>
                      <Icon icon={typeInfo.icon} className="w-3 h-3" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                          {change.token}
                        </p>
                        <span className="text-xs text-slate-500 dark:text-slate-400 flex-shrink-0 ml-2">
                          {formatTimestamp(change.timestamp)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <p className={cn("text-xs font-mono", typeInfo.color)}>
                          {change.type === 'increase' && '+'}
                          {change.difference}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                          = {change.newBalance}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {balanceChanges.length > 5 && (
              <div className="text-center mt-2">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  +{balanceChanges.length - 5} mais mudanças
                </p>
              </div>
            )}
          </div>
        )}

        {/* No Changes Message */}
        {balanceChanges.length === 0 && (
          <div className="text-center py-4">
            <Icon 
              icon="heroicons:chart-bar-square" 
              className="w-8 h-8 mx-auto text-slate-400 dark:text-slate-500 mb-2" 
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Nenhuma mudança detectada
            </p>
          </div>
        )}

        {/* Info */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
            Sistema sempre ativo - detecta mudanças automaticamente
          </p>
        </div>
      </div>
    </Dropdown>
  );
};

export default BalanceSyncDropdown;