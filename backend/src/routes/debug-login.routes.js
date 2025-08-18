const express = require('express');
const router = express.Router();
// Removido bcrypt pois não é mais usado

// Função helper para obter Prisma
const prismaConfig = require('../config/prisma');
const getPrisma = () => prismaConfig.getPrisma();

// Importar userService para verificação de senha
const userService = require('../services/user.service');

/**
 * Endpoint para debug do processo de login
 */
router.post('/debug-login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('🔍 DEBUG LOGIN - Iniciando processo...');
    console.log('📧 Email:', email);
    console.log('🔐 Password length:', password ? password.length : 'undefined');
    
    // Buscar usuário
    console.log('👤 Buscando usuário...');
    const user = await getPrisma().user.findFirst({
      where: { email },
      include: { company: true }
    });
    
    if (!user) {
      console.log('❌ Usuário não encontrado');
      return res.json({
        success: false,
        step: 'user_search',
        message: 'Usuário não encontrado',
        email
      });
    }
    
    console.log('✅ Usuário encontrado:', user.email);
    console.log('🏢 Company:', user.company?.name);
    console.log('🔧 IsActive:', user.isActive);
    console.log('🔑 HashedPassword length:', user.password ? user.password.length : 'undefined');
    
    // Verificar senha usando o método correto
    console.log('🔐 Verificando senha...');
    const isPasswordValid = userService.verifyPassword(password, user.password, user.email);
    console.log('✅ Password valid:', isPasswordValid);
    
    // Resposta de debug
    res.json({
      success: isPasswordValid,
      step: 'password_verification',
      data: {
        userFound: true,
        userId: user.id,
        email: user.email,
        name: user.name,
        isActive: user.isActive,
        companyName: user.company?.name,
        passwordMatches: isPasswordValid,
        hashedPasswordStart: user.password ? user.password.substring(0, 10) + '...' : null
      }
    });
    
  } catch (error) {
    console.error('❌ Erro no debug login:', error);
    res.status(500).json({
      success: false,
      step: 'error',
      message: 'Erro interno',
      error: {
        name: error.name,
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }
    });
  }
});

module.exports = router;
