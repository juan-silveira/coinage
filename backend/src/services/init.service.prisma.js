const adminService = require('./admin.service.prisma');
const prismaConfig = require('../config/prisma');

/**
 * Serviço de inicialização do sistema (Prisma)
 */
class InitServicePrisma {
  /**
   * Inicializa o sistema completo
   */
  static async initializeSystem() {
    try {
      console.log('🚀 Iniciando sistema...');
      
      // Aguardar conexão com o Prisma
      const prisma = prismaConfig.getPrisma();
      console.log('✅ Conexão com banco estabelecida');
      
      // Inicializar usuário admin padrão
      console.log('👤 Inicializando usuário admin padrão...');
      const adminUser = await adminService.initializeDefaultAdmin();
      console.log('✅ Usuário admin inicializado');
      
      // Verificar se o usuário admin foi criado com sucesso
      if (adminUser) {
        console.log('✅ Usuário admin encontrado:', {
          id: adminUser.id,
          email: adminUser.email,
          name: adminUser.name,
          roles: adminUser.roles,
          isFirstAccess: adminUser.isFirstAccess,
          clientId: adminUser.clientId
        });
      } else {
        console.error('❌ Erro: Usuário admin não foi criado');
        throw new Error('Falha ao criar usuário admin padrão');
      }
      
      console.log('🎉 Sistema inicializado com sucesso!');
      return {
        success: true,
        message: 'Sistema inicializado com sucesso',
        data: {
          adminUser: {
            id: adminUser.id,
            email: adminUser.email,
            name: adminUser.name,
            roles: adminUser.roles,
            isFirstAccess: adminUser.isFirstAccess
          }
        }
      };
    } catch (error) {
      console.error('❌ Erro na inicialização do sistema:', error);
      throw error;
    }
  }
  
  /**
   * Verifica se o sistema está pronto para uso
   */
  static async checkSystemStatus() {
    try {
      const prisma = prismaConfig.getPrisma();
      
      // Verificar se existe pelo menos um usuário admin
      const adminUser = await prisma.user.findFirst({
        where: {
          OR: [
            { roles: { hasEvery: ['SUPER_ADMIN'] } },
            { roles: { hasEvery: ['APP_ADMIN'] } },
            { roles: { hasEvery: ['ADMIN'] } }
          ],
          isActive: true
        },
        include: {
          client: true
        }
      });
      
      // Verificar se existe pelo menos um client
      const client = await prisma.client.findFirst({
        where: {
          isActive: true
        }
      });
      
      return {
        success: true,
        data: {
          hasAdminUser: !!adminUser,
          hasClient: !!client,
          adminUser: adminUser ? {
            id: adminUser.id,
            email: adminUser.email,
            name: adminUser.name,
            roles: adminUser.roles,
            isFirstAccess: adminUser.isFirstAccess,
            client: adminUser.client ? {
              id: adminUser.client.id,
              name: adminUser.client.name
            } : null
          } : null
        }
      };
    } catch (error) {
      console.error('Erro ao verificar status do sistema:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Testa o serviço de inicialização
   */
  static async testService() {
    try {
      const prisma = prismaConfig.getPrisma();
      
      // Teste simples de conexão
      await prisma.$queryRaw`SELECT 1 as test`;
      
      // Verificar status do sistema
      const status = await this.checkSystemStatus();
      
      return {
        success: true,
        message: 'InitService (Prisma) funcionando corretamente',
        status,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        message: 'Erro no InitService (Prisma)',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = InitServicePrisma;