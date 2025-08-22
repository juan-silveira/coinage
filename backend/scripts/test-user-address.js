require('dotenv').config();
const { PrismaClient } = require('../src/generated/prisma');

async function testUserAddress() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Buscando usuário logado no sistema...');
    
    // Buscar o usuário padrão (provavelmente ivan.alberton@navi.inf.br)
    const user = await prisma.user.findFirst({
      where: {
        email: 'ivan.alberton@navi.inf.br'
      },
      select: {
        id: true,
        email: true,
        publicKey: true
      }
    });
    
    if (!user) {
      console.log('❌ Usuário não encontrado');
      return;
    }
    
    console.log('✅ Usuário encontrado:');
    console.log(`📧 Email: ${user.email}`);
    console.log(`🔑 Public Key: ${user.publicKey}`);
    console.log(`🆔 ID: ${user.id}`);
    
    // Testar balance com o endereço correto
    console.log('\\n🔍 Testando balance para o endereço correto...');
    
    const balanceSyncController = require('../src/controllers/balanceSync.controller');
    
    const req = {
      query: {
        address: user.publicKey,
        network: 'testnet'
      },
      user: {
        id: user.id,
        publicKey: user.publicKey
      }
    };
    
    let responseData = null;
    const res = {
      json: (data) => {
        responseData = data;
        console.log('📋 Resposta da API:');
        if (data.success) {
          console.log(`✅ Success: ${data.success}`);
          console.log(`💰 AZE-t: ${data.data?.balancesTable?.['AZE-t'] || 'N/A'}`);
          console.log(`🪙 cBRL: ${data.data?.balancesTable?.cBRL || 'N/A'}`);
          console.log(`🎯 STT: ${data.data?.balancesTable?.STT || 'N/A'}`);
          console.log(`📊 Total tokens: ${data.data?.totalTokens || 0}`);
        } else {
          console.log(`❌ Error: ${data.message}`);
        }
      },
      status: (code) => {
        console.log(`📊 Status HTTP: ${code}`);
        return res;
      }
    };
    
    await balanceSyncController.getFreshBalances(req, res);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testUserAddress();