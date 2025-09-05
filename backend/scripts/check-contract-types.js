const { PrismaClient } = require('../src/generated/prisma');
const prisma = new PrismaClient();

async function checkContractTypes() {
  try {
    console.log('🔍 Verificando contract_types no banco de dados...\n');
    
    // Verificar contract types
    const types = await prisma.contractType.findMany();
    console.log(`✅ Contract Types encontrados: ${types.length}`);
    
    if (types.length === 0) {
      console.log('\n❌ NENHUM contract type encontrado!');
      console.log('   Isso explica o erro 400 ao registrar token.');
      console.log('   É necessário popular a tabela contract_types primeiro.');
      console.log('\n📝 Sugestão: Execute o script seed-contract-types.js');
      
      // Verificar se o script existe
      const fs = require('fs');
      const path = require('path');
      const seedScript = path.join(__dirname, 'seed-contract-types.js');
      
      if (fs.existsSync(seedScript)) {
        console.log(`\n✅ Script encontrado em: ${seedScript}`);
        console.log('   Execute: node scripts/seed-contract-types.js');
      } else {
        console.log('\n⚠️ Script seed-contract-types.js não encontrado.');
        console.log('   Vamos criar um para popular os dados básicos.');
      }
    } else {
      console.log('\nContract Types disponíveis:');
      types.forEach(type => {
        console.log(`  - ${type.name} (${type.category})`);
      });
      
      // Verificar se existe ERC20 específico
      const erc20 = await prisma.contractType.findFirst({
        where: { name: 'ERC20' }
      });
      
      if (erc20) {
        console.log('\n✅ ERC20 encontrado:');
        console.log(`   ID: ${erc20.id}`);
        console.log(`   Categoria: ${erc20.category}`);
        console.log(`   ABI Path: ${erc20.abiPath}`);
        console.log(`   Ativo: ${erc20.isActive}`);
      } else {
        console.log('\n⚠️ ERC20 não encontrado nos contract types!');
      }
    }
    
    // Verificar também SmartContracts registrados
    const contracts = await prisma.smartContract.count();
    console.log(`\n📊 SmartContracts registrados: ${contracts}`);
    
  } catch (error) {
    console.error('❌ Erro ao verificar contract_types:', error);
    console.error('\nDetalhes do erro:', error.message);
    
    if (error.code === 'P2021') {
      console.log('\n⚠️ A tabela contract_types não existe no banco.');
      console.log('   Execute: npx prisma migrate dev');
    }
  } finally {
    await prisma.$disconnect();
  }
}

checkContractTypes().catch(console.error);