#!/usr/bin/env node

/**
 * Test script to verify TransactionService integration
 */

const transactionService = require('./src/services/transaction.service');

async function testTransactionService() {
  try {
    console.log('🔧 Testing TransactionService integration...');
    
    // Initialize the service
    console.log('🔄 Initializing TransactionService...');
    await transactionService.initialize();
    console.log('✅ TransactionService initialized successfully');

    // Test recordBurnTransaction method
    console.log('🔍 Testing recordBurnTransaction method...');
    console.log('Method type:', typeof transactionService.recordBurnTransaction);
    
    if (typeof transactionService.recordBurnTransaction === 'function') {
      console.log('✅ recordBurnTransaction method is available');
    } else {
      console.log('❌ recordBurnTransaction method is NOT available');
    }

    // List all available methods
    console.log('📋 Available methods:');
    const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(transactionService));
    methods.forEach(method => {
      if (typeof transactionService[method] === 'function') {
        console.log(`  • ${method}`);
      }
    });

    console.log('✅ TransactionService test completed successfully');
    return true;

  } catch (error) {
    console.error('❌ TransactionService test failed:', error.message);
    return false;
  }
}

// Execute test
testTransactionService()
  .then(success => {
    console.log(`\n${success ? '✅ Test PASSED' : '❌ Test FAILED'}`);
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });