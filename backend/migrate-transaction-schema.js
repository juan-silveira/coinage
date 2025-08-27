require('dotenv').config({ path: '.env.testnet' });
const prismaConfig = require('./src/config/prisma');

async function migrateTransactionSchema() {
  try {
    console.log('🔄 Atualizando schema da tabela transactions...');
    
    await prismaConfig.initialize();
    const prisma = prismaConfig.getPrisma();
    
    // Executar SQL raw para adicionar as novas colunas
    const sqlCommands = [
      // Adicionar colunas financeiras
      `ALTER TABLE transactions ADD COLUMN IF NOT EXISTS amount DECIMAL(15,2)`,
      `ALTER TABLE transactions ADD COLUMN IF NOT EXISTS currency VARCHAR(5)`,
      
      // Adicionar coluna de endereço do contrato
      `ALTER TABLE transactions ADD COLUMN IF NOT EXISTS contract_address VARCHAR(42)`,
      
      // Remover colunas não utilizadas (opcional)
      `ALTER TABLE transactions DROP COLUMN IF EXISTS user_company_id`,
      `ALTER TABLE transactions DROP COLUMN IF EXISTS request_log_id`,
      `ALTER TABLE transactions DROP COLUMN IF EXISTS contract_id`,
      `ALTER TABLE transactions DROP COLUMN IF EXISTS value`,
      `ALTER TABLE transactions DROP COLUMN IF EXISTS gas_price`,
      `ALTER TABLE transactions DROP COLUMN IF EXISTS gas_limit`,
      `ALTER TABLE transactions DROP COLUMN IF EXISTS nonce`,
      `ALTER TABLE transactions DROP COLUMN IF EXISTS data`,
      `ALTER TABLE transactions DROP COLUMN IF EXISTS function_params`,
      `ALTER TABLE transactions DROP COLUMN IF EXISTS receipt`,
      `ALTER TABLE transactions DROP COLUMN IF EXISTS error`,
      `ALTER TABLE transactions DROP COLUMN IF EXISTS confirmations`,
      `ALTER TABLE transactions DROP COLUMN IF EXISTS estimated_gas`,
      `ALTER TABLE transactions DROP COLUMN IF EXISTS actual_gas_cost`,
      `ALTER TABLE transactions DROP COLUMN IF EXISTS submitted_at`,
      
      // Tornar network opcional
      `ALTER TABLE transactions ALTER COLUMN network DROP NOT NULL`,
      
      // Adicionar índice para contract_address
      `CREATE INDEX IF NOT EXISTS idx_transactions_contract_address ON transactions(contract_address)`
    ];
    
    for (const sql of sqlCommands) {
      try {
        console.log(`Executando: ${sql.substring(0, 50)}...`);
        await prisma.$executeRawUnsafe(sql);
        console.log('✅ Sucesso');
      } catch (error) {
        console.log(`⚠️ Aviso: ${error.message}`);
      }
    }
    
    console.log('\\n✅ Schema da tabela transactions atualizado com sucesso!');
    
    // Verificar a estrutura atual
    const result = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'transactions' 
      ORDER BY ordinal_position
    `;
    
    console.log('\\n📋 Estrutura atual da tabela transactions:');
    result.forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`);
    });
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erro na migração:', error);
    process.exit(1);
  }
}

migrateTransactionSchema();