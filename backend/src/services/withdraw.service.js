const prismaConfig = require('../config/prisma');
const { v4: uuidv4 } = require('uuid');
const amqp = require('amqplib');
const NotificationService = require('./notification.service');
const blockchainQueueService = require('./blockchainQueue.service');

class WithdrawService {
  constructor() {
    this.prisma = null;
    this.notificationService = new NotificationService();
    this.rabbitMQConnection = null;
    this.rabbitMQChannel = null;
    this.minWithdrawal = parseFloat(process.env.MIN_WITHDRAWAL_AMOUNT || '10');
    this.maxWithdrawal = parseFloat(process.env.MAX_WITHDRAWAL_AMOUNT || '50000');
    this.withdrawalFee = parseFloat(process.env.WITHDRAWAL_FEE || '2.50');
  }

  async init() {
    this.prisma = prismaConfig.getPrisma();
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
   * Calcular taxa de saque
   */
  async calculateFee(amount) {
    return this.withdrawalFee;
  }

  /**
   * Iniciar processo de saque
   */
  async initiateWithdrawal(amount, pixKey, userId) {
    try {
      if (!this.prisma) await this.init();
      
      // Validações
      if (amount < this.minWithdrawal) {
        throw new Error(`Valor mínimo para saque é R$ ${this.minWithdrawal.toFixed(2)}`);
      }
      
      if (amount > this.maxWithdrawal) {
        throw new Error(`Valor máximo para saque é R$ ${this.maxWithdrawal.toFixed(2)}`);
      }
      
      // Validar chave PIX
      const pixValidation = await this.validatePixKey(pixKey);
      if (!pixValidation.isValid) {
        throw new Error('Chave PIX inválida');
      }
      
      // Verificar saldo do usuário
      const user = await this.prisma.user.findUnique({
        where: { id: userId }
      });
      
      if (!user) {
        throw new Error('Usuário não encontrado');
      }
      
      // Calcular taxa
      const fee = await this.calculateFee(amount);
      const totalAmount = amount + fee;
      
      // Verificar saldo suficiente (considerando a taxa)
      if (user.balance < totalAmount) {
        throw new Error('Saldo insuficiente para realizar o saque (incluindo taxa)');
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
          netAmount: amount, // Valor líquido que o usuário recebe
          pixKey: pixValidation.formatted,
          pixKeyType: pixValidation.type,
          status: 'PENDING',
          createdAt: new Date(),
          metadata: {
            userBalance: user.balance,
            totalDeducted: totalAmount
          }
        }
      });
      
      // Debitar do saldo do usuário imediatamente
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          balance: {
            decrement: totalAmount
          }
        }
      });
      
      // Enviar para fila de processamento
      const message = {
        withdrawalId,
        userId,
        amount,
        fee,
        pixKey: pixValidation.formatted,
        pixKeyType: pixValidation.type,
        blockchainAddress: user.blockchainAddress,
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
        netAmount: amount,
        status: 'PENDING',
        estimatedTime: '5-15 minutos'
      };
      
    } catch (error) {
      console.error('❌ Erro ao iniciar saque:', error);
      throw error;
    }
  }

  /**
   * Confirmar saque
   */
  async confirmWithdrawal(withdrawalId, burnTxHash, pixTransactionId, pixEndToEndId) {
    try {
      if (!this.prisma) await this.init();
      
      const withdrawal = await this.prisma.withdrawal.update({
        where: { id: withdrawalId },
        data: {
          status: 'COMPLETED',
          burnTxHash,
          pixTransactionId,
          pixEndToEndId,
          completedAt: new Date()
        },
        include: {
          user: true
        }
      });
      
      console.log(`✅ Saque confirmado: ${withdrawalId} - PIX: ${pixTransactionId}`);
      
      return withdrawal;
      
    } catch (error) {
      console.error('❌ Erro ao confirmar saque:', error);
      throw error;
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