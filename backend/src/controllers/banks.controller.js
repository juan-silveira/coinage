const { 
  BRAZILIAN_BANKS, 
  ACCOUNT_TYPES, 
  getBankByCode, 
  searchBanksByName,
  getBanksByType,
  validateBankCode 
} = require('../data/banks');

class BanksController {
  // Listar todos os bancos
  async getAllBanks(req, res) {
    try {
      const { search, type } = req.query;

      let banks = BRAZILIAN_BANKS;

      // Filtrar por nome se fornecido
      if (search) {
        banks = searchBanksByName(search);
      }

      // Filtrar por tipo se fornecido
      if (type) {
        banks = getBanksByType(type);
      }

      return res.json({
        success: true,
        data: {
          banks: banks.map(bank => ({
            code: bank.code,
            name: bank.name,
            shortName: bank.shortName,
            logo: bank.logo,
            color: bank.color,
            type: bank.type
          })),
          total: banks.length
        },
        message: 'Bancos carregados com sucesso'
      });

    } catch (error) {
      console.error('Erro ao buscar bancos:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  // Buscar banco por código
  async getBankByCode(req, res) {
    try {
      const { bankCode } = req.params;

      const bank = getBankByCode(bankCode);

      if (!bank) {
        return res.status(404).json({
          success: false,
          message: 'Banco não encontrado'
        });
      }

      return res.json({
        success: true,
        data: { bank },
        message: 'Banco encontrado'
      });

    } catch (error) {
      console.error('Erro ao buscar banco:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  // Validar código do banco
  async validateBankCode(req, res) {
    try {
      const { bankCode } = req.params;

      const validation = validateBankCode(bankCode);

      return res.json({
        success: true,
        data: validation,
        message: validation.isValid ? 'Código válido' : 'Código inválido'
      });

    } catch (error) {
      console.error('Erro ao validar código do banco:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  // Listar tipos de conta
  async getAccountTypes(req, res) {
    try {
      return res.json({
        success: true,
        data: {
          accountTypes: ACCOUNT_TYPES
        },
        message: 'Tipos de conta carregados com sucesso'
      });

    } catch (error) {
      console.error('Erro ao buscar tipos de conta:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  // Buscar bancos populares (os mais usados)
  async getPopularBanks(req, res) {
    try {
      // Códigos dos bancos mais populares no Brasil
      const popularBankCodes = ['001', '341', '237', '104', '033', '077', '260', '323'];
      
      const popularBanks = popularBankCodes
        .map(code => getBankByCode(code))
        .filter(bank => bank);

      return res.json({
        success: true,
        data: {
          banks: popularBanks.map(bank => ({
            code: bank.code,
            name: bank.name,
            shortName: bank.shortName,
            logo: bank.logo,
            color: bank.color,
            type: bank.type
          }))
        },
        message: 'Bancos populares carregados com sucesso'
      });

    } catch (error) {
      console.error('Erro ao buscar bancos populares:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }
}

module.exports = new BanksController();