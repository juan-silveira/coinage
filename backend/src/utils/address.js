const { ethers } = require('ethers');

/**
 * Converte um endereço Ethereum para o formato checksum (EIP-55)
 * @param {string} address - Endereço Ethereum (com ou sem 0x prefix)
 * @returns {string} - Endereço no formato checksum
 */
function toChecksumAddress(address) {
  if (!address || typeof address !== 'string') {
    throw new Error('Endereço inválido');
  }

  try {
    // Usar ethers.js para converter para checksum address
    return ethers.getAddress(address);
  } catch (error) {
    throw new Error(`Endereço inválido: ${error.message}`);
  }
}

/**
 * Valida se um endereço está no formato checksum correto
 * @param {string} address - Endereço para validar
 * @returns {boolean} - true se válido, false caso contrário
 */
function isValidChecksum(address) {
  try {
    return toChecksumAddress(address) === address;
  } catch (error) {
    return false;
  }
}

/**
 * Normaliza um endereço para o formato checksum correto (para comparação/busca no banco)
 * @param {string} address - Endereço Ethereum
 * @returns {string} - Endereço no formato checksum com 0x
 */
function normalizeAddress(address) {
  if (!address || typeof address !== 'string') {
    throw new Error('Endereço inválido');
  }
  
  // Usar ethers para obter o endereço no formato checksum correto
  try {
    return ethers.getAddress(address);
  } catch (error) {
    throw new Error(`Endereço inválido: ${error.message}`);
  }
}

/**
 * Compara dois endereços Ethereum considerando o checksum
 * @param {string} address1 - Primeiro endereço
 * @param {string} address2 - Segundo endereço  
 * @returns {boolean} - true se os endereços são iguais
 */
function addressesEqual(address1, address2) {
  try {
    // Comparar os endereços no formato checksum
    return ethers.getAddress(address1) === ethers.getAddress(address2);
  } catch (error) {
    return false;
  }
}

module.exports = {
  toChecksumAddress,
  isValidChecksum,
  normalizeAddress,
  addressesEqual
};