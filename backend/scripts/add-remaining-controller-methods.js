// Script para adicionar métodos faltantes no user.controller.prisma.js

const fs = require('fs');
const path = require('path');

const controllerPath = path.join(__dirname, '../src/controllers/user.controller.prisma.js');

// Lê o arquivo atual
let controllerContent = fs.readFileSync(controllerPath, 'utf8');

// Métodos a serem adicionados antes do fechamento da classe
const newMethods = `
  /**
   * Obtém um usuário por CPF
   */
  async getUserByCpf(req, res) {
    try {
      const { cpf } = req.params;
      const { includePrivateKey } = req.query;
      const requestingUser = req.user;

      const user = await this.userService.getUserByCpf(cpf, includePrivateKey === 'true');

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }

      // Verificar se pode acessar este usuário
      if (requestingUser.clientId !== user.clientId && !requestingUser.isApiAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Acesso negado'
        });
      }

      res.json({
        success: true,
        data: {
          user
        }
      });

    } catch (error) {
      console.error('❌ Erro ao buscar usuário por CPF:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Obtém chaves de usuário (admin)
   */
  async getUserKeysAdmin(req, res) {
    try {
      const { userId } = req.params;
      const requestingUser = req.user;

      // Verificar permissões de admin
      if (!requestingUser.isApiAdmin && !requestingUser.roles.includes('SUPER_ADMIN')) {
        return res.status(403).json({
          success: false,
          message: 'Acesso negado - requer permissões de administrador'
        });
      }

      const user = await this.userService.getUserById(userId, true); // incluir chave privada

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }

      // SUPER_ADMIN pode ver todas as chaves, outros admins só do mesmo cliente
      if (!requestingUser.roles.includes('SUPER_ADMIN') && 
          requestingUser.clientId !== user.clientId) {
        return res.status(403).json({
          success: false,
          message: 'Acesso negado - usuário de cliente diferente'
        });
      }

      res.json({
        success: true,
        data: {
          userId: user.id,
          publicKey: user.publicKey,
          privateKey: requestingUser.roles.includes('SUPER_ADMIN') ? user.privateKey : '[PROTEGIDA]',
          canViewPrivateKey: requestingUser.roles.includes('SUPER_ADMIN'),
          userClient: user.client ? user.client.name : null
        }
      });

    } catch (error) {
      console.error('❌ Erro ao obter chaves do usuário (admin):', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Obtém chaves de usuário (cliente)
   */
  async getUserKeysClient(req, res) {
    try {
      const { userId } = req.params;
      const requestingUser = req.user;

      const user = await this.userService.getUserById(userId, false); // NÃO incluir chave privada

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }

      // Verificar se pode acessar este usuário (mesmo cliente ou admin)
      if (requestingUser.clientId !== user.clientId && !requestingUser.isApiAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Acesso negado'
        });
      }

      res.json({
        success: true,
        data: {
          userId: user.id,
          publicKey: user.publicKey,
          privateKey: '[PROTEGIDA]', // Clientes nunca veem chaves privadas
          canViewPrivateKey: false,
          userClient: user.client ? user.client.name : null
        }
      });

    } catch (error) {
      console.error('❌ Erro ao obter chaves do usuário (cliente):', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Busca chaves de usuário por tipo e valor
   */
  async searchUserKeys(req, res) {
    try {
      const { type, value } = req.params;
      const requestingUser = req.user;

      // Verificar permissões de admin
      if (!requestingUser.isApiAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Acesso negado - requer permissões de administrador'
        });
      }

      let user = null;
      
      switch (type) {
        case 'email':
          user = await this.userService.getUserByEmail(value, requestingUser.roles.includes('SUPER_ADMIN'));
          break;
        case 'cpf':
          user = await this.userService.getUserByCpf(value, requestingUser.roles.includes('SUPER_ADMIN'));
          break;
        case 'address':
          user = await this.userService.getUserByPublicKey(value, requestingUser.roles.includes('SUPER_ADMIN'));
          break;
        default:
          return res.status(400).json({
            success: false,
            message: 'Tipo de busca inválido. Use: email, cpf ou address'
          });
      }

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }

      // SUPER_ADMIN pode ver usuários de qualquer cliente
      if (!requestingUser.roles.includes('SUPER_ADMIN') && 
          requestingUser.clientId !== user.clientId) {
        return res.status(403).json({
          success: false,
          message: 'Acesso negado - usuário de cliente diferente'
        });
      }

      res.json({
        success: true,
        data: {
          userId: user.id,
          name: user.name,
          email: user.email,
          publicKey: user.publicKey,
          privateKey: requestingUser.roles.includes('SUPER_ADMIN') ? user.privateKey : '[PROTEGIDA]',
          canViewPrivateKey: requestingUser.roles.includes('SUPER_ADMIN'),
          userClient: user.client ? user.client.name : null,
          searchType: type,
          searchValue: value
        }
      });

    } catch (error) {
      console.error('❌ Erro ao buscar chaves do usuário:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
`;

// Localiza a linha antes do fechamento da classe (antes do último "}")
const classClosingIndex = controllerContent.lastIndexOf('}');
const beforeClosing = controllerContent.substring(0, classClosingIndex);
const afterClosing = controllerContent.substring(classClosingIndex);

// Adiciona os novos métodos
const newContent = beforeClosing + newMethods + '\n' + afterClosing;

// Escreve o arquivo atualizado
fs.writeFileSync(controllerPath, newContent, 'utf8');

console.log('✅ Métodos faltantes adicionados ao user.controller.prisma.js:');
console.log('   • getUserByCpf');
console.log('   • getUserKeysAdmin'); 
console.log('   • getUserKeysClient');
console.log('   • searchUserKeys');
console.log('📝 Arquivo atualizado em:', controllerPath);
