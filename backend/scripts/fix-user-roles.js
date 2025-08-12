const { PrismaClient } = require('../src/generated/prisma');
require('dotenv').config();

const prisma = new PrismaClient();

async function fixUserRoles() {
  try {
    await prisma.$connect();
    
    console.log('🔍 Buscando usuário Ivan Alberton...');
    const user = await prisma.user.findFirst({
      where: { email: 'ivan.alberton@navi.inf.br' },
      select: { 
        id: true, 
        name: true, 
        email: true, 
        roles: true, 
        permissions: true,
        isApiAdmin: true,
        isClientAdmin: true 
      }
    });
    
    if (!user) {
      console.log('❌ Usuário não encontrado');
      return;
    }
    
    console.log(`👤 Encontrado: ${user.name}`);
    console.log(`🎭 Roles atuais: ${JSON.stringify(user.roles)}`);
    
    console.log('\n🔧 Corrigindo roles...');
    
    // Roles corretas para um administrador da API
    const correctRoles = ['USER', 'API_ADMIN'];
    
    // Permissões otimizadas (manter as essenciais)
    const optimizedPermissions = {
      admin: {
        fullAccess: true,
        clients: { read: true, create: true, update: true, delete: true },
        users: { read: true, create: true, update: true, delete: true },
        system: { read: true, create: true, update: true, delete: true },
        logs: { read: true, create: true, update: true, delete: true }
      },
      wallets: { read: true, create: true, update: true, delete: true },
      contracts: { read: true, create: true, update: true, delete: true },
      transactions: { read: true, create: true, update: true, delete: true },
      stakes: { read: true, create: true, update: true, delete: true },
      tokens: { read: true, create: true, update: true, delete: true },
      webhooks: { read: true, create: true, update: true, delete: true },
      documents: { read: true, create: true, update: true, delete: true },
      queue: { read: true, create: true, update: true, delete: true }
    };
    
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        roles: correctRoles,
        permissions: optimizedPermissions,
        isApiAdmin: true,
        isClientAdmin: false, // Não precisa ser client admin também
        metadata: {
          ...(user.metadata || {}),
          rolesFixed: new Date().toISOString(),
          previousRoles: user.roles,
          rolesCleaned: true
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        roles: true,
        isApiAdmin: true,
        isClientAdmin: true
      }
    });
    
    console.log('✅ Roles corrigidas com sucesso!');
    console.log(`🎭 Novas roles: ${JSON.stringify(updatedUser.roles)}`);
    console.log(`🔐 É API Admin: ${updatedUser.isApiAdmin}`);
    console.log(`🏢 É Client Admin: ${updatedUser.isClientAdmin}`);
    
    console.log('\n📋 EXPLICAÇÃO DAS ROLES:');
    console.log('=============================');
    console.log('👤 USER: Acesso básico aos próprios dados');
    console.log('🔑 API_ADMIN: Acesso total à API, incluindo:');
    console.log('   • Gestão de usuários');
    console.log('   • Gestão de clientes'); 
    console.log('   • Acesso a endpoints administrativos');
    console.log('   • Visualização de chaves privadas');
    console.log('   • Operações blockchain');
    console.log('   • Gestão de contratos e tokens');
    console.log('   • Logs e auditoria');
    console.log('\n🎯 ROLES REMOVIDAS (desnecessárias):');
    console.log('❌ ADMIN: Redundante com API_ADMIN');
    console.log('❌ SUPER_ADMIN: Excessivo para operação normal');
    console.log('❌ CLIENT_ADMIN: Ivan é admin da API, não do cliente');
    
    console.log('\n✅ Sistema otimizado com roles mínimas necessárias!');
    
  } catch (error) {
    console.error('❌ Erro ao corrigir roles:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixUserRoles();
