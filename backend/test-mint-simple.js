require('dotenv').config({ path: '.env.testnet' });

async function testMintSimple() {
  try {
    console.log('🔍 Testando mint service diretamente...');
    console.log('🔑 Private key configurada:', process.env.ADMIN_WALLET_PRIVATE_KEY ? 'SIM' : 'NÃO');
    
    const mintService = require('./src/services/mint.service');
    
    console.log('📋 Configurações do MintService:');
    console.log('   TOKEN_CONTRACT_ADDRESS:', mintService.CONFIG.TOKEN_CONTRACT_ADDRESS);
    console.log('   ADMIN_ADDRESS:', mintService.CONFIG.ADMIN_ADDRESS);
    console.log('   ADMIN_PRIVATE_KEY:', mintService.CONFIG.ADMIN_PRIVATE_KEY ? 'CONFIGURADA' : 'NÃO CONFIGURADA');
    
    if (!mintService.CONFIG.ADMIN_PRIVATE_KEY) {
      console.log('❌ Private key não carregada. Verificando variáveis...');
      console.log('   process.env.ADMIN_WALLET_PRIVATE_KEY:', process.env.ADMIN_WALLET_PRIVATE_KEY ? 'EXISTE' : 'NÃO EXISTE');
      return;
    }
    
    // Teste de mint
    const result = await mintService.mintCBRL(
      '0x5528C065931f523CA9F3a6e49a911896fb1D2e6f',
      '10',
      'testnet',
      'test-' + Date.now()
    );
    
    console.log('✅ Resultado do mint:', result);
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

testMintSimple();