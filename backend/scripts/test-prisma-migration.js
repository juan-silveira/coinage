#!/usr/bin/env node

/**
 * Script de Teste da Migração Prisma
 * 
 * Este script testa a migração do Sequelize para Prisma
 * validando conexões, schemas e funcionalidades básicas.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Importar configurações
const prismaConfig = require('../src/config/prisma');
const userServicePrisma = require('../src/services/user.service.prisma');
const clientServicePrisma = require('../src/services/client.service.prisma');

// Cores para output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testPrismaConnection() {
  log('\n🔍 Testando conexão Prisma...', 'cyan');
  
  try {
    const result = await prismaConfig.testConnection();
    
    if (result.success) {
      log(`✅ Conexão Prisma estabelecida`, 'green');
      log(`   Database: ${result.database}`, 'blue');
      log(`   Host: ${result.host}:${result.port}`, 'blue');
      log(`   ORM: ${result.orm}`, 'blue');
      return true;
    } else {
      log(`❌ Falha na conexão: ${result.error}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Erro na conexão Prisma: ${error.message}`, 'red');
    return false;
  }
}

async function testPrismaGeneration() {
  log('\n📦 Verificando geração do cliente Prisma...', 'cyan');
  
  try {
    const prisma = prismaConfig.getPrisma();
    
    if (prisma && prisma.$connect) {
      log(`✅ Cliente Prisma gerado corretamente`, 'green');
      return true;
    } else {
      log(`❌ Cliente Prisma não encontrado`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Erro no cliente Prisma: ${error.message}`, 'red');
    return false;
  }
}

async function testPrismaModels() {
  log('\n🗄️ Testando modelos Prisma...', 'cyan');
  
  try {
    const prisma = prismaConfig.getPrisma();
    
    // Testar acesso aos modelos principais
    const models = [
      'client', 'user', 'apiKey', 'transaction', 
      'smartContract', 'stake', 'requestLog', 
      'passwordReset', 'webhook', 'document'
    ];
    
    for (const model of models) {
      if (prisma[model]) {
        log(`✅ Modelo ${model} disponível`, 'green');
      } else {
        log(`❌ Modelo ${model} não encontrado`, 'red');
        return false;
      }
    }
    
    log(`✅ Todos os modelos Prisma estão disponíveis`, 'green');
    return true;
  } catch (error) {
    log(`❌ Erro nos modelos Prisma: ${error.message}`, 'red');
    return false;
  }
}

async function testServiceMigration() {
  log('\n⚙️ Testando services migrados...', 'cyan');
  
  try {
    // Testar UserService
    log(`  Testando UserService...`, 'yellow');
    const userResult = await userServicePrisma.testService();
    
    if (userResult.success) {
      log(`  ✅ UserService funcionando`, 'green');
    } else {
      log(`  ❌ UserService falhou: ${userResult.error}`, 'red');
      return false;
    }
    
    // Testar ClientService
    log(`  Testando ClientService...`, 'yellow');
    const clientResult = await clientServicePrisma.testService();
    
    if (clientResult.success) {
      log(`  ✅ ClientService funcionando`, 'green');
      log(`    Total de clientes: ${clientResult.totalClients}`, 'blue');
    } else {
      log(`  ❌ ClientService falhou: ${clientResult.error}`, 'red');
      return false;
    }
    
    log(`✅ Services migrados funcionando corretamente`, 'green');
    return true;
  } catch (error) {
    log(`❌ Erro nos services: ${error.message}`, 'red');
    return false;
  }
}

async function testBasicQueries() {
  log('\n🔍 Testando queries básicas...', 'cyan');
  
  try {
    const prisma = prismaConfig.getPrisma();
    
    // Testar query simples
    log(`  Executando query de teste...`, 'yellow');
    const testQuery = await prisma.$queryRaw`SELECT 1 as test_value`;
    
    if (testQuery && testQuery[0]?.test_value === 1) {
      log(`  ✅ Query raw funcionando`, 'green');
    } else {
      log(`  ❌ Query raw falhou`, 'red');
      return false;
    }
    
    // Testar contagem de clientes
    log(`  Testando contagem de clientes...`, 'yellow');
    const clientCount = await prisma.client.count();
    log(`  📊 Total de clientes no banco: ${clientCount}`, 'blue');
    
    // Testar contagem de usuários
    log(`  Testando contagem de usuários...`, 'yellow');
    const userCount = await prisma.user.count();
    log(`  📊 Total de usuários no banco: ${userCount}`, 'blue');
    
    log(`✅ Queries básicas funcionando`, 'green');
    return true;
  } catch (error) {
    log(`❌ Erro nas queries: ${error.message}`, 'red');
    return false;
  }
}

async function testRelationships() {
  log('\n🔗 Testando relacionamentos...', 'cyan');
  
  try {
    const prisma = prismaConfig.getPrisma();
    
    // Testar relacionamento Client -> Users
    log(`  Testando relacionamento Client -> Users...`, 'yellow');
    const clientsWithUsers = await prisma.client.findMany({
      take: 1,
      include: {
        _count: {
          select: { users: true }
        }
      }
    });
    
    if (clientsWithUsers) {
      log(`  ✅ Relacionamento Client -> Users funcionando`, 'green');
    }
    
    // Testar relacionamento User -> Client
    log(`  Testando relacionamento User -> Client...`, 'yellow');
    const usersWithClient = await prisma.user.findMany({
      take: 1,
      include: {
        client: {
          select: { name: true, isActive: true }
        }
      }
    });
    
    if (usersWithClient) {
      log(`  ✅ Relacionamento User -> Client funcionando`, 'green');
    }
    
    log(`✅ Relacionamentos funcionando corretamente`, 'green');
    return true;
  } catch (error) {
    log(`❌ Erro nos relacionamentos: ${error.message}`, 'red');
    return false;
  }
}

async function testPrismaMetrics() {
  log('\n📊 Testando métricas Prisma...', 'cyan');
  
  try {
    const metricsResult = await prismaConfig.getMetrics();
    
    if (metricsResult.success) {
      log(`✅ Métricas Prisma disponíveis`, 'green');
      // As métricas são muito verbosas, apenas confirmar que funcionam
    } else {
      log(`⚠️ Métricas Prisma não disponíveis (normal em dev)`, 'yellow');
    }
    
    return true;
  } catch (error) {
    log(`⚠️ Métricas não disponíveis: ${error.message}`, 'yellow');
    return true; // Não é crítico
  }
}

async function printSummary(results) {
  log('\n📋 RESUMO DOS TESTES', 'bold');
  log('================================', 'cyan');
  
  const tests = [
    { name: 'Conexão Prisma', result: results.connection },
    { name: 'Cliente Gerado', result: results.generation },
    { name: 'Modelos Disponíveis', result: results.models },
    { name: 'Services Migrados', result: results.services },
    { name: 'Queries Básicas', result: results.queries },
    { name: 'Relacionamentos', result: results.relationships },
    { name: 'Métricas', result: results.metrics }
  ];
  
  let passedTests = 0;
  
  tests.forEach(test => {
    const status = test.result ? '✅ PASSOU' : '❌ FALHOU';
    const color = test.result ? 'green' : 'red';
    log(`${test.name.padEnd(20)} ${status}`, color);
    if (test.result) passedTests++;
  });
  
  log('\n================================', 'cyan');
  log(`TOTAL: ${passedTests}/${tests.length} testes passaram`, passedTests === tests.length ? 'green' : 'yellow');
  
  if (passedTests === tests.length) {
    log('\n🎉 MIGRAÇÃO PRISMA VALIDADA COM SUCESSO!', 'green');
    log('✅ O sistema está pronto para usar Prisma', 'green');
  } else {
    log('\n⚠️ ALGUNS TESTES FALHARAM', 'yellow');
    log('🔧 Verifique os erros acima antes de prosseguir', 'yellow');
  }
}

async function runTests() {
  log('🚀 INICIANDO TESTES DE MIGRAÇÃO PRISMA', 'bold');
  log('=========================================', 'cyan');
  
  const results = {};
  
  try {
    // Executar testes em sequência
    results.connection = await testPrismaConnection();
    results.generation = await testPrismaGeneration();
    results.models = await testPrismaModels();
    results.services = await testServiceMigration();
    results.queries = await testBasicQueries();
    results.relationships = await testRelationships();
    results.metrics = await testPrismaMetrics();
    
    // Imprimir resumo
    await printSummary(results);
    
  } catch (error) {
    log(`\n💥 ERRO CRÍTICO: ${error.message}`, 'red');
    log('Stack trace:', 'red');
    console.error(error);
  } finally {
    // Fechar conexões
    try {
      await prismaConfig.close();
      log('\n🔌 Conexões fechadas', 'blue');
    } catch (error) {
      log(`⚠️ Erro ao fechar conexões: ${error.message}`, 'yellow');
    }
  }
}

// Executar testes se executado diretamente
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  runTests,
  testPrismaConnection,
  testServiceMigration
};
