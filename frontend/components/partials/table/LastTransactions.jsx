"use client";
import React, { useState, useMemo } from "react";
import Icon from "@/components/ui/Icon";
import Card from "@/components/ui/Card";
import useCacheData from "@/hooks/useCacheData";
import useTransactions from "@/hooks/useTransactions";
import useConfig from "@/hooks/useConfig";

const LastTransactions = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const { balances } = useCacheData();
  const { defaultNetwork } = useConfig();
  
  // Memoizar parâmetros para evitar recriação do objeto
  const transactionParams = useMemo(() => ({
    page: currentPage,
    limit: itemsPerPage
  }), [currentPage, itemsPerPage]);
  
  // Buscar transações reais do banco de dados
  const { 
    transactions: realTransactions, 
    loading: transactionsLoading, 
    error: transactionsError,
    pagination: transactionsPagination,
    updatePagination 
  } = useTransactions(transactionParams);

  // Função para obter logo do token
  const getTokenLogo = (symbol) => {
    return `/assets/images/currencies/${symbol}.png`;
  };

  // Usar transações reais do banco de dados
  const transactions = realTransactions || [];

  // Paginação usando dados reais
  const totalPages = transactionsPagination.totalPages || 0;
  const currentTransactions = transactions;

  const goToPage = (page) => {
    setCurrentPage(page);
    updatePagination({ page, limit: itemsPerPage });
  };

  const goToPreviousPage = () => {
    const newPage = Math.max(1, currentPage - 1);
    setCurrentPage(newPage);
    updatePagination({ page: newPage, limit: itemsPerPage });
  };

  const goToNextPage = () => {
    const newPage = Math.min(totalPages, currentPage + 1);
    setCurrentPage(newPage);
    updatePagination({ page: newPage, limit: itemsPerPage });
  };

  const goToFirstPage = () => {
    setCurrentPage(1);
    updatePagination({ page: 1, limit: itemsPerPage });
  };

  const goToLastPage = () => {
    setCurrentPage(totalPages);
    updatePagination({ page: totalPages, limit: itemsPerPage });
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

  return (
    <Card 
      title="Últimas Transações" 
      subtitle="Confira abaixo as 5 últimas transações"
      headerslot={
        <div className="flex items-center space-x-2">
          {/* <Button> */}
            <Icon icon="heroicons-outline:arrow-down-circle" />
          {/* </Button> */}
        </div>
      }
    >
      <div className="space-y-4">
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

        {/* Tabela */}
        {!transactionsLoading && !transactionsError && (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-50 dark:bg-slate-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Empresa
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
                  {/* Empresa */}
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
                              // Fallback para placeholder se imagem não carregar
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
                      {(() => {
                        const amount = Number(transaction.amount) || 0;
                        const absAmount = Math.abs(amount);
                        if (isNaN(absAmount)) return '0.00';
                        
                        // Para saques, mostrar o sinal negativo
                        if (transaction.type === 'withdraw' || transaction.subType === 'debit') {
                          return '-' + absAmount.toFixed(2);
                        }
                        // Para depósitos, mostrar o sinal positivo
                        return '+' + absAmount.toFixed(2);
                      })()}
                    </span>
                  </td>
                  
                  {/* Data */}
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                    {new Date(transaction.date).toLocaleDateString('pt-BR')}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                  <div className="flex flex-col items-center">
                    <Icon icon="heroicons-outline:document-text" className="w-12 h-12 mb-2 opacity-50" />
                    <span className="font-medium">Sem resultados</span>
                    <span className="text-sm">Nenhuma transação encontrada</span>
                  </div>
                </td>
              </tr>
            )}
              </tbody>
            </table>
          </div>
        )}

      {/* Pagination */}
      {!transactionsLoading && !transactionsError && (transactionsPagination.total || 0) > itemsPerPage && (
        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
            <div className="text-sm text-slate-500 dark:text-slate-400 text-center md:text-left">
              Exibindo {((currentPage - 1) * itemsPerPage) + 1} ao {Math.min(currentPage * itemsPerPage, transactionsPagination.total || 0)} de {transactionsPagination.total || 0} registros
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
  );
};

export default LastTransactions;