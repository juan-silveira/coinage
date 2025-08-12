/**
 * Script para zerar o banco de dados e carregar dados iniciais
 * Uso: node scripts/reset-database.js
 */

require('dotenv').config();
const prismaConfig = require('../src/config/prisma');
const adminServicePrisma = require('../src/services/admin.service.prisma');
const clientService = require('../src/services/client.service');
const userService = require('../src/services/user.service');

class DatabaseReset {
  constructor() {
    this.prisma = null;
  }

  async initialize() {
    try {
      console.log('🔍 Inicializando conexão com o banco...');
      this.prisma = await prismaConfig.initialize();
      global.prisma = this.prisma;
      console.log('✅ Conexão estabelecida');
    } catch (error) {
      console.error('❌ Erro ao conectar com o banco:', error.message);
      throw error;
    }
  }

  async clearDatabase() {
    try {
      console.log('🗑️ Limpando banco de dados...');
      await prismaConfig.clearDatabase();
      console.log('✅ Banco de dados limpo');
    } catch (error) {
      console.error('❌ Erro ao limpar banco:', error.message);
      throw error;
    }
  }

  async createDefaultClient() {
    try {
      console.log('🏢 Criando cliente padrão...');
      
      const clientData = {
        name: process.env.DEFAULT_CLIENT_NAME || 'Azore',
        rateLimitRequestsPerMinute: parseInt(process.env.DEFAULT_CLIENT_RATE_LIMIT_REQUESTS_PER_MINUTE) || 1000,
        rateLimitRequestsPerHour: parseInt(process.env.DEFAULT_CLIENT_RATE_LIMIT_REQUESTS_PER_HOUR) || 10000,
        rateLimitRequestsPerDay: parseInt(process.env.DEFAULT_CLIENT_RATE_LIMIT_REQUESTS_PER_DAY) || 100000,
        isActive: true
      };

      const clientResult = await clientService.createClient(clientData);
      const client = clientResult.data;
      console.log('✅ Cliente criado:', {
        id: client.id,
        name: client.name,
        isActive: client.isActive
      });
      
      return client;
    } catch (error) {
      console.error('❌ Erro ao criar cliente padrão:', error.message);
      throw error;
    }
  }

  async createDefaultUser(clientId) {
    try {
      console.log('👤 Criando usuário padrão...');
      
      const userData = {
        email: process.env.DEFAULT_ADMIN_EMAIL || 'ivan.alberton@navi.inf.br',
        password: process.env.DEFAULT_ADMIN_PASSWORD || 'N@vi@2025',
        name: process.env.DEFAULT_ADMIN_NAME || 'Admin',
        cpf: process.env.DEFAULT_ADMIN_CPF || '00000000000',
        phone: process.env.DEFAULT_ADMIN_PHONE || '11999999999',
        birthDate: new Date(process.env.DEFAULT_ADMIN_BIRTH_DATE || '1990-01-01'),
        globalRole: 'SUPER_ADMIN',
        clientRole: 'ADMIN',
        isFirstAccess: false,
        isActive: true,
        publicKey: process.env.DEFAULT_ADMIN_PUBLIC_KEY || null,
        privateKey: process.env.DEFAULT_ADMIN_PRIVATE_KEY || null
      };

      const user = await userService.createUser(userData, clientId);
      console.log('✅ Usuário criado:', {
        id: user.id,
        email: user.email,
        name: user.name,
        globalRole: user.globalRole,
        userClients: user.userClients?.length || 0
      });
      
      return user;
    } catch (error) {
      console.error('❌ Erro ao criar usuário padrão:', error.message);
      throw error;
    }
  }

  async run() {
    try {
      console.log('🚀 Iniciando reset do banco de dados...\n');
      
      // Inicializar conexão
      await this.initialize();
      
      // Limpar banco de dados
      await this.clearDatabase();
      
      // Criar cliente padrão
      const client = await this.createDefaultClient();
      
      // Criar usuário padrão
      const user = await this.createDefaultUser(client.id);
      
      console.log('\n🎉 Reset do banco concluído com sucesso!');
      console.log('\n📋 Resumo:');
      console.log(`   Cliente: ${client.name} (ID: ${client.id})`);
      console.log(`   Usuário: ${user.name} <${user.email}> (ID: ${user.id})`);
      console.log(`   Role Global: ${user.globalRole}`);
      console.log(`   Clientes vinculados: ${user.userClients?.length || 0}`);
      
      return {
        success: true,
        data: {
          client,
          user
        }
      };
    } catch (error) {
      console.error('\n❌ Erro durante o reset:', error.message);
      throw error;
    } finally {
      if (this.prisma) {
        await this.prisma.$disconnect();
        console.log('\n🔌 Conexão com banco encerrada');
      }
    }
  }
}

// Executar script se chamado diretamente
if (require.main === module) {
  const reset = new DatabaseReset();
  reset.run()
    .then(() => {
      console.log('\n✅ Script executado com sucesso');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Falha na execução do script:', error.message);
      process.exit(1);
    });
}

module.exports = DatabaseReset;
