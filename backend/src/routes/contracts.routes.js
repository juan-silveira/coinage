/**
 * Contract Interaction Routes
 * Routes for interacting with smart contracts (read/write operations)
 */

const express = require('express');
const router = express.Router();
const { ethers } = require('ethers');
const prismaConfig = require('../config/prisma');
const blockchainService = require('../services/blockchain.service');
const fs = require('fs');
const path = require('path');

// Helper function to get prisma instance
const getPrisma = () => {
  try {
    return prismaConfig.getPrisma();
  } catch (error) {
    console.error('Prisma not initialized:', error.message);
    throw new Error('Database connection not available');
  }
};

// Load ABIs
const loadTokenABI = () => {
  try {
    const abiPath = path.join(__dirname, '..', 'contracts', 'abis', 'default_token_abi.json');
    const abiContent = fs.readFileSync(abiPath, 'utf8');
    return JSON.parse(abiContent);
  } catch (error) {
    console.error('Error loading token ABI:', error);
    return null;
  }
};

const loadStakeABI = () => {
  try {
    const abiPath = path.join(__dirname, '..', 'contracts', 'abis', 'default_stake_abi.json');
    const abiContent = fs.readFileSync(abiPath, 'utf8');
    return JSON.parse(abiContent);
  } catch (error) {
    console.error('Error loading stake ABI:', error);
    return null;
  }
};

// Contract type IDs
const CONTRACT_TYPE_IDS = {
  TOKEN: '43667189-7fb5-45e6-a6a8-7541df3bcf1a',
  STAKE: 'b357140e-acc3-42ba-9828-fa6f9a109be1'
};

/**
 * GET /api/contracts/all
 * Get all contracts (tokens and stake) with their ABIs
 */
router.get('/all', async (req, res) => {
  try {
    const prisma = getPrisma();
    
    // Fetch all active contracts
    const contracts = await prisma.smartContract.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Load ABIs
    const tokenABI = loadTokenABI();
    const stakeABI = loadStakeABI();

    // Process contracts and add appropriate ABIs
    const processedContracts = contracts.map(contract => {
      let abi = contract.abi;
      let contractType = 'unknown';
      
      // Determine contract type based on contractTypeId or metadata
      if (contract.contractTypeId === CONTRACT_TYPE_IDS.TOKEN) {
        contractType = 'token';
        if (!abi && tokenABI) {
          abi = tokenABI;
        }
      } else if (contract.contractTypeId === CONTRACT_TYPE_IDS.STAKE) {
        contractType = 'stake';
        if (!abi && stakeABI) {
          abi = stakeABI;
        }
      } else {
        // Try to detect type from metadata or name
        const metadata = contract.metadata || {};
        const name = contract.name?.toLowerCase() || '';
        
        if (metadata.contractType === 'stake' || name.includes('stake') || name.includes('pedacinho')) {
          contractType = 'stake';
          if (!abi && stakeABI) {
            abi = stakeABI;
          }
        } else if (metadata.contractType === 'ERC20' || metadata.contractType === 'token' || name.includes('token')) {
          contractType = 'token';
          if (!abi && tokenABI) {
            abi = tokenABI;
          }
        }
      }

      return {
        id: contract.id,
        name: contract.name,
        address: contract.address,
        network: contract.network,
        contractType,
        symbol: contract.metadata?.symbol || null,
        tokenAddress: contract.metadata?.tokenAddress || null,
        adminAddress: contract.metadata?.adminAddress || null,
        description: contract.metadata?.description || null,
        isActive: contract.isActive,
        abi,
        createdAt: contract.createdAt
      };
    });

    res.json({
      success: true,
      data: processedContracts
    });

  } catch (error) {
    console.error('Error fetching contracts:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching contracts',
      error: error.message
    });
  }
});

/**
 * POST /api/contracts/read
 * Execute a read function on a smart contract (no gas required)
 */
router.post('/read', async (req, res) => {
  try {
    const { contractAddress, functionName, params = [], network = 'testnet' } = req.body;

    if (!contractAddress) {
      return res.status(400).json({
        success: false,
        message: 'Contract address is required'
      });
    }

    if (!functionName) {
      return res.status(400).json({
        success: false,
        message: 'Function name is required'
      });
    }

    // Get contract from database
    const prisma = getPrisma();
    const contract = await prisma.smartContract.findFirst({
      where: { 
        address: contractAddress,
        isActive: true
      }
    });

    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contract not found or inactive'
      });
    }

    // Get provider
    const provider = blockchainService.config.getProvider(network);
    
    // Parse ABI if it's a string
    const abi = typeof contract.abi === 'string' ? JSON.parse(contract.abi) : contract.abi;
    
    // Determine the caller address for functions that might require permissions
    const adminAddress = contract.metadata?.adminAddress;
    const fallbackAddress = '0x5528C065931f523CA9F3a6e49a911896fb1D2e6f';
    const callerAddress = adminAddress || fallbackAddress;
    
    console.log(`Using caller address for ${functionName}: ${callerAddress} (admin: ${adminAddress || 'not set'})`);
    
    // Create contract instance (we'll handle wallet connection if needed)
    const contractInstance = new ethers.Contract(contractAddress, abi, provider);

    // Check if function exists
    if (!contractInstance[functionName]) {
      return res.status(400).json({
        success: false,
        message: `Function '${functionName}' not found in contract`
      });
    }

    // Execute read function with timeout
    console.log(`Executing read function: ${functionName} with params:`, params);
    
    // Some functions like getAvailableRewardBalance may need more time to execute
    const timeoutDuration = functionName === 'getAvailableRewardBalance' ? 45000 : 10000; // 45s for balance check, 10s for others
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Function call timeout - function may not exist in deployed contract')), timeoutDuration);
    });
    
    // For functions that might require permissions, try with caller address context
    let functionPromise;
    
    // Try to detect functions that might need specific caller context
    const mightNeedPermissions = functionName.includes('Admin') || 
                                 functionName.includes('Balance') || 
                                 functionName.includes('Reward') ||
                                 functionName === 'getAvailableRewardBalance';
    
    if (mightNeedPermissions && callerAddress) {
      // For permission-sensitive functions, we need to use staticCall with specific from address
      try {
        console.log(`Attempting ${functionName} with caller context: ${callerAddress}`);
        
        // Use staticCall with specific from address for read functions that might check permissions
        const callData = contractInstance.interface.encodeFunctionData(functionName, params);
        
        functionPromise = provider.call({
          to: contractAddress,
          data: callData,
          from: callerAddress
        }).then(result => {
          // Decode the result
          return contractInstance.interface.decodeFunctionResult(functionName, result);
        });
      } catch (contextError) {
        console.log(`Failed with caller context, falling back to regular call:`, contextError.message);
        functionPromise = contractInstance[functionName](...params);
      }
    } else {
      // Regular function call for functions that don't need permissions
      functionPromise = contractInstance[functionName](...params);
    }
    
    const result = await Promise.race([functionPromise, timeoutPromise]);
    
    // Format result based on type (ethers v6 compatibility)
    let formattedResult;
    
    // Handle decoded result from staticCall (comes as Result array)
    let actualResult = result;
    if (result && typeof result === 'object' && result.length !== undefined && result.length === 1) {
      // If it's a Result array with single element, extract it
      actualResult = result[0];
    }
    
    if (typeof actualResult === 'bigint') {
      formattedResult = actualResult.toString();
    } else if (typeof actualResult === 'object' && actualResult._isBigNumber) {
      formattedResult = actualResult.toString();
    } else if (Array.isArray(actualResult)) {
      formattedResult = actualResult.map(item => {
        if (typeof item === 'bigint') return item.toString();
        if (typeof item === 'object' && item._isBigNumber) return item.toString();
        return item;
      });
    } else {
      formattedResult = actualResult;
    }

    res.json({
      success: true,
      data: {
        contractAddress,
        functionName,
        params,
        result: formattedResult,
        network,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error(`Error executing read function ${functionName}:`, error);
    
    // Parse specific contract call errors
    let errorMessage = 'Error executing contract function';
    let statusCode = 500;
    
    if (error.message && error.message.includes('Function call timeout')) {
      if (functionName === 'getAvailableRewardBalance') {
        errorMessage = `Function 'getAvailableRewardBalance' timed out - the reward balance query is taking too long. This may indicate network issues or the contract needs more time to process the request.`;
      } else {
        errorMessage = `Function '${functionName}' timed out - this function may not exist in the deployed contract`;
      }
      statusCode = 400;
    } else if (error.code === 'CALL_EXCEPTION') {
      if (error.reason && error.reason.includes('AccessControlUnauthorizedAccount')) {
        if (functionName === 'getAvailableRewardBalance') {
          errorMessage = `Function 'getAvailableRewardBalance' requires DEFAULT_ADMIN_ROLE to execute. This function can only be called by connecting an admin wallet to the contract, not through read-only interface. Implementation needed: configure ADMIN_PRIVATE_KEY in environment variables.`;
        } else {
          errorMessage = `Function '${functionName}' requires admin permissions. This function needs to be called with an admin wallet, not through read-only interface.`;
        }
        statusCode = 403; // Forbidden - access denied
      } else if (error.reason === null && error.data === null) {
        errorMessage = `Function '${functionName}' may not exist in the deployed contract, or the contract is not deployed at this address`;
        statusCode = 400;
      } else if (error.reason) {
        errorMessage = `Contract call failed: ${error.reason}`;
        statusCode = 400;
      } else {
        errorMessage = 'Contract call failed - the function may not exist or has execution errors';
        statusCode = 400;
      }
    } else if (error.reason) {
      errorMessage = error.reason;
    } else if (error.message) {
      errorMessage = error.message;
    }

    res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: error.toString(),
      details: {
        contractAddress,
        functionName,
        errorCode: error.code || 'UNKNOWN'
      }
    });
  }
});

/**
 * POST /api/contracts/write
 * Execute a write function on a smart contract (requires gas)
 */
router.post('/write', async (req, res) => {
  console.log('🚀🚀🚀 [CONTRACTS WRITE] REQUISIÇÃO RECEBIDA 🚀🚀🚀');
  console.log('🚀 [DEBUG] Body da requisição:', JSON.stringify(req.body, null, 2));
  console.log('🚀 [DEBUG] Headers da requisição:', JSON.stringify(req.headers, null, 2));
  
  try {
    const { 
      contractAddress, 
      functionName, 
      params = [], 
      gasPayer,
      network = 'testnet',
      gasLimit = 300000
    } = req.body;
    
    console.log('🔍 [DEBUG] Parâmetros extraídos:');
    console.log('  - contractAddress:', contractAddress);
    console.log('  - functionName:', functionName);
    console.log('  - params:', params);
    console.log('  - gasPayer:', gasPayer);
    console.log('  - network:', network);
    console.log('  - gasLimit:', gasLimit);

    if (!contractAddress) {
      return res.status(400).json({
        success: false,
        message: 'Contract address is required'
      });
    }

    if (!functionName) {
      return res.status(400).json({
        success: false,
        message: 'Function name is required'
      });
    }

    if (!gasPayer) {
      return res.status(400).json({
        success: false,
        message: 'Gas payer address is required'
      });
    }

    // Get contract from database
    const prisma = getPrisma();
    const contract = await prisma.smartContract.findFirst({
      where: { 
        address: contractAddress,
        isActive: true
      }
    });

    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contract not found or inactive'
      });
    }

    // Determine the gas payer: use admin address first, then fallback, then provided gasPayer
    const adminAddress = contract.metadata?.adminAddress;
    const fallbackAddress = '0x5528C065931f523CA9F3a6e49a911896fb1D2e6f';
    const actualGasPayer = gasPayer || adminAddress || fallbackAddress;
    
    console.log('💼 [DEBUG] Gas payer determination:');
    console.log('  - contract.metadata?.adminAddress:', adminAddress);
    console.log('  - provided gasPayer:', gasPayer);
    console.log('  - fallbackAddress:', fallbackAddress);
    console.log('  - actualGasPayer (final):', actualGasPayer);
    
    console.log(`🔑 [DEBUG] Tentando buscar usuário com publicKey: ${actualGasPayer}`);

    // Get user/admin by public key to get private key
    const user = await prisma.user.findFirst({
      where: {
        publicKey: actualGasPayer
      }
    });

    console.log('👤 [DEBUG] Resultado da busca do usuário:', user ? {
      id: user.id,
      email: user.email,
      publicKey: user.publicKey,
      hasPrivateKey: !!user.privateKey
    } : 'USUÁRIO NÃO ENCONTRADO');

    if (!user) {
      console.log('❌ [ERROR] Gas payer não encontrado no banco:', actualGasPayer);
      return res.status(404).json({
        success: false,
        message: `Gas payer not found: ${actualGasPayer}. Make sure this address is registered in the system.`
      });
    }

    if (!user.privateKey) {
      console.log('❌ [ERROR] Private key não disponível para:', actualGasPayer);
      console.log('🔍 [DEBUG] Verificando variáveis de ambiente:');
      console.log('  - ADMIN_WALLET_PUBLIC_KEY:', process.env.ADMIN_WALLET_PUBLIC_KEY);
      console.log('  - ADMIN_WALLET_PRIVATE_KEY exists:', !!process.env.ADMIN_WALLET_PRIVATE_KEY);
      
      return res.status(400).json({
        success: false,
        message: `Private key not available for gas payer: ${actualGasPayer}`
      });
    }

    // Get provider
    const provider = blockchainService.config.getProvider(network);
    
    // Create signer
    const signer = new ethers.Wallet(user.privateKey, provider);
    
    // Parse ABI if it's a string
    const abi = typeof contract.abi === 'string' ? JSON.parse(contract.abi) : contract.abi;
    
    // Create contract instance with signer
    const contractInstance = new ethers.Contract(contractAddress, abi, signer);

    // Check if function exists
    if (!contractInstance[functionName]) {
      return res.status(400).json({
        success: false,
        message: `Function '${functionName}' not found in contract`
      });
    }

    // Execute write function with timeout
    console.log(`Executing write function: ${functionName} with params:`, params);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Function call timeout - function may not exist in deployed contract')), 15000); // 15 second timeout for write operations
    });
    
    const functionPromise = contractInstance[functionName](...params, { gasLimit });
    const tx = await Promise.race([functionPromise, timeoutPromise]);
    
    console.log(`Transaction sent: ${tx.hash}`);
    
    // Wait for confirmation
    const receipt = await tx.wait();
    
    console.log(`Transaction confirmed: ${receipt.status === 1 ? 'SUCCESS' : 'FAILED'}`);

    // Log transaction in database
    try {
      await prisma.transaction.create({
        data: {
          hash: tx.hash,
          userId: user.id,
          companyId: user.companyId,
          contractAddress,
          functionName,
          params: JSON.stringify(params),
          network,
          status: receipt.status === 1 ? 'COMPLETED' : 'FAILED',
          gasUsed: receipt.gasUsed.toString(),
          blockNumber: receipt.blockNumber,
          metadata: {
            from: signer.address,
            to: contractAddress,
            gasLimit: gasLimit.toString(),
            confirmations: receipt.confirmations
          }
        }
      });
    } catch (logError) {
      console.error('Error logging transaction:', logError);
      // Continue even if logging fails
    }

    res.json({
      success: true,
      data: {
        transactionHash: tx.hash,
        contractAddress,
        functionName,
        params,
        gasUsed: receipt.gasUsed.toString(),
        blockNumber: receipt.blockNumber,
        status: receipt.status === 1 ? 'SUCCESS' : 'FAILED',
        network,
        from: signer.address,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error executing write function:', error);
    
    // Parse specific contract call errors
    let errorMessage = 'Error executing contract function';
    let statusCode = 500;
    
    if (error.message && error.message.includes('Function call timeout')) {
      errorMessage = `Function '${functionName}' timed out - this function may not exist in the deployed contract`;
      statusCode = 400;
    } else if (error.code === 'CALL_EXCEPTION') {
      if (error.reason === null && error.data === null) {
        errorMessage = `Function '${functionName}' may not exist in the deployed contract, or the contract is not deployed at this address`;
        statusCode = 400;
      } else if (error.reason) {
        errorMessage = `Contract call failed: ${error.reason}`;
        statusCode = 400;
      } else {
        errorMessage = 'Contract call failed - the function may not exist or has execution errors';
        statusCode = 400;
      }
    } else if (error.code === 'INSUFFICIENT_FUNDS') {
      errorMessage = 'Insufficient funds for gas';
      statusCode = 400;
    } else if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
      errorMessage = 'Transaction would fail - check function parameters';
      statusCode = 400;
    } else if (error.reason) {
      errorMessage = error.reason;
    } else if (error.message) {
      errorMessage = error.message;
    }

    res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: error.toString(),
      details: {
        contractAddress,
        functionName,
        errorCode: error.code || 'UNKNOWN'
      }
    });
  }
});

/**
 * POST /api/contracts/update-abis
 * Force update ABIs for all contracts based on their type
 */
router.post('/update-abis', async (req, res) => {
  try {
    const prisma = getPrisma();
    
    // Load ABIs
    const tokenABI = loadTokenABI();
    const stakeABI = loadStakeABI();
    
    if (!tokenABI || !stakeABI) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao carregar ABIs padrão'
      });
    }
    
    // Get all contracts
    const contracts = await prisma.smartContract.findMany({
      where: { isActive: true }
    });
    
    let updated = 0;
    
    for (const contract of contracts) {
      let shouldUpdate = false;
      let newABI = null;
      let newContractTypeId = null;
      
      // Determine contract type and update if needed
      if (contract.contractTypeId === CONTRACT_TYPE_IDS.TOKEN) {
        newABI = tokenABI;
        shouldUpdate = true;
      } else if (contract.contractTypeId === CONTRACT_TYPE_IDS.STAKE) {
        newABI = stakeABI;
        shouldUpdate = true;
      } else {
        // Try to detect type from metadata or name
        const metadata = contract.metadata || {};
        const name = contract.name?.toLowerCase() || '';
        
        if (metadata.contractType === 'stake' || name.includes('stake') || name.includes('pedacinho')) {
          newABI = stakeABI;
          newContractTypeId = CONTRACT_TYPE_IDS.STAKE;
          shouldUpdate = true;
        } else if (metadata.contractType === 'ERC20' || metadata.contractType === 'token' || name.includes('token')) {
          newABI = tokenABI;
          newContractTypeId = CONTRACT_TYPE_IDS.TOKEN;
          shouldUpdate = true;
        }
      }
      
      if (shouldUpdate && newABI) {
        const updateData = {
          abi: newABI,
          updatedAt: new Date()
        };
        
        if (newContractTypeId) {
          updateData.contractTypeId = newContractTypeId;
        }
        
        await prisma.smartContract.update({
          where: { id: contract.id },
          data: updateData
        });
        
        updated++;
        console.log(`Updated contract ${contract.name} (${contract.address}) with new ABI`);
      }
    }
    
    res.json({
      success: true,
      message: `ABIs atualizados com sucesso para ${updated} contratos`,
      data: {
        totalContracts: contracts.length,
        updatedContracts: updated
      }
    });
    
  } catch (error) {
    console.error('Error updating ABIs:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar ABIs',
      error: error.message
    });
  }
});

/**
 * POST /api/contracts/estimate-gas
 * Estimate gas for a write function
 */
router.post('/estimate-gas', async (req, res) => {
  try {
    const { 
      contractAddress, 
      functionName, 
      params = [], 
      gasPayer,
      network = 'testnet'
    } = req.body;

    if (!contractAddress || !functionName || !gasPayer) {
      return res.status(400).json({
        success: false,
        message: 'Contract address, function name, and gas payer are required'
      });
    }

    // Get contract from database
    const prisma = getPrisma();
    const contract = await prisma.smartContract.findFirst({
      where: { 
        address: contractAddress,
        isActive: true
      }
    });

    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contract not found or inactive'
      });
    }

    // Get provider
    const provider = blockchainService.config.getProvider(network);
    
    // Parse ABI if it's a string
    const abi = typeof contract.abi === 'string' ? JSON.parse(contract.abi) : contract.abi;
    
    // Create contract instance
    const contractInstance = new ethers.Contract(contractAddress, abi, provider);

    // Estimate gas
    const estimatedGas = await contractInstance[functionName].estimateGas(...params, { from: gasPayer });
    
    // Get current gas price
    const gasPrice = await provider.getGasPrice();
    
    // Calculate estimated cost (ethers v6 uses BigInt)
    const estimatedCost = estimatedGas * gasPrice;

    res.json({
      success: true,
      data: {
        estimatedGas: estimatedGas.toString(),
        gasPrice: gasPrice.toString(),
        estimatedCost: ethers.formatEther(estimatedCost),
        network
      }
    });

  } catch (error) {
    console.error('Error estimating gas:', error);
    res.status(500).json({
      success: false,
      message: 'Error estimating gas',
      error: error.message
    });
  }
});

module.exports = router;