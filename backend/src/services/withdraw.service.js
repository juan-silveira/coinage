const prismaConfig = require('../config/prisma');
const { v4: uuidv4 } = require('uuid');
const amqp = require('amqplib');
const NotificationService = require('./notification.service');
const UserTaxesService = require('./userTaxes.service');
const blockchainQueueService = require('./blockchainQueue.service');
const burnService = require('./burn.service');
const blockchainService = require('./blockchain.service');
const transactionService = require('./transaction.service');
const withdrawTransactionService = require('./withdrawTransaction.service');

class WithdrawService {
  constructor() {
    this.prisma = null;
    this.notificationService = new NotificationService();
    this.rabbitMQConnection = null;
    this.rabbitMQChannel = null;
    this.minWithdrawal = parseFloat(process.env.MIN_WITHDRAWAL_AMOUNT || '10');
    this.maxWithdrawal = parseFloat(process.env.MAX_WITHDRAWAL_AMOUNT || '50000');
  }

  async init() {
    try {
      // Garantir que o Prisma está inicializado
      await prismaConfig.initialize();
      this.prisma = prismaConfig.getPrisma();
      
      if (!this.prisma) {
        throw new Error('Falha ao inicializar conexão com banco de dados');
      }
      
      // Initialize transaction service
      await transactionService.initialize();
      
      console.log('✅ WithdrawService inicializado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao inicializar WithdrawService:', error);
      throw error;
    }
  }

  /**
   * Conectar ao RabbitMQ
   */
  async connectToRabbitMQ() {
    try {
      if (!this.rabbitMQConnection) {
        this.rabbitMQConnection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
        this.rabbitMQChannel = await this.rabbitMQConnection.createChannel();
        
        // Declarar fila de saques
        await this.rabbitMQChannel.assertQueue('withdrawals', {
          durable: true
        });
        
        console.log('✅ Conectado ao RabbitMQ para saques');
      }
    } catch (error) {
      console.error('❌ Erro ao conectar ao RabbitMQ:', error);
      throw error;
    }
  }

  /**
   * Validar chave PIX
   */
  async validatePixKey(pixKey) {
    const cleanKey = pixKey.replace(/\D/g, '');
    
    // CPF
    if (cleanKey.length === 11) {
      return {
        isValid: this.validateCPF(cleanKey),
        type: 'CPF',
        formatted: this.formatCPF(cleanKey)
      };
    }
    
    // CNPJ
    if (cleanKey.length === 14) {
      return {
        isValid: this.validateCNPJ(cleanKey),
        type: 'CNPJ',
        formatted: this.formatCNPJ(cleanKey)
      };
    }
    
    // Email
    if (pixKey.includes('@')) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return {
        isValid: emailRegex.test(pixKey),
        type: 'EMAIL',
        formatted: pixKey
      };
    }
    
    // Telefone
    if (cleanKey.length >= 10 && cleanKey.length <= 11) {
      return {
        isValid: true,
        type: 'PHONE',
        formatted: this.formatPhone(cleanKey)
      };
    }
    
    // Chave aleatória (UUID)
    if (pixKey.length === 32 || pixKey.length === 36) {
      return {
        isValid: true,
        type: 'RANDOM',
        formatted: pixKey
      };
    }
    
    return {
      isValid: false,
      type: 'UNKNOWN',
      formatted: pixKey
    };
  }

  /**
   * Calcular taxa de saque usando UserTaxesService
   */
  async calculateFee(amount, userId) {
    try {
      const feeCalculation = await UserTaxesService.calculateWithdrawFee(userId, amount);
      return feeCalculation.fee;
    } catch (error) {
      console.error('❌ Erro ao calcular taxa com UserTaxesService, usando taxa padrão:', error);
      // Fallback para taxa fixa se houver erro
      return 1.0; // Taxa padrão fixa de R$ 1,00
    }
  }

  /**
   * Iniciar processo de saque usando chave PIX cadastrada
   */
  async initiateWithdrawal(amount, pixKey, userId) {
    try {
      // Garantir inicialização do Prisma
      if (!this.prisma) {
        await this.init();
      }
      
      // Validações
      if (amount < this.minWithdrawal) {
        throw new Error(`Valor mínimo para saque é R$ ${this.minWithdrawal.toFixed(2)}`);
      }
      
      if (amount > this.maxWithdrawal) {
        throw new Error(`Valor máximo para saque é R$ ${this.maxWithdrawal.toFixed(2)}`);
      }
      
      // Buscar PIX key no banco de dados se for fornecida
      let userPixKey = null;
      if (pixKey) {
        try {
          userPixKey = await this.prisma.userPixKey.findFirst({
            where: {
              userId: userId,
              keyValue: pixKey
            }
          });
        } catch (pixError) {
          console.log('⚠️ Erro ao buscar PIX key (ignorando):', pixError.message);
          // Se não conseguir buscar PIX key, continue com validação tradicional
        }
        
        if (!userPixKey) {
          // Se não encontrou pela keyValue, usar validação tradicional
          const pixValidation = await this.validatePixKey(pixKey);
          if (!pixValidation.isValid) {
            throw new Error('Chave PIX inválida');
          }
        }
      }
      
      // Verificar dados do usuário
      const user = await this.prisma.user.findUnique({
        where: { id: userId }
      });
      
      if (!user) {
        throw new Error('Usuário não encontrado');
      }
      
      if (!user.publicKey) {
        throw new Error('Usuário não possui carteira configurada');
      }
      
      // Obter saldo de cBRL na blockchain
      console.log('🔗 [WithdrawService] Consultando saldo cBRL na blockchain para:', user.publicKey);
      const blockchainBalances = await blockchainService.getUserBalances(user.publicKey, 'testnet');
      
      // Debug detalhado dos balances retornados
      console.log('🔍 [WithdrawService] Blockchain balances completo:', JSON.stringify(blockchainBalances, null, 2));
      console.log('🔍 [WithdrawService] balancesTable:', blockchainBalances?.balancesTable);
      console.log('🔍 [WithdrawService] cBRL raw:', blockchainBalances?.balancesTable?.['cBRL']);
      
      const cBrlBalance = parseFloat(blockchainBalances.balancesTable?.['cBRL'] || '0');
      console.log('🔍 [WithdrawService] cBRL parsed:', cBrlBalance);
      
      // Calcular taxa usando UserTaxesService
      const fee = await this.calculateFee(amount, userId);
      const netAmount = amount - fee; // Valor que o usuário realmente recebe via PIX
      
      // Debug logging para entender os valores
      console.log('🔍 [WithdrawService] Debug balance validation:', {
        amount: amount,
        amountType: typeof amount,
        fee: fee,
        feeType: typeof fee,
        netAmount: netAmount,
        netAmountType: typeof netAmount,
        cBrlBalance: cBrlBalance,
        cBrlBalanceType: typeof cBrlBalance,
        isBalanceSufficient: cBrlBalance >= amount,
        userId: userId,
        publicKey: user.publicKey
      });
      
      // Verificar saldo suficiente de cBRL (apenas o valor solicitado, não incluindo taxa)
      if (cBrlBalance < amount) {
        console.error('❌ [WithdrawService] Saldo cBRL insuficiente:', {
          cBrlBalance: cBrlBalance,
          amountNeeded: amount,
          fee: fee,
          netAmount: netAmount,
          difference: cBrlBalance - amount
        });
        throw new Error('Saldo cBRL insuficiente para realizar o saque');
      }
      
      // Conectar ao RabbitMQ
      await this.connectToRabbitMQ();
      
      // Criar registro de saque no banco de dados
      const withdrawalId = uuidv4();
      const withdrawal = await this.prisma.withdrawal.create({
        data: {
          id: withdrawalId,
          userId,
          amount,
          fee,
          netAmount: netAmount, // Valor líquido que o usuário recebe (amount - fee)
          pixKey: userPixKey ? userPixKey.keyValue : pixKey,
          pixKeyType: userPixKey ? userPixKey.keyType : 'UNKNOWN',
          status: 'PENDING',
          createdAt: new Date(),
          metadata: {
            cBrlBalance: cBrlBalance,
            totalBurnAmount: amount, // Amount burned from blockchain (not including fee)
            pixPaymentAmount: netAmount, // Amount user will receive via PIX  
            pixKeyId: userPixKey ? userPixKey.id : null
          }
        }
      });

      // Buscar empresa do usuário
      const userCompany = await this.prisma.userCompany.findFirst({
        where: { userId: userId },
        include: { company: true }
      });

      const companyId = userCompany?.company?.id;
      if (!companyId) {
        throw new Error('Usuário não possui empresa associada');
      }

      // Criar transação padronizada de saque
      const standardTransaction = await withdrawTransactionService.createWithdrawTransaction({
        userId,
        companyId,
        amount,
        fee,
        netAmount,
        pixKey: userPixKey ? userPixKey.keyValue : pixKey,
        pixKeyType: userPixKey ? userPixKey.keyType : 'UNKNOWN',
        userAddress: user.publicKey,
        withdrawalId
      });
      
      // Note: No database balance update needed since we're using blockchain balances
      // The actual token burn will happen later during withdrawal confirmation
      
      // Enviar para fila de processamento
      const message = {
        withdrawalId,
        userId,
        amount,
        fee,
        pixKey: userPixKey ? userPixKey.keyValue : pixKey,
        pixKeyType: userPixKey ? userPixKey.keyType : 'UNKNOWN',
        blockchainAddress: user.publicKey,
        userEmail: user.email,
        timestamp: new Date().toISOString()
      };
      
      await this.rabbitMQChannel.sendToQueue(
        'withdrawals',
        Buffer.from(JSON.stringify(message)),
        { persistent: true }
      );
      
      console.log(`✅ Saque iniciado: ${withdrawalId} - R$ ${amount.toFixed(2)}`);
      
      return {
        withdrawalId,
        amount,
        fee,
        netAmount: netAmount,
        status: 'PENDING',
        estimatedTime: '5-15 minutos'
      };
      
    } catch (error) {
      console.error('❌ Erro ao iniciar saque:', error);
      throw error;
    }
  }

  /**
   * Confirmar saque executando burnFrom na blockchain
   */
  async confirmWithdrawal(withdrawalId) {
    console.log(`🔍 [DEBUG] confirmWithdrawal CHAMADO para withdrawal: ${withdrawalId}`);
    try {
      if (!this.prisma) await this.init();
      
      // Buscar dados do saque
      const withdrawal = await this.prisma.withdrawal.findUnique({
        where: { id: withdrawalId },
        include: {
          user: true
        }
      });

      if (!withdrawal) {
        throw new Error('Saque não encontrado');
      }

      if (withdrawal.status !== 'PENDING') {
        throw new Error('Saque não está pendente');
      }

      // Verificar se o usuário tem carteira configurada
      if (!withdrawal.user.publicKey) {
        throw new Error('Usuário não possui carteira configurada');
      }

      console.log(`🔄 Processando saque ${withdrawalId}...`);

      // Atualizar status para processing
      await this.prisma.withdrawal.update({
        where: { id: withdrawalId },
        data: {
          status: 'PROCESSING',
          metadata: {
            ...withdrawal.metadata,
            processingStartedAt: new Date().toISOString()
          }
        }
      });

      // Executar burnFrom na blockchain
      console.log(`🔥 Executando burn de ${withdrawal.amount} cBRL de ${withdrawal.user.publicKey}`);
      console.log(`🔍 [DEBUG] Chamando burnService.burnFromCBRL...`);
      
      const burnResult = await burnService.burnFromCBRL(
        withdrawal.user.publicKey,
        withdrawal.amount.toString(),
        'testnet',
        withdrawalId
      );

      console.log(`✅ Burn executado com sucesso:`, burnResult);

      // Buscar transação padronizada associada ao withdrawal
      let standardTransaction = await withdrawTransactionService.findByWithdrawalId(withdrawalId);
      
      if (standardTransaction) {
        // Atualizar transação padronizada com dados do burn
        await withdrawTransactionService.updateWithBurnData(standardTransaction.id, burnResult);
        console.log(`✅ Transação padronizada atualizada com dados do burn`);
      } else {
        console.warn('⚠️ Transação padronizada não encontrada para withdrawalId:', withdrawalId);
      }

      // Atualizar saque com dados do burn
      const updatedWithdrawal = await this.prisma.withdrawal.update({
        where: { id: withdrawalId },
        data: {
          status: 'PROCESSING',
          burnTxHash: burnResult.transactionHash,
          metadata: {
            ...withdrawal.metadata,
            burn: {
              success: true,
              transactionHash: burnResult.transactionHash,
              blockNumber: burnResult.blockNumber,
              gasUsed: burnResult.gasUsed,
              amountBurned: burnResult.amountBurned,
              burnedAt: new Date().toISOString()
            }
          }
        }
      });

      console.log(`🔥 Burn concluído para saque ${withdrawalId}`);

      // Processar PIX (simulado por enquanto)
      await this.processPixPayment(withdrawalId, withdrawal);

      return updatedWithdrawal;
      
    } catch (error) {
      console.error('❌ Erro ao confirmar saque:', error);
      
      // Marcar saque como falha
      await this.markWithdrawalAsFailed(withdrawalId, error.message);
      
      throw error;
    }
  }

  /**
   * Processar pagamento PIX (simulado)
   */
  async processPixPayment(withdrawalId, withdrawal) {
    try {
      console.log(`💳 Processando pagamento PIX para saque ${withdrawalId}`);
      
      // SIMULAÇÃO: Em produção, aqui seria feita a integração com o banco/PSP
      const pixTransactionId = `pix_out_${withdrawalId}_${Date.now()}`;
      const pixEndToEndId = `E${Math.random().toString().substr(2, 8)}${Date.now()}`;
      
      // Simular tempo de processamento
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Atualizar com dados do PIX processado
      const updatedWithdrawal = await this.prisma.withdrawal.update({
        where: { id: withdrawalId },
        data: {
          status: 'CONFIRMED',
          pixTransactionId: pixTransactionId,
          pixEndToEndId: pixEndToEndId,
          completedAt: new Date(),
          metadata: {
            ...withdrawal.metadata,
            pixPayment: {
              success: true,
              pixTransactionId: pixTransactionId,
              pixEndToEndId: pixEndToEndId,
              processedAt: new Date().toISOString(),
              pixKey: withdrawal.pixKey,
              amount: withdrawal.netAmount // PIX sends the net amount (after fees)
            }
          }
        }
      });

      // Atualizar transação padronizada com dados do PIX
      const standardTransaction = await withdrawTransactionService.findByWithdrawalId(withdrawalId);
      if (standardTransaction) {
        await withdrawTransactionService.updateWithPixData(standardTransaction.id, {
          pixTransactionId,
          pixEndToEndId,
          amount: withdrawal.netAmount
        });
        console.log(`✅ Transação padronizada atualizada com dados do PIX`);
      }

      console.log(`✅ PIX processado com sucesso: ${pixTransactionId}`);
      
      return {
        success: true,
        pixTransactionId,
        pixEndToEndId,
        processedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Erro ao processar PIX:', error);
      
      // Atualizar saque com erro do PIX
      await this.prisma.withdrawal.update({
        where: { id: withdrawalId },
        data: {
          status: 'FAILED',
          metadata: {
            ...withdrawal.metadata,
            pixPayment: {
              success: false,
              error: error.message,
              failedAt: new Date().toISOString()
            }
          }
        }
      });

      throw error;
    }
  }

  /**
   * Marcar saque como falha
   */
  async markWithdrawalAsFailed(withdrawalId, errorMessage) {
    try {
      await this.prisma.withdrawal.update({
        where: { id: withdrawalId },
        data: {
          status: 'FAILED',
          metadata: {
            error: errorMessage,
            failedAt: new Date().toISOString()
          }
        }
      });

      console.log(`❌ Saque marcado como falha: ${withdrawalId}`);

    } catch (error) {
      console.error('❌ Erro ao marcar saque como falha:', error);
    }
  }

  /**
   * Obter status de um saque
   */
  async getWithdrawalStatus(withdrawalId) {
    try {
      if (!this.prisma) await this.init();
      
      const withdrawal = await this.prisma.withdrawal.findUnique({
        where: { id: withdrawalId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true
            }
          }
        }
      });
      
      if (!withdrawal) {
        throw new Error('Saque não encontrado');
      }
      
      return withdrawal;
      
    } catch (error) {
      console.error('❌ Erro ao obter status do saque:', error);
      throw error;
    }
  }

  /**
   * Listar saques de um usuário
   */
  async getUserWithdrawals(userId, page = 1, limit = 10, status = null) {
    try {
      if (!this.prisma) await this.init();
      
      const where = { userId };
      if (status) {
        where.status = status;
      }
      
      const withdrawals = await this.prisma.withdrawal.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      });
      
      const total = await this.prisma.withdrawal.count({ where });
      
      return {
        withdrawals,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
      
    } catch (error) {
      console.error('❌ Erro ao listar saques:', error);
      throw error;
    }
  }

  // Métodos auxiliares para validação
  validateCPF(cpf) {
    if (cpf.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cpf)) return false;
    
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.charAt(9))) return false;
    
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf.charAt(i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    return remainder === parseInt(cpf.charAt(10));
  }

  validateCNPJ(cnpj) {
    if (cnpj.length !== 14) return false;
    if (/^(\d)\1{13}$/.test(cnpj)) return false;
    
    let size = cnpj.length - 2;
    let numbers = cnpj.substring(0, size);
    let digits = cnpj.substring(size);
    let sum = 0;
    let pos = size - 7;
    
    for (let i = size; i >= 1; i--) {
      sum += numbers.charAt(size - i) * pos--;
      if (pos < 2) pos = 9;
    }
    
    let result = sum % 11 < 2 ? 0 : 11 - sum % 11;
    if (result !== parseInt(digits.charAt(0))) return false;
    
    size = size + 1;
    numbers = cnpj.substring(0, size);
    sum = 0;
    pos = size - 7;
    
    for (let i = size; i >= 1; i--) {
      sum += numbers.charAt(size - i) * pos--;
      if (pos < 2) pos = 9;
    }
    
    result = sum % 11 < 2 ? 0 : 11 - sum % 11;
    return result === parseInt(digits.charAt(1));
  }

  formatCPF(cpf) {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  formatCNPJ(cnpj) {
    return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }

  formatPhone(phone) {
    if (phone.length === 11) {
      return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else {
      return phone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
  }
}

module.exports = WithdrawService;