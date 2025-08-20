/**
 * Controller para configurações públicas da aplicação
 */

const redisService = require('../services/redis.service');

console.log('🔧 [Config] Config controller loaded');

const CONFIG_CACHE_KEY = 'app:public-config';
const CONFIG_CACHE_TTL = 300; // 5 minutos

/**
 * Obter configurações públicas da aplicação
 */
const getPublicConfig = async (req, res) => {
  try {
    // Tentar buscar do Redis primeiro
    let config = null;
    
    try {
      if (redisService && redisService.isConnected) {
        const cached = await redisService.get(CONFIG_CACHE_KEY);
        if (cached) {
          console.log('✅ [Config] Configurações obtidas do Redis cache');
          config = JSON.parse(cached);
        }
      }
    } catch (redisError) {
      console.warn('⚠️ [Config] Redis não disponível, gerando configurações:', redisError.message);
    }

    // Se não encontrou no cache, gerar e cachear
    if (!config) {
      console.log('🔧 [Config] Gerando configurações do .env');
      
      config = {
        defaultNetwork: process.env.DEFAULT_NETWORK || 'testnet',
        mainnetRpcUrl: process.env.MAINNET_RPC_URL,
        testnetRpcUrl: process.env.TESTNET_RPC_URL,
        mainnetChainId: parseInt(process.env.MAINNET_CHAIN_ID) || 8800,
        testnetChainId: parseInt(process.env.TESTNET_CHAIN_ID) || 88001,
        mainnetExplorerUrl: process.env.MAINNET_EXPLORER_URL,
        testnetExplorerUrl: process.env.TESTNET_EXPLORER_URL,
      };

      // Salvar no Redis
      try {
        if (redisService && redisService.isConnected) {
          await redisService.setWithExpiry(CONFIG_CACHE_KEY, JSON.stringify(config), CONFIG_CACHE_TTL);
          console.log('✅ [Config] Configurações salvas no Redis cache');
        }
      } catch (redisError) {
        console.warn('⚠️ [Config] Falha ao salvar no Redis:', redisError.message);
      }
    }
    
    console.log('✅ [Config] Configurações enviadas:', config);

    res.json({
      success: true,
      data: config,
      message: 'Configurações obtidas com sucesso'
    });
  } catch (error) {
    console.error('❌ [Config] Erro ao obter configurações:', error);
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