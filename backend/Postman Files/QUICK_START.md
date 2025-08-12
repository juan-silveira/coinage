# 🚀 Guia de Início Rápido - Postman Azore API

## ⚡ Configuração em 5 Minutos

### 1. Importar Collections
1. Abra o Postman
2. Clique em **"Import"** (canto superior esquerdo)
3. Arraste todos os arquivos `.json` da pasta `Postman Files`
4. Clique em **"Import"**

### 2. Configurar Environment
1. No seletor de environment (canto superior direito), selecione **"Azore API Environment"**
2. Clique no ícone de **olho** para editar
3. Configure estas variáveis essenciais:

```json
{
  "base_url": "http://localhost:8800",
  "api_key": "sua_api_key_aqui",
  "email": "seu_email@exemplo.com",
  "password": "sua_senha_aqui"
}
```

### 3. Testar Conexão
1. Abra a collection **`01_Health_Check`**
2. Execute o endpoint **"Health Check"**
3. Se retornar `200 OK`, a API está funcionando! ✅

## 🔐 Autenticação Rápida

### Para Endpoints que precisam de API Key:
- Configure a variável `api_key` no environment
- Use o header: `X-API-Key: {{api_key}}`

### Para Endpoints que precisam de JWT Token:
1. Abra **`02_Authentication_Sessions`**
2. Execute **"Login"**
3. O token será salvo automaticamente ✅

## 🪙 Burn de Tokens - Passo a Passo

### 1. Configurar Variáveis
```json
{
  "token_address": "0x1234567890123456789012345678901234567890",
  "from_address": "0x1234567890123456789012345678901234567890",
  "amount": "1.0",
  "gas_payer": "0x5528C065931f523CA9F3a6e49a911896fb1D2e6f"
}
```

### 2. Verificar BURNER_ROLE
1. Abra **`09_Contract_Management`**
2. Execute **"Check Role"**
3. Se retornar `false`, execute **"Grant Role"**

### 3. Fazer Burn
1. Abra **`10_Token_Management`**
2. Execute **"Burn Tokens"**
3. Configure o body:
```json
{
  "contractAddress": "{{token_address}}",
  "fromAddress": "{{from_address}}",
  "amount": "{{amount}}",
  "gasPayer": "{{gas_payer}}"
}
```

## 🚨 Problemas Comuns

### Erro 401 (Unauthorized)
- ✅ Verifique se `api_key` está configurada
- ✅ Para JWT, faça login novamente

### Erro 403 (Forbidden)
- ✅ Verifique se o `gasPayer` tem BURNER_ROLE
- ✅ Conceda a role se necessário

### Burn falhando
- ✅ Verifique se `fromAddress` tem tokens
- ✅ Verifique se `gasPayer` tem ETH para gás

## 📚 Recursos

- **Documentação completa**: `README.md`
- **Guia de burn**: `BURN_TOKEN_EXAMPLE.md`
- **Environment**: `Azore.postman_environment.json`

---

🎉 **Pronto! Agora você pode usar todas as 139 rotas da API!**

