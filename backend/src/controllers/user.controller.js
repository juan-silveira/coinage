// Importar Prisma company
const prismaConfig = require('../config/prisma');

// Função helper para obter Prisma
const getPrisma = () => prismaConfig.getPrisma();

// Importar serviços
const userService = require('../services/user.service');
const { validatePassword } = require('../utils/passwordValidation');

/**
 * Criar usuário
 */
const createUser = async (req, res) => {
  try {
    const userData = req.body;
    const companyId = req.user.companyId; // Empresa do usuário autenticado

    // Validações básicas
    if (!userData.name || !userData.email || !userData.cpf || !userData.password) {
      return res.status(400).json({
        success: false,
        message: 'Nome, email, CPF e senha são obrigatórios'
      });
    }

    // Validação de senha forte
    const passwordValidation = validatePassword(userData.password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Senha não atende aos critérios de segurança',
        errors: passwordValidation.errors
      });
    }

    const user = await userService.createUser(userData, companyId);

    res.status(201).json({
      success: true,
      message: 'Usuário criado com sucesso',
      data: { user }
    });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    
    if (error.message.includes('já está em uso')) {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * Buscar usuário por ID
 */
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const includePrivateKey = req.query.includePrivateKey === 'true';

    const user = await userService.getUserById(id, includePrivateKey);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * Buscar usuário por CPF
 */
const getUserByCpf = async (req, res) => {
  try {
    const { cpf } = req.params;
    const includePrivateKey = req.query.includePrivateKey === 'true';

    const user = await userService.getUserByCpf(cpf, includePrivateKey);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Erro ao buscar usuário por CPF:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * Listar usuários
 */
const listUsers = async (req, res) => {
  try {
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 50,
      companyId: req.user.isApiAdmin ? req.query.companyId : req.user.companyId,
      isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
      search: req.query.search,
      roles: req.query.roles ? req.query.roles.split(',') : undefined,
      sortBy: req.query.sortBy || 'createdAt',
      sortOrder: req.query.sortOrder || 'desc'
    };

    const result = await userService.listUsers(options);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * Atualizar usuário
 */
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const user = await userService.updateUser(id, updateData);

    res.json({
      success: true,
      message: 'Usuário atualizado com sucesso',
      data: { user }
    });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    
    if (error.message.includes('não encontrado')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * Desativar usuário
 */
const deactivateUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await userService.deactivateUser(id);

    res.json({
      success: true,
      message: 'Usuário desativado com sucesso',
      data: { user }
    });
  } catch (error) {
    console.error('Erro ao desativar usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * Ativar usuário
 */
const activateUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await userService.activateUser(id);

    res.json({
      success: true,
      message: 'Usuário ativado com sucesso',
      data: { user }
    });
  } catch (error) {
    console.error('Erro ao ativar usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * Buscar usuário por endereço (chave pública)
 */
const getUserByAddress = async (req, res) => {
  try {
    const { address } = req.params;
    const includePrivateKey = req.query.includePrivateKey === 'true';

    const user = await userService.getUserByPublicKey(address, includePrivateKey);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Erro ao buscar usuário por endereço:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * Obter saldos de um usuário por endereço
 */
const getUserBalancesByAddress = async (req, res) => {
  try {
    const { address } = req.params;
    const { network = 'testnet', forceRefresh = 'false' } = req.query;
    
    console.log(`💰 Obtendo saldos para address: ${address}, network: ${network}, forceRefresh: ${forceRefresh}`);
    
    // Verificar cache primeiro se usuário autenticado E não for forceRefresh
    if (req.user && req.user.id && forceRefresh !== 'true') {
      const redisService = require('../services/redis.service');
      const cachedBalances = await redisService.getCachedUserBalances(req.user.id, address, network);
      
      if (cachedBalances) {
        console.log(`⚡ Retornando saldos do cache para ${network}`);
        return res.json({
          success: true,
          data: cachedBalances
        });
      }
    } else if (forceRefresh === 'true') {
      console.log(`🔄 forceRefresh=true - LIMPANDO CACHE e consultando blockchain diretamente`);
      
      // LIMPAR CACHE REDIS FORÇADAMENTE
      if (req.user && req.user.id) {
        const redisService = require('../services/redis.service');
        const cacheKey = `balances:${req.user.id}:${address}:${network}`;
        try {
          if (redisService.company && redisService.isConnected) {
            await redisService.company.del(cacheKey);
            console.log(`🗑️ Cache Redis REMOVIDO para chave: ${cacheKey}`);
          }
        } catch (error) {
          console.error('❌ Erro ao limpar cache Redis:', error);
        }
      }
    }
    
    // Importar serviços necessários para consulta blockchain
    // Usar novo serviço do AzoreScan para consultar balances diretamente da blockchain
    try {
      console.log(`🚀 Consultando balances via AzoreScan API para ${address} na ${network}`);
      
      const azoreScanService = require('../services/azorescan.service');
      const balancesResponse = await azoreScanService.getCompleteBalances(address, network);
      
      if (balancesResponse.success) {
        console.log(`✅ Balances obtidos com sucesso via AzoreScan API`);
        
        // Salvar dados frescos no cache se usuário autenticado
        if (req.user && req.user.id) {
          console.log(`💾 Salvando dados frescos no cache para ${req.user.id}`);
          const redisService = require('../services/redis.service');
          await redisService.cacheUserBalances(req.user.id, address, network, balancesResponse.data);
        }
        
        res.json({ success: true, data: balancesResponse.data });
        return; // Sair da função aqui
      } else {
        console.error(`❌ Erro ao obter balances via AzoreScan: ${balancesResponse.error}`);
        
        // Fallback: retornar estrutura mínima com apenas saldo zerado
        const nativeSymbol = network === 'testnet' ? 'AZE-t' : 'AZE';
        const fallbackData = {
          address: address,
          network: network,
          azeBalance: {
            balanceWei: '0',
            balanceEth: '0.0'
          },
          tokenBalances: [],
          balancesTable: { [nativeSymbol]: '0.0' },
          totalTokens: 1,
          timestamp: new Date().toISOString(),
          fromCache: false,
          error: balancesResponse.error
        };
        
        res.json({ success: true, data: fallbackData });
        return; // Sair da função aqui
      }
    } catch (apiError) {
      console.error(`❌ Erro na consulta via AzoreScan API: ${apiError.message}`);
      
      // Fallback: usar lógica antiga como backup
      console.log(`🔄 Tentando fallback com blockchain service...`);
    }

    // FALLBACK: Lógica antiga como backup
    const blockchainService = require('../services/blockchain.service');
    const tokenService = require('../services/token.service');
    
    // Inicializar dados de resposta
    let balancesData = {
      address,
      network,
      azeBalance: { balanceWei: '0', balanceEth: '0' },
      tokenBalances: [],
      balancesTable: {},
      totalTokens: 0,
      timestamp: new Date().toISOString(),
      fromCache: false
    };
    
    try {
      // Obter saldo de AZE (token nativo)
      console.log(`🔍 [FALLBACK] Consultando saldo AZE para ${address}`);
      const azeBalance = await blockchainService.getBalance(address, network);
      balancesData.azeBalance = {
        balanceWei: azeBalance.balanceWei,
        balanceEth: azeBalance.balanceEth
      };
      console.log(`✅ [FALLBACK] Saldo AZE obtido: ${azeBalance.balanceEth} AZE`);
    } catch (azeError) {
      console.warn(`⚠️ [FALLBACK] Erro ao obter saldo AZE: ${azeError.message}`);
      // Manter saldo zerado se não conseguir consultar
    }
    
    // Consultar tokens ERC-20 configurados (temporário até migração Prisma)
    console.log(`🔍 INICIANDO consulta de tokens ERC-20 para network: ${network}`);
    try {
      // Tokens conhecidos para testnet e mainnet
      const knownTokens = {
        testnet: [
          {
            name: 'Coinage Real Brasil',
            symbol: 'cBRL',
            address: '0x0A8c73967e4Eee8ffA06484C3fBf65E6Ae3b9804',
            decimals: 18
          },
          {
            name: 'Stake Token Test',
            symbol: 'STT', 
            address: '0x575b05df92b1a2e7782322bb86a9ee1e5bf2edcd',
            decimals: 18
          }
        ],
        mainnet: [
          {
            name: 'Coinage Real Brasil',
            symbol: 'cBRL',
            address: '0x2f8d31627a1f014691eb6e56c235b2382702f4b9',
            decimals: 18
          }
        ]
      };
      
      const configuredTokens = knownTokens[network] || [];
      
      console.log(`🔍 Consultando ${configuredTokens.length} tokens ERC-20 para ${network}`);
      
      // TEMPORÁRIO: Retornar dados simulados dos tokens para testar frontend
      console.log(`🔧 Retornando dados simulados para ${configuredTokens.length} tokens`);
      const tokenPromises = configuredTokens.map(async (token) => {
        console.log(`🪙 Simulando token ${token.symbol} (${token.address})`);
        
        // Simular balances para o usuário de teste
        const mockBalances = {
          'cBRL': '1250.50',
          'STT': '850.75'
        };
        
        const tokenBalance = {
          contractAddress: token.address,
          tokenName: token.name,
          tokenSymbol: token.symbol,
          tokenDecimals: 18,
          balanceWei: '1000000000000000000000', // 1000 tokens em wei
          balanceEth: mockBalances[token.symbol] || '100.00',
          userAddress: address,
          network: network
        };
        
        console.log(`✅ Saldo simulado ${token.symbol}: ${tokenBalance.balanceEth}`);
        return tokenBalance;
      });
      
      const tokenResults = await Promise.all(tokenPromises);
      const validTokenBalances = tokenResults.filter(result => result !== null);
      
      balancesData.tokenBalances = validTokenBalances;
      balancesData.totalTokens = validTokenBalances.length + 1; // +1 para AZE
      
      // Criar tabela de balances para facilitar acesso no frontend
      const nativeSymbol = network === 'testnet' ? 'AZE-t' : 'AZE';
      balancesData.balancesTable = {
        [nativeSymbol]: balancesData.azeBalance.balanceEth
      };
      
      validTokenBalances.forEach(token => {
        balancesData.balancesTable[token.tokenSymbol] = token.balanceEth;
      });
      
      console.log(`✅ Total de tokens consultados: ${validTokenBalances.length} ERC-20 + 1 ${nativeSymbol}`);
      
    } catch (tokensError) {
      console.error(`❌ Erro ao consultar tokens ERC-20: ${tokensError.message}`);
      // Manter apenas o saldo nativo se houver erro nos tokens  
      balancesData.balancesTable = { [nativeSymbol]: balancesData.azeBalance.balanceEth };
      balancesData.totalTokens = 1;
    }
    
    // Salvar dados no cache se usuário autenticado
    if (req.user && req.user.id) {
      console.log(`💾 Salvando dados do fallback no cache para ${req.user.id}`);
      const redisService = require('../services/redis.service');
      await redisService.cacheUserBalances(req.user.id, address, network, balancesData);
    }
    
    res.json({
      success: true,
      data: balancesData
    });
    
  } catch (error) {
    console.error('❌ Erro ao obter saldos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * Busca usuário por email
 */
const getUserByEmail = async (req, res) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email é obrigatório'
      });
    }

    const user = await userService.getUserByEmail(email);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    res.json({
      success: true,
      data: { user }
    });

  } catch (error) {
    console.error('❌ Erro ao buscar usuário por email:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * Lista transações do usuário (considerando contexto multi-empresa)
 */
const listUserTransactions = async (req, res) => {
  try {
    const userId = req.params.id || req.user.id;
    const { 
      companyId, 
      page = 1, 
      limit = 50,
      status,
      startDate,
      endDate,
      type
    } = req.query;

    // Verificar se o usuário pode acessar as transações
    if (userId !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Sem permissão para acessar transações de outro usuário'
      });
    }

    const prisma = require('../config/prisma').getPrisma();
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {};

    if (companyId) {
      // Buscar transações específicas da empresa
      const userCompany = await prisma.userCompany.findUnique({
        where: {
          userId_companyId: {
            userId,
            companyId
          }
        }
      });

      if (!userCompany) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não vinculado a esta empresa'
        });
      }

      where.userCompanyId = userCompany.id;
    } else {
      // Buscar todas as transações do usuário (através de todas as vinculações)
      const userCompanies = await prisma.userCompany.findMany({
        where: { userId, status: 'active' },
        select: { id: true }
      });

      where.userCompanyId = {
        in: userCompanies.map(uc => uc.id)
      };
    }

    // Filtros adicionais
    if (status) where.status = status;
    if (type) where.type = type;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          userCompany: {
            include: {
              company: {
                select: { id: true, name: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.transaction.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('❌ Erro ao listar transações do usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * Testar serviço de usuários
 */
const testUserService = async (req, res) => {
  try {
    const result = await userService.testService();
    res.json(result);
  } catch (error) {
    console.error('Erro ao testar serviço de usuários:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao testar serviço'
    });
  }
};


module.exports = {
  createUser,
  getUserById,
  getUserByCpf,
  getUserByAddress,
  getUserBalancesByAddress,
  listUsers,
  updateUser,
  deactivateUser,
  activateUser,
  testUserService,
  testService: testUserService,
  listUserTransactions,
  getUserByEmail
};