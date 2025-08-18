const express = require('express');
const router = express.Router();

// Função helper para obter Prisma
const prismaConfig = require('../config/prisma');
const getPrisma = () => prismaConfig.getPrisma();

/**
 * Endpoint para buscar usuário por email
 */
router.get('/find-user/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    const user = await getPrisma().user.findFirst({
      where: { email },
      include: {
        userCompanies: {
          where: { status: 'active' },
          include: {
            company: true
          }
        }
      }
    });
    
    if (user) {
      res.json({
        success: true,
        message: 'Usuário encontrado',
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          isActive: user.isActive,
          isFirstAccess: user.isFirstAccess,
          companies: user.userCompanies.map(uc => uc.company.name),
          createdAt: user.createdAt,
          lastActivityAt: user.lastActivityAt,
          roles: user.roles,
          isApiAdmin: user.isApiAdmin,
          isCompanyAdmin: user.isCompanyAdmin,
          // NUNCA retornar a senha em texto plano por segurança
          hasPassword: !!user.password,
          passwordLength: user.password ? user.password.length : 0
        }
      });
    } else {
      res.json({
        success: false,
        message: 'Usuário não encontrado',
        email
      });
    }
  } catch (error) {
    console.error('❌ Erro na busca do usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro na busca do usuário',
      error: {
        name: error.name,
        message: error.message
      }
    });
  }
});

/**
 * Endpoint para listar todos os usuários (limitado)
 */
router.get('/list-users', async (req, res) => {
  try {
    
    const users = await getPrisma().user.findMany({
      take: 10, // Limitar a 10 usuários por segurança
      include: {
        company: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    const userList = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      isActive: user.isActive,
      isFirstAccess: user.isFirstAccess,
      company: user.company ? user.company.name : null,
      createdAt: user.createdAt,
      roles: user.roles,
      isApiAdmin: user.isApiAdmin,
      isCompanyAdmin: user.isCompanyAdmin
    }));
    
    res.json({
      success: true,
      message: `${users.length} usuários encontrados`,
      data: {
        count: users.length,
        users: userList
      }
    });
  } catch (error) {
    console.error('❌ Erro ao listar usuários:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar usuários',
      error: {
        name: error.name,
        message: error.message
      }
    });
  }
});

module.exports = router;
