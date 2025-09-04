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
    
    // Mapeamento de currency para nome correto
    const getCurrencyName = (currency) => {
      const currencyMap = {
        'cBRL': 'Coinage Real Brasil',
        'PCN': 'PrecoCoin',
        'STAKE': 'Stake Token',
        'AZE': 'Azore',
        'AZE-t': 'Azore Testnet',
        'USDT': 'Tether',
        'USDC': 'USD Coin',
        'BTC': 'Bitcoin',
        'ETH': 'Ethereum'
      };
      return currencyMap[currency] || currency; // Se não encontrar, usa o próprio símbolo
    };
    
    // Determinar tokenSymbol e tokenName baseado no tipo de transação
    let tokenSymbol = tx.currency || 'AZE-t';
    let tokenName = getCurrencyName(tx.currency);
    
    // Para stake e exchange, verificar se há informações do token nos metadados
    if (tx.transactionType === 'stake' || tx.transactionType === 'unstake' || 
        tx.transactionType === 'stake_reward' || tx.transactionType === 'exchange') {
      
      // Priorizar informações do token dos metadados se disponível
      if (metadata.tokenInfo) {
        tokenSymbol = metadata.tokenInfo.symbol || tx.currency;
        tokenName = getCurrencyName(tokenSymbol);
      } else if (metadata.tokenSymbol) {
        tokenSymbol = metadata.tokenSymbol;
        tokenName = metadata.tokenName || getCurrencyName(tokenSymbol);
      }
    }
    
    // Sobrescrever com valores explícitos dos metadados se existirem
    if (metadata.tokenSymbol) {
      tokenSymbol = metadata.tokenSymbol;
    }
    if (metadata.tokenName) {
      tokenName = metadata.tokenName;
    }
    
    let amount = 0;

    // Helper function to parse decimal values from different formats
    const parseDecimalValue = (value) => {
      if (!value) return 0;
      
      // Se for um número simples
      if (typeof value === 'number') {
        return isNaN(value) ? 0 : value;
      }
      
      // Se for string, tentar converter
      if (typeof value === 'string') {
        const parsed = parseFloat(value);
        return isNaN(parsed) ? 0 : parsed;
      }
      
      // Se for objeto Decimal.js do Prisma: {s: 1, e: 1, d: [97]} = 97
      if (typeof value === 'object' && value.d && Array.isArray(value.d)) {
        const { s = 1, e = 0, d } = value;
        
        // Verificação de segurança para array válido
        if (!Array.isArray(d) || d.length === 0) {
          console.warn('Array d inválido ou vazio:', value);
          return 0;
        }
        
        // Casos específicos baseados nos dados reais:
        if (d.length === 1) {
          // Caso simples: {s: 1, e: 1, d: [97]} = 97
          return d[0] * s;
        }
        
        if (d.length === 2) {
          // Caso com decimais: {s: 1, e: 1, d: [44, 500000]} = 44.5
          // O segundo elemento representa a parte decimal
          const integerPart = d[0];
          const decimalPart = d[1];
          
          // Converter decimal part para string e determinar casas decimais
          const decimalStr = decimalPart.toString();
          const decimalValue = decimalPart / Math.pow(10, decimalStr.length);
          
          return (integerPart + decimalValue) * s;
        }
        
        if (d.length === 3) {
          // Caso com 3 elementos: {s: 1, e: x, d: [a, b, c]} 
          // Normalmente para números decimais mais complexos
          // Tentar reconstruir usando o expoente 'e'
          try {
            const totalDigits = d.join('');
            const numericValue = parseFloat(totalDigits);
            const adjustedValue = numericValue * Math.pow(10, e - totalDigits.length + 1);
            return adjustedValue * s;
          } catch (error) {
            // Se falhar, tentar uma abordagem mais simples
            const firstElement = d[0] || 0;
            return firstElement * s;
          }
        }
        
        // Para arrays maiores que 3 elementos
        if (d.length > 3) {
          try {
            // Tentar usar apenas os primeiros elementos significativos
            const significantPart = d.slice(0, 2);
            const totalDigits = significantPart.join('');
            const numericValue = parseFloat(totalDigits);
            const adjustedValue = numericValue * Math.pow(10, e - totalDigits.length + 1);
            return adjustedValue * s;
          } catch (error) {
            // Se falhar, usar apenas o primeiro elemento
            const firstElement = d[0] || 0;
            return firstElement * s;
          }
        }
        
        // Fallback: tentar reconstruir manualmente
        console.warn('Formato Decimal.js não reconhecido (após todas as tentativas):', value, 'd.length:', d.length);
        return d[0] || 0; // Usar pelo menos o primeiro elemento se existir
      }
      
      // Fallback para outros objetos
      if (typeof value === 'object' && value.toString) {
        try {
          const str = value.toString();
          const parsed = parseFloat(str);
          if (!isNaN(parsed)) return parsed;
        } catch (error) {
          console.warn('Erro ao converter toString:', value, error);
        }
      }
      
      return 0;
    };

    // PRIORIZAR transactionType do banco, depois metadados
    if (tx.transactionType === 'deposit') {
      type = 'deposit';
      subType = 'credit';
      // DEPÓSITO: Usar net_amount (valor líquido que o usuário recebe)
      amount = parseDecimalValue(tx.net_amount) || parseDecimalValue(tx.amount) || 0;
    } else if (tx.transactionType === 'withdraw') {
      type = 'withdraw';
      subType = 'debit';
      // SAQUE: Usar amount (valor bruto que foi solicitado) como valor negativo
      amount = -(parseDecimalValue(tx.amount) || parseDecimalValue(tx.net_amount) || 0);
    } else if (metadata.operation) {
      // Fallback para metadados se transactionType não for direto
      switch (metadata.operation) {
        case 'mint':
          type = 'deposit';
          subType = 'credit';
          // MINT (depósito): usar net_amount
          amount = parseDecimalValue(tx.net_amount) || parseDecimalValue(metadata.netAmount) || parseDecimalValue(metadata.amount) || 0;
          break;
        case 'burn':
          type = 'withdraw';
          subType = 'debit';
          // BURN (saque): usar amount (valor bruto)
          amount = -(parseDecimalValue(tx.amount) || parseDecimalValue(metadata.amount) || parseDecimalValue(tx.net_amount) || 0);
          break;
        case 'transfer':
          type = 'transfer';
          amount = parseDecimalValue(tx.net_amount) || parseDecimalValue(metadata.amount) || 0;
          subType = amount >= 0 ? 'credit' : 'debit';
          break;
        case 'withdraw':
          type = 'withdraw';
          subType = 'debit';
          // WITHDRAW: usar amount (valor bruto)
          amount = -(parseDecimalValue(tx.amount) || parseDecimalValue(metadata.amount) || parseDecimalValue(tx.net_amount) || 0);
          break;
        case 'deposit':
          type = 'deposit';
          subType = 'credit';
          // DEPOSIT: usar net_amount (valor líquido)
          amount = parseDecimalValue(tx.net_amount) || parseDecimalValue(metadata.netAmount) || parseDecimalValue(metadata.amount) || 0;
          break;
        case 'exchange':
          type = 'exchange';
          subType = 'debit';
          amount = parseDecimalValue(tx.net_amount) || parseDecimalValue(metadata.amount) || 0;
          break;
        case 'stake':
          type = 'stake';
          subType = 'debit';
          amount = -(parseDecimalValue(tx.net_amount) || parseDecimalValue(metadata.amount) || 0);
          break;
        case 'unstake':
          type = 'unstake';
          subType = 'credit';
          amount = parseDecimalValue(tx.net_amount) || parseDecimalValue(metadata.amount) || 0;
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
          amount = parseDecimalValue(tx.net_amount) || parseDecimalValue(metadata.amount) || 0;
          subType = amount >= 0 ? 'credit' : 'debit';
      }
    } else {
      // Se não há operação nos metadados, usar o transactionType
      type = tx.transactionType || 'transfer';
      amount = parseDecimalValue(tx.net_amount) || parseDecimalValue(tx.amount) || 0;
      subType = amount >= 0 ? 'credit' : 'debit';
    }

    // Não precisamos mais deste fallback pois já tratamos acima

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