"use client";
import React, { useState, useEffect } from 'react';
import { getNotificationSoundService } from '@/services/notificationSoundService';

const NotificationSoundSettings = ({ isOpen, onClose }) => {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [volume, setVolume] = useState(0.5);
  const [soundService, setSoundService] = useState(null);

  useEffect(() => {
    const service = getNotificationSoundService();
    if (service) {
      setSoundService(service);
      const settings = service.getSettings();
      setSoundEnabled(settings.soundEnabled);
      setVolume(settings.volume);
    }
  }, []);

  const handleSoundToggle = (enabled) => {
    setSoundEnabled(enabled);
    if (soundService) {
      soundService.setSoundEnabled(enabled);
    }
  };

  const handleVolumeChange = (newVolume) => {
    setVolume(newVolume);
    if (soundService) {
      soundService.setVolume(newVolume);
    }
  };

  const handleTestSound = () => {
    if (soundService) {
      soundService.testSound();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-96 max-w-sm mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            🔊 Configurações de Som
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {/* Toggle Som */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Habilitar som das notificações
            </label>
            <button
              onClick={() => handleSoundToggle(!soundEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                soundEnabled ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  soundEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Volume */}
          {soundEnabled && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Volume ({Math.round(volume * 100)}%)
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          )}

          {/* Botão de Teste */}
          {soundEnabled && (
            <div className="pt-2">
              <button
                onClick={handleTestSound}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                🧪 Testar Som
              </button>
            </div>
          )}

          {/* Informações */}
          <div className="text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-600">
            <p>• O som toca apenas 1x por grupo de notificações</p>
            <p>• Intervalo mínimo de 2 segundos entre sons</p>
            <p>• As configurações são salvas automaticamente</p>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationSoundSettings;