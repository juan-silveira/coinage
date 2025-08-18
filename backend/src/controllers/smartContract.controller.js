const smartContractService = require('../services/smartContractService');

/**
 * Obter ABI por tipo de contrato
 */
const getABIByType = async (req, res) => {
  try {
    const { type } = req.params;
    
    if (!type) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de contrato é obrigatório'
      });
    }

    const abi = smartContractService.getABIByType(type);
    
    res.json({
      success: true,
      data: {
        contractType: type.toUpperCase(),
        abi: abi
      },
      message: `ABI do contrato ${type.toUpperCase()} obtido com sucesso`
    });
  } catch (error) {
    console.error('Erro ao obter ABI:', error);
    res.status(404).json({
      success: false,
      message: error.message || 'Tipo de contrato não encontrado'
    });
  }
};

/**
 * Listar todos os tipos de contratos disponíveis
 */
const getAvailableContractTypes = async (req, res) => {
  try {
    const types = smartContractService.getAvailableContractTypes();
    
    res.json({
      success: true,
      data: types,
      message: 'Tipos de contratos disponíveis obtidos com sucesso'
    });
  } catch (error) {
    console.error('Erro ao listar tipos de contratos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * Obter informações sobre um ABI específico
 */
const getABIInfo = async (req, res) => {
  try {
    const { abiName } = req.params;
    
    if (!abiName) {
      return res.status(400).json({
        success: false,
        message: 'Nome do ABI é obrigatório'
      });
    }

    const info = smartContractService.getABIInfo(abiName);
    
    if (!info.isValid && info.error) {
      return res.status(404).json({
        success: false,
        message: info.error
      });
    }
    
    res.json({
      success: true,
      data: info,
      message: `Informações do ABI ${abiName} obtidas com sucesso`
    });
  } catch (error) {
    console.error('Erro ao obter informações do ABI:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * Obter ABIs padrão (token e stake)
 */
const getDefaultABIs = async (req, res) => {
  try {
    const tokenABI = smartContractService.getDefaultTokenABI();
    const stakeABI = smartContractService.getDefaultStakeABI();
    
    res.json({
      success: true,
      data: {
        default_token_abi: tokenABI,
        default_stake_abi: stakeABI
      },
      message: 'ABIs padrão obtidos com sucesso'
    });
  } catch (error) {
    console.error('Erro ao obter ABIs padrão:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao carregar ABIs padrão'
    });
  }
};

module.exports = {
  getABIByType,
  getAvailableContractTypes,
  getABIInfo,
  getDefaultABIs
};