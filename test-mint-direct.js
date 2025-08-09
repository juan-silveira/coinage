#!/usr/bin/env node

// Script para testar mint diretamente sem passar por API/middleware
console.log('🧪 TESTE DIRETO: Iniciando teste de mint direto...');

async function testMintDirect() {
  try {
    // Simular o ambiente do container
    process.chdir('/usr/src/app');
    
    // Inicializar Prisma primeiro (como no server.js)
    console.log('🧪 TESTE DIRETO: Inicializando Prisma...');
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    global.prisma = prisma;
    console.log('🧪 TESTE DIRETO: Prisma inicializado com sucesso');
    
    // Importar os serviços necessários
    const tokenService = require('./src/services/token.service');
    
    console.log('🧪 TESTE DIRETO: TokenService importado com sucesso');
    
    // Parâmetros do teste
    const contractAddress = '0x0A8c73967e4Eee8ffA06484C3fBf65E6Ae3b9804';
    const toAddress = '0x5528C065931f523CA9F3a6e49a911896fb1D2e6f';
    const amount = '1';
    const gasPayer = '0x5528C065931f523CA9F3a6e49a911896fb1D2e6f';
    const options = { network: 'testnet' };
    
    console.log('🧪 TESTE DIRETO: Chamando tokenService.mintToken...');
    console.log('🧪 TESTE DIRETO: contractAddress:', contractAddress);
    console.log('🧪 TESTE DIRETO: toAddress:', toAddress);
    console.log('🧪 TESTE DIRETO: amount:', amount);
    console.log('🧪 TESTE DIRETO: gasPayer:', gasPayer);
    console.log('🧪 TESTE DIRETO: options:', options);
    
    const result = await tokenService.mintToken(
      contractAddress,
      toAddress,
      amount,
      gasPayer,
      options
    );
    
    console.log('🎉 TESTE DIRETO: Mint concluído com SUCESSO!');
    console.log('🎉 TESTE DIRETO: Resultado:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('❌ TESTE DIRETO: Erro no mint:', error.message);
    console.error('❌ TESTE DIRETO: Stack trace:', error.stack);
  }
}

testMintDirect();
