#!/usr/bin/env node

/**
 * Test script to verify transaction recording works
 */

const transactionService = require('./src/services/transaction.service');
const prismaConfig = require('./src/config/prisma');

async function testTransactionRecording() {
  let prisma = null;
  
  try {
    console.log('🔧 Testing Transaction Recording...');
    
    // Initialize services
    console.log('🔄 Initializing services...');
    await transactionService.initialize();
    prisma = await prismaConfig.initialize();
    console.log('✅ Services initialized');

    // Get default company
    const company = await prisma.company.findFirst({
      where: { isActive: true }
    });
    
    if (!company) {
      throw new Error('No active company found');
    }
    
    // Get Ivan's user
    const user = await prisma.user.findUnique({
      where: { email: 'ivan.alberton@navi.inf.br' }
    });
    
    if (!user) {
      throw new Error('User not found');
    }

    console.log('👤 User found:', user.name);
    console.log('🏢 Company found:', company.name);

    // Test recordBurnTransaction
    console.log('💾 Testing recordBurnTransaction...');
    
    const testData = {
      companyId: company.id,
      userId: user.id,
      contractAddress: process.env.CBRL_TOKEN_ADDRESS || '0x0A8c73967e4Eee8ffA06484C3fBf65E6Ae3b9804',
      fromAddress: user.publicKey,
      gasPayer: user.publicKey,
      amount: '1',
      amountWei: BigInt('1000000000000000000'), // 1 token in wei
      txHash: '0xtest123456789abcdef' + Date.now(),
      blockNumber: BigInt('4266999'),
      gasUsed: BigInt('37559'),
      network: 'testnet'
    };

    console.log('📋 Test transaction data:', {
      companyId: testData.companyId,
      userId: testData.userId,
      contractAddress: testData.contractAddress,
      fromAddress: testData.fromAddress,
      amount: testData.amount,
      txHash: testData.txHash
    });

    const result = await transactionService.recordBurnTransaction(testData);
    console.log('✅ Transaction recorded successfully:', result.id);

    // Verify in database
    const savedTransaction = await prisma.transaction.findUnique({
      where: { id: result.id },
      include: {
        user: { select: { name: true, email: true } },
        company: { select: { name: true } }
      }
    });

    console.log('🔍 Verified in database:', {
      id: savedTransaction.id,
      transactionType: savedTransaction.transaction_type,
      functionName: savedTransaction.function_name,
      amount: savedTransaction.amount,
      currency: savedTransaction.currency,
      txHash: savedTransaction.tx_hash,
      user: savedTransaction.user.name,
      company: savedTransaction.company.name
    });

    console.log('✅ Transaction recording test PASSED');
    return true;

  } catch (error) {
    console.error('❌ Transaction recording test FAILED:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    return false;
  } finally {
    if (prisma) {
      await prismaConfig.close();
    }
  }
}

// Execute test
testTransactionRecording()
  .then(success => {
    console.log(`\n${success ? '✅ Test PASSED' : '❌ Test FAILED'}`);
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });