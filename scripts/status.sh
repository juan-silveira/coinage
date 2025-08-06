#!/bin/bash

echo "📊 Status do Backend - Coinage"
echo "=============================="

# Verificar se docker-compose está disponível
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose não está instalado."
    exit 1
fi

echo "🔍 Verificando status dos containers..."
docker-compose ps

echo ""
echo "🌐 Verificando conectividade dos serviços..."

# Backend
if curl -s http://localhost:8800/api/health > /dev/null; then
    echo "✅ Backend (porta 8800): ONLINE"
else
    echo "❌ Backend (porta 8800): OFFLINE"
fi

# PostgreSQL
if docker exec coinage_postgres pg_isready -U coinage_user -d coinage_db > /dev/null 2>&1; then
    echo "✅ PostgreSQL (porta 5432): ONLINE"
else
    echo "❌ PostgreSQL (porta 5432): OFFLINE"
fi

# Redis
if docker exec coinage_redis redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis (porta 6379): ONLINE"
else
    echo "❌ Redis (porta 6379): OFFLINE"
fi

# RabbitMQ
if curl -s http://localhost:15672 > /dev/null; then
    echo "✅ RabbitMQ (porta 15672): ONLINE"
else
    echo "❌ RabbitMQ (porta 15672): OFFLINE"
fi

# MinIO
if curl -s http://localhost:9001 > /dev/null; then
    echo "✅ MinIO (porta 9001): ONLINE"
else
    echo "❌ MinIO (porta 9001): OFFLINE"
fi

echo ""
echo "📈 Recursos do sistema:"
echo "   CPU: $(docker stats --no-stream --format "table {{.CPUPerc}}" | tail -n +2)"
echo "   Memória: $(docker stats --no-stream --format "table {{.MemUsage}}" | tail -n +2)"

echo ""
echo "🔗 URLs de acesso:"
echo "   Backend API:  http://localhost:8800"
echo "   RabbitMQ:     http://localhost:15672"
echo "   MinIO:        http://localhost:9001"
echo ""
echo "🎨 Frontend (desenvolvimento):"
echo "   cd frontend && npm run dev" 