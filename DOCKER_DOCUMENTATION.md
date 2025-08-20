# 🐳 DOCUMENTAÇÃO DOCKER - PROJETO COINAGE

## 📋 VISÃO GERAL

O projeto Coinage utiliza uma arquitetura de microserviços containerizada com Docker e Docker Compose, garantindo isolamento, escalabilidade e facilidade de deployment.

---

## 🏗️ ARQUITETURA DOS CONTAINERS

```mermaid
graph TD
    A[Frontend - Next.js] --> B[Backend API - Node.js]
    B --> C[PostgreSQL Database]
    B --> D[Redis Cache]
    B --> E[RabbitMQ Queue]
    F[Workers] --> C
    F --> D
    F --> E
    G[Nginx - Load Balancer] --> A
    G --> B
```

---

## 📦 CONTAINERS E SERVIÇOS

### 1. **PostgreSQL Database** 
```yaml
Imagem: postgres:15-alpine
Container: coinage-postgres
Porta: 5433:5432
Volume: postgres_data:/var/lib/postgresql/data
```

**Funcionalidade:**
- Banco de dados principal do sistema
- Armazena todas as entidades (users, transactions, companies, etc.)
- Backup automático diário
- Otimizado com índices para performance

**Healthcheck:**
```bash
pg_isready -U ${DB_USER}
```

**Configurações importantes:**
- `max_connections = 200`
- `shared_buffers = 256MB`
- `effective_cache_size = 1GB`

---

### 2. **Redis Cache**
```yaml
Imagem: redis:7-alpine
Container: coinage-redis
Porta: 6379:6379
Volume: redis_data:/data
```

**Funcionalidade:**
- Cache de saldos blockchain (TTL: 30s)
- Cache de transações (TTL: 1min)
- Rate limiting por usuário/IP
- Sessões temporárias de processamento

**Configurações:**
- Persistência: `appendonly yes`
- Password protegido
- Memory policy: `allkeys-lru`

**Comandos úteis:**
```bash
# Verificar status
docker exec coinage-redis redis-cli ping

# Monitorar comandos
docker exec coinage-redis redis-cli monitor

# Ver estatísticas
docker exec coinage-redis redis-cli info stats
```

---

### 3. **RabbitMQ Message Queue**
```yaml
Imagem: rabbitmq:3-management-alpine
Container: coinage-rabbitmq
Portas: 5672:5672, 15672:15672
Volume: rabbitmq_data:/var/lib/rabbitmq
```

**Funcionalidade:**
- Fila de transações blockchain
- Processamento assíncrono de depósitos/saques
- Sistema de retry e dead letter queue
- Monitoramento via Management UI

**Filas principais:**
- `blockchain.transactions` - Transações para blockchain
- `deposits.processing` - Processamento de depósitos
- `withdrawals.processing` - Processamento de saques
- `notifications.send` - Envio de notificações

**Management UI:** http://localhost:15672
- User: `${RABBITMQ_USER}`
- Password: `${RABBITMQ_PASSWORD}`

---

### 4. **Backend API**
```yaml
Build: ./backend/Dockerfile
Container: coinage-backend
Porta: 8800:8800
```

**Funcionalidade:**
- API REST principal
- Autenticação JWT
- Integração blockchain
- Processamento de transações
- Sistema white label

**Estrutura:**
```
/backend
├── src/
│   ├── controllers/     # Controladores da API
│   ├── services/        # Lógica de negócio
│   ├── middleware/      # Middlewares Express
│   ├── routes/          # Definição de rotas
│   ├── workers/         # Workers para processamento
│   └── config/          # Configurações
├── prisma/              # Schema e migrações
├── Dockerfile           # Imagem do container
└── package.json         # Dependências Node.js
```

**Dockerfile:**
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Instalar dependências
COPY package*.json ./
RUN npm ci --only=production

# Copiar código fonte
COPY . .

# Gerar Prisma Client
RUN npx prisma generate

# Expor porta
EXPOSE 8800

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8800/health || exit 1

# Comando de inicialização
CMD ["npm", "start"]
```

---

### 5. **Workers (Background Processing)**
```yaml
Build: ./backend/Dockerfile.worker
Container: coinage-workers
```

**Funcionalidade:**
- Processamento assíncrono de transações
- Monitoramento de pagamentos PIX
- Atualização de status blockchain
- Envio de notificações

**Workers implementados:**
- `deposit.worker.js` - Processamento de depósitos
- `withdraw.worker.js` - Processamento de saques (pending)
- `blockchain.worker.js` - Transações blockchain (pending)
- `notification.worker.js` - Envio de emails (pending)

**Dockerfile.worker:**
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npx prisma generate

# Comando para workers
CMD ["node", "src/workers/index.js"]
```

---

### 6. **Frontend (Next.js)**
```yaml
Build: ./frontend/Dockerfile
Container: coinage-frontend
Porta: 3000:3000
```

**Funcionalidade:**
- Interface do usuário
- Dashboard responsivo
- Sistema white label
- PWA (Progressive Web App)

**Estrutura:**
```
/frontend
├── app/                 # Pages (App Router)
├── components/          # Componentes React
├── public/             # Assets estáticos
├── styles/             # Estilos CSS/SCSS
├── hooks/              # Custom hooks
├── store/              # Estado (Zustand)
└── services/           # Integração com API
```

---

## 🚀 DOCKER COMPOSE

### **Arquivo Principal: docker-compose.yml**

```yaml
version: '3.8'

services:
  # Banco de dados
  postgres:
    image: postgres:15-alpine
    container_name: coinage-postgres
    environment:
      POSTGRES_DB: coinage
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_INITDB_ARGS: "--encoding=UTF8 --locale=C"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend/sql/init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5433:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped
    networks:
      - coinage-network

  # Cache Redis
  redis:
    image: redis:7-alpine
    container_name: coinage-redis
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "--no-auth-warning", "-a", "${REDIS_PASSWORD}", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped
    networks:
      - coinage-network

  # Message Queue
  rabbitmq:
    image: rabbitmq:3-management-alpine
    container_name: coinage-rabbitmq
    environment:
      RABBITMQ_DEFAULT_USER: ${RABBITMQ_USER}
      RABBITMQ_DEFAULT_PASS: ${RABBITMQ_PASSWORD}
      RABBITMQ_SERVER_ADDITIONAL_ERL_ARGS: -rabbit log_levels [{connection,error},{default,error}]
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq
      - ./backend/config/rabbitmq.conf:/etc/rabbitmq/rabbitmq.conf
    ports:
      - "5672:5672"   # AMQP
      - "15672:15672" # Management UI
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped
    networks:
      - coinage-network

  # API Backend
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: coinage-backend
    environment:
      NODE_ENV: ${NODE_ENV:-development}
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/coinage
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
      RABBITMQ_URL: amqp://${RABBITMQ_USER}:${RABBITMQ_PASSWORD}@rabbitmq:5672
      PORT: 8800
    volumes:
      - ./backend:/app
      - /app/node_modules
      - ./uploads:/app/uploads
    ports:
      - "8800:8800"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      rabbitmq:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - coinage-network

  # Background Workers
  workers:
    build:
      context: ./backend
      dockerfile: Dockerfile.worker
    container_name: coinage-workers
    environment:
      NODE_ENV: ${NODE_ENV:-development}
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/coinage
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
      RABBITMQ_URL: amqp://${RABBITMQ_USER}:${RABBITMQ_PASSWORD}@rabbitmq:5672
    volumes:
      - ./backend:/app
      - /app/node_modules
    depends_on:
      - backend
    restart: unless-stopped
    networks:
      - coinage-network

  # Frontend
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: coinage-frontend
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:8800
      NEXT_PUBLIC_WS_URL: ws://localhost:8800
    volumes:
      - ./frontend:/app
      - /app/node_modules
      - /app/.next
    ports:
      - "3000:3000"
    depends_on:
      - backend
    restart: unless-stopped
    networks:
      - coinage-network

networks:
  coinage-network:
    driver: bridge

volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local
  rabbitmq_data:
    driver: local
```

---

## 📋 MAKEFILE - COMANDOS DE AUTOMAÇÃO

```makefile
# Makefile para automatização do projeto Coinage
include .env

# Cores para output
GREEN=\033[0;32m
YELLOW=\033[1;33m
RED=\033[0;31m
NC=\033[0m # No Color

.PHONY: help up down logs clean build restart migrate generate seed status health

# Ajuda - comando padrão
help:
	@echo "$(GREEN)Coinage - Comandos Disponíveis:$(NC)"
	@echo ""
	@echo "$(YELLOW)🚀 Containers:$(NC)"
	@echo "  make up      - Iniciar todos os containers"
	@echo "  make down    - Parar todos os containers"
	@echo "  make restart - Reiniciar todos os containers"
	@echo "  make build   - Rebuildar imagens"
	@echo "  make clean   - Limpar volumes e imagens"
	@echo ""
	@echo "$(YELLOW)📊 Monitoramento:$(NC)"
	@echo "  make logs    - Ver logs de todos os containers"
	@echo "  make status  - Status dos containers"
	@echo "  make health  - Healthcheck de todos os serviços"
	@echo ""
	@echo "$(YELLOW)💾 Database:$(NC)"
	@echo "  make migrate - Executar migrações Prisma"
	@echo "  make generate- Gerar Prisma Client"
	@echo "  make seed    - Popular banco com dados de teste"
	@echo "  make backup  - Backup do banco de dados"
	@echo "  make restore - Restaurar backup do banco"
	@echo ""
	@echo "$(YELLOW)🔧 Desenvolvimento:$(NC)"
	@echo "  make dev     - Modo desenvolvimento (hot reload)"
	@echo "  make prod    - Modo produção"
	@echo "  make test    - Executar testes"

# Iniciar containers
up:
	@echo "$(GREEN)🚀 Iniciando containers...$(NC)"
	docker-compose up -d
	@echo "$(GREEN)✅ Containers iniciados!$(NC)"
	@echo "$(YELLOW)📊 Dashboard: http://localhost:3000$(NC)"
	@echo "$(YELLOW)🔧 API: http://localhost:8800$(NC)"
	@echo "$(YELLOW)🐰 RabbitMQ: http://localhost:15672$(NC)"

# Parar containers
down:
	@echo "$(YELLOW)⏹️  Parando containers...$(NC)"
	docker-compose down
	@echo "$(GREEN)✅ Containers parados!$(NC)"

# Logs
logs:
	docker-compose logs -f --tail=100

# Status
status:
	@echo "$(GREEN)📊 Status dos Containers:$(NC)"
	docker-compose ps

# Health check
health:
	@echo "$(GREEN)🏥 Verificando saúde dos serviços...$(NC)"
	@docker exec coinage-postgres pg_isready -U $(DB_USER) && echo "✅ PostgreSQL OK" || echo "❌ PostgreSQL FAIL"
	@docker exec coinage-redis redis-cli --no-auth-warning -a $(REDIS_PASSWORD) ping > /dev/null && echo "✅ Redis OK" || echo "❌ Redis FAIL"
	@docker exec coinage-rabbitmq rabbitmq-diagnostics ping > /dev/null && echo "✅ RabbitMQ OK" || echo "❌ RabbitMQ FAIL"
	@curl -f http://localhost:8800/health > /dev/null 2>&1 && echo "✅ Backend OK" || echo "❌ Backend FAIL"
	@curl -f http://localhost:3000 > /dev/null 2>&1 && echo "✅ Frontend OK" || echo "❌ Frontend FAIL"

# Rebuild imagens
build:
	@echo "$(GREEN)🔨 Rebuilding containers...$(NC)"
	docker-compose build --no-cache

# Reiniciar
restart: down up

# Limpeza completa
clean:
	@echo "$(RED)🧹 Limpando volumes e imagens...$(NC)"
	docker-compose down -v
	docker system prune -a -f
	@echo "$(GREEN)✅ Limpeza concluída!$(NC)"

# Migrações Prisma
migrate:
	@echo "$(GREEN)📦 Executando migrações Prisma...$(NC)"
	docker exec coinage-backend npx prisma migrate dev

# Gerar Prisma Client
generate:
	@echo "$(GREEN)⚙️  Gerando Prisma Client...$(NC)"
	docker exec coinage-backend npx prisma generate

# Popular banco
seed:
	@echo "$(GREEN)🌱 Populando banco de dados...$(NC)"
	docker exec coinage-backend npm run seed

# Backup
backup:
	@echo "$(GREEN)💾 Criando backup...$(NC)"
	docker exec coinage-postgres pg_dump -U $(DB_USER) coinage > backup_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "$(GREEN)✅ Backup criado!$(NC)"

# Restore
restore:
	@read -p "Nome do arquivo de backup: " backup_file; \
	docker exec -i coinage-postgres psql -U $(DB_USER) coinage < $$backup_file

# Desenvolvimento
dev:
	@echo "$(GREEN)🚀 Modo desenvolvimento...$(NC)"
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Produção
prod:
	@echo "$(GREEN)🚀 Modo produção...$(NC)"
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Testes
test:
	@echo "$(GREEN)🧪 Executando testes...$(NC)"
	docker exec coinage-backend npm test
```

---

## 🔧 CONFIGURAÇÕES DE AMBIENTE

### **Arquivo .env**
```bash
# === CONFIGURAÇÕES GERAIS ===
NODE_ENV=development
API_PORT=8800
FRONTEND_PORT=3000

# === BANCO DE DADOS ===
DB_HOST=localhost
DB_PORT=5433
DB_USER=coinage_user
DB_PASSWORD=coinage_secure_password_123
DB_NAME=coinage
DATABASE_URL=postgresql://coinage_user:coinage_secure_password_123@localhost:5433/coinage

# === REDIS ===
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis_secure_password_123
REDIS_URL=redis://:redis_secure_password_123@localhost:6379

# === RABBITMQ ===
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USER=coinage_queue
RABBITMQ_PASSWORD=queue_secure_password_123
RABBITMQ_URL=amqp://coinage_queue:queue_secure_password_123@localhost:5672

# === BLOCKCHAIN ===
MAINNET_RPC_URL=https://rpc-mainnet.azore.technology
TESTNET_RPC_URL=https://rpc-testnet.azore.technology
MAINNET_CHAIN_ID=8800
TESTNET_CHAIN_ID=88001
DEFAULT_NETWORK=testnet

# === AUTENTICAÇÃO ===
JWT_SECRET=coinage_jwt_secret_very_secure_min_32_chars_123456789
JWT_REFRESH_SECRET=coinage_refresh_secret_very_secure_min_32_chars_123456789
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
ENCRYPTION_KEY=coinage_encryption_key_32_chars_123

# === ADMIN PADRÃO ===
DEFAULT_ADMIN_EMAIL=ivan.alberton@navi.inf.br
DEFAULT_ADMIN_PASSWORD=N@vi@2025
```

---

## 📊 MONITORAMENTO E LOGS

### **Estrutura de Logs**
```
/logs
├── backend/
│   ├── app.log          # Logs da aplicação
│   ├── error.log        # Logs de erro
│   ├── access.log       # Logs de acesso
│   └── blockchain.log   # Logs blockchain
├── postgres/
│   └── postgresql.log   # Logs do PostgreSQL
├── redis/
│   └── redis.log        # Logs do Redis
└── rabbitmq/
    ├── rabbit.log       # Logs RabbitMQ
    └── rabbit_sasl.log  # Logs SASL
```

### **Comandos de Monitoramento**
```bash
# Ver logs em tempo real
make logs

# Logs específicos por container
docker logs -f coinage-backend
docker logs -f coinage-postgres
docker logs -f coinage-redis
docker logs -f coinage-rabbitmq

# Métricas dos containers
docker stats

# Espaço em disco usado
docker system df

# Processos em execução
docker exec coinage-backend ps aux
```

---

## 🚨 TROUBLESHOOTING

### **Problemas Comuns**

#### 1. **Container não inicia**
```bash
# Verificar logs
docker logs coinage-backend

# Verificar se portas estão ocupadas
netstat -tulpn | grep :8800

# Rebuildar container
docker-compose build backend --no-cache
```

#### 2. **Banco de dados não conecta**
```bash
# Verificar se PostgreSQL está rodando
docker exec coinage-postgres pg_isready -U coinage_user

# Verificar logs do banco
docker logs coinage-postgres

# Conectar manualmente
docker exec -it coinage-postgres psql -U coinage_user -d coinage
```

#### 3. **Redis não conecta**
```bash
# Testar conexão
docker exec coinage-redis redis-cli -a redis_password ping

# Verificar configurações
docker exec coinage-redis redis-cli CONFIG GET "*"
```

#### 4. **RabbitMQ com problemas**
```bash
# Status das filas
docker exec coinage-rabbitmq rabbitmqctl list_queues

# Reset completo do RabbitMQ
docker-compose stop rabbitmq
docker volume rm coinage_rabbitmq_data
docker-compose up -d rabbitmq
```

#### 5. **Performance lenta**
```bash
# Verificar uso de recursos
docker stats

# Limpar logs antigos
docker system prune -f

# Otimizar banco
docker exec coinage-postgres psql -U coinage_user -d coinage -c "VACUUM ANALYZE;"
```

---

## 🔒 SEGURANÇA

### **Checklist de Segurança**
- [ ] Senhas com mínimo 16 caracteres
- [ ] Volumes com permissões restritas
- [ ] Containers não executam como root
- [ ] Portas expostas apenas as necessárias
- [ ] Secrets em arquivos separados
- [ ] Logs não contêm informações sensíveis
- [ ] Backup automático configurado
- [ ] SSL/TLS em produção

### **Hardening Docker**
```dockerfile
# Usar usuário não-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
USER nextjs

# Limitar recursos
deploy:
  resources:
    limits:
      cpus: '0.50'
      memory: 512M

# Security options
security_opt:
  - no-new-privileges:true
cap_drop:
  - ALL
```

---

## 📈 PERFORMANCE

### **Otimizações Aplicadas**

#### **PostgreSQL**
- Connection pooling configurado
- Índices otimizados para queries frequentes
- Vacuum automático habilitado
- Shared buffers = 25% da RAM

#### **Redis**
- Política de eviction: `allkeys-lru`
- Persistência: `appendonly yes`
- Compressão habilitada

#### **RabbitMQ**
- Lazy queues para reduzir uso de RAM
- TTL configurado para mensagens
- Dead letter queues para retry logic

#### **Docker**
- Multi-stage builds para reduzir tamanho
- `.dockerignore` para excluir arquivos desnecessários
- Health checks implementados
- Resource limits definidos

---

## 🚀 DEPLOYMENT

### **Produção**
```bash
# Build para produção
docker-compose -f docker-compose.prod.yml build

# Deploy
docker-compose -f docker-compose.prod.yml up -d

# Verificar status
make health
```

### **Staging**
```bash
# Deploy em staging
docker-compose -f docker-compose.staging.yml up -d
```

---

*Documentação atualizada em: 2025-08-19*
*Versão: 1.0*