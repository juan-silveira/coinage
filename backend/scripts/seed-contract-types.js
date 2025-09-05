const { PrismaClient } = require('../src/generated/prisma');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function seedContractTypes() {
  try {
    console.log('🚀 Iniciando seed de contract_types...');

    // Contract types para criar
    const contractTypes = [
      {
        name: 'ERC20',
        description: 'Standard ERC20 Token Contract',
        category: 'token',
        abiPath: 'default_token_abi.json',
        version: '1.0.0',
        isActive: true
      },
      {
        name: 'STAKE',
        description: 'Staking Contract for Token Rewards',
        category: 'defi',
        abiPath: 'default_stake_abi.json',
        version: '1.0.0',
        isActive: true
      },
      {
        name: 'NFT',
        description: 'ERC721 Non-Fungible Token Contract',
        category: 'nft',
        abiPath: 'default_nft_abi.json',
        version: '1.0.0',
        isActive: true
      }
    ];

    for (const contractType of contractTypes) {
      try {
        // Verificar se já existe
        const existing = await prisma.contractType.findUnique({
          where: { name: contractType.name }
        });

        if (existing) {
          console.log(`✅ Contract type ${contractType.name} já existe`);
          continue;
        }

        // Criar novo contract type
        const created = await prisma.contractType.create({
          data: contractType
        });

        console.log(`✅ Contract type ${contractType.name} criado com ID: ${created.id}`);
      } catch (error) {
        console.error(`❌ Erro ao criar contract type ${contractType.name}:`, error.message);
      }
    }

    // Verificar se existe pelo menos uma company
    const companyCount = await prisma.company.count();
    if (companyCount === 0) {
      console.log('🔍 Nenhuma company encontrada, criando company padrão...');
      
      const defaultCompany = await prisma.company.create({
        data: {
          name: 'Coinage Platform',
          alias: 'coinage',
          isActive: true,
          rateLimit: {
            requestsPerDay: 10000,
            requestsPerHour: 1000,
            requestsPerMinute: 100
          }
        }
      });
      
      console.log(`✅ Company padrão criada com ID: ${defaultCompany.id}`);
    }

    console.log('✅ Seed de contract_types concluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao executar seed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar seed
seedContractTypes()
  .then(() => {
    console.log('✅ Script finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro no script:', error);
    process.exit(1);
  });