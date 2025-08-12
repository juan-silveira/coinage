const TokenAmountService = require('../src/services/tokenAmount.service');

async function testBalanceDetection() {
  try {
    console.log('🧪 Testando detecção automática de mudanças nos saldos...\n');

    // Inicializar o serviço
    const tokenAmountService = new TokenAmountService();
    await tokenAmountService.initialize();

    // Simular um usuário
    const testUserId = 'test-user-123';
    const testPublicKey = '0x1234567890abcdef1234567890abcdef12345678';

    console.log('1. Simulando primeira verificação de saldos...');
    
    // Primeira verificação (saldos iniciais)
    const initialBalances = {
      balancesTable: {
        'AZE': '100.0',
        'cBRL': '50.0',
        'CNT': '25.0'
      }
    };

    // Simular detecção de mudanças (primeira vez, não deve criar notificações)
    await tokenAmountService.detectBalanceChanges(testUserId, initialBalances, testPublicKey);
    console.log('✅ Primeira verificação concluída (sem notificações esperadas)');

    console.log('\n2. Simulando segunda verificação com mudanças...');
    
    // Segunda verificação (com mudanças)
    const updatedBalances = {
      balancesTable: {
        'AZE': '150.0',    // +50 AZE (recebimento)
        'cBRL': '45.0',    // -5 cBRL (transferência)
        'CNT': '25.0'      // Sem mudança
      }
    };

    // Simular detecção de mudanças (deve criar notificações)
    await tokenAmountService.detectBalanceChanges(testUserId, updatedBalances, testPublicKey);
    console.log('✅ Segunda verificação concluída (notificações criadas para mudanças)');

    console.log('\n3. Simulando terceira verificação com mais mudanças...');
    
    // Terceira verificação (com mais mudanças)
    const finalBalances = {
      balancesTable: {
        'AZE': '140.0',    // -10 AZE (transferência)
        'cBRL': '50.0',    // +5 cBRL (recebimento)
        'CNT': '30.0'      // +5 CNT (recebimento)
      }
    };

    // Simular detecção de mudanças
    await tokenAmountService.detectBalanceChanges(testUserId, finalBalances, testPublicKey);
    console.log('✅ Terceira verificação concluída (mais notificações criadas)');

    console.log('\n🎉 Teste de detecção de mudanças concluído!');
    console.log('📱 Verifique se as notificações foram criadas no banco de dados.');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar teste
testBalanceDetection();
