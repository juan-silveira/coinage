import { useState, useEffect } from 'react';
import { configService } from '@/services/api';

/**
 * Hook para gerenciar configurações da aplicação
 */
const useConfig = () => {
  const [config, setConfig] = useState({
    defaultNetwork: 'mainnet', // Valor padrão fallback
    mainnetRpcUrl: 'https://rpc-mainnet.azore.technology',
    testnetRpcUrl: 'https://rpc-testnet.azore.technology',
    mainnetChainId: 8800,
    testnetChainId: 88001,
    mainnetExplorerUrl: 'https://azorescan.com/api',
    testnetExplorerUrl: 'https://floripa.azorescan.com/api',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Função para buscar configurações do servidor
  const fetchConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await configService.getPublicConfig();
      
      if (response.success) {
        setConfig(response.data);
        // console.log('✅ [useConfig] Configurações carregadas:', response.data);
        // console.log('🔧 [DEBUG] defaultNetwork configurado:', response.data.defaultNetwork);
      } else {
        throw new Error(response.message || 'Erro ao carregar configurações');
      }
    } catch (err) {
      console.error('❌ [useConfig] Erro ao carregar configurações:', err);
      setError(err.message);
      // Manter valores padrão em caso de erro
    } finally {
      setLoading(false);
    }
  };

  // Carregar configurações na montagem do componente
  useEffect(() => {
    fetchConfig();
  }, []);

  // Função para recarregar configurações
  const refetch = () => {
    fetchConfig();
  };

  return {
    config,
    loading,
    error,
    refetch,
    // Utilitários
    defaultNetwork: config.defaultNetwork,
    isMainnet: config.defaultNetwork === 'mainnet',
    isTestnet: config.defaultNetwork === 'testnet',
    currentChainId: config.defaultNetwork === 'mainnet' 
      ? config.mainnetChainId 
      : config.testnetChainId,
    currentRpcUrl: config.defaultNetwork === 'mainnet'
      ? config.mainnetRpcUrl
      : config.testnetRpcUrl,
    currentExplorerUrl: config.defaultNetwork === 'mainnet'
      ? config.mainnetExplorerUrl
      : config.testnetExplorerUrl,
  };
};

export default useConfig;