// Simular chamada HTTP direta para o endpoint (sem autenticação para teste interno)

const express = require('express');
const userController = require('../src/controllers/user.controller');

async function testEndpointDirect() {
  try {
    console.log('🧪 Testando endpoint getUserBalancesByAddress diretamente...');
    
    // Simular req e res
    const req = {
      params: {
        address: '0x5528C065931f523CA9F3a6e49a911896fb1D2e6f'
      },
      query: {
        network: 'testnet',
        forceRefresh: 'true'
      },
      user: null // Sem autenticação para teste
    };
    
    let responseData = null;
    const res = {
      json: (data) => {
        responseData = data;
        console.log('📋 Resposta recebida:', JSON.stringify(data, null, 2));
      },
      status: (code) => {
        console.log(`📊 Status: ${code}`);
        return res;
      }
    };
    
    console.log(`📍 Testando: ${req.params.address}`);
    console.log(`🌐 Network: ${req.query.network}`);
    console.log(`🔄 Force Refresh: ${req.query.forceRefresh}`);
    
    await userController.getUserBalancesByAddress(req, res);
    
    if (responseData && responseData.success) {
      console.log('\n✅ Teste concluído com sucesso!');
      console.log(`💰 AZE: ${responseData.data.azeBalance.balanceEth}`);
      
      if (responseData.data.tokenBalances && responseData.data.tokenBalances.length > 0) {
        responseData.data.tokenBalances.forEach(token => {
          console.log(`🪙 ${token.tokenSymbol}: ${token.balanceEth}`);
        });
      }
    } else {
      console.log('❌ Teste falhou:', responseData);
    }
    
  } catch (error) {
    console.error('❌ Erro no teste do endpoint:', error.message);
    console.error('Stack:', error.stack);
  }
}

testEndpointDirect();