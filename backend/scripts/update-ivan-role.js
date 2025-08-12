/**
 * Script para atualizar a role do usuário Ivan para SUPER_ADMIN
 */

require('dotenv').config();
const prismaConfig = require('../src/config/prisma');

async function updateIvanRole() {
  let prisma;
  
  try {
    console.log('🔍 Conectando ao banco de dados...');
    prisma = await prismaConfig.initialize();
    
    // Buscar o usuário Ivan
    const ivan = await prisma.user.findFirst({
      where: {
        email: 'ivan.alberton@navi.inf.br'
      }
    });
    
    if (!ivan) {
      console.log('❌ Usuário Ivan não encontrado');
      return;
    }
    
    console.log('👤 Usuário encontrado:', {
      id: ivan.id,
      email: ivan.email,
      name: ivan.name,
      currentRole: ivan.globalRole
    });
    
    // Atualizar para SUPER_ADMIN
    const updatedUser = await prisma.user.update({
      where: { id: ivan.id },
      data: { globalRole: 'SUPER_ADMIN' }
    });
    
    console.log('✅ Role atualizada com sucesso!');
    console.log('📋 Dados atualizados:', {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      newRole: updatedUser.globalRole
    });
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    if (prisma) {
      await prisma.$disconnect();
      console.log('🔌 Conexão encerrada');
    }
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  updateIvanRole()
    .then(() => {
      console.log('✅ Script concluído');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro no script:', error.message);
      process.exit(1);
    });
}

module.exports = updateIvanRole;
