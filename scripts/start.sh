#!/bin/bash

echo "🚀 Iniciando Coinage Backend"
echo "============================"

# Verificar se Docker está rodando
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker não está rodando. Por favor, inicie o Docker primeiro."
    exit 1
fi

# Verificar se docker-compose está disponível
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose não está instalado. Por favor, instale o Docker Compose."
    exit 1
fi

echo "📦 Construindo e iniciando backend e infraestrutura..."
docker-compose up -d --build

echo ""
echo "⏳ Aguardando serviços iniciarem..."
sleep 10

echo ""
echo "✅ Backend iniciado com sucesso!"
echo ""
echo "🌐 URLs disponíveis:"
echo "   Backend API:  http://localhost:8800"
echo "   PostgreSQL:   localhost:5432"
echo "   Redis:        localhost:6379"
echo "   RabbitMQ:     http://localhost:15672"
echo "   MinIO:        http://localhost:9001"
echo ""
echo "🎨 Para iniciar o frontend (desenvolvimento):"
echo "   cd frontend && npm run dev"
echo ""
echo "🔍 Para ver os logs: docker-compose logs -f"
echo "🛑 Para parar: docker-compose down"
echo ""
echo "🎉 Backend está pronto para uso!" 