const tokenService = require('../services/token.service');

/**
 * Controller para gerenciamento de tokens ERC20
 */
class TokenController {
  /**
   * Obtém o saldo de um token ERC20
   */
  async getTokenBalance(req, res) {
    try {
      const { contractAddress, walletAddress, network = 'testnet' } = req.query;
      
      if (!contractAddress) {
        return res.status(400).json({
          success: false,
          message: 'Endereço do contrato é obrigatório'
        });
      }

      if (!walletAddress) {
        return res.status(400).json({
          success: false,
          message: 'Endereço da carteira é obrigatório'
        });
      }

      const result = await tokenService.getTokenBalance(contractAddress, walletAddress, network);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao consultar saldo do token',
        error: error.message
      });
    }
  }

  /**
   * Executa função mint do token (requer gás)
   */
  async mintToken(req, res) {
    try {
      const { 
        contractAddress, 
        toAddress, 
        amount, 
        gasPayer, 
        network = 'testnet',
        options = {}
      } = req.body;
      
      if (!contractAddress) {
        return res.status(400).json({
          success: false,
          message: 'Endereço do contrato é obrigatório'
        });
      }

      if (!toAddress) {
        return res.status(400).json({
          success: false,
          message: 'Endereço de destino é obrigatório'
        });
      }

      if (!amount) {
        return res.status(400).json({
          success: false,
          message: 'Quantidade é obrigatória'
        });
      }

      if (!gasPayer) {
        return res.status(400).json({
          success: false,
          message: 'Endereço do pagador de gás é obrigatório'
        });
      }

      const result = await tokenService.mintToken(
        contractAddress, 
        toAddress, 
        amount, 
        gasPayer, 
        network, 
        {
          ...options,
          companyId: req.company?.id,
          userId: req.user?.id
        }
      );
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao mintar tokens',
        error: error.message
      });
    }
  }

  /**
   * Executa função burnFrom do token (requer gás)
   */
  async burnFromToken(req, res) {
    try {
      const { 
        contractAddress, 
        fromAddress, 
        amount, 
        gasPayer, 
        network = 'testnet',
        options = {}
      } = req.body;
      
      if (!contractAddress) {
        return res.status(400).json({
          success: false,
          message: 'Endereço do contrato é obrigatório'
        });
      }

      if (!fromAddress) {
        return res.status(400).json({
          success: false,
          message: 'Endereço de origem é obrigatório'
        });
      }

      if (!amount) {
        return res.status(400).json({
          success: false,
          message: 'Quantidade é obrigatória'
        });
      }

      if (!gasPayer) {
        return res.status(400).json({
          success: false,
          message: 'Endereço do pagador de gás é obrigatório'
        });
      }

      const result = await tokenService.burnFromToken(
        contractAddress, 
        fromAddress, 
        amount, 
        gasPayer, 
        network, 
        {
          ...options,
          companyId: req.company?.id,
          userId: req.user?.id
        }
      );
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao queimar tokens',
        error: error.message
      });
    }
  }

  /**
   * Executa função transferFromGasless do token (requer gás)
   */
  async transferFromGasless(req, res) {
    try {
      const { 
        contractAddress, 
        fromAddress, 
        toAddress, 
        amount, 
        gasPayer, 
        network = 'testnet',
        options = {}
      } = req.body;
      
      if (!contractAddress) {
        return res.status(400).json({
          success: false,
          message: 'Endereço do contrato é obrigatório'
        });
      }

      if (!fromAddress) {
        return res.status(400).json({
          success: false,
          message: 'Endereço de origem é obrigatório'
        });
      }

      if (!toAddress) {
        return res.status(400).json({
          success: false,
          message: 'Endereço de destino é obrigatório'
        });
      }

      if (!amount) {
        return res.status(400).json({
          success: false,
          message: 'Quantidade é obrigatória'
        });
      }

      if (!gasPayer) {
        return res.status(400).json({
          success: false,
          message: 'Endereço do pagador de gás é obrigatório'
        });
      }

      const result = await tokenService.transferFromGasless(
        contractAddress, 
        fromAddress, 
        toAddress, 
        amount, 
        gasPayer, 
        network, 
        {
          ...options,
          companyId: req.company?.id,
          userId: req.user?.id
        }
      );
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro na transferência sem gás',
        error: error.message
      });
    }
  }

  /**
   * Registra um contrato de token no sistema
   */
  async registerToken(req, res) {
    try {
      const { 
        address, 
        network = 'testnet',
        adminPublicKey,
        website,
        description
      } = req.body;
      
      if (!address) {
        return res.status(400).json({
          success: false,
          message: 'Endereço do contrato é obrigatório'
        });
      }

      // adminPublicKey é opcional - pode ser definido posteriormente
      if (adminPublicKey && !ethers.isAddress(adminPublicKey)) {
        return res.status(400).json({
          success: false,
          message: 'adminPublicKey inválido se fornecido'
        });
      }

      const tokenData = {
        address,
        network,
        adminPublicKey,
        website,
        description
      };

      const result = await tokenService.registerToken(tokenData);
      
      // Retornar 200 para update, 201 para criação
      const statusCode = result.data.tokenInfo.isUpdate ? 200 : 201;
      res.status(statusCode).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao registrar token',
        error: error.message
      });
    }
  }

  /**
   * Lista todos os tokens registrados
   */
  async listTokens(req, res) {
    try {
      const { page, limit, network, contractType, isActive } = req.query;
      const options = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        network,
        contractType,
        isActive: isActive !== undefined ? isActive === 'true' : undefined
      };
      
      const result = await tokenService.listTokens(options);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao listar tokens',
        error: error.message
      });
    }
  }

  /**
   * Desativa um token
   */
  async deactivateToken(req, res) {
    try {
      const { contractAddress } = req.params;
      console.log('🔍 [DEACTIVATE] Endereço recebido:', contractAddress);
      
      if (!contractAddress) {
        return res.status(400).json({
          success: false,
          message: 'Endereço do contrato é obrigatório'
        });
      }

      // Buscar e atualizar diretamente
      const contract = await global.prisma.smartContract.findFirst({
        where: { address: contractAddress }
      });
      
      console.log('🔍 [DEACTIVATE] Token encontrado:', !!contract);

      if (!contract) {
        return res.status(400).json({
          success: false,
          message: 'Token não encontrado'
        });
      }

      await global.prisma.smartContract.update({
        where: { id: contract.id },
        data: { isActive: false }
      });

      res.status(200).json({
        success: true,
        message: 'Token desativado com sucesso',
        data: {
          address: contractAddress,
          isActive: false
        }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao desativar token',
        error: error.message
      });
    }
  }

  /**
   * Ativa um token
   */
  async activateToken(req, res) {
    try {
      const { contractAddress } = req.params;
      
      if (!contractAddress) {
        return res.status(400).json({
          success: false,
          message: 'Endereço do contrato é obrigatório'
        });
      }

      // Buscar e atualizar diretamente
      const contract = await global.prisma.smartContract.findFirst({
        where: { address: contractAddress }
      });

      if (!contract) {
        return res.status(400).json({
          success: false,
          message: 'Token não encontrado'
        });
      }

      await global.prisma.smartContract.update({
        where: { id: contract.id },
        data: { isActive: true }
      });

      res.status(200).json({
        success: true,
        message: 'Token ativado com sucesso',
        data: {
          address: contractAddress,
          isActive: true
        }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao ativar token',
        error: error.message
      });
    }
  }

  /**
   * Obtém informações básicas do token
   */
  async getTokenInfo(req, res) {
    try {
      const { contractAddress } = req.params;
      const { network = 'testnet' } = req.query;
      
      if (!contractAddress) {
        return res.status(400).json({
          success: false,
          message: 'Endereço do contrato é obrigatório'
        });
      }

      const result = await tokenService.getTokenInfo(contractAddress, network);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao obter informações do token',
        error: error.message
      });
    }
  }

  /**
   * Atualiza informações do token
   */
  async updateTokenInfo(req, res) {
    try {
      const { contractAddress } = req.params;
      const metadata = req.body;
      
      if (!contractAddress) {
        return res.status(400).json({
          success: false,
          message: 'Endereço do contrato é obrigatório'
        });
      }

      // Buscar o token no banco de dados
      const contract = await global.prisma.smartContract.findFirst({
        where: { address: contractAddress }
      });

      if (!contract) {
        return res.status(400).json({
          success: false,
          message: 'Token não encontrado'
        });
      }

      // Atualizar as informações do token
      const updatedContract = await global.prisma.smartContract.update({
        where: { id: contract.id },
        data: {
          ...metadata,
          updatedAt: new Date()
        }
      });

      res.status(200).json({
        success: true,
        message: 'Informações do token atualizadas com sucesso',
        data: updatedContract
      });
    } catch (error) {
      console.error('Error updating token info:', error);
      res.status(400).json({
        success: false,
        message: 'Erro ao atualizar informações do token',
        error: error.message
      });
    }
  }

  /**
   * Testa o serviço de tokens
   */
  async testService(req, res) {
    try {
      const result = await tokenService.testService();
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro no teste do serviço de tokens',
        error: error.message
      });
    }
  }

  /**
   * Obtém o saldo da moeda nativa AZE
   */
  async getAzeBalance(req, res) {
    try {
      const { walletAddress, network = 'testnet' } = req.query;
      if (!walletAddress) {
        return res.status(400).json({
          success: false,
          message: 'Endereço da carteira é obrigatório'
        });
      }
      const result = await tokenService.getAzeBalance(walletAddress, network);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erro ao consultar saldo da moeda AZE',
        error: error.message
      });
    }
  }
}

module.exports = new TokenController(); 