import api from './api';

class BanksService {
  // Listar todos os bancos
  async getAllBanks(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.type) params.append('type', filters.type);
      
      const response = await api.get(`/api/banks?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar bancos:', error);
      throw error;
    }
  }

  // Listar bancos populares
  async getPopularBanks() {
    try {
      const response = await api.get('/api/banks/popular');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar bancos populares:', error);
      throw error;
    }
  }

  // Buscar banco por código
  async getBankByCode(bankCode) {
    try {
      const response = await api.get(`/api/banks/${bankCode}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar banco por código:', error);
      throw error;
    }
  }

  // Validar código do banco
  async validateBankCode(bankCode) {
    try {
      const response = await api.get(`/api/banks/${bankCode}/validate`);
      return response.data;
    } catch (error) {
      console.error('Erro ao validar código do banco:', error);
      throw error;
    }
  }

  // Listar tipos de conta
  async getAccountTypes() {
    try {
      const response = await api.get('/api/banks/account-types');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar tipos de conta:', error);
      throw error;
    }
  }
}

export default new BanksService();