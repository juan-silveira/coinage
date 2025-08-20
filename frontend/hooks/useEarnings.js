import { useState, useEffect, useCallback } from 'react';
import { earningsService } from '@/services/api';
import useAuthStore from '@/store/authStore';
import { useConfigContext } from '@/contexts/ConfigContext';

const useEarnings = (options = {}) => {
  const [earnings, setEarnings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [stats, setStats] = useState({
    totalAmount: 0,
    totalValueInCbrl: 0,
    totalEarnings: 0,
  });

  const { user } = useAuthStore();
  const { config } = useConfigContext();
  const defaultNetwork = config?.defaultNetwork;
  
  const {
    page = 1,
    limit = 20,
    tokenSymbol,
    network = defaultNetwork, // Usar rede padrão da configuração
    startDate,
    endDate,
    sortBy = 'distributionDate',
    sortOrder = 'desc',
    autoFetch = true,
  } = options;

  // Função para buscar proventos
  const fetchEarnings = useCallback(async (fetchOptions = {}) => {
    // console.log('🔍 [useEarnings] fetchEarnings chamado', { user: user?.id, email: user?.email });
    
    if (!user?.id) {
      console.warn('⚠️ [useEarnings] Usuário não autenticado');
      setError('Usuário não autenticado');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = {
        page: fetchOptions.page || page,
        limit: fetchOptions.limit || limit,
        tokenSymbol: fetchOptions.tokenSymbol || tokenSymbol,
        network: fetchOptions.network || network,
        startDate: fetchOptions.startDate || startDate,
        endDate: fetchOptions.endDate || endDate,
        sortBy: fetchOptions.sortBy || sortBy,
        sortOrder: fetchOptions.sortOrder || sortOrder,
      };

      // console.log('🔍 [useEarnings] Fazendo requisição com params:', params);
      const response = await earningsService.getUserEarnings(params);
      // console.log('🔍 [useEarnings] Resposta da API:', response);

      if (response.success) {
        // console.log('✅ [useEarnings] Earnings carregados:', response.data.earnings?.length || 0);
        setEarnings(response.data.earnings);
        setPagination(response.data.pagination);
        setStats(response.data.stats);
      } else {
        console.warn('⚠️ [useEarnings] Erro na resposta:', response.message);
        setError(response.message || 'Erro ao buscar proventos');
      }
    } catch (err) {
      console.error('Erro ao buscar proventos:', err);
      setError(err.message || 'Erro interno ao buscar proventos');
    } finally {
      setLoading(false);
    }
  }, [user?.id, page, limit, tokenSymbol, network, startDate, endDate, sortBy, sortOrder]);

  // Função para buscar dados para gráfico
  const fetchEarningsForChart = useCallback(async (chartOptions = {}) => {
    if (!user?.id) {
      setError('Usuário não autenticado');
      return null;
    }

    try {
      const params = {
        days: chartOptions.days || 30,
        tokenSymbols: chartOptions.tokenSymbols || [],
        network: chartOptions.network || network,
      };

      const response = await earningsService.getEarningsForChart(params);

      if (response.success) {
        return response.data;
      } else {
        setError(response.message || 'Erro ao buscar dados para gráfico');
        return null;
      }
    } catch (err) {
      console.error('Erro ao buscar dados para gráfico:', err);
      setError(err.message || 'Erro interno ao buscar dados para gráfico');
      return null;
    }
  }, [user?.id, network]);

  // Função para buscar resumo
  const fetchEarningsSummary = useCallback(async (summaryNetwork = network) => {
    if (!user?.id) {
      setError('Usuário não autenticado');
      return null;
    }

    try {
      const networkToUse = summaryNetwork || defaultNetwork;
      const response = await earningsService.getEarningsSummary(networkToUse);

      if (response.success) {
        return response.data;
      } else {
        setError(response.message || 'Erro ao buscar resumo dos proventos');
        return null;
      }
    } catch (err) {
      console.error('Erro ao buscar resumo dos proventos:', err);
      setError(err.message || 'Erro interno ao buscar resumo dos proventos');
      return null;
    }
  }, [user?.id, network, defaultNetwork]);

  // Função para buscar por período
  const fetchEarningsByPeriod = useCallback(async (periodStartDate, periodEndDate, periodNetwork = network) => {
    if (!user?.id) {
      setError('Usuário não autenticado');
      return null;
    }

    try {
      const networkToUse = periodNetwork || defaultNetwork;
      const response = await earningsService.getEarningsByPeriod(
        periodStartDate,
        periodEndDate,
        networkToUse
      );

      if (response.success) {
        return response.data;
      } else {
        setError(response.message || 'Erro ao buscar proventos por período');
        return null;
      }
    } catch (err) {
      console.error('Erro ao buscar proventos por período:', err);
      setError(err.message || 'Erro interno ao buscar proventos por período');
      return null;
    }
  }, [user?.id, network, defaultNetwork]);

  // Função para mudar de página
  const goToPage = useCallback((newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchEarnings({ page: newPage });
    }
  }, [pagination.totalPages, fetchEarnings]);

  // Função para aplicar filtros
  const applyFilters = useCallback((filters) => {
    fetchEarnings({ ...filters, page: 1 }); // Reset para primeira página
  }, [fetchEarnings]);

  // Função para limpar filtros
  const clearFilters = useCallback(() => {
    fetchEarnings({
      page: 1,
      tokenSymbol: undefined,
      network: defaultNetwork, // Usar rede padrão da configuração
      startDate: undefined,
      endDate: undefined,
      sortBy: 'distributionDate',
      sortOrder: 'desc',
    });
  }, [fetchEarnings, defaultNetwork]);

  // Função para recarregar dados
  const refresh = useCallback(() => {
    fetchEarnings();
  }, [fetchEarnings]);

  // Auto-fetch na montagem do componente
  useEffect(() => {
    // console.log('🔍 [useEarnings] useEffect autoFetch', { autoFetch, userId: user?.id, email: user?.email });
    if (autoFetch && user?.id) {
      fetchEarnings();
    }
  }, [autoFetch, user?.id, fetchEarnings]);

  return {
    // Estado
    earnings,
    loading,
    error,
    pagination,
    stats,

    // Funções
    fetchEarnings,
    fetchEarningsForChart,
    fetchEarningsSummary,
    fetchEarningsByPeriod,
    goToPage,
    applyFilters,
    clearFilters,
    refresh,

    // Utilitários
    hasEarnings: earnings.length > 0,
    totalEarnings: pagination.total,
    currentPage: pagination.page,
    totalPages: pagination.totalPages,
    hasNextPage: pagination.page < pagination.totalPages,
    hasPrevPage: pagination.page > 1,
  };
};

export default useEarnings;
