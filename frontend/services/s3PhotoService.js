/**
 * Serviço híbrido S3 + IndexedDB para fotos de perfil
 * - Prioriza S3 para sincronização entre dispositivos
 * - Usa IndexedDB como backup offline e cache rápido
 * - Migração gradual: S3 como principal, IndexedDB como fallback
 */

import imageStorageService from './imageStorage.service';

class S3PhotoService {
  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8800';
    this.useS3 = false; // Mude para true quando implementar backend S3
  }

  /**
   * Verificar se foto do usuário existe no S3
   */
  async hasS3Photo(userId) {
    if (!this.useS3) return false;
    
    try {
      const response = await fetch(`${this.baseUrl}/api/profile/photo-info/${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        return result.success && result.data?.hasPhoto;
      }
      return false;
    } catch (error) {
      console.error('❌ [S3Photo] Erro ao verificar foto S3:', error);
      return false;
    }
  }

  /**
   * Upload de foto para S3
   */
  async uploadToS3(userId, file) {
    if (!this.useS3) {
      console.log('📸 [S3Photo] S3 desabilitado, usando IndexedDB apenas');
      return null;
    }

    try {
      const formData = new FormData();
      formData.append('photo', file);

      const response = await fetch(`${this.baseUrl}/api/profile/upload-photo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          console.log('✅ [S3Photo] Upload para S3 bem-sucedido:', result.data.url);
          return result.data.url;
        }
      }
      
      console.error('❌ [S3Photo] Falha no upload para S3');
      return null;
    } catch (error) {
      console.error('❌ [S3Photo] Erro no upload S3:', error);
      return null;
    }
  }

  /**
   * Buscar URL da foto no S3
   */
  async getS3PhotoUrl(userId) {
    if (!this.useS3) return null;

    try {
      const response = await fetch(`${this.baseUrl}/api/profile/photo-url/${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data?.url) {
          console.log('✅ [S3Photo] URL S3 obtida:', result.data.url);
          return result.data.url;
        }
      }
      return null;
    } catch (error) {
      console.error('❌ [S3Photo] Erro ao obter URL S3:', error);
      return null;
    }
  }

  /**
   * Salvar foto com estratégia híbrida
   * 1. Tenta salvar no S3 (se habilitado)
   * 2. Sempre salva no IndexedDB como backup/cache
   * 3. Retorna a URL de melhor qualidade disponível
   */
  async saveProfilePhoto(userId, file) {
    try {
      // Sempre salvar no IndexedDB primeiro (backup + cache rápido)
      const dataUrl = await imageStorageService.fileToDataUrl(file);
      const localData = await imageStorageService.saveProfileImage(userId, file, dataUrl);
      
      let s3Url = null;
      
      // Tentar salvar no S3 se habilitado
      if (this.useS3) {
        console.log('🌐 [S3Photo] Tentando upload para S3...');
        s3Url = await this.uploadToS3(userId, file);
        
        if (s3Url) {
          // S3 funcionou - usar URL do S3 como principal
          console.log('✅ [S3Photo] Foto salva em S3 + IndexedDB backup');
          return {
            success: true,
            url: s3Url,
            source: 's3',
            hasLocalBackup: !!localData
          };
        } else {
          console.warn('⚠️ [S3Photo] Falha no S3, usando IndexedDB apenas');
        }
      }
      
      // S3 falhou ou desabilitado - usar IndexedDB
      if (localData) {
        console.log('💾 [S3Photo] Foto salva no IndexedDB');
        return {
          success: true,
          url: dataUrl,
          source: 'indexeddb',
          hasLocalBackup: true
        };
      }
      
      throw new Error('Falha ao salvar em ambos S3 e IndexedDB');
    } catch (error) {
      console.error('❌ [S3Photo] Erro ao salvar foto:', error);
      throw error;
    }
  }

  /**
   * Carregar foto com estratégia híbrida
   * 1. Tenta buscar do S3 (mais recente)
   * 2. Fallback para IndexedDB (cache local)
   * 3. Retorna a melhor versão disponível
   */
  async loadProfilePhoto(userId) {
    try {
      let photoUrl = null;
      let source = null;

      // Prioridade 1: S3 (se habilitado e disponível)
      if (this.useS3) {
        console.log('🌐 [S3Photo] Buscando foto no S3...');
        photoUrl = await this.getS3PhotoUrl(userId);
        if (photoUrl) {
          source = 's3';
          console.log('✅ [S3Photo] Foto carregada do S3');
          
          // TODO: Opcionalmente, atualizar cache IndexedDB com versão S3
          // Isso manteria sincronização entre dispositivos
          
          return { url: photoUrl, source };
        } else {
          console.log('📦 [S3Photo] Nenhuma foto encontrada no S3, tentando IndexedDB...');
        }
      }

      // Prioridade 2: IndexedDB (backup/cache local)
      const localImage = await imageStorageService.getProfileImage(userId);
      if (localImage && localImage.dataUrl) {
        photoUrl = localImage.dataUrl;
        source = 'indexeddb';
        console.log('💾 [S3Photo] Foto carregada do IndexedDB');
        return { url: photoUrl, source };
      }

      console.log('📭 [S3Photo] Nenhuma foto encontrada');
      return { url: null, source: null };
    } catch (error) {
      console.error('❌ [S3Photo] Erro ao carregar foto:', error);
      
      // Fallback final: tentar apenas IndexedDB
      try {
        const localImage = await imageStorageService.getProfileImage(userId);
        if (localImage && localImage.dataUrl) {
          return { url: localImage.dataUrl, source: 'indexeddb' };
        }
      } catch (fallbackError) {
        console.error('❌ [S3Photo] Fallback IndexedDB também falhou:', fallbackError);
      }
      
      return { url: null, source: null };
    }
  }

  /**
   * Remover foto (S3 + IndexedDB)
   */
  async removeProfilePhoto(userId) {
    let s3Removed = false;
    let indexedDBRemoved = false;

    // Remover do S3 se habilitado
    if (this.useS3) {
      try {
        const response = await fetch(`${this.baseUrl}/api/profile/delete-photo/${userId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        });
        
        if (response.ok) {
          s3Removed = true;
          console.log('🗑️ [S3Photo] Foto removida do S3');
        }
      } catch (error) {
        console.error('❌ [S3Photo] Erro ao remover foto do S3:', error);
      }
    }

    // Sempre remover do IndexedDB
    try {
      indexedDBRemoved = await imageStorageService.removeProfileImage(userId);
      if (indexedDBRemoved) {
        console.log('🗑️ [S3Photo] Foto removida do IndexedDB');
      }
    } catch (error) {
      console.error('❌ [S3Photo] Erro ao remover foto do IndexedDB:', error);
    }

    return {
      success: s3Removed || indexedDBRemoved,
      s3Removed,
      indexedDBRemoved
    };
  }

  /**
   * Migrar fotos do IndexedDB para S3 (função utilitária)
   */
  async migrateToS3(userId) {
    if (!this.useS3) {
      console.log('📸 [S3Photo] S3 desabilitado, migração não disponível');
      return false;
    }

    try {
      // Verificar se já tem no S3
      const hasS3 = await this.hasS3Photo(userId);
      if (hasS3) {
        console.log('✅ [S3Photo] Foto já existe no S3, migração desnecessária');
        return true;
      }

      // Buscar do IndexedDB
      const localImage = await imageStorageService.getProfileImage(userId);
      if (!localImage || !localImage.file) {
        console.log('📭 [S3Photo] Nenhuma foto local para migrar');
        return false;
      }

      // Upload para S3
      const s3Url = await this.uploadToS3(userId, localImage.file);
      if (s3Url) {
        console.log('✅ [S3Photo] Migração para S3 bem-sucedida');
        return true;
      }

      console.error('❌ [S3Photo] Falha na migração para S3');
      return false;
    } catch (error) {
      console.error('❌ [S3Photo] Erro na migração:', error);
      return false;
    }
  }

  /**
   * Configurar uso do S3 (para ativar/desativar dinamicamente)
   */
  setS3Enabled(enabled) {
    this.useS3 = enabled;
    console.log(`🔧 [S3Photo] S3 ${enabled ? 'habilitado' : 'desabilitado'}`);
  }

  /**
   * Obter estatísticas do serviço
   */
  async getStats(userId) {
    const stats = {
      s3Available: this.useS3,
      hasS3Photo: false,
      hasIndexedDBPhoto: false,
      recommendedAction: 'none'
    };

    if (this.useS3) {
      stats.hasS3Photo = await this.hasS3Photo(userId);
    }

    try {
      const localImage = await imageStorageService.getProfileImage(userId);
      stats.hasIndexedDBPhoto = !!(localImage && localImage.dataUrl);
    } catch (error) {
      // Ignora erro
    }

    // Recomendações
    if (this.useS3 && !stats.hasS3Photo && stats.hasIndexedDBPhoto) {
      stats.recommendedAction = 'migrate_to_s3';
    } else if (!this.useS3 && !stats.hasIndexedDBPhoto) {
      stats.recommendedAction = 'upload_new';
    }

    return stats;
  }
}

// Exportar instância única
const s3PhotoService = new S3PhotoService();

export default s3PhotoService;