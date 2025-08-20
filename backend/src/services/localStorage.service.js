const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');

/**
 * Local Storage Service 
 * Simula funcionalidades do AWS S3 para desenvolvimento
 * Estrutura preparada para migração futura para S3
 */
class LocalStorageService {
  constructor() {
    this.uploadsDir = path.join(__dirname, '../../uploads');
    this.baseUrl = process.env.APP_URL || 'http://localhost:8800';
    
    // Buckets simulados (como S3)
    this.buckets = {
      profilePictures: 'profile-pictures',
      documents: 'documents',
      temp: 'temp'
    };
    
    // Configurações de imagem
    this.imageConfig = {
      profilePicture: {
        maxWidth: 400,
        maxHeight: 400,
        quality: 85,
        format: 'jpeg'
      },
      document: {
        maxWidth: 1200,
        maxHeight: 1600,
        quality: 90,
        format: 'jpeg'
      }
    };
    
    this.allowedMimeTypes = {
      images: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
      documents: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
    };
  }

  /**
   * Inicializa o serviço criando as pastas necessárias
   */
  async init() {
    try {
      // Criar diretórios base
      await this.ensureDir(this.uploadsDir);
      
      // Criar "buckets" (pastas)
      for (const bucket of Object.values(this.buckets)) {
        await this.ensureDir(path.join(this.uploadsDir, bucket));
      }
      
      console.log('✅ LocalStorage Service initialized');
      return true;
    } catch (error) {
      console.error('❌ Error initializing LocalStorage Service:', error);
      return false;
    }
  }

  /**
   * Garante que um diretório existe
   */
  async ensureDir(dirPath) {
    try {
      await fs.access(dirPath);
    } catch (error) {
      if (error.code === 'ENOENT') {
        await fs.mkdir(dirPath, { recursive: true });
        console.log(`📁 Directory created: ${dirPath}`);
      }
    }
  }

  /**
   * Gera nome único para arquivo (similar ao S3)
   */
  generateFileName(originalName, userId, prefix = '') {
    const ext = path.extname(originalName).toLowerCase();
    const timestamp = Date.now();
    const randomId = crypto.randomBytes(8).toString('hex');
    const baseName = prefix ? `${prefix}_` : '';
    
    return `${userId}/${baseName}${timestamp}_${randomId}${ext}`;
  }

  /**
   * Processa imagem com Sharp (otimização)
   */
  async processImage(buffer, config) {
    try {
      const processed = await sharp(buffer)
        .resize(config.maxWidth, config.maxHeight, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ 
          quality: config.quality,
          progressive: true 
        })
        .toBuffer();

      return processed;
    } catch (error) {
      console.warn('⚠️ Image processing failed, using original:', error.message);
      return buffer;
    }
  }

  /**
   * Upload de foto de perfil
   * Simula S3.putObject()
   */
  async uploadProfilePicture(file, userId) {
    try {
      await this.init();

      // Validar tipo de arquivo
      if (!this.allowedMimeTypes.images.includes(file.mimetype)) {
        throw new Error('Tipo de arquivo inválido para foto de perfil');
      }

      // Gerar nome do arquivo
      const fileName = this.generateFileName(file.originalname, userId, 'profile');
      const fullPath = path.join(this.uploadsDir, this.buckets.profilePictures, fileName);
      
      // Garantir que o diretório do usuário existe
      const userDir = path.dirname(fullPath);
      await this.ensureDir(userDir);

      // Processar imagem
      const processedBuffer = await this.processImage(file.buffer, this.imageConfig.profilePicture);

      // Salvar arquivo
      await fs.writeFile(fullPath, processedBuffer);

      // Gerar URL pública
      const publicUrl = `${this.baseUrl}/uploads/${this.buckets.profilePictures}/${fileName}`;

      // Retornar resultado similar ao S3
      return {
        success: true,
        fileName: fileName,
        fullPath: fullPath,
        url: publicUrl,
        size: processedBuffer.length,
        mimeType: 'image/jpeg', // Sempre JPEG após processamento
        bucket: this.buckets.profilePictures,
        key: fileName,
        metadata: {
          originalName: file.originalname,
          originalSize: file.size,
          processedSize: processedBuffer.length,
          userId: userId,
          uploadDate: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('❌ Error uploading profile picture:', error);
      throw error;
    }
  }

  /**
   * Upload de documento
   * Simula S3.putObject()
   */
  async uploadDocument(file, userId, documentType = 'general') {
    try {
      await this.init();

      // Validar tipo de arquivo
      if (!this.allowedMimeTypes.documents.includes(file.mimetype)) {
        throw new Error('Tipo de arquivo inválido para documento');
      }

      // Gerar nome do arquivo
      const fileName = this.generateFileName(file.originalname, userId, documentType);
      const fullPath = path.join(this.uploadsDir, this.buckets.documents, fileName);
      
      // Garantir que o diretório do usuário existe
      const userDir = path.dirname(fullPath);
      await this.ensureDir(userDir);

      let processedBuffer = file.buffer;

      // Processar apenas se for imagem
      if (this.allowedMimeTypes.images.includes(file.mimetype)) {
        processedBuffer = await this.processImage(file.buffer, this.imageConfig.document);
      }

      // Salvar arquivo
      await fs.writeFile(fullPath, processedBuffer);

      // Gerar URL pública
      const publicUrl = `${this.baseUrl}/uploads/${this.buckets.documents}/${fileName}`;

      return {
        success: true,
        fileName: fileName,
        fullPath: fullPath,
        url: publicUrl,
        size: processedBuffer.length,
        mimeType: this.allowedMimeTypes.images.includes(file.mimetype) ? 'image/jpeg' : file.mimetype,
        bucket: this.buckets.documents,
        key: fileName,
        metadata: {
          originalName: file.originalname,
          originalSize: file.size,
          processedSize: processedBuffer.length,
          userId: userId,
          documentType: documentType,
          uploadDate: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('❌ Error uploading document:', error);
      throw error;
    }
  }

  /**
   * Deletar arquivo
   * Simula S3.deleteObject()
   */
  async deleteFile(bucket, key) {
    try {
      const filePath = path.join(this.uploadsDir, bucket, key);
      
      try {
        await fs.access(filePath);
        await fs.unlink(filePath);
        console.log(`🗑️ File deleted: ${key}`);
        return { success: true };
      } catch (error) {
        if (error.code === 'ENOENT') {
          console.warn(`⚠️ File not found for deletion: ${key}`);
          return { success: true, message: 'File not found' };
        }
        throw error;
      }
    } catch (error) {
      console.error('❌ Error deleting file:', error);
      throw error;
    }
  }

  /**
   * Deletar foto de perfil
   */
  async deleteProfilePicture(fileName) {
    return this.deleteFile(this.buckets.profilePictures, fileName);
  }

  /**
   * Deletar documento
   */
  async deleteDocument(fileName) {
    return this.deleteFile(this.buckets.documents, fileName);
  }

  /**
   * Listar arquivos de um usuário
   * Simula S3.listObjectsV2()
   */
  async listUserFiles(userId, bucket = null) {
    try {
      const results = {};
      const bucketsToCheck = bucket ? [bucket] : Object.values(this.buckets);

      for (const bucketName of bucketsToCheck) {
        const bucketPath = path.join(this.uploadsDir, bucketName);
        const userPath = path.join(bucketPath, userId);
        
        try {
          await fs.access(userPath);
          const files = await fs.readdir(userPath);
          
          results[bucketName] = await Promise.all(files.map(async (file) => {
            const filePath = path.join(userPath, file);
            const stats = await fs.stat(filePath);
            
            return {
              key: `${userId}/${file}`,
              size: stats.size,
              lastModified: stats.mtime,
              url: `${this.baseUrl}/uploads/${bucketName}/${userId}/${file}`
            };
          }));
        } catch (error) {
          if (error.code !== 'ENOENT') {
            console.warn(`⚠️ Error reading bucket ${bucketName} for user ${userId}:`, error.message);
          }
          results[bucketName] = [];
        }
      }

      return results;
    } catch (error) {
      console.error('❌ Error listing user files:', error);
      throw error;
    }
  }

  /**
   * Obter URL pública de um arquivo
   */
  getPublicUrl(bucket, key) {
    return `${this.baseUrl}/uploads/${bucket}/${key}`;
  }

  /**
   * Verificar se arquivo existe
   */
  async fileExists(bucket, key) {
    try {
      const filePath = path.join(this.uploadsDir, bucket, key);
      await fs.access(filePath);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Obter informações do arquivo
   */
  async getFileInfo(bucket, key) {
    try {
      const filePath = path.join(this.uploadsDir, bucket, key);
      const stats = await fs.stat(filePath);
      
      return {
        exists: true,
        size: stats.size,
        lastModified: stats.mtime,
        url: this.getPublicUrl(bucket, key)
      };
    } catch (error) {
      return { exists: false };
    }
  }

  /**
   * Limpar arquivos temporários antigos
   */
  async cleanTempFiles(olderThanHours = 24) {
    try {
      const tempPath = path.join(this.uploadsDir, this.buckets.temp);
      const cutoffTime = Date.now() - (olderThanHours * 60 * 60 * 1000);
      
      const files = await fs.readdir(tempPath);
      let deletedCount = 0;
      
      for (const file of files) {
        const filePath = path.join(tempPath, file);
        const stats = await fs.stat(filePath);
        
        if (stats.mtime.getTime() < cutoffTime) {
          await fs.unlink(filePath);
          deletedCount++;
        }
      }
      
      console.log(`🧹 Cleaned ${deletedCount} temporary files`);
      return { deletedCount };
    } catch (error) {
      console.error('❌ Error cleaning temp files:', error);
      return { deletedCount: 0, error: error.message };
    }
  }
}

module.exports = new LocalStorageService();