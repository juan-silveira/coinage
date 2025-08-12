const { PrismaClient } = require('../src/generated/prisma');
const NotificationService = require('../src/services/notification.service');

const prisma = new PrismaClient();
const notificationService = new NotificationService();

async function testNotifications() {
  try {
    console.log('🧪 Testando sistema de notificações...\n');

    // 1. Testar criação de notificação
    console.log('1. Criando notificação de teste...');
    const testNotification = await notificationService.createNotification({
      sender: 'coinage',
      title: 'Teste de Notificação',
      message: 'Esta é uma **notificação de teste** para verificar o sistema.'
    });
    console.log('✅ Notificação criada:', testNotification.id);

    // 2. Testar notificação de mudança de saldo
    console.log('\n2. Criando notificação de mudança de saldo...');
    const balanceNotification = await notificationService.createTokenBalanceChangeNotification(
      100.0,  // saldo anterior
      150.0,  // saldo novo
      'AZE',  // símbolo do token
      '0x1234567890abcdef1234567890abcdef12345678' // endereço da carteira
    );
    console.log('✅ Notificação de saldo criada:', balanceNotification.id);

    // 3. Listar todas as notificações
    console.log('\n3. Listando todas as notificações...');
    const allNotifications = await notificationService.getActiveNotifications();
    console.log(`📋 Total de notificações: ${allNotifications.length}`);
    
    allNotifications.forEach((notification, index) => {
      console.log(`   ${index + 1}. ${notification.title} (${notification.isRead ? 'Lida' : 'Não lida'})`);
    });

    // 4. Testar contagem de não lidas
    console.log('\n4. Contando notificações não lidas...');
    const unreadCount = await notificationService.getUnreadCount();
    console.log(`📊 Notificações não lidas: ${unreadCount}`);

    // 5. Marcar uma como lida
    if (allNotifications.length > 0) {
      console.log('\n5. Marcando primeira notificação como lida...');
      const firstNotification = allNotifications[0];
      const updatedNotification = await notificationService.markAsRead(firstNotification.id);
      console.log('✅ Notificação marcada como lida:', updatedNotification.id);
    }

    // 6. Verificar contagem atualizada
    console.log('\n6. Verificando contagem atualizada...');
    const updatedUnreadCount = await notificationService.getUnreadCount();
    console.log(`📊 Notificações não lidas após marcar como lida: ${updatedUnreadCount}`);

    console.log('\n🎉 Teste concluído com sucesso!');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar teste
testNotifications();

