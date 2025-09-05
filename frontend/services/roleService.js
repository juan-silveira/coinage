/**
 * Role Service - Gerenciamento de roles em contratos
 * 
 * Serviço para verificar e conceder roles nos contratos ERC20 com AccessControl
 */

import { ethers } from 'ethers';
import { 
  CONTRACT_ROLES, 
  ROLE_NAMES, 
  ACCESS_CONTROL_ABI, 
  CONTRACT_ADDRESSES 
} from '@/constants/contractRoles';

class RoleService {
  constructor() {
    this.provider = null;
    this.signer = null;
  }

  /**
   * Inicializa o provider (MetaMask ou similar)
   */
  async initializeProvider() {
    if (typeof window !== 'undefined' && window.ethereum) {
      this.provider = new ethers.BrowserProvider(window.ethereum);
      await this.provider.send("eth_requestAccounts", []);
      this.signer = await this.provider.getSigner();
      return true;
    }
    throw new Error('MetaMask não encontrado');
  }

  /**
   * Verifica se um endereço tem uma role específica
   */
  async hasRole(contractAddress, role, accountAddress) {
    try {
      if (!this.provider) {
        await this.initializeProvider();
      }

      const contract = new ethers.Contract(
        contractAddress,
        ACCESS_CONTROL_ABI,
        this.provider
      );

      return await contract.hasRole(role, accountAddress);
    } catch (error) {
      console.error('Erro ao verificar role:', error);
      throw error;
    }
  }

  /**
   * Verifica todas as roles de um endereço
   */
  async getAllRoles(contractAddress, accountAddress) {
    const roles = {};
    
    for (const [roleName, roleHash] of Object.entries(CONTRACT_ROLES)) {
      try {
        roles[roleName] = await this.hasRole(contractAddress, roleHash, accountAddress);
      } catch (error) {
        console.error(`Erro ao verificar role ${roleName}:`, error);
        roles[roleName] = false;
      }
    }

    return roles;
  }

  /**
   * Concede uma role para um endereço
   */
  async grantRole(contractAddress, role, accountAddress) {
    try {
      if (!this.signer) {
        await this.initializeProvider();
      }

      const contract = new ethers.Contract(
        contractAddress,
        ACCESS_CONTROL_ABI,
        this.signer
      );

      const tx = await contract.grantRole(role, accountAddress);
      return await tx.wait();
    } catch (error) {
      console.error('Erro ao conceder role:', error);
      throw error;
    }
  }

  /**
   * Revoga uma role de um endereço
   */
  async revokeRole(contractAddress, role, accountAddress) {
    try {
      if (!this.signer) {
        await this.initializeProvider();
      }

      const contract = new ethers.Contract(
        contractAddress,
        ACCESS_CONTROL_ABI,
        this.signer
      );

      const tx = await contract.revokeRole(role, accountAddress);
      return await tx.wait();
    } catch (error) {
      console.error('Erro ao revogar role:', error);
      throw error;
    }
  }

  /**
   * Obter endereço da carteira conectada
   */
  async getConnectedAddress() {
    if (!this.signer) {
      await this.initializeProvider();
    }
    return await this.signer.getAddress();
  }

  /**
   * Verifica se o usuário conectado é admin do contrato
   */
  async isAdmin(contractAddress) {
    try {
      const connectedAddress = await this.getConnectedAddress();
      return await this.hasRole(
        contractAddress, 
        CONTRACT_ROLES.DEFAULT_ADMIN_ROLE, 
        connectedAddress
      );
    } catch (error) {
      console.error('Erro ao verificar admin:', error);
      return false;
    }
  }

  /**
   * Formatar endereço para exibição
   */
  formatAddress(address) {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  }

  /**
   * Validar endereço Ethereum
   */
  isValidAddress(address) {
    try {
      return ethers.isAddress(address);
    } catch {
      return false;
    }
  }
}

export const roleService = new RoleService();
export default roleService;