const userCacheService = require('../src/services/userCache.service');

/**
 * Test cache for current logged user
 */
async function testCurrentUserCache() {
  console.log('🧪 Testing cache for current user...\n');

  const userId = '39f2d801-304b-4cd8-bda9-9fdda7e60266';
  const publicKey = '0x5528C065931f523CA9F3a6e49a911896fb1D2e6f';

  try {
    // Initialize cache service
    await userCacheService.initialize();
    console.log('✅ Cache service initialized');

    // Cache user data
    const userData = {
      id: userId,
      name: 'Ivan Alberton',
      email: 'ivan.alberton@navi.inf.br',
      phone: '46999716711',
      cpf: '02308739959',
      publicKey: publicKey,
      roles: ['USER', 'ADMIN', 'SUPER_ADMIN', 'APP_ADMIN'],
      isActive: true
    };

    await userCacheService.saveToCache(userId, 'postgres', { user: userData });
    console.log('✅ User PostgreSQL data cached');

    // Cache blockchain data
    const blockchainData = {
      address: publicKey,
      network: 'testnet',
      azeBalance: {
        balanceWei: '424822636000000000',
        balanceEth: '0.424822636'
      },
      tokenBalances: [
        {
          contractAddress: '0x0a8c73967e4eee8ffa06484c3fbf65e6ae3b9804',
          tokenName: 'Coinage Real Brasil',
          tokenSymbol: 'cBRL',
          tokenDecimals: 18,
          balanceWei: '101090000000000000000000',
          balanceEth: '101090.0'
        },
        {
          contractAddress: '0x575b05df92b1a2e7782322bb86a9ee1e5bf2edcd',
          tokenName: 'Stake Token Test',
          tokenSymbol: 'STT',
          tokenDecimals: 18,
          balanceWei: '999999794500001170267489711',
          balanceEth: '999999794.500001170267489711'
        }
      ],
      balancesTable: {
        'AZE-t': '0.424822636',
        'cBRL': '101090.0',
        'STT': '999999794.500001170267489711'
      },
      totalTokens: 3
    };

    await userCacheService.saveToCache(userId, 'blockchain', blockchainData);
    console.log('✅ User blockchain data cached');

    // Test retrieval
    const cachedPostgres = await userCacheService.getCachedData(userId, 'postgres');
    const cachedBlockchain = await userCacheService.getCachedData(userId, 'blockchain');
    const cachedAll = await userCacheService.getCachedData(userId, 'all');

    console.log('\n📊 Cache verification:');
    console.log('   PostgreSQL cache:', cachedPostgres ? '✅ Found' : '❌ Not found');
    console.log('   Blockchain cache:', cachedBlockchain ? '✅ Found' : '❌ Not found');
    console.log('   All cache:', cachedAll ? '✅ Found' : '❌ Not found');

    if (cachedAll) {
      console.log('\n🎯 Cached data structure:');
      console.log('   User name:', cachedAll.postgres?.user?.name);
      console.log('   User email:', cachedAll.postgres?.user?.email);
      console.log('   AZE balance:', cachedAll.blockchain?.balancesTable?.['AZE-t']);
      console.log('   cBRL balance:', cachedAll.blockchain?.balancesTable?.['cBRL']);
    }

    console.log('\n✅ Cache test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during cache test:', error.message);
  } finally {
    // Close cache service connection
    await userCacheService.disconnect();
    console.log('🔌 Cache service disconnected');
  }
}

// Run test
testCurrentUserCache();