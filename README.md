# 🪙 Coinage - Plataforma de Criptomoedas

## 📋 Visão Geral

Coinage é uma plataforma de criptomoedas com **backend dockerizado** e **frontend DashCode** para desenvolvimento local. O projeto usa o template DashCode Next.js premium para uma interface moderna e profissional.

## 🏗️ Arquitetura

```
coinage/
├── frontend/          # DashCode Next.js (desenvolvimento local)
├── backend/           # API Node.js (Docker)
├── docker-compose.yml # Orquestração backend + infraestrutura
└── scripts/          # Scripts de automação
```

## 🚀 Tecnologias

### Frontend (DashCode - Desenvolvimento Local)
- **DashCode Next.js v1.0.2** - Template premium
- **Next.js 14** - Framework React
- **Tailwind CSS** - Estilização avançada
- **Yarn** - Gerenciador de pacotes
- **Hot Reload** - Desenvolvimento em tempo real

### Backend (Docker)
- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **PostgreSQL** - Banco de dados
- **Redis** - Cache e blacklist
- **RabbitMQ** - Filas de mensagens
- **MinIO** - Armazenamento de objetos
- **JWT** - Autenticação

## 🛠️ Instalação e Execução

### Pré-requisitos
- Docker e Docker Compose
- Node.js 18+ (para frontend)
- Yarn (para DashCode)

### 1. Iniciar Backend (Docker)

```bash
# Na pasta raiz do projeto
./scripts/start.sh
# ou
docker-compose up -d
```

### 2. Iniciar Frontend (DashCode)

```bash
cd frontend
yarn install
yarn dev
```

### 3. Acessar Serviços

- **Frontend DashCode**: http://localhost:3000
- **Backend API**: http://localhost:8800
- **RabbitMQ**: http://localhost:15672
- **MinIO**: http://localhost:9001

## 📁 Estrutura do Projeto

### Frontend (`/frontend`) - DashCode
```
frontend/
├── app/              # App Router (Next.js 13+)
├── components/       # Componentes DashCode
├── configs/          # Configurações
├── hooks/            # Custom hooks
├── store/            # State management
├── public/           # Arquivos estáticos
└── package.json      # Dependências DashCode
```

### Backend (`/backend`)
```
backend/
├── src/
│   ├── controllers/   # Controladores da API
│   ├── services/      # Lógica de negócio
│   ├── models/        # Modelos Sequelize
│   ├── routes/        # Rotas da API
│   └── middleware/    # Middlewares
├── Dockerfile         # Containerização
└── env.docker         # Configurações de ambiente
```

## 🚀 Comandos Úteis

### Backend (Docker)
```bash
# Iniciar backend
./scripts/start.sh

# Parar backend
./scripts/stop.sh

# Ver status
./scripts/status.sh

# Ver logs
docker-compose logs -f

# Rebuild
docker-compose up -d --build
```

### Frontend (DashCode)
```bash
# Instalar dependências
cd frontend && yarn install

# Desenvolvimento
cd frontend && yarn dev

# Build
cd frontend && yarn build

# Testes
cd frontend && yarn test
```

## 🔧 Configuração

### Variáveis de Ambiente

#### Frontend (DashCode)
```env
NEXT_PUBLIC_API_URL=http://localhost:8800
```

#### Backend (Docker)
```env
# Database
DB_HOST=postgres
DB_PORT=5432
DB_NAME=coinage_db
DB_USER=coinage_user
DB_PASSWORD=coinage_password

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# RabbitMQ
RABBITMQ_HOST=rabbitmq
RABBITMQ_PORT=5672
RABBITMQ_USER=coinage_user
RABBITMQ_PASSWORD=coinage_password

# MinIO
MINIO_HOST=minio
MINIO_PORT=9000
MINIO_ACCESS_KEY=coinage_access_key
MINIO_SECRET_KEY=coinage_secret_key
```

## 📊 Monitoramento

### Health Checks
- Backend: http://localhost:8800/api/health
- Script: `./scripts/status.sh`

### Dashboards
- RabbitMQ: http://localhost:15672 (coinage_user/coinage_password)
- MinIO: http://localhost:9001 (coinage_access_key/coinage_secret_key)

## 🔄 Desenvolvimento

### Workflow Recomendado
1. **Iniciar backend**: `./scripts/start.sh`
2. **Desenvolvimento frontend**: `cd frontend && yarn dev`
3. **Testes**: `cd frontend && yarn test`
4. **Build**: `cd frontend && yarn build`

### Hot Reload
- Frontend: http://localhost:3000 (DashCode)
- Backend: http://localhost:8800 (Docker)

## 🎯 Próximos Passos

1. **Configurar banco de dados**: Execute as migrações
2. **Criar usuário admin**: Use o endpoint de inicialização
3. **Personalizar DashCode**: Modifique componentes
4. **Adicionar funcionalidades**: Implemente novos endpoints
5. **Configurar CI/CD**: Automatize deploy

## 📝 Notas

- **Frontend**: DashCode Next.js premium template
- **Backend**: Dockerizado para estabilidade
- **Desenvolvimento**: Frontend em tempo real, backend estável
- **Produção**: Ambos podem ser dockerizados

## 🆘 Suporte

- **Documentação**: README.md
- **Logs**: `docker-compose logs -f`
- **Status**: `./scripts/status.sh`

---

**Coinage** - DashCode + Backend Dockerizado 🚀 