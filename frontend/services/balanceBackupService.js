/**
 * Serviço de Backup ULTRA ROBUSTO para Balances
 * 
 * OBJETIVO: NUNCA MOSTRAR SALDO 0, SEMPRE TER BACKUP DISPONÍVEL
 * 
 * Implementa múltiplas camadas de backup:
 * 1. localStorage (persistente entre sessões)
 * 2. sessionStorage (backup da sessão atual)  
 * 3. IndexedDB (backup de longo prazo)
 * 4. Valores hardcoded como último recurso
 */

const STORAGE_KEYS = {
  LOCAL_BACKUP: 'coinage_balance_backup_v3',
  SESSION_BACKUP: 'coinage_session_backup_v3',
  LAST_KNOWN: 'coinage_last_known_balances_v3',
  EMERGENCY_USED: 'coinage_emergency_used_v3'
};

// VALORES DE EMERGÊNCIA - ZERADOS PARA NOVOS USUÁRIOS
const EMERGENCY_BALANCES = {
  'AZE-t': '0.000000',
  'cBRL': '0.000000', 
  'STT': '0.000000'
};

class BalanceBackupService {
  constructor() {
    this.dbName = 'CoinageBalanceBackup';
    this.dbVersion = 1;
    this.storeName = 'balances';
    this.db = null;
    this.initIndexedDB();
    
  }

  // Inicializar IndexedDB (apenas client-side)
  async initIndexedDB() {
    // Verificar se está no client-side
    if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
      // console.warn('⚠️ [BalanceBackup] IndexedDB não disponível (SSR)');
      return;
    }
    
    try {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => {
        console.warn('⚠️ [BalanceBackup] IndexedDB não disponível');
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'userId' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
      
      request.onsuccess = (event) => {
        this.db = event.target.result;
      };
    } catch (error) {
      console.warn('⚠️ [BalanceBackup] Erro ao inicializar IndexedDB:', error);
    }
  }

  // SALVAR balances em TODOS os backups possíveis
  async saveBalances(userId, balances, source = 'api') {
    if (!balances || !balances.balancesTable || Object.keys(balances.balancesTable).length === 0) {
      return;
    }

    const backupData = {
      userId,
      balances,
      timestamp: Date.now(),
      source,
      savedAt: new Date().toISOString()
    };


    // 1. localStorage (persistente entre sessões)
    try {
      localStorage.setItem(STORAGE_KEYS.LOCAL_BACKUP, JSON.stringify(backupData));
      localStorage.setItem(STORAGE_KEYS.LAST_KNOWN, JSON.stringify(backupData));
    } catch (error) {
      console.warn('⚠️ [BalanceBackup] Erro ao salvar no localStorage:', error);
    }

    // 2. sessionStorage (sessão atual)
    try {
      sessionStorage.setItem(STORAGE_KEYS.SESSION_BACKUP, JSON.stringify(backupData));
    } catch (error) {
      console.warn('⚠️ [BalanceBackup] Erro ao salvar no sessionStorage:', error);
    }

    // 3. IndexedDB (longo prazo)
    try {
      await this.saveToIndexedDB(backupData);
    } catch (error) {
      console.warn('⚠️ [BalanceBackup] Erro ao salvar no IndexedDB:', error);
    }
  }

  // Salvar no IndexedDB
  async saveToIndexedDB(data) {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      const request = store.put(data);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // RECUPERAR balances com fallback ULTRA robusto
  async getBalances(userId) {
    // CRÍTICO: Se detectar mudança de usuário, limpar cache antigo primeiro
    this.clearStaleCache(userId);

    // 1. PRIMEIRO: sessionStorage (mais rápido)
    const sessionResult = this.trySessionStorage(userId);
    if (sessionResult) return sessionResult;

    // 2. SEGUNDO: localStorage (persistente)
    const localResult = this.tryLocalStorage(userId);
    if (localResult) return localResult;

    // 3. TERCEIRO: last known
    const lastKnownResult = this.tryLastKnown(userId);
    if (lastKnownResult) return lastKnownResult;

    // 4. QUARTO: IndexedDB
    const indexedResult = await this.tryIndexedDB(userId);
    if (indexedResult) return indexedResult;

    // 5. ÚLTIMO RECURSO: Valores de emergência (NUNCA FALHA)
    return this.getEmergencyBalances(userId);
  }

  // Limpar cache de outros usuários
  clearStaleCache(currentUserId) {
    try {
      // Verificar sessionStorage
      const sessionData = sessionStorage.getItem(STORAGE_KEYS.SESSION_BACKUP);
      if (sessionData) {
        const parsed = JSON.parse(sessionData);
        if (parsed.userId !== currentUserId) {
          sessionStorage.removeItem(STORAGE_KEYS.SESSION_BACKUP);
        }
      }

      // Verificar localStorage
      const localData = localStorage.getItem(STORAGE_KEYS.LOCAL_BACKUP);
      if (localData) {
        const parsed = JSON.parse(localData);
        if (parsed.userId !== currentUserId) {
          localStorage.removeItem(STORAGE_KEYS.LOCAL_BACKUP);
          localStorage.removeItem(STORAGE_KEYS.LAST_KNOWN);
        }
      }
    } catch (error) {
      console.warn('⚠️ [BalanceBackup] Erro ao limpar cache antigo:', error);
    }
  }

  // Tentar sessionStorage
  trySessionStorage(userId) {
    try {
      const sessionData = sessionStorage.getItem(STORAGE_KEYS.SESSION_BACKUP);
      if (sessionData) {
        const parsed = JSON.parse(sessionData);
        if (parsed.userId === userId && this.isValidBalanceData(parsed.balances)) {
          return {
            data: parsed.balances,
            source: 'session_backup',
            age: Date.now() - parsed.timestamp
          };
        }
      }
    } catch (error) {
      console.warn('⚠️ [BalanceBackup] Erro no sessionStorage:', error);
    }
    return null;
  }

  // Tentar localStorage
  tryLocalStorage(userId) {
    try {
      const localData = localStorage.getItem(STORAGE_KEYS.LOCAL_BACKUP);
      if (localData) {
        const parsed = JSON.parse(localData);
        if (parsed.userId === userId && this.isValidBalanceData(parsed.balances)) {
          return {
            data: parsed.balances,
            source: 'local_backup',
            age: Date.now() - parsed.timestamp
          };
        }
      }
    } catch (error) {
      console.warn('⚠️ [BalanceBackup] Erro no localStorage:', error);
    }
    return null;
  }

  // Tentar last known
  tryLastKnown(userId) {
    try {
      const lastKnown = localStorage.getItem(STORAGE_KEYS.LAST_KNOWN);
      if (lastKnown) {
        const parsed = JSON.parse(lastKnown);
        if (parsed.userId === userId && this.isValidBalanceData(parsed.balances)) {
          return {
            data: parsed.balances,
            source: 'last_known',
            age: Date.now() - parsed.timestamp
          };
        }
      }
    } catch (error) {
      console.warn('⚠️ [BalanceBackup] Erro no last known:', error);
    }
    return null;
  }

  // Tentar IndexedDB
  async tryIndexedDB(userId) {
    try {
      const indexedData = await this.getFromIndexedDB(userId);
      if (indexedData && this.isValidBalanceData(indexedData.balances)) {
        return {
          data: indexedData.balances,
          source: 'indexed_db',
          age: Date.now() - indexedData.timestamp
        };
      }
    } catch (error) {
      console.warn('⚠️ [BalanceBackup] Erro no IndexedDB:', error);
    }
    return null;
  }

  // ÚLTIMO RECURSO: Valores de emergência (NUNCA FALHA)
  getEmergencyBalances(userId) {
    
    // Marcar que usou valores de emergência
    try {
      localStorage.setItem(STORAGE_KEYS.EMERGENCY_USED, JSON.stringify({
        userId,
        timestamp: Date.now(),
        reason: 'Todos os backups falharam'
      }));
    } catch {}

    return {
      data: {
        balancesTable: { ...EMERGENCY_BALANCES },
        network: 'testnet',
        address: '0x5528C065931f523CA9F3a6e49a911896fb1D2e6f',
        lastUpdated: new Date().toISOString(),
        source: 'emergency_backup',
        isEmergency: true
      },
      source: 'emergency',
      age: 0,
      isEmergency: true
    };
  }

  // Recuperar do IndexedDB
  async getFromIndexedDB(userId) {
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      
      const request = store.get(userId);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Validar se os dados de balance são válidos
  isValidBalanceData(balances) {
    const isValid = balances &&
           balances.balancesTable &&
           typeof balances.balancesTable === 'object' &&
           Object.keys(balances.balancesTable).length > 0;
    
    return isValid;
  }

  // Forçar uso dos valores de emergência (para teste)
  async forceEmergencyMode(userId) {
    return this.getEmergencyBalances(userId);
  }

  // Verificar se está usando valores de emergência
  isUsingEmergencyMode() {
    try {
      const emergencyData = localStorage.getItem(STORAGE_KEYS.EMERGENCY_USED);
      if (emergencyData) {
        const parsed = JSON.parse(emergencyData);
        const minutesAgo = (Date.now() - parsed.timestamp) / 1000 / 60;
        return minutesAgo < 60; // Considerar emergência se usado nos últimos 60 min
      }
    } catch {}
    return false;
  }

  // Limpar TODOS os backups (uso em logout)
  async clearAll(userId) {
    try {
      localStorage.removeItem(STORAGE_KEYS.LOCAL_BACKUP);
      localStorage.removeItem(STORAGE_KEYS.LAST_KNOWN);
      localStorage.removeItem(STORAGE_KEYS.EMERGENCY_USED);
      sessionStorage.removeItem(STORAGE_KEYS.SESSION_BACKUP);
      
      if (this.db) {
        const transaction = this.db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        store.delete(userId);
      }
      
    } catch (error) {
      console.warn('⚠️ [BalanceBackup] Erro ao limpar backups:', error);
    }
  }

  // Obter diagnóstico completo dos backups
  async getDiagnostic(userId) {
    const diagnostic = {
      hasSession: false,
      hasLocal: false,
      hasLastKnown: false,
      hasIndexedDB: false,
      isUsingEmergency: this.isUsingEmergencyMode(),
      emergencyAlwaysAvailable: true
    };

    try {
      const sessionData = sessionStorage.getItem(STORAGE_KEYS.SESSION_BACKUP);
      diagnostic.hasSession = !!(sessionData && JSON.parse(sessionData).userId === userId);
    } catch {}

    try {
      const localData = localStorage.getItem(STORAGE_KEYS.LOCAL_BACKUP);
      diagnostic.hasLocal = !!(localData && JSON.parse(localData).userId === userId);
    } catch {}

    try {
      const lastKnown = localStorage.getItem(STORAGE_KEYS.LAST_KNOWN);
      diagnostic.hasLastKnown = !!(lastKnown && JSON.parse(lastKnown).userId === userId);
    } catch {}

    try {
      const indexedData = await this.getFromIndexedDB(userId);
      diagnostic.hasIndexedDB = !!indexedData;
    } catch {}

    return diagnostic;
  }
}

export default new BalanceBackupService();