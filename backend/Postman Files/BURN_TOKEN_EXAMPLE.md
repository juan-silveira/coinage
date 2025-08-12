# 🔥 Como Fazer Burn de Tokens - Guia Completo

## 📋 Pré-requisitos

Antes de fazer burn de tokens, você precisa ter:

1. ✅ **API Key configurada** no environment do Postman
2. ✅ **Endereço do contrato** do token que será queimado
3. ✅ **Endereço da carteira** que terá tokens queimados (`fromAddress`)
4. ✅ **Quantidade** a ser queimada
5. ✅ **Endereço do pagador de gás** (`gasPayer`) com BURNER_ROLE

## 🔧 Configuração Inicial

### 1. Configurar Environment

Abra o environment "Azore API Environment" e configure estas variáveis:

```json
{
  "api_key": "sua_api_key_aqui",
  "token_address": "0x1234567890123456789012345678901234567890",
  "from_address": "0x1234567890123456789012345678901234567890",
  "amount": "1.0",
  "gas_payer": "0x5528C065931f523CA9F3a6e49a911896fb1D2e6f"
}
```

### 2. Verificar BURNER_ROLE

Antes de fazer burn, verifique se o `gasPayer` tem a role necessária:

#### Endpoint: Check Role
- **Collection**: `09_Contract_Management`
- **Method**: POST
- **URL**: `{{base_url}}/api/contracts/check-role`
- **Headers**:
  ```
  Content-Type: application/json
  X-API-Key: {{api_key}}
  ```
- **Body**:
  ```json
  {
    "contractAddress": "{{token_address}}",
    "role": "burner",
    "targetAddress": "{{gas_payer}}",
    "adminPublicKey": "{{admin_public_key}}"
  }
  ```

### 3. Conceder BURNER_ROLE (se necessário)

Se o resultado for `false`, conceda a role:

#### Endpoint: Grant Role
- **Collection**: `09_Contract_Management`
- **Method**: POST
- **URL**: `{{base_url}}/api/contracts/grant-role`
- **Headers**:
  ```
  Content-Type: application/json
  X-API-Key: {{api_key}}
  ```
- **Body**:
  ```json
  {
    "contractAddress": "{{token_address}}",
    "role": "burner",
    "targetAddress": "{{gas_payer}}",
    "adminPublicKey": "{{admin_public_key}}"
  }
  ```

## 🚀 Fazendo o Burn de Tokens

### Opção 1: Burn Direto (Recomendado)

#### Endpoint: Burn Tokens
- **Collection**: `10_Token_Management`
- **Method**: POST
- **URL**: `{{base_url}}/api/tokens/burn`
- **Headers**:
  ```
  Content-Type: application/json
  X-API-Key: {{api_key}}
  ```
- **Body**:
  ```json
  {
    "contractAddress": "{{token_address}}",
    "fromAddress": "{{from_address}}",
    "amount": "{{amount}}",
    "gasPayer": "{{gas_payer}}"
  }
  ```

### Opção 2: Burn via Fila

#### Endpoint: Enfileirar Transação de Burn
- **Collection**: `13_Transaction_Management`
- **Method**: POST
- **URL**: `{{base_url}}/api/transactions/queue`
- **Headers**:
  ```
  Content-Type: application/json
  X-API-Key: {{api_key}}
  ```
- **Body**:
  ```json
  {
    "type": "token_burn",
    "data": {
      "contractAddress": "{{token_address}}",
      "fromAddress": "{{from_address}}",
      "amount": "{{amount}}",
      "gasPayer": "{{gas_payer}}"
    }
  }
  ```

## 📊 Exemplo de Resposta de Sucesso

```json
{
  "success": true,
  "message": "Tokens queimados com sucesso",
  "data": {
    "contractAddress": "0x1234567890123456789012345678901234567890",
    "functionName": "burnFrom",
    "params": [
      "0x1234567890123456789012345678901234567890",
      "1000000000000000000"
    ],
    "transactionHash": "0x1234567890123456789012345678901234567890123456789012345678901234",
    "gasUsed": "50000",
    "network": "testnet",
    "walletAddress": "0x5528C065931f523CA9F3a6e49a911896fb1D2e6f",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "amountWei": "1000000000000000000",
    "amountEth": "1.0",
    "fromAddress": "0x1234567890123456789012345678901234567890"
  }
}
```

## ⚠️ Notas Importantes

### 🔥 Sobre o Burn de Tokens

1. **BURNER_ROLE**: O `gasPayer` deve ter a role `burner` no contrato
2. **Quantidade**: Use valores em ETH (não wei) - a API converte automaticamente
3. **Permissões**: O `fromAddress` deve ter tokens suficientes
4. **Gás**: O `gasPayer` deve ter ETH suficiente para pagar o gás
5. **Irreversível**: O burn é irreversível - os tokens são destruídos permanentemente

### 🔍 Verificações Antes do Burn

1. **Saldo do fromAddress**:
   ```json
   {
     "contractAddress": "{{token_address}}",
     "walletAddress": "{{from_address}}"
   }
   ```

2. **Saldo de ETH do gasPayer**:
   - Verifique se tem ETH suficiente para pagar o gás

3. **BURNER_ROLE**:
   - Confirme se o `gasPayer` tem a role necessária

## 🚨 Troubleshooting

### Erros Comuns e Soluções

#### Erro 401 (Unauthorized)
```
{
  "success": false,
  "message": "API key inválida"
}
```
**Solução**: Verifique se a `api_key` está configurada corretamente

#### Erro 403 (Forbidden)
```
{
  "success": false,
  "message": "Endereço não tem permissão para queimar tokens"
}
```
**Solução**: Conceda BURNER_ROLE ao `gasPayer`

#### Erro 400 (Bad Request)
```
{
  "success": false,
  "message": "Saldo insuficiente"
}
```
**Solução**: Verifique se o `fromAddress` tem tokens suficientes

#### Erro 400 (Bad Request)
```
{
  "success": false,
  "message": "Saldo de ETH insuficiente para pagar gás"
}
```
**Solução**: Adicione ETH à carteira do `gasPayer`

## 📝 Checklist Completo

- [ ] API Key configurada no environment
- [ ] Endereço do contrato do token configurado
- [ ] Endereço de origem (`fromAddress`) configurado
- [ ] Quantidade a ser queimada configurada
- [ ] Endereço do pagador de gás (`gasPayer`) configurado
- [ ] Verificação de BURNER_ROLE realizada
- [ ] BURNER_ROLE concedida (se necessário)
- [ ] Saldo de tokens verificado
- [ ] Saldo de ETH verificado
- [ ] Requisição de burn executada
- [ ] Resposta de sucesso recebida
- [ ] Hash da transação anotado

## 🎯 Próximos Passos

Após o burn bem-sucedido:

1. **Verifique o saldo** do `fromAddress` para confirmar a redução
2. **Monitore a transação** na blockchain usando o hash retornado
3. **Consulte os logs** da API para detalhes da operação
4. **Verifique o histórico** de transações se necessário

## 📚 Recursos Adicionais

- **Documentação da API**: `API_Azore_Endpoints.md`
- **Collection de Tokens**: `10_Token_Management.postman_collection.json`
- **Collection de Contratos**: `09_Contract_Management.postman_collection.json`
- **Collection de Transações**: `13_Transaction_Management.postman_collection.json`

---

🎉 **Agora você está pronto para fazer burn de tokens com segurança!** 🔥

