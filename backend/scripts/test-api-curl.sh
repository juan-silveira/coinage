#!/bin/bash

echo "🌐 Testando API diretamente..."
echo ""

# 1. Testar health check
echo "1️⃣ Testando health check..."
curl -s -w "Status: %{http_code}\n" http://localhost:8800/health
echo ""

# 2. Testar login
echo "2️⃣ Testando login..."
echo "📊 Fazendo requisição de login..."
response=$(curl -s -w "Status: %{http_code}" -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"ivan.alberton@navi.inf.br","password":"N@vi@2025"}' \
  http://localhost:8800/api/auth/login)

# Extrair status e corpo da resposta
status=$(echo "$response" | grep "Status:" | cut -d' ' -f2)
body=$(echo "$response" | sed 's/Status: [0-9]*//')

echo "📊 Status da resposta: $status"
echo "📄 Corpo da resposta: $body"
echo ""

# 3. Testar endpoint de usuários
echo "3️⃣ Testando endpoint de usuários..."
curl -s -w "Status: %{http_code}\n" http://localhost:8800/api/users
echo ""

# 4. Verificar logs do backend
echo "4️⃣ Últimos logs do backend..."
docker-compose logs api --tail=5
