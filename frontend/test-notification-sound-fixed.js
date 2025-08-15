// Script para testar som de notificação após correção
// Execute no console do navegador quando estiver logado no sistema

console.log('🧪 Teste de Som de Notificação - Versão Corrigida');

// Função para testar som de notificação diretamente
function testNotificationSound() {
  console.log('🔊 Testando som de notificação...');
  
  // Simular uma notificação de balance change
  const testNotification = {
    id: 'test-sound-' + Date.now(),
    title: '💰 Teste de Som - AZE-t',
    message: 'Seu saldo de AZE-t aumentou em 1.000000. Novo saldo: 10.000000',
    type: 'balance_increase',
    data: {
      token: 'AZE-t',
      change: '1.000000',
      newBalance: '10.000000',
      changeType: 'increase'
    },
    createdAt: new Date().toISOString(),
    isRead: false
  };
  
  // Disparar evento que deveria tocar o som
  window.dispatchEvent(new CustomEvent('notificationCreated', { 
    detail: { notification: testNotification } 
  }));
  
  console.log('✅ Evento de notificação disparado:', testNotification);
}

// Função para verificar configurações de som
function checkSoundSettings() {
  console.log('🔧 Verificando configurações de som...');
  
  // Verificar se o serviço de som existe
  const soundEnabled = localStorage.getItem('notification_sound_enabled');
  const soundVolume = localStorage.getItem('notification_sound_volume');
  
  console.log('📋 Configurações encontradas:', {
    soundEnabled: soundEnabled !== null ? soundEnabled : 'não definido (padrão: true)',
    volume: soundVolume !== null ? soundVolume : 'não definido (padrão: 0.5)'
  });
  
  // Verificar se o arquivo de som existe
  const audio = new Audio('/assets/sounds/notification.mp3');
  audio.addEventListener('canplaythrough', () => {
    console.log('✅ Arquivo de som carregado com sucesso');
  });
  audio.addEventListener('error', (error) => {
    console.error('❌ Erro ao carregar arquivo de som:', error);
  });
  
  return {
    soundEnabled: soundEnabled !== 'false',
    volume: parseFloat(soundVolume) || 0.5
  };
}

// Função para forçar habilitação do som
function enableSound() {
  console.log('🔊 Forçando habilitação do som...');
  localStorage.setItem('notification_sound_enabled', 'true');
  localStorage.setItem('notification_sound_volume', '0.7');
  console.log('✅ Som habilitado com volume 0.7');
}

// Função para testar som direto (bypass do sistema)
function testDirectSound() {
  console.log('🎵 Testando som direto...');
  
  const audio = new Audio('/assets/sounds/notification.mp3');
  audio.volume = 0.7;
  
  const playPromise = audio.play();
  
  if (playPromise !== undefined) {
    playPromise
      .then(() => {
        console.log('✅ Som tocado com sucesso!');
      })
      .catch(error => {
        console.error('❌ Erro ao tocar som:', error);
        console.log('💡 Dica: Talvez seja necessário interação do usuário primeiro');
      });
  }
}

// Executar testes
console.log('\n=== EXECUTANDO TESTES ===\n');

// 1. Verificar configurações
const settings = checkSoundSettings();

// 2. Habilitar som se necessário
enableSound();

// 3. Testar som direto primeiro
console.log('\n--- Teste 1: Som Direto ---');
testDirectSound();

// 4. Aguardar um pouco e testar via sistema de notificações
setTimeout(() => {
  console.log('\n--- Teste 2: Via Sistema de Notificações ---');
  testNotificationSound();
}, 2000);

console.log('\n=== INSTRUÇÕES ===');
console.log('1. Verifique se você ouve o som nos dois testes');
console.log('2. Se não ouvir, pode ser política do navegador (necessário clique do usuário)');
console.log('3. Clique em qualquer lugar da página e execute testDirectSound() novamente');
console.log('4. Para testar mudança de balance real, execute uma transação na blockchain');

// Exportar funções para uso manual
window.testNotificationSound = testNotificationSound;
window.testDirectSound = testDirectSound;
window.checkSoundSettings = checkSoundSettings;
window.enableSound = enableSound;