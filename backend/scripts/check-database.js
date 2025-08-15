const { PrismaClient } = require('../src/generated/prisma');
const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('🔍 Verificando estado do banco de dados...\n');

    // Verificar clientes
    console.log('🏢 CLIENTES:');
    const clients = await prisma.client.findMany();
    clients.forEach(client => {
      console.log(`   - ${client.name} (${client.alias}) - ID: ${client.id}`);
    });

    console.log('\n👤 USUÁRIOS:');
    const users = await prisma.user.findMany();
    users.forEach(user => {
      console.log(`   - ${user.name} (${user.email}) - Ativo: ${user.isActive}`);
    });

    console.log('\n🔗 RELAÇÕES USER-CLIENT:');
    const userClients = await prisma.userClient.findMany({
      include: {
        user: { select: { name: true, email: true } },
        client: { select: { name: true, alias: true } }
      }
    });
    
    userClients.forEach(uc => {
      console.log(`   - ${uc.user.name} -> ${uc.client.name} (${uc.client.alias}) - Role: ${uc.role} - Status: ${uc.status}`);
    });

    console.log('\n📊 RESUMO:');
    console.log(`   Total de clientes: ${clients.length}`);
    console.log(`   Total de usuários: ${users.length}`);
    console.log(`   Total de relações user-client: ${userClients.length}`);

  } catch (error) {
    console.error('❌ Erro ao verificar banco:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
