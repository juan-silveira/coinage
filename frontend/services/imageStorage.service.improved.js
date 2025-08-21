/**
 * Service for handling image storage in the frontend
 * Uses IndexedDB for better performance with large files
 * Versão melhorada com tratamento robusto de erros
 */

class ImageStorageServiceImproved {
  constructor() {
    this.dbName = 'CoinageImages';
    this.dbVersion = 1;
    this.storeName = 'profilePhotos';
    this.db = null;
    this.isInitializing = false;
  }

  // Initialize IndexedDB with better error handling
  async initDB() {
    if (this.db && this.db.readyState !== 'closed') {
      return this.db;
    }

    if (this.isInitializing) {
      // Wait for current initialization to complete
      while (this.isInitializing) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      return this.db;
    }

    this.isInitializing = true;

    try {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open(this.dbName, this.dbVersion);

        request.onerror = () => {
          console.error('❌ [ImageStorage] Erro ao abrir IndexedDB:', request.error);
          this.isInitializing = false;
          reject(request.error);
        };

        request.onsuccess = () => {
          this.db = request.result;
          
          // Handle unexpected close
          this.db.onclose = () => {
            console.warn('⚠️ [ImageStorage] Conexão IndexedDB fechada inesperadamente');
            this.db = null;
          };

          this.db.onerror = (event) => {
            console.error('❌ [ImageStorage] Erro na conexão IndexedDB:', event.target.error);
          };

          this.isInitializing = false;
          // console.log('✅ [ImageStorage] IndexedDB inicializado com sucesso');
          resolve(this.db);
        };

        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          
          if (!db.objectStoreNames.contains(this.storeName)) {
            const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
            
            // Create index for userId
            store.createIndex('userId', 'userId', { unique: false });
            store.createIndex('timestamp', 'timestamp', { unique: false });
            store.createIndex('isProfilePhoto', 'isProfilePhoto', { unique: false });
            
            console.log('✅ [ImageStorage] Object store criado com sucesso');
          }
        };

        request.onblocked = () => {
          console.warn('⚠️ [ImageStorage] IndexedDB bloqueado - feche outras abas');
          reject(new Error('IndexedDB bloqueado - feche outras abas da aplicação'));
        };
      });
    } catch (error) {
      this.isInitializing = false;
      throw error;
    }
  }

  // Validate image file
  validateImage(file) {
    if (!file) {
      throw new Error('Nenhum arquivo selecionado');
    }

    // Check file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      throw new Error('Tipo de arquivo não suportado. Use JPG, PNG, GIF ou WebP.');
    }

    // Check file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error('Arquivo muito grande. Tamanho máximo: 5MB.');
    }
  }

  // Convert file to data URL
  fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  // Save profile image with retry logic
  async saveProfileImage(userId, file, imageDataUrl, retryCount = 0) {
    const maxRetries = 2;
    
    try {
      await this.initDB();

      if (!this.db || this.db.readyState === 'closed') {
        throw new Error('Banco de dados não disponível');
      }

      const imageData = {
        id: `profile_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: userId,
        filename: file.name,
        type: file.type,
        size: file.size,
        dataUrl: imageDataUrl,
        file: file, // Salvar file object para migração futura
        timestamp: new Date().toISOString(),
        isProfilePhoto: true
      };

      return new Promise((resolve, reject) => {
        let transaction;
        
        try {
          transaction = this.db.transaction([this.storeName], 'readwrite');
          
          // Transaction event handlers
          transaction.oncomplete = () => {
            console.log('✅ [ImageStorage] Foto de perfil salva com sucesso');
            resolve(imageData);
          };

          transaction.onerror = (event) => {
            const error = event.target.error;
            console.error('❌ [ImageStorage] Erro na transação:', error);
            
            // Retry logic for specific errors
            if ((error.name === 'InvalidStateError' || error.message.includes('database connection is closing')) && retryCount < maxRetries) {
              console.log(`🔄 [ImageStorage] Tentativa ${retryCount + 1}/${maxRetries + 1}...`);
              setTimeout(() => {
                this.saveProfileImage(userId, file, imageDataUrl, retryCount + 1)
                  .then(resolve)
                  .catch(reject);
              }, 500 * (retryCount + 1)); // Backoff
            } else {
              reject(error);
            }
          };

          transaction.onabort = (event) => {
            const error = event.target.error;
            console.error('❌ [ImageStorage] Transação abortada:', error);
            reject(new Error(`Transação abortada: ${error?.message || 'Motivo desconhecido'}`));
          };

          const store = transaction.objectStore(this.storeName);

          // Remove previous profile photos for this user
          const index = store.index('userId');
          const getAllRequest = index.getAll(userId);

          getAllRequest.onsuccess = () => {
            const existingPhotos = getAllRequest.result.filter(photo => photo.isProfilePhoto);
            
            // Delete old profile photos
            const deletePromises = existingPhotos.map(photo => {
              return new Promise((delResolve, delReject) => {
                const deleteRequest = store.delete(photo.id);
                deleteRequest.onsuccess = () => delResolve();
                deleteRequest.onerror = () => delReject(deleteRequest.error);
              });
            });

            // Wait for all deletions, then add new photo
            Promise.all(deletePromises).then(() => {
              const addRequest = store.add(imageData);
              
              addRequest.onsuccess = () => {
                console.log('✅ [ImageStorage] Nova foto adicionada');
              };
              
              addRequest.onerror = () => {
                console.error('❌ [ImageStorage] Erro ao adicionar foto:', addRequest.error);
                transaction.abort();
              };
            }).catch(error => {
              console.error('❌ [ImageStorage] Erro ao deletar fotos antigas:', error);
              transaction.abort();
            });
          };

          getAllRequest.onerror = () => {
            console.error('❌ [ImageStorage] Erro ao buscar fotos existentes:', getAllRequest.error);
            transaction.abort();
          };

        } catch (transactionError) {
          console.error('❌ [ImageStorage] Erro ao criar transação:', transactionError);
          reject(transactionError);
        }
      });

    } catch (error) {
      console.error('❌ [ImageStorage] Erro geral ao salvar imagem:', error);
      
      // Retry logic for database errors
      if (retryCount < maxRetries && (error.message.includes('database') || error.message.includes('connection'))) {
        console.log(`🔄 [ImageStorage] Tentativa ${retryCount + 1}/${maxRetries + 1} após erro geral...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return this.saveProfileImage(userId, file, imageDataUrl, retryCount + 1);
      }
      
      throw error;
    }
  }

  // Get profile image with retry logic
  async getProfileImage(userId) {
    try {
      await this.initDB();

      if (!this.db || this.db.readyState === 'closed') {
        console.warn('⚠️ [ImageStorage] Banco não disponível para leitura');
        return null;
      }

      return new Promise((resolve, reject) => {
        try {
          const transaction = this.db.transaction([this.storeName], 'readonly');
          
          transaction.onerror = (event) => {
            console.error('❌ [ImageStorage] Erro na transação de leitura:', event.target.error);
            resolve(null); // Return null instead of rejecting
          };

          const store = transaction.objectStore(this.storeName);
          const index = store.index('userId');
          
          const request = index.getAll(userId);
          
          request.onsuccess = () => {
            const photos = request.result.filter(photo => photo.isProfilePhoto);
            if (photos.length > 0) {
              // Return the most recent photo
              const latestPhoto = photos.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
              // console.log('✅ [ImageStorage] Foto de perfil carregada');
              resolve(latestPhoto);
            } else {
              console.log('📭 [ImageStorage] Nenhuma foto de perfil encontrada');
              resolve(null);
            }
          };
          
          request.onerror = () => {
            console.error('❌ [ImageStorage] Erro ao buscar foto:', request.error);
            resolve(null); // Return null instead of rejecting
          };
        } catch (transactionError) {
          console.error('❌ [ImageStorage] Erro ao criar transação de leitura:', transactionError);
          resolve(null);
        }
      });
    } catch (error) {
      console.error('❌ [ImageStorage] Erro geral ao carregar imagem:', error);
      return null; // Return null instead of throwing
    }
  }

  // Remove profile image
  async removeProfileImage(userId) {
    try {
      await this.initDB();

      if (!this.db || this.db.readyState === 'closed') {
        console.warn('⚠️ [ImageStorage] Banco não disponível para remoção');
        return false;
      }

      return new Promise((resolve, reject) => {
        try {
          const transaction = this.db.transaction([this.storeName], 'readwrite');
          
          transaction.oncomplete = () => {
            console.log('✅ [ImageStorage] Foto de perfil removida com sucesso');
            resolve(true);
          };

          transaction.onerror = (event) => {
            console.error('❌ [ImageStorage] Erro na transação de remoção:', event.target.error);
            resolve(false); // Return false instead of rejecting
          };

          const store = transaction.objectStore(this.storeName);
          const index = store.index('userId');
          
          const request = index.getAll(userId);
          request.onsuccess = () => {
            const photos = request.result.filter(photo => photo.isProfilePhoto);
            
            // Delete all profile photos for this user
            photos.forEach(photo => {
              store.delete(photo.id);
            });
            
            if (photos.length === 0) {
              console.log('📭 [ImageStorage] Nenhuma foto encontrada para remover');
            }
          };
          
          request.onerror = () => {
            console.error('❌ [ImageStorage] Erro ao buscar fotos para remoção:', request.error);
            transaction.abort();
          };
        } catch (transactionError) {
          console.error('❌ [ImageStorage] Erro ao criar transação de remoção:', transactionError);
          resolve(false);
        }
      });
    } catch (error) {
      console.error('❌ [ImageStorage] Erro geral ao remover imagem:', error);
      return false;
    }
  }

  // Get storage statistics
  async getStorageStats() {
    try {
      await this.initDB();

      if (!this.db || this.db.readyState === 'closed') {
        return { totalPhotos: 0, totalSize: 0, error: 'Database not available' };
      }

      return new Promise((resolve) => {
        try {
          const transaction = this.db.transaction([this.storeName], 'readonly');
          const store = transaction.objectStore(this.storeName);
          const request = store.getAll();
          
          request.onsuccess = () => {
            const photos = request.result;
            const totalSize = photos.reduce((sum, photo) => sum + (photo.size || 0), 0);
            
            resolve({
              totalPhotos: photos.length,
              totalSize,
              profilePhotos: photos.filter(p => p.isProfilePhoto).length
            });
          };
          
          request.onerror = () => {
            resolve({ totalPhotos: 0, totalSize: 0, error: request.error.message });
          };
        } catch (error) {
          resolve({ totalPhotos: 0, totalSize: 0, error: error.message });
        }
      });
    } catch (error) {
      return { totalPhotos: 0, totalSize: 0, error: error.message };
    }
  }

  // Clear all data (for debugging)
  async clearAllData() {
    try {
      await this.initDB();

      if (!this.db || this.db.readyState === 'closed') {
        throw new Error('Database not available');
      }

      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.storeName], 'readwrite');
        
        transaction.oncomplete = () => {
          console.log('✅ [ImageStorage] Todos os dados removidos');
          resolve(true);
        };

        transaction.onerror = (event) => {
          reject(event.target.error);
        };

        const store = transaction.objectStore(this.storeName);
        store.clear();
      });
    } catch (error) {
      console.error('❌ [ImageStorage] Erro ao limpar dados:', error);
      throw error;
    }
  }
}

// Export instance
const imageStorageServiceImproved = new ImageStorageServiceImproved();

export default imageStorageServiceImproved;