import { useCallback } from 'react';
import useCacheData from './useCacheData';
import useToast from './useToast';

// Evento personalizado para notificar componente de notificações
const triggerNotificationRefresh = () => {
  const event = new CustomEvent('refreshNotifications');
  window.dispatchEvent(event);
};

const useIntegratedBalanceSync = () => {
  const { showSuccess } = useToast();
  
  // Hook de cache de dados existente (agora com auto-sync melhorado)
  const cacheData = useCacheData();
  
  return {
    // Dados do cache (para compatibilidade)
    ...cacheData,
    
    // Controles de sincronização simplificados (sempre ativo)
    sync: {
      isActive: true, // Sempre ativo agora
      lastSync: new Date().toISOString(),
      syncError: null,
      balanceChanges: [], // Vazio por enquanto - foco no auto-sync
      
      // Ações simplificadas
      startSync: () => {
        showSuccess('🔄 Sistema de sincronização automática sempre ativo');
      },
      stopSync: () => {
        console.error('🔄 Auto-sync não pode ser parado - sempre ativo');
      },
      syncNow: () => cacheData.reloadData(),
      clearChanges: () => {
        console.error('🔄 Limpeza de mudanças - sistema sempre ativo');
      },
      formatLastSync: () => 'Sistema sempre ativo',
    },
    
    // Função manual para forçar reload completo
    forceReload: async () => {
      try {
        await cacheData.reloadData();
      } catch (error) {
        console.error('❌ [IntegratedSync] Erro no force reload:', error);
      }
    }
  };
};

export default useIntegratedBalanceSync;