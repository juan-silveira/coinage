/**
 * Serviço de áudio para notificações
 * Gerencia a reprodução de sons de notificação com controle de batch
 */
class NotificationSoundService {
  constructor() {
    this.audio = null;
    this.soundPath = '/assets/sounds/notification.mp3';
    this.isPlaying = false;
    this.lastPlayTime = 0;
    this.minIntervalBetweenSounds = 2000; // 2 segundos mínimo entre sons
    this.soundEnabled = true;
    this.volume = 0.5;
    
    this.initializeAudio();
    this.loadSettings();
  }

  /**
   * Inicializar objeto de áudio
   */
  initializeAudio() {
    try {
      this.audio = new Audio(this.soundPath);
      this.audio.volume = this.volume;
      this.audio.preload = 'auto';
      
      // Event listeners para controle
      this.audio.addEventListener('ended', () => {
        this.isPlaying = false;
      });
      
      this.audio.addEventListener('error', (error) => {
        console.warn('⚠️ Erro ao carregar som de notificação:', error);
      });
      
      console.log('🔊 Serviço de som de notificação inicializado');
    } catch (error) {
      console.warn('⚠️ Não foi possível inicializar áudio:', error);
    }
  }

  /**
   * Carregar configurações do localStorage
   */
  loadSettings() {
    try {
      const soundEnabled = localStorage.getItem('notification_sound_enabled');
      const volume = localStorage.getItem('notification_sound_volume');
      
      if (soundEnabled !== null) {
        this.soundEnabled = soundEnabled === 'true';
      }
      
      if (volume !== null) {
        this.volume = parseFloat(volume);
        if (this.audio) {
          this.audio.volume = this.volume;
        }
      }
    } catch (error) {
      console.warn('⚠️ Erro ao carregar configurações de som:', error);
    }
  }

  /**
   * Salvar configurações no localStorage
   */
  saveSettings() {
    try {
      localStorage.setItem('notification_sound_enabled', this.soundEnabled.toString());
      localStorage.setItem('notification_sound_volume', this.volume.toString());
    } catch (error) {
      console.warn('⚠️ Erro ao salvar configurações de som:', error);
    }
  }

  /**
   * Tocar som de notificação (apenas 1x por batch)
   * @param {number} notificationCount - Número de notificações no batch
   */
  playNotificationSound(notificationCount = 1) {
    // Verificar se está habilitado
    if (!this.soundEnabled) {
      console.log('🔇 Som de notificação desabilitado');
      return false;
    }

    // Verificar se já está tocando
    if (this.isPlaying) {
      console.log('🔊 Som já está tocando, ignorando...');
      return false;
    }

    // Verificar intervalo mínimo
    const now = Date.now();
    if (now - this.lastPlayTime < this.minIntervalBetweenSounds) {
      console.log('🔊 Muito próximo do último som, ignorando...');
      return false;
    }

    // Verificar se áudio está disponível
    if (!this.audio) {
      console.warn('⚠️ Áudio não disponível');
      return false;
    }

    try {
      // Resetar áudio se necessário
      this.audio.currentTime = 0;
      
      // Tocar som
      const playPromise = this.audio.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            this.isPlaying = true;
            this.lastPlayTime = now;
            console.log(`🔊 Som de notificação tocado para ${notificationCount} notificação(ões)`);
          })
          .catch(error => {
            console.warn('⚠️ Erro ao tocar som:', error);
            this.isPlaying = false;
          });
      }
      
      return true;
    } catch (error) {
      console.warn('⚠️ Erro ao reproduzir som de notificação:', error);
      return false;
    }
  }

  /**
   * Habilitar/desabilitar som
   * @param {boolean} enabled
   */
  setSoundEnabled(enabled) {
    this.soundEnabled = !!enabled;
    this.saveSettings();
    console.log(`🔊 Som de notificação ${enabled ? 'habilitado' : 'desabilitado'}`);
  }

  /**
   * Definir volume (0.0 a 1.0)
   * @param {number} volume
   */
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, parseFloat(volume) || 0.5));
    
    if (this.audio) {
      this.audio.volume = this.volume;
    }
    
    this.saveSettings();
    console.log(`🔊 Volume definido para ${Math.round(this.volume * 100)}%`);
  }

  /**
   * Testar som
   */
  testSound() {
    console.log('🧪 Testando som de notificação...');
    return this.playNotificationSound(1);
  }

  /**
   * Obter configurações atuais
   */
  getSettings() {
    return {
      soundEnabled: this.soundEnabled,
      volume: this.volume,
      isPlaying: this.isPlaying
    };
  }

  /**
   * Verificar se o navegador suporta áudio
   */
  static isAudioSupported() {
    return typeof Audio !== 'undefined';
  }
}

// Instância singleton
let notificationSoundService = null;

/**
 * Obter instância do serviço de som
 */
export const getNotificationSoundService = () => {
  if (!notificationSoundService && NotificationSoundService.isAudioSupported()) {
    notificationSoundService = new NotificationSoundService();
  }
  return notificationSoundService;
};

export default NotificationSoundService;