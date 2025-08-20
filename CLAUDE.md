# Projeto Coinage - Memória do Projeto

## Visão Geral
Sistema financeiro com funcionalidades de depósito e saque (withdraw).

## Estrutura do Projeto

### Backend
- **Localização**: `/backend`
- **Tecnologia**: Node.js
- **Arquivos principais**:
  - Controllers: `src/controllers/` (deposit.controller.js)
  - Routes: `src/routes/` (deposit.routes.js)
  - Workers: `src/workers/` (deposit.worker.js)
  - Package: `package-worker.json`

### Frontend
- **Localização**: `/frontend`
- **Tecnologia**: Next.js/React
- **Estrutura de páginas**:
  - Dashboard: `app/(dashboard)/`
  - Deposit: `app/(dashboard)/deposit/`
  - PIX: `app/(dashboard)/deposit/pix/[payment_id]/`
- **Componentes**: `components/partials/deposit/`
- **Services**: `services/` (mockDepositService.js)

## Branch Atual
- **Branch de trabalho**: 004-withdraw
- **Branch principal**: main (usado para PRs)

## Funcionalidades Implementadas ✅
- Sistema de depósito com PIX
- Sistema de saque (withdraw) com PIX
- Dashboard com controle por roles/permissões
- Sistema de confirmação de email completo
- Templates de email profissionais (22 templates)
- Sistema de logs estruturados (Winston)
- Health checks para todos os serviços
- Autenticação JWT completa
- Páginas Transfer e Exchange (frontend)
- Collections Postman organizadas (20 collections)

## Status Atual - Sistema 90% Completo 🚀
- **Backend API**: ✅ Funcionando (http://localhost:8800)
- **Frontend**: ✅ Funcionando (http://localhost:3000)
- **Docker**: ✅ Todos containers funcionando
- **Banco PostgreSQL**: ✅ Funcionando (porta 5433)
- **Redis/RabbitMQ/MinIO**: ✅ Funcionando

## Commits Recentes
- Resolução de erros de inicialização do servidor
- Consolidação das collections Postman
- Correção de problemas do container Docker
- Implementação completa do sistema de email
- Implementação da tela de saque

## Observações
- O projeto usa workers para processar operações assíncronas
- Sistema de mock para desenvolvimento do frontend
- **Collections Postman consolidadas em `/backend/postman/`**
- **Email providers em modo mock temporariamente para Docker**
- **Sistema totalmente operacional para desenvolvimento**

## Usuário Padrão
- ivan.alberton@navi.inf.br
- senha: N@vi@2025

## Portas de Acesso

### Localhost (localhost:)
- **3000**: Frontend (Next.js - desenvolvimento local)
- **8800**: Backend API (Node.js - Docker)
- **5433**: PostgreSQL Database (Docker)
- **6379**: Redis (Docker - se configurado)

## Credenciais de Acesso

### Usuário de Teste
- **Email**: ivan.alberton@navi.inf.br
- **Senha**: N@vi@2025
- **Perfil**: Administrador

### Banco de Dados (PostgreSQL)
- **Host**: localhost
- **Porta**: 5433
- **Database**: coinage
- **User**: (verificar .env)
- **Password**: (verificar .env)

## URLs de Desenvolvimento
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8800
- **API Docs**: http://localhost:8800/api-docs (se configurado)

## Rotinas para fazer antes de testar
- **Derrubar, buildar e iniciar containers**: docker compose down && docker compose build backend && docker compose up -d
- **Se zerar o banco de dados**: usar o seed-basic-data.js dentro de /backend/scripts para iniciar a base de dados
- **Buildar e iniciar frontend**: yarn build && yarn dev