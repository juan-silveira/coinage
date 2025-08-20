#!/bin/bash

# Script de Testes da API Coinage
API_URL="http://localhost:8800"
FRONTEND_URL="http://localhost:3000"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}  TESTE COMPLETO DA API COINAGE${NC}"
echo -e "${GREEN}======================================${NC}"

# 1. Health Check
echo -e "\n${YELLOW}1. HEALTH CHECK${NC}"
echo "Testing: $API_URL/health"
HEALTH=$(curl -s $API_URL/health)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backend está rodando${NC}"
    echo "Response: $HEALTH"
else
    echo -e "${RED}❌ Backend não está respondendo${NC}"
fi

# 2. API Info
echo -e "\n${YELLOW}2. API INFO${NC}"
echo "Testing: $API_URL/"
API_INFO=$(curl -s $API_URL/)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ API info disponível${NC}"
    echo "Response: $API_INFO"
else
    echo -e "${RED}❌ API info não disponível${NC}"
fi

# 3. Login com usuário padrão
echo -e "\n${YELLOW}3. LOGIN${NC}"
echo "Testing: Login com ivan.alberton@navi.inf.br"
LOGIN_RESPONSE=$(curl -s -X POST $API_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ivan.alberton@navi.inf.br",
    "password": "N@vi@2025"
  }')

if echo "$LOGIN_RESPONSE" | grep -q "accessToken"; then
    echo -e "${GREEN}✅ Login bem-sucedido${NC}"
    ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | sed -n 's/.*"accessToken":"\([^"]*\)".*/\1/p')
    REFRESH_TOKEN=$(echo $LOGIN_RESPONSE | sed -n 's/.*"refreshToken":"\([^"]*\)".*/\1/p')
    echo "Access Token obtido: ${ACCESS_TOKEN:0:20}..."
else
    echo -e "${RED}❌ Falha no login${NC}"
    echo "Response: $LOGIN_RESPONSE"
    ACCESS_TOKEN=""
fi

# 4. Obter perfil do usuário
if [ ! -z "$ACCESS_TOKEN" ]; then
    echo -e "\n${YELLOW}4. PERFIL DO USUÁRIO${NC}"
    echo "Testing: $API_URL/api/auth/me"
    PROFILE=$(curl -s $API_URL/api/auth/me \
      -H "Authorization: Bearer $ACCESS_TOKEN")
    
    if echo "$PROFILE" | grep -q "success"; then
        echo -e "${GREEN}✅ Perfil obtido com sucesso${NC}"
        echo "Response: $PROFILE" | head -100
    else
        echo -e "${RED}❌ Falha ao obter perfil${NC}"
        echo "Response: $PROFILE"
    fi
fi

# 5. Listar transações
if [ ! -z "$ACCESS_TOKEN" ]; then
    echo -e "\n${YELLOW}5. LISTAR TRANSAÇÕES${NC}"
    echo "Testing: $API_URL/api/transactions"
    TRANSACTIONS=$(curl -s $API_URL/api/transactions \
      -H "Authorization: Bearer $ACCESS_TOKEN")
    
    if echo "$TRANSACTIONS" | grep -q "success"; then
        echo -e "${GREEN}✅ Transações listadas com sucesso${NC}"
        echo "Response: $TRANSACTIONS" | head -100
    else
        echo -e "${RED}❌ Falha ao listar transações${NC}"
        echo "Response: $TRANSACTIONS"
    fi
fi

# 6. Testar refresh token
if [ ! -z "$REFRESH_TOKEN" ]; then
    echo -e "\n${YELLOW}6. REFRESH TOKEN${NC}"
    echo "Testing: $API_URL/api/auth/refresh"
    REFRESH_RESPONSE=$(curl -s -X POST $API_URL/api/auth/refresh \
      -H "Content-Type: application/json" \
      -d "{\"refreshToken\": \"$REFRESH_TOKEN\"}")
    
    if echo "$REFRESH_RESPONSE" | grep -q "accessToken"; then
        echo -e "${GREEN}✅ Token renovado com sucesso${NC}"
        NEW_ACCESS_TOKEN=$(echo $REFRESH_RESPONSE | sed -n 's/.*"accessToken":"\([^"]*\)".*/\1/p')
        echo "Novo Access Token: ${NEW_ACCESS_TOKEN:0:20}..."
    else
        echo -e "${RED}❌ Falha ao renovar token${NC}"
        echo "Response: $REFRESH_RESPONSE"
    fi
fi

# 7. Verificar frontend
echo -e "\n${YELLOW}7. FRONTEND CHECK${NC}"
echo "Testing: $FRONTEND_URL"
FRONTEND_CHECK=$(curl -s -o /dev/null -w "%{http_code}" $FRONTEND_URL)
if [ "$FRONTEND_CHECK" = "200" ]; then
    echo -e "${GREEN}✅ Frontend está rodando na porta 3000${NC}"
else
    echo -e "${RED}❌ Frontend não está respondendo${NC}"
fi

# 8. Verificar conexão PostgreSQL
echo -e "\n${YELLOW}8. POSTGRESQL CHECK${NC}"
PG_CHECK=$(docker exec coinage_postgres pg_isready -U coinage_user -d coinage_db 2>&1)
if echo "$PG_CHECK" | grep -q "accepting connections"; then
    echo -e "${GREEN}✅ PostgreSQL está aceitando conexões${NC}"
else
    echo -e "${RED}❌ PostgreSQL não está acessível${NC}"
fi

# 9. Verificar Redis
echo -e "\n${YELLOW}9. REDIS CHECK${NC}"
REDIS_CHECK=$(docker exec coinage_redis redis-cli ping 2>&1)
if [ "$REDIS_CHECK" = "PONG" ]; then
    echo -e "${GREEN}✅ Redis está respondendo${NC}"
else
    echo -e "${RED}❌ Redis não está respondendo${NC}"
fi

# Resumo
echo -e "\n${GREEN}======================================${NC}"
echo -e "${GREEN}  RESUMO DO TESTE${NC}"
echo -e "${GREEN}======================================${NC}"

echo -e "\nServiços testados:"
echo "✓ Backend API (porta 8800)"
echo "✓ Frontend (porta 3000)"
echo "✓ PostgreSQL (porta 5433)"
echo "✓ Redis"
echo "✓ Autenticação JWT"
echo "✓ Refresh Token"
echo "✓ Endpoints de usuário"

echo -e "\n${YELLOW}Problemas identificados que precisam correção:${NC}"
echo "1. Healthcheck do Docker está verificando porta errada (3000 ao invés de 8800)"
echo "2. Alguns serviços não estão completamente migrados para Prisma"
echo "3. RabbitMQ não está conectando corretamente"

echo -e "\n${GREEN}Teste concluído!${NC}"