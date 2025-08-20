# Plano de Testes Completo da API Coinage

## Análise dos Problemas Identificados

### 1. **Problemas de Infraestrutura**
- **Docker não está rodando**: Os containers não estão ativos
- **Backend na porta 8800**: Sem resposta do servidor
- **Frontend na porta 3000**: Sem resposta
- **PostgreSQL na porta 5433**: Configurado mas depende do Docker

### 2. **Problemas de Autenticação JWT**
- Sistema JWT bem estruturado com refresh token
- Middleware JWT verifica token no header Authorization
- Dependência do Prisma e Redis para validação
- Problema: Se Redis/Prisma não estão inicializados, falha na autenticação

### 3. **Problemas de Integração Frontend/Backend**
- Frontend hardcoded para `http://localhost:8800`
- Interceptors do Axios configurados corretamente
- Sistema de refresh token implementado
- CORS configurado para aceitar todas origens (desenvolvimento)

### 4. **Problemas de Configuração**
- Arquivo usa `server.prisma.js` mas Docker healthcheck aponta para porta 3000
- Conflito de portas: Backend deveria estar em 8800 mas healthcheck verifica 3000
- BigInt serialization implementado mas pode causar problemas no frontend

## Roteiro de Correção e Testes

### Fase 1: Preparação do Ambiente

```bash
# 1. Limpar ambiente Docker
docker compose down -v
docker system prune -af

# 2. Verificar arquivo .env na raiz
cat .env

# 3. Corrigir docker-compose.yml (healthcheck do backend)
# Mudar de porta 3000 para 8800 no healthcheck
```

### Fase 2: Inicialização dos Serviços

```bash
# 1. Build e start dos containers
docker compose build
docker compose up -d

# 2. Verificar logs
docker compose logs -f backend
docker compose logs -f postgres

# 3. Aguardar healthchecks
docker compose ps

# 4. Verificar conectividade
curl http://localhost:8800/health
curl http://localhost:5433  # PostgreSQL
```

### Fase 3: Configuração do Banco de Dados

```bash
# 1. Executar migrations Prisma
docker exec coinage_backend npx prisma migrate deploy

# 2. Gerar cliente Prisma
docker exec coinage_backend npx prisma generate

# 3. Popular dados básicos
docker exec coinage_backend node scripts/seed-basic-data.js
```

### Fase 4: Testes da API

## Sequência de Testes Completa

### 1. Health Checks
```bash
# Backend health
curl http://localhost:8800/health

# API info
curl http://localhost:8800/

# Swagger
curl http://localhost:8800/api-docs
```

### 2. Criação de Usuário
```bash
curl -X POST http://localhost:8800/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Teste Usuario",
    "email": "teste@example.com",
    "password": "Senha@123",
    "cpf": "12345678900",
    "phone": "+5511999999999"
  }'
```

### 3. Confirmação de Email
```bash
# Obter código de confirmação (verificar logs ou banco)
docker exec coinage_backend psql -U coinage_user -d coinage_db \
  -c "SELECT confirmation_code FROM email_confirmations WHERE email='teste@example.com';"

# Confirmar email
curl -X POST http://localhost:8800/api/email-confirmation/confirm \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@example.com",
    "code": "CODIGO_AQUI"
  }'
```

### 4. Login
```bash
# Login inicial
curl -X POST http://localhost:8800/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ivan.alberton@navi.inf.br",
    "password": "N@vi@2025"
  }'

# Salvar tokens da resposta
ACCESS_TOKEN="token_aqui"
REFRESH_TOKEN="refresh_token_aqui"
```

### 5. Operações Autenticadas

#### Obter Perfil
```bash
curl http://localhost:8800/api/auth/me \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

#### Listar Balances
```bash
curl http://localhost:8800/api/balance-sync/fresh \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -G --data-urlencode "address=0x..." \
  --data-urlencode "network=testnet"
```

#### Listar Transações
```bash
curl http://localhost:8800/api/transactions \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -G --data-urlencode "page=1" \
  --data-urlencode "limit=10"
```

### 6. Refresh Token
```bash
curl -X POST http://localhost:8800/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "'$REFRESH_TOKEN'"
  }'
```

### 7. Operações de Depósito
```bash
# Criar depósito PIX
curl -X POST http://localhost:8800/api/deposits \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100.00,
    "method": "PIX"
  }'
```

### 8. Operações de Saque
```bash
# Criar saque
curl -X POST http://localhost:8800/api/withdrawals \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 50.00,
    "method": "PIX",
    "pixKey": "email@example.com"
  }'
```

### 9. Logout
```bash
curl -X POST http://localhost:8800/api/auth/logout \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

## Script Automatizado de Testes

```bash
#!/bin/bash
# test-api.sh

API_URL="http://localhost:8800"
EMAIL="test_$(date +%s)@example.com"
PASSWORD="Test@123456"

echo "🔍 Testando API Coinage..."

# 1. Health Check
echo -e "\n1️⃣ Health Check..."
curl -s $API_URL/health | jq '.'

# 2. Registro
echo -e "\n2️⃣ Registrando usuário..."
REGISTER_RESPONSE=$(curl -s -X POST $API_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Teste Usuario\",
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\",
    \"cpf\": \"12345678900\",
    \"phone\": \"+5511999999999\"
  }")
echo $REGISTER_RESPONSE | jq '.'

# 3. Login
echo -e "\n3️⃣ Fazendo login..."
LOGIN_RESPONSE=$(curl -s -X POST $API_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"ivan.alberton@navi.inf.br\",
    \"password\": \"N@vi@2025\"
  }")
echo $LOGIN_RESPONSE | jq '.'

ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.accessToken')
REFRESH_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.refreshToken')

# 4. Perfil
echo -e "\n4️⃣ Obtendo perfil..."
curl -s $API_URL/api/auth/me \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'

# 5. Transações
echo -e "\n5️⃣ Listando transações..."
curl -s $API_URL/api/transactions \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'

# 6. Refresh Token
echo -e "\n6️⃣ Renovando token..."
REFRESH_RESPONSE=$(curl -s -X POST $API_URL/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\": \"$REFRESH_TOKEN\"}")
echo $REFRESH_RESPONSE | jq '.'

echo -e "\n✅ Testes concluídos!"
```

## Correções Necessárias

### 1. Docker Compose
```yaml
# Corrigir healthcheck do backend
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8800/health"]  # Era 3000
```

### 2. Backend server.js
- Verificar inicialização do Prisma antes dos middlewares
- Adicionar retry logic para conexão com banco
- Melhorar tratamento de erros na inicialização

### 3. Frontend
- Adicionar variáveis de ambiente para API_URL
- Implementar retry logic no interceptor
- Melhorar feedback de erros para o usuário

### 4. Prisma
- Verificar schema.prisma para relações corretas
- Adicionar índices para performance
- Configurar connection pool adequadamente

## Monitoramento

### Logs em Tempo Real
```bash
# Terminal 1: Backend
docker logs -f coinage_backend

# Terminal 2: PostgreSQL
docker logs -f coinage_postgres

# Terminal 3: Redis
docker logs -f coinage_redis

# Terminal 4: Frontend (se dockerizado)
yarn dev # ou npm run dev
```

### Verificação de Saúde
```bash
# Script de monitoramento
watch -n 5 'docker ps && echo "---" && curl -s http://localhost:8800/health | jq'
```

## Problemas Comuns e Soluções

### 1. "Cannot connect to Docker daemon"
```bash
# Linux
sudo systemctl start docker
sudo usermod -aG docker $USER

# macOS
open -a Docker
```

### 2. "Port already in use"
```bash
# Verificar portas
lsof -i :8800
lsof -i :5433

# Matar processos
kill -9 $(lsof -t -i:8800)
```

### 3. "Prisma client not generated"
```bash
docker exec coinage_backend npx prisma generate
```

### 4. "JWT Secret not defined"
```bash
# Verificar .env
grep JWT_SECRET .env

# Gerar novo secret se necessário
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## Conclusão

O sistema tem uma arquitetura sólida mas precisa de:
1. ✅ Containers Docker rodando
2. ✅ Correção do healthcheck (porta 3000 → 8800)
3. ✅ Inicialização correta do Prisma
4. ✅ População de dados básicos
5. ✅ Frontend rodando localmente (não dockerizado)

Com essas correções, a plataforma funcionará corretamente.