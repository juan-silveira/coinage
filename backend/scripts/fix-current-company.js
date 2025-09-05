const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function fixCurrentCompany() {
  try {
    console.log('🔄 Corrigindo empresa atual...');

    // Ivan Alberton user ID
    const userId = 'cf16c7f4-f9e7-41ea-a735-3c6e5c9d976c';

    // Buscar empresa Coinage
    const coinageCompany = await prisma.company.findUnique({
      where: { alias: 'coinage' }
    });

    if (!coinageCompany) {
      console.error('❌ Empresa Coinage não encontrada');
      return;
    }

    console.log('✅ Empresa Coinage encontrada:', coinageCompany.id, coinageCompany.name);

    // Atualizar lastAccessAt da Coinage para agora
    const updatedCoinage = await prisma.userCompany.update({
      where: {
        userId_companyId: {
          userId: userId,
          companyId: coinageCompany.id
        }
      },
      data: {
        lastAccessAt: new Date()
      }
    });

    console.log('✅ LastAccessAt da Coinage atualizado:', updatedCoinage.lastAccessAt);

    // Atualizar lastAccessAt da Navi para uma data anterior
    const naviCompany = await prisma.company.findUnique({
      where: { alias: 'navi' }
    });

    if (naviCompany) {
      const updatedNavi = await prisma.userCompany.update({
        where: {
          userId_companyId: {
            userId: userId,
            companyId: naviCompany.id
          }
        },
        data: {
          lastAccessAt: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 dia atrás
        }
      });

      console.log('✅ LastAccessAt da Navi atualizado para:', updatedNavi.lastAccessAt);
    }

    console.log('✅ Empresa atual corrigida para Coinage!');

  } catch (error) {
    console.error('❌ Erro ao corrigir empresa atual:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixCurrentCompany();