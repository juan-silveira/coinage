const express = require('express');
const router = express.Router();
const multer = require('multer');
const userDocumentController = require('../controllers/userDocument.controller');
const { requireAnyAdmin } = require('../middleware/admin.middleware');

// Configurar multer para upload em memória
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/webp',
      'application/pdf'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido'), false);
    }
  }
});

/**
 * @swagger
 * components:
 *   schemas:
 *     UserDocument:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         userId:
 *           type: string
 *           format: uuid
 *         documentType:
 *           type: string
 *           enum: [front, back, selfie]
 *         status:
 *           type: string
 *           enum: [not_sent, pending, approved, rejected]
 *         s3Url:
 *           type: string
 *         filename:
 *           type: string
 *         rejectionReason:
 *           type: string
 *         uploadedAt:
 *           type: string
 *           format: date-time
 *         reviewedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/user-documents:
 *   get:
 *     summary: Lista documentos do usuário autenticado
 *     tags: [User Documents]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de documentos do usuário
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/UserDocument'
 */
router.get('/', userDocumentController.getUserDocuments);

/**
 * @swagger
 * /api/user-documents/complete:
 *   get:
 *     summary: Verifica se documentação está completa
 *     tags: [User Documents]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Status da documentação
 */
router.get('/complete', userDocumentController.checkDocumentationComplete);

/**
 * @swagger
 * /api/user-documents/stats:
 *   get:
 *     summary: Estatísticas de documentos (admin)
 *     tags: [User Documents]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: companyId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da empresa (apenas super admin)
 *     responses:
 *       200:
 *         description: Estatísticas dos documentos
 */
router.get('/stats', requireAnyAdmin, userDocumentController.getDocumentStats);

/**
 * @swagger
 * /api/user-documents/pending:
 *   get:
 *     summary: Lista documentos pendentes (admin)
 *     tags: [User Documents]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: documentType
 *         schema:
 *           type: string
 *           enum: [front, back, selfie]
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: companyId
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Lista paginada de documentos pendentes
 */
router.get('/pending', requireAnyAdmin, userDocumentController.getPendingDocuments);

/**
 * @swagger
 * /api/user-documents/{documentType}:
 *   get:
 *     summary: Obtém documento específico do usuário
 *     tags: [User Documents]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: documentType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [front, back, selfie]
 *     responses:
 *       200:
 *         description: Documento encontrado
 *       404:
 *         description: Documento não encontrado
 */
router.get('/:documentType', userDocumentController.getUserDocument);

/**
 * @swagger
 * /api/user-documents/{documentType}/upload:
 *   post:
 *     summary: Upload de documento do usuário
 *     tags: [User Documents]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: documentType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [front, back, selfie]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               s3Url:
 *                 type: string
 *                 description: URL do arquivo no S3
 *               s3Key:
 *                 type: string
 *                 description: Chave do arquivo no S3
 *               filename:
 *                 type: string
 *                 description: Nome original do arquivo
 *               mimeType:
 *                 type: string
 *                 description: Tipo MIME do arquivo
 *               fileSize:
 *                 type: integer
 *                 description: Tamanho do arquivo em bytes
 *             required:
 *               - s3Url
 *               - s3Key
 *               - filename
 *     responses:
 *       200:
 *         description: Documento enviado com sucesso
 */
router.post('/:documentType/upload', upload.single('document'), userDocumentController.uploadUserDocument);

/**
 * @swagger
 * /api/user-documents/admin/{documentId}/approve:
 *   post:
 *     summary: Aprova documento (admin)
 *     tags: [User Documents]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: documentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Documento aprovado
 */
router.post('/admin/:documentId/approve', requireAnyAdmin, userDocumentController.approveDocument);

/**
 * @swagger
 * /api/user-documents/admin/{documentId}/reject:
 *   post:
 *     summary: Rejeita documento (admin)
 *     tags: [User Documents]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: documentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rejectionReason:
 *                 type: string
 *                 description: Motivo da rejeição
 *             required:
 *               - rejectionReason
 *     responses:
 *       200:
 *         description: Documento rejeitado
 */
router.post('/admin/:documentId/reject', requireAnyAdmin, userDocumentController.rejectDocument);

/**
 * @swagger
 * /api/user-documents/{documentId}/url:
 *   get:
 *     summary: Gera URL temporária para visualizar/baixar documento
 *     tags: [User Documents]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: documentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: URL gerada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 *                       description: URL temporária para acessar o documento
 *       404:
 *         description: Documento não encontrado
 */
router.get('/:documentId/url', userDocumentController.getDocumentUrl);

module.exports = router;