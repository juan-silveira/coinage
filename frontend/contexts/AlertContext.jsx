"use client";
import React, { createContext, useContext } from 'react';
import useAlert from '@/hooks/useAlert';
import AlertContainer from '@/components/ui/AlertContainer';

const AlertContext = createContext();

export const useAlertContext = () => {
  const context = useContext(AlertContext);
  if (!context) {
    console.warn('useAlertContext deve ser usado dentro de AlertProvider');
    // Retornar funções vazias como fallback
    return {
      showSuccess: () => {},
      showError: () => {},
      showWarning: () => {},
      showInfo: () => {},
      addAlert: () => {},
      removeAlert: () => {},
      clearAlerts: () => {}
    };
  }
  return context;
};

export const AlertProvider = ({ children }) => {
  const alertMethods = useAlert();

  return (
    <AlertContext.Provider value={alertMethods}>
      {children}
      <AlertContainer 
        alerts={alertMethods.alerts} 
        onRemove={alertMethods.removeAlert}
      />
    </AlertContext.Provider>
  );
};