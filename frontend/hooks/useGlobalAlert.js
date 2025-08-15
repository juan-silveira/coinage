/**
 * Hook para mostrar alerts globais usando o DOM diretamente
 * Funciona em qualquer lugar da aplicação, mesmo fora dos providers
 */

let alertContainer = null;
let alertIdCounter = 0;

const createAlertContainer = () => {
  if (alertContainer) return alertContainer;
  
  alertContainer = document.createElement('div');
  alertContainer.className = 'fixed top-4 right-4 z-[9999] space-y-2 max-w-md';
  alertContainer.id = 'global-alert-container';
  document.body.appendChild(alertContainer);
  
  return alertContainer;
};

const createAlert = (type, message, title = '', duration = 5000) => {
  const container = createAlertContainer();
  const alertId = `alert-${++alertIdCounter}`;
  
  const iconMap = {
    success: 'heroicons-outline:check-circle',
    error: 'heroicons-outline:x-circle',
    warning: 'heroicons-outline:exclamation-triangle',
    info: 'heroicons-outline:information-circle'
  };

  const colorMap = {
    success: 'bg-green-100 border-green-400 text-green-700 dark:bg-green-900 dark:border-green-600 dark:text-green-300',
    error: 'bg-red-100 border-red-400 text-red-700 dark:bg-red-900 dark:border-red-600 dark:text-red-300',
    warning: 'bg-yellow-100 border-yellow-400 text-yellow-700 dark:bg-yellow-900 dark:border-yellow-600 dark:text-yellow-300',
    info: 'bg-blue-100 border-blue-400 text-blue-700 dark:bg-blue-900 dark:border-blue-600 dark:text-blue-300'
  };

  const alertDiv = document.createElement('div');
  alertDiv.id = alertId;
  alertDiv.className = `border-l-4 p-4 rounded shadow-lg transition-all duration-300 ${colorMap[type]}`;
  
  alertDiv.innerHTML = `
    <div class="flex items-start space-x-3">
      <div class="flex-1">
        ${title ? `<div class="font-medium text-sm mb-1">${title}</div>` : ''}
        <div class="text-sm">${message}</div>
      </div>
      <button onclick="document.getElementById('${alertId}').remove()" class="text-lg font-bold hover:opacity-70">
        ×
      </button>
    </div>
  `;

  container.appendChild(alertDiv);

  // Auto-dismiss
  if (duration > 0) {
    setTimeout(() => {
      const element = document.getElementById(alertId);
      if (element) {
        element.style.opacity = '0';
        element.style.transform = 'translateX(100%)';
        setTimeout(() => element.remove(), 300);
      }
    }, duration);
  }

  return alertId;
};

const useGlobalAlert = () => {
  const showSuccess = (message, title = 'Sucesso') => {
    return createAlert('success', message, title);
  };

  const showError = (message, title = 'Erro') => {
    return createAlert('error', message, title, 0); // Não remove automaticamente
  };

  const showWarning = (message, title = 'Aviso') => {
    return createAlert('warning', message, title);
  };

  const showInfo = (message, title = 'Informação') => {
    return createAlert('info', message, title);
  };

  const clearAll = () => {
    if (alertContainer) {
      alertContainer.innerHTML = '';
    }
  };

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    clearAll
  };
};

export default useGlobalAlert;