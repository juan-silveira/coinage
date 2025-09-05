const axios = require('axios');
const { PrismaClient } = require('../src/generated/prisma');
const prisma = new PrismaClient();

const API_URL = 'http://localhost:8800';

async function testUnstakeAndAmount() {
  try {
    console.log('🔄 Testando unstake e verificando amount registrado...\n');
    
    // Fazer login
    console.log('1️⃣ Fazendo login...');
    const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
      email: 'ivan.alberton@navi.inf.br',
      password: 'N@vi@2025'
    }, {
      headers: {
        'User-Agent': 'TestScript/1.0'
      }
    });
    
    const authToken = loginResponse.data.data.accessToken;
    console.log('✅ Login realizado com sucesso!\n');
    
    // Pegar o contrato de stake
    const stakesListResponse = await axios.get(`${API_URL}/api/stake-contracts`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    const stakeContract = stakesListResponse.data.data[0];
    
    // Fazer unstake de teste
    const testAmount = '25.75';
    console.log('2️⃣ Fazendo unstake de teste:', testAmount);
    
    const response = await axios.post(
      `${API_URL}/api/stakes/${stakeContract.address}/withdraw`,
      {
        user: '0x5528C065931f523CA9F3a6e49a911896fb1D2e6f',
        amount: testAmount
      },
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data.success) {
      console.log('✅ Unstake realizado com sucesso!');
      console.log('   Hash:', response.data.data.transactionHash);
      
      // Esperar um pouco para a transação ser registrada no banco
      console.log('\n3️⃣ Aguardando registro no banco...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Verificar se o valor foi registrado corretamente
      console.log('4️⃣ Verificando amount no banco de dados...');
      
      const transactions = await prisma.transaction.findMany({
        where: {
          functionName: 'unstake',
          txHash: response.data.data.transactionHash
        },
        select: {
          id: true,
          txHash: true,
          functionName: true,
          amount: true,
          net_amount: true,
          currency: true,
          metadata: true,
          createdAt: true
        }
      });
      
      if (transactions.length > 0) {
        const tx = transactions[0];
        console.log('✅ Transação encontrada no banco:');
        console.log('   ID:', tx.id);
        console.log('   Função:', tx.functionName);
        console.log('   📊 Amount:', tx.amount, tx.currency || 'TOKEN');
        console.log('   📊 Net Amount:', tx.net_amount, tx.currency || 'TOKEN');
        console.log('   Parâmetros:', tx.metadata?.params);
        
        if (parseFloat(tx.amount) === parseFloat(testAmount)) {
          console.log('\n🎉 PERFEITO! O valor foi registrado corretamente!');
        } else {
          console.log('\n❌ ERRO! Valor esperado:', testAmount, '- Valor registrado:', tx.amount);
        }
      } else {
        console.log('❌ Transação não encontrada no banco');
      }
    } else {
      console.log('❌ Falhou:', response.data.message);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o teste
testUnstakeAndAmount();