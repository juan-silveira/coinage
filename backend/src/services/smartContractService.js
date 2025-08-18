const fs = require('fs');
const path = require('path');

/**
 * Serviço para gerenciar smart contracts e seus ABIs
 */
class SmartContractService {
  constructor() {
    this.abiCache = new Map();
    this.contractTypes = {
      TOKEN: 'default_token_abi',
      STAKE: 'default_stake_abi'
    };
  }

  /**
   * Carrega um ABI do arquivo
   * @param {string} abiName - Nome do arquivo ABI (sem extensão)
   * @returns {Array} ABI JSON
   */
  loadABI(abiName) {
    // Verificar cache primeiro
    if (this.abiCache.has(abiName)) {
      return this.abiCache.get(abiName);
    }

    try {
      const abiPath = path.join(__dirname, '..', 'contracts', 'abis', `${abiName}.json`);
      
      if (!fs.existsSync(abiPath)) {
        throw new Error(`ABI file not found: ${abiName}.json`);
      }

      const abiContent = fs.readFileSync(abiPath, 'utf8');
      const abi = JSON.parse(abiContent);
      
      // Armazenar no cache
      this.abiCache.set(abiName, abi);
      
      console.log(`✅ [SmartContract] ABI carregado: ${abiName}`);
      return abi;
    } catch (error) {
      console.error(`❌ [SmartContract] Erro ao carregar ABI ${abiName}:`, error.message);
      throw error;
    }
  }

  /**
   * Obtém o ABI do token padrão
   * @returns {Array} Token ABI
   */
  getDefaultTokenABI() {
    return this.loadABI(this.contractTypes.TOKEN);
  }

  /**
   * Obtém o ABI do stake padrão
   * @returns {Array} Stake ABI
   */
  getDefaultStakeABI() {
    return this.loadABI(this.contractTypes.STAKE);
  }

  /**
   * Obtém ABI por tipo de contrato
   * @param {string} contractType - Tipo do contrato (TOKEN, STAKE, etc.)
   * @returns {Array} ABI
   */
  getABIByType(contractType) {
    const upperType = contractType.toUpperCase();
    
    if (!this.contractTypes[upperType]) {
      throw new Error(`Tipo de contrato não suportado: ${contractType}`);
    }

    return this.loadABI(this.contractTypes[upperType]);
  }

  /**
   * Lista todos os tipos de contratos disponíveis
   * @returns {Object} Tipos de contratos
   */
  getAvailableContractTypes() {
    return { ...this.contractTypes };
  }

  /**
   * Adiciona um novo tipo de contrato
   * @param {string} typeName - Nome do tipo (ex: 'NFT', 'ESCROW')
   * @param {string} abiFileName - Nome do arquivo ABI (sem extensão)
   */
  addContractType(typeName, abiFileName) {
    const upperTypeName = typeName.toUpperCase();
    this.contractTypes[upperTypeName] = abiFileName;
    console.log(`✅ [SmartContract] Novo tipo de contrato adicionado: ${upperTypeName} -> ${abiFileName}`);
  }

  /**
   * Limpa o cache de ABIs
   */
  clearCache() {
    this.abiCache.clear();
    console.log('🧹 [SmartContract] Cache de ABIs limpo');
  }

  /**
   * Valida se um ABI é válido
   * @param {Array} abi - ABI para validar
   * @returns {boolean} True se válido
   */
  validateABI(abi) {
    if (!Array.isArray(abi)) {
      return false;
    }

    // Verificar se cada item tem os campos básicos
    return abi.every(item => {
      return typeof item === 'object' && 
             item.hasOwnProperty('type') &&
             ['function', 'event', 'constructor', 'error'].includes(item.type);
    });
  }

  /**
   * Obtém informações sobre um ABI
   * @param {string} abiName - Nome do ABI
   * @returns {Object} Informações do ABI
   */
  getABIInfo(abiName) {
    try {
      const abi = this.loadABI(abiName);
      
      const info = {
        name: abiName,
        totalItems: abi.length,
        functions: abi.filter(item => item.type === 'function').length,
        events: abi.filter(item => item.type === 'event').length,
        errors: abi.filter(item => item.type === 'error').length,
        constructors: abi.filter(item => item.type === 'constructor').length,
        isValid: this.validateABI(abi)
      };

      return info;
    } catch (error) {
      return {
        name: abiName,
        error: error.message,
        isValid: false
      };
    }
  }
}

// Exportar instância singleton
module.exports = new SmartContractService();