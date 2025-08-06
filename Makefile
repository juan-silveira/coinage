.PHONY: help start stop status dev frontend backend logs clean restart install test

# Variáveis
COMPOSE_FILE = docker-compose.yml
PROJECT_NAME = coinage

# Comando padrão
help: ## Mostra esta ajuda
	@echo "🚀 Coinage - Comandos disponíveis:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

start: ## Inicia o backend (Docker)
	@echo "🚀 Iniciando backend..."
	@./scripts/start.sh

stop: ## Para o backend (Docker)
	@echo "🛑 Parando backend..."
	@./scripts/stop.sh

status: ## Mostra o status do backend
	@echo "📊 Verificando status..."
	@./scripts/status.sh

dev: ## Inicia backend e frontend em desenvolvimento
	@echo "🔧 Iniciando desenvolvimento..."
	@make start
	@echo "⏳ Aguardando backend iniciar..."
	@sleep 10
	@echo "🎨 Iniciando DashCode..."
	@cd frontend && yarn dev

frontend: ## Inicia apenas o frontend DashCode
	@echo "🎨 Iniciando DashCode..."
	@cd frontend && yarn dev

backend: ## Inicia apenas o backend
	@echo "⚙️ Iniciando backend..."
	@make start

logs: ## Mostra os logs do backend
	@echo "📋 Mostrando logs..."
	@docker-compose logs -f

clean: ## Limpa containers, volumes e imagens
	@echo "🧹 Limpando tudo..."
	@docker-compose down -v
	@docker system prune -f
	@echo "✅ Limpeza concluída!"

restart: ## Reinicia o backend
	@echo "🔄 Reiniciando backend..."
	@docker-compose restart

install: ## Instala dependências do DashCode
	@echo "📦 Instalando dependências..."
	@cd frontend && yarn install
	@echo "✅ Dependências instaladas!"

test: ## Executa testes do DashCode
	@echo "🧪 Executando testes..."
	@cd frontend && yarn test

build: ## Constrói as imagens Docker
	@echo "🔨 Construindo imagens..."
	@docker-compose build

health: ## Verifica saúde do backend
	@echo "🏥 Verificando saúde do backend..."
	@curl -s http://localhost:8800/api/health || echo "❌ Backend offline"

setup: ## Configuração inicial do projeto
	@echo "🔧 Configurando projeto..."
	@make install
	@make build
	@echo "✅ Configuração concluída!"

# Comando para desenvolvimento completo
full-dev: ## Inicia desenvolvimento completo
	@echo "🚀 Iniciando desenvolvimento completo..."
	@make start
	@echo "⏳ Aguardando backend..."
	@sleep 15
	@echo "🎨 Iniciando DashCode..."
	@make frontend 