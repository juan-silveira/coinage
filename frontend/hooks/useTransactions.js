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
    // console.log('🔥 [useTransactions] fetchTransactions CHAMADO!');
    // console.log('🔥 [useTransactions] user:', user);
    
    if (!user?.id) {
      // console.log('❌ [useTransactions] Usuário não encontrado, cancelando busca');
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

      // console.log('🔥 [useTransactions] Fazendo requisição com params:', mergedParams);
      const response = await transactionService.getTransactions(mergedParams);
      // console.log('🔥 [useTransactions] Resposta recebida:', response);
      
      // LOGS DE DEBUG - VERIFICAR O QUE CHEGA DO BACKEND
      // console.log('🔥🔥🔥 [useTransactions] RESPOSTA COMPLETA DO BACKEND:', response);
      
      // if (response.success && response.data?.transactions?.length > 0) {
      //   const firstTx = response.data.transactions[0];
      //   console.log('📋 ==================== PRIMEIRA TRANSAÇÃO ====================');
      //   console.log('📋 Transaction Type:', firstTx.transactionType);
      //   console.log('📋 Amount:', firstTx.amount);
      //   console.log('📋 Amount tipo:', typeof firstTx.amount);
      //   console.log('📋 Net Amount:', firstTx.net_amount);
      //   console.log('📋 Net Amount tipo:', typeof firstTx.net_amount);
      //   console.log('📋 ===========================================================');
      // }

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
      console.error('🚨 [useTransactions] ERRO COMPLETO:', err);
      console.error('🚨 [useTransactions] err.message:', err.message);
      console.error('🚨 [useTransactions] err.response:', err.response);
      console.error('🚨 [useTransactions] err.status:', err.status);
      console.error('🚨 [useTransactions] err.request:', err.request);
      setError('Erro ao buscar transações');
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
      // console.log('🔍 parseDecimalValue recebeu:', value, typeof value);
      
      if (!value && value !== 0) return 0;
      
      // Se for um número simples
      if (typeof value === 'number') {
        // console.log('✅ É número:', value);
        return isNaN(value) ? 0 : value;
      }
      
      // Se for string, tentar converter
      if (typeof value === 'string') {
        const parsed = parseFloat(value);
        // console.log('✅ É string, convertido para:', parsed);
        return isNaN(parsed) ? 0 : parsed;
      }
      
      // Se for objeto Decimal do Prisma
      if (typeof value === 'object' && value !== null) {
        // console.log('🔍 É objeto, analisando...', value);
        
        // PRIMEIRA TENTATIVA: toString()
        if (value.toString && typeof value.toString === 'function') {
          try {
            const str = value.toString();
            // console.log('✅ toString() retornou:', str);
            const parsed = parseFloat(str);
            if (!isNaN(parsed)) {
              // console.log('✅ Conversão toString() bem-sucedida:', parsed);
              return parsed;
            }
          } catch (error) {
            console.warn('❌ Erro toString:', error);
          }
        }
        
        // SEGUNDA TENTATIVA: Estrutura Decimal.js {s, e, d}
        if (value.d && Array.isArray(value.d)) {
          const { s = 1, e = 0, d } = value;
          // console.log('🔍 Estrutura Decimal detectada:', { s, e, d });  
          
          if (d.length === 1) {
            // CORREÇÃO: Fórmula correta do Decimal.js: d[0] * s * 10^e
            // {s: 1, e: 1, d: [10]} → 10 * 1 * 10^1 = 100... NÃO!
            // Na verdade: {s: 1, e: 1, d: [10]} → 10.0 (o expoente é relativo)
            // Fórmula real: d[0] * s * Math.pow(10, e - (d[0].toString().length - 1))
            const digits = d[0].toString();
            const numDigits = digits.length;
            const result = (d[0] * s) * Math.pow(10, e - numDigits + 1);
            
            // console.log('✅ Conversão d.length=1:', { d0: d[0], s, e, numDigits, formula: `${d[0]} * ${s} * 10^(${e} - ${numDigits} + 1)`, result });
            return result;
          }
          
          if (d.length === 2) {
            // Para casos como {s: 1, e: 0, d: [100, 50000000]} onde queremos 100.50
            // Vamos tentar reconstruir: juntamos os dígitos e aplicamos a escala correta
            const allDigits = d.join('');
            const totalDigits = allDigits.length;
            const numValue = parseInt(allDigits);
            
            // Aplicar o expoente para posicionar a vírgula decimal
            const result = (numValue * s) * Math.pow(10, e - totalDigits + 1);
            
            // console.log('✅ Conversão d.length=2:', { d, allDigits, totalDigits, numValue, s, e, result });
            return result;
          }
          
          // Para arrays maiores
          try {
            const allDigits = d.join('');
            const totalDigits = allDigits.length;
            const numericValue = parseInt(allDigits);
            const result = (numericValue * s) * Math.pow(10, e - totalDigits + 1);
            // console.log('✅ Conversão complexa:', result);
            return result;
          } catch (error) {
            console.warn('❌ Erro conversão complexa:', error);
          }
        }
        
        // TERCEIRA TENTATIVA: Tentar propriedades diretas
        if (value.toNumber && typeof value.toNumber === 'function') {
          try {
            const result = value.toNumber();
            // console.log('✅ toNumber() bem-sucedido:', result);
            return result;
          } catch (error) {
            console.warn('❌ Erro toNumber:', error);
          }
        }
      }
      
      // console.log('❌ Nenhuma conversão funcionou, retornando 0');
      return 0;
    };

    // 🧪 TESTE DE CONVERSÃO - Se ainda há objetos, testar conversão
    // if (typeof tx.amount === 'object' && tx.amount !== null) {
    //   console.log('🧪 TESTE parseDecimalValue no AMOUNT:', parseDecimalValue(tx.amount));
    // }
    // if (typeof tx.net_amount === 'object' && tx.net_amount !== null) {
    //   console.log('🧪 TESTE parseDecimalValue no NET_AMOUNT:', parseDecimalValue(tx.net_amount));
    // }

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