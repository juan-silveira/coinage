const prismaConfig = require('../config/prisma');

/**
 * Serviço para gerenciamento de planos de usuário
 */
class UserPlanService {
  /**
   * Obtém todos os planos disponíveis
   */
  static async getAvailablePlans() {
    return [
      {
        id: 'BASIC',
        name: 'Básico',
        description: 'Auto-sync a cada 5 minutos',
        syncInterval: 5,
        syncIntervalMs: 5 * 60 * 1000,
        features: ['Auto-sync básico', 'Notificações de mudanças', 'Acesso ao dashboard']
      },
      {
        id: 'PRO',
        name: 'Profissional',
        description: 'Auto-sync a cada 2 minutos',
        syncInterval: 2,
        syncIntervalMs: 2 * 60 * 1000,
        features: ['Auto-sync avançado', 'Notificações em tempo real', 'Acesso ao dashboard', 'Relatórios detalhados']
      },
      {
        id: 'PREMIUM',
        name: 'Premium',
        description: 'Auto-sync a cada 1 minuto',
        syncInterval: 1,
        syncIntervalMs: 1 * 60 * 1000,
        features: ['Auto-sync premium', 'Notificações instantâneas', 'Acesso ao dashboard', 'Relatórios avançados', 'Suporte prioritário']
      }
    ];
  }

  /**
   * Obtém o plano atual de um usuário
   */
  static async getUserPlan(userId) {
    try {
      const prisma = prismaConfig.getPrisma();
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { userPlan: true }
      });
      
      return user?.userPlan || 'BASIC';
    } catch (error) {
      console.error('Erro ao obter plano do usuário:', error);
      return 'BASIC';
    }
  }

  /**
   * Atualiza o plano de um usuário
   */
  static async updateUserPlan(userId, newPlan) {
    try {
      // Validar se o plano é válido
      const validPlans = ['BASIC', 'PRO', 'PREMIUM'];
      if (!validPlans.includes(newPlan)) {
        throw new Error('Plano inválido');
      }

      const prisma = prismaConfig.getPrisma();
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { userPlan: newPlan },
        select: { 
          id: true, 
          email: true, 
          name: true, 
          userPlan: true,
          updatedAt: true 
        }
      });

      return {
        success: true,
        data: updatedUser,
        message: `Plano atualizado para ${newPlan} com sucesso`
      };
    } catch (error) {
      console.error('Erro ao atualizar plano do usuário:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Obtém estatísticas de planos dos usuários
   */
  static async getPlanStatistics() {
    try {
      const prisma = prismaConfig.getPrisma();
      const stats = await prisma.user.groupBy({
        by: ['userPlan'],
        _count: {
          userPlan: true
        },
        where: {
          isActive: true
        }
      });

      const totalUsers = await prisma.user.count({
        where: { isActive: true }
      });

      const planStats = stats.map(stat => ({
        plan: stat.userPlan,
        count: stat._count.userPlan,
        percentage: ((stat._count.userPlan / totalUsers) * 100).toFixed(2)
      }));

      return {
        success: true,
        data: {
          totalUsers,
          planStats,
          summary: {
            basic: planStats.find(p => p.plan === 'BASIC')?.count || 0,
            pro: planStats.find(p => p.plan === 'PRO')?.count || 0,
            premium: planStats.find(p => p.plan === 'PREMIUM')?.count || 0
          }
        }
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas dos planos:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Obtém o intervalo de sincronização em milissegundos para um plano
   */
  static getSyncIntervalForPlan(userPlan) {
    switch (userPlan) {
      case 'PREMIUM': return 1 * 60 * 1000; // 1 minuto
      case 'PRO': return 2 * 60 * 1000;     // 2 minutos
      case 'BASIC':
      default: return 5 * 60 * 1000;        // 5 minutos
    }
  }
}

module.exports = UserPlanService;
