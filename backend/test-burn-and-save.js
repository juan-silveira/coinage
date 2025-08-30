#!/usr/bin/env node

/**
 * Test script to perform a burn transaction and save it to database
 * This script will:
 * 1. Connect to Prisma database
 * 2. Use burn service to burn 10 cBRL from Ivan's account
 * 3. Save the transaction to the database with proper contract_call type
 * 4. Log all steps clearly
 */

const path = require('path');
const { ethers } = require('ethers');

// Import services
const prismaConfig = require('./src/config/prisma');
const burnService = require('./src/services/burn.service');
const transactionService = require('./src/services/transaction.service');

// Configuration
const CONFIG = {
  // Ivan's wallet address from the project documentation
  IVAN_ADDRESS: '0x5528C065931f523CA9F3a6e49a911896fb1D2e6f',
  BURN_AMOUNT: '10', // 10 cBRL
  NETWORK: process.env.DEFAULT_NETWORK || 'testnet',
  COMPANY_ID: process.env.DEFAULT_COMPANY_ID || null, // Will need to get from database
  TOKEN_CONTRACT_ADDRESS: process.env.CBRL_CONTRACT_ADDRESS || '0x0A8c73967e4Eee8ffA06484C3fBf65E6Ae3b9804'
};

/**
 * Get Ivan's user ID from database
 */
async function getIvanUserId(prisma) {
  console.log('\n🔍 Looking for Ivan\'s user in database...');
  
  const ivanEmail = 'ivan.alberton@navi.inf.br';
  const user = await prisma.user.findUnique({
    where: { email: ivanEmail },
    select: { 
      id: true, 
      name: true, 
      email: true, 
      publicKey: true,
      isActive: true,
      balance: true 
    }
  });

  if (!user) {
    throw new Error(`User not found with email: ${ivanEmail}`);
  }

  console.log('✅ Ivan found in database:', {
    id: user.id,
    name: user.name,
    email: user.email,
    publicKey: user.publicKey,
    isActive: user.isActive,
    balance: user.balance.toString()
  });

  // Verify the public key matches our expected address
  if (user.publicKey.toLowerCase() !== CONFIG.IVAN_ADDRESS.toLowerCase()) {
    console.warn('⚠️  Warning: Public key in database does not match expected address');
    console.warn(`Database: ${user.publicKey}`);
    console.warn(`Expected: ${CONFIG.IVAN_ADDRESS}`);
  }

  return user;
}

/**
 * Get default company ID
 */
async function getDefaultCompanyId(prisma) {
  console.log('\n🔍 Looking for default company...');
  
  const company = await prisma.company.findFirst({
    where: { isActive: true },
    select: { id: true, name: true, alias: true }
  });

  if (!company) {
    throw new Error('No active company found in database');
  }

  console.log('✅ Default company found:', {
    id: company.id,
    name: company.name,
    alias: company.alias
  });

  return company;
}

/**
 * Perform burn transaction
 */
async function performBurnTransaction() {
  console.log('\n🔥 Starting burn transaction...');
  console.log('Configuration:', {
    fromAddress: CONFIG.IVAN_ADDRESS,
    amount: CONFIG.BURN_AMOUNT,
    network: CONFIG.NETWORK,
    tokenContract: CONFIG.TOKEN_CONTRACT_ADDRESS
  });

  try {
    const burnResult = await burnService.burnFromCBRL(
      CONFIG.IVAN_ADDRESS,
      CONFIG.BURN_AMOUNT,
      CONFIG.NETWORK
    );

    console.log('✅ Burn transaction successful:', {
      transactionHash: burnResult.transactionHash,
      blockNumber: burnResult.blockNumber,
      gasUsed: burnResult.gasUsed,
      amountBurned: burnResult.amountBurned,
      initialBalance: burnResult.initialBalance,
      finalBalance: burnResult.finalBalance,
      difference: burnResult.difference
    });

    return burnResult;
  } catch (error) {
    console.error('❌ Burn transaction failed:', error);
    throw error;
  }
}

/**
 * Save transaction to database
 */
async function saveTransactionToDatabase(burnResult, userId, companyId) {
  console.log('\n💾 Saving transaction to database...');

  try {
    // Prepare transaction data
    const amountInWei = ethers.parseUnits(CONFIG.BURN_AMOUNT, 18);
    
    const transactionData = {
      companyId: companyId,
      userId: userId,
      contractAddress: CONFIG.TOKEN_CONTRACT_ADDRESS,
      fromAddress: CONFIG.IVAN_ADDRESS,
      amount: parseFloat(CONFIG.BURN_AMOUNT),
      amountWei: amountInWei,
      gasPayer: CONFIG.IVAN_ADDRESS, // Admin pays gas
      network: CONFIG.NETWORK,
      txHash: burnResult.transactionHash,
      gasUsed: burnResult.gasUsed ? BigInt(burnResult.gasUsed) : null,
      gasPrice: null, // Not available in burn result
      blockNumber: burnResult.blockNumber ? BigInt(burnResult.blockNumber) : null,
      status: 'confirmed'
    };

    console.log('📋 Transaction data prepared:', {
      companyId: transactionData.companyId,
      userId: transactionData.userId,
      contractAddress: transactionData.contractAddress,
      fromAddress: transactionData.fromAddress,
      amount: transactionData.amount,
      amountWei: transactionData.amountWei.toString(),
      txHash: transactionData.txHash,
      blockNumber: transactionData.blockNumber?.toString(),
      gasUsed: transactionData.gasUsed?.toString()
    });

    // Save using transaction service
    const savedTransaction = await transactionService.recordBurnTransaction(transactionData);

    console.log('✅ Transaction saved to database:', {
      id: savedTransaction.id,
      txHash: savedTransaction.txHash,
      type: savedTransaction.transactionType,
      status: savedTransaction.status,
      functionName: savedTransaction.functionName,
      createdAt: savedTransaction.createdAt
    });

    return savedTransaction;
  } catch (error) {
    console.error('❌ Failed to save transaction to database:', error);
    throw error;
  }
}

/**
 * Verify saved transaction
 */
async function verifyTransaction(prisma, savedTransaction) {
  console.log('\n🔍 Verifying saved transaction...');

  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id: savedTransaction.id },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        company: {
          select: { id: true, name: true, alias: true }
        }
      }
    });

    if (!transaction) {
      throw new Error('Transaction not found after saving');
    }

    console.log('✅ Transaction verified in database:', {
      id: transaction.id,
      transactionType: transaction.transactionType,
      status: transaction.status,
      functionName: transaction.functionName,
      txHash: transaction.txHash,
      blockNumber: transaction.blockNumber?.toString(),
      contractAddress: transaction.contractAddress,
      fromAddress: transaction.fromAddress,
      toAddress: transaction.toAddress,
      gasUsed: transaction.gasUsed?.toString(),
      metadata: transaction.metadata,
      user: transaction.user,
      company: transaction.company,
      createdAt: transaction.createdAt
    });

    return transaction;
  } catch (error) {
    console.error('❌ Failed to verify transaction:', error);
    throw error;
  }
}

/**
 * Main execution function
 */
async function main() {
  let prisma = null;
  
  try {
    console.log('🚀 Starting burn transaction and database save test');
    console.log('📅 Timestamp:', new Date().toISOString());
    console.log('🌐 Network:', CONFIG.NETWORK);
    console.log('💰 Amount to burn:', CONFIG.BURN_AMOUNT, 'cBRL');
    console.log('👤 Target address:', CONFIG.IVAN_ADDRESS);

    // Step 1: Initialize database connection
    console.log('\n📦 Step 1: Connecting to database...');
    prisma = await prismaConfig.initialize();
    console.log('✅ Database connected successfully');

    // Step 2: Get user information
    console.log('\n👤 Step 2: Getting user information...');
    const user = await getIvanUserId(prisma);

    // Step 3: Get company information
    console.log('\n🏢 Step 3: Getting company information...');
    const company = await getDefaultCompanyId(prisma);

    // Step 4: Perform burn transaction
    console.log('\n🔥 Step 4: Performing burn transaction...');
    const burnResult = await performBurnTransaction();

    // Step 5: Save transaction to database
    console.log('\n💾 Step 5: Saving transaction to database...');
    const savedTransaction = await saveTransactionToDatabase(burnResult, user.id, company.id);

    // Step 6: Verify saved transaction
    console.log('\n🔍 Step 6: Verifying saved transaction...');
    const verifiedTransaction = await verifyTransaction(prisma, savedTransaction);

    // Final summary
    console.log('\n🎉 TEST COMPLETED SUCCESSFULLY!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 SUMMARY:');
    console.log(`  • Burned: ${CONFIG.BURN_AMOUNT} cBRL`);
    console.log(`  • From: ${CONFIG.IVAN_ADDRESS}`);
    console.log(`  • Network: ${CONFIG.NETWORK}`);
    console.log(`  • Transaction Hash: ${burnResult.transactionHash}`);
    console.log(`  • Block Number: ${burnResult.blockNumber}`);
    console.log(`  • Gas Used: ${burnResult.gasUsed}`);
    console.log(`  • Database ID: ${verifiedTransaction.id}`);
    console.log(`  • Status: ${verifiedTransaction.status}`);
    console.log(`  • Function: ${verifiedTransaction.functionName}`);
    console.log(`  • Explorer: ${burnResult.explorerUrl}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    return {
      success: true,
      burnResult,
      savedTransaction: verifiedTransaction,
      summary: {
        amountBurned: CONFIG.BURN_AMOUNT,
        fromAddress: CONFIG.IVAN_ADDRESS,
        network: CONFIG.NETWORK,
        transactionHash: burnResult.transactionHash,
        blockNumber: burnResult.blockNumber,
        gasUsed: burnResult.gasUsed,
        databaseId: verifiedTransaction.id,
        status: verifiedTransaction.status,
        functionName: verifiedTransaction.functionName
      }
    };

  } catch (error) {
    console.error('\n❌ TEST FAILED!');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('💥 ERROR DETAILS:');
    console.error('  Message:', error.message);
    
    if (error.stack) {
      console.error('  Stack trace:');
      console.error(error.stack);
    }
    
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    return {
      success: false,
      error: {
        message: error.message,
        stack: error.stack
      }
    };
  } finally {
    // Clean up database connection
    if (prisma) {
      console.log('\n🔌 Closing database connection...');
      await prismaConfig.close();
      console.log('✅ Database connection closed');
    }
  }
}

// Execute if run directly
if (require.main === module) {
  main()
    .then((result) => {
      if (result.success) {
        console.log('\n✅ Script completed successfully');
        process.exit(0);
      } else {
        console.log('\n❌ Script failed');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('\n💥 Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = { main, CONFIG };