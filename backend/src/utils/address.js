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
 * Normaliza um endereço para lowercase (para comparação/busca no banco)
 * @param {string} address - Endereço Ethereum
 * @returns {string} - Endereço em lowercase
 */
function normalizeAddress(address) {
  if (!address || typeof address !== 'string') {
    throw new Error('Endereço inválido');
  }
  
  const cleanAddress = address.replace(/^0x/i, '');
  return cleanAddress.toLowerCase();
}

/**
 * Compara dois endereços Ethereum ignorando case
 * @param {string} address1 - Primeiro endereço
 * @param {string} address2 - Segundo endereço  
 * @returns {boolean} - true se os endereços são iguais
 */
function addressesEqual(address1, address2) {
  try {
    return normalizeAddress(address1) === normalizeAddress(address2);
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