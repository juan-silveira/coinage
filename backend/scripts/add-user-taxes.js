/**
 * Script para adicionar taxas aos usuários existentes
 * Execute com: node scripts/add-user-taxes.js
 */

const { PrismaClient } = require('../src/generated/prisma');
const { DEFAULT_USER_TAXES, VIP_USER_TAXES } = require('../src/config/defaultTaxes');

const prisma = new PrismaClient();

async function addUserTaxes() {
  try {
    console.log('🚀 Iniciando adição de taxas aos usuários...');

    // Buscar o usuário Ivan
    const ivan = await prisma.user.findUnique({
      where: { email: 'ivan.alberton@navi.inf.br' },
      include: { userTaxes: true }
    });

    if (!ivan) {
      console.log('❌ Usuário Ivan não encontrado');
      return;
    }

    console.log(`✅ Usuário encontrado: ${ivan.name} (${ivan.email})`);

    // Verificar se já tem taxas configuradas
    if (ivan.userTaxes) {
      console.log('⚠️ Usuário já possui taxas configuradas');
      console.log('📊 Taxas atuais:', {
        depositFee: ivan.userTaxes.depositFee,
        withdrawFee: ivan.userTaxes.withdrawFee,
        pixValidation: ivan.userTaxes.pixValidation,
        exchangeFeePercent: ivan.userTaxes.exchangeFeePercent,
        transferFeePercent: ivan.userTaxes.transferFeePercent
      });
      
      // Perguntar se quer atualizar
      console.log('🔄 Atualizando taxas do usuário Ivan para valores padrão...');
      
      const updatedTaxes = await prisma.userTaxes.update({
        where: { userId: ivan.id },
        data: DEFAULT_USER_TAXES
      });
      
      console.log('✅ Taxas atualizadas com sucesso!');
      console.log('📊 Novas taxas:', {
        depositFee: updatedTaxes.depositFee,
        withdrawFee: updatedTaxes.withdrawFee,
        pixValidation: updatedTaxes.pixValidation,
        exchangeFeePercent: updatedTaxes.exchangeFeePercent,
        transferFeePercent: updatedTaxes.transferFeePercent
      });
    } else {
      // Criar taxas para o usuário
      console.log('📝 Criando taxas para o usuário...');
      
      const userTaxes = await prisma.userTaxes.create({
        data: {
          userId: ivan.id,
          ...DEFAULT_USER_TAXES
        }
      });

      console.log('✅ Taxas criadas com sucesso!');
      console.log('📊 Taxas aplicadas:', {
        depositFee: userTaxes.depositFee,
        withdrawFee: userTaxes.withdrawFee,
        pixValidation: userTaxes.pixValidation,
        exchangeFeePercent: userTaxes.exchangeFeePercent,
        transferFeePercent: userTaxes.transferFeePercent
      });
    }

    // Adicionar taxas para outros usuários sem taxas
    console.log('\n🔍 Buscando outros usuários sem taxas configuradas...');
    
    const usersWithoutTaxes = await prisma.user.findMany({
      where: {
        userTaxes: null
      }
    });

    if (usersWithoutTaxes.length > 0) {
      console.log(`📋 Encontrados ${usersWithoutTaxes.length} usuários sem taxas`);
      
      for (const user of usersWithoutTaxes) {
        console.log(`  - Adicionando taxas para: ${user.name} (${user.email})`);
        
        await prisma.userTaxes.create({
          data: {
            userId: user.id,
            ...DEFAULT_USER_TAXES
          }
        });
      }
      
      console.log('✅ Taxas adicionadas para todos os usuários!');
    } else {
      console.log('✅ Todos os usuários já possuem taxas configuradas');
    }

    // Mostrar resumo
    console.log('\n📊 Resumo das taxas padrão aplicadas:');
    console.log('  💰 Taxa de depósito: R$', DEFAULT_USER_TAXES.depositFee);
    console.log('  💸 Taxa de saque: R$', DEFAULT_USER_TAXES.withdrawFee);
    console.log('  🔍 Validação PIX: R$', DEFAULT_USER_TAXES.pixValidation);
    console.log('  🔄 Taxa de câmbio:', DEFAULT_USER_TAXES.exchangeFeePercent + '%');
    console.log('  📤 Taxa de transferência:', DEFAULT_USER_TAXES.transferFeePercent + '%');

  } catch (error) {
    console.error('❌ Erro ao adicionar taxas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o script
addUserTaxes();