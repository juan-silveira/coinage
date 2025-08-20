const fs = require('fs').promises;
const path = require('path');
const prisma = require('../config/prisma');

class ContractTypeService {
  constructor() {
    this.abiBasePath = path.join(__dirname, '../contracts/abis');
  }

  /**
   * Carrega ABI de um arquivo
   */
  async loadABI(abiPath) {
    try {
      const fullPath = path.join(this.abiBasePath, abiPath);
      const abiData = await fs.readFile(fullPath, 'utf8');
      return JSON.parse(abiData);
    } catch (error) {
      console.error('Error loading ABI:', error);
      throw new Error(`Failed to load ABI from ${abiPath}: ${error.message}`);
    }
  }

  /**
   * Cria um novo tipo de contrato
   */
  async createContractType(data) {
    try {
      const { name, description, category, abiPath, version } = data;

      // Verificar se o arquivo ABI existe
      await this.loadABI(abiPath);

      const contractType = await prisma.contractType.create({
        data: {
          name,
          description,
          category,
          abiPath,
          version: version || '1.0.0'
        }
      });

      return contractType;
    } catch (error) {
      console.error('Error creating contract type:', error);
      throw error;
    }
  }

  /**
   * Obtém todos os tipos de contrato
   */
  async getAllContractTypes() {
    try {
      const contractTypes = await prisma.contractType.findMany({
        where: { isActive: true },
        include: {
          _count: {
            select: { contracts: true }
          }
        },
        orderBy: [
          { category: 'asc' },
          { name: 'asc' }
        ]
      });

      return contractTypes.map(type => ({
        ...type,
        contractsCount: type._count.contracts
      }));
    } catch (error) {
      console.error('Error getting contract types:', error);
      throw error;
    }
  }

  /**
   * Obtém tipo de contrato por ID
   */
  async getContractTypeById(id) {
    try {
      const contractType = await prisma.contractType.findUnique({
        where: { id },
        include: {
          contracts: {
            select: {
              id: true,
              name: true,
              address: true,
              network: true,
              isActive: true,
              deployedAt: true
            },
            where: { isActive: true }
          }
        }
      });

      if (!contractType) {
        throw new Error('Contract type not found');
      }

      return contractType;
    } catch (error) {
      console.error('Error getting contract type:', error);
      throw error;
    }
  }

  /**
   * Obtém tipos por categoria
   */
  async getContractTypesByCategory(category) {
    try {
      const contractTypes = await prisma.contractType.findMany({
        where: {
          category,
          isActive: true
        },
        include: {
          _count: {
            select: { contracts: true }
          }
        },
        orderBy: { name: 'asc' }
      });

      return contractTypes.map(type => ({
        ...type,
        contractsCount: type._count.contracts
      }));
    } catch (error) {
      console.error('Error getting contract types by category:', error);
      throw error;
    }
  }

  /**
   * Obtém ABI de um tipo de contrato
   */
  async getContractTypeABI(id) {
    try {
      const contractType = await prisma.contractType.findUnique({
        where: { id }
      });

      if (!contractType) {
        throw new Error('Contract type not found');
      }

      const abi = await this.loadABI(contractType.abiPath);
      
      return {
        contractType: {
          id: contractType.id,
          name: contractType.name,
          category: contractType.category,
          version: contractType.version
        },
        abi
      };
    } catch (error) {
      console.error('Error getting contract type ABI:', error);
      throw error;
    }
  }

  /**
   * Atualiza tipo de contrato
   */
  async updateContractType(id, data) {
    try {
      const { name, description, abiPath, version, isActive } = data;

      // Se abiPath foi alterado, verificar se o arquivo existe
      if (abiPath) {
        await this.loadABI(abiPath);
      }

      const contractType = await prisma.contractType.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(description && { description }),
          ...(abiPath && { abiPath }),
          ...(version && { version }),
          ...(typeof isActive === 'boolean' && { isActive })
        }
      });

      return contractType;
    } catch (error) {
      console.error('Error updating contract type:', error);
      throw error;
    }
  }

  /**
   * Exclui tipo de contrato
   */
  async deleteContractType(id) {
    try {
      // Verificar se há contratos usando este tipo
      const contractsCount = await prisma.smartContract.count({
        where: { contractTypeId: id }
      });

      if (contractsCount > 0) {
        throw new Error(`Cannot delete contract type: ${contractsCount} contracts are using it`);
      }

      await prisma.contractType.delete({
        where: { id }
      });

      return true;
    } catch (error) {
      console.error('Error deleting contract type:', error);
      throw error;
    }
  }

  /**
   * Lista todos os arquivos ABI disponíveis
   */
  async getAvailableABIs() {
    try {
      const abis = {};
      const categories = ['token', 'nft', 'defi', 'escrow', 'governance', 'bridge', 'oracle', 'other'];

      for (const category of categories) {
        const categoryPath = path.join(this.abiBasePath, category);
        
        try {
          const files = await fs.readdir(categoryPath);
          abis[category] = files
            .filter(file => file.endsWith('.json'))
            .map(file => ({
              filename: file,
              path: `${category}/${file}`,
              name: file.replace('.json', '').replace('-', ' ')
            }));
        } catch (error) {
          abis[category] = [];
        }
      }

      return abis;
    } catch (error) {
      console.error('Error getting available ABIs:', error);
      throw error;
    }
  }

  /**
   * Cria contrato usando um tipo específico
   */
  async createContractFromType(contractTypeId, contractData) {
    try {
      const contractType = await prisma.contractType.findUnique({
        where: { id: contractTypeId }
      });

      if (!contractType) {
        throw new Error('Contract type not found');
      }

      // Carregar ABI do tipo
      const abi = await this.loadABI(contractType.abiPath);

      const contract = await prisma.smartContract.create({
        data: {
          ...contractData,
          contractTypeId,
          abi // Usar ABI do tipo como padrão
        }
      });

      return {
        ...contract,
        contractType
      };
    } catch (error) {
      console.error('Error creating contract from type:', error);
      throw error;
    }
  }

  /**
   * Inicializa tipos de contrato padrão
   */
  async initializeDefaultTypes() {
    try {
      const defaultTypes = [
        {
          name: 'ERC-20 Standard',
          description: 'Token ERC-20 padrão com funcionalidades básicas',
          category: 'token',
          abiPath: 'token/erc20-standard.json',
          version: '1.0.0'
        },
        {
          name: 'ERC-20 Mintable',
          description: 'Token ERC-20 com funcionalidades de mint/burn e gasless',
          category: 'token',
          abiPath: 'token/erc20-mintable.json',
          version: '1.0.0'
        },
        {
          name: 'ERC-721 NFT',
          description: 'NFT ERC-721 padrão com funcionalidades básicas',
          category: 'nft',
          abiPath: 'nft/erc721-standard.json',
          version: '1.0.0'
        },
        {
          name: 'Staking Rewards',
          description: 'Contrato de staking com sistema de recompensas',
          category: 'defi',
          abiPath: 'defi/staking-rewards.json',
          version: '1.0.0'
        }
      ];

      const results = [];

      for (const typeData of defaultTypes) {
        try {
          // Verificar se já existe
          const existing = await prisma.contractType.findUnique({
            where: { name: typeData.name }
          });

          if (!existing) {
            const created = await this.createContractType(typeData);
            results.push(created);
            console.log(`✅ Created contract type: ${typeData.name}`);
          } else {
            console.log(`⚠️ Contract type already exists: ${typeData.name}`);
          }
        } catch (error) {
          console.error(`❌ Error creating contract type ${typeData.name}:`, error.message);
        }
      }

      return results;
    } catch (error) {
      console.error('Error initializing default types:', error);
      throw error;
    }
  }

  /**
   * Valida ABI
   */
  validateABI(abi) {
    try {
      if (!Array.isArray(abi)) {
        throw new Error('ABI must be an array');
      }

      const requiredFields = ['name', 'type'];
      
      for (const item of abi) {
        if (typeof item !== 'object') {
          throw new Error('ABI items must be objects');
        }
        
        // Verificar campos obrigatórios apenas para functions e events
        if (['function', 'event'].includes(item.type)) {
          for (const field of requiredFields) {
            if (!item[field]) {
              throw new Error(`ABI item missing required field: ${field}`);
            }
          }
        }
      }

      return true;
    } catch (error) {
      console.error('ABI validation error:', error);
      return false;
    }
  }

  /**
   * Estatísticas de uso dos tipos
   */
  async getContractTypeStats() {
    try {
      const stats = await prisma.contractType.findMany({
        select: {
          id: true,
          name: true,
          category: true,
          _count: {
            select: { contracts: true }
          }
        },
        where: { isActive: true }
      });

      const categoryStats = await prisma.contractType.groupBy({
        by: ['category'],
        _count: {
          id: true
        },
        where: { isActive: true }
      });

      return {
        types: stats.map(type => ({
          ...type,
          contractsCount: type._count.contracts
        })),
        categories: categoryStats.map(cat => ({
          category: cat.category,
          typesCount: cat._count.id
        })),
        totalTypes: stats.length,
        totalContracts: stats.reduce((sum, type) => sum + type._count.contracts, 0)
      };
    } catch (error) {
      console.error('Error getting contract type stats:', error);
      throw error;
    }
  }
}

module.exports = new ContractTypeService();