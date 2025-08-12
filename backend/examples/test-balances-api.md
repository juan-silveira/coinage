# Testando Saldo do Usuário Logado com Redis

## Exemplos Práticos de Teste

### 1. Login e Cache Automático

```bash
# Fazer login do usuário (cache automático)
curl -X POST http://localhost:8800/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ivan.alberton@navi.inf.br",
    "password": "N@vi@2025"
  }'
```

**Resposta esperada:**
```json
{
  "success": true,
  "message": "Login realizado com sucesso",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 900,
    "refreshExpiresIn": 604800,
    "isFirstAccess": false,
    "apiKeys": [],
    "user": {
      "id": "user-uuid-here",
      "name": "Ivan Alberton",
      "email": "ivan.alberton@navi.inf.br",
      "phone": "11999999999",
      "cpf": "12345678901",
      "birthDate": "1990-01-01",
      "permissions": {...},
      "roles": ["API_ADMIN"],
      "isApiAdmin": true,
      "isClientAdmin": true
    }
  }
}
```

### 2. Primeira Consulta de Balances (Sem Cache)

```bash
# Primeira consulta - vai buscar da API externa e cachear
curl -X GET "http://localhost:8800/api/users/address/0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6/balances?network=testnet" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Resposta esperada (sem cache):**
```json
{
  "success": true,
  "message": "Saldos obtidos com sucesso",
  "data": {
    "address": "0x742d35cc6634c0532925a3b8d4c9db96c4b4d8b6",
    "network": "testnet",
    "azeBalance": {
      "balanceWei": "1000000000000000000",
      "balanceEth": "1.0"
    },
    "tokenBalances": [
      {
        "contractAddress": "0x1234567890123456789012345678901234567890",
        "tokenName": "Test Token",
        "tokenSymbol": "TEST",
        "tokenDecimals": 18,
        "balanceWei": "500000000000000000",
        "balanceEth": "0.5"
      }
    ],
    "balancesTable": {
      "AZE": "1.0",
      "cBRL": "0",
      "TEST": "0.5"
    },
    "totalTokens": 2,
    "timestamp": "2024-01-01T12:00:00.000Z"
  },
  "fromCache": false
}
```

### 3. Segunda Consulta de Balances (Com Cache)

```bash
# Segunda consulta - vai retornar do cache (muito mais rápido)
curl -X GET "http://localhost:8800/api/users/address/0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6/balances?network=testnet" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Resposta esperada (com cache):**
```json
{
  "success": true,
  "message": "Saldos obtidos do cache",
  "data": {
    "address": "0x742d35cc6634c0532925a3b8d4c9db96c4b4d8b6",
    "network": "testnet",
    "azeBalance": {
      "balanceWei": "1000000000000000000",
      "balanceEth": "1.0"
    },
    "tokenBalances": [...],
    "balancesTable": {
      "AZE": "1.0",
      "cBRL": "0",
      "TEST": "0.5"
    },
    "totalTokens": 2,
    "timestamp": "2024-01-01T12:00:00.000Z",
    "cachedAt": "2024-01-01T12:00:00.000Z"
  },
  "fromCache": true
}
```

### 4. Verificar Estatísticas do Cache

```bash
# Ver estatísticas do cache (requer admin)
curl -X GET http://localhost:8800/api/admin/cache/stats \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN"
```

**Resposta esperada:**
```json
{
  "success": true,
  "message": "Estatísticas do cache obtidas com sucesso",
  "data": {
    "isConnected": true,
    "userCache": {
      "count": 1
    },
    "balancesCache": {
      "count": 1
    },
    "blacklist": {
      "count": 0
    },
    "totalKeys": 2
  }
}
```

### 5. Script Completo de Teste

```bash
#!/bin/bash

echo "🧪 Testando saldo do usuário logado com Redis..."

# 1. Fazer login
echo "1️⃣ Fazendo login..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8800/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ivan.alberton@navi.inf.br",
    "password": "N@vi@2025"
  }')

# Extrair token
ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.accessToken')
USER_ID=$(echo $LOGIN_RESPONSE | jq -r '.data.user.id')
PUBLIC_KEY=$(echo $LOGIN_RESPONSE | jq -r '.data.user.publicKey')

echo "✅ Login realizado - User ID: $USER_ID"
echo "🔑 Token: ${ACCESS_TOKEN:0:20}..."

# 2. Primeira consulta (sem cache)
echo "2️⃣ Primeira consulta de balances..."
FIRST_RESPONSE=$(curl -s -X GET "http://localhost:8800/api/users/address/$PUBLIC_KEY/balances?network=testnet" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

FROM_CACHE=$(echo $FIRST_RESPONSE | jq -r '.fromCache')
AZE_BALANCE=$(echo $FIRST_RESPONSE | jq -r '.data.azeBalance.balanceEth')

echo "✅ Primeira consulta - From Cache: $FROM_CACHE, AZE: $AZE_BALANCE"

# 3. Segunda consulta (com cache)
echo "3️⃣ Segunda consulta de balances..."
SECOND_RESPONSE=$(curl -s -X GET "http://localhost:8800/api/users/address/$PUBLIC_KEY/balances?network=testnet" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

FROM_CACHE_2=$(echo $SECOND_RESPONSE | jq -r '.fromCache')
AZE_BALANCE_2=$(echo $SECOND_RESPONSE | jq -r '.data.azeBalance.balanceEth')

echo "✅ Segunda consulta - From Cache: $FROM_CACHE_2, AZE: $AZE_BALANCE_2"

# 4. Comparar resultados
echo "4️⃣ Comparando resultados..."
if [ "$FROM_CACHE_2" = "true" ]; then
  echo "✅ Cache funcionando! Segunda consulta retornou do cache"
else
  echo "⚠️ Cache não está sendo usado"
fi

echo "🎉 Teste concluído!"
```

### 6. Teste com JavaScript/Node.js

```javascript
const axios = require('axios');

async function testUserBalances() {
  const BASE_URL = 'http://localhost:8800';
  
  try {
    // Login
    console.log('🔐 Fazendo login...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'ivan.alberton@navi.inf.br',
      password: 'N@vi@2025'
    });
    
    const { accessToken, user } = loginResponse.data.data;
    console.log('✅ Login realizado:', user.name);
    
    // Primeira consulta
    console.log('💰 Primeira consulta de balances...');
    const startTime = Date.now();
    const firstResponse = await axios.get(
      `${BASE_URL}/api/users/address/${user.publicKey}/balances?network=testnet`,
      { headers: { 'Authorization': `Bearer ${accessToken}` } }
    );
    const firstTime = Date.now() - startTime;
    
    console.log(`⏱️ Tempo da primeira consulta: ${firstTime}ms`);
    console.log(`📊 From Cache: ${firstResponse.data.fromCache}`);
    console.log(`💎 Saldo AZE: ${firstResponse.data.data.azeBalance.balanceEth}`);
    
    // Segunda consulta
    console.log('💰 Segunda consulta de balances...');
    const startTime2 = Date.now();
    const secondResponse = await axios.get(
      `${BASE_URL}/api/users/address/${user.publicKey}/balances?network=testnet`,
      { headers: { 'Authorization': `Bearer ${accessToken}` } }
    );
    const secondTime = Date.now() - startTime2;
    
    console.log(`⏱️ Tempo da segunda consulta: ${secondTime}ms`);
    console.log(`📊 From Cache: ${secondResponse.data.fromCache}`);
    console.log(`💎 Saldo AZE: ${secondResponse.data.data.azeBalance.balanceEth}`);
    
    // Comparar performance
    const improvement = ((firstTime - secondTime) / firstTime * 100).toFixed(1);
    console.log(`🚀 Melhoria de performance: ${improvement}%`);
    
  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
  }
}

testUserBalances();
```

## Como Executar os Testes

### 1. Usando o Script Automático
```bash
cd backend
node scripts/test-user-balances.js
```

### 2. Usando cURL Manual
```bash
# Execute os comandos cURL acima um por um
```

### 3. Usando JavaScript
```bash
cd backend
node examples/test-balances-api.md
```

## Resultados Esperados

### Performance
- **Primeira consulta**: 2-5 segundos (busca da API externa)
- **Segunda consulta**: 50-200ms (cache Redis)
- **Melhoria**: 80-90% mais rápido

### Dados Cacheados
- **Dados do usuário**: 1 hora de TTL
- **Balances**: 5 minutos de TTL
- **Estrutura**: Tabela dinâmica com AZE, cBRL e tokens adicionais

### Monitoramento
- Flag `fromCache` indica se veio do cache
- Timestamp `cachedAt` mostra quando foi cacheado
- Estatísticas disponíveis via API admin

