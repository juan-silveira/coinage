/**
 * Stake Contracts Routes
 * Rotas para gerenciamento de contratos de stake
 */

const express = require('express');
const router = express.Router();
const prismaConfig = require('../config/prisma');
const fs = require('fs');
const path = require('path');

// Helper function to get prisma instance
const getPrisma = () => {
  try {
    return prismaConfig.getPrisma();
  } catch (error) {
    console.error('Prisma not initialized:', error.message);
    throw new Error('Database connection not available');
  }
};

// Load default stake ABI
const loadStakeABI = () => {
  try {
    const abiPath = path.join(__dirname, '..', 'contracts', 'abis', 'default_stake_abi.json');
    const abiContent = fs.readFileSync(abiPath, 'utf8');
    return JSON.parse(abiContent);
  } catch (error) {
    console.error('Error loading stake ABI:', error);
    return null;
  }
};

// Função helper para buscar contract type por nome
const getContractTypeByName = async (name) => {
  try {
    const contractType = await global.prisma.contractType.findUnique({
      where: { name }
    });
    return contractType;
  } catch (error) {
    console.warn(`Não foi possível encontrar contract type ${name}:`, error.message);
    return null;
  }
};

/**
 * GET /api/stake-contracts
 * Lista todos os contratos de stake
 */
router.get('/', async (req, res) => {
  try {
    const prisma = getPrisma();
    console.log('Prisma instance:', prisma ? 'OK' : 'UNDEFINED');
    
    if (!prisma) {
      throw new Error('Prisma instance is undefined');
    }
    
    const contracts = await prisma.smartContract.findMany({
      where: {
        isActive: true,
        // Filter by stake-related contracts
        OR: [
          {
            name: {
              contains: 'stake',
              mode: 'insensitive'
            }
          },
          {
            name: {
              contains: 'pedacinho',
              mode: 'insensitive'
            }
          }
        ]
      },
      select: {
        id: true,
        name: true,
        address: true,
        network: true,
        isActive: true,
        metadata: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform data to match frontend format
    const transformedContracts = contracts.map(contract => ({
      id: contract.id,
      name: contract.name,
      address: contract.address,
      tokenAddress: contract.metadata?.tokenAddress || null,
      network: contract.network.toLowerCase(),
      description: contract.metadata?.description || null,
      adminAddress: contract.metadata?.adminAddress || null,
      isActive: contract.isActive,
      createdAt: contract.createdAt.toISOString(),
      metadata: contract.metadata // Incluir o metadata completo
    }));

    res.json({
      success: true,
      data: transformedContracts
    });

  } catch (error) {
    console.error('Error fetching stake contracts:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar contratos de stake',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * POST /api/stake-contracts
 * Registra um novo contrato de stake
 */
router.post('/', async (req, res) => {
  try {
    const prisma = getPrisma();
    const { address, tokenAddress, network, name, description, adminAddress, risk } = req.body;

    // Validações básicas
    if (!address || !tokenAddress || !network || !name) {
      return res.status(400).json({
        success: false,
        message: 'Campos obrigatórios: address, tokenAddress, network, name'
      });
    }

    // Validar risco (0-4)
    if (risk !== undefined && risk !== null && (risk < 0 || risk > 4 || !Number.isInteger(risk))) {
      return res.status(400).json({
        success: false,
        message: 'Risco deve ser um número inteiro entre 0 e 4 (0=Muito Baixo, 1=Baixo, 2=Médio, 3=Alto, 4=Muito Alto)'
      });
    }

    // Validar formato de endereço Ethereum
    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    if (!ethAddressRegex.test(address)) {
      return res.status(400).json({
        success: false,
        message: 'Endereço do contrato inválido'
      });
    }

    if (!ethAddressRegex.test(tokenAddress)) {
      return res.status(400).json({
        success: false,
        message: 'Endereço do token inválido'
      });
    }

    if (adminAddress && !ethAddressRegex.test(adminAddress)) {
      return res.status(400).json({
        success: false,
        message: 'Endereço do admin inválido'
      });
    }

    // Verificar se o contrato já existe
    const existingContract = await prisma.smartContract.findUnique({
      where: { address }
    });

    if (existingContract) {
      return res.status(409).json({
        success: false,
        message: 'Contrato com este endereço já existe'
      });
    }

    // Para criar o contrato, precisamos de um company_id
    // Vamos usar o primeiro company disponível ou criar um padrão
    let companyId;
    try {
      const company = await prisma.company.findFirst({
        select: { id: true }
      });
      
      if (company) {
        companyId = company.id;
      } else {
        // Se não existe company, criar uma padrão
        const defaultCompany = await prisma.company.create({
          data: {
            name: 'Coinage Default',
            description: 'Default company for system contracts',
            website: 'https://coinage.app',
            isActive: true
          }
        });
        companyId = defaultCompany.id;
      }
    } catch (companyError) {
      console.error('Error handling company:', companyError);
      return res.status(500).json({
        success: false,
        message: 'Erro ao configurar empresa para o contrato'
      });
    }

    // Buscar contract type dinamicamente
    console.log('🔍 Buscando contract type stake...');
    const contractTypeRecord = await getContractTypeByName('stake');
    if (!contractTypeRecord) {
      return res.status(500).json({
        success: false,
        message: 'Contract type stake não encontrado no banco de dados'
      });
    }
    console.log('✅ Contract type encontrado:', contractTypeRecord.id, contractTypeRecord.name);

    // Load stake ABI
    const stakeABI = loadStakeABI();
    if (!stakeABI) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao carregar ABI do contrato de stake'
      });
    }

    // Criar o contrato
    const newContract = await prisma.smartContract.create({
      data: {
        name,
        address,
        network: network.toLowerCase(),
        companyId: companyId,
        contractTypeId: contractTypeRecord.id, // Usar ID dinâmico
        abi: stakeABI, // Include the stake ABI
        isActive: true,
        metadata: {
          tokenAddress,
          description,
          adminAddress,
          contractType: 'stake',
          risk: risk || 1, // Default: Baixo
          lastDistribution: null,
          nextDistribution: null,
          registeredBy: 'system',
          registrationSource: 'admin_panel'
        },
        updatedAt: new Date()
      }
    });

    // Retornar dados no formato esperado pelo frontend
    const responseData = {
      id: newContract.id,
      name: newContract.name,
      address: newContract.address,
      tokenAddress,
      network: network.toLowerCase(),
      description,
      adminAddress,
      isActive: newContract.isActive,
      createdAt: newContract.createdAt.toISOString()
    };

    res.status(201).json({
      success: true,
      data: responseData,
      message: 'Contrato de stake registrado com sucesso'
    });

  } catch (error) {
    console.error('Error creating stake contract:', error);
    
    // Handle specific Prisma errors
    if (error.code === 'P2002') {
      return res.status(409).json({
        success: false,
        message: 'Contrato com este endereço já existe'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erro ao registrar contrato de stake',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * PATCH /api/stake-contracts/:id/abi
 * Atualiza apenas o ABI de um contrato de stake
 */
router.patch('/:id/abi', async (req, res) => {
  try {
    const prisma = getPrisma();
    const { id } = req.params;

    // Load stake ABI
    const stakeABI = loadStakeABI();
    if (!stakeABI) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao carregar ABI do contrato de stake'
      });
    }

    // Buscar contract type dinamicamente
    const contractTypeRecord = await getContractTypeByName('stake');
    if (!contractTypeRecord) {
      return res.status(500).json({
        success: false,
        message: 'Contract type stake não encontrado no banco de dados'
      });
    }

    const updatedContract = await prisma.smartContract.update({
      where: { id },
      data: {
        abi: stakeABI,
        contractTypeId: contractTypeRecord.id,
        updatedAt: new Date()
      }
    });

    res.json({
      success: true,
      data: {
        id: updatedContract.id,
        name: updatedContract.name,
        address: updatedContract.address,
        message: 'ABI atualizado com sucesso'
      }
    });

  } catch (error) {
    console.error('Error updating stake contract ABI:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Contrato não encontrado'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar ABI do contrato',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * PUT /api/stake-contracts/:id
 * Atualiza um contrato de stake
 */
router.put('/:id', async (req, res) => {
  try {
    const prisma = getPrisma();
    const { id } = req.params;
    const { name, description, adminAddress, isActive } = req.body;

    const updatedContract = await prisma.smartContract.update({
      where: { id },
      data: {
        name,
        isActive: isActive,
        metadata: {
          description,
          adminAddress,
          contractType: 'stake',
          lastUpdated: new Date().toISOString()
        },
        updatedAt: new Date()
      }
    });

    res.json({
      success: true,
      data: {
        id: updatedContract.id,
        name: updatedContract.name,
        address: updatedContract.address,
        isActive: updatedContract.isActive,
        message: 'Contrato atualizado com sucesso'
      }
    });

  } catch (error) {
    console.error('Error updating stake contract:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Contrato não encontrado'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar contrato',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * DELETE /api/stake-contracts/:id
 * Remove (desativa) um contrato de stake
 */
router.delete('/:id', async (req, res) => {
  try {
    const prisma = getPrisma();
    const { id } = req.params;

    await prisma.smartContract.update({
      where: { id },
      data: {
        isActive: false,
        updatedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Contrato desativado com sucesso'
    });

  } catch (error) {
    console.error('Error deleting stake contract:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Contrato não encontrado'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erro ao remover contrato',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * PATCH /api/stake-contracts/:address/distribution
 * Atualiza dados de distribuição após chamada de distributeReward
 */
router.patch('/:address/distribution', async (req, res) => {
  try {
    const prisma = getPrisma();
    const { address } = req.params;
    const { percentage, network } = req.body;
    

    if (!percentage || percentage < 0) {
      return res.status(400).json({
        success: false,
        message: 'Percentage é obrigatório e deve ser maior que 0'
      });
    }

    // Buscar cycleDurationInDays do contrato
    let cycleDurationInDays = 90; // Default fallback
    
    try {
      // Buscar informações do contrato no banco para obter a network
      const contract = await prisma.smartContract.findUnique({
        where: { address },
        select: { network: true }
      });
      
      const contractNetwork = network || contract?.network || 'testnet';
      
      // Fazer chamada para buscar cycleDurationInDays do contrato
      const axios = require('axios');
      const cycleResponse = await axios.post(`${process.env.API_BASE_URL || 'http://localhost:8800'}/api/contracts/read`, {
        contractAddress: address,
        functionName: 'cycleDurationInDays',
        params: [],
        network: contractNetwork
      });
      
      if (cycleResponse.data.success && cycleResponse.data.data?.result) {
        cycleDurationInDays = parseInt(cycleResponse.data.data.result);
      }
    } catch (cycleError) {
      // Use default 90 days on error
    }

    // Calcular próxima distribuição usando cycleDurationInDays
    const nextDistribution = new Date();
    nextDistribution.setDate(nextDistribution.getDate() + cycleDurationInDays);

    // Verificar se o contrato existe primeiro
    const existingContract = await prisma.smartContract.findUnique({
      where: { address },
      select: { id: true, metadata: true }
    });
    
    if (!existingContract) {
      return res.status(404).json({
        success: false,
        message: 'Contrato não encontrado'
      });
    }

    // Converter percentage para formato de exibição (540 -> 5.40%)
    const displayPercentage = (percentage / 100).toFixed(2);
    
    const newMetadata = {
      ...existingContract.metadata,
      lastDistribution: `${displayPercentage}%`,
      nextDistribution: nextDistribution.toISOString(),
      lastDistributionDate: new Date().toISOString(),
      cycleDurationInDays: cycleDurationInDays
    };

    const updatedContract = await prisma.smartContract.update({
      where: { address },
      data: {
        metadata: newMetadata,
        updatedAt: new Date()
      }
    });

    res.json({
      success: true,
      data: {
        address,
        lastDistribution: `${displayPercentage}%`,
        nextDistribution: nextDistribution.toISOString(),
        cycleDurationInDays: cycleDurationInDays,
        message: 'Dados de distribuição atualizados com sucesso'
      }
    });

  } catch (error) {
    console.error('Error updating distribution data:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Contrato não encontrado'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar dados de distribuição',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;