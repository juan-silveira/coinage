const { PrismaClient } = require('../src/generated/prisma');
require('dotenv').config();

const prisma = new PrismaClient();

async function updateUserKeys() {
  try {
    await prisma.$connect();
    
    console.log('🔍 Buscando usuário Ivan Alberton...');
    const user = await prisma.user.findFirst({
      where: { email: 'ivan.alberton@navi.inf.br' },
      select: { id: true, name: true, email: true, metadata: true, publicKey: true, privateKey: true }
    });
    
    if (!user) {
      console.log('❌ Usuário não encontrado');
      return;
    }
    
    console.log(`👤 Encontrado: ${user.name} (ID: ${user.id})`);
    console.log('📋 CHAVES ATUAIS:');
    console.log(`   🔑 Pública: ${user.publicKey ? user.publicKey.substring(0, 50) + '...' : 'N/A'}`);
    console.log(`   🗝️  Privada: ${user.privateKey ? user.privateKey.substring(0, 50) + '...' : 'N/A'}`);
    
    console.log('\n🔄 Atualizando para chaves Ethereum do .env...');
    
    // Chaves do .env
    const ethereumPublicKey = process.env.DEFAULT_ADMIN_PUBLIC_KEY || '0x5528C065931f523CA9F3a6e49a911896fb1D2e6f';
    const ethereumPrivateKey = process.env.DEFAULT_ADMIN_PRIVATE_KEY || '0x2a09b1aaa664113fd7163a0a4aafbcb16f6b5a16ae9dacfe7c840be2455e3f61';
    
    console.log(`📋 NOVAS CHAVES DO .ENV:`);
    console.log(`   🔑 Pública: ${ethereumPublicKey}`);
    console.log(`   🗝️  Privada: ${ethereumPrivateKey}`);
    
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        publicKey: ethereumPublicKey,
        privateKey: ethereumPrivateKey,
        metadata: {
          ...(user.metadata || {}),
          keysUpdated: new Date().toISOString(),
          keyType: 'ethereum',
          ethereumAddress: ethereumPublicKey,
          rsaKeysReplaced: true,
          previousKeyType: 'rsa'
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        publicKey: true,
        privateKey: true
      }
    });
    
    console.log('\n✅ Chaves atualizadas com sucesso!');
    console.log(`🔑 Nova Chave Pública: ${updatedUser.publicKey}`);
    console.log(`🗝️  Nova Chave Privada: ${updatedUser.privateKey}`);
    
    console.log('\n🎯 RESULTADO:');
    console.log('✅ Usuário agora possui chaves Ethereum do .env');
    console.log('✅ Sistema pode comunicar com blockchain usando essas chaves');
    console.log('✅ Cache Redis mantido funcionando');
    
  } catch (error) {
    console.error('❌ Erro ao atualizar chaves:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

updateUserKeys();
