# 🚀 Quick Start - Coinage

## Pré-requisitos

- Docker e Docker Compose instalados
- Node.js 18+ (para o frontend)
- Yarn (para o frontend)

## 🏃‍♂️ Início Rápido

### 1. Iniciar Backend e Infraestrutura

```bash
# Na raiz do projeto
./scripts/start.sh
```

Ou manualmente:

```bash
cd backend
docker-compose up -d --build
```

### 2. Iniciar Frontend

```bash
cd frontend
yarn install
yarn dev
```

## 👤 Credenciais Padrão

**Usuário Admin:**
- **Email:** `ivan.alberton@navi.inf.br`
- **Senha:** `N@vi@2025`

⚠️ **IMPORTANTE:** No primeiro acesso, o sistema solicitará a troca da senha por questões de segurança.

## 🌐 URLs de Acesso

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8800
- **PostgreSQL:** localhost:5433
- **Redis:** localhost:6379
- **RabbitMQ:** http://localhost:15672
- **MinIO:** http://localhost:9001

## 🔧 Containers

Os containers do backend agora usam o prefixo `coinage_`:

- `coinage_postgres` - Banco de dados PostgreSQL
- `coinage_rabbitmq` - Message broker RabbitMQ
- `coinage_minio` - Armazenamento de objetos S3-compatible
- `coinage_redis` - Cache Redis
- `coinage_api` - API Node.js

## 📋 Comandos Úteis

```bash
# Ver status dos containers
./scripts/status.sh

# Parar todos os containers
./scripts/stop.sh

# Ver logs em tempo real
docker-compose logs -f

# Acessar container da API
docker exec -it coinage_api bash

# Acessar banco de dados
docker exec -it coinage_postgres psql -U postgres -d azore_blockchain_service
```

## 🔒 Segurança

O sistema implementa as seguintes medidas de segurança:

1. **Troca de Senha Obrigatória:** No primeiro acesso, qualquer usuário deve trocar sua senha
2. **Middleware de Proteção:** Rotas protegidas verificam se a senha foi alterada
3. **Validação de Complexidade:** Nova senha deve ter pelo menos 8 caracteres com maiúscula, minúscula, número e caractere especial

## 🐛 Troubleshooting

### Problemas Comuns

1. **Porta 8800 já em uso:**
   ```bash
   sudo lsof -i :8800
   sudo kill -9 <PID>
   ```

2. **Containers não iniciam:**
   ```bash
   docker-compose down -v
   docker-compose up -d --build
   ```

3. **Erro de conexão com banco:**
   ```bash
   docker-compose logs coinage_postgres
   ```

### Logs Detalhados

```bash
# Logs da API
docker-compose logs -f coinage_api

# Logs do banco
docker-compose logs -f coinage_postgres

# Logs de todos os serviços
docker-compose logs -f
```

## 📞 Suporte

Para problemas ou dúvidas, consulte:
- Logs dos containers
- Documentação da API em http://localhost:8800 (Swagger)
- Arquivos de configuração em `backend/env.example` 