"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { configService } from '@/services/api';

const ConfigContext = createContext();

export function ConfigProvider({ children }) {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        console.log('🔧 [ConfigProvider] Carregando configurações do backend...');
        const response = await configService.getPublicConfig();
        
        if (response.success) {
          setConfig(response.data);
          console.log('✅ [ConfigProvider] Configurações carregadas:', response.data);
        } else {
          throw new Error(response.message || 'Erro ao carregar configurações');
        }
      } catch (err) {
        console.error('❌ [ConfigProvider] Erro ao carregar configurações:', err);
        setError(err.message);
        // NÃO usar fallback - aplicação deve falhar se backend não responder
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, []);

  // NÃO renderizar filhos até configuração estar carregada
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Carregando configurações...</p>
        </div>
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500 mb-4">Erro ao carregar configurações do servidor</p>
          <p className="text-sm text-gray-500">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <ConfigContext.Provider value={{ config, loading: false, error: null }}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfigContext() {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfigContext deve ser usado dentro de ConfigProvider');
  }
  return context;
}