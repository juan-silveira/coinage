/**
 * Função de emergência para limpar TODO o cache do sistema
 * Use isso quando detectar problemas de cache entre usuários
 */
export const clearAllCache = () => {
  console.log('[CACHE] Iniciando limpeza completa de cache...');
  
  try {
    // 1. Limpar localStorage
    const localStorageKeys = Object.keys(localStorage);
    localStorageKeys.forEach(key => {
      // Preservar apenas configurações básicas não relacionadas a usuários
      if (!key.includes('theme') && !key.includes('language')) {
        localStorage.removeItem(key);
        console.log(`[CACHE] Removido do localStorage: ${key}`);
      }
    });
    
    // 2. Limpar sessionStorage
    const sessionStorageKeys = Object.keys(sessionStorage);
    sessionStorageKeys.forEach(key => {
      sessionStorage.removeItem(key);
      console.log(`[CACHE] Removido do sessionStorage: ${key}`);
    });
    
    // 3. Limpar IndexedDB
    if (typeof window !== 'undefined' && window.indexedDB) {
      const databases = [
        'CoinageBalanceBackup',
        'CoinageImages',
        'CoinageCache'
      ];
      
      databases.forEach(dbName => {
        indexedDB.deleteDatabase(dbName)
          .then(() => console.log(`[CACHE] IndexedDB ${dbName} deletado`))
          .catch(err => console.error(`[CACHE] Erro ao deletar ${dbName}:`, err));
      });
    }
    
    // 4. Limpar cookies (se acessível)
    if (document.cookie) {
      document.cookie.split(";").forEach(cookie => {
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        console.log(`[CACHE] Cookie removido: ${name}`);
      });
    }
    
    console.log('[CACHE] Limpeza completa de cache finalizada!');
    
    // 5. Recarregar a página para garantir estado limpo
    setTimeout(() => {
      window.location.href = '/login/coinage';
    }, 1000);
    
  } catch (error) {
    console.error('[CACHE] Erro durante limpeza de cache:', error);
  }
};

// Expor função globalmente para debug
if (typeof window !== 'undefined') {
  window.clearAllCache = clearAllCache;
}

export default clearAllCache;