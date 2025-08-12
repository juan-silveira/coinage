const NotificationService = require('./notification.service');

class TokenAmountService {
  constructor() {
    this.notificationService = new NotificationService();
    this.previousBalances = new Map(); // userId -> previous balances
    this.changeThreshold = 0.01; // 1% de mudança para considerar significativa
  }

  /**
   * Inicializar o serviço
   */
  async initialize() {
    try {
      console.log('🚀 Inicializando TokenAmountService...');
      
      // Configurar intervalo para verificar mudanças nos saldos
      setInterval(() => {
        this.checkAllUserBalances();
      }, 5 * 60 * 1000); // Verificar a cada 5 minutos
      
      console.log('✅ TokenAmountService inicializado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao inicializar TokenAmountService:', error);
    }
  }

  /**
   * Verificar saldos de todos os usuários ativos
   */
  async checkAllUserBalances() {
    try {
      // Aqui você implementaria a lógica para buscar todos os usuários ativos
      // e verificar seus saldos atuais vs. anteriores
      console.log('🔍 Verificando mudanças nos saldos dos usuários...');
      
      // Por enquanto, vamos simular com alguns usuários de teste
      await this.simulateBalanceChanges();
      
    } catch (error) {
      console.error('❌ Erro ao verificar saldos dos usuários:', error);
    }
  }

  /**
   * Detectar mudanças nos saldos de um usuário específico
   */
  async detectBalanceChanges(userId, newBalances, publicKey) {
    try {
      const previousBalances = this.previousBalances.get(userId) || {};
      
      if (!newBalances.balancesTable) {
        return;
      }

      const changes = [];
      
      // Verificar cada token
      for (const [tokenSymbol, newAmount] of Object.entries(newBalances.balancesTable)) {
        const previousAmount = parseFloat(previousBalances[tokenSymbol] || 0);
        const currentAmount = parseFloat(newAmount);
        
        if (previousAmount > 0 && currentAmount !== previousAmount) {
          const changePercent = ((currentAmount - previousAmount) / previousAmount * 100);
          
          if (Math.abs(changePercent) >= this.changeThreshold) {
            changes.push({
              token: tokenSymbol,
              oldAmount: previousAmount,
              newAmount: currentAmount,
              changePercent: changePercent.toFixed(2),
              changeType: currentAmount > previousAmount ? 'aumentou' : 'diminuiu'
            });
          }
        }
      }
      
      // Criar notificações para mudanças significativas
      for (const change of changes) {
        await this.createBalanceChangeNotification(userId, change);
      }
      
      // Atualizar saldos anteriores
      this.previousBalances.set(userId, { ...newBalances.balancesTable });
      
      if (changes.length > 0) {
        console.log(`📊 Usuário ${userId}: ${changes.length} mudanças detectadas nos saldos`);
      }
      
    } catch (error) {
      console.error('❌ Erro ao detectar mudanças nos saldos:', error);
    }
  }

  /**
   * Criar notificação de mudança de saldo
   */
  async createBalanceChangeNotification(userId, change) {
    try {
      const notification = await this.notificationService.createBalanceChangeNotification(
        userId,
        change.token,
        change.oldAmount,
        change.newAmount,
        change.changePercent,
        change.changeType
      );
      
      console.log(`🔔 Notificação criada para usuário ${userId}: ${change.token} ${change.changeType}`);
      return notification;
      
    } catch (error) {
      console.error('❌ Erro ao criar notificação de mudança de saldo:', error);
      throw error;
    }
  }

  /**
   * Simular mudanças nos saldos para teste
   */
  async simulateBalanceChanges() {
    try {
      const testUsers = [
        { id: 'test-user-1', publicKey: '0x1234567890abcdef' },
        { id: 'test-user-2', publicKey: '0xabcdef1234567890' }
      ];
      
      for (const user of testUsers) {
        // Simular novos saldos
        const newBalances = {
          balancesTable: {
            'AZE': (Math.random() * 1000).toFixed(2),
            'cBRL': (Math.random() * 500).toFixed(2),
            'CNT': (Math.random() * 100).toFixed(2)
          }
        };
        
        // Detectar mudanças
        await this.detectBalanceChanges(user.id, newBalances, user.publicKey);
      }
      
    } catch (error) {
      console.error('❌ Erro ao simular mudanças nos saldos:', error);
    }
  }

  /**
   * Definir threshold para mudanças significativas
   */
  setChangeThreshold(threshold) {
    this.changeThreshold = threshold;
    console.log(`📊 Threshold de mudança definido para ${threshold}%`);
  }

  /**
   * Obter configuração atual do serviço
   */
  getServiceConfig() {
    return {
      changeThreshold: this.changeThreshold,
      checkInterval: '5 minutos',
      activeUsers: this.previousBalances.size,
      status: 'ativo'
    };
  }
}

module.exports = TokenAmountService;

