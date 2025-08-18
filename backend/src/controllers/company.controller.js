const companyService = require('../services/company.service');
const userService = require('../services/user.service');
const logService = require('../services/log.service');

/**
 * Controller para gerenciamento de empresas (instituições)
 */
class CompanyController {
  /**
   * Cria um novo empresa (instituição)
   */
  async createCompany(req, res) {
    try {
      const companyData = req.body;
      
      // Validar campos obrigatórios
      if (!companyData.name) {
        return res.status(400).json({
          success: false,
          message: 'Nome é obrigatório'
        });
      }

      // Validar tamanho do nome
      if (companyData.name.length < 2 || companyData.name.length > 255) {
        return res.status(400).json({
          success: false,
          message: 'Nome deve ter entre 2 e 255 caracteres'
        });
      }

      // Validar formato do nome (apenas letras, números, espaços e caracteres especiais comuns)
      const nameRegex = /^[a-zA-ZÀ-ÿ0-9\s\-_.,&()]+$/;
      if (!nameRegex.test(companyData.name)) {
        return res.status(400).json({
          success: false,
          message: 'Nome contém caracteres inválidos'
        });
      }

      // Validar rate limits se fornecidos
      if (companyData.rateLimit) {
        const requiredLimits = ['requestsPerMinute', 'requestsPerHour', 'requestsPerDay'];
        for (const limit of requiredLimits) {
          if (typeof companyData.rateLimit[limit] !== 'number' || companyData.rateLimit[limit] < 1) {
            return res.status(400).json({
              success: false,
              message: `Rate limit '${limit}' deve ser um número maior que 0`
            });
          }
        }

        // Validar hierarquia dos limites
        if (companyData.rateLimit.requestsPerMinute > companyData.rateLimit.requestsPerHour) {
          return res.status(400).json({
            success: false,
            message: 'requestsPerMinute não pode ser maior que requestsPerHour'
          });
        }

        if (companyData.rateLimit.requestsPerHour > companyData.rateLimit.requestsPerDay) {
          return res.status(400).json({
            success: false,
            message: 'requestsPerHour não pode ser maior que requestsPerDay'
          });
        }
      }

      const result = await companyService.createCompany(companyData);
      
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao criar empresa',
        error: error.message
      });
    }
  }

  /**
   * Obtém um empresa por ID
   */
  async getCompanyById(req, res) {
    try {
      const { id } = req.params;
      const result = await companyService.getCompanyById(id);
      
      res.status(200).json(result);
    } catch (error) {
      res.status(404).json({
        success: false,
        message: 'Erro ao obter empresa',
        error: error.message
      });
    }
  }

  /**
   * Lista empresas com paginação
   */
  async listCompanies(req, res) {
    try {
      const { page, limit, isActive, search } = req.query;
      const options = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        search
      };
      
      const result = await companyService.listCompanies(options);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao listar empresas',
        error: error.message
      });
    }
  }

  /**
   * Atualiza um empresa
   */
  async updateCompany(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const result = await companyService.updateCompany(id, updateData);
      
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao atualizar empresa',
        error: error.message
      });
    }
  }

  /**
   * Desativa um empresa
   */
  async deactivateCompany(req, res) {
    try {
      const { id } = req.params;
      const result = await companyService.deactivateCompany(id);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao desativar empresa',
        error: error.message
      });
    }
  }

  /**
   * Reativa um empresa
   */
  async activateCompany(req, res) {
    try {
      const { id } = req.params;
      const result = await companyService.activateCompany(id);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao reativar empresa',
        error: error.message
      });
    }
  }

  /**
   * Atualiza rate limits de um empresa
   */
  async updateRateLimits(req, res) {
    try {
      const { id } = req.params;
      const { rateLimit } = req.body;
      
      if (!rateLimit) {
        return res.status(400).json({
          success: false,
          message: 'Rate limits são obrigatórios'
        });
      }

      const result = await companyService.updateRateLimits(id, rateLimit);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao atualizar rate limits',
        error: error.message
      });
    }
  }

  /**
   * Obtém estatísticas de uso de um empresa
   */
  async getCompanyUsageStats(req, res) {
    try {
      const { id } = req.params;
      const result = await companyService.getCompanyUsageStats(id);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao obter estatísticas de uso',
        error: error.message
      });
    }
  }

  /**
   * Lista usuários de um empresa
   */
  async getCompanyUsers(req, res) {
    try {
      const { id } = req.params;
      const { page, limit, isActive, search } = req.query;
      
      const options = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        search
      };

      const result = await userService.getUsersByCompanyId(id, options);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao listar usuários do empresa',
        error: error.message
      });
    }
  }

  /**
   * Obtém estatísticas dos usuários de um empresa
   */
  async getCompanyUsersStats(req, res) {
    try {
      const { id } = req.params;
      const result = await userService.getCompanyUsersStats(id);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao obter estatísticas dos usuários',
        error: error.message
      });
    }
  }

  /**
   * Obtém estatísticas de requests de um empresa
   */
  async getCompanyRequestsStats(req, res) {
    try {
      const { id } = req.params;
      const { period = 'day' } = req.query;
      
      const result = await logService.getCompanyRequestsStats(id, period);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao obter estatísticas de requests',
        error: error.message
      });
    }
  }

  /**
   * Testa o serviço de empresas
   */
  async testService(req, res) {
    try {
      const result = await companyService.testService();
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro no teste do serviço',
        error: error.message
      });
    }
  }
}

module.exports = new CompanyController(); 