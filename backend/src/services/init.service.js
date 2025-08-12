const adminService = require('./admin.service');
const contractService = require('./contract.service');
const transactionService = require('./transaction.service');

/**
 * Serviço de inicialização do sistema
 */
class InitService {
  /**
   * Inicializa o sistema completo
   */
  static async initializeSystem() {
    try {
      console.log('🚀 Iniciando sistema...');
      
      // Aguardar conexão com o banco
      const models = global.models;
      console.log('✅ Conexão com banco estabelecida');
      
      // Inicializar ContractService
      console.log('📄 Inicializando ContractService...');
      await contractService.initialize();
      console.log('✅ ContractService inicializado');
      
      // Inicializar TransactionService
      console.log('📄 Inicializando TransactionService...');
      await transactionService.initialize();
      console.log('✅ TransactionService inicializado');
      
      // Inicializar usuário admin padrão
      console.log('👤 Inicializando usuário admin padrão...');
      const adminResult = await adminService.initializeDefaultAdmin();
      console.log('✅ Usuário admin inicializado:', adminResult.message);
      
      // Verificar se o usuário admin foi criado com sucesso
      const { User } = models;
      const adminUser = await User.findByEmail(process.env.DEFAULT_ADMIN_EMAIL || 'ivan.alberton@navi.inf.br');
      
      if (adminUser) {
        console.log('✅ Usuário admin encontrado:', {
          id: adminUser.id,
          email: adminUser.email,
          isFirstAccess: adminUser.isFirstAccess,
          isApiAdmin: adminUser.isApiAdmin,
          isClientAdmin: adminUser.isClientAdmin
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
      const models = global.models;
      const { User, Client } = models;
      
      // Verificar se existe pelo menos um usuário admin
      const adminUser = await User.findOne({
        where: {
          isApiAdmin: true,
          isActive: true
        }
      });
      
      // Verificar se existe pelo menos um client
      const client = await Client.findOne({
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
            isFirstAccess: adminUser.isFirstAccess
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
}

module.exports = InitService; 