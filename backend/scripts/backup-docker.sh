#!/bin/bash

# Script de Backup para Docker PostgreSQL
# Executa backup do banco de dados em container Docker

# Configurações
BACKUP_DIR="./backups"
CONTAINER_NAME="coinage_postgres"
DB_NAME="coinage"
DB_USER="postgres"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_${DB_NAME}_${TIMESTAMP}.sql.gz"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Iniciando backup do PostgreSQL via Docker${NC}"
echo "=====================================

# Criar diretório de backup se não existir
mkdir -p "$BACKUP_DIR"

# Verificar se o container está rodando
if ! docker ps | grep -q "$CONTAINER_NAME"; then
    echo -e "${RED}❌ Container $CONTAINER_NAME não está rodando${NC}"
    exit 1
fi

# Executar backup
echo -e "${YELLOW}📦 Executando pg_dump no container...${NC}"
docker exec "$CONTAINER_NAME" pg_dump -U "$DB_USER" -d "$DB_NAME" --no-owner --no-acl | gzip > "$BACKUP_DIR/$BACKUP_FILE"

# Verificar se o backup foi criado
if [ -f "$BACKUP_DIR/$BACKUP_FILE" ]; then
    SIZE=$(du -h "$BACKUP_DIR/$BACKUP_FILE" | cut -f1)
    echo -e "${GREEN}✅ Backup criado com sucesso!${NC}"
    echo "   Arquivo: $BACKUP_FILE"
    echo "   Tamanho: $SIZE"
    echo "   Local: $BACKUP_DIR/"
    
    # Listar backups existentes
    echo ""
    echo "📋 Backups disponíveis:"
    ls -lh "$BACKUP_DIR"/*.sql.gz 2>/dev/null | tail -5
    
    # Remover backups antigos (manter apenas os últimos 7)
    echo ""
    echo "🗑️ Removendo backups antigos..."
    cd "$BACKUP_DIR" && ls -t *.sql.gz 2>/dev/null | tail -n +8 | xargs -r rm -v
    
    echo ""
    echo -e "${GREEN}🎉 Backup concluído com sucesso!${NC}"
else
    echo -e "${RED}❌ Erro ao criar backup${NC}"
    exit 1
fi