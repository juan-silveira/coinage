/**
 * Controller para configurações públicas da aplicação
 */

console.log('🔧 [Config] Config controller loaded');

/**
 * Obter configurações públicas da aplicação
 */
const getPublicConfig = async (req, res) => {
  try {
    console.log('🔧🔧🔧 [Config] Controller called! Environment variables:', {
      MAINNET_EXPLORER_URL: process.env.MAINNET_EXPLORER_URL,
      TESTNET_EXPLORER_URL: process.env.TESTNET_EXPLORER_URL,
      DEFAULT_NETWORK: process.env.DEFAULT_NETWORK
    });
    
    const config = {
      defaultNetwork: process.env.DEFAULT_NETWORK || 'testnet',
      mainnetRpcUrl: process.env.MAINNET_RPC_URL,
      testnetRpcUrl: process.env.TESTNET_RPC_URL,
      mainnetChainId: parseInt(process.env.MAINNET_CHAIN_ID) || 8800,
      testnetChainId: parseInt(process.env.TESTNET_CHAIN_ID) || 88001,
      mainnetExplorerUrl: process.env.MAINNET_EXPLORER_URL,
      testnetExplorerUrl: process.env.TESTNET_EXPLORER_URL,
    };
    
    console.log('🔧🔧🔧 [Config] Generated config:', config);

    res.json({
      success: true,
      data: config,
      message: 'Configurações obtidas com sucesso'
    });
  } catch (error) {
    console.error('Erro ao obter configurações:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message,
    });
  }
};

module.exports = {
  getPublicConfig,
};