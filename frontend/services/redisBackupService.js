/**
 * Serviço para backup de saldos por usuário no Redis (sem autenticação)
 * Usa endpoint público para sobreviver ao logout/login quando API está offline
 */

class RedisBackupService {
  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8800';
  }

  /**
   * Salvar backup dos saldos do usuário no Redis
   */
  async saveUserBalanceBackup(publicKey, balances) {
    try {
      if (typeof window === 'undefined' || !publicKey || !balances || !balances.balancesTable) {
        return false;
      }

      const response = await fetch(`${this.baseUrl}/api/backup/balance/${publicKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ balances })
      });

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('❌ [RedisBackup] Erro ao salvar backup:', error);
      return false;
    }
  }

  /**
   * Recuperar backup dos saldos do usuário do Redis
   */
  async getUserBalanceBackup(publicKey) {
    try {
      if (typeof window === 'undefined' || !publicKey) return null;

      const response = await fetch(`${this.baseUrl}/api/backup/balance/${publicKey}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        return null;
      }

      const result = await response.json();
      
      if (result.success && result.data && result.data.balancesTable) {
        return result.data;
      }
      
      return null;
    } catch (error) {
      console.error('❌ [RedisBackup] Erro ao recuperar backup:', error);
      return null;
    }
  }

  /**
   * Remover backup do usuário do Redis
   */
  async removeUserBalanceBackup(publicKey) {
    try {
      if (typeof window === 'undefined' || !publicKey) return false;

      const response = await fetch(`${this.baseUrl}/api/backup/balance/${publicKey}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        return false;
      }

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('❌ [RedisBackup] Erro ao remover backup:', error);
      return false;
    }
  }

  /**
   * Obter estatísticas dos backups (não disponível em API pública)
   * Mantido para compatibilidade, mas retorna dados mockados
   */
  getBackupStats() {
    return {
      totalBackups: 'N/A (API pública)',
      backupKeys: []
    };
  }
}

// Exportar instância única
const redisBackupService = new RedisBackupService();

export default redisBackupService;