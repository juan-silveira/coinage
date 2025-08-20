const contractTypeService = require('../services/contractType.service');
const userActionsService = require('../services/userActions.service');

class ContractTypeController {
  /**
   * Lista todos os tipos de contrato
   */
  async getAllContractTypes(req, res) {
    try {
      const contractTypes = await contractTypeService.getAllContractTypes();

      res.json({
        success: true,
        message: 'Contract types retrieved successfully',
        data: contractTypes
      });
    } catch (error) {
      console.error('Error getting contract types:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Obtém tipo de contrato por ID
   */
  async getContractTypeById(req, res) {
    try {
      const { id } = req.params;
      const contractType = await contractTypeService.getContractTypeById(id);

      res.json({
        success: true,
        message: 'Contract type retrieved successfully',
        data: contractType
      });
    } catch (error) {
      console.error('Error getting contract type:', error);
      const status = error.message === 'Contract type not found' ? 404 : 500;
      res.status(status).json({
        success: false,
        message: error.message,
        error: error.message
      });
    }
  }

  /**
   * Obtém tipos por categoria
   */
  async getContractTypesByCategory(req, res) {
    try {
      const { category } = req.params;
      
      const validCategories = ['token', 'nft', 'defi', 'escrow', 'governance', 'bridge', 'oracle', 'other'];
      if (!validCategories.includes(category)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid category'
        });
      }

      const contractTypes = await contractTypeService.getContractTypesByCategory(category);

      res.json({
        success: true,
        message: `Contract types for category '${category}' retrieved successfully`,
        data: contractTypes
      });
    } catch (error) {
      console.error('Error getting contract types by category:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Obtém ABI de um tipo de contrato
   */
  async getContractTypeABI(req, res) {
    try {
      const { id } = req.params;
      const result = await contractTypeService.getContractTypeABI(id);

      // Registrar visualização do ABI
      await userActionsService.logAction({
        userId: req.user?.id,
        companyId: req.user?.companyId,
        action: 'contract_abi_viewed',
        category: 'blockchain',
        details: {
          contractTypeId: id,
          contractTypeName: result.contractType.name,
          category: result.contractType.category
        },
        relatedId: id,
        relatedType: 'contract_type',
        ipAddress: userActionsService.getIpAddress(req),
        userAgent: req.headers['user-agent']
      });

      res.json({
        success: true,
        message: 'Contract type ABI retrieved successfully',
        data: result
      });
    } catch (error) {
      console.error('Error getting contract type ABI:', error);
      const status = error.message === 'Contract type not found' ? 404 : 500;
      res.status(status).json({
        success: false,
        message: error.message,
        error: error.message
      });
    }
  }

  /**
   * Cria novo tipo de contrato (Admin)
   */
  async createContractType(req, res) {
    try {
      if (!req.user.isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const { name, description, category, abiPath, version } = req.body;

      // Validações
      if (!name || !category || !abiPath) {
        return res.status(400).json({
          success: false,
          message: 'Name, category, and abiPath are required'
        });
      }

      const contractType = await contractTypeService.createContractType({
        name,
        description,
        category,
        abiPath,
        version
      });

      // Registrar criação do tipo
      await userActionsService.logAdmin(req.user.id, 'contract_type_created', null, req, {
        details: {
          contractTypeId: contractType.id,
          name: contractType.name,
          category: contractType.category
        }
      });

      res.status(201).json({
        success: true,
        message: 'Contract type created successfully',
        data: contractType
      });
    } catch (error) {
      console.error('Error creating contract type:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Atualiza tipo de contrato (Admin)
   */
  async updateContractType(req, res) {
    try {
      if (!req.user.isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const { id } = req.params;
      const updateData = req.body;

      const contractType = await contractTypeService.updateContractType(id, updateData);

      // Registrar atualização
      await userActionsService.logAdmin(req.user.id, 'contract_type_updated', null, req, {
        details: {
          contractTypeId: id,
          changes: updateData
        }
      });

      res.json({
        success: true,
        message: 'Contract type updated successfully',
        data: contractType
      });
    } catch (error) {
      console.error('Error updating contract type:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Exclui tipo de contrato (Admin)
   */
  async deleteContractType(req, res) {
    try {
      if (!req.user.isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const { id } = req.params;

      await contractTypeService.deleteContractType(id);

      // Registrar exclusão
      await userActionsService.logAdmin(req.user.id, 'contract_type_deleted', null, req, {
        details: { contractTypeId: id }
      });

      res.json({
        success: true,
        message: 'Contract type deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting contract type:', error);
      res.status(500).json({
        success: false,
        message: error.message,
        error: error.message
      });
    }
  }

  /**
   * Lista arquivos ABI disponíveis (Admin)
   */
  async getAvailableABIs(req, res) {
    try {
      if (!req.user.isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const abis = await contractTypeService.getAvailableABIs();

      res.json({
        success: true,
        message: 'Available ABIs retrieved successfully',
        data: abis
      });
    } catch (error) {
      console.error('Error getting available ABIs:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Cria contrato usando tipo específico
   */
  async createContractFromType(req, res) {
    try {
      const { contractTypeId } = req.params;
      const contractData = {
        ...req.body,
        companyId: req.user.companyId,
        deployedBy: req.user.id
      };

      const contract = await contractTypeService.createContractFromType(contractTypeId, contractData);

      // Registrar criação do contrato
      await userActionsService.logBlockchain(req.user.id, 'contract_deployed', req, {
        status: 'success',
        details: {
          contractId: contract.id,
          contractType: contract.contractType.name,
          address: contract.address,
          network: contract.network
        },
        relatedId: contract.id,
        relatedType: 'smart_contract'
      });

      res.status(201).json({
        success: true,
        message: 'Contract created successfully',
        data: contract
      });
    } catch (error) {
      console.error('Error creating contract from type:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Inicializa tipos padrão (Admin)
   */
  async initializeDefaultTypes(req, res) {
    try {
      if (!req.user.isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const results = await contractTypeService.initializeDefaultTypes();

      // Registrar inicialização
      await userActionsService.logAdmin(req.user.id, 'default_contract_types_initialized', null, req, {
        details: {
          createdCount: results.length,
          types: results.map(t => t.name)
        }
      });

      res.json({
        success: true,
        message: `Initialized ${results.length} default contract types`,
        data: results
      });
    } catch (error) {
      console.error('Error initializing default types:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Estatísticas dos tipos de contrato (Admin)
   */
  async getContractTypeStats(req, res) {
    try {
      if (!req.user.isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const stats = await contractTypeService.getContractTypeStats();

      res.json({
        success: true,
        message: 'Contract type statistics retrieved successfully',
        data: stats
      });
    } catch (error) {
      console.error('Error getting contract type stats:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Valida arquivo ABI (Admin)
   */
  async validateABI(req, res) {
    try {
      if (!req.user.isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const { abi } = req.body;

      if (!abi) {
        return res.status(400).json({
          success: false,
          message: 'ABI is required'
        });
      }

      const isValid = contractTypeService.validateABI(abi);

      res.json({
        success: true,
        message: 'ABI validation completed',
        data: {
          isValid,
          abi: isValid ? abi : null
        }
      });
    } catch (error) {
      console.error('Error validating ABI:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
}

module.exports = new ContractTypeController();