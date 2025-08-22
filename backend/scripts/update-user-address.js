require('dotenv').config();
const { PrismaClient } = require('../src/generated/prisma');

async function updateUserAddress() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔧 Atualizando endereço do usuário para o que tem saldo...');
    
    const oldAddress = '0x7B5A73C4c72f8B2D5B9b8C4F3f8E5A2D1C6B9E8F';
    const newAddress = '0x5528C065931f523CA9F3a6e49a911896fb1D2e6f';
    
    // Atualizar o usuário
    const updatedUser = await prisma.user.update({
      where: {
        email: 'ivan.alberton@navi.inf.br'
      },
      data: {
        publicKey: newAddress
      }
    });
    
    console.log('✅ Usuário atualizado:');
    console.log(`📧 Email: ${updatedUser.email}`);
    console.log(`🔑 Public Key antigo: ${oldAddress}`);
    console.log(`🔑 Public Key novo: ${newAddress}`);
    
    console.log('\\n🧪 Testando o novo endereço...');
    
    // Testar balance com o novo endereço
    const balanceSyncController = require('../src/controllers/balanceSync.controller');
    
    const req = {
      query: {
        address: newAddress,
        network: 'testnet'
      },
      user: {
        id: updatedUser.id,
        publicKey: newAddress
      }
    };
    
    let responseData = null;
    const res = {
      json: (data) => {
        responseData = data;
        console.log('📋 Resposta da API com novo endereço:');
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
    
    console.log('\\n🎉 Agora faça logout/login ou recarregue a página http://localhost:3000/dashboard');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

updateUserAddress();