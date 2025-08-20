# Database Requirements - User Actions Tracking

## Tabela `user_actions`

Esta tabela é necessária para registrar todas as ações dos usuários no sistema, fornecendo auditoria completa e histórico de atividades.

### Estrutura da Tabela

```sql
CREATE TABLE user_actions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    company_id BIGINT NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    action_description TEXT NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT,
    location VARCHAR(255),
    country_code VARCHAR(2),
    city VARCHAR(100),
    success BOOLEAN NOT NULL DEFAULT TRUE,
    error_message TEXT NULL,
    metadata JSON NULL,
    session_id VARCHAR(255),
    request_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    
    INDEX idx_user_actions_user_id (user_id),
    INDEX idx_user_actions_company_id (company_id),
    INDEX idx_user_actions_type (action_type),
    INDEX idx_user_actions_created_at (created_at),
    INDEX idx_user_actions_success (success),
    INDEX idx_user_actions_ip (ip_address)
);
```

### Campos da Tabela

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | BIGINT | Chave primária auto-incrementada |
| `user_id` | BIGINT | ID do usuário que executou a ação |
| `company_id` | BIGINT | ID da empresa/whitelabel |
| `action_type` | VARCHAR(50) | Tipo da ação (ver tipos abaixo) |
| `action_description` | TEXT | Descrição detalhada da ação |
| `ip_address` | VARCHAR(45) | Endereço IP do usuário (IPv4 ou IPv6) |
| `user_agent` | TEXT | User agent do browser/aplicativo |
| `location` | VARCHAR(255) | Localização aproximada (cidade, estado) |
| `country_code` | VARCHAR(2) | Código do país (ISO 3166-1 alpha-2) |
| `city` | VARCHAR(100) | Cidade do usuário |
| `success` | BOOLEAN | Se a ação foi executada com sucesso |
| `error_message` | TEXT | Mensagem de erro (se houver) |
| `metadata` | JSON | Dados adicionais específicos da ação |
| `session_id` | VARCHAR(255) | ID da sessão |
| `request_id` | VARCHAR(255) | ID único da requisição |
| `created_at` | TIMESTAMP | Data/hora de criação |
| `updated_at` | TIMESTAMP | Data/hora de atualização |

### Tipos de Ações (`action_type`)

#### Autenticação
- `login` - Login realizado
- `logout` - Logout realizado
- `failed_login` - Tentativa de login falhada
- `password_change` - Alteração de senha
- `password_reset_request` - Solicitação de reset de senha
- `password_reset_complete` - Reset de senha concluído
- `two_factor_enabled` - 2FA habilitado
- `two_factor_disabled` - 2FA desabilitado
- `account_locked` - Conta bloqueada por tentativas
- `account_unlocked` - Conta desbloqueada

#### Perfil do Usuário
- `profile_update` - Dados do perfil atualizados
- `email_change` - Email alterado
- `phone_change` - Telefone alterado
- `avatar_update` - Avatar atualizado
- `address_update` - Endereço atualizado
- `document_upload` - Documento enviado
- `document_verified` - Documento verificado
- `kyc_started` - Processo KYC iniciado
- `kyc_completed` - Processo KYC concluído

#### Transações Financeiras
- `deposit_created` - Depósito criado
- `deposit_confirmed` - Depósito confirmado
- `deposit_failed` - Depósito falhou
- `withdraw_created` - Saque criado
- `withdraw_approved` - Saque aprovado
- `withdraw_rejected` - Saque rejeitado
- `withdraw_completed` - Saque concluído
- `transfer_created` - Transferência criada
- `transfer_completed` - Transferência concluída
- `exchange_created` - Troca criada
- `exchange_completed` - Troca concluída
- `stake_created` - Investimento criado
- `stake_completed` - Investimento concluído
- `unstake_created` - Resgate criado
- `unstake_completed` - Resgate concluído

#### Segurança
- `suspicious_activity` - Atividade suspeita detectada
- `device_new` - Novo dispositivo detectado
- `location_new` - Nova localização detectada
- `api_key_created` - Chave API criada
- `api_key_deleted` - Chave API removida
- `export_data` - Dados exportados
- `data_download` - Download de dados

#### Sistema
- `settings_update` - Configurações atualizadas
- `notification_read` - Notificação lida
- `support_ticket_created` - Ticket de suporte criado
- `support_message_sent` - Mensagem de suporte enviada
- `terms_accepted` - Termos aceitos
- `privacy_accepted` - Política de privacidade aceita

### Exemplo de Uso

```javascript
// Exemplo de registro de ação
const logUserAction = async (userId, companyId, actionType, description, metadata = {}) => {
  const actionData = {
    user_id: userId,
    company_id: companyId,
    action_type: actionType,
    action_description: description,
    ip_address: req.ip,
    user_agent: req.headers['user-agent'],
    location: await getLocationFromIP(req.ip),
    success: true,
    metadata: JSON.stringify(metadata),
    session_id: req.sessionID,
    request_id: req.id || generateRequestId(),
    created_at: new Date()
  };

  await db.query('INSERT INTO user_actions SET ?', actionData);
};

// Exemplos de uso
await logUserAction(userId, companyId, 'login', 'Usuário fez login com sucesso');
await logUserAction(userId, companyId, 'deposit_created', 'Depósito de R$ 1000 criado', { amount: 1000, method: 'pix' });
await logUserAction(userId, companyId, 'profile_update', 'Usuário atualizou telefone', { old_phone: '11999999999', new_phone: '11888888888' });
```

### Consultas Úteis

```sql
-- Ações de um usuário específico
SELECT * FROM user_actions 
WHERE user_id = ? 
ORDER BY created_at DESC 
LIMIT 50;

-- Tentativas de login falhadas nas últimas 24h
SELECT * FROM user_actions 
WHERE action_type = 'failed_login' 
AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
ORDER BY created_at DESC;

-- Atividades suspeitas por IP
SELECT ip_address, COUNT(*) as attempts
FROM user_actions 
WHERE action_type IN ('failed_login', 'suspicious_activity')
AND created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
GROUP BY ip_address
HAVING attempts > 5;

-- Estatísticas de ações por tipo
SELECT action_type, COUNT(*) as count
FROM user_actions
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY action_type
ORDER BY count DESC;
```

### Integração com Frontend

A tela de admin de usuários deve mostrar:
1. **Últimas ações** do usuário no modal de perfil
2. **Atividades suspeitas** destacadas
3. **Filtros por tipo de ação** e período
4. **Localização** das ações (mapa se possível)
5. **Gráficos de atividade** por período

### Considerações de Performance

1. **Particionamento**: Considere particionar por mês para melhor performance
2. **Arquivamento**: Mova registros antigos (> 1 ano) para tabela de arquivo
3. **Índices**: Crie índices compostos para consultas frequentes
4. **Cache**: Use Redis para estatísticas frequentemente acessadas

### Privacidade e LGPD

1. **Anonização**: Implemente processo para anonizar IPs antigos
2. **Retenção**: Defina política de retenção (sugestão: 2 anos)
3. **Consentimento**: Documente o uso para auditoria/segurança
4. **Exclusão**: Permita exclusão de dados mediante solicitação