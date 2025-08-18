/**
 * Serviço Mock para Simular Fluxo de Depósito
 * Simula todo o processo desde criação até confirmação na blockchain
 */

// Simular delay para tornar mais realista
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Banco de dados mock em memória
const mockDatabase = {
  transactions: new Map(),
  nextId: 1,
  
  // Gerar ID único
  generateId() {
    return this.nextId++;
  },
  
  // Criar transação
  createTransaction(data) {
    const id = this.generateId();
    const transaction = {
      id,
      ...data,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      blockchainData: null
    };
    
    this.transactions.set(id, transaction);
    return transaction;
  },
  
  // Buscar transação
  getTransaction(id) {
    return this.transactions.get(parseInt(id));
  },
  
  // Atualizar transação
  updateTransaction(id, data) {
    const transaction = this.transactions.get(parseInt(id));
    if (transaction) {
      Object.assign(transaction, data, {
        updatedAt: new Date().toISOString()
      });
      this.transactions.set(parseInt(id), transaction);
    }
    return transaction;
  },
  
  // Listar transações
  listTransactions(userId) {
    return Array.from(this.transactions.values())
      .filter(tx => tx.userId === userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
};

// Simular dados da blockchain
const generateBlockchainData = () => {
  const hash = '0x' + Math.random().toString(16).substr(2, 64);
  const blockNumber = Math.floor(Math.random() * 1000000) + 1000000;
  const gasUsed = Math.floor(Math.random() * 500000) + 100000;
  
  return {
    transactionHash: hash,
    blockNumber,
    gasUsed,
    gasPrice: '20000000000', // 20 Gwei
    confirmations: 12,
    timestamp: new Date().toISOString()
  };
};

// Simular processamento na blockchain
const simulateBlockchainProcessing = async (transactionId) => {
  // Simular tempo de processamento (entre 10 e 30 segundos)
  const processingTime = Math.random() * 20000 + 10000;
  
  console.log(`🔄 Simulando processamento da transação ${transactionId}...`);
  console.log(`⏱️ Tempo estimado: ${Math.round(processingTime / 1000)} segundos`);
  
  await delay(processingTime);
  
  // Simular confirmação na blockchain
  const blockchainData = generateBlockchainData();
  
  console.log(`✅ Transação ${transactionId} confirmada na blockchain!`);
  console.log(`🔗 Hash: ${blockchainData.transactionHash}`);
  console.log(`📦 Bloco: ${blockchainData.blockNumber}`);
  
  // Atualizar transação no banco mock
  mockDatabase.updateTransaction(transactionId, {
    status: 'confirmed',
    blockchainData
  });
  
  return blockchainData;
};

// Simular falha ocasional (5% de chance)
const simulateRandomFailure = () => {
  return Math.random() < 0.05;
};

// Serviço principal
const mockDepositService = {
  /**
   * Criar novo depósito
   */
  async createDeposit(depositData) {
    try {
      console.log('💰 Criando depósito mock:', depositData);
      
      // Simular delay de criação
      await delay(1000 + Math.random() * 2000);
      
      // Criar transação no banco mock
      const transaction = mockDatabase.createTransaction({
        ...depositData,
        description: `Depósito de R$ ${depositData.amount}`,
        currency: 'BRL',
        tokenSymbol: 'BRL',
        metadata: {
          type: 'deposit',
          currency: 'BRL',
          source: 'mock'
        }
      });
      
      console.log('✅ Depósito criado com sucesso:', transaction);
      
      // Iniciar processamento assíncrono na blockchain
      this.processDepositAsync(transaction.id);
      
      return {
        success: true,
        message: 'Depósito criado com sucesso',
        transaction
      };
      
    } catch (error) {
      console.error('❌ Erro ao criar depósito:', error);
      return {
        success: false,
        message: 'Erro interno ao criar depósito',
        error: error.message
      };
    }
  },
  
  /**
   * Processar depósito de forma assíncrona (simula worker)
   */
  async processDepositAsync(transactionId) {
    try {
      // Simular delay inicial
      await delay(2000 + Math.random() * 3000);
      
      // Simular falha ocasional
      if (simulateRandomFailure()) {
        console.log(`❌ Falha simulada na transação ${transactionId}`);
        
        mockDatabase.updateTransaction(transactionId, {
          status: 'failed',
          metadata: {
            ...mockDatabase.getTransaction(transactionId).metadata,
            failureReason: 'Simulação de falha na blockchain',
            failedAt: new Date().toISOString()
          }
        });
        
        return;
      }
      
      // Simular processamento na blockchain
      await simulateBlockchainProcessing(transactionId);
      
    } catch (error) {
      console.error(`❌ Erro no processamento da transação ${transactionId}:`, error);
      
      mockDatabase.updateTransaction(transactionId, {
        status: 'failed',
        metadata: {
          ...mockDatabase.getTransaction(transactionId).metadata,
          failureReason: 'Erro interno no processamento',
          failedAt: new Date().toISOString()
        }
      });
    }
  },
  
  /**
   * Buscar transação por ID
   */
  async getTransaction(transactionId) {
    try {
      console.log('🔍 Buscando transação:', transactionId);
      
      // Simular delay de busca
      await delay(500 + Math.random() * 1000);
      
      const transaction = mockDatabase.getTransaction(transactionId);
      
      if (!transaction) {
        return {
          success: false,
          message: 'Transação não encontrada'
        };
      }
      
      console.log('✅ Transação encontrada:', transaction);
      
      return {
        success: true,
        transaction
      };
      
    } catch (error) {
      console.error('❌ Erro ao buscar transação:', error);
      return {
        success: false,
        message: 'Erro interno ao buscar transação',
        error: error.message
      };
    }
  },
  
  /**
   * Listar transações do usuário
   */
  async listUserTransactions(userId) {
    try {
      console.log('📋 Listando transações do usuário:', userId);
      
      // Simular delay de busca
      await delay(800 + Math.random() * 1200);
      
      const transactions = mockDatabase.listTransactions(userId);
      
      console.log(`✅ Encontradas ${transactions.length} transações`);
      
      return {
        success: true,
        transactions,
        total: transactions.length
      };
      
    } catch (error) {
      console.error('❌ Erro ao listar transações:', error);
      return {
        success: false,
        message: 'Erro interno ao listar transações',
        error: error.message
      };
    }
  },
  
  /**
   * Simular múltiplos depósitos para teste
   */
  async seedMockData(userId) {
    console.log('🌱 Criando dados mock para usuário:', userId);
    
    const mockDeposits = [
      { amount: 50.00, description: 'Depósito inicial' },
      { amount: 100.00, description: 'Depósito de teste' },
      { amount: 25.50, description: 'Depósito pequeno' },
      { amount: 200.00, description: 'Depósito grande' },
      { amount: 75.25, description: 'Depósito médio' }
    ];
    
    const results = [];
    
    for (const deposit of mockDeposits) {
      const result = await this.createDeposit({
        ...deposit,
        userId,
        metadata: {
          type: 'deposit',
          currency: 'BRL',
          source: 'mock-seed'
        }
      });
      
      if (result.success) {
        results.push(result.transaction);
      }
    }
    
    console.log(`✅ Criados ${results.length} depósitos mock`);
    return results;
  },
  
  /**
   * Limpar dados mock (útil para testes)
   */
  clearMockData() {
    console.log('🧹 Limpando dados mock...');
    mockDatabase.transactions.clear();
    mockDatabase.nextId = 1;
    console.log('✅ Dados mock limpos');
  },
  
  /**
   * Obter estatísticas dos dados mock
   */
  getMockStats() {
    const transactions = Array.from(mockDatabase.transactions.values());
    const stats = {
      total: transactions.length,
      pending: transactions.filter(tx => tx.status === 'pending').length,
      confirmed: transactions.filter(tx => tx.status === 'confirmed').length,
      failed: transactions.filter(tx => tx.status === 'failed').length,
      totalAmount: transactions
        .filter(tx => tx.status === 'confirmed')
        .reduce((sum, tx) => sum + tx.amount, 0)
    };
    
    console.log('📊 Estatísticas mock:', stats);
    return stats;
  }
};

// Exportar serviço
export default mockDepositService;

// Exportar funções utilitárias para testes
export {
  mockDatabase,
  generateBlockchainData,
  simulateBlockchainProcessing,
  simulateRandomFailure
};


