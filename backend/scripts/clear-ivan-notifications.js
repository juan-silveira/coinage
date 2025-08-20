const { PrismaClient } = require('../src/generated/prisma');
const prisma = new PrismaClient();

async function clearIvanNotifications() {
  try {
    console.log('🧹 Limpando notificações do usuário Ivan...');
    
    // Primeiro, encontrar o usuário Ivan
    const ivanUser = await prisma.user.findFirst({
      where: {
        OR: [
          { name: { contains: 'Ivan', mode: 'insensitive' } },
          { email: { contains: 'ivan', mode: 'insensitive' } }
        ]
      }
    });

    if (!ivanUser) {
      console.log('❌ Usuário Ivan não encontrado');
      return;
    }

    console.log(`✅ Encontrado usuário: ${ivanUser.name} (${ivanUser.email}) - ID: ${ivanUser.id}`);
    
    // Contar notificações antes da limpeza
    const countBefore = await prisma.notification.count({
      where: { userId: ivanUser.id }
    });
    
    console.log(`📊 Notificações encontradas para Ivan: ${countBefore}`);
    
    if (countBefore === 0) {
      console.log('✅ Nenhuma notificação para limpar');
      return;
    }
    
    // Deletar todas as notificações do Ivan
    const deleteResult = await prisma.notification.deleteMany({
      where: { userId: ivanUser.id }
    });
    
    console.log(`✅ ${deleteResult.count} notificações foram removidas para o usuário ${ivanUser.name}`);
    
    // Verificar se limpou corretamente
    const countAfter = await prisma.notification.count({
      where: { userId: ivanUser.id }
    });
    
    console.log(`📊 Notificações restantes para Ivan: ${countAfter}`);
    
  } catch (error) {
    console.error('❌ Erro ao limpar notificações:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o script
clearIvanNotifications();