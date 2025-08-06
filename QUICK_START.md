# 🚀 Guia de Início Rápido - Coinage

## ⚡ Início Super Rápido

### 1. Iniciar Backend
```bash
# Na pasta raiz do projeto
make start
# ou
./scripts/start.sh
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

## 🛠️ Comandos Principais

### Backend (Docker)
```bash
# Iniciar backend
make start
# ou
docker-compose up -d

# Parar backend
make stop
# ou
docker-compose down

# Ver status
make status

# Ver logs
make logs
```

### Frontend (DashCode)
```bash
# Instalar dependências
make install

# Desenvolvimento
make frontend
# ou
cd frontend && yarn dev

# Testes
make test
```

### Desenvolvimento Completo
```bash
# Inicia backend e frontend
make dev
# ou
make full-dev
```

## 📁 Estrutura do Projeto

```
coinage/
├── frontend/              # DashCode Next.js (desenvolvimento local)
│   ├── app/
│   ├── components/
│   ├── configs/
│   ├── hooks/
│   ├── store/
│   ├── package.json
│   └── ...
├── backend/               # API Node.js (Docker)
│   ├── src/
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── env.docker
├── scripts/               # Scripts de automação
│   ├── start.sh
│   ├── stop.sh
│   └── status.sh
├── docker-compose.yml     # Orquestração backend
├── Makefile              # Comandos de conveniência
└── README.md             # Documentação completa
```

## 🔧 Configuração

### Variáveis de Ambiente
O projeto já vem configurado para Docker. Para desenvolvimento local:

1. **Backend**: Configurado via `env.docker`
2. **Frontend**: Configure `NEXT_PUBLIC_API_URL` no `.env.local` se necessário

### Portas Utilizadas
- **3000**: Frontend DashCode (desenvolvimento local)
- **8800**: Backend API
- **5432**: PostgreSQL
- **6379**: Redis
- **15672**: RabbitMQ Management
- **9000**: MinIO API
- **9001**: MinIO Console

## 🚨 Solução de Problemas

### Backend não inicia
```bash
# Verificar Docker
docker --version
docker-compose --version

# Limpar e reiniciar
make clean
make start
```

### Frontend não inicia
```bash
# Verificar Node.js e Yarn
node --version
yarn --version

# Reinstalar dependências
cd frontend
rm -rf node_modules yarn.lock
yarn install
```

### Portas ocupadas
```bash
# Verificar portas em uso
netstat -tulpn | grep :8800
netstat -tulpn | grep :3000

# Parar serviços conflitantes
sudo systemctl stop <service-name>
```

## 📊 Monitoramento

### Health Checks
```bash
# Verificar saúde
make health

# Logs em tempo real
make logs

# Status dos containers
docker-compose ps
```

### Dashboards
- **RabbitMQ**: http://localhost:15672 (coinage_user/coinage_password)
- **MinIO**: http://localhost:9001 (coinage_access_key/coinage_secret_key)

## 🔄 Desenvolvimento

### Workflow Recomendado
1. **Iniciar backend**: `make start`
2. **Desenvolvimento frontend**: `make frontend`
3. **Testes**: `make test`
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

## 📞 Suporte

- **Documentação**: README.md
- **Logs**: `make logs`
- **Status**: `make status`

---

**🎉 Pronto! Coinage com DashCode está rodando e pronto para desenvolvimento!** 