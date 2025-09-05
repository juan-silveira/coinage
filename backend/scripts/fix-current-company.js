const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function fixCurrentCompany() {
  try {
    console.log('🔄 Corrigindo empresa atual para NAVI...');

    // Buscar o usuário Ivan
    const ivan = await prisma.user.findUnique({
      where: { email: 'ivan.alberton@navi.inf.br' },
      include: {
        userCompanies: {
          include: {
            company: true
          },
          orderBy: { lastAccessAt: 'desc' }
        }
      }
    });

    if (!ivan) {
      console.error('❌ Usuário Ivan não encontrado');
      return;
    }

    console.log(`✅ Usuário encontrado: ${ivan.name} (${ivan.email})`);

    // Buscar empresa Navi
    const naviCompany = await prisma.company.findUnique({
      where: { alias: 'navi' }
    });

    if (!naviCompany) {
      console.error('❌ Empresa Navi não encontrada');
      return;
    }

    console.log('✅ Empresa Navi encontrada:', naviCompany.id, naviCompany.name);

    // Atualizar lastAccessAt da Navi para agora (tornando-a atual)
    const updatedNavi = await prisma.userCompany.update({
      where: {
        userId_companyId: {
          userId: ivan.id,
          companyId: naviCompany.id
        }
      },
      data: {
        lastAccessAt: new Date()
      }
    });

    console.log('✅ LastAccessAt da Navi atualizado:', updatedNavi.lastAccessAt);

    // Atualizar lastAccessAt da Coinage para uma data anterior
    const coinageCompany = await prisma.company.findUnique({
      where: { alias: 'coinage' }
    });

    if (coinageCompany) {
      const updatedCoinage = await prisma.userCompany.update({
        where: {
          userId_companyId: {
            userId: ivan.id,
            companyId: coinageCompany.id
          }
        },
        data: {
          lastAccessAt: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 dia atrás
        }
      });

      console.log('✅ LastAccessAt da Coinage atualizado para:', updatedCoinage.lastAccessAt);
    }

    console.log('✅ Empresa atual corrigida para NAVI!');

    // Mostrar status atual
    const updatedUserCompanies = await prisma.userCompany.findMany({
      where: { userId: ivan.id },
      include: { company: true },
      orderBy: { lastAccessAt: 'desc' }
    });

    console.log('\n📊 Empresas do usuário (ordenadas por último acesso):');
    updatedUserCompanies.forEach((uc, index) => {
      const current = index === 0 ? ' [ATUAL]' : '';
      console.log(`  ${index + 1}. ${uc.company.name} (${uc.company.alias}) - ${uc.role}${current}`);
    });

  } catch (error) {
    console.error('❌ Erro ao corrigir empresa atual:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixCurrentCompany();