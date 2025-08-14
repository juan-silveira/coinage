const TokenAmountService = require('./backend/src/services/tokenAmount.service');

async function testBalanceDetection() {
  try {
    const tokenAmountService = new TokenAmountService();
    const userId = '34290450-ce0d-46fc-a370-6ffa787ea6b9';
    const publicKey = '0x5528C065931f523CA9F3a6e49a911896fb1D2e6f';
    
    console.log('🧪 Testando detecção de mudanças nos balances...');
    
    // Simular dados novos de blockchain com mudanças
    const newBalancesData = {
      balancesTable: {
        'AZE-t': '1.55000000', // Simulando aumento
        'cBRL': '100.50000000', // Simulando diminuição 
        'CNT': '5.00000000', // Novo token
        'STT': '1000.00000000' // Token existente sem mudança
      },
      network: 'testnet',
      totalTokens: 4
    };
    
    // Detectar mudanças (não é primeira carga)
    const result = await tokenAmountService.detectBalanceChanges(
      userId, 
      newBalancesData, 
      publicKey, 
      false // não é primeira sessão
    );
    
    console.log('✅ Resultado da detecção:', result);
    console.log(`📊 Mudanças detectadas: ${result.changes.length}`);
    console.log(`🆕 Novos tokens: ${result.newTokens.length}`);
    
    // Verificar notificações criadas
    setTimeout(async () => {
      console.log('\n🔔 Verificando novas notificações...');
      
      const response = await fetch('http://localhost:8800/api/notifications/unread-count', {
        headers: {
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjM0MjkwNDUwLWNlMGQtNDZmYy1hMzcwLTZmZmE3ODdlYTZiOSIsImVtYWlsIjoiaXZhbi5hbGJlcnRvbkBuYXZpLmluZi5iciIsIm5hbWUiOiJJdmFuIEFsYmVydG9uIiwidHlwZSI6ImFjY2VzcyIsImlhdCI6MTc1NTIxMTk1NywiZXhwIjoxNzU1MjEyODU3LCJhdWQiOiJhem9yZS1jbGllbnQiLCJpc3MiOiJhem9yZS1hcGkifQ.pShbH0WcDrkj-sT8ulHDyFfUlJfvDYh8B1Alyn1Oidc'
        }
      });
      
      const data = await response.json();
      console.log('📬 Total de notificações não lidas:', data.data.count);
      
      process.exit(0);
    }, 2000);
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
    process.exit(1);
  }
}

testBalanceDetection();