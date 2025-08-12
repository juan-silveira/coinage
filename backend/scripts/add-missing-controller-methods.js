// Script para adicionar métodos faltantes no user.controller.prisma.js

const fs = require('fs');
const path = require('path');

const controllerPath = path.join(__dirname, '../src/controllers/user.controller.prisma.js');

// Lê o arquivo atual
let controllerContent = fs.readFileSync(controllerPath, 'utf8');

// Métodos a serem adicionados antes do fechamento da classe
const newMethods = `
  /**
   * Obtém um usuário por endereço (publicKey)
   */
  async getUserByAddress(req, res) {
    try {
      const { address } = req.params;
      const { includePrivateKey } = req.query;
      
      const user = await this.userService.getUserByPublicKey(address, includePrivateKey === 'true');
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Usuário encontrado com sucesso',
        data: user
      });
    } catch (error) {
      console.error('❌ Erro ao obter usuário por endereço:', error);
      res.status(404).json({
        success: false,
        message: 'Erro ao obter usuário',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Lista saldos de um usuário por endereço
   */
  async getUserBalances(req, res) {
    try {
      const { address } = req.params;
      const { network = 'testnet' } = req.query;
      
      // Importar redisService
      const redisService = require('../services/redis.service');
      const userServiceLegacy = require('../services/user.service');
      
      // Tentar obter dados do cache primeiro
      let cachedBalances = null;
      if (req.user && req.user.id) {
        cachedBalances = await redisService.getCachedUserBalances(req.user.id, address);
      }

      if (cachedBalances) {
        console.log(\`✅ Balances retrieved from cache for user \${req.user.id}, address \${address}\`);
        return res.status(200).json({
          success: true,
          message: 'Saldos obtidos do cache',
          data: cachedBalances,
          fromCache: true
        });
      }

      // Se não há cache, buscar do serviço (usando service legacy temporariamente para balances)
      const result = await userServiceLegacy.getUserBalancesWithCache(address, network, req.user?.id);
      
      // Armazenar no cache se temos dados do usuário
      if (req.user && req.user.id && result.success) {
        await redisService.cacheUserBalances(req.user.id, address, result.data);
      }

      res.status(200).json({
        ...result,
        fromCache: false
      });
    } catch (error) {
      console.error('❌ Erro ao obter saldos do usuário:', error);
      res.status(400).json({
        success: false,
        message: 'Erro ao obter saldos do usuário',
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

console.log('✅ Métodos getUserByAddress e getUserBalances adicionados ao user.controller.prisma.js');
console.log('📝 Arquivo atualizado em:', controllerPath);
