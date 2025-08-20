// Script para limpar cache de autenticação no localStorage
// Execute no console do navegador: node clear-auth-cache.js

console.log('🧹 Limpando cache de autenticação...');

// Limpar localStorage do auth store
if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('auth-storage');
    console.log('✅ auth-storage removido do localStorage');
}

// Limpar sessionStorage
if (typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem('showLoginSuccess');
    sessionStorage.removeItem('loginUserName');  
    sessionStorage.removeItem('currentLoginCompany');
    sessionStorage.removeItem('showLogoutSuccess');
    console.log('✅ sessionStorage limpo');
}

console.log('🎉 Cache de autenticação limpo! Faça login novamente.');

// Para usar no browser, copie e cole no console:
/*
localStorage.removeItem('auth-storage');
sessionStorage.removeItem('showLoginSuccess');
sessionStorage.removeItem('loginUserName');
sessionStorage.removeItem('currentLoginCompany');  
sessionStorage.removeItem('showLogoutSuccess');
console.log('✅ Cache limpo! Recarregue a página e faça login novamente.');
*/