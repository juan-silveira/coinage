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

// Contract type IDs
const CONTRACT_TYPE_IDS = {
  TOKEN: '43667189-7fb5-45e6-a6a8-7541df3bcf1a',
  STAKE: 'b357140e-acc3-42ba-9828-fa6f9a109be1'
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
      createdAt: contract.createdAt.toISOString()
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
    const { address, tokenAddress, network, name, description, adminAddress } = req.body;

    // Validações básicas
    if (!address || !tokenAddress || !network || !name) {
      return res.status(400).json({
        success: false,
        message: 'Campos obrigatórios: address, tokenAddress, network, name'
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
        contractTypeId: CONTRACT_TYPE_IDS.STAKE, // Hardcoded stake contract type ID
        abi: stakeABI, // Include the stake ABI
        isActive: true,
        metadata: {
          tokenAddress,
          description,
          adminAddress,
          contractType: 'stake',
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

    const updatedContract = await prisma.smartContract.update({
      where: { id },
      data: {
        abi: stakeABI,
        contractTypeId: CONTRACT_TYPE_IDS.STAKE,
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

module.exports = router;