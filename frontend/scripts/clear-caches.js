// Utility para limpar todos os caches do frontend
// Execute no console do navegador: node scripts/clear-caches.js

if (typeof window !== 'undefined') {
  console.log('🧹 Limpando caches do frontend...');
  
  // 1. Limpar localStorage
  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.includes('balance') || key.includes('cache') || key.includes('auth') || key.includes('coinage')) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => {
      console.log(`🗑️  Removendo localStorage: ${key}`);
      localStorage.removeItem(key);
    });
    
    console.log(`✅ Removidas ${keysToRemove.length} chaves do localStorage`);
  } catch (error) {
    console.error('❌ Erro ao limpar localStorage:', error);
  }
  
  // 2. Limpar sessionStorage
  try {
    const sessionKeysToRemove = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key.includes('balance') || key.includes('cache') || key.includes('auth') || key.includes('coinage')) {
        sessionKeysToRemove.push(key);
      }
    }
    
    sessionKeysToRemove.forEach(key => {
      console.log(`🗑️  Removendo sessionStorage: ${key}`);
      sessionStorage.removeItem(key);
    });
    
    console.log(`✅ Removidas ${sessionKeysToRemove.length} chaves do sessionStorage`);
  } catch (error) {
    console.error('❌ Erro ao limpar sessionStorage:', error);
  }
  
  // 3. Limpar IndexedDB relacionados ao projeto
  if ('indexedDB' in window) {
    console.log('🗄️ Tentando limpar IndexedDB...');
    
    // Listar databases existentes
    if (indexedDB.databases) {
      indexedDB.databases().then(databases => {
        databases.forEach(db => {
          if (db.name.toLowerCase().includes('coinage') || db.name.toLowerCase().includes('balance')) {
            console.log(`🗑️  Deletando IndexedDB: ${db.name}`);
            const deleteReq = indexedDB.deleteDatabase(db.name);
            deleteReq.onsuccess = () => console.log(`✅ IndexedDB ${db.name} deletado`);
            deleteReq.onerror = (e) => console.error(`❌ Erro ao deletar ${db.name}:`, e);
          }
        });
      });
    }
  }
  
  // 4. Instruções para limpar cache do navegador
  console.log('\n🔧 Para limpar completamente os caches:');
  console.log('1. Pressione Ctrl+Shift+Del (Chrome/Firefox)');
  console.log('2. Selecione "Cache/Imagens em cache"');
  console.log('3. Clique em "Limpar dados"');
  console.log('4. Recarregue a página com Ctrl+F5');
  
  // 5. Forçar recarregamento da página
  console.log('\n🔄 Recarregando página em 3 segundos...');
  setTimeout(() => {
    window.location.reload(true);
  }, 3000);
  
} else {
  // Para execução via Node.js - criar um arquivo HTML de teste
  console.log('📝 Criando utilitário de limpeza...');
  
  const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Cache Cleaner - Coinage</title>
</head>
<body>
    <h1>🧹 Limpeza de Cache - Coinage</h1>
    <p>Abra o console do navegador (F12) para ver o resultado.</p>
    
    <button onclick="clearAllCaches()">🗑️ Limpar Todos os Caches</button>
    
    <script>
        function clearAllCaches() {
            console.log('🧹 Limpando caches do frontend...');
            
            // Limpar localStorage
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (key.includes('balance') || key.includes('cache') || key.includes('auth') || key.includes('coinage'))) {
                    keysToRemove.push(key);
                }
            }
            
            keysToRemove.forEach(key => {
                console.log('🗑️  Removendo localStorage:', key);
                localStorage.removeItem(key);
            });
            
            console.log('✅ LocalStorage limpo:', keysToRemove.length + ' itens removidos');
            
            // Limpar sessionStorage
            const sessionKeysToRemove = [];
            for (let i = 0; i < sessionStorage.length; i++) {
                const key = sessionStorage.key(i);
                if (key && (key.includes('balance') || key.includes('cache') || key.includes('auth') || key.includes('coinage'))) {
                    sessionKeysToRemove.push(key);
                }
            }
            
            sessionKeysToRemove.forEach(key => {
                console.log('🗑️  Removendo sessionStorage:', key);
                sessionStorage.removeItem(key);
            });
            
            console.log('✅ SessionStorage limpo:', sessionKeysToRemove.length + ' itens removidos');
            
            // Forçar recarregamento
            alert('Caches limpos! Recarregando página...');
            window.location.reload(true);
        }
    </script>
</body>
</html>
  `;
  
  require('fs').writeFileSync('./cache-cleaner.html', htmlContent);
  console.log('✅ Arquivo cache-cleaner.html criado!');
  console.log('📖 Abra o arquivo no navegador e clique no botão para limpar caches.');
}