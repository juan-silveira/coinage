# Sistema de Sincronização de Balances com Redis

## Visão Geral

O sistema de sincronização de balances com Redis é uma solução completa para monitorar e sincronizar automaticamente os saldos de tokens de usuários com a blockchain Azore. O sistema integra o frontend React com o backend Node.js através do Redis para cache e sincronização bidirecional.

## Arquitetura

```
Frontend (React) ←→ Backend (Node.js) ←→ Redis ←→ API Azorescan
     ↓                    ↓                ↓           ↓
useBalanceSync    balanceSyncService   Cache    Blockchain Data
```

## Componentes Principais

### 1. Hook `useBalanceSync` (Frontend)

Hook React que gerencia a sincronização automática de balances.

**Funcionalidades:**
- Sincronização automática a cada 1 minuto
- Integração com API do Azorescan
- Detecção de mudanças de saldo
- Notificações automáticas
- Sincronização com Redis
- Cache local (localStorage)

**Uso básico:**
```jsx
import useBalanceSync from '@/hooks/useBalanceSync';

const MyComponent = () => {
  const {
    isActive,
    lastSync,
    balanceChanges,
    startSync,
    stopSync,
    syncBalances
  } = useBalanceSync((changes, newBalances) => {
    console.log('Mudanças detectadas:', changes);
  });

  return (
    <div>
      <button onClick={startSync}>Iniciar Sincronização</button>
      <button onClick={stopSync}>Parar Sincronização</button>
      <div>Status: {isActive ? 'Ativo' : 'Inativo'}</div>
      <div>Última sync: {lastSync}</div>
    </div>
  );
};
```

### 2. Serviço `balanceSyncService` (Frontend)

Serviço para comunicação com o backend Redis.

**Métodos principais:**
- `getRedisCache(userId, address)` - Busca cache Redis
- `updateRedisCache(userId, address, balances)` - Atualiza cache Redis
- `syncWithRedis(userId, address, balances)` - Sincroniza com Redis
- `compareWithRedis(localBalances, redisCache)` - Compara dados locais com Redis

### 3. Controller `balanceSyncController` (Backend)

Controla as operações de sincronização no backend.

**Endpoints:**
- `GET /api/balance-sync/cache` - Busca cache Redis
- `POST /api/balance-sync/cache` - Atualiza cache Redis
- `GET /api/balance-sync/history` - Busca histórico de mudanças
- `DELETE /api/balance-sync/cache/clear` - Limpa cache Redis
- `GET /api/balance-sync/status` - Busca status da sincronização

### 4. Serviço `balanceSyncService` (Backend)

Gerencia operações Redis no backend.

**Funcionalidades:**
- Cache de balances por usuário/endereço
- Histórico de mudanças
- Status de sincronização
- Limpeza de dados

## Configuração

### 1. Variáveis de Ambiente (Backend)

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

### 2. Dependências

**Backend:**
```json
{
  "redis": "^4.6.12"
}
```

**Frontend:**
```json
{
  "react": "^18.0.0",
  "axios": "^1.0.0"
}
```

### 3. Docker Compose

O Redis já está configurado no `docker-compose.yml`:

```yaml
redis:
  image: redis:7-alpine
  container_name: coinage_redis
  ports:
    - "127.0.0.1:6379:6379"
  volumes:
    - redis_data:/data
  networks:
    - azore_network
```

## Fluxo de Funcionamento

### 1. Inicialização
1. Usuário faz login
2. Hook `useBalanceSync` é montado
3. Sistema verifica se deve iniciar auto-sync
4. Se sim, inicia sincronização automática

### 2. Sincronização Automática
1. A cada 1 minuto, sistema executa:
   - Busca balances da API Azorescan
   - Compara com cache local anterior
   - Detecta mudanças
   - Cria notificações
   - Sincroniza com Redis
   - Atualiza cache local

### 3. Detecção de Mudanças
1. Compara novos balances com anteriores
2. Identifica:
   - Aumentos de saldo
   - Diminuições de saldo
   - Novos tokens
   - Tokens removidos/zerados

### 4. Notificações
1. Para cada mudança detectada:
   - Cria notificação local
   - Envia para API do backend
   - Mostra toast de sucesso/erro

### 5. Sincronização Redis
1. Compara dados locais com Redis
2. Se houver diferenças:
   - Atualiza Redis com dados locais
   - Registra no histórico
   - Atualiza status

## Estrutura de Dados

### Cache Redis

```json
{
  "userId": "123",
  "address": "0x...",
  "balances": {
    "network": "testnet",
    "address": "0x...",
    "balancesTable": {
      "AZE": "100.000000",
      "cBRL": "1000.000000"
    },
    "lastUpdated": "2024-01-01T00:00:00.000Z",
    "source": "azorescan"
  },
  "lastUpdated": "2024-01-01T00:00:00.000Z",
  "source": "frontend-sync",
  "version": "1.0"
}
```

### Mudanças de Balance

```json
{
  "token": "AZE",
  "previousBalance": "100.000000",
  "newBalance": "150.000000",
  "difference": "50.000000",
  "type": "increase",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## API do Azorescan

O sistema usa a API pública do Azorescan para buscar balances:

```
GET https://floripa.azorescan.com/api/?module=account&action=tokenlist&address={ADDRESS}
```

**Resposta:**
```json
{
  "message": "OK",
  "result": [
    {
      "balance": "999999794500001170267489711",
      "contractAddress": "0x575b05df92b1a2e7782322bb86a9ee1e5bf2edcd",
      "decimals": "18",
      "name": "Stake Token Test",
      "symbol": "STT",
      "type": "ERC-20"
    }
  ],
  "status": "1"
}
```

## Tratamento de Erros

### 1. Proteção contra Crashes
- Todas as operações são envolvidas em try-catch
- Erros não propagam para evitar crash do sistema
- Logs detalhados para debugging

### 2. Fallbacks
- Se Redis falhar, sistema continua funcionando localmente
- Se API Azorescan falhar, mantém dados anteriores
- Cache local como backup

### 3. Retry Logic
- Tentativas automáticas de reconexão
- Timeout configurável
- Logs de erro persistentes

## Monitoramento e Debug

### 1. Logs Detalhados
- Todos os eventos são logados com emojis para fácil identificação
- Timestamps precisos
- Contexto completo das operações

### 2. Status em Tempo Real
- Estado da sincronização
- Status do Redis
- Contadores de mudanças
- Última sincronização

### 3. Histórico de Operações
- Cache Redis mantém histórico das últimas 100 operações
- Dados de debug para troubleshooting
- Rastreamento de fontes de dados

## Testes

### Componente de Teste
Use o componente `TestBalanceSyncRedis` para testar todas as funcionalidades:

```jsx
import TestBalanceSyncRedis from '@/examples/test-balance-sync-redis';

// No seu app
<TestBalanceSyncRedis />
```

### Testes Disponíveis
1. **Iniciar Sincronização** - Testa auto-start
2. **Sync Manual** - Sincronização sob demanda
3. **Sync Forçada** - Bypass de verificações
4. **Sync Redis** - Sincronização com backend
5. **Parar Sync** - Interrupção do serviço
6. **Ver Status** - Informações do sistema
7. **Simular Mudanças** - Dados de teste
8. **Limpar Histórico** - Reset de dados

## Performance

### 1. Otimizações
- Cache local para evitar requisições desnecessárias
- Comparação inteligente com tolerância para precisão
- Histórico limitado a 100 registros
- Operações assíncronas não-bloqueantes

### 2. Limitações
- Sincronização a cada 1 minuto (configurável)
- Cache local limitado ao usuário atual
- Histórico Redis limitado a 100 registros por usuário

### 3. Escalabilidade
- Redis suporta múltiplos usuários simultâneos
- Chaves únicas por usuário/endereço
- Operações independentes por usuário

## Segurança

### 1. Autenticação
- Todas as rotas requerem JWT válido
- Verificação de propriedade dos dados
- Rate limiting configurável

### 2. Validação
- Validação de entrada em todas as rotas
- Sanitização de dados
- Verificação de tipos e formatos

### 3. Isolamento
- Dados isolados por usuário
- Chaves Redis únicas por usuário
- Sem vazamento de dados entre usuários

## Troubleshooting

### Problemas Comuns

1. **Redis não conecta**
   - Verificar se container está rodando
   - Verificar variáveis de ambiente
   - Verificar logs do container

2. **Sincronização não inicia**
   - Verificar se usuário tem publicKey
   - Verificar logs do console
   - Verificar estado do hook

3. **Mudanças não detectadas**
   - Verificar tolerância de comparação
   - Verificar formato dos dados
   - Verificar logs de detecção

4. **Erros de API**
   - Verificar conectividade com Azorescan
   - Verificar formato do endereço
   - Verificar rate limits

### Logs Úteis

```bash
# Backend
docker-compose logs -f api

# Redis
docker-compose logs -f redis

# Frontend (Console do navegador)
# Procurar por logs com prefixo [BalanceSync]
```

## Contribuição

### 1. Padrões de Código
- Use emojis nos logs para fácil identificação
- Mantenha tratamento de erros robusto
- Documente todas as funções públicas

### 2. Testes
- Teste todas as funcionalidades
- Verifique tratamento de erros
- Valide integração com Redis

### 3. Documentação
- Atualize este README
- Documente mudanças na API
- Mantenha exemplos atualizados

## Licença

MIT License - veja arquivo LICENSE para detalhes.
