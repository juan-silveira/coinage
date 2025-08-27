const express = require('express');
const router = express.Router();
const multer = require('multer');
// const AWS = require('aws-sdk'); // Instalar quando for usar S3

// Configurar multer para upload de arquivos
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    // Aceitar apenas imagens
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos de imagem são permitidos'), false);
    }
  }
});

// TODO: Configurar AWS S3 quando necessário
/*
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

const S3_BUCKET = process.env.S3_BUCKET_NAME || 'coinage-profile-photos';
*/

/**
 * @swagger
 * /api/s3-photos/upload:
 *   post:
 *     summary: Upload de foto de perfil para S3
 *     tags: [S3 Photos]
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
 *                 description: Arquivo de imagem (JPG, PNG, GIF, WebP)
 *     responses:
 *       200:
 *         description: Upload realizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 *                       description: URL da foto no S3
 *                     key:
 *                       type: string
 *                       description: Chave S3 da foto
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno
 */
router.post('/upload', upload.single('photo'), async (req, res) => {
  try {
    const userId = req.user?.id;
    const file = req.file;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não autenticado'
      });
    }

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum arquivo enviado'
      });
    }

    // TODO: Implementar upload real para S3
    console.log('📸 [S3Photos] Upload solicitado para usuário:', userId);
    console.log('📸 [S3Photos] Arquivo:', file.originalname, file.size, 'bytes');

    // SIMULAÇÃO - Substituir por código real S3
    const mockS3Url = `https://${process.env.S3_BUCKET_NAME || 'coinage-photos'}.s3.amazonaws.com/profile-photos/${userId}/${Date.now()}-${file.originalname}`;
    const mockS3Key = `profile-photos/${userId}/${Date.now()}-${file.originalname}`;

    /*
    // CÓDIGO REAL S3 (descomente quando configurar):
    const uploadParams = {
      Bucket: S3_BUCKET,
      Key: `profile-photos/${userId}/${Date.now()}-${file.originalname}`,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read'
    };

    const result = await s3.upload(uploadParams).promise();
    
    // Salvar referência no banco de dados se necessário
    // await User.update({ profilePhotoUrl: result.Location }, { where: { id: userId } });
    */

    res.json({
      success: true,
      message: 'Foto de perfil enviada com sucesso',
      data: {
        url: mockS3Url,
        key: mockS3Key
      }
    });

  } catch (error) {
    console.error('❌ [S3Photos] Erro no upload:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/s3-photos/info:
 *   get:
 *     summary: Obter informações da foto de perfil do usuário
 *     tags: [S3 Photos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Informações obtidas com sucesso
 *       401:
 *         description: Não autorizado
 */
router.get('/info', async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não autenticado'
      });
    }

    // TODO: Verificar no banco de dados se usuário tem foto S3
    // const user = await User.findByPk(userId);
    // const hasPhoto = !!user?.profilePhotoUrl;

    console.log('📸 [S3Photos] Info solicitada para usuário:', userId);

    res.json({
      success: true,
      message: 'Informações obtidas',
      data: {
        hasPhoto: false, // Alterar para: hasPhoto quando implementar banco
        url: null,       // Alterar para: user?.profilePhotoUrl quando implementar
        lastUpdated: null
      }
    });

  } catch (error) {
    console.error('❌ [S3Photos] Erro ao obter info:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/s3-photos/delete:
 *   delete:
 *     summary: Deletar foto de perfil do S3
 *     tags: [S3 Photos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Foto deletada com sucesso
 *       401:
 *         description: Não autorizado
 */
router.delete('/delete', async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não autenticado'
      });
    }

    // TODO: Buscar key S3 do usuário no banco e deletar
    /*
    const user = await User.findByPk(userId);
    if (user?.profilePhotoS3Key) {
      const deleteParams = {
        Bucket: S3_BUCKET,
        Key: user.profilePhotoS3Key
      };
      
      await s3.deleteObject(deleteParams).promise();
      await User.update({ 
        profilePhotoUrl: null, 
        profilePhotoS3Key: null 
      }, { where: { id: userId } });
    }
    */

    console.log('🗑️ [S3Photos] Deleção solicitada para usuário:', userId);

    res.json({
      success: true,
      message: 'Foto de perfil removida com sucesso'
    });

  } catch (error) {
    console.error('❌ [S3Photos] Erro na deleção:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

module.exports = router;