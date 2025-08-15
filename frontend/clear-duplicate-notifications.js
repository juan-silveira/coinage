// Script para limpar notificações duplicadas no sistema
// Execute no console do navegador quando estiver logado

console.log('🧹 Script para Limpar Notificações Duplicadas');

async function clearDuplicateNotifications() {
  try {
    console.log('🔍 Buscando todas as notificações...');
    
    // Fazer requisição para buscar todas as notificações
    const response = await fetch('/api/notifications', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.success || !data.data) {
      throw new Error('Formato de resposta inválido');
    }
    
    const notifications = data.data;
    console.log(`📊 Total de notificações encontradas: ${notifications.length}`);
    
    // Agrupar por conteúdo similar (título + mensagem + data próxima)
    const groups = {};
    const duplicates = [];
    
    notifications.forEach(notification => {
      // Criar chave baseada no conteúdo essencial
      const key = `${notification.title.trim()}_${notification.message.trim()}`;
      
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(notification);
    });
    
    // Identificar duplicatas (grupos com mais de 1 item)
    Object.keys(groups).forEach(key => {
      const group = groups[key];
      if (group.length > 1) {
        // Ordenar por data de criação (mais recente primeiro)
        group.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        // Manter apenas a primeira (mais recente), marcar outras como duplicatas
        for (let i = 1; i < group.length; i++) {
          duplicates.push(group[i]);
        }
        
        console.log(`🔍 Grupo "${key.substring(0, 50)}...": ${group.length} notificações (${group.length - 1} duplicatas)`);
      }
    });
    
    console.log(`📋 Total de duplicatas encontradas: ${duplicates.length}`);
    
    if (duplicates.length === 0) {
      console.log('✅ Nenhuma duplicata encontrada!');
      return;
    }
    
    // Confirmar antes de excluir
    const confirmDelete = confirm(`Foram encontradas ${duplicates.length} notificações duplicadas.\n\nDeseja excluí-las?`);
    
    if (!confirmDelete) {
      console.log('❌ Operação cancelada pelo usuário');
      return;
    }
    
    console.log('🗑️ Excluindo notificações duplicadas...');
    
    // Excluir em lotes para evitar sobrecarregar o servidor
    const batchSize = 10;
    let deleted = 0;
    
    for (let i = 0; i < duplicates.length; i += batchSize) {
      const batch = duplicates.slice(i, i + batchSize);
      const promises = batch.map(notification => 
        fetch(`/api/notifications/${notification.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        })
      );
      
      try {
        const results = await Promise.all(promises);
        const successful = results.filter(r => r.ok).length;
        deleted += successful;
        
        console.log(`✅ Lote ${Math.floor(i/batchSize) + 1}: ${successful}/${batch.length} notificações excluídas`);
      } catch (batchError) {
        console.error(`❌ Erro no lote ${Math.floor(i/batchSize) + 1}:`, batchError);
      }
      
      // Pequeno delay entre lotes
      if (i + batchSize < duplicates.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    console.log(`✅ Processo concluído! ${deleted}/${duplicates.length} notificações duplicadas foram excluídas.`);
    
    // Limpar cache local de notificações para forçar refresh
    localStorage.removeItem('balanceSync_notifications_sent');
    
    // Disparar evento para atualizar interface
    window.dispatchEvent(new CustomEvent('notificationRefresh'));
    
    console.log('🔄 Cache limpo e interface atualizada');
    
  } catch (error) {
    console.error('❌ Erro ao limpar notificações duplicadas:', error);
    alert('Erro ao limpar notificações: ' + error.message);
  }
}

// Função para limpar apenas cache local (mais rápido)
function clearNotificationCache() {
  console.log('🧹 Limpando cache local de notificações...');
  localStorage.removeItem('balanceSync_notifications_sent');
  console.log('✅ Cache local limpo');
}

// Executar automaticamente
console.log('\n=== OPÇÕES DISPONÍVEIS ===');
console.log('1. clearDuplicateNotifications() - Limpa notificações duplicadas do backend');
console.log('2. clearNotificationCache() - Limpa apenas cache local');
console.log('\n=== EXECUTANDO LIMPEZA AUTOMÁTICA ===\n');

// Limpar cache local primeiro
clearNotificationCache();

// Perguntar se quer limpar duplicatas do backend
if (confirm('Deseja verificar e limpar notificações duplicadas no servidor?\n\nIsso pode demorar alguns segundos.')) {
  clearDuplicateNotifications();
} else {
  console.log('✅ Cache local limpo. Para limpar duplicatas do servidor, execute: clearDuplicateNotifications()');
}

// Exportar funções para uso manual
window.clearDuplicateNotifications = clearDuplicateNotifications;
window.clearNotificationCache = clearNotificationCache;