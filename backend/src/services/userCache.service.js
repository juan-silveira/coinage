const prismaConfig = require('../config/prisma');
const redisService = require('./redis.service');
const blockchainService = require('./blockchain.service');
const TokenAmountService = require('./tokenAmount.service');

class UserCacheService {
  constructor() {
    this.activeSessions = new Map(); // userId -> session info
    this.refreshIntervals = new Map(); // userId -> interval ID
    this.CACHE_TTL = 300; // 5 minutos em segundos
    this.REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutos em ms
    this.prisma = null;
    this.tokenAmountService = new TokenAmountService();
  }

  /**
   * Inicializa o serviço
   */
  async initialize() {
    try {
      this.prisma = prismaConfig.getPrisma();
      console.log('✅ UserCacheService inicializado');
    } catch (error) {
      console.error('❌ Erro ao inicializar UserCacheService:', error);
      throw error;
    }
  }

  /**
   * Inicia sessão de cache para usuário (acionado no login)
   */
  async startUserSession(userId, userEmail) {
    try {
      console.log(`🚀 Iniciando sessão de cache para usuário: ${userEmail} (${userId})`);
      
      // Parar sessão anterior se existir
      this.stopUserSession(userId);

      // Marcar sessão como ativa
      this.activeSessions.set(userId, {
        email: userEmail,
        startedAt: new Date(),
        lastRefresh: new Date()
      });

      // Carregar dados iniciais
      await this.loadUserCacheData(userId);

      // Configurar refresh automático a cada 5 minutos
      const intervalId = setInterval(async () => {
        if (this.activeSessions.has(userId)) {
          console.log(`🔄 Atualizando cache automático para usuário: ${userEmail}`);
          await this.loadUserCacheData(userId);
          
          // Atualizar último refresh
          if (this.activeSessions.has(userId)) {
            this.activeSessions.get(userId).lastRefresh = new Date();
          }
        } else {
          clearInterval(intervalId);
        }
      }, this.REFRESH_INTERVAL);

      this.refreshIntervals.set(userId, intervalId);
      
      console.log(`✅ Sessão de cache iniciada para usuário: ${userEmail}`);
      return true;
    } catch (error) {
      console.error(`❌ Erro ao iniciar sessão de cache para usuário ${userId}:`, error);
      return false;
    }
  }

  /**
   * Para sessão de cache para usuário (acionado no logout ou expiração)
   */
  stopUserSession(userId) {
    try {
      if (this.refreshIntervals.has(userId)) {
        clearInterval(this.refreshIntervals.get(userId));
        this.refreshIntervals.delete(userId);
      }

      if (this.activeSessions.has(userId)) {
        const session = this.activeSessions.get(userId);
        console.log(`🛑 Parando sessão de cache para usuário: ${session.email} (${userId})`);
        this.activeSessions.delete(userId);
      }

      // Limpar cache do Redis para este usuário
      this.clearUserCache(userId);
      
      return true;
    } catch (error) {
      console.error(`❌ Erro ao parar sessão de cache para usuário ${userId}:`, error);
      return false;
    }
  }

  /**
   * Carrega dados do PostgreSQL e Blockchain para o cache Redis
   */
  async loadUserCacheData(userId) {
    try {
      console.log(`📦 [UserCacheService] loadUserCacheData iniciado para usuário: ${userId}`);
      
      if (!this.prisma) await this.initialize();

      // 1. Carregar dados do PostgreSQL
      console.log(`📊 [UserCacheService] Carregando dados PostgreSQL...`);
      const postgresData = await this.loadPostgresData(userId);
      console.log(`✅ [UserCacheService] Dados PostgreSQL carregados. PublicKey: ${postgresData.user.publicKey}`);
      
      // 2. Carregar dados da Blockchain
      console.log(`🔗 [UserCacheService] Iniciando carregamento blockchain...`);
      const blockchainData = await this.loadBlockchainData(postgresData.user.publicKey);
      console.log(`✅ [UserCacheService] Dados blockchain carregados:`, blockchainData);
      
      // 3. Detectar mudanças nos saldos e criar notificações
      if (blockchainData.balancesTable) {
        await this.tokenAmountService.detectBalanceChanges(userId, blockchainData, postgresData.user.publicKey);
      }
      
      // 4. Combinar dados
      const combinedData = {
        postgres: postgresData,
        blockchain: blockchainData,
        lastUpdated: new Date().toISOString(),
        cacheVersion: '1.0'
      };

      // 5. Salvar no Redis
      await this.saveToCache(userId, combinedData);
      
      console.log(`✅ Cache atualizado para usuário: ${postgresData.email || userId}`);
      return combinedData;
    } catch (error) {
      console.error(`❌ Erro ao carregar dados do cache para usuário ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Carrega dados do PostgreSQL usando Prisma
   */
  async loadPostgresData(userId) {
    try {
      // Buscar dados do usuário
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          apiKeys: {
            where: { isActive: true },
            select: {
              id: true,
              name: true,
              description: true,
              isActive: true,
              expiresAt: true,
              lastUsedAt: true,
              createdAt: true
            }
          },
          userClients: {
            where: { status: 'active' },
            include: {
              client: {
                select: {
                  id: true,
                  name: true,
                  isActive: true
                }
              }
            }
          },
          userTwoFactors: {
            where: { isActive: true },
            select: {
              id: true,
              type: true,
              isActive: true,
              isVerified: true,
              lastUsedAt: true
            }
          }
        }
      });

      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      // Buscar transações recentes
      const recentTransactions = await this.prisma.transaction.findMany({
        where: { 
          userId: userId,
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Últimos 30 dias
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          contract: {
            select: {
              name: true,
              address: true
            }
          }
        }
      });

      // Buscar logs de requisições recentes
      const recentRequestLogs = await this.prisma.requestLog.findMany({
        where: { 
          userId: userId,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Últimos 7 dias
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 100
      });

      // Estatísticas do usuário
      const userStats = {
        totalTransactions: await this.prisma.transaction.count({
          where: { userId }
        }),
        totalApiKeys: await this.prisma.apiKey.count({
          where: { userId, isActive: true }
        }),
        totalClients: user.userClients.length,
        twoFactorEnabled: user.userTwoFactors.length > 0
      };

      // Remover dados sensíveis
      const { password, privateKey, ...sanitizedUser } = user;

      return {
        user: sanitizedUser,
        transactions: recentTransactions,
        requestLogs: recentRequestLogs,
        stats: userStats,
        loadedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error(`❌ Erro ao carregar dados PostgreSQL para usuário ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Carrega dados da Blockchain
   */
  async loadBlockchainData(publicKey) {
    try {
      console.log(`🔍 [UserCacheService] loadBlockchainData chamado com publicKey: ${publicKey}`);
      
      if (!publicKey) {
        console.log('⚠️ [UserCacheService] publicKey é null/undefined, retornando dados vazios');
        return {
          balances: {},
          tokenBalances: [],
          network: 'testnet',
          totalTokens: 0,
          loadedAt: new Date().toISOString()
        };
      }

      console.log(`🚀 [UserCacheService] Chamando blockchainService.getUserBalances(${publicKey})`);
      // Usar o serviço blockchain existente
      const balanceData = await blockchainService.getUserBalances(publicKey);
      console.log(`✅ [UserCacheService] Dados recebidos do blockchainService:`, balanceData);
      
      // Calcular categorias para o dashboard
      const categories = this.calculateCategories(balanceData);
      
      return {
        ...balanceData,
        categories,
        loadedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error(`❌ Erro ao carregar dados blockchain para ${publicKey}:`, error);
      return {
        balances: {},
        tokenBalances: [],
        network: 'testnet',
        totalTokens: 0,
        error: error.message,
        loadedAt: new Date().toISOString()
      };
    }
  }

  /**
   * Calcula valores por categoria para o dashboard
   */
  calculateCategories(balanceData) {
    try {
      // Mapeamento de tokens por categoria (igual ao frontend)
      const tokenCategories = {
        cryptocurrencies: ['AZE', 'AZE-t'], // cBRL não vai aqui conforme solicitado
        startups: ['CNT'],
        utility: ['MJD'],
        digital: ['PCN']
      };

      // Preços dos tokens em BRL (mock - será substituído por dados reais)
      const tokenPrices = {
        'AZE': 1.00,
        'AZE-t': 1.00,
        'cBRL': 1.00,
        'CNT': 1.00,
        'MJD': 1.00,
        'PCN': 1.00
      };

      const categories = {};
      let totalPortfolio = 0;
      let availableBalance = 0; // cBRL

      // Calcular cBRL disponível (não vai em nenhuma categoria do gráfico)
      if (balanceData.balancesTable && balanceData.balancesTable['cBRL']) {
        availableBalance = parseFloat(balanceData.balancesTable['cBRL']) || 0;
        totalPortfolio += availableBalance;
      }

      // Processar cada categoria
      Object.entries(tokenCategories).forEach(([categoryKey, tokens]) => {
        let categoryTotal = 0;

        tokens.forEach(symbol => {
          let balance = 0;
          
          // Buscar balance na tabela de balances
          if (balanceData.balancesTable && balanceData.balancesTable[symbol]) {
            balance = parseFloat(balanceData.balancesTable[symbol]) || 0;
          }
          
          // Calcular valor em BRL
          const price = tokenPrices[symbol] || 1.00;
          const valueBRL = balance * price;
          
          categoryTotal += valueBRL;
        });

        categories[categoryKey] = {
          name: this.getCategoryDisplayName(categoryKey),
          value: categoryTotal,
          tokens: tokens
        };

        totalPortfolio += categoryTotal;
      });

      return {
        categories,
        availableBalance, // cBRL
        totalPortfolio,
        totalInvested: totalPortfolio - availableBalance, // Soma das categorias
        projectedBalance: 0, // Para implementar com stake
        totalInOrder: 0 // Para implementar com livro de ofertas
      };
    } catch (error) {
      console.error('❌ Erro ao calcular categorias:', error);
      return {
        categories: {},
        availableBalance: 0,
        totalPortfolio: 0,
        totalInvested: 0,
        projectedBalance: 0,
        totalInOrder: 0
      };
    }
  }

  /**
   * Retorna nome de exibição da categoria
   */
  getCategoryDisplayName(categoryKey) {
    const displayNames = {
      cryptocurrencies: 'Criptomoedas',
      startups: 'Startups', 
      utility: 'Utility Tokens',
      digital: 'Renda Digital'
    };
    return displayNames[categoryKey] || categoryKey;
  }



  /**
   * Salva dados no cache Redis
   */
  async saveToCache(userId, data) {
    try {
      if (!redisService.isConnected || !redisService.client) {
        console.warn('⚠️ Redis não conectado, ignorando cache');
        return false;
      }

      const cacheKey = `user_cache:${userId}`;
      await redisService.client.setEx(cacheKey, this.CACHE_TTL, JSON.stringify(data));
      
      // Salvar também chaves específicas para acesso rápido
      await redisService.client.setEx(`user_postgres:${userId}`, this.CACHE_TTL, JSON.stringify(data.postgres));
      await redisService.client.setEx(`user_blockchain:${userId}`, this.CACHE_TTL, JSON.stringify(data.blockchain));
      
      return true;
    } catch (error) {
      console.error(`❌ Erro ao salvar cache para usuário ${userId}:`, error);
      return false;
    }
  }

  /**
   * Busca dados do cache Redis
   */
  async getCachedData(userId, dataType = 'all') {
    try {
      if (!redisService.isConnected || !redisService.client) {
        console.warn('⚠️ Redis não conectado, cache indisponível');
        return null;
      }

      let cacheKey;
      switch (dataType) {
        case 'postgres':
          cacheKey = `user_postgres:${userId}`;
          break;
        case 'blockchain':
          cacheKey = `user_blockchain:${userId}`;
          break;
        default:
          cacheKey = `user_cache:${userId}`;
      }

      const cachedData = await redisService.client.get(cacheKey);
      if (cachedData) {
        return JSON.parse(cachedData);
      }
      
      return null;
    } catch (error) {
      console.error(`❌ Erro ao buscar cache para usuário ${userId}:`, error);
      return null;
    }
  }

  /**
   * Limpa cache do usuário
   */
  async clearUserCache(userId) {
    try {
      if (!redisService.isConnected || !redisService.client) {
        console.warn('⚠️ Redis não conectado, ignorando limpeza de cache');
        return false;
      }

      const cacheKeys = [
        `user_cache:${userId}`,
        `user_postgres:${userId}`,
        `user_blockchain:${userId}`
      ];

      if (cacheKeys.length > 0) {
        await redisService.client.del(cacheKeys);
      }
      
      console.log(`🗑️ Cache limpo para usuário: ${userId}`);
      return true;
    } catch (error) {
      console.error(`❌ Erro ao limpar cache para usuário ${userId}:`, error);
      return false;
    }
  }

  /**
   * Força atualização do cache (após ações que modificam dados)
   */
  async refreshUserCache(userId) {
    try {
      if (this.activeSessions.has(userId)) {
        console.log(`🔄 Forçando atualização de cache para usuário: ${userId}`);
        await this.loadUserCacheData(userId);
        
        // Atualizar timestamp de último refresh
        this.activeSessions.get(userId).lastRefresh = new Date();
        return true;
      } else {
        console.log(`⚠️ Usuário ${userId} não tem sessão ativa, ignorando refresh`);
        return false;
      }
    } catch (error) {
      console.error(`❌ Erro ao forçar refresh do cache para usuário ${userId}:`, error);
      return false;
    }
  }

  /**
   * Verifica se usuário tem sessão ativa
   */
  isSessionActive(userId) {
    return this.activeSessions.has(userId);
  }

  /**
   * Lista sessões ativas (para debug/monitoramento)
   */
  getActiveSessions() {
    const sessions = [];
    for (const [userId, sessionData] of this.activeSessions) {
      sessions.push({
        userId,
        email: sessionData.email,
        startedAt: sessionData.startedAt,
        lastRefresh: sessionData.lastRefresh,
        duration: Date.now() - sessionData.startedAt.getTime()
      });
    }
    return sessions;
  }

  /**
   * Limpa todas as sessões (para reinicialização do serviço)
   */
  clearAllSessions() {
    console.log('🧹 Limpando todas as sessões de cache...');
    
    // Parar todos os intervals
    for (const intervalId of this.refreshIntervals.values()) {
      clearInterval(intervalId);
    }
    
    // Limpar maps
    this.refreshIntervals.clear();
    this.activeSessions.clear();
    
    console.log('✅ Todas as sessões de cache foram limpas');
  }

  /**
   * Testa o serviço
   */
  async testService() {
    try {
      const testData = {
        test: true,
        timestamp: new Date().toISOString()
      };

      // Teste de escrita e leitura no Redis
      if (!redisService.isConnected || !redisService.client) {
        throw new Error('Redis não está conectado');
      }
      
      await redisService.client.setEx('test_cache', 60, JSON.stringify(testData));
      const retrieved = await redisService.client.get('test_cache');
      await redisService.client.del('test_cache');

      const isWorking = retrieved && JSON.parse(retrieved).test === true;

      return {
        success: isWorking,
        message: isWorking ? 'UserCacheService funcionando corretamente' : 'Erro no teste do Redis',
        activeSessions: this.activeSessions.size,
        activeIntervals: this.refreshIntervals.size,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        message: 'Erro no UserCacheService',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Singleton instance
const userCacheService = new UserCacheService();

// Graceful shutdown - limpar sessões ao encerrar processo
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM recebido, limpando sessões de cache...');
  userCacheService.clearAllSessions();
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT recebido, limpando sessões de cache...');
  userCacheService.clearAllSessions();
});

module.exports = userCacheService;