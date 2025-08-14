/**
 * Script para testar o fluxo completo de notificações de balance
 */

async function testNotificationFlow() {
  try {
    console.log('🧪 Testando fluxo completo de notificações...');
    
    // 1. Criar uma notificação via API (simula detecção de mudança)
    const apiPayload = {
      userId: '34290450-ce0d-46fc-a370-6ffa787ea6b9',
      title: '💰 Saldo AZE-t Aumentou',
      message: 'Seu saldo de AZE-t aumentou em 0.001000. Novo saldo: 0.946038',
      sender: 'coinage',
      data: {
        token: 'AZE-t',
        change: '0.001000',
        newBalance: '0.946038',
        changeType: 'increase'
      }
    };
    
    console.log('📤 1. Criando notificação...');
    
    // Simular criação usando um token novo (você precisa pegar um token válido do seu login)
    const createResponse = await fetch('http://localhost:8800/api/notifications/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // VOCÊ PRECISA ATUALIZAR ESTE TOKEN COM UM VÁLIDO
        'Authorization': 'Bearer SEU_TOKEN_AQUI'
      },
      body: JSON.stringify(apiPayload)
    });
    
    if (createResponse.ok) {
      const createData = await createResponse.json();
      console.log('✅ Notificação criada:', createData.data.id);
      
      // 2. Verificar se aparece na contagem
      console.log('📊 2. Verificando contagem...');
      
      const countResponse = await fetch('http://localhost:8800/api/notifications/unread-count', {
        headers: {
          'Authorization': 'Bearer SEU_TOKEN_AQUI'
        }
      });
      
      if (countResponse.ok) {
        const countData = await countResponse.json();
        console.log('📈 Contagem atual:', countData.data?.count || 0);
        
        // 3. Buscar lista de notificações
        console.log('📋 3. Buscando lista de notificações...');
        
        const listResponse = await fetch('http://localhost:8800/api/notifications/unread', {
          headers: {
            'Authorization': 'Bearer SEU_TOKEN_AQUI'
          }
        });
        
        if (listResponse.ok) {
          const listData = await listResponse.json();
          console.log('📝 Notificações não lidas:', listData.data?.length || 0);
          
          if (listData.data?.length > 0) {
            console.log('🔔 Última notificação:');
            console.log('  📄 Título:', listData.data[0].title);
            console.log('  💬 Mensagem:', listData.data[0].message);
            console.log('  📅 Data:', listData.data[0].createdAt);
          }
        }
      }
    } else {
      console.error('❌ Erro ao criar notificação:', createResponse.status);
      const errorText = await createResponse.text();
      console.error('❌ Detalhes:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

console.log('ℹ️  AVISO: Você precisa atualizar o token no arquivo antes de executar');
console.log('ℹ️  Faça login no frontend e copie o token do localStorage ou Network tab');

// testNotificationFlow();