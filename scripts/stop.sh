#!/bin/bash

echo "🛑 Parando Coinage Backend"
echo "=========================="

# Verificar se docker-compose está disponível
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose não está instalado."
    exit 1
fi

echo "⏹️ Parando backend e infraestrutura..."
docker-compose down

echo ""
echo "🧹 Limpando containers parados..."
docker container prune -f

echo ""
echo "✅ Backend foi parado com sucesso!"
echo ""
echo "💡 Para iniciar novamente: ./scripts/start.sh"
echo "💡 Para limpar volumes: docker-compose down -v" 