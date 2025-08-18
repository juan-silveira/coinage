const prismaConfig = require('../config/prisma');
const crypto = require('crypto');
const { ethers } = require('ethers');

class UserService {
  constructor() {
    this.prisma = null;
  }

  async init() {
    this.prisma = prismaConfig.getPrisma();
  }

  /**
   * Cria um novo usuário
   * @param {Object} userData - Dados do usuário
   * @param {string} defaultCompanyId - ID da empresa padrão (opcional, usa Coinage se não fornecido)
   * @returns {Promise<Object>} Usuário criado
   */
  async createUser(userData, defaultCompanyId = null) {
    try {
      if (!this.prisma) await this.init();

      // Gerar chaves se não fornecidas
      if (!userData.publicKey || !userData.privateKey) {
        const { publicKey, privateKey } = this.generateKeyPair();
        userData.publicKey = publicKey;
        userData.privateKey = privateKey;
      }

      // Hash da senha
      const hashedPassword = await this.hashPassword(userData.password);

      // Criar usuário usando transação para garantir consistência
      const result = await this.prisma.$transaction(async (tx) => {
        // Criar usuário
        const user = await this.prisma.user.create({
          data: {
            name: userData.name,
            email: userData.email.toLowerCase(),
            cpf: userData.cpf,
            phone: userData.password,
            birthDate: userData.birthDate,
            publicKey: userData.publicKey,
            privateKey: userData.privateKey,
            password: hashedPassword,
            isFirstAccess: userData.isFirstAccess !== false,
            userPlan: userData.userPlan || 'BASIC',
            isActive: true
          }
        });

        // Se fornecido companyId, criar vinculação automática
        if (defaultCompanyId) {
          const userCompanyService = require('./userCompany.service');
          // Criar vinculação user-company
          const userCompany = await userCompanyService.createUserCompanyLink(user.id, defaultCompanyId, {
            status: 'active',
            role: userData.role || 'USER',
            permissions: {}
          });
        }

        // Buscar usuário com vinculações
        const userWithCompanies = await tx.user.findUnique({
          where: { id: user.id },
          include: {
            userCompanies: {
              where: { status: 'active' },
              include: {
                company: {
                  select: { id: true, name: true }
                }
              }
            }
          }
        });

        return userWithCompanies;
      });

      // Disparar webhook de usuário criado
      const webhookService = require('./webhook.service');
      const userEventData = {
        id: result.id,
        name: result.name,
        email: result.email,
        cpf: result.cpf,
        publicKey: result.publicKey,
        isActive: result.isActive,
        createdAt: result.createdAt
      };

      if (defaultCompanyId) {
        webhookService.triggerWebhooks('user.created', userEventData, defaultCompanyId)
          .then(result => console.log(`📡 Webhook user.created disparado:`, result))
          .catch(error => console.error(`❌ Erro ao disparar webhook user.created:`, error));
      }

      // Retornar sem dados sensíveis
      return this.sanitizeUser(result);

    } catch (error) {
      console.error('❌ Erro ao criar usuário:', error);
      throw error;
    }
  }

  /**
   * Busca usuário por ID
   * @param {string} id - ID do usuário
   * @param {boolean} includePrivateKey - Se deve incluir chave privada
   * @returns {Promise<Object|null>} Usuário encontrado
   */
  async getUserById(id, includePrivateKey = false) {
    try {
      if (!this.prisma) await this.init();

      const user = await this.prisma.user.findUnique({
        where: { id }
      });

      if (!user) return null;

      return includePrivateKey ? user : this.sanitizeUser(user);
    } catch (error) {
      console.error('❌ Erro ao buscar usuário por ID:', error);
      throw error;
    }
  }

  /**
   * Busca usuário por email
   * @param {string} email - Email do usuário
   * @param {boolean} includePrivateKey - Se deve incluir chave privada
   * @returns {Promise<Object|null>} Usuário encontrado
   */
  async getUserByEmail(email, includePrivateKey = false) {
    try {
      if (!this.prisma) await this.init();

      const user = await this.prisma.user.findFirst({
        where: { 
          email: email.toLowerCase(),
          isActive: true 
        },
        include: {
          userCompanies: {
            include: {
              company: true
            }
          }
        }
      });

      if (!user) return null;

      return includePrivateKey ? user : this.sanitizeUser(user);
    } catch (error) {
      console.error('❌ Erro ao buscar usuário por email:', error);
      throw error;
    }
  }

  /**
   * Busca usuário por CPF
   * @param {string} cpf - CPF do usuário
   * @param {boolean} includePrivateKey - Se deve incluir chave privada
   * @returns {Promise<Object|null>} Usuário encontrado
   */
  async getUserByCpf(cpf, includePrivateKey = false) {
    try {
      if (!this.prisma) await this.init();

      const normalizedCpf = cpf.replace(/[.-]/g, '');
      
      const user = await this.prisma.user.findUnique({
        where: { 
          cpf: normalizedCpf
        },
        include: {
          userCompanies: {
            include: {
              company: true
            }
          }
        }
      });

      if (!user) return null;

      return includePrivateKey ? user : this.sanitizeUser(user);
    } catch (error) {
      console.error('❌ Erro ao buscar usuário por CPF:', error);
      throw error;
    }
  }

  /**
   * Busca usuário por chave pública
   * @param {string} publicKey - Chave pública do usuário
   * @param {boolean} includePrivateKey - Se deve incluir chave privada
   * @returns {Promise<Object|null>} Usuário encontrado
   */
  async getUserByPublicKey(publicKey, includePrivateKey = false) {
    try {
      if (!this.prisma) await this.init();

      const user = await this.prisma.user.findFirst({
        where: { 
          publicKey: publicKey,
          isActive: true 
        },
        include: {
          company: true
        }
      });

      if (!user) return null;

      return includePrivateKey ? user : this.sanitizeUser(user);
    } catch (error) {
      console.error('❌ Erro ao buscar usuário por chave pública:', error);
      throw error;
    }
  }

  /**
   * Lista usuários com paginação e filtros
   * @param {Object} options - Opções de listagem
   * @returns {Promise<Object>} Lista paginada de usuários
   */
  async listUsers(options = {}) {
    try {
      if (!this.prisma) await this.init();

      const {
        page = 1,
        limit = 50,
        companyId,
        isActive,
        search,
        roles,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = options;

      const skip = (page - 1) * limit;
      const take = parseInt(limit);

      // Construir filtros
      const where = {};
      
      if (companyId) where.companyId = companyId;
      if (typeof isActive === 'boolean') where.isActive = isActive;
      
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { cpf: { contains: search.replace(/[.-]/g, '') } }
        ];
      }

      if (roles && roles.length > 0) {
        where.roles = {
          hasEvery: roles
        };
      }

      // Executar consulta
      const [users, total] = await Promise.all([
        this.prisma.user.findMany({
          where,
          include: {
            company: {
              select: { id: true, name: true, isActive: true }
            }
          },
          orderBy: { [sortBy]: sortOrder },
          skip,
          take
        }),
        this.prisma.user.count({ where })
      ]);

      // Sanitizar usuários
      const sanitizedUsers = users.map(user => this.sanitizeUser(user));

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
      console.error('❌ Erro ao listar usuários:', error);
      throw error;
    }
  }

  /**
   * Atualiza um usuário
   * @param {string} id - ID do usuário
   * @param {Object} updateData - Dados para atualização
   * @returns {Promise<Object>} Usuário atualizado
   */
  async updateUser(id, updateData) {
    try {
      if (!this.prisma) await this.init();

      // Buscar usuário atual para comparação
      const currentUser = await this.prisma.user.findUnique({
        where: { id }
      });

      if (!currentUser) {
        throw new Error('Usuário não encontrado');
      }

      // Preparar dados para atualização
      const dataToUpdate = { ...updateData };

      // Normalizar dados se fornecidos
      if (dataToUpdate.email) {
        dataToUpdate.email = dataToUpdate.email.toLowerCase();
      }
      if (dataToUpdate.cpf) {
        dataToUpdate.cpf = dataToUpdate.cpf.replace(/[.-]/g, '');
      }
      if (dataToUpdate.phone) {
        dataToUpdate.phone = dataToUpdate.phone.replace(/[^\d]/g, '');
      }

      // Hash da senha se alterada
      if (dataToUpdate.password) {
        dataToUpdate.password = await this.hashPassword(dataToUpdate.password);
        dataToUpdate.passwordChangedAt = new Date();
      }

      // Atualizar usuário
      const updatedUser = await this.prisma.user.update({
        where: { id },
        data: dataToUpdate
      });

      // Preparar dados para webhook
      const changes = {
        old: this.sanitizeUser(currentUser),
        new: this.sanitizeUser(updatedUser)
      };

      // Webhook temporariamente desabilitado
      // TODO: Implementar webhook quando necessário

      return {
        success: true,
        message: 'Usuário atualizado com sucesso',
        data: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          cpf: updatedUser.cpf,
          phone: updatedUser.phone,
          birthDate: updatedUser.birthDate,
          publicKey: updatedUser.publicKey,
          isFirstAccess: updatedUser.isFirstAccess,
          userPlan: updatedUser.userPlan,
          isActive: updatedUser.isActive,
          updatedAt: updatedUser.updatedAt
        }
      };
    } catch (error) {
      console.error('❌ Erro ao atualizar usuário:', error);
      throw error;
    }
  }

  /**
   * Desativa um usuário
   * @param {string} id - ID do usuário
   * @returns {Promise<Object>} Usuário desativado
   */
  async deactivateUser(id) {
    try {
      if (!this.prisma) await this.init();

      const user = await this.prisma.user.update({
        where: { id },
        data: { 
          isActive: false,
          sessionToken: null,
          sessionExpiresAt: null
        }
      });

      // Disparar webhook de usuário desativado
      const webhookService = require('./webhook.service');
      const userEventData = {
        id: user.id,
        name: user.name,
        email: user.email,
        cpf: user.cpf,
        publicKey: user.publicKey,
        roles: user.roles,
        isActive: user.isActive,
        companyId: user.companyId,
        deactivatedAt: new Date()
      };

      webhookService.triggerWebhooks('user.deactivated', userEventData, user.companyId)
        .then(result => console.log(`📡 Webhook user.deactivated disparado:`, result))
        .catch(error => console.error(`❌ Erro ao disparar webhook user.deactivated:`, error));

      return this.sanitizeUser(user);
    } catch (error) {
      console.error('❌ Erro ao desativar usuário:', error);
      throw error;
    }
  }

  /**
   * Ativa um usuário
   * @param {string} id - ID do usuário
   * @returns {Promise<Object>} Usuário ativado
   */
  async activateUser(id) {
    try {
      if (!this.prisma) await this.init();

      const user = await this.prisma.user.update({
        where: { id },
        data: { isActive: true },
        include: {
          company: true
        }
      });

      // Disparar webhook de usuário ativado
      const webhookService = require('./webhook.service');
      const userEventData = {
        id: user.id,
        name: user.name,
        email: user.email,
        cpf: user.cpf,
        publicKey: user.publicKey,
        roles: user.roles,
        isActive: user.isActive,
        companyId: user.companyId,
        activatedAt: new Date()
      };

      webhookService.triggerWebhooks('user.activated', userEventData, user.companyId)
        .then(result => console.log(`📡 Webhook user.activated disparado:`, result))
        .catch(error => console.error(`❌ Erro ao disparar webhook user.activated:`, error));

      return this.sanitizeUser(user);
    } catch (error) {
      console.error('❌ Erro ao ativar usuário:', error);
      throw error;
    }
  }

  /**
   * Gera um par de chaves Ethereum
   * @returns {Object} Par de chaves pública e privada
   */
  generateKeyPair() {
    const wallet = ethers.Wallet.createRandom();
    return {
      publicKey: wallet.address,
      privateKey: wallet.privateKey
    };
  }

  /**
   * Gera hash da senha usando bcrypt
   * @param {string} password - Senha a ser hasheada
   * @returns {Promise<string>} Hash da senha
   */
  async hashPassword(password) {
    const bcrypt = require('bcryptjs');
    return await bcrypt.hash(password, 12);
  }

  /**
   * Verifica se a senha está correta usando bcrypt
   * @param {string} password - Senha a ser verificada
   * @param {string} hashedPassword - Hash armazenado
   * @returns {boolean} True se a senha estiver correta
   */
  verifyPassword(password, hashedPassword) {
    const bcrypt = require('bcryptjs');
    return bcrypt.compareSync(password, hashedPassword);
  }

  /**
   * Remove dados sensíveis do usuário
   * @param {Object} user - Objeto do usuário
   * @returns {Object} Usuário sem dados sensíveis
   */
  sanitizeUser(user) {
    if (!user) return null;

    const sanitized = { ...user };
    delete sanitized.privateKey;
    delete sanitized.password;
    
    return sanitized;
  }

  /**
   * Busca usuários por empresa
   * @param {string} companyId - ID da empresa
   * @param {Object} options - Opções de busca
   * @returns {Promise<Array>} Lista de usuários da empresa
   */
  async getUsersByCompanyId(companyId, options = {}) {
    const searchOptions = {
      ...options,
      companyId
    };
    
    const result = await this.listUsers(searchOptions);
    return result.users;
  }

  /**
   * Autentica um usuário
   * @param {string} email - Email do usuário
   * @param {string} password - Senha do usuário
   * @returns {Promise<Object|null>} Usuário autenticado ou null
   */
  async authenticate(email, password) {
    try {
      if (!this.prisma) await this.init();

      const user = await this.prisma.user.findFirst({
        where: { 
          email: email.toLowerCase(),
          isActive: true 
        }
      });

      if (!user) return null;

      const isValid = this.verifyPassword(password, user.password);
      
      if (!isValid) return null;

      return this.sanitizeUser(user);
    } catch (error) {
      console.error('❌ Erro ao autenticar usuário:', error);
      throw error;
    }
  }

  /**
   * Testa o serviço
   * @returns {Promise<Object>} Status do teste
   */
  async testService() {
    try {
      if (!this.prisma) await this.init();

      // Teste simples de conexão
      await this.prisma.$queryRaw`SELECT 1 as test`;

      return {
        success: true,
        message: 'UserService funcionando corretamente',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        message: 'Erro no UserService (Prisma)',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Ativa usuário após confirmação de email
   * @param {string} userId - ID do usuário
   * @returns {Promise<Object>} Usuário ativado
   */
  async activateUser(userId) {
    try {
      if (!this.prisma) await this.init();

      const user = await this.prisma.user.update({
        where: { id: userId },
        data: { 
          isActive: true,
          emailVerifiedAt: new Date()
        }
      });

      return this.sanitizeUser(user);
    } catch (error) {
      console.error('❌ Erro ao ativar usuário:', error);
      throw error;
    }
  }

  /**
   * Busca usuário por email
   * @param {string} email - Email do usuário
   * @returns {Promise<Object|null>} Usuário encontrado ou null
   */
  async getUserByEmail(email) {
    try {
      if (!this.prisma) await this.init();

      const user = await this.prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        include: {
          userCompanies: {
            include: {
              company: true
            }
          }
        }
      });

      return user ? this.sanitizeUser(user) : null;
    } catch (error) {
      console.error('❌ Erro ao buscar usuário por email:', error);
      throw error;
    }
  }
}

module.exports = new UserService();