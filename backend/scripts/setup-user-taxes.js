const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function setupUserTaxes() {
  try {
    console.log('🏦 Configurando taxas para usuário padrão...');

    // Buscar usuário padrão
    const defaultUser = await prisma.user.findUnique({
      where: {
        email: 'ivan.alberton@navi.inf.br'
      }
    });

    if (!defaultUser) {
      console.log('❌ Usuário padrão não encontrado!');
      return;
    }

    console.log(`👤 Usuário encontrado: ${defaultUser.name} (${defaultUser.email})`);

    // Verificar se já existe configuração de taxas
    let userTaxes = await prisma.userTaxes.findUnique({
      where: {
        userId: defaultUser.id
      }
    });

    if (userTaxes) {
      console.log('📋 Configuração de taxas já existe. Atualizando...');
      
      // Atualizar com taxa fixa de R$ 3,00 para depósitos
      userTaxes = await prisma.userTaxes.update({
        where: {
          userId: defaultUser.id
        },
        data: {
          // Para ter taxa FIXA de R$ 3,00, usamos uma porcentagem muito baixa com mínimo de 3
          depositFeePercent: 0.001, // 0.001% (praticamente zero)
          minDepositFee: 3.0, // Taxa mínima de R$ 3,00 (que será sempre aplicada)
          maxDepositFee: 3.0, // Taxa máxima de R$ 3,00 (para manter fixo)
          
          // Outras taxas (manter padrões)
          withdrawFeePercent: 0.5,
          minWithdrawFee: 2.0,
          exchangeFeePercent: 0.3,
          transferFeePercent: 0.1,
          
          // Metadados para lembrar da configuração
          metadata: {
            depositTaxType: 'fixed',
            depositFixedAmount: 3.0,
            currency: 'BRL',
            note: 'Taxa fixa de R$ 3,00 para depósitos'
          }
        }
      });
    } else {
      console.log('📋 Criando nova configuração de taxas...');
      
      // Criar nova configuração com taxa fixa de R$ 3,00 para depósitos
      userTaxes = await prisma.userTaxes.create({
        data: {
          userId: defaultUser.id,
          
          // Para ter taxa FIXA de R$ 3,00, usamos uma porcentagem muito baixa com mínimo de 3
          depositFeePercent: 0.001, // 0.001% (praticamente zero)
          minDepositFee: 3.0, // Taxa mínima de R$ 3,00 (que será sempre aplicada)
          maxDepositFee: 3.0, // Taxa máxima de R$ 3,00 (para manter fixo)
          
          // Outras taxas (padrões)
          withdrawFeePercent: 0.5,
          minWithdrawFee: 2.0,
          exchangeFeePercent: 0.3,
          transferFeePercent: 0.1,
          
          // Metadados
          metadata: {
            depositTaxType: 'fixed',
            depositFixedAmount: 3.0,
            currency: 'BRL',
            note: 'Taxa fixa de R$ 3,00 para depósitos'
          }
        }
      });
    }

    console.log('✅ Configuração de taxas configurada com sucesso!');
    console.log(`💰 Taxa de depósito: R$ 3,00 (fixa)`);
    console.log(`📊 Estrutura:`);
    console.log(`   - Percentual: ${userTaxes.depositFeePercent}% (quase zero)`);
    console.log(`   - Taxa mínima: R$ ${userTaxes.minDepositFee}`);
    console.log(`   - Taxa máxima: R$ ${userTaxes.maxDepositFee}`);

    // Teste com valor de exemplo
    console.log(`\n🧮 Exemplo de cálculo:`);
    const exampleAmount = 14.65;
    const taxAmount = Math.max(
      exampleAmount * (userTaxes.depositFeePercent / 100), // Percentual (quase zero)
      userTaxes.minDepositFee // Mínimo (R$ 3,00)
    );
    const finalTaxAmount = userTaxes.maxDepositFee ? Math.min(taxAmount, userTaxes.maxDepositFee) : taxAmount;
    const totalAmount = exampleAmount + finalTaxAmount;
    
    console.log(`   - Valor desejado: R$ ${exampleAmount.toFixed(2)}`);
    console.log(`   - Taxa calculada: R$ ${finalTaxAmount.toFixed(2)}`);
    console.log(`   - Total a pagar: R$ ${totalAmount.toFixed(2)}`);
    console.log(`   - Valor final (cBRL): ${exampleAmount.toFixed(2)}`);

  } catch (error) {
    console.error('❌ Erro ao configurar taxas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupUserTaxes();