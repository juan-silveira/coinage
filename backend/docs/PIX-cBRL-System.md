# Sistema PIX + cBRL - Coinage

## Visão Geral

O sistema PIX + cBRL integra pagamentos PIX com o token cBRL (Brazilian Real) na blockchain Azore, permitindo:

- **Depósitos**: PIX → cBRL (mint tokens)
- **Saques**: cBRL → PIX (burn tokens)
- **Processamento assíncrono** via RabbitMQ
- **Mock completo** para desenvolvimento e testes

## Arquitetura

```
PIX Payment → Queue → Worker → Blockchain → Notification
     ↓            ↓        ↓         ↓           ↓
  Cobrança    RabbitMQ  Deposit  Mint cBRL    Email
     ↓            ↓     Worker      ↓           ↓
  Status       Dead      ↓      Success/    Webhook
             Letter    Process   Failure
             Queue
```

## Fluxo de Depósito

1. **Usuário solicita depósito**
   - POST `/api/pix/deposit/create`
   - Gera cobrança PIX (QR Code)
   - Status: `waiting_payment`

2. **Usuário paga PIX**
   - Mock: aprovação automática após 10s
   - Real: webhook do provedor PIX

3. **Worker processa**
   - Verifica status PIX
   - Minta tokens cBRL
   - Atualiza logs do usuário
   - Envia notificação

4. **Resultado**
   - Tokens cBRL na carteira do usuário
   - Email de confirmação
   - Webhook (se configurado)

## Fluxo de Saque

1. **Usuário solicita saque**
   - POST `/api/pix/withdrawal/create`
   - Valida saldo cBRL
   - Valida chave PIX

2. **Worker processa**
   - Queima tokens cBRL
   - Processa PIX
   - Se PIX falhar: reverte burn

3. **Resultado**
   - PIX enviado
   - Tokens queimados
   - Notificações enviadas

## Configuração

### Variáveis de Ambiente

```bash
# Blockchain Azore
BLOCKCHAIN_NETWORK="testnet"
AZORE_TESTNET_RPC_URL="https://testnet-rpc.azore.com"
BLOCKCHAIN_PRIVATE_KEY="0x..."
CBRL_CONTRACT_ADDRESS="0x..."

# PIX (Mock/Real)
PIX_PROVIDER="mock"  # ou "efipay", "pagarme", "asaas"
PIX_API_URL="https://api-pix.example.com"
PIX_API_KEY="your-api-key"

# RabbitMQ
RABBITMQ_URL="amqp://localhost:5672"

# Email
EMAIL_PROVIDER="mock"  # ou "mandrill", "mailersend"
EMAIL_API_KEY="your-email-key"
```

### Contrato cBRL

O token cBRL deve implementar:

```solidity
interface ICBRL {
    function mint(address to, uint256 amount) external;
    function burnFrom(address from, uint256 amount) external;
    function hasRole(bytes32 role, address account) external view returns (bool);
}
```

## API Endpoints

### Depósitos

```http
# Criar cobrança PIX
POST /api/pix/deposit/create
{
  "amount": 100.00,
  "blockchainAddress": "0x...",
  "description": "Depósito cBRL"
}

# Verificar status
GET /api/pix/deposit/{paymentId}/status

# Forçar processamento (admin)
POST /api/pix/deposit/{paymentId}/process
```

### Saques

```http
# Criar saque PIX
POST /api/pix/withdrawal/create
{
  "amount": 50.00,
  "pixKey": "teste@email.com",
  "blockchainAddress": "0x..."
}
```

### Utilitários

```http
# Verificar saldo
GET /api/pix/balance/{address}

# Info do token
GET /api/pix/token/info

# Health check
GET /api/pix/health

# Validar chave PIX
POST /api/pix/validate-key
```

## Workers

### Executar Individualmente

```bash
# Depósitos
node src/workers/deposit.worker.js

# Saques
node src/workers/withdraw.worker.js

# Blockchain
node src/workers/blockchain.worker.js

# Notificações
node src/workers/notification.worker.js
```

### Executar Todos

```bash
# Usando worker manager
node src/workers/index.js

# Usando Docker
docker-compose -f docker-compose.workers.yml up
```

## Desenvolvimento

### Setup Testnet

1. **Copie configuração**
   ```bash
   cp .env.testnet.example .env.testnet
   ```

2. **Configure wallet**
   - Gere wallet: `node -e "console.log(require('ethers').Wallet.createRandom().privateKey)"`
   - Adicione fundos na testnet Azore
   - Configure `BLOCKCHAIN_PRIVATE_KEY`

3. **Deploy contrato cBRL**
   - Deploy na testnet Azore
   - Configure `CBRL_CONTRACT_ADDRESS`
   - Conceda `MINTER_ROLE` ao wallet

### Testes

```bash
# Teste completo do fluxo
node scripts/test-pix-flow.js

# Testes unitários
npm test

# Health check
curl http://localhost:3000/api/pix/health
```

## Monitoramento

### Workers

```bash
# Status dos workers
curl -H "Authorization: Bearer token" \
  http://localhost:3000/api/workers/status

# Estatísticas das filas
curl -H "Authorization: Bearer token" \
  http://localhost:3000/api/workers/queues/stats

# Reiniciar worker
curl -X POST -H "Authorization: Bearer token" \
  http://localhost:3000/api/workers/blockchain/restart
```

### Logs

- **Workers**: Console logs com emojis
- **UserActions**: Todas as operações logadas
- **Webhooks**: Status de entrega
- **Emails**: Status de envio

## Provedores PIX

### Mock (Desenvolvimento)

- Aprovação automática após 10s
- Taxa de sucesso: 95%
- Sem integração externa

### EfiPay (ex-Gerencianet)

```javascript
// TODO: Implementar em pix.service.js
async createEfiPayCharge(chargeData) {
  // OAuth2 + API calls
}
```

### Pagar.me

```javascript
// TODO: Implementar em pix.service.js
async createPagarMeCharge(chargeData) {
  // API integration
}
```

### Asaas

```javascript
// TODO: Implementar em pix.service.js
async createAsaasCharge(chargeData) {
  // API integration
}
```

## Segurança

### Validações

- ✅ Endereços blockchain válidos
- ✅ Chaves PIX válidas
- ✅ Valores mínimos/máximos
- ✅ Verificação de saldo
- ✅ Rate limiting

### Auditoria

- ✅ Todas as operações logadas
- ✅ UserActions para timeline
- ✅ Metadata completa
- ✅ Reversão em caso de falha

### Permissões

- ✅ JWT authentication
- ✅ Role-based access
- ✅ Admin endpoints protegidos
- ✅ MINTER_ROLE no contrato

## Produção

### Checklist de Deploy

- [ ] Configurar provedor PIX real
- [ ] Deploy contrato cBRL na mainnet
- [ ] Configurar email provider
- [ ] Setup workers em produção
- [ ] Configurar monitoramento
- [ ] Testar com valores pequenos
- [ ] Configurar alertas
- [ ] Backup das chaves privadas

### Limites Recomendados

```env
MIN_DEPOSIT_AMOUNT=1.00
MIN_WITHDRAWAL_AMOUNT=10.00
MAX_DEPOSIT_AMOUNT=50000.00
MAX_WITHDRAWAL_AMOUNT=50000.00
PIX_WITHDRAWAL_FEE=2.50
```

### Monitoramento Crítico

- Workers ativos
- Filas RabbitMQ
- Saldo do wallet minter
- Status da blockchain
- Taxa de sucesso PIX
- Tempo de processamento

## Troubleshooting

### Worker não processa

```bash
# Verificar filas
curl localhost:3000/api/workers/queues/stats

# Reiniciar worker
curl -X POST localhost:3000/api/workers/deposit/restart

# Purgar fila
curl -X DELETE localhost:3000/api/workers/queues/deposits.processing/purge
```

### PIX não aprova

- Verificar provider configurado
- Verificar webhook recebido
- Verificar logs do worker
- Forçar processamento (admin)

### Blockchain falha

- Verificar RPC URL
- Verificar saldo do wallet
- Verificar gas price
- Verificar MINTER_ROLE

### Email não envia

- Verificar provider configurado
- Verificar API key
- Verificar templates
- Verificar worker notification

## Roadmap

- [ ] Integração PIX real (EfiPay/Pagar.me)
- [ ] Templates de email personalizados
- [ ] Dashboard de monitoramento
- [ ] API de reconciliação
- [ ] Multi-token support
- [ ] Staking integration
- [ ] Mobile SDKs

## Suporte

- **Documentação**: `/docs`
- **Health Check**: `/api/pix/health`
- **Worker Status**: `/api/workers/status`
- **Logs**: Console + UserActions
- **Issues**: GitHub Issues