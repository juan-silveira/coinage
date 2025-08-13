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
   * @param {string} defaultClientId - ID do cliente padrão (opcional, usa Coinage se não fornecido)
   * @returns {Promise<Object>} Usuário criado
   */
  async createUser(userData, defaultClientId = null) {
    try {
      if (!this.prisma) await this.init();

      // Gerar chaves se não fornecidas
      if (!userData.publicKey || !userData.privateKey) {
        const { publicKey, privateKey } = this.generateKeyPair();
        userData.publicKey = publicKey;
        userData.privateKey = privateKey;
      }

      // Hash da senha
      const hashedPassword = await this.hashPassword(userData.password, userData.email);

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

        // Se fornecido clientId, criar vinculação automática
        if (defaultClientId) {
          const userClientService = require('./userClient.service');
          // Criar vinculação user-client
          const userClient = await userClientService.createUserClientLink(user.id, defaultClientId, {
            status: 'active',
            role: userData.role || 'USER',
            permissions: {}
          });
        }

        // Buscar usuário com vinculações
        const userWithClients = await tx.user.findUnique({
          where: { id: user.id },
          include: {
            userClients: {
              where: { status: 'active' },
              include: {
                client: {
                  select: { id: true, name: true }
                }
              }
            }
          }
        });

        return userWithClients;
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

      if (defaultClientId) {
        webhookService.triggerWebhooks('user.created', userEventData, defaultClientId)
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
        where: { id },
        include: {
          userClients: {
            include: {
              client: true
            }
          },
          apiKeys: {
            where: { isActive: true },
            select: {
              id: true,
              name: true,
              isActive: true,
              expiresAt: true,
              lastUsedAt: true,
              createdAt: true
            }
          }
        }
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
          userClients: {
            include: {
              client: true
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
          userClients: {
            include: {
              client: true
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
          client: true
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
        clientId,
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
      
      if (clientId) where.clientId = clientId;
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
            client: {
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
        where: { id },
        include: { client: true }
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
        dataToUpdate.password = await this.hashPassword(dataToUpdate.password, currentUser.email);
        dataToUpdate.passwordChangedAt = new Date();
      }

      // Atualizar usuário
      const updatedUser = await this.prisma.user.update({
        where: { id },
        data: dataToUpdate,
        include: {
          client: true
        }
      });

      // Preparar dados para webhook
      const changes = {
        old: this.sanitizeUser(currentUser),
        new: this.sanitizeUser(updatedUser)
      };

      // Disparar webhook de usuário atualizado
      const webhookService = require('./webhook.service');
      const userEventData = {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        cpf: updatedUser.cpf,
        publicKey: updatedUser.publicKey,
        roles: updatedUser.roles,
        isActive: updatedUser.isActive,
        clientId: updatedUser.clientId,
        updatedAt: updatedUser.updatedAt
      };

      webhookService.triggerWebhooks('user.updated', { user: userEventData, changes }, currentUser.clientId)
        .then(result => console.log(`📡 Webhook user.updated disparado:`, result))
        .catch(error => console.error(`❌ Erro ao disparar webhook user.updated:`, error));

      return this.sanitizeUser(updatedUser);
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
        },
        include: {
          client: true
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
        clientId: user.clientId,
        deactivatedAt: new Date()
      };

      webhookService.triggerWebhooks('user.deactivated', userEventData, user.clientId)
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
          client: true
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
        clientId: user.clientId,
        activatedAt: new Date()
      };

      webhookService.triggerWebhooks('user.activated', userEventData, user.clientId)
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
   * Gera hash da senha usando PBKDF2
   * @param {string} password - Senha a ser hasheada
   * @param {string} salt - Salt (usando email como salt)
   * @returns {Promise<string>} Hash da senha
   */
  async hashPassword(password, salt) {
    return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  }

  /**
   * Verifica se a senha está correta
   * @param {string} password - Senha a ser verificada
   * @param {string} hashedPassword - Hash armazenado
   * @param {string} salt - Salt usado (email)
   * @returns {Promise<boolean>} True se a senha estiver correta
   */
  async verifyPassword(password, hashedPassword, salt) {
    const hash = await this.hashPassword(password, salt);
    return hash === hashedPassword;
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
   * Busca usuários por cliente
   * @param {string} clientId - ID do cliente
   * @param {Object} options - Opções de busca
   * @returns {Promise<Array>} Lista de usuários do cliente
   */
  async getUsersByClientId(clientId, options = {}) {
    const searchOptions = {
      ...options,
      clientId
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

      const isValid = await this.verifyPassword(password, user.password, user.email);
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
        message: 'Usuário atualizado com sucesso',
        data: {
          id: result.id,
          name: result.name,
          email: result.email,
          cpf: result.cpf,
          phone: result.phone,
          birthDate: result.birthDate,
          publicKey: result.publicKey,
          isFirstAccess: result.isFirstAccess,
          userPlan: result.userPlan,
          isActive: result.isActive,
          updatedAt: result.updatedAt
        }
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
}

module.exports = new UserService();