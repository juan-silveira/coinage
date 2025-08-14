/**
 * Script para testar a detecção de balance AZE-t nativo
 */

// Simular a função do frontend
async function testAZEtBalanceDetection() {
  const address = '0x5528C065931f523CA9F3a6e49a911896fb1D2e6f';
  const AZORESCAN_API_BASE = 'https://floripa.azorescan.com/api';

  try {
    console.log('🧪 Testando detecção de balance AZE-t nativo...');
    console.log('📍 Endereço:', address);
    
    // Fazer duas chamadas: uma para tokens ERC-20 e outra para balance nativo
    const [tokensResponse, balanceResponse] = await Promise.all([
      // Buscar tokens ERC-20
      fetch(`${AZORESCAN_API_BASE}/?module=account&action=tokenlist&address=${address}`),
      // Buscar balance nativo AZE-t
      fetch(`${AZORESCAN_API_BASE}/?module=account&action=balance&address=${address}&tag=latest`)
    ]);
    
    if (!tokensResponse.ok || !balanceResponse.ok) {
      throw new Error(`HTTP error! tokens: ${tokensResponse.status}, balance: ${balanceResponse.status}`);
    }
    
    const [tokensData, balanceData] = await Promise.all([
      tokensResponse.json(),
      balanceResponse.json()
    ]);
    
    console.log('📊 Dados brutos da API:');
    console.log('  Balance nativo (wei):', balanceData.result);
    console.log('  Tokens ERC-20:', tokensData.result?.length || 0, 'encontrados');
    
    // Transformar dados
    const transformedBalances = {
      network: 'testnet',
      address: address,
      balancesTable: {},
      lastUpdated: new Date().toISOString(),
      source: 'azorescan'
    };
    
    // Adicionar balance nativo AZE-t primeiro
    if (balanceData.result) {
      const nativeBalance = parseFloat(balanceData.result) / Math.pow(10, 18); // AZE-t tem 18 decimais
      transformedBalances.balancesTable['AZE-t'] = nativeBalance.toFixed(6);
      console.log('💰 Balance nativo AZE-t:', nativeBalance.toFixed(6));
    }
    
    // Processar tokens ERC-20 se existirem
    if (tokensData.result && Array.isArray(tokensData.result)) {
      tokensData.result.forEach(token => {
        const symbol = token.symbol;
        const balance = parseFloat(token.balance) / Math.pow(10, parseInt(token.decimals));
        
        transformedBalances.balancesTable[symbol] = balance.toFixed(6);
        console.log(`🪙 Token ${symbol}:`, balance.toFixed(6));
      });
    }
    
    console.log('\n✅ Resultado final:');
    console.log('📋 Balances detectados:', transformedBalances.balancesTable);
    console.log('🎯 Total de tokens:', Object.keys(transformedBalances.balancesTable).length);
    console.log('🌟 Inclui AZE-t:', 'AZE-t' in transformedBalances.balancesTable ? 'SIM' : 'NÃO');
    
    // Simular comparação (como se fosse segunda execução)
    console.log('\n🧪 Simulando mudança de balance...');
    
    const previousBalances = { ...transformedBalances.balancesTable };
    
    // Simular pequena mudança no AZE-t
    const currentAZEt = parseFloat(previousBalances['AZE-t']);
    const newAZEt = currentAZEt + 0.001; // Adicionar 0.001 AZE-t
    
    const newBalances = {
      ...previousBalances,
      'AZE-t': newAZEt.toFixed(6)
    };
    
    console.log('📊 Comparação de balances:');
    console.log('  AZE-t anterior:', previousBalances['AZE-t']);
    console.log('  AZE-t novo:', newBalances['AZE-t']);
    console.log('  Diferença:', (newAZEt - currentAZEt).toFixed(6));
    
    const diff = Math.abs(newAZEt - currentAZEt);
    const isSignificantChange = diff > 0.000001;
    
    console.log('  É mudança significativa?', isSignificantChange ? 'SIM' : 'NÃO');
    
    if (isSignificantChange) {
      console.log('🔔 NOTIFICAÇÃO seria criada para mudança de AZE-t!');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testAZEtBalanceDetection();