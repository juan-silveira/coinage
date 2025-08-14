import { useState, useEffect, useMemo } from 'react';
import { transactionService } from '@/services/api';
import useAuthStore from '@/store/authStore';

const useTransactionFilters = () => {
  const [filterOptions, setFilterOptions] = useState({
    tokens: [],
    types: [],
    statuses: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const user = useAuthStore((s) => s.user);

  // Mapeamento dos tipos de transação
  const transactionTypeTranslation = {
    transfer: "Transferência",
    deposit: "Depósito", 
    withdraw: "Saque",
    stake: "Investimento",
    unstake: "Resgate",
    exchange: "Troca",
    mint: "Depósito", // mint = criação de tokens = depósito
    burn: "Saque", // burn = queima de tokens = saque
    stake_reward: "Dividendo",
    contract_deploy: "Deploy de Contrato",
    contract_call: "Chamada de Contrato",
    contract_read: "Leitura de Contrato"
  };

  const fetchFilterOptions = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await transactionService.getFilterOptions();
      
      if (response.success && response.data.transactions) {
        const transactions = response.data.transactions;
        
        // Extrair tokens únicos
        const uniqueTokens = [...new Set(
          transactions
            .map(tx => tx.metadata?.tokenSymbol)
            .filter(token => token)
        )];

        // Extrair tipos únicos - combinar transactionType e operations dos metadados
        const transactionTypes = transactions.map(tx => tx.transactionType);
        const operationTypes = transactions
          .map(tx => tx.metadata?.operation)
          .filter(op => op);
        
        const allTypes = [...transactionTypes, ...operationTypes];
        const uniqueTypes = [...new Set(allTypes)]
          .filter(type => type !== 'contract_call'); // Remover contract_call

        // Extrair status únicos
        const uniqueStatuses = [...new Set(
          transactions.map(tx => tx.status)
        )];

        setFilterOptions({
          tokens: uniqueTokens,
          types: uniqueTypes,
          statuses: uniqueStatuses
        });
      }
    } catch (err) {
      console.error('Erro ao buscar opções de filtro:', err);
      setError('Erro ao carregar opções de filtro');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilterOptions();
  }, [user?.id]);

  // Gerar opções para os selects
  const tokenOptions = useMemo(() => [
    { value: "", label: "Todos os tokens" },
    ...filterOptions.tokens.map(token => ({ value: token, label: token }))
  ], [filterOptions.tokens]);

  const typeOptions = useMemo(() => {
    // Mapeamento fixo: da label para o tipo de backend principal
    const backendTypeGroups = {
      "Depósito": ["deposit", "mint"],
      "Dividendo": ["stake_reward"],
      "Investimento": ["stake"],
      "Resgate": ["unstake"],
      "Saque": ["withdraw", "burn"],
      "Transferência": ["transfer"],
      "Troca": ["exchange"]
    };
    
    // Identificar quais labels têm pelo menos um tipo disponível no banco
    const availableLabels = new Set();
    filterOptions.types.forEach(type => {
      for (const [label, backendTypes] of Object.entries(backendTypeGroups)) {
        if (backendTypes.includes(type)) {
          availableLabels.add(label);
          break;
        }
      }
    });
    
    // Sempre incluir Investimento e Resgate, mesmo se não houver dados no banco
    availableLabels.add("Investimento");
    availableLabels.add("Resgate");
    
    // Criar opções para todas as labels
    const options = Array.from(availableLabels).map(label => {
      const backendTypes = backendTypeGroups[label];
      // Usar o primeiro tipo do backend que está disponível, ou o primeiro da lista se nenhum estiver disponível
      const availableType = backendTypes.find(t => filterOptions.types.includes(t)) || backendTypes[0];
      return { value: availableType, label };
    });
    
    return [
      { value: "", label: "Todos os tipos" },
      ...options.sort((a, b) => a.label.localeCompare(b.label))
    ];
  }, [filterOptions.types]);

  const statusOptions = useMemo(() => [
    { value: "", label: "Todos os status" },
    { value: "pending", label: "Pendente" },
    { value: "confirmed", label: "Confirmado" },
    { value: "failed", label: "Falhou" },
    { value: "cancelled", label: "Cancelado" }
  ], []);

  return {
    tokenOptions,
    typeOptions,
    statusOptions,
    loading,
    error,
    refresh: fetchFilterOptions
  };
};

export default useTransactionFilters;