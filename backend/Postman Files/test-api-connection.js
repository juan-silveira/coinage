#!/usr/bin/env node

/**
 * Script para testar a conexão com a API Azore Blockchain
 * Execute: node test-api-connection.js
 */

const https = require('https');
const http = require('http');

// Configuração
const config = {
  baseUrl: 'http://localhost:8800',
  apiKey: process.env.API_KEY || '354b889afef6398ebaa099a4c0dbc01281d5857412141ea6cc18e579b0ea7e38',
  email: process.env.EMAIL || 'ivan.alberton@navi.inf.br',
  password: process.env.PASSWORD || 'N@vi@2025'
};

// Cores para output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

async function testHealthCheck() {
  log('\n🏥 Testando Health Check...', 'blue');
  
  try {
    const response = await makeRequest(`${config.baseUrl}/health`);
    
    if (response.status === 200) {
      log('✅ Health Check: OK', 'green');
      log(`   Status: ${response.status}`, 'green');
      log(`   Response: ${JSON.stringify(response.data)}`, 'green');
      return true;
    } else {
      log('❌ Health Check: FALHOU', 'red');
      log(`   Status: ${response.status}`, 'red');
      log(`   Response: ${JSON.stringify(response.data)}`, 'red');
      return false;
    }
  } catch (error) {
    log('❌ Health Check: ERRO DE CONEXÃO', 'red');
    log(`   Error: ${error.message}`, 'red');
    return false;
  }
}

async function testLogin() {
  log('\n🔐 Testando Login...', 'blue');
  
  try {
    const response = await makeRequest(`${config.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'X-API-Key': config.apiKey
      },
      body: {
        email: config.email,
        password: config.password
      }
    });
    
    if (response.status === 200 && response.data.success) {
      log('✅ Login: OK', 'green');
      log(`   Status: ${response.status}`, 'green');
      log(`   Access Token: ${response.data.data.accessToken ? 'Presente' : 'Ausente'}`, 'green');
      return response.data.data.accessToken;
    } else {
      log('❌ Login: FALHOU', 'red');
      log(`   Status: ${response.status}`, 'red');
      log(`   Response: ${JSON.stringify(response.data)}`, 'red');
      return null;
    }
  } catch (error) {
    log('❌ Login: ERRO DE CONEXÃO', 'red');
    log(`   Error: ${error.message}`, 'red');
    return null;
  }
}

async function testTokenBalance(accessToken) {
  log('\n🪙 Testando Token Balance...', 'blue');
  
  try {
    const response = await makeRequest(`${config.baseUrl}/api/tokens/balance?contractAddress=0x1234567890123456789012345678901234567890&walletAddress=0x1234567890123456789012345678901234567890`, {
      headers: {
        'X-API-Key': config.apiKey
      }
    });
    
    if (response.status === 200) {
      log('✅ Token Balance: OK', 'green');
      log(`   Status: ${response.status}`, 'green');
      log(`   Response: ${JSON.stringify(response.data)}`, 'green');
      return true;
    } else {
      log('❌ Token Balance: FALHOU', 'red');
      log(`   Status: ${response.status}`, 'red');
      log(`   Response: ${JSON.stringify(response.data)}`, 'red');
      return false;
    }
  } catch (error) {
    log('❌ Token Balance: ERRO DE CONEXÃO', 'red');
    log(`   Error: ${error.message}`, 'red');
    return false;
  }
}

async function testBurnEndpoint(accessToken) {
  log('\n🔥 Testando Burn Endpoint...', 'blue');
  
  try {
    const response = await makeRequest(`${config.baseUrl}/api/tokens/burn`, {
      method: 'POST',
      headers: {
        'X-API-Key': config.apiKey
      },
      body: {
        contractAddress: '0x1234567890123456789012345678901234567890',
        fromAddress: '0x1234567890123456789012345678901234567890',
        amount: '1.0',
        gasPayer: '0x5528C065931f523CA9F3a6e49a911896fb1D2e6f'
      }
    });
    
    // Burn pode falhar por vários motivos (saldo insuficiente, permissões, etc.)
    // Mas se retornar 400 com mensagem específica, significa que o endpoint está funcionando
    if (response.status === 200) {
      log('✅ Burn Endpoint: OK (Burn executado)', 'green');
      log(`   Status: ${response.status}`, 'green');
      log(`   Response: ${JSON.stringify(response.data)}`, 'green');
      return true;
    } else if (response.status === 400) {
      log('⚠️ Burn Endpoint: OK (Endpoint funcionando, mas burn falhou por validação)', 'yellow');
      log(`   Status: ${response.status}`, 'yellow');
      log(`   Response: ${JSON.stringify(response.data)}`, 'yellow');
      return true;
    } else {
      log('❌ Burn Endpoint: FALHOU', 'red');
      log(`   Status: ${response.status}`, 'red');
      log(`   Response: ${JSON.stringify(response.data)}`, 'red');
      return false;
    }
  } catch (error) {
    log('❌ Burn Endpoint: ERRO DE CONEXÃO', 'red');
    log(`   Error: ${error.message}`, 'red');
    return false;
  }
}

async function runTests() {
  log('🚀 Iniciando testes da API Azore Blockchain...', 'blue');
  log(`   Base URL: ${config.baseUrl}`, 'blue');
  log(`   API Key: ${config.apiKey ? 'Configurada' : 'NÃO CONFIGURADA'}`, config.apiKey ? 'green' : 'red');
  
  const results = {
    healthCheck: false,
    login: false,
    tokenBalance: false,
    burnEndpoint: false
  };
  
  // Teste 1: Health Check
  results.healthCheck = await testHealthCheck();
  
  if (!results.healthCheck) {
    log('\n❌ API não está respondendo. Verifique se está rodando.', 'red');
    return;
  }
  
  // Teste 2: Login
  const accessToken = await testLogin();
  results.login = !!accessToken;
  
  // Teste 3: Token Balance
  results.tokenBalance = await testTokenBalance(accessToken);
  
  // Teste 4: Burn Endpoint
  results.burnEndpoint = await testBurnEndpoint(accessToken);
  
  // Resumo
  log('\n📊 RESUMO DOS TESTES:', 'blue');
  log(`   Health Check: ${results.healthCheck ? '✅ OK' : '❌ FALHOU'}`, results.healthCheck ? 'green' : 'red');
  log(`   Login: ${results.login ? '✅ OK' : '❌ FALHOU'}`, results.login ? 'green' : 'red');
  log(`   Token Balance: ${results.tokenBalance ? '✅ OK' : '❌ FALHOU'}`, results.tokenBalance ? 'green' : 'red');
  log(`   Burn Endpoint: ${results.burnEndpoint ? '✅ OK' : '❌ FALHOU'}`, results.burnEndpoint ? 'green' : 'red');
  
  const successCount = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  log(`\n🎯 Resultado: ${successCount}/${totalTests} testes passaram`, successCount === totalTests ? 'green' : 'yellow');
  
  if (successCount === totalTests) {
    log('\n🎉 Todos os testes passaram! A API está funcionando corretamente.', 'green');
    log('   Você pode usar os arquivos Postman agora.', 'green');
  } else {
    log('\n⚠️ Alguns testes falharam. Verifique a configuração da API.', 'yellow');
    log('   Consulte o README.md para instruções de configuração.', 'yellow');
  }
}

// Executar testes
if (require.main === module) {
  runTests().catch(error => {
    log(`\n💥 Erro inesperado: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = {
  testHealthCheck,
  testLogin,
  testTokenBalance,
  testBurnEndpoint,
  runTests
};
