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

// Função de hash de senha (mesma do UserService)
function hashPassword(password, email) {
  return crypto.pbkdf2Sync(password, email, 10000, 64, 'sha512').toString('hex');
}

// Função de verificação de senha (mesma do UserService)
async function verifyPassword(password, hashedPassword, salt) {
  const hash = await hashPassword(password, salt);
  return hash === hashedPassword;
}

// Função sanitizeUser (mesma do UserService)
function sanitizeUser(user) {
  if (!user) return null;
  const sanitized = { ...user };
  delete sanitized.privateKey;
  delete sanitized.password;
  return sanitized;
}

async function testLoginStepByStep() {
  try {
    console.log('🧪 Teste passo a passo do login...\n');

    const email = 'ivan.alberton@navi.inf.br';
    const password = 'N@vi@2025';

    // 1. Buscar usuário (como a API faz)
    console.log('1️⃣ Buscando usuário...');
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

    console.log('✅ Usuário encontrado:', user.id);
    console.log('📧 Email:', user.email);
    console.log('🔑 Hash da senha:', user.password.substring(0, 20) + '...');

    // 2. Verificar senha
    console.log('\n2️⃣ Verificando senha...');
    const isValid = await verifyPassword(password, user.password, user.email);
    console.log('✅ Senha válida:', isValid);

    if (!isValid) {
      console.log('❌ Senha inválida');
      return;
    }

    // 3. Sanitizar usuário
    console.log('\n3️⃣ Sanitizando usuário...');
    const sanitizedUser = sanitizeUser(user);
    console.log('✅ Usuário sanitizado');
    console.log('📋 Propriedades:', Object.keys(sanitizedUser));

    // 4. Buscar dados completos do usuário (como getUserById faz)
    console.log('\n4️⃣ Buscando dados completos do usuário...');
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        userClients: {
          include: {
            client: true
          }
        },
        apiKeys: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            isActive: true,
            expiresAt: true,
            lastUsedAt: true,
            createdAt: true
          }
        }
      }
    });

    if (fullUser) {
      console.log('✅ Dados completos encontrados');
      console.log('📋 userClients:', fullUser.userClients.length);
      console.log('📋 apiKeys:', fullUser.apiKeys.length);
    } else {
      console.log('❌ Dados completos não encontrados');
    }

    // 5. Simular resposta de sucesso
    console.log('\n5️⃣ Simulando resposta de sucesso...');
    const response = {
      success: true,
      message: 'Login realizado com sucesso',
      data: {
        user: sanitizedUser,
        token: 'jwt-token-simulado',
        refreshToken: 'refresh-token-simulado'
      }
    };

    console.log('🎉 Resposta simulada:', JSON.stringify(response, null, 2));

  } catch (error) {
    console.error('❌ Erro:', error);
    console.log('📋 Stack trace:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  testLoginStepByStep()
    .catch(console.error);
}

module.exports = { testLoginStepByStep };
