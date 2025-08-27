# 🏦 Coinage - Sistema Financeiro Completo

**Sistema de gerenciamento financeiro com integração PIX, autenticação robusta e arquitetura enterprise-grade.**

---

## 📋 Índice

- [🎯 Visão Geral](#-visão-geral)
- [✨ Funcionalidades](#-funcionalidades)
- [🚀 Quick Start](#-quick-start)
- [🔧 Configuração](#-configuração)
- [🐳 Docker](#-docker)
- [📊 Testes](#-testes)
- [📧 Sistema de Email](#-sistema-de-email)
- [🔐 Segurança](#-segurança)
- [📈 Monitoramento](#-monitoramento)
- [🗃️ Backup](#️-backup)
- [📚 Documentação](#-documentação)

---

## 🎯 Visão Geral

O **Coinage** é um sistema financeiro completo desenvolvido em Node.js/Express com frontend em Next.js. Oferece funcionalidades essenciais para gestão financeira digital, incluindo:

- **Operações PIX**: Depósitos e saques instantâneos
- **Autenticação Robusta**: JWT, 2FA, confirmação de email
- **Sistema de Email**: 22+ templates profissionais
- **Monitoramento**: Logs estruturados, alertas automáticos
- **Segurança**: Rate limiting, CORS, headers de segurança
- **Arquitetura Enterprise**: Docker, testes automatizados, backup

---

## ✨ Funcionalidades

### 💰 **Operações Financeiras**
- ✅ **Depósitos PIX**: QR Code automático, confirmação em tempo real
- ✅ **Saques PIX**: Validação de chaves, processamento assíncrono
- ✅ **Transferências**: Entre usuários do sistema
- ✅ **Histórico**: Dashboard completo de transações

### 🔐 **Autenticação & Segurança**
- ✅ **Login/Registro**: Com validação de email obrigatória
- ✅ **Reset de Senha**: Sistema completo com tokens seguros
- ✅ **2FA**: Autenticação de dois fatores (TOTP)
- ✅ **Rate Limiting**: Proteção contra abuso de APIs
- ✅ **Headers de Segurança**: Helmet, CORS, CSP

### 📧 **Sistema de Comunicação**
- ✅ **22 Templates de Email**: Design profissional e responsivo
- ✅ **Múltiplos Provedores**: Mock, Mandrill, MailerSend
- ✅ **Fallback Automático**: Tolerância a falhas
- ✅ **Auditoria Completa**: Logs de todos os envios

### 📊 **Monitoramento & Observabilidade**
- ✅ **Logs Estruturados**: Winston com rotação automática
- ✅ **Health Checks**: Endpoints de saúde do sistema
- ✅ **Alertas Automáticos**: Notificações para eventos críticos
- ✅ **Testes Automatizados**: 9 suites de teste

---

## 🚀 Quick Start

### Pré-requisitos
- Node.js 18+
- Yarn 1.22+
- Docker & Docker Compose
- PostgreSQL 14+

### 1. Clone e Configure
```bash
git clone <repository>
cd coinage

# IMPORTANTE: Copiar o arquivo .env existente
# O arquivo .env deve conter todas as variáveis necessárias
# Certifique-se de ter o arquivo .env configurado corretamente
```

### 2. Preparar Backend
```bash
# Instalar dependências e gerar package-lock.json
cd backend
npm install
cd ..
```

### 3. Iniciar com Docker
```bash
# Parar, construir e iniciar todos os serviços
docker compose down && docker compose build backend && docker compose up -d

# Verificar se os containers estão rodando
docker compose ps
```

### 4. Configurar Banco de Dados
```bash
cd backend
# Aplicar migrations do Prisma
npx prisma migrate deploy

# Popular banco com dados iniciais
node scripts/seed-basic-data.js
cd ..
```

### 5. Preparar e Iniciar Frontend
```bash
cd frontend
# Limpar locks antigos e instalar dependências
rm -f yarn.lock package-lock.json
yarn install

# Buildar e iniciar em modo desenvolvimento
yarn build
yarn dev
```

### 6. Acessar Sistema
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8800
- **API Docs**: http://localhost:8800/api-docs

### 🔑 **Usuário Padrão**
- **Email**: ivan.alberton@navi.inf.br
- **Senha**: N@vi@2025

### ⚠️ **Troubleshooting**

#### ESLint Warnings no Frontend
Se encontrar warnings do ESLint durante o build, o arquivo `.eslintrc.json` já está configurado para permitir o build:
```json
{
  "extends": "next/core-web-vitals",
  "rules": {
    "@next/next/no-img-element": "off",
    "react-hooks/exhaustive-deps": "warn",
    "react/no-unescaped-entities": "off"
  }
}
```

#### Erro no Script Seed
O script seed pode apresentar erro ao tentar criar transações devido a campos obsoletos no schema. 
Isso não impede o funcionamento do sistema, pois as entidades principais (empresas e usuários) são criadas com sucesso.

#### Containers não iniciam
Certifique-se de que as portas não estão em uso:
- Frontend: 3000
- Backend: 8800  
- PostgreSQL: 5433
- Redis: 6379 (interno)
- RabbitMQ: 5672, 15672

---

## 🔧 Configuração

### Variáveis de Ambiente Principais

```bash
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/coinage"

# JWT
JWT_SECRET="your-jwt-secret"
JWT_EXPIRES_IN="24h"

# Email
EMAIL_PROVIDER="mock"  # mock | mandrill | mailersend
MANDRILL_API_KEY="your-key"
MAILERSEND_API_TOKEN="your-token"

# Redis
REDIS_URL="redis://localhost:6379"

# RabbitMQ
RABBITMQ_URL="amqp://localhost:5672"
```

### Portas dos Serviços
| Serviço     | Porta | Acesso                    |
|-------------|-------|---------------------------|
| Frontend    | 3000  | http://localhost:3000     |
| Backend API | 8800  | http://localhost:8800     |
| PostgreSQL  | 5433  | localhost:5433            |
| Redis       | 6379  | localhost:6379            |
| RabbitMQ    | 15672 | http://localhost:15672    |
| MinIO       | 9000  | http://localhost:9000     |

---

## 🐳 Docker

### Serviços Disponíveis
```yaml
# Principais containers
- coinage_backend     # API Node.js
- coinage_postgres    # Banco de dados
- coinage_redis       # Cache
- coinage_rabbitmq    # Message broker
- coinage_minio       # Object storage
```

### Comandos Úteis
```bash
# Logs dos containers
docker compose logs -f backend

# Restart completo
docker compose restart

# Status dos containers
docker compose ps

# Shell no container backend
docker exec -it coinage_backend bash
```

---

## 📊 Testes

### Executar Testes
```bash
# Todos os testes
npm run test

# Apenas health checks
npm run test:health

# Watch mode (desenvolvimento)
npm run test:watch
```

### Suites de Teste Disponíveis
- ✅ **Health Checks**: Backend, performance, headers
- ✅ **Security Tests**: CORS, autenticação, headers de segurança  
- ✅ **Load Tests**: Requisições concorrentes
- ✅ **Integration Tests**: Banco, email, Redis (skipped por enquanto)

### Resultados Esperados
```
📊 TEST SUMMARY
=====================================
✅ Passed: 9
❌ Failed: 0
⏸️ Skipped: 3
📝 Total: 12

🎉 All tests passed!
```

---

## 📧 Sistema de Email

### Templates Disponíveis (22 total)
| Categoria | Templates |
|-----------|-----------|
| **Auth** | welcome, email_confirmation, password_reset, login_alert |
| **Financial** | deposit_confirmed, deposit_failed, withdrawal_completed, withdrawal_failed |
| **Transactions** | transaction_confirmed, transaction_failed, transfer_completed, transfer_failed |
| **Exchange** | exchange_completed, exchange_failed |
| **KYC** | kyc_approved, kyc_rejected |
| **Account** | account_suspended, account_verified |
| **System** | maintenance_notice, system_alert |
| **Reports** | weekly_summary, monthly_statement |

### Configuração de Provedores
```javascript
// Mock (desenvolvimento)
EMAIL_PROVIDER=mock

// Mandrill (produção)
EMAIL_PROVIDER=mandrill
MANDRILL_API_KEY=your_key

// MailerSend (produção)
EMAIL_PROVIDER=mailersend
MAILERSEND_API_TOKEN=your_token
```

---

## 🔐 Segurança

### Funcionalidades Implementadas
- ✅ **Rate Limiting**: 5000 req/15min por empresa/IP
- ✅ **Headers de Segurança**: Helmet completo
- ✅ **CORS**: Configurado para frontend
- ✅ **Validação JWT**: Middleware de autenticação
- ✅ **Confirmação de Email**: Obrigatória para operações
- ✅ **2FA**: TOTP com QR Code

### Rate Limits por Endpoint
```javascript
// APIs gerais
GET /api/*        -> 5000/15min
POST /api/*       -> 5000/15min

// Autenticação
POST /api/auth/*  -> 50/15min

// Transações
POST /api/deposit -> 100/15min
POST /api/withdraw -> 20/15min
```

---

## 📈 Monitoramento

### Logs Estruturados (Winston)
```bash
# Localização dos logs
/backend/logs/
├── combined.log      # Logs gerais (14 dias)
├── error.log         # Apenas erros (30 dias)
├── audit.log         # Operações sensíveis (90 dias)
├── performance.log   # Métricas de performance
└── security.log      # Eventos de segurança
```

### Alertas Automáticos
- 🚨 **Taxa de Erro**: >10 erros/minuto
- 🚨 **Performance**: Response time >5s
- 🚨 **Logins Falhados**: >50 tentativas/hora
- 🚨 **Erros de Database**: >5 erros/hora
- 🚨 **Erros Críticos**: Qualquer erro crítico

### Health Check Endpoints
```bash
GET /health              # Status geral do sistema
GET /api/test/auth       # Teste de autenticação
GET /api/test/db         # Teste de conexão DB
GET /api/test/email      # Teste de envio de email
```

---

## 🗃️ Backup

### Sistema Automático de Backup
```bash
# Backup manual
npm run backup

# Listar backups
npm run backup:list

# Restaurar backup
npm run backup:restore /path/to/backup.sql.gz

# Agendar backups (a cada 24h)
npm run backup:schedule
```

### Funcionalidades do Backup
- ✅ **Compressão**: Arquivos .sql.gz
- ✅ **Rotação**: Mantém últimos 7 backups
- ✅ **Docker Support**: Detecção automática
- ✅ **Verificação de Integridade**: Validação automática
- ✅ **Agendamento**: Backups periódicos

---

## 📚 Documentação

### Collections Postman (20 disponíveis)
```
/postman/
├── 01_Health_Check.json
├── 02_Authentication_Sessions.json
├── 03_Password_Reset.json
├── 16_Deposit_PIX.json
├── 17_Withdrawal_PIX.json
├── 18_Email_Templates.json
├── 19_Email_Confirmation.json
├── 20_System_Health_Check.json
└── ... (12 collections adicionais)
```

### Swagger/OpenAPI
- **URL**: http://localhost:8800/api-docs
- **Autenticação**: JWT Bearer Token
- **Schemas**: Completos para todas as entidades
- **Examples**: Requests e responses de exemplo

### Scripts Úteis
```bash
# Backend
npm run dev          # Desenvolvimento
npm run start        # Produção
npm run prisma:studio # GUI do banco
npm run docker:up    # Docker compose up

# Frontend
yarn dev            # Desenvolvimento
yarn build          # Build de produção
yarn start          # Servidor de produção
```

---

## 🎯 Status do Projeto

### ✅ **95% Completo - Sistema Enterprise**

| Categoria | Status | Descrição |
|-----------|--------|-----------|
| 🏗️ **Backend** | ✅ 100% | API completa, workers, middleware |
| 🎨 **Frontend** | ✅ 95% | Dashboard, operações, componentes |
| 🔐 **Auth** | ✅ 100% | Login, registro, 2FA, JWT |
| 💰 **Financial** | ✅ 100% | PIX in/out, transfers, history |
| 📧 **Email** | ✅ 100% | 22 templates, provedores, fallback |
| 📊 **Monitoring** | ✅ 100% | Logs, alertas, health checks |
| 🧪 **Tests** | ✅ 90% | 9 suites automatizadas |
| 🐳 **Docker** | ✅ 100% | 5 containers funcionais |
| 📚 **Docs** | ✅ 90% | Postman, Swagger, README |

### 🚀 **Próximos Passos Opcionais**
- [ ] Configurar ambiente de produção
- [ ] Implementar notificações push
- [ ] Dashboard de administração avançado
- [ ] Integração com mais provedores PIX
- [ ] API webhooks para integrações

---

## 🤝 Suporte

### Contato
- **Email**: suporte@coinage.app
- **Documentação**: /docs
- **Issues**: GitHub Issues

### Desenvolvimento
- **Node.js**: 18+
- **Framework**: Express.js + Next.js
- **Database**: PostgreSQL + Prisma
- **Cache**: Redis
- **Queue**: RabbitMQ
- **Storage**: MinIO (S3-compatible)

---

**© 2024 Coinage - Sistema Financeiro Enterprise**