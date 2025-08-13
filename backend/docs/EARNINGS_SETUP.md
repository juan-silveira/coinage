# Sistema de Earnings (Proventos)

Este documento descreve como configurar e usar o sistema de earnings (proventos) no backend da aplicação Coinage.

## 📋 Visão Geral

O sistema de earnings permite rastrear e gerenciar os proventos distribuídos aos usuários em diferentes tokens. Cada earning registra:

- **ID único** do provento
- **Usuário** que recebeu o provento
- **Token** (símbolo e nome)
- **Quantidade** distribuída
- **Cotação** do token em cBRL
- **Rede** (mainnet/testnet)
- **Hash da transação** blockchain
- **Data de distribuição**
- **Status** ativo/inativo

## 🏗️ Estrutura do Banco de Dados

### Tabela `earnings`

```sql
CREATE TABLE earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  token_symbol VARCHAR(20) NOT NULL,
  token_name VARCHAR(100) NOT NULL,
  amount DECIMAL(20,8) NOT NULL,
  quote DECIMAL(20,8) NOT NULL,
  network VARCHAR(10) NOT NULL DEFAULT 'testnet',
  transaction_hash VARCHAR(66),
  distribution_date TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Índices

- `idx_earnings_user_id` - Para consultas por usuário
- `idx_earnings_token_symbol` - Para consultas por token
- `idx_earnings_network` - Para consultas por rede
- `idx_earnings_distribution_date` - Para consultas por data
- `idx_earnings_active` - Para consultas de proventos ativos

## 🚀 Configuração

### 1. Executar Migração

```bash
cd backend
npx prisma migrate dev --name add_earnings_table
```

### 2. Gerar Cliente Prisma

```bash
npx prisma generate
```

### 3. Executar Seed (Dados de Exemplo)

```bash
# Usar o script automatizado
./scripts/setup-earnings.sh

# Ou executar manualmente
node scripts/seed-earnings.js
```

## 📡 API Endpoints

### Base URL: `/api/earnings`

#### GET `/` - Listar Proventos
```http
GET /api/earnings?page=1&limit=20&tokenSymbol=AZE-t&network=testnet
```

**Parâmetros de Query:**
- `page` - Página atual (padrão: 1)
- `limit` - Itens por página (padrão: 20)
- `tokenSymbol` - Filtrar por símbolo do token
- `network` - Filtrar por rede (mainnet/testnet)
- `startDate` - Data de início (YYYY-MM-DD)
- `endDate` - Data de fim (YYYY-MM-DD)
- `sortBy` - Campo para ordenação (padrão: distributionDate)
- `sortOrder` - Ordem (asc/desc, padrão: desc)

#### GET `/chart` - Dados para Gráfico
```http
GET /api/earnings/chart?days=30&tokenSymbols=AZE-t,STT&network=testnet
```

**Parâmetros:**
- `days` - Número de dias para buscar (padrão: 30)
- `tokenSymbols` - Lista de símbolos de tokens (separados por vírgula)
- `network` - Rede para buscar (padrão: testnet)

#### GET `/summary` - Resumo dos Proventos
```http
GET /api/earnings/summary?network=testnet
```

#### GET `/period` - Proventos por Período
```http
GET /api/earnings/period?startDate=2025-01-01&endDate=2025-01-31&network=testnet
```

#### POST `/` - Criar Provento (Admin)
```http
POST /api/earnings
Content-Type: application/json
Authorization: Bearer <token>

{
  "tokenSymbol": "AZE-t",
  "tokenName": "Azore",
  "amount": 5.42342017,
  "quote": 2.50,
  "network": "testnet",
  "transactionHash": "0x1234...",
  "distributionDate": "2025-01-15T00:00:00.000Z"
}
```

#### PUT `/:id` - Atualizar Provento (Admin)
```http
PUT /api/earnings/<id>
Content-Type: application/json
Authorization: Bearer <token>

{
  "amount": 6.00000000,
  "quote": 2.60
}
```

#### DELETE `/:id` - Desativar Provento (Admin)
```http
DELETE /api/earnings/<id>
Authorization: Bearer <token>
```

## 🔧 Serviços

### EarningsService

O serviço principal que gerencia todas as operações de earnings:

- `createEarning()` - Criar novo provento
- `getUserEarnings()` - Obter proventos do usuário
- `getEarningsForChart()` - Dados para gráficos
- `getEarningsSummary()` - Resumo estatístico
- `getEarningsByPeriod()` - Proventos por período
- `updateEarning()` - Atualizar provento
- `deactivateEarning()` - Desativar provento

## 🎯 Casos de Uso

### 1. Dashboard do Usuário
- Exibir lista de proventos recebidos
- Mostrar total acumulado em cBRL
- Gráfico de evolução dos proventos por token

### 2. Relatórios Administrativos
- Total de proventos distribuídos por período
- Estatísticas por token e rede
- Análise de performance dos investimentos

### 3. Integração com Blockchain
- Rastreamento de transações de distribuição
- Verificação de proventos na blockchain
- Auditoria de distribuições

## 📊 Dados de Exemplo

O script de seed cria proventos para os seguintes tokens:

- **AZE-t** (Azore Testnet) - 4 proventos
- **STT** (Stake Token Test) - 4 proventos  
- **cBRL** (Coinage Real Brasil) - 4 proventos
- **AZE** (Azore Mainnet) - 4 proventos

## 🔒 Segurança

- Todas as rotas requerem autenticação JWT
- Usuários só podem acessar seus próprios proventos
- Operações de criação/edição restritas a administradores
- Validação de dados em todas as operações

## 🧪 Testes

### Testar API com Postman

1. Importar a coleção de Postman
2. Configurar variável de ambiente `baseUrl` para `http://localhost:8800`
3. Fazer login para obter token JWT
4. Testar endpoints de earnings

### Testar Frontend

1. Acessar dashboard
2. Verificar se os proventos são carregados
3. Testar paginação e filtros
4. Verificar se o gráfico exibe dados corretamente

## 🚨 Troubleshooting

### Erro de Migração
```bash
# Verificar status do banco
npx prisma db status

# Resetar banco (CUIDADO: perde todos os dados)
npx prisma migrate reset
```

### Erro de Cliente Prisma
```bash
# Regenerar cliente
npx prisma generate

# Verificar se o cliente foi gerado
ls -la src/generated/prisma/
```

### Erro de Conexão
- Verificar variáveis de ambiente `DATABASE_URL`
- Confirmar se o PostgreSQL está rodando
- Verificar permissões do usuário do banco

## 📝 Notas de Desenvolvimento

- O sistema usa soft delete (campo `is_active`)
- Todas as datas são armazenadas em UTC
- Valores monetários usam `DECIMAL(20,8)` para precisão
- Transações são agrupadas por data para gráficos
- Cache pode ser implementado para melhor performance

## 🔮 Próximos Passos

- [ ] Implementar cache Redis para earnings
- [ ] Adicionar webhooks para notificações
- [ ] Criar relatórios em PDF/Excel
- [ ] Integrar com sistema de auditoria
- [ ] Implementar backup automático
- [ ] Adicionar métricas de performance
