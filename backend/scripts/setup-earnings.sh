#!/bin/bash

echo "🚀 Configurando tabela de Earnings..."

# Navegar para o diretório do backend
cd "$(dirname "$0")/.."

# Verificar se o Prisma está instalado
if ! command -v npx &> /dev/null; then
    echo "❌ npx não encontrado. Instale o Node.js primeiro."
    exit 1
fi

# Executar migração do Prisma
echo "📊 Executando migração do banco de dados..."
npx prisma migrate dev --name add_earnings_table

if [ $? -eq 0 ]; then
    echo "✅ Migração executada com sucesso!"
else
    echo "❌ Erro na migração. Verifique o banco de dados."
    exit 1
fi

# Gerar cliente Prisma
echo "🔧 Gerando cliente Prisma..."
npx prisma generate

if [ $? -eq 0 ]; then
    echo "✅ Cliente Prisma gerado com sucesso!"
else
    echo "❌ Erro ao gerar cliente Prisma."
    exit 1
fi

# Executar seed de earnings
echo "🌱 Executando seed de earnings..."
node scripts/seed-earnings.js

if [ $? -eq 0 ]; then
    echo "✅ Seed de earnings executado com sucesso!"
else
    echo "❌ Erro no seed de earnings."
    exit 1
fi

echo "🎉 Configuração de Earnings concluída!"
echo ""
echo "📋 Resumo do que foi configurado:"
echo "  - Tabela 'earnings' criada no banco de dados"
echo "  - Rotas da API configuradas em /api/earnings"
echo "  - Serviços backend implementados"
echo "  - Dados de exemplo inseridos"
echo ""
echo "🔄 Para testar, reinicie o servidor backend e acesse o dashboard."
