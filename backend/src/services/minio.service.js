const { Client } = require('minio');
const path = require('path');
const crypto = require('crypto');

class MinIOService {
  constructor() {
    this.client = null;
    this.publicClient = null;
    this.bucketName = 'coinage-uploads';
  }

  async init() {
    if (!this.client) {
      console.log('🔧 [MinIO] Inicializando com configurações:', {
        host: process.env.MINIO_HOST || 'localhost',
        port: parseInt(process.env.MINIO_PORT) || 9000,
        publicHost: process.env.MINIO_PUBLIC_HOST || 'localhost',
        publicPort: parseInt(process.env.MINIO_PUBLIC_PORT) || 9000
      });
      
      // Cliente interno para operações (upload, delete)
      // IMPORTANTE: Usar sempre 'minio' dentro do Docker
      this.client = new Client({
        endPoint: 'minio', // Sempre usar hostname do container
        port: 9000,
        useSSL: false,
        accessKey: process.env.MINIO_ACCESS_KEY || 'coinage_access_key',
        secretKey: process.env.MINIO_SECRET_KEY || 'coinage_secret_key'
      });

      // Cliente público para gerar URLs acessíveis pelo navegador
      // Também usar 'minio' pois estamos dentro do Docker
      this.publicClient = new Client({
        endPoint: 'minio', // Usar hostname do container também
        port: 9000,
        useSSL: false,
        accessKey: process.env.MINIO_ACCESS_KEY || 'coinage_access_key',
        secretKey: process.env.MINIO_SECRET_KEY || 'coinage_secret_key'
      });

      // Ensure bucket exists
      await this.ensureBucket();
    }
  }

  async ensureBucket() {
    try {
      const bucketExists = await this.client.bucketExists(this.bucketName);
      if (!bucketExists) {
        await this.client.makeBucket(this.bucketName, 'us-east-1');
        console.log(`✅ Bucket ${this.bucketName} created successfully`);
      }
    } catch (error) {
      console.error('❌ Error ensuring bucket exists:', error);
      throw error;
    }
  }

  generateUniqueFileName(originalName, userId) {
    const ext = path.extname(originalName);
    const timestamp = Date.now();
    const randomId = crypto.randomBytes(8).toString('hex');
    return `profile-pictures/${userId}/${timestamp}-${randomId}${ext}`;
  }

  async uploadProfilePicture(file, userId) {
    try {
      await this.init();

      const fileName = this.generateUniqueFileName(file.originalname, userId);
      
      // Define metadata
      const metaData = {
        'Content-Type': file.mimetype,
        'Upload-Date': new Date().toISOString(),
        'User-Id': userId
      };

      // Upload file
      await this.client.putObject(
        this.bucketName, 
        fileName, 
        file.buffer, 
        file.size, 
        metaData
      );

      // Generate presigned URL for accessing the file (using public client)
      let url = await this.publicClient.presignedGetObject(
        this.bucketName, 
        fileName, 
        24 * 60 * 60 // 24 hours
      );
      
      // Substituir hostname interno pelo público para acesso do navegador
      url = url.replace('http://minio:9000', 'http://localhost:9000');

      return {
        fileName,
        url,
        size: file.size,
        mimeType: file.mimetype
      };

    } catch (error) {
      console.error('❌ Error uploading profile picture:', error);
      throw error;
    }
  }

  async deleteProfilePicture(fileName) {
    try {
      await this.init();
      await this.client.removeObject(this.bucketName, fileName);
      console.log(`✅ File ${fileName} deleted successfully`);
    } catch (error) {
      console.error('❌ Error deleting profile picture:', error);
      throw error;
    }
  }

  async getProfilePictureUrl(fileName, expiry = 24 * 60 * 60) {
    try {
      await this.init();
      // Gerar URL com o cliente interno
      const url = await this.client.presignedGetObject(
        this.bucketName, 
        fileName, 
        expiry
      );
      
      // Substituir hostname interno pelo público para acesso do navegador
      const publicUrl = url.replace('http://minio:9000', 'http://localhost:9000');
      return publicUrl;
    } catch (error) {
      console.error('❌ Error getting profile picture URL:', error);
      throw error;
    }
  }
}

module.exports = new MinIOService();