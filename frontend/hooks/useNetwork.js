import { useConfigContext } from '@/contexts/ConfigContext';

/**
 * Hook para obter a rede padrão da configuração
 */
const useNetwork = () => {
  const { config } = useConfigContext();
  
  return {
    defaultNetwork: config?.defaultNetwork,
    isMainnet: config?.defaultNetwork === 'mainnet',
    isTestnet: config?.defaultNetwork === 'testnet',
    // Utilitários
    currentChainId: config?.defaultNetwork === 'mainnet' 
      ? config?.mainnetChainId 
      : config?.testnetChainId,
    currentRpcUrl: config?.defaultNetwork === 'mainnet'
      ? config?.mainnetRpcUrl
      : config?.testnetRpcUrl,
    currentExplorerUrl: config?.defaultNetwork === 'mainnet'
      ? config?.mainnetExplorerUrl
      : config?.testnetExplorerUrl,
  };
};

export default useNetwork;