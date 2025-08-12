const { PrismaClient } = require('../src/generated/prisma');
const NotificationService = require('../src/services/notification.service');

const prisma = new PrismaClient();
const notificationService = new NotificationService();

async function testEnhancedNotifications() {
  try {
    console.log('🧪 Testando funcionalidades aprimoradas de notificações...\n');

    // Buscar usuário Ivan
    const user = await prisma.user.findFirst({
      where: { email: 'ivan.alberton@navi.inf.br' }
    });

    if (!user) {
      console.error('❌ Usuário Ivan não encontrado');
      return;
    }

    console.log(`✅ Usuário encontrado: ${user.name} (${user.email})`);

    // 1. Testar criação de notificação com emojis
    console.log('\n📝 1. Testando criação de notificação com emojis...');
    const notification1 = await notificationService.createNotification({
      userId: user.id,
      sender: 'coinage',
      title: '🚀 Nova funcionalidade disponível!',
      message: 'O sistema de notificações foi **atualizado** com novas funcionalidades como *favoritos* e `filtros`.'
    });
    console.log(`✅ Notificação criada: ${notification1.title}`);

    // 2. Testar notificação de mudança de saldo
    console.log('\n💰 2. Testando notificação de mudança de saldo...');
    const notification2 = await notificationService.createBalanceChangeNotification(
      user.id, 'BTC', '0.001', '0.002', '100', 'aumentou'
    );
    console.log(`✅ Notificação de saldo criada: ${notification2.title}`);

    // 3. Testar notificação de recebimento de token
    console.log('\n📥 3. Testando notificação de recebimento de token...');
    const notification3 = await notificationService.createTokenBalanceChangeNotification(
      user.id, 0.001, 0.002, 'ETH', '0x1234567890abcdef'
    );
    console.log(`✅ Notificação de recebimento criada: ${notification3.title}`);

    // 4. Testar marcação como favorita
    console.log('\n⭐ 4. Testando marcação como favorita...');
    const favoritedNotification = await notificationService.toggleFavorite(notification1.id);
    console.log(`✅ Notificação marcada como favorita: ${favoritedNotification.isFavorite}`);

    // 5. Testar marcação como lida
    console.log('\n👁️ 5. Testando marcação como lida...');
    const readNotification = await notificationService.markAsRead(notification2.id);
    console.log(`✅ Notificação marcada como lida: ${readNotification.isRead}`);

    // 6. Testar marcação como não lida
    console.log('\n🙈 6. Testando marcação como não lida...');
    const unreadNotification = await notificationService.markAsUnread(notification2.id);
    console.log(`✅ Notificação marcada como não lida: ${unreadNotification.isRead}`);

    // 7. Testar marcação múltipla como lida
    console.log('\n📋 7. Testando marcação múltipla como lida...');
    const result = await notificationService.markMultipleAsRead([notification1.id, notification2.id, notification3.id]);
    console.log(`✅ ${result.count} notificações marcadas como lidas`);

    // 8. Testar busca de notificações favoritas
    console.log('\n🔍 8. Testando busca de notificações favoritas...');
    const favoriteNotifications = await prisma.notification.findMany({
      where: {
        userId: user.id,
        isFavorite: true,
        isActive: true
      }
    });
    console.log(`✅ Encontradas ${favoriteNotifications.length} notificações favoritas`);

    // 9. Testar contagem de não lidas
    console.log('\n📊 9. Testando contagem de não lidas...');
    const unreadCount = await notificationService.getUnreadCount(user.id);
    console.log(`✅ Notificações não lidas: ${unreadCount}`);

    // 10. Testar limpeza de markdown
    console.log('\n🧹 10. Testando limpeza de markdown...');
    const markdownText = '**Texto em negrito** e *texto em itálico* com `código`';
    const cleanText = notificationService.cleanMarkdown(markdownText);
    console.log(`✅ Markdown limpo: "${cleanText}"`);

    // 11. Testar obtenção de emoji por tipo
    console.log('\n🎨 11. Testando obtenção de emoji por tipo...');
    const emoji1 = notificationService.getNotificationEmoji('balance_change');
    const emoji2 = notificationService.getNotificationEmoji('success');
    console.log(`✅ Emojis: ${emoji1} (balance_change), ${emoji2} (success)`);

    // 12. Listar todas as notificações
    console.log('\n📋 12. Listando todas as notificações...');
    const allNotifications = await notificationService.getActiveNotifications(user.id);
    console.log(`✅ Total de notificações: ${allNotifications.length}`);
    
    allNotifications.forEach((notification, index) => {
      console.log(`   ${index + 1}. ${notification.title} (${notification.isRead ? 'Lida' : 'Não lida'}) ${notification.isFavorite ? '⭐' : ''}`);
    });

    console.log('\n🎉 Todos os testes concluídos com sucesso!');
    console.log('\n📱 Agora teste no frontend:');
    console.log('   - Acesse a página de notificações');
    console.log('   - Teste os filtros (Todas, Não lidas, Lidas, Favoritas)');
    console.log('   - Teste a seleção múltipla e ações em lote');
    console.log('   - Teste marcar/desmarcar como favorita');
    console.log('   - Teste marcar como não lida');
    console.log('   - Clique em uma notificação para abrir a página individual');

  } catch (error) {
    console.error('❌ Erro durante os testes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar testes
testEnhancedNotifications();
