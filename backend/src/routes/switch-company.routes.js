const express = require('express');
const router = express.Router();
const userCompanyService = require('../services/userCompany.service');

/**
 * POST /api/switch-company
 * Troca a empresa atual do usuário
 */
router.post('/', async (req, res) => {
  try {
    const { companyAlias } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não autenticado'
      });
    }

    if (!companyAlias) {
      return res.status(400).json({
        success: false,
        message: 'Alias da empresa é obrigatório'
      });
    }

    // Buscar empresa por alias
    const company = await global.prisma.company.findUnique({
      where: { alias: companyAlias }
    });

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Empresa não encontrada'
      });
    }

    // Definir como empresa atual
    const currentCompany = await userCompanyService.setCurrentCompany(userId, company.id);

    res.json({
      success: true,
      message: `Empresa atual alterada para ${company.name}`,
      data: currentCompany
    });

  } catch (error) {
    console.error('Erro ao trocar empresa:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro interno do servidor'
    });
  }
});

module.exports = router;