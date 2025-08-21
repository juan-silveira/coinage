/**
 * Service for handling image storage in the frontend
 * Uses IndexedDB for better performance with large files
 * Easily replaceable with S3 service in the future
 */

class ImageStorageService {
  constructor() {
    this.dbName = 'CoinageImages';
    this.dbVersion = 1;
    this.storeName = 'profilePhotos';
    this.db = null;
  }

  // Initialize IndexedDB
  async initDB() {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          store.createIndex('userId', 'userId', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  // Save image to local storage
  async saveProfileImage(userId, file, imageDataUrl) {
    try {
      await this.initDB();

      const imageData = {
        id: `profile_${userId}_${Date.now()}`,
        userId: userId,
        filename: file.name,
        type: file.type,
        size: file.size,
        dataUrl: imageDataUrl,
        timestamp: new Date().toISOString(),
        isProfilePhoto: true
      };

      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);

        // Remove previous profile photo for this user
        const indexRequest = store.index('userId').getAll(userId);
        indexRequest.onsuccess = () => {
          const existingPhotos = indexRequest.result.filter(photo => photo.isProfilePhoto);
          
          // Delete old profile photos
          existingPhotos.forEach(photo => {
            store.delete(photo.id);
          });

          // Add new photo
          const addRequest = store.add(imageData);
          addRequest.onsuccess = () => resolve(imageData);
          addRequest.onerror = () => reject(addRequest.error);
        };

        indexRequest.onerror = () => reject(indexRequest.error);
      });
    } catch (error) {
      console.error('Error saving image to local storage:', error);
      throw error;
    }
  }

  // Get profile image for user
  async getProfileImage(userId) {
    try {
      await this.initDB();

      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        const index = store.index('userId');
        
        const request = index.getAll(userId);
        request.onsuccess = () => {
          const photos = request.result.filter(photo => photo.isProfilePhoto);
          if (photos.length > 0) {
            // Return the most recent photo
            const latestPhoto = photos.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
            resolve(latestPhoto);
          } else {
            resolve(null);
          }
        };
        
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error getting image from local storage:', error);
      return null;
    }
  }

  // Remove profile image for user
  async removeProfileImage(userId) {
    try {
      await this.initDB();

      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const index = store.index('userId');
        
        const request = index.getAll(userId);
        request.onsuccess = () => {
          const photos = request.result.filter(photo => photo.isProfilePhoto);
          
          // Delete all profile photos for this user
          photos.forEach(photo => {
            store.delete(photo.id);
          });
          
          resolve(true);
        };
        
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error removing image from local storage:', error);
      throw error;
    }
  }

  // Get storage usage statistics
  async getStorageStats() {
    try {
      await this.initDB();

      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        
        const request = store.getAll();
        request.onsuccess = () => {
          const photos = request.result;
          const totalSize = photos.reduce((sum, photo) => sum + photo.size, 0);
          const totalCount = photos.length;
          
          resolve({
            totalCount,
            totalSize,
            totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2)
          });
        };
        
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error getting storage stats:', error);
      return { totalCount: 0, totalSize: 0, totalSizeMB: '0.00' };
    }
  }

  // Clear all stored images (useful for cleanup)
  async clearAllImages() {
    try {
      await this.initDB();

      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        
        const request = store.clear();
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error clearing images:', error);
      throw error;
    }
  }

  // Validate image file
  validateImage(file) {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      throw new Error('Tipo de arquivo inválido. Apenas JPG, PNG, GIF e WebP são permitidos.');
    }

    if (file.size > maxSize) {
      throw new Error('Arquivo muito grande. Máximo permitido: 5MB');
    }

    return true;
  }

  // Convert file to data URL
  async fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  }

  // Compress image if needed (optional, for better performance)
  async compressImage(file, maxWidth = 400, quality = 0.8) {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(resolve, file.type, quality);
      };

      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }
}

// Export singleton instance
const imageStorageService = new ImageStorageService();
export default imageStorageService;