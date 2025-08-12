const { PrismaClient } = require('../src/generated/prisma');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
require('dotenv').config();

const prisma = new PrismaClient();

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
  console.log('🔐 Gerando chaves criptográficas RSA...');
  
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 4096,
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

async function createClientFromEnv() {
  console.log('🏢 Criando client a partir das variáveis de ambiente...');
  
  const clientData = {
    name: process.env.DEFAULT_CLIENT_NAME || 'Navi',
    rateLimit: {
      requestsPerMinute: parseInt(process.env.DEFAULT_CLIENT_RATE_LIMIT_REQUESTS_PER_MINUTE) || 1000,
      requestsPerHour: parseInt(process.env.DEFAULT_CLIENT_RATE_LIMIT_REQUESTS_PER_HOUR) || 10000,
      requestsPerDay: parseInt(process.env.DEFAULT_CLIENT_RATE_LIMIT_REQUESTS_PER_DAY) || 100000
    }
  };
  
  const client = await prisma.client.create({
    data: {
      name: clientData.name,
      isActive: true,
      rateLimit: clientData.rateLimit
    }
  });
  
  console.log(`✅ Client criado: ${client.name} (${client.id})`);
  console.log(`📊 Rate Limits: ${clientData.rateLimit.requestsPerMinute}/min, ${clientData.rateLimit.requestsPerHour}/h, ${clientData.rateLimit.requestsPerDay}/day`);
  
  return client;
}

async function createAdminFromEnv(client) {
  console.log('👤 Criando usuário administrador a partir das variáveis de ambiente...');
  
  // Ler dados do .env
  const adminData = {
    name: process.env.DEFAULT_ADMIN_NAME || 'Ivan Alberton',
    email: process.env.DEFAULT_ADMIN_EMAIL || 'ivan.alberton@navi.inf.br',
    cpf: process.env.DEFAULT_ADMIN_CPF || '02308739959',
    phone: process.env.DEFAULT_ADMIN_PHONE || '+5546999716711',
    birthDate: process.env.DEFAULT_ADMIN_BIRTH_DATE || '1979-07-26',
    password: process.env.DEFAULT_ADMIN_PASSWORD || 'N@vi@2025'
  };
  
  console.log('📋 Dados do administrador:');
  console.log(`   Nome: ${adminData.name}`);
  console.log(`   Email: ${adminData.email}`);
  console.log(`   CPF: ${adminData.cpf}`);
  console.log(`   Telefone: ${adminData.phone}`);
  console.log(`   Data Nascimento: ${adminData.birthDate}`);
  
  // Hash da senha
  console.log('🔐 Fazendo hash da senha...');
  const hashedPassword = await bcrypt.hash(adminData.password, 12);
  
  // Gerar ou usar chaves do .env
  let publicKey, privateKey;
  
  if (process.env.DEFAULT_ADMIN_PUBLIC_KEY && process.env.DEFAULT_ADMIN_PRIVATE_KEY) {
    console.log('🔑 Usando chaves criptográficas do .env...');
    // Se as chaves são do formato Ethereum (0x...), vamos convertê-las para PEM ou usar as RSA
    if (process.env.DEFAULT_ADMIN_PUBLIC_KEY.startsWith('0x')) {
      console.log('🔗 Detectadas chaves Ethereum, gerando chaves RSA adicionais...');
      const rsaKeys = await generateCryptoKeys();
      publicKey = rsaKeys.publicKey;
      privateKey = rsaKeys.privateKey;
      
      console.log(`🔗 Chave Ethereum Public: ${process.env.DEFAULT_ADMIN_PUBLIC_KEY}`);
      console.log(`🔗 Chave Ethereum Private: ${process.env.DEFAULT_ADMIN_PRIVATE_KEY.substring(0, 10)}...`);
    } else {
      publicKey = process.env.DEFAULT_ADMIN_PUBLIC_KEY;
      privateKey = process.env.DEFAULT_ADMIN_PRIVATE_KEY;
    }
  } else {
    console.log('🔑 Gerando novas chaves criptográficas...');
    const keys = await generateCryptoKeys();
    publicKey = keys.publicKey;
    privateKey = keys.privateKey;
  }
  
  // Permissões completas de administrador
  const adminPermissions = {
    admin: {
      fullAccess: true,
      clients: { read: true, create: true, update: true, delete: true },
      users: { read: true, create: true, update: true, delete: true },
      system: { read: true, create: true, update: true, delete: true },
      logs: { read: true, create: true, update: true, delete: true }
    },
    wallets: { read: true, create: true, update: true, delete: true },
    contracts: { read: true, create: true, update: true, delete: true },
    transactions: { read: true, create: true, update: true, delete: true },
    stakes: { read: true, create: true, update: true, delete: true },
    tokens: { read: true, create: true, update: true, delete: true },
    webhooks: { read: true, create: true, update: true, delete: true },
    documents: { read: true, create: true, update: true, delete: true },
    queue: { read: true, create: true, update: true, delete: true }
  };
  
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
      isApiAdmin: true,
      isClientAdmin: true,
      roles: ['USER', 'ADMIN', 'SUPER_ADMIN', 'API_ADMIN', 'CLIENT_ADMIN'],
      permissions: adminPermissions,
      canViewPrivateKeys: true,
      privateKeyAccessLevel: 'all',
      isActive: true,
      metadata: {
        createdBy: 'system-setup',
        createdAt: new Date().toISOString(),
        initialSetup: true,
        source: 'env-variables',
        ethereumPublicKey: process.env.DEFAULT_ADMIN_PUBLIC_KEY || null,
        ethereumPrivateKey: process.env.DEFAULT_ADMIN_PRIVATE_KEY ? 'stored' : null
      }
    }
  });
  
  console.log(`✅ Usuário administrador criado: ${user.name} (${user.email})`);
  console.log(`🔒 Permissões: SUPER_ADMIN com acesso total`);
  console.log(`🔑 Chaves RSA: Geradas e armazenadas`);
  
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
      name: 'Admin Master Key - Full Access',
      description: 'Chave de API principal do administrador Ivan Alberton com acesso total ao sistema. Gerada automaticamente durante setup inicial.',
      userId: user.id,
      permissions: user.permissions,
      isActive: true,
      expiresAt: null // Nunca expira
    }
  });
  
  console.log(`✅ API Key criada: ${apiKey.name}`);
  return { apiKey, apiKeyValue };
}

async function main() {
  try {
    console.log('🔍 Conectando ao banco de dados...');
    await prisma.$connect();
    
    console.log('\n🎯 SETUP AUTOMÁTICO A PARTIR DO .ENV');
    console.log('=====================================\n');
    
    console.log('📋 Variáveis de ambiente detectadas:');
    console.log(`   CLIENT_NAME: ${process.env.DEFAULT_CLIENT_NAME || 'Navi'}`);
    console.log(`   ADMIN_EMAIL: ${process.env.DEFAULT_ADMIN_EMAIL || 'ivan.alberton@navi.inf.br'}`);
    console.log(`   ADMIN_NAME: ${process.env.DEFAULT_ADMIN_NAME || 'Ivan Alberton'}`);
    console.log(`   ADMIN_CPF: ${process.env.DEFAULT_ADMIN_CPF || '02308739959'}`);
    console.log(`   ADMIN_PHONE: ${process.env.DEFAULT_ADMIN_PHONE || '+5546999716711'}`);
    console.log(`   ETHEREUM_KEYS: ${process.env.DEFAULT_ADMIN_PUBLIC_KEY ? 'Configuradas' : 'Não configuradas'}`);
    
    console.log('\n⚠️  Este script irá:');
    console.log('1. 🗑️  Limpar completamente o banco de dados');
    console.log('2. 🏢 Criar o client com dados do .env');
    console.log('3. 👤 Criar o usuário administrador com dados do .env');
    console.log('4. 🔑 Gerar API Key de administrador');
    console.log('5. 🔐 Configurar permissões de SUPER_ADMIN');
    
    console.log('\n🔄 Iniciando em 3 segundos...\n');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 1. Reset do banco
    await resetDatabase();
    
    // 2. Criar client
    const client = await createClientFromEnv();
    
    // 3. Criar usuário admin
    const admin = await createAdminFromEnv(client);
    
    // 4. Criar API Key
    const { apiKey, apiKeyValue } = await createAdminApiKey(admin);
    
    // 5. Exibir resultados
    console.log('\n🎉 CONFIGURAÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('=====================================\n');
    
    console.log('📋 DADOS CRIADOS:');
    console.log(`🏢 Client: ${client.name} (${client.id})`);
    console.log(`👤 Admin: ${admin.name}`);
    console.log(`📧 Email: ${admin.email}`);
    console.log(`🔐 Senha: ${process.env.DEFAULT_ADMIN_PASSWORD}`);
    console.log(`🔑 API Key: ${apiKeyValue}`);
    console.log(`📱 CPF: ${admin.cpf}`);
    console.log(`☎️  Telefone: ${admin.phone}`);
    console.log(`🎂 Nascimento: ${admin.birthDate.toISOString().split('T')[0]}`);
    
    console.log('\n🧪 COMANDOS DE TESTE:');
    console.log('===================');
    
    console.log('\n# 1. Teste de Login:');
    console.log(`curl -X POST http://localhost:8800/api/auth/login \\`);
    console.log(`  -H "Content-Type: application/json" \\`);
    console.log(`  -d '{"email":"${admin.email}","password":"${process.env.DEFAULT_ADMIN_PASSWORD}"}'`);
    
    console.log('\n# 2. Teste com API Key:');
    console.log(`curl -H "X-API-Key: ${apiKeyValue}" \\`);
    console.log(`  http://localhost:8800/api/test/connection`);
    
    console.log('\n# 3. Buscar usuário criado:');
    console.log(`curl -s "http://localhost:8800/api/debug/find-user/${admin.email}"`);
    
    console.log('\n✅ Sistema pronto para uso com os dados do .env!');
    console.log('🎯 Usuário ivan.alberton@navi.inf.br criado com sucesso!');
    
  } catch (error) {
    console.error('\n❌ Erro durante a configuração:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = { main };
