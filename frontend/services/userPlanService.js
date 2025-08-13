import api from './api';

/**
 * Serviço para gerenciamento de planos de usuário
 */
class UserPlanService {
  /**
   * Obtém todos os planos disponíveis
   */
  static async getAvailablePlans() {
    try {
      const response = await api.get('/api/user-plans');
      return response.data;
    } catch (error) {
      console.error('Erro ao obter planos:', error);
      throw error;
    }
  }

  /**
   * Obtém o plano atual de um usuário
   */
  static async getUserPlan(userId) {
    try {
      const response = await api.get(`/api/user-plans/user/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao obter plano do usuário:', error);
      throw error;
    }
  }

  /**
   * Atualiza o plano de um usuário (Admin)
   */
  static async updateUserPlan(userId, newPlan) {
    try {
      const response = await api.put(`/api/user-plans/user/${userId}`, {
        userPlan: newPlan
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar plano do usuário:', error);
      throw error;
    }
  }

  /**
   * Obtém estatísticas dos planos (Admin)
   */
  static async getPlanStatistics() {
    try {
      const response = await api.get('/api/user-plans/statistics');
      return response.data;
    } catch (error) {
      console.error('Erro ao obter estatísticas dos planos:', error);
      throw error;
    }
  }

  /**
   * Obtém o intervalo de sincronização para um plano
   */
  static async getSyncInterval(userPlan) {
    try {
      const response = await api.get(`/api/user-plans/sync-interval/${userPlan}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao obter intervalo de sincronização:', error);
      throw error;
    }
  }

  /**
   * Obtém o intervalo de sincronização em milissegundos para um plano
   */
  static getSyncIntervalMs(userPlan) {
    switch (userPlan) {
      case 'PREMIUM': return 1 * 60 * 1000; // 1 minuto
      case 'PRO': return 2 * 60 * 1000;     // 2 minutos
      case 'BASIC':
      default: return 5 * 60 * 1000;        // 5 minutos
    }
  }

  /**
   * Obtém o nome amigável de um plano
   */
  static getPlanName(userPlan) {
    switch (userPlan) {
      case 'PREMIUM': return 'Premium';
      case 'PRO': return 'Profissional';
      case 'BASIC':
      default: return 'Básico';
    }
  }

  /**
   * Obtém a descrição de um plano
   */
  static getPlanDescription(userPlan) {
    switch (userPlan) {
      case 'PREMIUM': return 'Auto-sync a cada 1 minuto';
      case 'PRO': return 'Auto-sync a cada 2 minutos';
      case 'BASIC':
      default: return 'Auto-sync a cada 5 minutos';
    }
  }

  /**
   * Obtém as funcionalidades de um plano
   */
  static getPlanFeatures(userPlan) {
    switch (userPlan) {
      case 'PREMIUM': 
        return [
          'Auto-sync premium',
          'Notificações instantâneas',
          'Acesso ao dashboard',
          'Relatórios avançados',
          'Suporte prioritário'
        ];
      case 'PRO': 
        return [
          'Auto-sync avançado',
          'Notificações em tempo real',
          'Acesso ao dashboard',
          'Relatórios detalhados'
        ];
      case 'BASIC':
      default: 
        return [
          'Auto-sync básico',
          'Notificações de mudanças',
          'Acesso ao dashboard'
        ];
    }
  }
}

export default UserPlanService;
