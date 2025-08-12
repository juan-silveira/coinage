const { PrismaClient } = require('../src/generated/prisma');
require('dotenv').config();

const prisma = new PrismaClient();

async function fixUserRolesCorrect() {
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
    
    console.log('\n🔧 Aplicando estrutura de roles correta...');
    
    // Roles corretas conforme especificação do Juan
    const correctRoles = ['USER', 'ADMIN', 'SUPER_ADMIN', 'APP_ADMIN'];
    
    // Permissões completas para SUPER_ADMIN
    const superAdminPermissions = {
      admin: {
        fullAccess: true,
        clients: { read: true, create: true, update: true, delete: true },
        users: { read: true, create: true, update: true, delete: true },
        system: { read: true, create: true, update: true, delete: true },
        logs: { read: true, create: true, update: true, delete: true },
        whitelabel: { read: true, create: true, update: true, delete: true },
        privateKeys: { read: true, create: true, update: true, delete: true }
      },
      wallets: { read: true, create: true, update: true, delete: true },
      contracts: { read: true, create: true, update: true, delete: true },
      transactions: { read: true, create: true, update: true, delete: true },
      stakes: { read: true, create: true, update: true, delete: true },
      tokens: { read: true, create: true, update: true, delete: true },
      webhooks: { read: true, create: true, update: true, delete: true },
      documents: { read: true, create: true, update: true, delete: true },
      queue: { read: true, create: true, update: true, delete: true },
      masterWallet: { read: true, create: true, update: true, delete: true },
      fees: { read: true, create: true, update: true, delete: true }
    };
    
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        roles: correctRoles,
        permissions: superAdminPermissions,
        isApiAdmin: true, // Mantém como API Admin para endpoints /admin
        isClientAdmin: true, // É admin do cliente também
        canViewPrivateKeys: true, // SUPER_ADMIN pode ver chaves privadas
        privateKeyAccessLevel: 'all', // Acesso total a chaves privadas
        metadata: {
          ...(user.metadata || {}),
          rolesUpdated: new Date().toISOString(),
          previousRoles: user.roles,
          rolesStructure: 'correct-specification',
          updatedBy: 'juan-specification'
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        roles: true,
        isApiAdmin: true,
        isClientAdmin: true,
        canViewPrivateKeys: true,
        privateKeyAccessLevel: true
      }
    });
    
    console.log('✅ Roles corrigidas conforme especificação!');
    console.log(`🎭 Novas roles: ${JSON.stringify(updatedUser.roles)}`);
    console.log(`🔐 É API Admin: ${updatedUser.isApiAdmin}`);
    console.log(`🏢 É Client Admin: ${updatedUser.isClientAdmin}`);
    console.log(`👁️ Pode ver chaves privadas: ${updatedUser.canViewPrivateKeys}`);
    console.log(`🔑 Nível de acesso a chaves: ${updatedUser.privateKeyAccessLevel}`);
    
    console.log('\n📋 ESPECIFICAÇÃO CORRETA DAS ROLES:');
    console.log('====================================');
    console.log('👤 USER: Usuário básico');
    console.log('   • Acesso aos próprios dados');
    console.log('   • NÃO pode ver chaves privadas');
    console.log('');
    console.log('🔧 ADMIN: Administrador do Cliente');
    console.log('   • Gestão de usuários do mesmo cliente');
    console.log('   • Modifica informações do cliente');
    console.log('   • Configura página de login whitelabel');
    console.log('   • Vê tarifas aplicadas ao cliente');
    console.log('   • É dono da carteira master do cliente');
    console.log('   • Paga pelas transações dos usuários do cliente');
    console.log('');
    console.log('⚡ SUPER_ADMIN: Super Administrador');
    console.log('   • Acesso total ao sistema');
    console.log('   • PODE ver chaves privadas de todos os usuários');
    console.log('   • Controle completo sobre todos os recursos');
    console.log('');
    console.log('🏢 APP_ADMIN: Administrador do APP');
    console.log('   • Acesso a quase tudo');
    console.log('   • Acesso a endpoints de admin');
    console.log('   • NÃO pode ver chaves privadas dos usuários');
    console.log('');
    console.log('🎯 Ivan é SUPER_ADMIN, então tem acesso total incluindo chaves privadas!');
    
  } catch (error) {
    console.error('❌ Erro ao corrigir roles:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixUserRolesCorrect();
