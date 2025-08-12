const { PrismaClient } = require('../src/generated/prisma');
const NotificationService = require('../src/services/notification.service');

const prisma = new PrismaClient();
const notificationService = new NotificationService();

async function testNotificationPage() {
  try {
    console.log('🧪 Testando página individual de notificação...\n');

    // Buscar usuário Ivan
    const user = await prisma.user.findFirst({
      where: { email: 'ivan.alberton@navi.inf.br' }
    });

    if (!user) {
      console.error('❌ Usuário Ivan não encontrado');
      return;
    }

    console.log(`✅ Usuário encontrado: ${user.name} (${user.email})`);

    // Buscar uma notificação para testar
    const notification = await prisma.notification.findFirst({
      where: {
        userId: user.id,
        isActive: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!notification) {
      console.error('❌ Nenhuma notificação encontrada');
      return;
    }

    console.log(`✅ Notificação encontrada: ${notification.title}`);
    console.log(`   ID: ${notification.id}`);
    console.log(`   Lida: ${notification.isRead}`);
    console.log(`   Favorita: ${notification.isFavorite}`);
    console.log(`   Mensagem: ${notification.message.substring(0, 100)}...`);

    // Testar marcação como favorita
    console.log('\n⭐ Testando marcação como favorita...');
    const favoritedNotification = await notificationService.toggleFavorite(notification.id);
    console.log(`✅ Notificação marcada como favorita: ${favoritedNotification.isFavorite}`);

    // Testar marcação como lida
    console.log('\n👁️ Testando marcação como lida...');
    const readNotification = await notificationService.markAsRead(notification.id);
    console.log(`✅ Notificação marcada como lida: ${readNotification.isRead}`);

    // Testar marcação como não lida
    console.log('\n🙈 Testando marcação como não lida...');
    const unreadNotification = await notificationService.markAsUnread(notification.id);
    console.log(`✅ Notificação marcada como não lida: ${unreadNotification.isRead}`);

    // Testar busca por ID
    console.log('\n🔍 Testando busca por ID...');
    const foundNotification = await notificationService.getNotificationById(notification.id, user.id);
    if (foundNotification) {
      console.log(`✅ Notificação encontrada por ID: ${foundNotification.title}`);
    } else {
      console.log('❌ Notificação não encontrada por ID');
    }

    console.log('\n🎉 Testes da página individual concluídos!');
    console.log('\n📱 Agora teste no frontend:');
    console.log(`   - Acesse: /notifications/${notification.id}`);
    console.log('   - Teste marcar como favorita');
    console.log('   - Teste marcar como não lida');
    console.log('   - Teste excluir');
    console.log('   - Teste voltar para a lista');

  } catch (error) {
    console.error('❌ Erro durante os testes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar testes
testNotificationPage();
