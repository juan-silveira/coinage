# Projeto Coinage

Sistema de gestão financeira com blockchain integration e funcionalidades de PIX.

## 🚀 Instalação Local

### Pré-requisitos
- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- RabbitMQ 3.8+

### 1. Clonar e Instalar
```bash
git clone [REPO_URL]
cd coinage
make install
```

### 2. Configurar Ambiente
```bash
# Copiar e configurar variáveis
cp .env.example .env
# Editar .env com suas configurações
```

### 3. Configurar Serviços Locais
```bash
# Instalar PostgreSQL, Redis, RabbitMQ
sudo apt update
sudo apt install postgresql redis-server rabbitmq-server

# Configurar banco
sudo -u postgres createdb [DATABASE_NAME]
sudo -u postgres createuser [USERNAME] -P
```

### 4. Executar Migrations e Seed
```bash
make generate  # Gerar cliente Prisma
make migrate   # Executar migrations
make seed      # Popular banco com dados iniciais
```

### 5. Iniciar Projeto
```bash
make run
```

## 🔗 URLs de Acesso
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8800
- **Health Check**: http://localhost:8800/health

## 📋 Comandos Úteis
```bash
make help          # Ver todos comandos
make run           # Iniciar projeto completo
make run-backend   # Apenas backend
make run-frontend  # Apenas frontend
make build         # Build para produção
make clean         # Limpar node_modules
make services-start    # Iniciar serviços locais
make services-stop     # Parar serviços locais
make services-status   # Ver status dos serviços
```

## 🔐 Login Padrão
Configure no .env:
- Email: ADMIN_EMAIL
- Senha: ADMIN_PASSWORD

## 📁 Estrutura do Projeto
```
coinage/
├── backend/           # API Node.js
│   ├── src/          # Código fonte
│   ├── prisma/       # Schema e migrations
│   ├── scripts/      # Scripts utilitários
│   └── package.json
├── frontend/          # Next.js App
│   ├── app/          # Next.js pages
│   ├── components/   # Componentes React
│   ├── services/     # Services
│   └── package.json
├── archive/           # Arquivos históricos
├── Makefile          # Comandos de automação
├── .env              # Configuração local (criar a partir do .env.example)
├── .env.example      # Template de configuração
└── README.md         # Este arquivo
```

## 🔧 Scripts Disponíveis

### Backend Scripts
```bash
cd backend/scripts

# Seed básico do sistema
node seed-basic-data.js

# Gerar JWT para testes
node generate-jwt.js

# Ver chaves da API
node get-api-keys.js

# Configurar taxas de usuário
node add-user-taxes.js

# Padronizar transações
node standardize-transactions.js

# Seed de tipos de contrato
node seed-contract-types.js
```

## 🐛 Troubleshooting

### Problemas Comuns
- **Porta em uso**: `make services-stop && make services-start`
- **Banco vazio**: `make seed`
- **Dependências**: `make clean && make install`
- **Prisma desatualizado**: `cd backend && npx prisma generate`

### Logs
- Backend: `backend/logs/`
- Para debug: altere `LOG_LEVEL=debug` no .env

### Reset Completo
```bash
# Limpar tudo e recomeçar
make clean
make install
make generate
make migrate
make seed
make run
```

## 🔒 Segurança

### Variáveis Sensíveis
- Sempre use `.env` para dados sensíveis
- Nunca commite `.env` no git
- Use senhas fortes para JWT_SECRET
- Configure ADMIN_PASSWORD seguro

### Banco de Dados
- Use usuário específico para a aplicação
- Configure backup automático
- Monitore logs de acesso

## 📈 Performance

### Monitoramento
- Health check: `curl http://localhost:8800/health`
- Status dos serviços: `make services-status`
- Logs em tempo real: `tail -f backend/logs/app.log`

### Otimização
- Redis para cache
- Connection pooling configurado
- Logs estruturados

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch: `git checkout -b feature/nova-funcionalidade`
3. Commit: `git commit -m 'Add nova funcionalidade'`
4. Push: `git push origin feature/nova-funcionalidade`
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença [ESPECIFICAR LICENÇA].

---

**Desenvolvido com ❤️ pela equipe Coinage**