const express = require('express');
const multer = require('multer');
const router = express.Router();
const profileController = require('../controllers/profile.controller');
const { authenticateJWT } = require('../middleware/jwt.middleware');
const { apiRateLimiter, createRateLimiter } = require('../middleware/rateLimit.middleware');

// Rate limiter específico para foto de perfil (previne loops)
const profilePhotoRateLimiter = createRateLimiter({
  maxRequests: 5, // Máximo 5 requisições
  windowMs: 10 * 1000, // Em 10 segundos
  keyPrefix: 'profile_photo_rate_limit',
  keyGenerator: (req) => req.user?.id || req.ip,
  message: 'Muitas requisições para foto de perfil. Aguarde alguns segundos.'
});

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo inválido. Apenas JPG, PNG e GIF são permitidos.'), false);
    }
  }
});

/**
 * @swagger
 * /api/profile/upload-photo:
 *   post:
 *     summary: Upload profile photo
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               photo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Photo uploaded successfully
 *       400:
 *         description: Invalid file
 *       401:
 *         description: Unauthorized
 *       413:
 *         description: File too large
 */
router.post('/upload-photo',
  apiRateLimiter,
  authenticateJWT,
  (req, res, next) => {
    upload.single('photo')(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({
            success: false,
            message: 'Arquivo muito grande. Máximo permitido: 5MB'
          });
        }
        return res.status(400).json({
          success: false,
          message: 'Erro no upload do arquivo: ' + err.message
        });
      } else if (err) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }
      next();
    });
  },
  profileController.uploadProfilePhoto
);

/**
 * @swagger
 * /api/profile/photo:
 *   get:
 *     summary: Get profile photo URL
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile photo URL retrieved
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.get('/photo',
  profilePhotoRateLimiter,
  authenticateJWT,
  profileController.getProfilePhoto
);

/**
 * @swagger
 * /api/profile/photo:
 *   delete:
 *     summary: Delete profile photo
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile photo deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User or photo not found
 */
router.delete('/photo',
  apiRateLimiter,
  authenticateJWT,
  profileController.deleteProfilePhoto
);

/**
 * @swagger
 * /api/profile/simple-photo:
 *   get:
 *     summary: Get profile photo URL (simple version without rate limiting)
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile photo URL retrieved
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.get('/simple-photo',
  authenticateJWT,
  (req, res) => {
    // Versão simplificada sem rate limiting para evitar loops
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não autenticado'
      });
    }

    // Retornar resposta simples - usuário sem foto por padrão
    res.set('Cache-Control', 'public, max-age=600'); // 10 minutos de cache
    res.status(200).json({
      success: true,
      data: {
        hasPhoto: false,
        url: null
      }
    });
  }
);

/**
 * @swagger
 * /api/profile/health:
 *   get:
 *     summary: Health check
 *     tags: [Profile]
 *     responses:
 *       200:
 *         description: Service operational
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'Profile Service',
    status: 'operational',
    timestamp: new Date().toISOString(),
    endpoints: {
      uploadPhoto: 'POST /api/profile/upload-photo',
      getPhoto: 'GET /api/profile/photo',
      simplePhoto: 'GET /api/profile/simple-photo',
      deletePhoto: 'DELETE /api/profile/photo'
    }
  });
});

module.exports = router;