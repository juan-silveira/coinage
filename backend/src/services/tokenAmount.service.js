const NotificationService = require('./notification.service');
const redisService = require('./redis.service');

class TokenAmountService {
  constructor() {
    this.notificationService = new NotificationService();
    this.changeThreshold = 0.01; // 1% de mudança para considerar significativa
  }

  /**
   * Inicializar o serviço
   */
  async initialize() {
    try {
      console.log('🚀 Inicializando TokenAmountService...');
      
      // TEMPORARIAMENTE DESABILITADO - Configurar intervalo para verificar mudanças nos saldos
      // setInterval(() => {
      //   this.checkAllUserBalances();
      // }, 5 * 60 * 1000); // Verificar a cada 5 minutos
      
      console.log('✅ TokenAmountService inicializado (com loop de verificação DESABILITADO temporariamente)');
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
      
      // TEMPORARIAMENTE DESABILITADO - Por enquanto, vamos simular com alguns usuários de teste
      // await this.simulateBalanceChanges();
      
    } catch (error) {
      console.error('❌ Erro ao verificar saldos dos usuários:', error);
    }
  }

  /**
   * Obter balances anteriores do Redis
   */
  async getPreviousBalances(userId, network = 'mainnet') {
    try {
      if (!redisService.isConnected || !redisService.company) {
        console.warn('⚠️ Redis não conectado, retornando balances vazios');
        return {};
      }

      const key = `previous_balances:${network}:${userId}`;
      const data = await redisService.company.get(key);
      
      if (!data) {
        return {};
      }

      const balances = JSON.parse(data);
      return balances.balancesTable || {};
    } catch (error) {
      console.error('❌ Erro ao buscar balances anteriores do Redis:', error);
      return {};
    }
  }

  /**
   * Salvar balances anteriores no Redis
   */
  async savePreviousBalances(userId, balances, network = 'mainnet') {
    try {
      if (!redisService.isConnected || !redisService.company) {
        console.warn('⚠️ Redis não conectado, ignorando salvamento de balances anteriores');
        return false;
      }

      const key = `previous_balances:${network}:${userId}`;
      const data = {
        userId,
        network,
        balancesTable: balances,
        savedAt: new Date().toISOString()
      };

      // TTL de 7 dias para manter histórico
      await redisService.company.setEx(key, 7 * 24 * 60 * 60, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('❌ Erro ao salvar balances anteriores no Redis:', error);
      return false;
    }
  }

  /**
   * Detectar mudanças nos saldos de um usuário específico
   */
  async detectBalanceChanges(userId, newBalances, publicKey, isFirstLoad = false, network = 'mainnet') {
    try {
      const previousBalances = await this.getPreviousBalances(userId, network);
      
      // Debug logging para entender o problema de notificações
      console.log(`🔍 [TokenAmountService] detectBalanceChanges DEBUG para usuário ${userId}:`);
      console.log(`  - isFirstLoad: ${isFirstLoad}`);
      console.log(`  - previousBalances keys: ${Object.keys(previousBalances).length}`);
      console.log(`  - previousBalances: ${JSON.stringify(previousBalances)}`);
      console.log(`  - Redis conectado: ${redisService.isConnected}`);
      console.log(`  - Redis company client: ${!!redisService.company}`);
      
      if (!newBalances.balancesTable) {
        return { changes: [], isFirstLoad: true };
      }

      const changes = [];
      const newTokens = [];
      
      // Verificar cada token
      for (const [tokenSymbol, newAmount] of Object.entries(newBalances.balancesTable)) {
        const previousAmount = parseFloat(previousBalances[tokenSymbol] || 0);
        const currentAmount = parseFloat(newAmount);
        
        console.log(`  - Token ${tokenSymbol}: previousAmount=${previousAmount}, currentAmount=${currentAmount}, isFirstLoad=${isFirstLoad}`);
        
        // Se é primeira vez que vemos este token
        if (previousAmount === 0 && currentAmount > 0 && !isFirstLoad) {
          console.log(`  ⚠️ CRIANDO NOTIFICAÇÃO para token ${tokenSymbol} (previousAmount=0, currentAmount=${currentAmount}, isFirstLoad=${isFirstLoad})`);
          newTokens.push({
            token: tokenSymbol,
            amount: currentAmount
          });
        }
        // Se houve mudança em token existente
        else if (previousAmount > 0 && currentAmount !== previousAmount) {
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
        } else {
          console.log(`  ✅ SEM NOTIFICAÇÃO para token ${tokenSymbol} (condições não atendidas)`);
        }
      }
      
      // Criar notificações para novos tokens
      for (const newToken of newTokens) {
        await this.createNewTokenNotification(userId, newToken, network);
      }
      
      // Criar notificações para mudanças significativas
      for (const change of changes) {
        await this.createBalanceChangeNotification(userId, change, network);
      }
      
      // Atualizar saldos anteriores no Redis
      await this.savePreviousBalances(userId, newBalances.balancesTable, network);
      
      if (changes.length > 0 || newTokens.length > 0) {
        console.log(`📊 Usuário ${userId}: ${changes.length} mudanças e ${newTokens.length} novos tokens detectados`);
      }
      
      return { changes, newTokens, isFirstLoad: Object.keys(previousBalances).length === 0 };
      
    } catch (error) {
      console.error('❌ Erro ao detectar mudanças nos saldos:', error);
      return { changes: [], newTokens: [], isFirstLoad: true };
    }
  }

  /**
   * Criar notificação de novo token
   */
  async createNewTokenNotification(userId, newToken, network = 'mainnet') {
    try {
      const networkLabel = network === 'mainnet' ? 'Mainnet' : 'Testnet';
      const notification = await this.notificationService.createNotification({
        userId: userId,
        sender: 'coinage',
        title: `🪙 Novo token detectado: ${newToken.token} (${networkLabel})`,
        message: `Um novo token **${newToken.token}** foi detectado em sua carteira na ${networkLabel} com saldo de **${newToken.amount}**. Bem-vindo ao ecossistema!`
      });
      
      console.log(`🔔 Notificação de novo token criada para usuário ${userId}: ${newToken.token}`);
      
      // Emitir evento para notificações em tempo real
      this.emitNotificationEvent(userId, 'new_token', notification);
      
      return notification;
      
    } catch (error) {
      console.error('❌ Erro ao criar notificação de novo token:', error);
      throw error;
    }
  }

  /**
   * Criar notificação de mudança de saldo
   */
  async createBalanceChangeNotification(userId, change, network = 'mainnet') {
    try {
      const networkLabel = network === 'mainnet' ? 'Mainnet' : 'Testnet';
      const notification = await this.notificationService.createBalanceChangeNotification(
        userId,
        change.token,
        change.oldAmount,
        change.newAmount,
        change.changePercent,
        change.changeType,
        networkLabel
      );
      
      console.log(`🔔 Notificação criada para usuário ${userId}: ${change.token} ${change.changeType}`);
      
      // Emitir evento para notificações em tempo real
      this.emitNotificationEvent(userId, 'balance_change', notification);
      
      return notification;
      
    } catch (error) {
      console.error('❌ Erro ao criar notificação de mudança de saldo:', error);
      throw error;
    }
  }

  /**
   * Emitir evento para notificações em tempo real
   */
  emitNotificationEvent(userId, eventType, notification) {
    try {
      // Emitir eventos globais para que frontend possa capturar
      if (global.io) {
        // Socket.io para usuário específico
        global.io.to(`user:${userId}`).emit('notification', {
          type: eventType,
          notification: notification,
          timestamp: new Date().toISOString()
        });
      }
      
      // Emitir eventos do sistema para componentes que estão escutando
      process.emit('notification:created', {
        userId,
        type: eventType,
        notification
      });
      
    } catch (error) {
      console.error('❌ Erro ao emitir evento de notificação:', error);
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

