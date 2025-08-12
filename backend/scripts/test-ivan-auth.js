const { PrismaClient } = require('../src/generated/prisma');
const crypto = require('crypto');
require('dotenv').config();

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://coinage_user:coinage_password@localhost:5433/coinage_db?sslmode=disable'
    }
  }
});

// Função de hash de senha (mesma do UserService - usando email como salt)
function hashPassword(password, email) {
  return crypto.pbkdf2Sync(password, email, 10000, 64, 'sha512').toString('hex');
}

async function testIvanAuth() {
  try {
    console.log('🧪 Testando autenticação do usuário Ivan...');

    const email = 'ivan.alberton@navi.inf.br';
    const password = 'N@vi@2025';

    // 1. Buscar usuário diretamente
    console.log('\n🔍 Buscando usuário diretamente...');
    const user = await prisma.user.findFirst({
      where: { 
        email: email.toLowerCase(),
        isActive: true 
      }
    });

    if (!user) {
      console.log('❌ Usuário não encontrado');
      return;
    }

    console.log('✅ Usuário encontrado:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Nome: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Ativo: ${user.isActive}`);
    console.log(`   Hash da senha: ${user.password.substring(0, 20)}...`);

    // 2. Verificar senha
    console.log('\n🔐 Verificando senha...');
    const testHash = hashPassword(password, user.email);
    console.log(`   Hash gerado: ${testHash.substring(0, 20)}...`);
    console.log(`   Hash armazenado: ${user.password.substring(0, 20)}...`);
    
    if (testHash === user.password) {
      console.log('✅ Senha válida!');
    } else {
      console.log('❌ Senha inválida!');
      return;
    }

    // 3. Testar com include de client (como no UserService)
    console.log('\n🔍 Testando com include de client...');
    try {
      const userWithClient = await prisma.user.findFirst({
        where: { 
          email: email.toLowerCase(),
          isActive: true 
        },
        include: {
          client: true
        }
      });
      
      if (userWithClient) {
        console.log('✅ Usuário com client encontrado');
        console.log(`   Client: ${userWithClient.client ? userWithClient.client.name : 'Nenhum'}`);
      } else {
        console.log('❌ Usuário com client não encontrado');
      }
    } catch (error) {
      console.log('❌ Erro ao buscar com client:', error.message);
    }

    // 4. Testar com include de userClients
    console.log('\n🔍 Testando com include de userClients...');
    try {
      const userWithClients = await prisma.user.findFirst({
        where: { 
          email: email.toLowerCase(),
          isActive: true 
        },
        include: {
          userClients: {
            include: {
              client: true
            }
          }
        }
      });
      
      if (userWithClients) {
        console.log('✅ Usuário com userClients encontrado');
        console.log(`   Número de clientes: ${userWithClients.userClients.length}`);
        userWithClients.userClients.forEach((uc, index) => {
          console.log(`   Cliente ${index + 1}: ${uc.client.name} (${uc.clientRole})`);
        });
      } else {
        console.log('❌ Usuário com userClients não encontrado');
      }
    } catch (error) {
      console.log('❌ Erro ao buscar com userClients:', error.message);
    }

    // 5. Simular o processo de autenticação
    console.log('\n🔄 Simulando processo de autenticação...');
    
    // Buscar usuário
    const authUser = await prisma.user.findFirst({
      where: { 
        email: email.toLowerCase(),
        isActive: true 
      }
    });

    if (!authUser) {
      console.log('❌ Usuário não encontrado na autenticação');
      return;
    }

    // Verificar senha
    const isValid = testHash === authUser.password;
    if (!isValid) {
      console.log('❌ Senha inválida na autenticação');
      return;
    }

    console.log('✅ Autenticação bem-sucedida!');
    
    // Sanitizar usuário (remover dados sensíveis)
    const sanitizedUser = { ...authUser };
    delete sanitizedUser.password;
    delete sanitizedUser.privateKey;
    
    console.log('✅ Usuário sanitizado:', {
      id: sanitizedUser.id,
      name: sanitizedUser.name,
      email: sanitizedUser.email,
      globalRole: sanitizedUser.globalRole
    });

  } catch (error) {
    console.error('❌ Erro ao testar autenticação:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  testIvanAuth()
    .catch(console.error);
}

module.exports = { testIvanAuth };
