const prismaConfig = require('../config/prisma');
const { Client } = require('minio');
const crypto = require('crypto');
const path = require('path');
const sharp = require('sharp');

class UserDocumentService {
  constructor() {
    this.prisma = null;
    
    // Configurar cliente MinIO
    this.minioClient = new Client({
      endPoint: 'localhost', // Forçar localhost quando rodando fora do Docker
      port: parseInt(process.env.MINIO_PORT) || 9000,
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY || 'coinage_access_key',
      secretKey: process.env.MINIO_SECRET_KEY || 'coinage_secret_key'
    });

    this.bucketName = process.env.MINIO_BUCKET || 'coinage-documents';
  }

  async init() {
    try {
      this.prisma = prismaConfig.getPrisma();
    } catch (error) {
      this.prisma = await prismaConfig.initialize();
    }
    
    // Inicializar bucket do MinIO se não existir
    await this.initializeBucket();
  }

  /**
   * Inicializar bucket se não existir
   */
  async initializeBucket() {
    try {
      const bucketExists = await this.minioClient.bucketExists(this.bucketName);
      if (!bucketExists) {
        await this.minioClient.makeBucket(this.bucketName, 'us-east-1');
        console.log(`✅ Bucket ${this.bucketName} criado com sucesso`);
      } else {
        console.log(`✅ Bucket ${this.bucketName} já existe`);
      }
    } catch (error) {
      console.error('❌ Erro ao inicializar bucket MinIO:', error);
    }
  }

  /**
   * Gerar nome único para arquivo
   */
  generateUniqueFilename(originalName, documentType, userId) {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(4).toString('hex');
    const extension = path.extname(originalName);
    
    return `user-documents/${userId}/${documentType}_${timestamp}_${randomString}${extension}`;
  }

  /**
   * Validar tipo de arquivo para documentos
   */
  validateDocumentFile(mimeType, fileSize) {
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/webp',
      'application/pdf'
    ];

    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(mimeType)) {
      return { valid: false, message: 'Tipo de arquivo não permitido. Use JPEG, PNG, HEIC, WEBP ou PDF.' };
    }

    if (fileSize > maxSize) {
      return { valid: false, message: 'Arquivo muito grande. Tamanho máximo: 10MB.' };
    }

    return { valid: true };
  }

  /**
   * Otimizar imagem se necessário
   */
  async optimizeImage(buffer, mimeType) {
    if (!mimeType.startsWith('image/')) {
      return buffer;
    }

    try {
      const image = sharp(buffer);
      const metadata = await image.metadata();

      // Se a imagem for muito grande, redimensionar
      if (metadata.width > 1920 || metadata.height > 1920) {
        image.resize(1920, 1920, {
          fit: 'inside',
          withoutEnlargement: true
        });
      }

      // Otimizar qualidade
      if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
        return await image.jpeg({ quality: 90 }).toBuffer();
      } else if (mimeType === 'image/png') {
        return await image.png({ compressionLevel: 6 }).toBuffer();
      } else if (mimeType === 'image/webp') {
        return await image.webp({ quality: 90 }).toBuffer();
      } else if (mimeType === 'image/heic') {
        // Converter HEIC para JPEG
        return await image.jpeg({ quality: 90 }).toBuffer();
      }

      return await image.toBuffer();
    } catch (error) {
      console.error('❌ Erro ao otimizar imagem:', error);
      return buffer; // Retornar original se falhar
    }
  }

  /**
   * Upload de arquivo para MinIO
   */
  async uploadToMinio(file, documentType, userId) {
    try {
      // Inicializar se necessário
      if (!this.prisma) await this.init();
      
      // Validar arquivo
      const validation = this.validateDocumentFile(file.mimetype, file.size);
      if (!validation.valid) {
        throw new Error(validation.message);
      }

      // Gerar nome único
      const objectName = this.generateUniqueFilename(file.originalname, documentType, userId);

      // Otimizar imagem se necessário
      let fileBuffer = file.buffer;
      if (file.mimetype.startsWith('image/')) {
        fileBuffer = await this.optimizeImage(file.buffer, file.mimetype);
      }

      // Upload para MinIO
      await this.minioClient.putObject(
        this.bucketName,
        objectName,
        fileBuffer,
        fileBuffer.length,
        {
          'Content-Type': file.mimetype,
          'Content-Disposition': `inline; filename="${file.originalname}"`
        }
      );

      // Gerar URL pública
      const url = await this.minioClient.presignedGetObject(
        this.bucketName, 
        objectName, 
        7 * 24 * 60 * 60 // 7 dias
      );

      return {
        s3Url: url,
        s3Key: objectName,
        filename: file.originalname,
        mimeType: file.mimetype,
        fileSize: BigInt(fileBuffer.length)
      };
    } catch (error) {
      console.error('❌ Erro ao fazer upload para MinIO:', error);
      throw error;
    }
  }

  /**
   * Lista documentos do usuário
   * @param {string} userId - ID do usuário
   * @returns {Promise<Array>} Lista de documentos do usuário
   */
  async getUserDocuments(userId) {
    try {
      if (!this.prisma) await this.init();

      const documents = await this.prisma.userDocument.findMany({
        where: { userId },
        include: {
          reviewer: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: { documentType: 'asc' }
      });

      return documents;
    } catch (error) {
      console.error('❌ Erro ao buscar documentos do usuário:', error);
      throw error;
    }
  }

  /**
   * Obtém documento específico do usuário
   * @param {string} userId - ID do usuário
   * @param {string} documentType - Tipo do documento (front, back, selfie)
   * @returns {Promise<Object|null>} Documento encontrado
   */
  async getUserDocument(userId, documentType) {
    try {
      if (!this.prisma) await this.init();

      const document = await this.prisma.userDocument.findUnique({
        where: {
          user_document_type_unique: {
            userId,
            documentType
          }
        },
        include: {
          reviewer: {
            select: { id: true, name: true, email: true }
          }
        }
      });

      return document;
    } catch (error) {
      console.error('❌ Erro ao buscar documento específico:', error);
      throw error;
    }
  }

  /**
   * Cria ou atualiza documento do usuário
   * @param {string} userId - ID do usuário
   * @param {string} documentType - Tipo do documento
   * @param {Object} documentData - Dados do documento
   * @returns {Promise<Object>} Documento criado/atualizado
   */
  async upsertUserDocument(userId, documentType, documentData) {
    try {
      if (!this.prisma) await this.init();

      const document = await this.prisma.userDocument.upsert({
        where: {
          user_document_type_unique: {
            userId,
            documentType
          }
        },
        create: {
          userId,
          documentType,
          status: 'pending',
          s3Url: documentData.s3Url,
          s3Key: documentData.s3Key,
          filename: documentData.filename,
          mimeType: documentData.mimeType,
          fileSize: documentData.fileSize,
          uploadedAt: new Date()
        },
        update: {
          status: 'pending',
          s3Url: documentData.s3Url,
          s3Key: documentData.s3Key,
          filename: documentData.filename,
          mimeType: documentData.mimeType,
          fileSize: documentData.fileSize,
          uploadedAt: new Date(),
          rejectionReason: null,
          reviewedBy: null,
          reviewedAt: null
        },
        include: {
          reviewer: {
            select: { id: true, name: true, email: true }
          }
        }
      });

      return document;
    } catch (error) {
      console.error('❌ Erro ao criar/atualizar documento:', error);
      throw error;
    }
  }

  /**
   * Aprova documento
   * @param {string} documentId - ID do documento
   * @param {string} reviewerId - ID do revisor
   * @returns {Promise<Object>} Documento aprovado
   */
  async approveDocument(documentId, reviewerId) {
    try {
      if (!this.prisma) await this.init();

      const document = await this.prisma.userDocument.update({
        where: { id: documentId },
        data: {
          status: 'approved',
          reviewedBy: reviewerId,
          reviewedAt: new Date(),
          rejectionReason: null
        },
        include: {
          user: {
            select: { id: true, name: true, email: true }
          },
          reviewer: {
            select: { id: true, name: true, email: true }
          }
        }
      });

      return document;
    } catch (error) {
      console.error('❌ Erro ao aprovar documento:', error);
      throw error;
    }
  }

  /**
   * Rejeita documento
   * @param {string} documentId - ID do documento
   * @param {string} reviewerId - ID do revisor
   * @param {string} rejectionReason - Motivo da rejeição
   * @returns {Promise<Object>} Documento rejeitado
   */
  async rejectDocument(documentId, reviewerId, rejectionReason) {
    try {
      if (!this.prisma) await this.init();

      const document = await this.prisma.userDocument.update({
        where: { id: documentId },
        data: {
          status: 'rejected',
          reviewedBy: reviewerId,
          reviewedAt: new Date(),
          rejectionReason
        },
        include: {
          user: {
            select: { id: true, name: true, email: true }
          },
          reviewer: {
            select: { id: true, name: true, email: true }
          }
        }
      });

      return document;
    } catch (error) {
      console.error('❌ Erro ao rejeitar documento:', error);
      throw error;
    }
  }

  /**
   * Lista documentos pendentes para revisão
   * @param {Object} options - Opções de busca
   * @returns {Promise<Object>} Lista paginada de documentos pendentes
   */
  async getPendingDocuments(options = {}) {
    try {
      if (!this.prisma) await this.init();

      const {
        page = 1,
        limit = 50,
        documentType,
        userId,
        companyId
      } = options;

      const skip = (page - 1) * limit;
      const take = parseInt(limit);

      const where = {
        status: 'pending'
      };

      if (documentType) where.documentType = documentType;
      if (userId) where.userId = userId;

      // Filtrar por empresa se especificado
      if (companyId) {
        where.user = {
          userCompanies: {
            some: {
              companyId,
              status: 'active'
            }
          }
        };
      }

      const [documents, total] = await Promise.all([
        this.prisma.userDocument.findMany({
          where,
          include: {
            user: {
              select: { 
                id: true, 
                name: true, 
                email: true,
                userCompanies: {
                  where: companyId ? { companyId, status: 'active' } : { status: 'active' },
                  include: {
                    company: {
                      select: { id: true, name: true, alias: true }
                    }
                  }
                }
              }
            }
          },
          orderBy: { uploadedAt: 'desc' },
          skip,
          take
        }),
        this.prisma.userDocument.count({ where })
      ]);

      return {
        documents,
        pagination: {
          page: parseInt(page),
          limit: take,
          total,
          totalPages: Math.ceil(total / take),
          hasNext: skip + take < total,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      console.error('❌ Erro ao listar documentos pendentes:', error);
      throw error;
    }
  }

  /**
   * Obtém estatísticas de documentos
   * @param {string} companyId - ID da empresa (opcional)
   * @returns {Promise<Object>} Estatísticas dos documentos
   */
  async getDocumentStats(companyId = null) {
    try {
      if (!this.prisma) await this.init();

      const where = {};
      
      if (companyId) {
        where.user = {
          userCompanies: {
            some: {
              companyId,
              status: 'active'
            }
          }
        };
      }

      const [
        pendingCount,
        approvedCount,
        rejectedCount,
        totalCount
      ] = await Promise.all([
        this.prisma.userDocument.count({ where: { ...where, status: 'pending' } }),
        this.prisma.userDocument.count({ where: { ...where, status: 'approved' } }),
        this.prisma.userDocument.count({ where: { ...where, status: 'rejected' } }),
        this.prisma.userDocument.count({ where })
      ]);

      return {
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
        total: totalCount
      };
    } catch (error) {
      console.error('❌ Erro ao obter estatísticas de documentos:', error);
      throw error;
    }
  }

  /**
   * Verifica se usuário tem todos documentos aprovados
   * @param {string} userId - ID do usuário
   * @returns {Promise<boolean>} True se todos documentos estão aprovados
   */
  async isUserDocumentationComplete(userId) {
    try {
      if (!this.prisma) await this.init();

      const approvedCount = await this.prisma.userDocument.count({
        where: {
          userId,
          status: 'approved'
        }
      });

      // Todos os 3 tipos de documento devem estar aprovados
      return approvedCount === 3;
    } catch (error) {
      console.error('❌ Erro ao verificar documentação completa:', error);
      throw error;
    }
  }

  /**
   * Gerar URL temporária para visualização/download de documento
   * @param {string} documentId - ID do documento
   * @param {string} userId - ID do usuário (para verificar permissão)
   * @returns {Promise<string>} URL temporária
   */
  async generateDocumentUrl(documentId, userId) {
    try {
      if (!this.prisma) await this.init();

      const document = await this.prisma.userDocument.findUnique({
        where: { id: documentId },
        include: {
          user: {
            select: { id: true, name: true }
          }
        }
      });

      if (!document) {
        throw new Error('Documento não encontrado');
      }

      // Verificar se o usuário tem permissão (é o dono ou é admin)
      // TODO: Adicionar verificação de admin
      if (document.userId !== userId) {
        throw new Error('Sem permissão para acessar este documento');
      }

      if (!document.s3Key) {
        throw new Error('Documento não possui arquivo associado');
      }

      // Gerar URL temporária (válida por 1 hora)
      const url = await this.minioClient.presignedGetObject(
        this.bucketName,
        document.s3Key,
        60 * 60 // 1 hora
      );

      return url;
    } catch (error) {
      console.error('❌ Erro ao gerar URL do documento:', error);
      throw error;
    }
  }
}

module.exports = new UserDocumentService();