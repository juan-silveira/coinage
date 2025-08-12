# 🔧 Instruções de Configuração - Postman Azore API

## 🚨 Problemas de Autenticação - SOLUÇÕES

### Problema 1: "Token inválido" ou "Unauthorized"

#### Solução:
1. **Verifique se a API está rodando**:
   ```bash
   curl http://localhost:8800/api/health
   ```

2. **Configure a API Key corretamente**:
   - Abra o environment "Azore API Environment"
   - Configure a variável `api_key` com sua chave real
   - Exemplo: `api_key = "sua_chave_real_aqui"`

3. **Para endpoints que precisam de JWT**:
   - Execute primeiro o endpoint "Login" da collection `02_Authentication_Sessions`
   - O token será salvo automaticamente

### Problema 2: "API Key não encontrada"

#### Solução:
1. **Gere uma nova API Key**:
   - Execute o endpoint "Generate API Key" da collection `02_Authentication_Sessions`
   - Copie a chave retornada
   - Configure no environment

2. **Verifique se está usando o environment correto**:
   - No canto superior direito do Postman, selecione "Azore API Environment"

### Problema 3: "Burn falhando"

#### Solução:
1. **Verifique BURNER_ROLE**:
   ```bash
   # Execute este endpoint primeiro
   POST /api/contracts/check-role
   {
     "contractAddress": "{{token_address}}",
     "role": "burner",
     "targetAddress": "{{gas_payer}}",
     "adminPublicKey": "{{admin_public_key}}"
   }
   ```

2. **Conceda BURNER_ROLE se necessário**:
   ```bash
   POST /api/contracts/grant-role
   {
     "contractAddress": "{{token_address}}",
     "role": "burner",
     "targetAddress": "{{gas_payer}}",
     "adminPublicKey": "{{admin_public_key}}"
   }
   ```

## 🔧 Configuração Passo a Passo

### 1. Importar Collections
```bash
# No Postman:
1. File -> Import
2. Arraste todos os arquivos .json da pasta Postman Files
3. Clique em Import
```

### 2. Configurar Environment
```bash
# No Postman:
1. Canto superior direito -> Selecione "Azore API Environment"
2. Clique no ícone de olho para editar
3. Configure estas variáveis:
```

```json
{
  "base_url": "http://localhost:8800",
  "api_key": "SUA_API_KEY_REAL_AQUI",
  "email": "seu_email@exemplo.com",
  "password": "sua_senha_aqui",
  "token_address": "0x1234567890123456789012345678901234567890",
  "from_address": "0x1234567890123456789012345678901234567890",
  "amount": "1.0",
  "gas_payer": "0x5528C065931f523CA9F3a6e49a911896fb1D2e6f"
}
```

### 3. Testar Conexão
```bash
# Execute este endpoint primeiro:
GET {{base_url}}/api/health
```

## 🪙 Burn de Tokens - Configuração Completa

### 1. Pré-requisitos
- ✅ API rodando em `http://localhost:8800`
- ✅ API Key configurada
- ✅ Endereços de contrato e carteiras configurados

### 2. Verificar Permissões
```bash
# 1. Verificar se gasPayer tem BURNER_ROLE
POST {{base_url}}/api/contracts/check-role
Headers:
  X-API-Key: {{api_key}}
  Content-Type: application/json
Body:
{
  "contractAddress": "{{token_address}}",
  "role": "burner",
  "targetAddress": "{{gas_payer}}",
  "adminPublicKey": "{{admin_public_key}}"
}
```

### 3. Conceder Permissões (se necessário)
```bash
# 2. Conceder BURNER_ROLE se o resultado anterior for false
POST {{base_url}}/api/contracts/grant-role
Headers:
  X-API-Key: {{api_key}}
  Content-Type: application/json
Body:
{
  "contractAddress": "{{token_address}}",
  "role": "burner",
  "targetAddress": "{{gas_payer}}",
  "adminPublicKey": "{{admin_public_key}}"
}
```

### 4. Executar Burn
```bash
# 3. Fazer o burn
POST {{base_url}}/api/tokens/burn
Headers:
  X-API-Key: {{api_key}}
  Content-Type: application/json
Body:
{
  "contractAddress": "{{token_address}}",
  "fromAddress": "{{from_address}}",
  "amount": "{{amount}}",
  "gasPayer": "{{gas_payer}}"
}
```

## 🧪 Teste Automático

Execute o script de teste para verificar se tudo está funcionando:

```bash
cd backend/Postman\ Files/
node test-api-connection.js
```

## 📋 Checklist de Configuração

- [ ] API rodando em `http://localhost:8800`
- [ ] Collections importadas no Postman
- [ ] Environment "Azore API Environment" selecionado
- [ ] API Key configurada no environment
- [ ] Health Check retorna 200 OK
- [ ] Login funciona e retorna JWT token
- [ ] Endereços de contrato configurados
- [ ] BURNER_ROLE verificada/concedida
- [ ] Burn endpoint testado

## 🚨 Troubleshooting Avançado

### Erro: "ECONNREFUSED"
- Verifique se a API está rodando
- Confirme a porta 8800
- Verifique firewall/antivírus

### Erro: "Invalid API Key"
- Gere uma nova API Key
- Verifique se está usando a chave correta
- Confirme se o environment está selecionado

### Erro: "Insufficient balance"
- Verifique se `fromAddress` tem tokens
- Verifique se `gasPayer` tem ETH para gás

### Erro: "Role not found"
- Conceda BURNER_ROLE ao `gasPayer`
- Verifique se `adminPublicKey` tem permissões

## 📞 Suporte

Se ainda tiver problemas:

1. **Execute o script de teste**: `node test-api-connection.js`
2. **Verifique os logs da API** para erros detalhados
3. **Consulte a documentação**: `README.md` e `BURN_TOKEN_EXAMPLE.md`
4. **Teste endpoint por endpoint** para identificar o problema específico

---

🎯 **Com essas configurações, você deve conseguir usar todos os endpoints da API!**

