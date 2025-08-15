/**
 * Script para testar criação de notificação via API
 */

async function testCreateNotification() {
  try {
    console.log('🧪 Testando criação de notificação via API...');
    
    const apiPayload = {
      userId: '34290450-ce0d-46fc-a370-6ffa787ea6b9',
      title: '💰 Teste - Saldo AZE-t Aumentou',
      message: 'Seu saldo de AZE-t aumentou em 0.001000. Novo saldo: 0.946038',
      sender: 'coinage',
      data: {
        token: 'AZE-t',
        change: '0.001000',
        newBalance: '0.946038',
        changeType: 'increase'
      }
    };
    
    console.log('📤 Payload da notificação:', apiPayload);
    
    const response = await fetch('http://localhost:8800/api/notifications/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjM0MjkwNDUwLWNlMGQtNDZmYy1hMzcwLTZmZmE3ODdlYTZiOSIsImVtYWlsIjoiaXZhbi5hbGJlcnRvbkBuYXZpLmluZi5iciIsIm5hbWUiOiJJdmFuIEFsYmVydG9uIiwidHlwZSI6ImFjY2VzcyIsImlhdCI6MTc1NTIxMTk1NywiZXhwIjoxNzU1MjEyODU3LCJhdWQiOiJhem9yZS1jbGllbnQiLCJpc3MiOiJhem9yZS1hcGkifQ.pShbH0WcDrkj-sT8ulHDyFfUlJfvDYh8B1Alyn1Oidc'
      },
      body: JSON.stringify(apiPayload)
    });
    
    console.log('📈 Status da resposta:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Notificação criada com sucesso:', data);
      
      // Verificar se aparece na contagem
      setTimeout(async () => {
        const countResponse = await fetch('http://localhost:8800/api/notifications/unread-count', {
          headers: {
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjM0MjkwNDUwLWNlMGQtNDZmYy1hMzcwLTZmZmE3ODdlYTZiOSIsImVtYWlsIjoiaXZhbi5hbGJlcnRvbkBuYXZpLmluZi5iciIsIm5hbWUiOiJJdmFuIEFsYmVydG9uIiwidHlwZSI6ImFjY2VzcyIsImlhdCI6MTc1NTIxMTk1NywiZXhwIjoxNzU1MjEyODU3LCJhdWQiOiJhem9yZS1jbGllbnQiLCJpc3MiOiJhem9yZS1hcGkifQ.pShbH0WcDrkj-sT8ulHDyFfUlJfvDYh8B1Alyn1Oidc'
          }
        });
        
        if (countResponse.ok) {
          const countData = await countResponse.json();
          console.log('📊 Contagem de notificações não lidas:', countData.data?.count || 0);
        } else {
          console.error('❌ Erro ao buscar contagem. Status:', countResponse.status);
          const errorText = await countResponse.text();
          console.error('❌ Erro:', errorText);
        }
      }, 1000);
      
    } else {
      const errorText = await response.text();
      console.error('❌ Erro ao criar notificação. Status:', response.status);
      console.error('❌ Erro:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testCreateNotification();