# Documentação - Coinage Backend

Bem-vindo à documentação completa do sistema Coinage Backend.

## 📚 Documentos Disponíveis

### 🌟 Sistema Principal
- **[PIX + cBRL System](./PIX-cBRL-System.md)** - Documentação completa do sistema PIX integrado com token cBRL na blockchain Azore

### ⚙️ Configuração
- **[.env.testnet.example](./.env.testnet.example)** - Exemplo de configuração para ambiente de testnet

## 🏗️ Arquitetura do Sistema

O Coinage Backend é um sistema completo para operações financeiras com blockchain, incluindo:

### Componentes Principais

1. **API REST** - Express.js com JWT authentication
2. **Blockchain Integration** - ethers.js para Azore Network
3. **PIX Integration** - Pagamentos brasileiros com providers
4. **Queue System** - RabbitMQ para processamento assíncrono
5. **Database** - PostgreSQL com Prisma ORM
6. **Cache** - Redis para performance
7. **Workers** - Processamento em background

### Tecnologias

- **Backend**: Node.js, Express.js, Prisma
- **Blockchain**: ethers.js, Azore Network
- **Database**: PostgreSQL
- **Cache**: Redis
- **Queue**: RabbitMQ
- **Payments**: PIX (Mock/Real providers)
- **Email**: Mandrill/MailerSend
- **Containers**: Docker & Docker Compose

## 🚀 Início Rápido

### Desenvolvimento

```bash
# 1. Instalar dependências
npm install

# 2. Configurar ambiente
cp docs/.env.testnet.example .env

# 3. Subir dependências
docker-compose up -d postgres redis rabbitmq

# 4. Executar migrations
npx prisma migrate dev

# 5. Iniciar servidor
npm run dev

# 6. Iniciar workers (opcional)
node src/workers/index.js
```

### Testnet

```bash
# 1. Configurar para testnet
cp docs/.env.testnet.example .env.testnet

# 2. Editar variáveis de blockchain
# - BLOCKCHAIN_PRIVATE_KEY
# - CBRL_CONTRACT_ADDRESS
# - AZORE_TESTNET_RPC_URL

# 3. Testar fluxo completo
node scripts/test-pix-flow.js
```

## 🔧 Endpoints Principais

### Autenticação
- `POST /api/auth/login` - Login de usuário
- `POST /api/auth/register` - Registro de usuário
- `POST /api/auth/refresh` - Renovar token

### PIX + cBRL
- `POST /api/pix/deposit/create` - Criar depósito PIX
- `POST /api/pix/withdrawal/create` - Criar saque PIX
- `GET /api/pix/balance/:address` - Verificar saldo cBRL
- `GET /api/pix/health` - Health check

### Workers (Admin)
- `GET /api/workers/status` - Status dos workers
- `GET /api/workers/health` - Health check completo
- `POST /api/workers/:worker/restart` - Reiniciar worker

### Blockchain
- `POST /api/contracts/deploy` - Deploy de contrato
- `POST /api/tokens/transfer` - Transfer de tokens
- `GET /api/transactions/:id` - Verificar transação

## 📋 Monitoramento

### Health Checks
- **API**: `GET /health`
- **PIX System**: `GET /api/pix/health`
- **Workers**: `GET /api/workers/health`
- **Database**: Incluído no health check geral

### Logs
- **Console**: Logs estruturados com emojis
- **UserActions**: Timeline de ações dos usuários
- **Database**: Logs de transações e operações

### Métricas
- Status das filas RabbitMQ
- Performance da blockchain
- Taxa de sucesso PIX
- Tempo de processamento

## 🛠️ Desenvolvimento

### Estrutura do Projeto

```
backend/
├── src/
│   ├── controllers/     # Controladores da API
│   ├── services/        # Lógica de negócio
│   ├── routes/         # Definição das rotas
│   ├── middleware/     # Middlewares personalizados
│   ├── workers/        # Workers para filas
│   ├── contracts/      # ABIs e contratos
│   └── config/         # Configurações
├── docs/              # Documentação
├── scripts/           # Scripts utilitários
└── prisma/           # Schema e migrations
```

### Scripts Úteis

```bash
# Desenvolvimento
npm run dev              # Servidor com hot reload
npm run worker:dev       # Workers com hot reload

# Produção
npm start               # Servidor produção
npm run worker:start    # Todos os workers

# Workers individuais
npm run worker:blockchain   # Worker blockchain
npm run worker:deposit     # Worker depósitos
npm run worker:withdraw    # Worker saques
npm run worker:notification # Worker notificações

# Testes
npm test                   # Testes unitários
node scripts/test-pix-flow.js  # Teste fluxo PIX

# Database
npx prisma migrate dev     # Rodar migrations
npx prisma studio         # Interface do banco
npx prisma generate       # Gerar cliente
```

## 🔒 Segurança

### Autenticação
- JWT tokens com refresh
- Bcrypt para senhas
- Rate limiting por IP
- Role-based access control

### Blockchain
- Private keys em variáveis de ambiente
- Validação de endereços
- Gas limit protection
- Nonce management

### PIX
- Webhook signature validation
- Chave PIX masking em logs
- Reversão automática em falhas
- Auditoria completa

## 🚨 Troubleshooting

### Problemas Comuns

1. **Worker não processa filas**
   - Verificar conexão RabbitMQ
   - Verificar permissões
   - Reiniciar worker específico

2. **PIX não aprova**
   - Verificar provider configurado
   - Verificar webhook recebido
   - Forçar processamento (admin)

3. **Blockchain falha**
   - Verificar RPC URL ativa
   - Verificar saldo do wallet
   - Verificar gas price

4. **Email não envia**
   - Verificar provider configurado
   - Verificar templates
   - Verificar worker notification

### Comandos de Debug

```bash
# Verificar filas RabbitMQ
curl localhost:3000/api/workers/queues/stats

# Reiniciar worker específico
curl -X POST localhost:3000/api/workers/deposit/restart

# Purgar fila com problemas
curl -X DELETE localhost:3000/api/workers/queues/deposits.processing/purge

# Health check completo
curl localhost:3000/api/pix/health
```

## 📞 Suporte

- **Documentação**: Esta pasta `/docs`
- **Health Checks**: `/health`, `/api/pix/health`, `/api/workers/health`
- **Logs**: Console + UserActions
- **Monitoring**: Workers status + Queue stats

## 🗺️ Roadmap

- [ ] **PIX Real Integration** - EfiPay, Pagar.me, Asaas
- [ ] **Email Templates** - Personalizados por empresa
- [ ] **Dashboard Admin** - Monitoramento em tempo real
- [ ] **API Reconciliation** - Relatórios financeiros
- [ ] **Multi-token Support** - Outros tokens além de cBRL
- [ ] **Mobile SDKs** - React Native, Flutter
- [ ] **Staking Integration** - Yield farming
- [ ] **DeFi Protocols** - Lending, DEX integration

---

💡 **Dica**: Sempre execute `node scripts/test-pix-flow.js` após alterações para validar o fluxo completo.