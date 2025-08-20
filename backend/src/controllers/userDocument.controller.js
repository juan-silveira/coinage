const userDocumentService = require('../services/userDocument.service');
const userActionsService = require('../services/userActions.service');

/**
 * Lista documentos do usuário autenticado
 */
const getUserDocuments = async (req, res) => {
  try {
    const userId = req.user.id;
    const documents = await userDocumentService.getUserDocuments(userId);

    res.json({
      success: true,
      data: documents
    });
  } catch (error) {
    console.error('Erro ao buscar documentos do usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * Obtém documento específico do usuário
 */
const getUserDocument = async (req, res) => {
  try {
    const userId = req.user.id;
    const { documentType } = req.params;

    if (!['front', 'back', 'selfie'].includes(documentType)) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de documento inválido'
      });
    }

    const document = await userDocumentService.getUserDocument(userId, documentType);

    res.json({
      success: true,
      data: document
    });
  } catch (error) {
    console.error('Erro ao buscar documento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * Upload de documento do usuário
 */
const uploadUserDocument = async (req, res) => {
  try {
    const userId = req.user.id;
    const { documentType } = req.params;

    if (!['front', 'back', 'selfie'].includes(documentType)) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de documento inválido'
      });
    }

    // Verificar se arquivo foi enviado
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum arquivo foi enviado'
      });
    }

    // Upload para MinIO e salvar no banco
    const documentData = await userDocumentService.uploadToMinio(req.file, documentType, userId);
    const document = await userDocumentService.upsertUserDocument(userId, documentType, documentData);

    // Registrar upload de documento
    await userActionsService.logAction({
      userId,
      companyId: req.user?.companyId,
      action: 'document_uploaded',
      category: 'profile',
      details: {
        documentType,
        filename: req.file.originalname,
        size: req.file.size
      },
      relatedId: document.id,
      relatedType: 'user_document',
      ipAddress: userActionsService.getIpAddress(req),
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      message: 'Documento enviado com sucesso',
      data: document
    });
  } catch (error) {
    console.error('Erro ao enviar documento:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro interno do servidor'
    });
  }
};

/**
 * Lista documentos pendentes (admin)
 */
const getPendingDocuments = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      documentType,
      userId,
      companyId
    } = req.query;

    // Se não for super admin, filtrar pela empresa do usuário
    const finalCompanyId = req.user.isApiAdmin ? companyId : req.user.companyId;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      documentType,
      userId,
      companyId: finalCompanyId
    };

    const result = await userDocumentService.getPendingDocuments(options);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Erro ao listar documentos pendentes:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * Aprova documento (admin)
 */
const approveDocument = async (req, res) => {
  try {
    const { documentId } = req.params;
    const reviewerId = req.user.id;

    const document = await userDocumentService.approveDocument(documentId, reviewerId);

    // Registrar aprovação de documento
    await userActionsService.logAdmin(reviewerId, 'document_verified', document.userId, req, {
      details: {
        documentId,
        documentType: document.documentType,
        action: 'approved'
      }
    });

    // Registrar para o usuário titular do documento
    await userActionsService.logAction({
      userId: document.userId,
      companyId: req.user?.companyId,
      action: 'document_verified',
      category: 'profile',
      status: 'success',
      details: {
        documentType: document.documentType,
        reviewedBy: reviewerId
      },
      relatedId: documentId,
      relatedType: 'user_document'
    });

    res.json({
      success: true,
      message: 'Documento aprovado com sucesso',
      data: document
    });
  } catch (error) {
    console.error('Erro ao aprovar documento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * Rejeita documento (admin)
 */
const rejectDocument = async (req, res) => {
  try {
    const { documentId } = req.params;
    const { rejectionReason } = req.body;
    const reviewerId = req.user.id;

    if (!rejectionReason || rejectionReason.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Motivo da rejeição é obrigatório'
      });
    }

    const document = await userDocumentService.rejectDocument(documentId, reviewerId, rejectionReason);

    res.json({
      success: true,
      message: 'Documento rejeitado',
      data: document
    });
  } catch (error) {
    console.error('Erro ao rejeitar documento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * Obtém estatísticas de documentos (admin)
 */
const getDocumentStats = async (req, res) => {
  try {
    const { companyId } = req.query;
    
    // Se não for super admin, usar empresa do usuário
    const finalCompanyId = req.user.isApiAdmin ? companyId : req.user.companyId;

    const stats = await userDocumentService.getDocumentStats(finalCompanyId);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * Verifica se documentação do usuário está completa
 */
const checkDocumentationComplete = async (req, res) => {
  try {
    const userId = req.user.id;
    const isComplete = await userDocumentService.isUserDocumentationComplete(userId);

    res.json({
      success: true,
      data: { isComplete }
    });
  } catch (error) {
    console.error('Erro ao verificar documentação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * Gerar URL para visualizar/baixar documento
 */
const getDocumentUrl = async (req, res) => {
  try {
    const userId = req.user.id;
    const { documentId } = req.params;

    const url = await userDocumentService.generateDocumentUrl(documentId, userId);

    res.json({
      success: true,
      data: { url }
    });
  } catch (error) {
    console.error('Erro ao gerar URL do documento:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro interno do servidor'
    });
  }
};

module.exports = {
  getUserDocuments,
  getUserDocument,
  uploadUserDocument,
  getPendingDocuments,
  approveDocument,
  rejectDocument,
  getDocumentStats,
  checkDocumentationComplete,
  getDocumentUrl
};