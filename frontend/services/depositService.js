/**
 * Serviço de Depósito Real
 * Conecta com a API backend para gerenciar depósitos
 */

import api from './api';

class DepositService {
  /**
   * Criar nova transação de depósito
   * @param {Object} depositData - Dados do depósito
   * @returns {Promise<Object>} Transação criada
   */
  async createDeposit(depositData) {
    try {
      const response = await api.post('/deposits/create', {
        amount: depositData.amount,
        fee: depositData.fee || 2.50,
        method: depositData.method || 'pix',
        userId: depositData.userId
      });

      if (response.data.success) {
        return {
          success: true,
          transaction: response.data.data
        };
      }

      throw new Error(response.data.message || 'Erro ao criar depósito');
    } catch (error) {
      console.error('Erro ao criar depósito:', error);
      return {
        success: false,
        message: error.message || 'Erro ao processar depósito'
      };
    }
  }

  /**
   * Buscar transação por ID
   * @param {string} transactionId - ID da transação
   * @returns {Promise<Object>} Dados da transação
   */
  async getTransaction(transactionId) {
    try {
      const response = await api.get(`/deposits/transaction/${transactionId}`);

      if (response.data.success) {
        // Mapear dados da API para o formato esperado pelo frontend
        const transaction = response.data.data;
        
        return {
          success: true,
          transaction: {
            id: transaction.id,
            amount: transaction.amount,
            fee: transaction.fee,
            totalAmount: transaction.total_amount,
            status: transaction.status,
            type: transaction.type,
            method: transaction.method,
            createdAt: transaction.created_at,
            updatedAt: transaction.updated_at,
            
            // Dados da blockchain se disponíveis
            blockchainData: transaction.blockchain_data ? {
              transactionHash: transaction.blockchain_data.tx_hash,
              blockNumber: transaction.blockchain_data.block_number,
              gasUsed: transaction.blockchain_data.gas_used,
              gasPrice: transaction.blockchain_data.gas_price,
              confirmations: transaction.blockchain_data.confirmations || 0,
              timestamp: transaction.blockchain_data.timestamp,
              contractAddress: transaction.blockchain_data.contract_address,
              network: transaction.blockchain_data.network || 'testnet'
            } : null,
            
            // Informações do usuário
            user: transaction.user ? {
              id: transaction.user.id,
              name: transaction.user.name,
              email: transaction.user.email,
              walletAddress: transaction.user.public_key
            } : null
          }
        };
      }

      throw new Error(response.data.message || 'Transação não encontrada');
    } catch (error) {
      console.error('Erro ao buscar transação:', error);
      return {
        success: false,
        message: error.message || 'Erro ao buscar transação'
      };
    }
  }

  /**
   * Verificar status da transação periodicamente
   * @param {string} transactionId - ID da transação
   * @param {Function} onUpdate - Callback para atualizações
   * @param {number} intervalMs - Intervalo entre verificações (padrão: 5 segundos)
   * @returns {Function} Função para parar o polling
   */
  pollTransactionStatus(transactionId, onUpdate, intervalMs = 5000) {
    let isPolling = true;
    
    const checkStatus = async () => {
      if (!isPolling) return;
      
      try {
        const result = await this.getTransaction(transactionId);
        
        if (result.success && onUpdate) {
          onUpdate(result.transaction);
          
          // Parar polling se transação foi confirmada ou falhou
          if (result.transaction.status === 'confirmed' || 
              result.transaction.status === 'failed') {
            isPolling = false;
            return;
          }
        }
      } catch (error) {
        console.error('Erro no polling:', error);
      }
      
      // Continuar polling se ainda estiver ativo
      if (isPolling) {
        setTimeout(checkStatus, intervalMs);
      }
    };
    
    // Iniciar polling
    checkStatus();
    
    // Retornar função para parar polling
    return () => {
      isPolling = false;
    };
  }

  /**
   * Confirmar pagamento PIX
   * @param {string} transactionId - ID da transação
   * @param {Object} pixData - Dados do pagamento PIX
   * @returns {Promise<Object>} Resultado da confirmação
   */
  async confirmPixPayment(transactionId, pixData) {
    try {
      const response = await api.post(`/deposits/confirm-pix/${transactionId}`, {
        pix_id: pixData.pixId,
        payer_document: pixData.payerDocument,
        payer_name: pixData.payerName,
        paid_amount: pixData.paidAmount
      });

      if (response.data.success) {
        return {
          success: true,
          message: 'Pagamento PIX confirmado',
          transaction: response.data.data
        };
      }

      throw new Error(response.data.message || 'Erro ao confirmar pagamento');
    } catch (error) {
      console.error('Erro ao confirmar PIX:', error);
      return {
        success: false,
        message: error.message || 'Erro ao confirmar pagamento'
      };
    }
  }

  /**
   * Listar transações do usuário
   * @param {string} userId - ID do usuário
   * @param {Object} filters - Filtros opcionais
   * @returns {Promise<Object>} Lista de transações
   */
  async listUserTransactions(userId, filters = {}) {
    try {
      const params = new URLSearchParams({
        user_id: userId,
        type: 'deposit',
        ...filters
      });

      const response = await api.get(`/deposits/list?${params}`);

      if (response.data.success) {
        return {
          success: true,
          transactions: response.data.data.transactions || [],
          total: response.data.data.total || 0,
          page: response.data.data.page || 1,
          limit: response.data.data.limit || 10
        };
      }

      throw new Error(response.data.message || 'Erro ao listar transações');
    } catch (error) {
      console.error('Erro ao listar transações:', error);
      return {
        success: false,
        message: error.message || 'Erro ao listar transações',
        transactions: []
      };
    }
  }

  /**
   * Obter URL do explorer para a transação
   * @param {string} txHash - Hash da transação
   * @param {string} network - Rede (testnet/mainnet)
   * @returns {string} URL do explorer
   */
  getExplorerUrl(txHash, network = 'testnet') {
    if (!txHash) return null;
    
    const baseUrl = network === 'mainnet' 
      ? 'https://azorescan.com'
      : 'https://floripa.azorescan.com';
    
    return `${baseUrl}/tx/${txHash}`;
  }

  /**
   * Formatar valor em BRL
   * @param {number} value - Valor
   * @returns {string} Valor formatado
   */
  formatBRL(value) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  /**
   * Formatar hash para exibição
   * @param {string} hash - Hash completo
   * @param {number} startChars - Caracteres iniciais
   * @param {number} endChars - Caracteres finais
   * @returns {string} Hash formatado
   */
  formatHash(hash, startChars = 6, endChars = 4) {
    if (!hash || hash.length < startChars + endChars) return hash;
    return `${hash.slice(0, startChars)}...${hash.slice(-endChars)}`;
  }
}

export default new DepositService();