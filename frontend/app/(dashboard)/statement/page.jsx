"use client";
import React, { useState, useMemo, useEffect } from "react";
import Icon from "@/components/ui/Icon";
import Card from "@/components/ui/Card";
import Select from "react-select";
import Button from "@/components/ui/Button";
import useCacheData from "@/hooks/useCacheData";
import useTransactions from "@/hooks/useTransactions";
import useTransactionFilters from "@/hooks/useTransactionFilters";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import useConfig from "@/hooks/useConfig";

const StatementPage = () => {
  // Hook para gerenciar título da aba com contagem de notificações
  useDocumentTitle('Extrato', 'Coinage', true);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [tokenFilter, setTokenFilter] = useState(null);
  const [typeFilter, setTypeFilter] = useState(null);
  const [statusFilter, setStatusFilter] = useState(null);
  const { balances } = useCacheData();
  const { defaultNetwork } = useConfig();
  
  // Hook para buscar opções de filtro
  const { tokenOptions, typeOptions, statusOptions } = useTransactionFilters();

  // Memoizar parâmetros - se há filtro de token, buscar todos os dados
  const transactionParams = useMemo(() => ({
    page: tokenFilter ? 1 : currentPage, // Se há filtro de token, sempre página 1
    limit: tokenFilter ? 1000 : itemsPerPage, // Se há filtro de token, buscar muito mais dados
    status: statusFilter?.value && statusFilter.value !== "" ? statusFilter.value : undefined,
    network: balances?.network || defaultNetwork,
    transactionType: typeFilter?.value && typeFilter.value !== "" ? typeFilter.value : undefined
    // Não enviar tokenSymbol para o backend - faremos filtro local
  }), [tokenFilter ? 1 : currentPage, tokenFilter ? 1000 : itemsPerPage, statusFilter?.value, balances?.network, typeFilter?.value, tokenFilter?.value]);

  // Buscar transações reais do banco de dados
  const { 
    transactions: realTransactions, 
    loading: transactionsLoading, 
    error: transactionsError,
    pagination: transactionsPagination,
    updatePagination 
  } = useTransactions(transactionParams);

  // Mapeamento dos tipos de transação de inglês para português
  const transactionTypeTranslation = {
    transfer: "Transferência",
    deposit: "Depósito", 
    withdraw: "Saque",
    stake: "Investimento",
    unstake: "Resgate",
    exchange: "Troca",
    stake_reward: "Dividendo",
    contract_deploy: "Deploy de Contrato",
    contract_call: "Chamada de Contrato",
    contract_read: "Leitura de Contrato"
  };

  // Função para obter logo do token
  const getTokenLogo = (symbol) => {
    return `/assets/images/currencies/${symbol}.png`;
  };

  // Usar transações reais do banco de dados
  const allTransactions = realTransactions || [];

  // WORKAROUND: Aplicar filtro de token no frontend temporariamente
  // até corrigirmos o problema no backend
  const filteredTransactions = useMemo(() => {
    if (!tokenFilter || !tokenFilter.value) return allTransactions;
    return allTransactions.filter(transaction => {
      return transaction.tokenSymbol === tokenFilter.value;
    });
  }, [allTransactions, tokenFilter]);

  // Usar paginação ajustada para filtros locais
  const totalPages = tokenFilter ? 
    Math.ceil(filteredTransactions.length / itemsPerPage) : 
    transactionsPagination.totalPages || 0;
  
  const currentTransactions = tokenFilter ? 
    filteredTransactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage) :
    allTransactions;


  const itemsPerPageOptions = [
    { value: 10, label: "10 por página" },
    { value: 20, label: "20 por página" },
    { value: 50, label: "50 por página" },
    { value: 100, label: "100 por página" }
  ];

  // Navegação de páginas 
  const goToPage = (page) => {
    setCurrentPage(page);
    // Só atualizar backend se não houver filtro de token (que é local)
    if (!tokenFilter) {
      updatePagination({ 
        page, 
        limit: itemsPerPage,
        status: statusFilter?.value && statusFilter.value !== "" ? statusFilter.value : undefined,
        transactionType: typeFilter?.value && typeFilter.value !== "" ? typeFilter.value : undefined
      });
    }
  };

  const goToPreviousPage = () => {
    const newPage = Math.max(1, currentPage - 1);
    setCurrentPage(newPage);
    if (!tokenFilter) {
      updatePagination({ 
        page: newPage, 
        limit: itemsPerPage,
        status: statusFilter?.value && statusFilter.value !== "" ? statusFilter.value : undefined,
        transactionType: typeFilter?.value && typeFilter.value !== "" ? typeFilter.value : undefined
      });
    }
  };

  const goToNextPage = () => {
    const newPage = Math.min(totalPages, currentPage + 1);
    setCurrentPage(newPage);
    if (!tokenFilter) {
      updatePagination({ 
        page: newPage, 
        limit: itemsPerPage,
        status: statusFilter?.value && statusFilter.value !== "" ? statusFilter.value : undefined,
        transactionType: typeFilter?.value && typeFilter.value !== "" ? typeFilter.value : undefined
      });
    }
  };

  const goToFirstPage = () => {
    setCurrentPage(1);
    if (!tokenFilter) {
      updatePagination({ 
        page: 1, 
        limit: itemsPerPage,
        status: statusFilter?.value && statusFilter.value !== "" ? statusFilter.value : undefined,
        transactionType: typeFilter?.value && typeFilter.value !== "" ? typeFilter.value : undefined
      });
    }
  };

  const goToLastPage = () => {
    setCurrentPage(totalPages);
    if (!tokenFilter) {
      updatePagination({ 
        page: totalPages, 
        limit: itemsPerPage,
        status: statusFilter?.value && statusFilter.value !== "" ? statusFilter.value : undefined,
        transactionType: typeFilter?.value && typeFilter.value !== "" ? typeFilter.value : undefined
      });
    }
  };

  // Função para obter URL da blockchain baseada na rede
  const getBlockchainUrl = (txHash) => {
    const network = balances?.network || defaultNetwork;
    const baseUrl = network === 'mainnet' 
      ? 'https://azorescan.com/tx/' 
      : 'https://floripa.azorescan.com/tx/';
    return `${baseUrl}${txHash}`;
  };

  // Função para truncar hash
  const truncateHash = (hash) => {
    if (!hash) return '';
    return `${hash.slice(0, 8)}...${hash.slice(-8)}`;
  };

  // Função para obter cor do tipo de transação
  const getTransactionColor = (subType) => {
    return subType === 'credit' ? 'text-green-500' : 'text-red-500';
  };

  // Função para obter cor do status
  const getStatusColor = (status) => {
    const statusColors = {
      confirmed: 'text-green-500 bg-green-100 dark:bg-green-500/20',
      pending: 'text-yellow-500 bg-yellow-100 dark:bg-yellow-500/20',
      failed: 'text-red-500 bg-red-100 dark:bg-red-500/20',
      cancelled: 'text-gray-500 bg-gray-100 dark:bg-gray-500/20'
    };
    return statusColors[status] || 'text-gray-500 bg-gray-100 dark:bg-gray-500/20';
  };

  // Função para obter ícone do tipo de transação
  const getTransactionIcon = (type) => {
    const iconMap = {
      transfer: "heroicons:arrow-right-circle",
      exchange: "heroicons:arrow-path", 
      deposit: "heroicons:arrow-down-circle",
      withdraw: "heroicons:arrow-up-circle",
      stake: "heroicons:lock-closed",
      unstake: "heroicons:lock-open",
      stake_reward: "heroicons:gift"
    };
    return iconMap[type] || "heroicons:document";
  };

  // Estilos para react-select
  const selectStyles = {
    option: (provided, state) => ({
      ...provided,
      fontSize: "14px",
    }),
    control: (provided) => ({
      ...provided,
      minHeight: "38px",
      fontSize: "14px",
    }),
  };

  // Limpar filtros
  const clearFilters = () => {
    setTokenFilter(null);
    setTypeFilter(null);
    setStatusFilter(null);
    setCurrentPage(1);
  };

  // Reset pagination when filters change (apenas para filtros backend)
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, typeFilter, tokenFilter, itemsPerPage]);

  // Handle items per page change
  const handleItemsPerPageChange = (option) => {
    setItemsPerPage(option.value);
    setCurrentPage(1);
    if (!tokenFilter) {
      updatePagination({ 
        page: 1, 
        limit: option.value,
        status: statusFilter?.value && statusFilter.value !== "" ? statusFilter.value : undefined,
        transactionType: typeFilter?.value && typeFilter.value !== "" ? typeFilter.value : undefined
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Extrato de Transações
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Histórico completo de todas as suas transações
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            text="Exportar"
            icon="heroicons:arrow-down-tray"
            className="btn-outline-primary"
            onClick={() => {
              // TODO: Implementar exportação
              console.log('Exportar transações filtradas:', filteredTransactions);
            }}
          />
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 items-end">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Token
            </label>
            <Select
              className="react-select"
              classNamePrefix="select"
              options={tokenOptions}
              value={tokenFilter}
              onChange={setTokenFilter}
              placeholder="Filtrar por token"
              styles={selectStyles}
              isClearable
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Tipo de Transação
            </label>
            <Select
              className="react-select"
              classNamePrefix="select"
              options={typeOptions}
              value={typeFilter}
              onChange={setTypeFilter}
              placeholder="Filtrar por tipo"
              styles={selectStyles}
              isClearable
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Status
            </label>
            <Select
              className="react-select"
              classNamePrefix="select"
              options={statusOptions}
              value={statusFilter}
              onChange={setStatusFilter}
              placeholder="Filtrar por status"
              styles={selectStyles}
              isClearable
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Itens por página
            </label>
            <Select
              className="react-select"
              classNamePrefix="select"
              options={itemsPerPageOptions}
              value={itemsPerPageOptions.find(option => option.value === itemsPerPage)}
              onChange={handleItemsPerPageChange}
              styles={selectStyles}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Button
              text="Limpar"
              icon="heroicons:x-mark"
              className="btn-outline-secondary flex-1"
              onClick={clearFilters}
            />
          </div>
        </div>

        {/* Resumo dos filtros */}
        {(tokenFilter || typeFilter || statusFilter) && (
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-slate-600 dark:text-slate-400">Filtros ativos:</span>
              {tokenFilter && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-500/20 dark:text-primary-300">
                  Token: {tokenFilter.label}
                </span>
              )}
              {typeFilter && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-500/20 dark:text-primary-300">
                  Tipo: {typeFilter.label}
                </span>
              )}
              {statusFilter && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-500/20 dark:text-primary-300">
                  Status: {statusFilter.label}
                </span>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Tabela de Transações */}
      <Card>
        <div className="space-y-4">
          {/* Cabeçalho da tabela com contador */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Transações ({transactionsLoading ? '...' : (tokenFilter ? filteredTransactions.length : (transactionsPagination.total || 0))})
            </h3>
          </div>

          {/* Loading/Error States */}
          {transactionsLoading && (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
              <span className="ml-2 text-slate-600 dark:text-slate-400">Carregando transações...</span>
            </div>
          )}

          {transactionsError && !transactionsLoading && (
            <div className="flex flex-col items-center py-8">
              <Icon icon="heroicons-outline:exclamation-triangle" className="w-12 h-12 mb-2 text-red-500" />
              <span className="font-medium text-red-600 dark:text-red-400">Erro ao carregar transações</span>
              <span className="text-sm text-slate-500 dark:text-slate-400">{transactionsError}</span>
            </div>
          )}

          {/* Tabela responsiva */}
          {!transactionsLoading && !transactionsError && (
            <div className="overflow-x-auto">
              <table className="min-w-full">
              <thead className="bg-slate-50 dark:bg-slate-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Token
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    TxHash
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Data
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-700">
                {currentTransactions.length > 0 ? (
                  currentTransactions.map((transaction) => (
                    <tr
                      key={transaction.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors duration-150"
                    >
                      {/* Company */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-900 dark:text-white">
                          {transaction.company?.name || 'N/A'}
                        </div>
                      </td>
                      
                      {/* Token - Logo, Symbol, Name */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="flex-none">
                            <div className="w-8 h-8 rounded-full overflow-hidden">
                              <img
                                src={getTokenLogo(transaction.tokenSymbol)}
                                alt={transaction.tokenSymbol}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 items-center justify-center hidden">
                                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                                  {transaction.tokenSymbol.slice(0, 2)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-slate-900 dark:text-white">
                              {transaction.tokenSymbol}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              {transaction.tokenName}
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      {/* TxHash truncated com link */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <a
                          href={getBlockchainUrl(transaction.txHash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-mono text-primary-500 hover:text-primary-600 hover:underline transition-colors"
                        >
                          {truncateHash(transaction.txHash)}
                        </a>
                      </td>
                      
                      {/* Tipo com ícone */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <Icon 
                            icon={getTransactionIcon(transaction.type)} 
                            className="w-4 h-4 text-slate-500"
                          />
                          <span className="text-sm text-slate-700 dark:text-slate-300">
                            {transactionTypeTranslation[transaction.type] || transaction.type}
                          </span>
                        </div>
                      </td>
                      
                      {/* Valor com cor */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`text-sm font-medium ${getTransactionColor(transaction.subType)}`}>
                          {transaction.amount > 0 ? '+' : ''}{transaction.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                          {statusOptions.find(s => s.value === transaction.status)?.label || transaction.status}
                        </span>
                      </td>
                      
                      {/* Data */}
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                        <div>
                          {new Date(transaction.date).toLocaleDateString('pt-BR')}
                        </div>
                        <div className="text-xs text-slate-500">
                          {new Date(transaction.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                      <div className="flex flex-col items-center">
                        <Icon icon="heroicons-outline:document-text" className="w-12 h-12 mb-2 opacity-50" />
                        <span className="font-medium">Nenhuma transação encontrada</span>
                        <span className="text-sm">Tente ajustar os filtros para ver mais resultados</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

          {/* Pagination */}
          {!transactionsLoading && !transactionsError && (
            (tokenFilter && filteredTransactions.length > itemsPerPage) || 
            (!tokenFilter && (transactionsPagination.total || 0) > itemsPerPage)
          ) && (
            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
                <div className="text-sm text-slate-500 dark:text-slate-400 text-center md:text-left">
                  {tokenFilter ? (
                    `Exibindo ${((currentPage - 1) * itemsPerPage) + 1} ao ${Math.min(currentPage * itemsPerPage, filteredTransactions.length)} de ${filteredTransactions.length} registros`
                  ) : (
                    `Exibindo ${((currentPage - 1) * itemsPerPage) + 1} ao ${Math.min(currentPage * itemsPerPage, transactionsPagination.total || 0)} de ${transactionsPagination.total || 0} registros`
                  )}
                </div>
                <div className="flex items-center justify-center space-x-1">
                  <button
                    onClick={goToFirstPage}
                    disabled={currentPage === 1}
                    className="px-2 py-1 rounded text-slate-500 hover:text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Icon icon="heroicons-outline:chevron-double-left" />
                  </button>
                  <button
                    onClick={goToPreviousPage}
                    disabled={currentPage === 1}
                    className="px-2 py-1 rounded text-slate-500 hover:text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Icon icon="heroicons-outline:chevron-left" />
                  </button>
                  
                  {/* Page Numbers */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      className={`px-3 py-1 rounded text-sm transition-colors ${
                        currentPage === page
                          ? "bg-primary-500 text-white"
                          : "text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  
                  <button
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                    className="px-2 py-1 rounded text-slate-500 hover:text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Icon icon="heroicons-outline:chevron-right" />
                  </button>
                  <button
                    onClick={goToLastPage}
                    disabled={currentPage === totalPages}
                    className="px-2 py-1 rounded text-slate-500 hover:text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Icon icon="heroicons-outline:chevron-double-right" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default StatementPage;