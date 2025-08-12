# Reset do Banco de Dados

Este documento descreve como zerar completamente o banco de dados e recarregar com dados iniciais baseados nas configurações do `.env`.

## ⚠️ ATENÇÃO

**Esta operação é DESTRUTIVA e irá apagar TODOS os dados do banco de dados!**

Use apenas em ambiente de desenvolvimento ou quando realmente necessário.

## Funcionalidades

O reset do banco de dados:

1. **Limpa completamente** todas as tabelas do banco
2. **Cria um cliente padrão** baseado nas configurações do `.env`
3. **Cria um usuário admin padrão** baseado nas configurações do `.env`

## Configurações no .env

As seguintes variáveis do `.env` são utilizadas:

### Cliente Padrão
```env
DEFAULT_CLIENT_NAME=Azore
DEFAULT_CLIENT_RATE_LIMIT_REQUESTS_PER_MINUTE=1000
DEFAULT_CLIENT_RATE_LIMIT_REQUESTS_PER_HOUR=10000
DEFAULT_CLIENT_RATE_LIMIT_REQUESTS_PER_DAY=100000
```

### Usuário Admin Padrão
```env
DEFAULT_ADMIN_EMAIL=ivan.alberton@navi.inf.br
DEFAULT_ADMIN_PASSWORD=N@vi@2025
DEFAULT_ADMIN_NAME=Admin
DEFAULT_ADMIN_CPF=00000000000
DEFAULT_ADMIN_PHONE=11999999999
DEFAULT_ADMIN_BIRTH_DATE=1990-01-01

# Chaves Ethereum (opcional - serão geradas se não fornecidas)
DEFAULT_ADMIN_PUBLIC_KEY=your_public_key_here
DEFAULT_ADMIN_PRIVATE_KEY=your_private_key_here
```

## Como Usar

### 1. Via Linha de Comando

```bash
# No diretório backend
npm run db:reset
```

### 2. Via API (Admin)

**Endpoint:** `POST /api/admin/database/reset`

**Headers:**
```
X-API-Key: [sua-api-key-de-admin]
Content-Type: application/json
```

**Body:**
```json
{
  "confirmReset": true
}
```

**Exemplo com curl:**
```bash
curl -X POST http://localhost:8800/api/admin/database/reset \
  -H "X-API-Key: sua-api-key-admin" \
  -H "Content-Type: application/json" \
  -d '{"confirmReset": true}'
```

### 3. Via Script Direto

```bash
# No diretório backend
node scripts/reset-database.js
```

## Resposta da API

### Sucesso (200)
```json
{
  "success": true,
  "message": "Banco de dados resetado com sucesso",
  "data": {
    "client": {
      "id": "uuid-do-client",
      "name": "Azore",
      "isActive": true
    },
    "user": {
      "id": "uuid-do-user",
      "email": "ivan.alberton@navi.inf.br",
      "name": "Admin",
      "roles": ["ADMIN", "USER"],
      "clientId": "uuid-do-client"
    }
  },
  "warning": "Todos os dados anteriores foram apagados e dados padrão foram carregados"
}
```

### Erro - Confirmação Necessária (400)
```json
{
  "success": false,
  "message": "Para executar o reset, você deve enviar confirmReset: true no body da requisição",
  "warning": "ATENÇÃO: Esta operação irá apagar TODOS os dados do banco de dados!"
}
```

## Logs

O processo gera logs detalhados:

```
🚀 Iniciando reset do banco de dados...

🔍 Inicializando conexão com o banco...
✅ Conexão estabelecida

🗑️ Limpando banco de dados...
✅ Banco de dados limpo

🏢 Criando cliente padrão...
✅ Cliente criado: { id: '...', name: 'Azore', isActive: true }

👤 Criando usuário padrão...
✅ Usuário criado: { id: '...', email: '...', name: 'Admin', roles: ['ADMIN', 'USER'], clientId: '...' }

🎉 Reset do banco concluído com sucesso!

📋 Resumo:
   Cliente: Azore (ID: uuid)
   Usuário: Admin <ivan.alberton@navi.inf.br> (ID: uuid)
   Roles: ADMIN, USER

🔌 Conexão com banco encerrada
```

## Segurança

- O endpoint da API requer autenticação de admin (`requireApiAdmin`)
- Logs registram quem solicitou o reset
- Confirmação explícita necessária via `confirmReset: true`
- Avisos claros sobre a natureza destrutiva da operação

## Casos de Uso

1. **Setup inicial** de ambiente de desenvolvimento
2. **Limpeza** após testes que corromperam dados
3. **Reset completo** para nova versão/configuração
4. **Ambiente de demonstração** com dados limpos

## Solução de Problemas

### Erro de Conexão
Verifique se:
- O banco PostgreSQL está rodando
- As configurações de conexão no `.env` estão corretas
- O usuário tem permissões para criar/deletar tabelas

### Erro de Prisma
Execute antes do reset:
```bash
npx prisma generate
npx prisma migrate dev
```

### Dados do .env Inválidos
Verifique se todas as variáveis obrigatórias estão definidas e são válidas.
