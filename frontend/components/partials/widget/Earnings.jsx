"use client";
import React, { useState } from "react";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import Tooltip from "@/components/ui/Tooltip";
import { formatCurrency } from "@/constants/tokenPrices";
import useEarnings from "@/hooks/useEarnings";
import { BalanceDisplay } from "@/utils/balanceUtils";

const Earnings = ({ earningsData }) => {
  // Hook local para gerenciar paginação
  const localEarningsHook = useEarnings({
    limit: 5, // 5 itens por página
    autoFetch: true,
  });

  // Usar dados passados como props ou fallback para o hook local
  const {
    earnings,
    loading,
    error,
    pagination,
    stats,
    goToPage,
    refresh,
  } = earningsData || localEarningsHook;

  // Função para obter logo do token
  const getTokenLogo = (symbol) => {
    return `/assets/images/currencies/${symbol}.png`;
  };

  // Calcular total de ganhos acumulados
  const totalEarnings = stats.totalValueInCbrl || 0;

  // Paginação
  const totalPages = pagination.totalPages;
  const currentPage = pagination.page;
  const startIndex = (currentPage - 1) * pagination.limit;
  const currentEarnings = earnings;

  const goToPreviousPage = () => {
    if (pagination.page > 1) {
      goToPage(pagination.page - 1);
    }
  };

  const goToNextPage = () => {
    if (pagination.page < pagination.totalPages) {
      goToPage(pagination.page + 1);
    }
  };

  const goToFirstPage = () => {
    goToPage(1);
  };

  const goToLastPage = () => {
    goToPage(pagination.totalPages);
  };

  return (
    <Card 
      title="Proventos" 
      subtitle="Acompanhe as distribuições dos proventos gerados pelos seus investimentos"
      headerslot={
        <div className="flex flex-col items-end">
          <span className="text-sm text-slate-500 dark:text-slate-400">Ganhos Acumulados</span>
          {loading && (!earnings || earnings.length === 0) ? (
            <div className="h-6 w-20 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-500 rounded animate-pulse"></div>
          ) : (
            <span className="balance font-semibold text-lg">
              {formatCurrency(totalEarnings)}
            </span>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        {/* Tabela direta sem accordion */}
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-slate-50 dark:bg-slate-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Token
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Quantidade
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Valor em BRL
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Data
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                    <div className="flex flex-col items-center">
                      <Icon icon="heroicons-outline:refresh" className="w-12 h-12 mb-2 opacity-50 animate-spin" />
                      <span className="font-medium">Carregando...</span>
                      <span className="text-sm">Buscando proventos</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                    <div className="flex flex-col items-center">
                      <Icon icon="heroicons-outline:exclamation-triangle" className="w-12 h-12 mb-2 text-red-500" />
                      <span className="font-medium text-red-600">Erro ao carregar</span>
                      <span className="text-sm">{error}</span>
                      <button
                        onClick={refresh}
                        className="mt-2 px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-600 transition-colors"
                      >
                        Tentar novamente
                      </button>
                    </div>
                  </td>
                </tr>
              ) : currentEarnings.length > 0 ? (
                currentEarnings.map((earning) => (
                  <tr
                    key={earning.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors duration-150"
                  >
                    {/* Token - Logo, Symbol, Name */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className="flex-none">
                          <div className="w-8 h-8 rounded-full overflow-hidden">
                            <img
                              src={getTokenLogo(earning.tokenSymbol)}
                              alt={earning.tokenSymbol}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // Fallback para placeholder se imagem não carregar
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 items-center justify-center hidden">
                              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                                {earning.tokenSymbol.slice(0, 2)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-slate-900 dark:text-white">
                            {earning.tokenSymbol}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {earning.tokenName}
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    {/* Quantidade */}
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-900 dark:text-white">
                      <BalanceDisplay value={earning.amount} showSymbol={false} />
                    </td>
                    
                    {/* Valor em BRL com tooltip */}
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white balance">
                      <Tooltip content={`1 ${earning.tokenSymbol} ≈ ${parseFloat(earning.quote).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 6 })} cBRL`}>
                        <span className="cursor-pointer">
                          {formatCurrency(earning.amount * earning.quote)}
                        </span>
                      </Tooltip>
                    </td>
                    
                    {/* Data */}
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                      {new Date(earning.distributionDate).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                    <div className="flex flex-col items-center">
                      <Icon icon="heroicons-outline:document-text" className="w-12 h-12 mb-2 opacity-50" />
                      <span className="font-medium">Sem resultados</span>
                      <span className="text-sm">Nenhum provento encontrado</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.total > pagination.limit && (
          <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
              <div className="text-sm text-slate-500 dark:text-slate-400 text-center md:text-left">
                Exibindo {startIndex + 1} ao {Math.min(startIndex + pagination.limit, pagination.total)} de {pagination.total} registros
              </div>
              <div className="flex items-center justify-center space-x-1">
                <button
                  onClick={goToFirstPage}
                  disabled={pagination.page === 1}
                  className="px-2 py-1 rounded text-slate-500 hover:text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Icon icon="heroicons-outline:chevron-double-left" />
                </button>
                <button
                  onClick={goToPreviousPage}
                  disabled={pagination.page === 1}
                  className="px-2 py-1 rounded text-slate-500 hover:text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Icon icon="heroicons-outline:chevron-left" />
                </button>
                
                {/* Page Numbers */}
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`px-3 py-1 rounded text-sm transition-colors ${
                      pagination.page === page
                        ? "bg-primary-500 text-white"
                        : "text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                    }`}
                  >
                    {page}
                  </button>
                ))}
                
                <button
                  onClick={goToNextPage}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-2 py-1 rounded text-slate-500 hover:text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Icon icon="heroicons-outline:chevron-right" />
                </button>
                <button
                  onClick={goToLastPage}
                  disabled={pagination.page === pagination.totalPages}
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

export default Earnings;