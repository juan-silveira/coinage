const prismaConfig = require('../config/prisma');
const minIOService = require('../services/minio.service');
const userActionsService = require('../services/userActions.service');

class ProfileController {
  constructor() {
    this.prisma = null;
  }

  async init() {
    if (!this.prisma) {
      this.prisma = prismaConfig.getPrisma();
    }
  }

  /**
   * @swagger
   * /api/profile/upload-photo:
   *   post:
   *     summary: Upload profile photo
   *     description: Upload a profile photo to MinIO and update user profile
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
   *                 description: Profile photo file (jpg, png, gif)
   *     responses:
   *       200:
   *         description: Photo uploaded successfully
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
   *                     profilePicture:
   *                       type: string
   *                     url:
   *                       type: string
   *       400:
   *         description: Invalid file or missing file
   *       401:
   *         description: Unauthorized
   *       413:
   *         description: File too large
   */
  async uploadProfilePhoto(req, res) {
    try {
      await this.init();

      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado'
        });
      }

      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Nenhum arquivo foi enviado'
        });
      }

      const file = req.file;

      // Validate file type
      const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedMimeTypes.includes(file.mimetype)) {
        return res.status(400).json({
          success: false,
          message: 'Tipo de arquivo inválido. Apenas JPG, PNG e GIF são permitidos.'
        });
      }

      // Validate file size (5MB limit)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        return res.status(413).json({
          success: false,
          message: 'Arquivo muito grande. Máximo permitido: 5MB'
        });
      }

      // Get current user to check for existing profile picture
      const currentUser = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { profilePicture: true, name: true, email: true }
      });

      if (!currentUser) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }

      // Delete old profile picture if it exists
      if (currentUser.profilePicture) {
        try {
          await minIOService.deleteProfilePicture(currentUser.profilePicture);
        } catch (deleteError) {
          console.warn('⚠️ Warning: Could not delete old profile picture:', deleteError.message);
        }
      }

      // Upload new profile picture
      const uploadResult = await minIOService.uploadProfilePicture(file, userId);

      // Update user's profile picture in database
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: {
          profilePicture: uploadResult.fileName
        },
        select: {
          id: true,
          name: true,
          email: true,
          profilePicture: true
        }
      });

      // Log user action
      await userActionsService.logAuth(userId, 'profile_updated', req, {
        status: 'success',
        details: {
          action: 'profile_photo_uploaded',
          fileName: uploadResult.fileName,
          fileSize: uploadResult.size,
          mimeType: uploadResult.mimeType,
          uploadedAt: new Date().toISOString()
        }
      });

      res.status(200).json({
        success: true,
        message: 'Foto de perfil atualizada com sucesso!',
        data: {
          profilePicture: uploadResult.fileName,
          url: uploadResult.url,
          user: updatedUser
        }
      });

    } catch (error) {
      console.error('❌ Error uploading profile photo:', error);
      
      // Log error action
      if (req.user?.id) {
        await userActionsService.logAuth(req.user.id, 'profile_updated', req, {
          status: 'failed',
          details: {
            action: 'profile_photo_upload_failed',
            error: error.message,
            timestamp: new Date().toISOString()
          }
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * @swagger
   * /api/profile/photo:
   *   get:
   *     summary: Get current user's profile photo URL
   *     description: Returns the current user's profile photo URL if it exists
   *     tags: [Profile]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Profile photo URL retrieved successfully
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
   *                     hasPhoto:
   *                       type: boolean
   *                     url:
   *                       type: string
   *                       nullable: true
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: User not found
   */
  async getProfilePhoto(req, res) {
    try {
      await this.init();

      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado'
        });
      }

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { profilePicture: true }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }

      let photoUrl = null;
      
      if (user.profilePicture) {
        try {
          photoUrl = await minIOService.getProfilePictureUrl(user.profilePicture);
        } catch (error) {
          console.warn('⚠️ Warning: Could not get profile picture URL:', error.message);
        }
      }

      res.status(200).json({
        success: true,
        data: {
          hasPhoto: !!user.profilePicture,
          url: photoUrl
        }
      });

    } catch (error) {
      console.error('❌ Error getting profile photo:', error);
      
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  /**
   * @swagger
   * /api/profile/photo:
   *   delete:
   *     summary: Delete current user's profile photo
   *     description: Removes the current user's profile photo from MinIO and database
   *     tags: [Profile]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Profile photo deleted successfully
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: User not found or no photo to delete
   */
  async deleteProfilePhoto(req, res) {
    try {
      await this.init();

      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado'
        });
      }

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { profilePicture: true, name: true }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }

      if (!user.profilePicture) {
        return res.status(404).json({
          success: false,
          message: 'Nenhuma foto de perfil para deletar'
        });
      }

      // Delete from MinIO
      await minIOService.deleteProfilePicture(user.profilePicture);

      // Update user record
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          profilePicture: null
        }
      });

      // Log user action
      await userActionsService.logAuth(userId, 'profile_updated', req, {
        status: 'success',
        details: {
          action: 'profile_photo_deleted',
          fileName: user.profilePicture,
          deletedAt: new Date().toISOString()
        }
      });

      res.status(200).json({
        success: true,
        message: 'Foto de perfil removida com sucesso!'
      });

    } catch (error) {
      console.error('❌ Error deleting profile photo:', error);
      
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }
}

const profileController = new ProfileController();

module.exports = {
  uploadProfilePhoto: profileController.uploadProfilePhoto.bind(profileController),
  getProfilePhoto: profileController.getProfilePhoto.bind(profileController),
  deleteProfilePhoto: profileController.deleteProfilePhoto.bind(profileController)
};