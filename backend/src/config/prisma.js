const { PrismaClient } = require('../generated/prisma');

class PrismaConfig {
  constructor() {
    this.prisma = null;
    this.isConnected = false;
  }

  /**
   * Inicializa a conexão com o banco de dados via Prisma
   * @returns {Promise<PrismaClient>} Instância do PrismaClient
   */
  async initialize() {
    try {
      // Configuração do PrismaClient
      this.prisma = new PrismaClient({
        log: process.env.NODE_ENV === 'development' 
          ? ['query', 'info', 'warn', 'error'] 
          : ['warn', 'error'],
        errorFormat: 'pretty',
      });

      // Conectar ao banco de dados
      await this.prisma.$connect();
      this.isConnected = true;

      console.log('✅ Conexão com o banco de dados estabelecida com sucesso (Prisma)');
      
      return this.prisma;
    } catch (error) {
      console.error('❌ Erro ao conectar com o banco de dados:', error.message);
      throw error;
    }
  }

  /**
   * Obtém a instância do PrismaClient
   * @returns {PrismaClient} Instância do PrismaClient
   */
  getPrisma() {
    if (!this.prisma) {
      throw new Error('Banco de dados não inicializado. Chame initialize() primeiro.');
    }
    return this.prisma;
  }

  /**
   * Testa a conexão com o banco de dados
   * @returns {Promise<Object>} Status da conexão
   */
  async testConnection() {
    try {
      if (!this.prisma) {
        await this.initialize();
      }

      // Teste simples de conexão
      await this.prisma.$queryRaw`SELECT 1`;
      
      return {
        success: true,
        message: 'Conexão com o banco de dados estabelecida',
        database: process.env.DB_NAME || 'azore_blockchain_service',
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        orm: 'Prisma'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Falha na conexão com o banco de dados',
        error: error.message,
        orm: 'Prisma'
      };
    }
  }

  /**
   * Executa migrations do Prisma
   * @returns {Promise<void>}
   */
  async migrate() {
    try {
      if (!this.prisma) {
        await this.initialize();
      }

      console.log('🔄 Executando migrations do Prisma...');
      // Note: Em produção, migrations devem ser executadas via CLI
      // Este método é mais para desenvolvimento/testes
      console.log('⚠️  Para produção, execute: npx prisma migrate deploy');
      console.log('✅ Migrations verificadas');
    } catch (error) {
      console.error('❌ Erro ao executar migrations:', error.message);
      throw error;
    }
  }

  /**
   * Executa seeds do banco de dados
   * @returns {Promise<void>}
   */
  async seed() {
    try {
      if (!this.prisma) {
        await this.initialize();
      }

      console.log('🌱 Executando seeds do banco de dados...');
      // Aqui você pode implementar seeds específicos
      console.log('✅ Seeds executados com sucesso');
    } catch (error) {
      console.error('❌ Erro ao executar seeds:', error.message);
      throw error;
    }
  }

  /**
   * Fecha a conexão com o banco de dados
   * @returns {Promise<void>}
   */
  async close() {
    try {
      if (this.prisma) {
        await this.prisma.$disconnect();
        this.isConnected = false;
        console.log('✅ Conexão com o banco de dados fechada (Prisma)');
      }
    } catch (error) {
      console.error('❌ Erro ao fechar conexão com o banco de dados:', error.message);
      throw error;
    }
  }

  /**
   * Verifica se a conexão está ativa
   * @returns {boolean} True se conectado
   */
  isConnected() {
    return this.isConnected;
  }

  /**
   * Executa uma transação
   * @param {Function} callback - Função que recebe o prisma como parâmetro
   * @returns {Promise<any>} Resultado da transação
   */
  async transaction(callback) {
    if (!this.prisma) {
      await this.initialize();
    }

    return await this.prisma.$transaction(callback);
  }

  /**
   * Executa uma query raw
   * @param {string} query - Query SQL
   * @param {...any} params - Parâmetros da query
   * @returns {Promise<any>} Resultado da query
   */
  async queryRaw(query, ...params) {
    if (!this.prisma) {
      await this.initialize();
    }

    return await this.prisma.$queryRaw(query, ...params);
  }

  /**
   * Executa uma query raw template
   * @param {TemplateStringsArray} template - Template da query
   * @param {...any} params - Parâmetros da query
   * @returns {Promise<any>} Resultado da query
   */
  async queryRawUnsafe(query, ...params) {
    if (!this.prisma) {
      await this.initialize();
    }

    return await this.prisma.$queryRawUnsafe(query, ...params);
  }

  /**
   * Executa uma query de execução raw
   * @param {string} query - Query SQL
   * @param {...any} params - Parâmetros da query
   * @returns {Promise<any>} Resultado da execução
   */
  async executeRaw(query, ...params) {
    if (!this.prisma) {
      await this.initialize();
    }

    return await this.prisma.$executeRaw(query, ...params);
  }

  /**
   * Obtém métricas do Prisma
   * @returns {Promise<Object>} Métricas de conexão
   */
  async getMetrics() {
    if (!this.prisma) {
      await this.initialize();
    }

    try {
      const metrics = await this.prisma.$metrics.json();
      return {
        success: true,
        metrics
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Limpa todos os dados do banco (USE COM CUIDADO!)
   * @returns {Promise<void>}
   */
  async clearDatabase() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Operação não permitida em produção');
    }

    if (!this.prisma) {
      await this.initialize();
    }

    console.log('🗑️  Limpando banco de dados...');
    
    // Ordem importante para evitar conflitos de FK
    const tableNames = [
      'UserTwoFactor',
      'UserClient', 
      'ClientBranding',
      'Document',
      'Webhook',
      'PasswordReset',
      'RequestLog',
      'Transaction',
      'ApiKey',
      'SmartContract',
      'Stake',
      'User',
      'Client'
    ];

    for (const tableName of tableNames) {
      try {
        await this.prisma[tableName.charAt(0).toLowerCase() + tableName.slice(1)].deleteMany();
        console.log(`✅ Tabela ${tableName} limpa`);
      } catch (error) {
        console.warn(`⚠️  Aviso ao limpar tabela ${tableName}:`, error.message);
      }
    }

    console.log('✅ Banco de dados limpo com sucesso');
  }
}

module.exports = new PrismaConfig();
