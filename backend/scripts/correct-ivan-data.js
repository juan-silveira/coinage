const { PrismaClient } = require('../src/generated/prisma');
const crypto = require('crypto');
require('dotenv').config();

const prisma = new PrismaClient();

// Função de hash de senha (mesma do UserService)
function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

async function correctIvanData() {
  try {
    console.log('🔧 Corrigindo dados do usuário Ivan e cliente...');

    // 1. Corrigir cliente Coinage para Navi
    console.log('\n🔄 Corrigindo cliente Coinage para Navi...');
    
    const coinageClient = await prisma.client.findUnique({
      where: { alias: 'coinage' }
    });
    
    if (coinageClient) {
      await prisma.client.update({
        where: { id: coinageClient.id },
        data: {
          name: 'Navi',
          alias: 'navi',
          rateLimit: {
            requestsPerMinute: 1000,
            requestsPerHour: 10000,
            requestsPerDay: 100000
          }
        }
      });
      console.log('✅ Cliente atualizado para Navi');
    } else {
      console.log('❌ Cliente Coinage não encontrado');
    }

    // 2. Corrigir dados do usuário Ivan
    console.log('\n🔄 Corrigindo dados do usuário Ivan...');
    
    const ivanUser = await prisma.user.findUnique({
      where: { email: 'ivan.alberton@navi.inf.br' }
    });
    
    if (ivanUser) {
      // Gerar nova senha hashada
      const newPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'N@vi@2025';
      const hashedPassword = hashPassword(newPassword, 'ivan.alberton@navi.inf.br');
      
      await prisma.user.update({
        where: { id: ivanUser.id },
        data: {
          name: 'Ivan Alberton',
          cpf: '02308739959',
          phone: '46999716711',
          birthDate: new Date('1979-07-26'),
          publicKey: '0x5528C065931f523CA9F3a6e49a911896fb1D2e6f',
          privateKey: '0x2a09b1aaa664113fd7163a0a4aafbcb16f6b5a16ae9dacfe7c840be2455e3f61',
          password: hashedPassword
        }
      });
      console.log('✅ Dados do usuário Ivan corrigidos');
    } else {
      console.log('❌ Usuário Ivan não encontrado');
    }

    // 3. Atualizar vínculo do usuário com o cliente (se necessário)
    console.log('\n🔄 Verificando vínculos...');
    
    if (coinageClient && ivanUser) {
      const userClient = await prisma.userClient.findUnique({
        where: {
          userId_clientId: {
            userId: ivanUser.id,
            clientId: coinageClient.id
          }
        }
      });
      
      if (userClient) {
        console.log('✅ Vínculo usuário-cliente já existe');
      } else {
        // Criar vínculo se não existir
        await prisma.userClient.create({
          data: {
            userId: ivanUser.id,
            clientId: coinageClient.id,
            status: 'active',
            clientRole: 'SUPER_ADMIN',
            linkedAt: new Date(),
            approvedBy: ivanUser.id,
            approvedAt: new Date(),
            canViewPrivateKeys: true
          }
        });
        console.log('✅ Vínculo usuário-cliente criado');
      }
    }

    console.log('\n🎉 Dados corrigidos com sucesso!');
    
    // Mostrar informações finais
    console.log('\n📋 Resumo das Correções:');
    console.log('==========================================');
    console.log('Cliente:');
    console.log('- Nome: Navi (antes: Coinage)');
    console.log('- Alias: navi (antes: coinage)');
    console.log('- Rate Limit: 1000/min, 10000/hora, 100000/dia');
    console.log('\nUsuário Ivan:');
    console.log('- Nome: Ivan Alberton');
    console.log('- CPF: 02308739959');
    console.log('- Telefone: 46999716711');
    console.log('- Data de Nascimento: 1979-07-26');
    console.log('- Public Key: 0x5528C065931f523CA9F3a6e49a911896fb1D2e6f');
    console.log('- Private Key: 0x2a09b1aaa664113fd7163a0a4aafbcb16f6b5a16ae9dacfe7c840be2455e3f61');

  } catch (error) {
    console.error('❌ Erro ao corrigir dados:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  correctIvanData()
    .catch(console.error);
}

module.exports = { correctIvanData };
