const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function getApiKeys() {
  try {
    console.log('🔍 Buscando API keys no sistema...');
    
    const apiKeys = await prisma.apiKey.findMany({
      select: {
        id: true,
        name: true,
        key: true,
        isActive: true,
        createdAt: true
      }
    });

    if (apiKeys.length === 0) {
      console.log('❌ Nenhuma API key encontrada');
    } else {
      console.log('✅ API keys encontradas:');
      apiKeys.forEach(key => {
        console.log(`- ${key.name}: ${key.key} (${key.isActive ? 'ativo' : 'inativo'})`);
      });
    }

  } catch (error) {
    console.error('❌ Erro ao buscar API keys:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getApiKeys();