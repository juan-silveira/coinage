import api from './api';

class PixKeysService {
  // Listar chaves PIX do usuário
  async getPixKeys() {
    try {
      const response = await api.get('/api/pix-keys');
      return response.data;
    } catch (error) {
      // Silenciar erro quando é esperado que não haja dados
      // console.error('Erro ao buscar chaves PIX:', error);
      throw error;
    }
  }

  // Criar nova chave PIX
  async createPixKey(pixKeyData) {
    try {
      const response = await api.post('/api/pix-keys', pixKeyData);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar chave PIX:', error);
      throw error;
    }
  }

  // Atualizar chave PIX
  async updatePixKey(pixKeyId, updateData) {
    try {
      const response = await api.put(`/api/pix-keys/${pixKeyId}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar chave PIX:', error);
      throw error;
    }
  }

  // Remover chave PIX
  async deletePixKey(pixKeyId) {
    try {
      const response = await api.delete(`/api/pix-keys/${pixKeyId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao remover chave PIX:', error);
      throw error;
    }
  }

  // Definir chave como padrão
  async setDefaultPixKey(pixKeyId) {
    try {
      const response = await api.patch(`/api/pix-keys/${pixKeyId}/set-default`);
      return response.data;
    } catch (error) {
      console.error('Erro ao definir chave padrão:', error);
      throw error;
    }
  }

  // Verificar chave PIX
  async verifyPixKey(pixKeyId) {
    try {
      const response = await api.post(`/api/pix-keys/${pixKeyId}/verify`);
      return response.data;
    } catch (error) {
      console.error('Erro ao verificar chave PIX:', error);
      throw error;
    }
  }
}

export default new PixKeysService();