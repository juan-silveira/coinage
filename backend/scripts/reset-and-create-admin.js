const { PrismaClient } = require('../src/generated/prisma');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const readline = require('readline');

const prisma = new PrismaClient();

// Interface para input do usuário
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Função para input
const askQuestion = (question) => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
};

// Dados padrão para desenvolvimento
const DEFAULT_CLIENT = {
  name: 'Navi Tecnologia',
  description: 'Cliente principal da plataforma Navi',
  rateLimit: {
    requestsPerMinute: 1000,
    requestsPerHour: 10000,
    requestsPerDay: 100000
  }
};

const DEFAULT_ADMIN = {
  name: 'Ivan Alberton',
  email: 'ivan.alberton@navi.inf.br',
  cpf: '00000000000', // CPF padrão para desenvolvimento
  phone: '+5548999999999',
  birthDate: '1985-01-01',
  password: 'N@vi@2025',
  isApiAdmin: true,
  isClientAdmin: true,
  roles: ['USER', 'ADMIN', 'SUPER_ADMIN'],
  permissions: {
    admin: {
      fullAccess: true,
      clients: { read: true, create: true, update: true, delete: true },
      users: { read: true, create: true, update: true, delete: true },
      system: { read: true, create: true, update: true, delete: true }
    },
    wallets: { read: true, create: true, update: true, delete: true },
    contracts: { read: true, create: true, update: true, delete: true },
    transactions: { read: true, create: true, update: true, delete: true },
    logs: { read: true, create: true, update: true, delete: true },
    webhooks: { read: true, create: true, update: true, delete: true },
    documents: { read: true, create: true, update: true, delete: true }
  },
  canViewPrivateKeys: true,
  privateKeyAccessLevel: 'all'
};

async function resetDatabase() {
  try {
    console.log('🗑️  Limpando banco de dados...');
    
    // Ordem importante para evitar conflitos de FK
    const tableNames = [
      'UserTwoFactor',
      'UserClient', 
      'ClientBranding',
      'Document',
      'Webhook',
      'PasswordReset',
      'RequestLog',
      'Transaction',
      'ApiKey',
      'SmartContract',
      'Stake',
      'User',
      'Client'
    ];

    for (const tableName of tableNames) {
      try {
        const modelName = tableName.charAt(0).toLowerCase() + tableName.slice(1);
        await prisma[modelName].deleteMany();
        console.log(`✅ Tabela ${tableName} limpa`);
      } catch (error) {
        console.warn(`⚠️  Aviso ao limpar tabela ${tableName}:`, error.message);
      }
    }

    console.log('✅ Banco de dados resetado com sucesso');
  } catch (error) {
    console.error('❌ Erro ao resetar banco:', error);
    throw error;
  }
}

async function generateCryptoKeys() {
  console.log('🔐 Gerando chaves criptográficas...');
  
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 4096, // Chave mais forte para admin
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });
  
  return { publicKey, privateKey };
}

async function createClient(clientData) {
  console.log('🏢 Criando client...');
  
  const client = await prisma.client.create({
    data: {
      name: clientData.name,
      isActive: true,
      rateLimit: clientData.rateLimit || DEFAULT_CLIENT.rateLimit
    }
  });
  
  console.log(`✅ Client criado: ${client.name} (${client.id})`);
  return client;
}

async function createAdminUser(adminData, client) {
  console.log('👤 Criando usuário administrador...');
  
  // Hash da senha
  const hashedPassword = await bcrypt.hash(adminData.password, 12);
  
  // Gerar chaves
  const { publicKey, privateKey } = await generateCryptoKeys();
  
  const user = await prisma.user.create({
    data: {
      name: adminData.name,
      email: adminData.email,
      cpf: adminData.cpf,
      phone: adminData.phone,
      birthDate: new Date(adminData.birthDate),
      publicKey: publicKey,
      privateKey: privateKey,
      clientId: client.id,
      password: hashedPassword,
      isFirstAccess: false, // Admin não precisa trocar senha
      isApiAdmin: adminData.isApiAdmin,
      isClientAdmin: adminData.isClientAdmin,
      roles: adminData.roles,
      permissions: adminData.permissions,
      canViewPrivateKeys: adminData.canViewPrivateKeys,
      privateKeyAccessLevel: adminData.privateKeyAccessLevel,
      isActive: true,
      metadata: {
        createdBy: 'system',
        createdAt: new Date().toISOString(),
        initialSetup: true
      }
    }
  });
  
  console.log(`✅ Usuário administrador criado: ${user.name} (${user.email})`);
  return user;
}

async function createAdminApiKey(user) {
  console.log('🔑 Criando API Key de administrador...');
  
  const apiKeyValue = crypto.randomBytes(32).toString('hex');
  const apiKeyHash = crypto.createHash('sha256').update(apiKeyValue).digest('hex');
  
  const apiKey = await prisma.apiKey.create({
    data: {
      key: apiKeyValue,
      keyHash: apiKeyHash,
      name: 'Admin Master Key',
      description: 'Chave de API principal do administrador com acesso total ao sistema',
      userId: user.id,
      permissions: user.permissions,
      isActive: true,
      expiresAt: null // Nunca expira
    }
  });
  
  console.log(`✅ API Key criada: ${apiKey.name}`);
  return { apiKey, apiKeyValue };
}

async function interactiveSetup() {
  console.log('\n🚀 SETUP INTERATIVO DO SISTEMA\n');
  
  // Dados do Client
  console.log('📋 CONFIGURAÇÃO DO CLIENT:');
  const clientName = await askQuestion(`Nome do Client [${DEFAULT_CLIENT.name}]: `) || DEFAULT_CLIENT.name;
  
  // Dados do Admin
  console.log('\n📋 CONFIGURAÇÃO DO USUÁRIO ADMINISTRADOR:');
  const adminName = await askQuestion(`Nome completo [${DEFAULT_ADMIN.name}]: `) || DEFAULT_ADMIN.name;
  const adminEmail = await askQuestion(`Email [${DEFAULT_ADMIN.email}]: `) || DEFAULT_ADMIN.email;
  const adminCpf = await askQuestion(`CPF [${DEFAULT_ADMIN.cpf}]: `) || DEFAULT_ADMIN.cpf;
  const adminPhone = await askQuestion(`Telefone [${DEFAULT_ADMIN.phone}]: `) || DEFAULT_ADMIN.phone;
  const adminPassword = await askQuestion(`Senha [${DEFAULT_ADMIN.password}]: `) || DEFAULT_ADMIN.password;
  
  return {
    client: {
      name: clientName,
      rateLimit: DEFAULT_CLIENT.rateLimit
    },
    admin: {
      ...DEFAULT_ADMIN,
      name: adminName,
      email: adminEmail,
      cpf: adminCpf,
      phone: adminPhone,
      password: adminPassword
    }
  };
}

async function quickSetup() {
  console.log('\n⚡ SETUP RÁPIDO COM DADOS PADRÃO\n');
  return {
    client: DEFAULT_CLIENT,
    admin: DEFAULT_ADMIN
  };
}

async function main() {
  try {
    console.log('🔍 Conectando ao banco de dados...');
    await prisma.$connect();
    
    console.log('\n🎯 RESET E CONFIGURAÇÃO INICIAL DO SISTEMA\n');
    console.log('Este script irá:');
    console.log('1. 🗑️  Limpar completamente o banco de dados');
    console.log('2. 🏢 Criar um client principal');
    console.log('3. 👤 Criar um usuário administrador');
    console.log('4. 🔑 Gerar API Key de administrador');
    console.log('5. 🔐 Configurar permissões completas\n');
    
    const setupType = await askQuestion('Escolha o tipo de setup:\n1. Interativo (customizar dados)\n2. Rápido (dados padrão)\n\nOpção [2]: ') || '2';
    
    let config;
    if (setupType === '1') {
      config = await interactiveSetup();
    } else {
      config = await quickSetup();
    }
    
    const confirm = await askQuestion('\n⚠️  ATENÇÃO: Todos os dados do banco serão PERDIDOS! Continuar? (y/N): ');
    if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
      console.log('❌ Operação cancelada pelo usuário');
      return;
    }
    
    // Executar setup
    console.log('\n🔄 Iniciando configuração...\n');
    
    // 1. Reset do banco
    await resetDatabase();
    
    // 2. Criar client
    const client = await createClient(config.client);
    
    // 3. Criar usuário admin
    const admin = await createAdminUser(config.admin, client);
    
    // 4. Criar API Key
    const { apiKey, apiKeyValue } = await createAdminApiKey(admin);
    
    // 5. Exibir resultados
    console.log('\n🎉 CONFIGURAÇÃO CONCLUÍDA COM SUCESSO!\n');
    console.log('📋 DADOS CRIADOS:');
    console.log('================');
    console.log(`🏢 Client: ${client.name}`);
    console.log(`📧 Admin Email: ${admin.email}`);
    console.log(`🔐 Admin Senha: ${config.admin.password}`);
    console.log(`🔑 API Key: ${apiKeyValue}`);
    console.log(`👤 User ID: ${admin.id}`);
    console.log(`🏢 Client ID: ${client.id}`);
    
    console.log('\n🧪 COMANDOS DE TESTE:');
    console.log('===================');
    console.log('\n# Teste de Login:');
    console.log(`curl -X POST http://localhost:8800/api/auth/login \\`);
    console.log(`  -H "Content-Type: application/json" \\`);
    console.log(`  -d '{"email":"${admin.email}","password":"${config.admin.password}"}'`);
    
    console.log('\n# Teste com API Key:');
    console.log(`curl -H "X-API-Key: ${apiKeyValue}" \\`);
    console.log(`  http://localhost:8800/api/test/connection`);
    
    console.log('\n✅ Sistema pronto para uso!');
    
  } catch (error) {
    console.error('\n❌ Erro durante a configuração:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    rl.close();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = { main, resetDatabase, createClient, createAdminUser, createAdminApiKey };
