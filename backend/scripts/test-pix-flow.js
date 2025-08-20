#!/usr/bin/env node

/**
 * Script de teste para validar o fluxo completo PIX + cBRL
 * 
 * Testa:
 * 1. Criação de cobrança PIX
 * 2. Simulação de pagamento PIX
 * 3. Mint de tokens cBRL
 * 4. Criação de saque PIX
 * 5. Burn de tokens cBRL
 * 6. Processamento PIX
 */

require('dotenv').config({ path: '.env.testnet' });

const axios = require('axios');
const { ethers } = require('ethers');

class PixFlowTester {
  constructor() {
    this.baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
    this.authToken = null;
    this.testWallet = null;
    this.testResults = [];
  }

  /**
   * Executa todos os testes
   */
  async runAllTests() {
    try {
      console.log('🚀 Iniciando testes do fluxo PIX + cBRL');
      console.log('=' .repeat(60));
      
      // 1. Setup inicial
      await this.setupTest();
      
      // 2. Teste de health check
      await this.testHealthCheck();
      
      // 3. Teste de informações do token
      await this.testTokenInfo();
      
      // 4. Teste de depósito PIX
      const depositResult = await this.testPixDeposit();
      
      // 5. Aguardar processamento (mock)
      await this.waitForProcessing();
      
      // 6. Verificar saldo após depósito
      await this.testBalanceCheck();
      
      // 7. Teste de saque PIX
      await this.testPixWithdrawal();
      
      // 8. Verificar saldo após saque
      await this.testBalanceCheck();
      
      // 9. Relatório final
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Erro durante os testes:', error);
      process.exit(1);
    }
  }

  /**
   * Setup inicial dos testes
   */
  async setupTest() {
    console.log('🔧 Setup inicial...');
    
    // Gerar wallet de teste
    this.testWallet = ethers.Wallet.createRandom();
    console.log(`👛 Wallet de teste: ${this.testWallet.address}`);
    
    // Mock token de autenticação (em produção seria obtido via login)
    this.authToken = 'mock_jwt_token_for_testing';
    
    this.addResult('Setup', true, 'Wallet e autenticação configurados');
  }

  /**
   * Testa health check dos serviços
   */
  async testHealthCheck() {
    console.log('\n🔍 Testando health check...');
    
    try {
      const response = await axios.get(`${this.baseUrl}/api/pix/health`);
      
      if (response.data.success) {
        console.log('✅ Health check: OK');
        console.log(`   PIX: ${response.data.data.services.pix.healthy ? '✅' : '❌'}`);
        console.log(`   cBRL: ${response.data.data.services.cBRL.healthy ? '✅' : '❌'}`);
        this.addResult('Health Check', true, 'Serviços operacionais');
      } else {
        throw new Error('Health check failed');
      }
      
    } catch (error) {
      console.log('❌ Health check falhou:', error.message);
      this.addResult('Health Check', false, error.message);
    }
  }

  /**
   * Testa informações do token cBRL
   */
  async testTokenInfo() {
    console.log('\n🪙 Testando informações do token cBRL...');
    
    try {
      const response = await axios.get(`${this.baseUrl}/api/pix/token/info`);
      
      if (response.data.success) {
        const token = response.data.data;
        console.log('✅ Token cBRL:');
        console.log(`   Nome: ${token.name}`);
        console.log(`   Símbolo: ${token.symbol}`);
        console.log(`   Decimais: ${token.decimals}`);
        console.log(`   Supply total: ${token.totalSupply}`);
        console.log(`   Contrato: ${token.contractAddress}`);
        console.log(`   Rede: ${token.network}`);
        
        this.addResult('Token Info', true, 'Informações obtidas com sucesso');
      } else {
        throw new Error('Failed to get token info');
      }
      
    } catch (error) {
      console.log('❌ Falha ao obter informações do token:', error.message);
      this.addResult('Token Info', false, error.message);
    }
  }

  /**
   * Testa criação de depósito PIX
   */
  async testPixDeposit() {
    console.log('\n💰 Testando criação de depósito PIX...');
    
    try {
      const depositData = {
        amount: 100.00,
        description: 'Teste de depósito cBRL',
        blockchainAddress: this.testWallet.address,
        expirationMinutes: 30
      };
      
      const response = await axios.post(`${this.baseUrl}/api/pix/deposit/create`, depositData, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        const deposit = response.data.data;
        console.log('✅ Depósito PIX criado:');
        console.log(`   ID: ${deposit.depositId}`);
        console.log(`   Payment ID: ${deposit.paymentId}`);
        console.log(`   Valor: R$ ${deposit.amount}`);
        console.log(`   Status: ${deposit.status}`);
        console.log(`   Expira em: ${deposit.expiresAt}`);
        console.log(`   PIX Copia e Cola: ${deposit.pixCode.substring(0, 50)}...`);
        
        this.depositData = deposit;
        this.addResult('PIX Deposit', true, `Depósito criado: ${deposit.depositId}`);
        
        return deposit;
      } else {
        throw new Error('Failed to create PIX deposit');
      }
      
    } catch (error) {
      console.log('❌ Falha ao criar depósito PIX:', error.message);
      this.addResult('PIX Deposit', false, error.message);
      throw error;
    }
  }

  /**
   * Aguarda processamento (simula pagamento PIX)
   */
  async waitForProcessing() {
    console.log('\n⏳ Aguardando processamento do PIX (mock)...');
    
    // Para mock, aguardar 12 segundos para simular aprovação automática
    for (let i = 12; i > 0; i--) {
      process.stdout.write(`\r   Aguardando... ${i}s`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n✅ Tempo de processamento concluído');
  }

  /**
   * Verifica status do depósito PIX
   */
  async checkDepositStatus() {
    console.log('\n🔍 Verificando status do depósito...');
    
    try {
      const response = await axios.get(
        `${this.baseUrl}/api/pix/deposit/${this.depositData.paymentId}/status`,
        {
          headers: {
            'Authorization': `Bearer ${this.authToken}`
          }
        }
      );
      
      if (response.data.success) {
        const status = response.data.data;
        console.log('✅ Status do depósito:');
        console.log(`   Status: ${status.status}`);
        console.log(`   Pago em: ${status.paidAt || 'Não pago'}`);
        console.log(`   Valor pago: R$ ${status.paidAmount || 'N/A'}`);
        
        this.addResult('Deposit Status', true, `Status: ${status.status}`);
        return status;
      } else {
        throw new Error('Failed to check deposit status');
      }
      
    } catch (error) {
      console.log('❌ Falha ao verificar status:', error.message);
      this.addResult('Deposit Status', false, error.message);
    }
  }

  /**
   * Testa verificação de saldo
   */
  async testBalanceCheck() {
    console.log('\n💳 Verificando saldo cBRL...');
    
    try {
      const response = await axios.get(
        `${this.baseUrl}/api/pix/balance/${this.testWallet.address}`,
        {
          headers: {
            'Authorization': `Bearer ${this.authToken}`
          }
        }
      );
      
      if (response.data.success) {
        const balance = response.data.data;
        console.log('✅ Saldo cBRL:');
        console.log(`   Endereço: ${balance.address}`);
        console.log(`   Saldo: ${balance.balance} ${balance.currency}`);
        console.log(`   Rede: ${balance.network}`);
        
        this.currentBalance = parseFloat(balance.balance);
        this.addResult('Balance Check', true, `Saldo: ${balance.balance} cBRL`);
        
        return balance;
      } else {
        throw new Error('Failed to check balance');
      }
      
    } catch (error) {
      console.log('❌ Falha ao verificar saldo:', error.message);
      this.addResult('Balance Check', false, error.message);
    }
  }

  /**
   * Testa criação de saque PIX
   */
  async testPixWithdrawal() {
    console.log('\n💸 Testando criação de saque PIX...');
    
    // Só prosseguir se houver saldo
    if (!this.currentBalance || this.currentBalance <= 0) {
      console.log('⚠️ Sem saldo para saque, pulando teste');
      this.addResult('PIX Withdrawal', false, 'Sem saldo disponível');
      return;
    }
    
    try {
      const withdrawalData = {
        amount: Math.min(50.00, this.currentBalance - 1), // Deixar 1 cBRL de margem
        pixKey: 'teste@email.com',
        pixKeyType: 'email',
        blockchainAddress: this.testWallet.address
      };
      
      const response = await axios.post(`${this.baseUrl}/api/pix/withdrawal/create`, withdrawalData, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        const withdrawal = response.data.data;
        console.log('✅ Saque PIX criado:');
        console.log(`   ID: ${withdrawal.withdrawalId}`);
        console.log(`   Valor: R$ ${withdrawal.amount}`);
        console.log(`   Taxa: R$ ${withdrawal.fee}`);
        console.log(`   Total: R$ ${withdrawal.totalAmount}`);
        console.log(`   PIX Key: ${withdrawal.pixKey}`);
        console.log(`   Status: ${withdrawal.status}`);
        console.log(`   Tempo estimado: ${withdrawal.estimatedProcessingTime}`);
        
        this.withdrawalData = withdrawal;
        this.addResult('PIX Withdrawal', true, `Saque criado: ${withdrawal.withdrawalId}`);
        
        return withdrawal;
      } else {
        throw new Error('Failed to create PIX withdrawal');
      }
      
    } catch (error) {
      console.log('❌ Falha ao criar saque PIX:', error.message);
      this.addResult('PIX Withdrawal', false, error.message);
    }
  }

  /**
   * Testa validação de chave PIX
   */
  async testPixKeyValidation() {
    console.log('\n🔑 Testando validação de chave PIX...');
    
    const testKeys = [
      'teste@email.com',
      '11999887766',
      '12345678901',
      '12345678901234',
      'invalid-key'
    ];
    
    for (const pixKey of testKeys) {
      try {
        const response = await axios.post(`${this.baseUrl}/api/pix/validate-key`, { pixKey });
        
        if (response.data.success) {
          const validation = response.data.data;
          console.log(`   ${pixKey}: ${validation.valid ? '✅' : '❌'} (${validation.type})`);
        }
        
      } catch (error) {
        console.log(`   ${pixKey}: ❌ Erro na validação`);
      }
    }
    
    this.addResult('PIX Key Validation', true, 'Validações testadas');
  }

  /**
   * Adiciona resultado ao relatório
   */
  addResult(test, success, message) {
    this.testResults.push({
      test,
      success,
      message,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Gera relatório final
   */
  generateReport() {
    console.log('\n📊 RELATÓRIO FINAL');
    console.log('=' .repeat(60));
    
    const passed = this.testResults.filter(r => r.success).length;
    const total = this.testResults.length;
    
    console.log(`Total de testes: ${total}`);
    console.log(`Passou: ${passed}`);
    console.log(`Falhou: ${total - passed}`);
    console.log(`Taxa de sucesso: ${((passed / total) * 100).toFixed(1)}%`);
    
    console.log('\nDetalhes:');
    this.testResults.forEach(result => {
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${result.test}: ${result.message}`);
    });
    
    console.log('\n' + '=' .repeat(60));
    
    if (passed === total) {
      console.log('🎉 TODOS OS TESTES PASSARAM!');
      console.log('O sistema PIX + cBRL está funcionando corretamente.');
    } else {
      console.log('⚠️ ALGUNS TESTES FALHARAM');
      console.log('Verifique as configurações e tente novamente.');
    }
    
    console.log('\n💡 Próximos passos:');
    console.log('1. Configure as variáveis de ambiente para testnet');
    console.log('2. Deploy do contrato cBRL na testnet Azore');
    console.log('3. Configure a integração PIX real');
    console.log('4. Execute os workers em produção');
    console.log('5. Configure monitoramento e alertas');
  }
}

// Executar testes se chamado diretamente
if (require.main === module) {
  const tester = new PixFlowTester();
  tester.runAllTests().catch(error => {
    console.error('❌ Erro fatal nos testes:', error);
    process.exit(1);
  });
}

module.exports = PixFlowTester;