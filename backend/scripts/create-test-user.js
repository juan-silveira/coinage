const { PrismaClient } = require('../src/generated/prisma');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    console.log('🔍 Conectando ao banco de dados...');
    await prisma.$connect();
    
    // Primeiro, criar um client de teste
    console.log('🏢 Criando client de teste...');
    let testClient = await prisma.client.findFirst({
      where: { name: 'Test Client' }
    });
    
    if (!testClient) {
      testClient = await prisma.client.create({
        data: {
          name: 'Test Client',
          isActive: true,
          rateLimit: {
            requestsPerMinute: 100,
            requestsPerHour: 1000,
            requestsPerDay: 10000
          }
        }
      });
    }
    
    console.log(`✅ Client criado/encontrado: ${testClient.name} (${testClient.id})`);
    
    // Gerar chaves para o usuário
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    });
    
    // Hash da senha
    const hashedPassword = await bcrypt.hash('Test@123', 12);
    
    // Criar usuário de teste
    console.log('👤 Criando usuário de teste...');
    let testUser = await prisma.user.findFirst({
      where: { email: 'test@example.com' }
    });
    
    if (testUser) {
      testUser = await prisma.user.update({
        where: { id: testUser.id },
        data: {
          password: hashedPassword,
          isActive: true,
          isFirstAccess: false
        }
      });
    } else {
      testUser = await prisma.user.create({
        data: {
          name: 'Test User',
          email: 'test@example.com',
          cpf: '12345678901',
          phone: '+5511999999999',
          birthDate: new Date('1990-01-01'),
          publicKey: publicKey,
          privateKey: privateKey,
          clientId: testClient.id,
          password: hashedPassword,
          isFirstAccess: false,
          isApiAdmin: true, // Para ter acesso total
          isClientAdmin: true,
          isActive: true,
          roles: ['USER', 'ADMIN'],
          permissions: {
            wallets: { create: true, read: true, update: true, delete: false },
            contracts: { create: true, read: true, update: true, delete: false },
            transactions: { create: true, read: true, update: false, delete: false },
            admin: {
              fullAccess: true,
              clients: { read: true, create: true, update: true, delete: false },
              users: { read: true, create: true, update: true, delete: false }
            }
          },
          privateKeyAccessLevel: 'all'
        }
      });
    }
    
    console.log(`✅ Usuário criado/atualizado: ${testUser.name} (${testUser.email})`);
    
    // Criar uma API Key de teste
    console.log('🔑 Criando API Key de teste...');
    const apiKeyValue = crypto.randomBytes(32).toString('hex');
    const apiKeyHash = crypto.createHash('sha256').update(apiKeyValue).digest('hex');
    
    let testApiKey = await prisma.apiKey.findFirst({
      where: { 
        userId: testUser.id,
        name: 'Test API Key'
      }
    });
    
    if (!testApiKey) {
      testApiKey = await prisma.apiKey.create({
        data: {
          key: apiKeyValue,
          keyHash: apiKeyHash,
          name: 'Test API Key',
          description: 'API Key para testes',
          userId: testUser.id,
          permissions: testUser.permissions,
          isActive: true
        }
      });
    } else {
      testApiKey = await prisma.apiKey.update({
        where: { id: testApiKey.id },
        data: {
          key: apiKeyValue,
          keyHash: apiKeyHash,
          isActive: true
        }
      });
    }
    
    console.log(`✅ API Key criada: ${testApiKey.name}`);
    console.log(`🔑 API Key Value: ${apiKeyValue}`);
    
    console.log('\n📋 **Dados de Teste Criados:**');
    console.log(`📧 Email: ${testUser.email}`);
    console.log(`🔐 Senha: Test@123`);
    console.log(`🔑 API Key: ${apiKeyValue}`);
    console.log(`🏢 Client: ${testClient.name}`);
    console.log(`👤 User ID: ${testUser.id}`);
    console.log('\n🧪 **Para testar login:**');
    console.log(`curl -X POST http://localhost:8800/api/auth/login \\`);
    console.log(`  -H "Content-Type: application/json" \\`);
    console.log(`  -d '{"email":"${testUser.email}","password":"Test@123"}'`);
    
  } catch (error) {
    console.error('❌ Erro ao criar dados de teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  createTestUser();
}

module.exports = { createTestUser };