const { PrismaClient } = require('../src/generated/prisma');
require('dotenv').config();

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://coinage_user:coinage_password@localhost:5433/coinage_db?sslmode=disable'
    }
  }
});

async function testSanitizeUser() {
  try {
    console.log('🧪 Testando sanitizeUser...\n');

    // 1. Buscar usuário Ivan
    console.log('1️⃣ Buscando usuário Ivan...');
    const user = await prisma.user.findFirst({
      where: { 
        email: 'ivan.alberton@navi.inf.br',
        isActive: true 
      }
    });

    if (!user) {
      console.log('❌ Usuário não encontrado');
      return;
    }

    console.log('✅ Usuário encontrado:', user.id);
    console.log('📋 Propriedades do usuário:', Object.keys(user));

    // 2. Testar sanitizeUser manualmente
    console.log('\n2️⃣ Testando sanitizeUser manualmente...');
    
    try {
      const sanitized = { ...user };
      console.log('📋 Propriedades antes:', Object.keys(sanitized));
      
      delete sanitized.privateKey;
      console.log('✅ privateKey deletada');
      
      delete sanitized.password;
      console.log('✅ password deletada');
      
      console.log('📋 Propriedades depois:', Object.keys(sanitized));
      console.log('🎉 sanitizeUser funcionou!');
      
    } catch (error) {
      console.log('❌ Erro no sanitizeUser:', error.message);
    }

    // 3. Testar método authenticate
    console.log('\n3️⃣ Testando método authenticate...');
    
    try {
      const UserService = require('../src/services/user.service');
      const authenticatedUser = await UserService.authenticate('ivan.alberton@navi.inf.br', 'N@vi@2025');
      
      if (authenticatedUser) {
        console.log('✅ authenticate funcionou!');
        console.log('📋 Propriedades do usuário autenticado:', Object.keys(authenticatedUser));
      } else {
        console.log('❌ authenticate falhou');
      }
      
    } catch (error) {
      console.log('❌ Erro no authenticate:', error.message);
      console.log('📋 Stack trace:', error.stack);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  testSanitizeUser()
    .catch(console.error);
}

module.exports = { testSanitizeUser };
