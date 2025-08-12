const { Sequelize } = require('sequelize');

// Configuração do banco de dados
const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'coinage',
  logging: false
});

async function checkUsers() {
  try {
    console.log('🔍 Conectando ao banco de dados...');
    await sequelize.authenticate();
    console.log('✅ Conexão estabelecida com sucesso');

    // Verificar se a tabela User existe
    const [results] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'users'
    `);

    if (results.length === 0) {
      console.log('❌ Tabela users não encontrada');
      return;
    }

    console.log('✅ Tabela users encontrada');

    // Listar todos os usuários
    const [users] = await sequelize.query(`
      SELECT id, name, email, "publicKey", "isApiAdmin", "isClientAdmin", "isActive", "createdAt"
      FROM users
      ORDER BY "createdAt" DESC
    `);

    console.log('\n📋 Usuários encontrados:');
    if (users.length === 0) {
      console.log('❌ Nenhum usuário encontrado');
    } else {
      users.forEach((user, index) => {
        console.log(`\n${index + 1}. ${user.name} (${user.email})`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Public Key: ${user.publicKey || 'N/A'}`);
        console.log(`   API Admin: ${user.isApiAdmin ? 'Sim' : 'Não'}`);
        console.log(`   Client Admin: ${user.isClientAdmin ? 'Sim' : 'Não'}`);
        console.log(`   Ativo: ${user.isActive ? 'Sim' : 'Não'}`);
        console.log(`   Criado em: ${user.createdAt}`);
      });
    }

    // Verificar configurações do admin padrão
    console.log('\n🔧 Configurações do admin padrão:');
    console.log(`DEFAULT_ADMIN_EMAIL: ${process.env.DEFAULT_ADMIN_EMAIL || 'admin@azore.technology'}`);
    console.log(`DEFAULT_ADMIN_PASSWORD: ${process.env.DEFAULT_ADMIN_PASSWORD ? '***' : 'azore@admin123'}`);
    console.log(`DEFAULT_ADMIN_NAME: ${process.env.DEFAULT_ADMIN_NAME || 'Admin'}`);

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await sequelize.close();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  checkUsers().catch(console.error);
}

module.exports = { checkUsers };
