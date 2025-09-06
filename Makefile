# Makefile - Projeto Coinage (Local)

.PHONY: help run run-backend run-frontend services-status env-setup

# Cores para output
RED := \033[0;31m
GREEN := \033[0;32m
YELLOW := \033[1;33m
NC := \033[0m

# Variáveis
BACKEND_DIR = backend
FRONTEND_DIR = frontend
ENV_FILE = .env

help: ## Mostra este menu de ajuda
	@echo "$(GREEN)Projeto Coinage - Comandos$(NC)"
	@echo "run - Inicia o projeto completo"
	@echo "run-backend - Inicia apenas o backend"  
	@echo "run-frontend - Inicia apenas o frontend"
	@echo "services-status - Verifica status dos servicos"

env-setup: ## Configura o arquivo .env
	@echo "$(GREEN)Configurando arquivo .env...$(NC)"
	@if [ -f $(ENV_FILE) ]; then \
		echo "$(GREEN)Arquivo .env encontrado na raiz$(NC)"; \
	else \
		echo "$(RED)Arquivo .env não encontrado!$(NC)"; \
		exit 1; \
	fi
	@echo "$(GREEN)Arquivos .env configurados!$(NC)"

services-status: ## Verifica o status dos serviços
	@echo "$(YELLOW)Status dos servicos:$(NC)"
	@echo -n "PostgreSQL: " && (sudo systemctl is-active postgresql >/dev/null 2>&1 && echo "$(GREEN)Rodando$(NC)" || echo "$(RED)Parado$(NC)")
	@echo -n "Redis:      " && (sudo systemctl is-active redis-server >/dev/null 2>&1 && echo "$(GREEN)Rodando$(NC)" || echo "$(RED)Parado$(NC)")
	@echo -n "RabbitMQ:   " && (sudo systemctl is-active rabbitmq-server >/dev/null 2>&1 && echo "$(GREEN)Rodando$(NC)" || echo "$(RED)Parado$(NC)")

run-backend: ## Inicia apenas o backend
	@echo "$(GREEN)Iniciando backend...$(NC)"
	cd $(BACKEND_DIR) && npm run dev

run-frontend: ## Inicia apenas o frontend
	@echo "$(GREEN)Iniciando frontend...$(NC)"
	cd $(FRONTEND_DIR) && yarn dev

run: ## Inicia o projeto completo (backend e frontend)
	@echo "$(GREEN)Iniciando Projeto Coinage$(NC)"
	@echo ""
	@echo "$(YELLOW)Verificando servicos...$(NC)"
	@make services-status
	@echo ""
	@echo "$(YELLOW)Configurando ambiente...$(NC)"
	@make env-setup
	@echo ""
	@echo "$(GREEN)Iniciando aplicacao...$(NC)"
	@echo "$(YELLOW)Backend:$(NC) http://localhost:8800"
	@echo "$(YELLOW)Frontend:$(NC) http://localhost:3000"
	@echo ""
	@echo "$(YELLOW)Pressione Ctrl+C para parar$(NC)"
	@echo ""
	@make -j2 run-backend run-frontend