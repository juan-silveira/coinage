const NotificationService = require('./backend/src/services/notification.service');

async function testCreateNotification() {
  try {
    const notificationService = new NotificationService();
    
    const testNotification = await notificationService.createNotification({
      userId: '34290450-ce0d-46fc-a370-6ffa787ea6b9',
      sender: 'coinage',
      title: '🧪 Teste de Nova Notificação',
      message: 'Esta é uma nova notificação criada para testar o sistema em tempo real!'
    });
    
    console.log('✅ Notificação criada com sucesso:', testNotification);
    
  } catch (error) {
    console.error('❌ Erro ao criar notificação:', error);
  } finally {
    process.exit(0);
  }
}

testCreateNotification();