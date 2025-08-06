#!/bin/bash

# Script para iniciar o frontend DashCode
# Uso: ./start.sh

set -e

echo "🎨 Iniciando Frontend DashCode..."
echo "=================================="

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Erro: package.json não encontrado. Execute este script na pasta frontend/"
    exit 1
fi

# Verificar se o Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Erro: Node.js não está instalado"
    echo "📥 Instale o Node.js: https://nodejs.org/"
    exit 1
fi

# Verificar se o Yarn está instalado
if ! command -v yarn &> /dev/null; then
    echo "❌ Erro: Yarn não está instalado"
    echo "📥 Instale o Yarn: npm install -g yarn"
    exit 1
fi

echo "📦 Verificando dependências..."

# Verificar se node_modules existe
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    yarn install
    echo "✅ Dependências instaladas!"
else
    echo "✅ Dependências já instaladas"
fi

# Verificar se há atualizações de dependências
echo "🔄 Verificando atualizações..."
yarn install --check-files

echo "🚀 Iniciando servidor de desenvolvimento..."
echo "🌐 Frontend estará disponível em: http://localhost:3000"
echo "📱 Pressione Ctrl+C para parar"
echo ""

# Iniciar o servidor de desenvolvimento
yarn dev 