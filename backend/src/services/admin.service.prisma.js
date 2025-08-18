const crypto = require('crypto');
const prismaConfig = require('../config/prisma');

// Função para obter Prisma
const getPrisma = () => prismaConfig.getPrisma();

// Função para obter configurações do admin padrão
const getDefaultAdminConfig = () => {
  return {
    name: process.env.DEFAULT_ADMIN_NAME || 'Administrador',
    email: process.env.DEFAULT_ADMIN_EMAIL || 'admin@azore.com',
    password: process.env.DEFAULT_ADMIN_PASSWORD || 'admin123',
    cpf: process.env.DEFAULT_ADMIN_CPF || '00000000000',
    publicKey: process.env.DEFAULT_ADMIN_PUBLIC_KEY || '0x5528C065931f523CA9F3a6e49a911896fb1D2e6f',
    privateKey: process.env.DEFAULT_ADMIN_PRIVATE_KEY || '0x2a09b1aaa664113fd7163a0a4aafbcb16f6b5a16ae9dacfe7c840be2455e3f61',
    companyName: process.env.DEFAULT_CLIENT_NAME || 'Azore Admin Company',
    roles: ['SUPER_ADMIN']
  };
};

class AdminService {
  constructor() {
    this.initialized = false;
    this.defaultCompanyId = null;
    this.defaultAdminId = null;
    this.prisma = null;
  }

  async initialize() {
    try {
      this.prisma = getPrisma();
      await this.initializeDefaultAdmin();
      this.initialized = true;
      console.log('✅ Serviço de administração inicializado com sucesso (Prisma)');
    } catch (error) {
      console.error('❌ Erro ao inicializar serviço de administração:', error.message);
      throw error;
    }
  }

  /**
   * Inicializa o usuário administrador padrão
   */
  async initializeDefaultAdmin() {
    try {
      if (!this.prisma) {
        this.prisma = getPrisma();
      }

      const config = getDefaultAdminConfig();
      console.log('👤 Inicializando usuário admin padrão...');

      // Verificar se já existe um empresa padrão
      let defaultCompany = await this.prisma.company.findFirst({
        where: { name: config.companyName }
      });

      // Criar empresa padrão se não existir
      if (!defaultCompany) {
        console.log('🏢 Crianda empresa padrão...');
        defaultCompany = await this.prisma.company.create({
          data: {
            name: config.companyName,
            rateLimit: {
              requestsPerMinute: 1000,
              requestsPerHour: 10000,
              requestsPerDay: 100000
            }
          }
        });
        console.log(`✅ Company padrão criado: ${defaultCompany.name} (${defaultCompany.id})`);
      }

      this.defaultCompanyId = defaultCompany.id;

      // Verificar se já existe um admin padrão
      const existingAdmin = await this.prisma.user.findFirst({
        where: {
          email: config.email,
          companyId: defaultCompany.id
        }
      });

      if (existingAdmin) {
        console.log(`✅ Usuário admin já existe: ${existingAdmin.email} (${existingAdmin.id})`);
        this.defaultAdminId = existingAdmin.id;
        return existingAdmin;
      }

      // Criar admin padrão
      console.log('👤 Criando usuário admin padrão...');
      
      // Hash da senha usando crypto.pbkdf2
      const hashedPassword = crypto.pbkdf2Sync(config.password, config.email, 10000, 64, 'sha512').toString('hex');

      const adminUser = await this.prisma.user.create({
        data: {
          name: config.name,
          email: config.email,
          cpf: config.cpf,
          password: hashedPassword,
          publicKey: config.publicKey,
          privateKey: config.privateKey,
          companyId: defaultCompany.id,
          roles: config.roles,
          permissions: {
            wallets: { create: true, read: true, update: true, delete: true },
            contracts: { create: true, read: true, update: true, delete: true },
            transactions: { create: true, read: true, update: true, delete: true },
            admin: {
              fullAccess: true,
              companies: { read: true, create: true, update: true, delete: true },
              users: { read: true, create: true, update: true, delete: true }
            }
          },
          canViewPrivateKeys: true,
          privateKeyAccessLevel: 'all',
          isActive: true,
          isFirstAccess: false,
          passwordChangedAt: new Date()
        },
        include: {
          company: true
        }
      });

      this.defaultAdminId = adminUser.id;

      console.log(`✅ Usuário admin criado com sucesso:`);
      console.log(`   Nome: ${adminUser.name}`);
      console.log(`   Email: ${adminUser.email}`);
      console.log(`   Company: ${adminUser.company.name}`);
      console.log(`   Roles: ${adminUser.roles.join(', ')}`);
      console.log(`   ID: ${adminUser.id}`);

      return adminUser;
    } catch (error) {
      console.error('❌ Erro ao inicializar usuário admin:', error);
      throw error;
    }
  }

  /**
   * Cria um novo usuário administrador
   */
  async createAdminUser(userData) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      // Validações básicas
      if (!userData.name || !userData.email || !userData.password) {
        throw new Error('Nome, email e senha são obrigatórios');
      }

      if (!userData.companyId) {
        userData.companyId = this.defaultCompanyId;
      }

      // Hash da senha
      const hashedPassword = crypto.pbkdf2Sync(userData.password, userData.email, 10000, 64, 'sha512').toString('hex');

      // Gerar chaves se não fornecidas
      let publicKey = userData.publicKey;
      let privateKey = userData.privateKey;

      if (!publicKey || !privateKey) {
        const { ethers } = require('ethers');
        const wallet = ethers.Wallet.createRandom();
        publicKey = wallet.address;
        privateKey = wallet.privateKey;
      }

      // Criar usuário admin
      const adminUser = await this.prisma.user.create({
        data: {
          name: userData.name,
          email: userData.email.toLowerCase(),
          cpf: userData.cpf?.replace(/[.-]/g, '') || '00000000000',
          phone: userData.phone?.replace(/[^\d]/g, ''),
          password: hashedPassword,
          publicKey: publicKey,
          privateKey: privateKey,
          companyId: userData.companyId,
          roles: userData.roles || ['ADMIN'],
          permissions: userData.permissions || {
            wallets: { create: true, read: true, update: true, delete: false },
            contracts: { create: true, read: true, update: true, delete: false },
            transactions: { create: true, read: true, update: false, delete: false },
            admin: {
              fullAccess: false,
              companies: { read: true, create: false, update: true, delete: false },
              users: { read: true, create: true, update: true, delete: false }
            }
          },
          canViewPrivateKeys: userData.canViewPrivateKeys || false,
          privateKeyAccessLevel: userData.privateKeyAccessLevel || 'company_users',
          isActive: true,
          isFirstAccess: userData.isFirstAccess !== false
        },
        include: {
          company: true
        }
      });

      console.log(`✅ Usuário admin criado: ${adminUser.name} (${adminUser.email})`);
      return adminUser;
    } catch (error) {
      console.error('❌ Erro ao criar usuário admin:', error);
      throw error;
    }
  }

  /**
   * Lista usuários administradores
   */
  async listAdminUsers(options = {}) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const {
        page = 1,
        limit = 50,
        companyId,
        search
      } = options;

      const skip = (page - 1) * limit;
      const take = parseInt(limit);

      // Construir filtros
      const where = {
        OR: [
          { roles: { hasEvery: ['SUPER_ADMIN'] } },
          { roles: { hasEvery: ['APP_ADMIN'] } },
          { roles: { hasEvery: ['ADMIN'] } }
        ]
      };

      if (companyId) {
        where.companyId = companyId;
      }

      if (search) {
        where.AND = [
          {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } }
            ]
          }
        ];
      }

      // Executar consulta
      const [users, total] = await Promise.all([
        this.prisma.user.findMany({
          where,
          include: {
            company: {
              select: { id: true, name: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take
        }),
        this.prisma.user.count({ where })
      ]);

      // Remover dados sensíveis
      const sanitizedUsers = users.map(user => {
        const { password, privateKey, ...sanitizedUser } = user;
        return sanitizedUser;
      });

      return {
        users: sanitizedUsers,
        pagination: {
          page: parseInt(page),
          limit: take,
          total,
          totalPages: Math.ceil(total / take),
          hasNext: skip + take < total,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      console.error('❌ Erro ao listar usuários admin:', error);
      throw error;
    }
  }

  /**
   * Atualiza permissões de um usuário
   */
  async updateUserPermissions(userId, permissions) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: { permissions },
        include: {
          company: true
        }
      });

      console.log(`✅ Permissões atualizadas para usuário: ${updatedUser.email}`);
      
      // Remover dados sensíveis
      const { password, privateKey, ...sanitizedUser } = updatedUser;
      return sanitizedUser;
    } catch (error) {
      console.error('❌ Erro ao atualizar permissões:', error);
      throw error;
    }
  }

  /**
   * Alterna status de usuário administrador
   */
  async toggleAdminStatus(userId, isActive) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      // Não permitir desativar o admin padrão
      if (userId === this.defaultAdminId && !isActive) {
        throw new Error('Não é possível desativar o usuário administrador padrão');
      }

      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: { isActive },
        include: {
          company: true
        }
      });

      console.log(`✅ Status do usuário admin ${isActive ? 'ativado' : 'desativado'}: ${updatedUser.email}`);
      
      // Remover dados sensíveis
      const { password, privateKey, ...sanitizedUser } = updatedUser;
      return sanitizedUser;
    } catch (error) {
      console.error('❌ Erro ao alterar status do admin:', error);
      throw error;
    }
  }

  /**
   * Obtém estatísticas do sistema
   */
  async getSystemStats() {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const [
        totalUsers,
        activeUsers,
        totalCompanies,
        activeCompanies,
        totalTransactions,
        totalAdmins
      ] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.count({ where: { isActive: true } }),
        this.prisma.company.count(),
        this.prisma.company.count({ where: { isActive: true } }),
        this.prisma.transaction.count(),
        this.prisma.user.count({
          where: {
            OR: [
              { roles: { hasEvery: ['SUPER_ADMIN'] } },
              { roles: { hasEvery: ['APP_ADMIN'] } },
              { roles: { hasEvery: ['ADMIN'] } }
            ]
          }
        })
      ]);

      return {
        users: {
          total: totalUsers,
          active: activeUsers,
          inactive: totalUsers - activeUsers
        },
        companies: {
          total: totalCompanies,
          active: activeCompanies,
          inactive: totalCompanies - activeCompanies
        },
        transactions: {
          total: totalTransactions
        },
        admins: {
          total: totalAdmins
        }
      };
    } catch (error) {
      console.error('❌ Erro ao obter estatísticas:', error);
      throw error;
    }
  }

  /**
   * Testa o serviço
   */
  async testService() {
    try {
      if (!this.prisma) {
        this.prisma = getPrisma();
      }

      // Teste simples de conexão
      await this.prisma.$queryRaw`SELECT 1 as test`;

      const stats = await this.getSystemStats();

      return {
        success: true,
        message: 'AdminService (Prisma) funcionando corretamente',
        initialized: this.initialized,
        defaultCompanyId: this.defaultCompanyId,
        defaultAdminId: this.defaultAdminId,
        stats,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        message: 'Erro no AdminService (Prisma)',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = new AdminService();