import { useState, useEffect, useCallback, useMemo } from 'react';
import { transactionService } from '@/services/api';
import useAuthStore from '@/store/authStore';
import { useConfigContext } from '@/contexts/ConfigContext';

const useTransactions = (initialParams = {}) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0
  });

  const user = useAuthStore((s) => s.user);
  const { config } = useConfigContext();
  const defaultNetwork = config?.defaultNetwork;

  // Estabilizar initialParams com useMemo para evitar mudanças desnecessárias
  const stableInitialParams = useMemo(() => initialParams, [
    initialParams.page,
    initialParams.limit,
    initialParams.status,
    initialParams.network,
    initialParams.transactionType
  ]);

  const fetchTransactions = useCallback(async (params = {}) => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const mergedParams = {
        page: 1,
        limit: 20,
        ...stableInitialParams,
        ...params
      };

      const response = await transactionService.getTransactions(mergedParams);

      if (response.success) {
        setTransactions(response.data.transactions || []);
        setPagination(response.data.pagination || {
          total: 0,
          page: mergedParams.page,
          limit: mergedParams.limit,
          totalPages: 0
        });
      } else {
        setError(response.message || 'Erro ao carregar transações');
      }
    } catch (err) {
      console.error('Erro ao buscar transações:', err);
      setError('Erro ao carregar transações');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, stableInitialParams]);

  const refreshTransactions = useCallback(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const updatePagination = useCallback((newParams) => {
    fetchTransactions(newParams);
  }, [fetchTransactions]);

  // Fetch inicial - usar estado para controlar execução única
  useEffect(() => {
    if (user?.id) {
      fetchTransactions(stableInitialParams);
    }
  }, [user?.id, stableInitialParams]); // Dependência do user.id e params estáveis

  // Transformar dados das transações para o formato esperado pelos componentes
  const transformedTransactions = transactions.map(tx => {
    const metadata = tx.metadata || {};
    
    // Mapear tipos de transação do backend para o frontend
    let type = 'transfer';
    let subType = 'debit';
    let tokenSymbol = metadata.tokenSymbol || 'AZE-t';
    let tokenName = metadata.tokenName || 'Azore';
    let amount = 0;

    // Determinar tipo baseado nos metadados
    if (metadata.operation) {
      switch (metadata.operation) {
        case 'mint':
          type = 'deposit';
          subType = 'credit';
          amount = parseFloat(metadata.amount || 0);
          break;
        case 'burn':
          type = 'withdraw';
          subType = 'debit';
          amount = -parseFloat(metadata.amount || 0);
          break;
        case 'transfer':
          type = 'transfer';
          // Determinar se é crédito ou débito baseado nos endereços
          // Por agora, usar valor positivo para crédito
          amount = parseFloat(metadata.amount || 0);
          subType = amount >= 0 ? 'credit' : 'debit';
          break;
        case 'withdraw':
          type = 'withdraw';
          subType = 'debit';
          amount = -parseFloat(metadata.amount || 0);
          break;
        case 'deposit':
          type = 'deposit';
          subType = 'credit';
          amount = parseFloat(metadata.amount || 0);
          break;
        case 'exchange':
          type = 'exchange';
          subType = 'debit';
          amount = parseFloat(metadata.amount || 0);
          break;
        case 'stake':
          type = 'stake';
          subType = 'debit';
          amount = -parseFloat(metadata.amount || 0);
          break;
        case 'unstake':
          type = 'unstake';
          subType = 'credit';
          amount = parseFloat(metadata.amount || 0);
          break;
        case 'grant_role':
        case 'revoke_role':
          type = 'contract_call';
          subType = 'debit';
          amount = 0;
          break;
        default:
          // Para operações desconhecidas, usar o transactionType
          type = tx.transactionType || 'transfer';
          amount = parseFloat(metadata.amount || 0);
          subType = amount >= 0 ? 'credit' : 'debit';
      }
    } else {
      // Se não há operação nos metadados, usar o transactionType
      type = tx.transactionType || 'transfer';
      amount = parseFloat(metadata.amount || 0);
      subType = amount >= 0 ? 'credit' : 'debit';
    }

    // Fallback para informações do token se não estiver nos metadados
    if (!tokenSymbol || tokenSymbol === 'AZE-t') {
      // Mapear baseado no tipo de transação ou contrato
      if (tx.transactionType === 'contract_call') {
        // Verificar endereço do contrato para determinar token
        const contractMappings = {
          '0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB': { symbol: 'cBRL', name: 'Coinage Real Brasil' },
          '0xCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC': { symbol: 'STT', name: 'Stake Token' },
          '0x8888888888888888888888888888888888888888': { symbol: 'CNT', name: 'Coinage Trade' }
        };
        
        const contractInfo = contractMappings[tx.toAddress];
        if (contractInfo) {
          tokenSymbol = contractInfo.symbol;
          tokenName = contractInfo.name;
        }
      }
    }

    return {
      id: tx.id,
      tokenSymbol,
      tokenName,
      txHash: tx.txHash,
      type,
      subType,
      amount,
      date: tx.createdAt || new Date().toISOString(),
      status: tx.status === 'confirmed' ? 'confirmed' : 
              tx.status === 'failed' ? 'failed' : 
              tx.status === 'cancelled' ? 'cancelled' : 'pending',
      blockNumber: tx.blockNumber,
      fromAddress: tx.fromAddress,
      toAddress: tx.toAddress,
      functionName: tx.functionName,
      functionParams: tx.functionParams,
      gasUsed: tx.gasUsed,
      gasPrice: tx.gasPrice,
      metadata: tx.metadata,
      network: tx.network || defaultNetwork,
              // Preservar dados da empresa da API
        company: tx.company || null,
        companyId: tx.companyId
    };
  });

  return {
    transactions: transformedTransactions,
    loading,
    error,
    pagination,
    fetchTransactions,
    refreshTransactions,
    updatePagination,
    rawTransactions: transactions // Dados originais se necessário
  };
};

export default useTransactions;