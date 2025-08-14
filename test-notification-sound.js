const NotificationService = require('./backend/src/services/notification.service');

async function testNotificationSounds() {
  try {
    const notificationService = new NotificationService();
    const userId = '34290450-ce0d-46fc-a370-6ffa787ea6b9';
    
    console.log('🧪 Testando sistema de som para notificações...');
    console.log('');
    
    // Teste 1: Uma única notificação
    console.log('1️⃣ Criando uma única notificação...');
    await notificationService.createNotification({
      userId: userId,
      sender: 'coinage',
      title: '🔊 Teste de Som - Única',
      message: 'Esta é uma notificação única para testar o som.'
    });
    
    console.log('✅ Notificação única criada - Som deve tocar 1x');
    console.log('');
    
    // Aguardar intervalo mínimo
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Teste 2: Múltiplas notificações em batch
    console.log('2️⃣ Criando 3 notificações em batch...');
    
    const batchNotifications = [
      {
        userId: userId,
        sender: 'coinage',
        title: '🔊 Teste Batch 1/3',
        message: 'Token AZE aumentou 5%'
      },
      {
        userId: userId,
        sender: 'coinage',
        title: '🔊 Teste Batch 2/3',
        message: 'Token cBRL diminuiu 2%'
      },
      {
        userId: userId,
        sender: 'coinage',
        title: '🔊 Teste Batch 3/3',
        message: 'Novo token CNT detectado'
      }
    ];
    
    // Criar todas as notificações rapidamente (simula refresh que detecta mudanças)
    const createdNotifications = [];
    for (const notificationData of batchNotifications) {
      const notification = await notificationService.createNotification(notificationData);
      createdNotifications.push(notification);
      await new Promise(resolve => setTimeout(resolve, 100)); // 100ms entre cada uma
    }
    
    console.log('✅ 3 notificações em batch criadas - Som deve tocar apenas 1x');
    console.log('');
    
    // Verificar se foram criadas
    console.log('📊 Verificando notificações criadas:');
    
    // Buscar contagem total
    const countResponse = await fetch('http://localhost:8800/api/notifications/unread-count', {
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjM0MjkwNDUwLWNlMGQtNDZmYy1hMzcwLTZmZmE3ODdlYTZiOSIsImVtYWlsIjoiaXZhbi5hbGJlcnRvbkBuYXZpLmluZi5iciIsIm5hbWUiOiJJdmFuIEFsYmVydG9uIiwidHlwZSI6ImFjY2VzcyIsImlhdCI6MTc1NTIxMjI0MSwiZXhwIjoxNzU1MjEzMTQxLCJhdWQiOiJhem9yZS1jbGllbnQiLCJpc3MiOiJhem9yZS1hcGkifQ.LxntkpZHiljepc7_3Fr3FHgXWG0mEjJ-n0SnvfXXIfY'
      }
    });
    
    if (countResponse.ok) {
      const data = await countResponse.json();
      console.log(`📬 Total de notificações não lidas: ${data.data?.count || 0}`);
    }
    
    console.log('');
    console.log('🎯 Resultado esperado:');
    console.log('• Som tocou 1x para a notificação única');
    console.log('• Som tocou 1x para o batch de 3 notificações');
    console.log('• Intervalo mínimo de 2s respeitado entre sons');
    console.log('• Frontend atualizou contador automaticamente');
    console.log('');
    console.log('✅ Teste de som concluído!');
    
  } catch (error) {
    console.error('❌ Erro no teste de som:', error);
  } finally {
    process.exit(0);
  }
}

testNotificationSounds();