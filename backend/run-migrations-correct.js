const { execSync } = require('child_process');
require('dotenv').config();

console.log('🔄 Executando migrations do Prisma com credenciais corretas...');

try {
  // Executar migrations
  execSync('npx prisma migrate deploy', { 
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_URL: 'postgresql://coinage_user:coinage_password@localhost:5433/coinage_db?sslmode=disable'
    }
  });
  
  console.log('✅ Migrations executadas com sucesso!');
  
  // Gerar cliente Prisma
  console.log('🔄 Gerando cliente Prisma...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✅ Cliente Prisma gerado com sucesso!');
  
} catch (error) {
  console.error('❌ Erro ao executar migrations:', error.message);
  process.exit(1);
}
