"use client";
import React, { useState } from "react";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import Tooltip from "@/components/ui/Tooltip";
import { formatCurrency } from "@/constants/tokenPrices";

const Earnings = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Função para obter logo do token
  const getTokenLogo = (symbol) => {
    return `/assets/images/currencies/${symbol}.png`;
  };

  // Dados mockados de proventos - 20 proventos para 4 páginas (5 por página)
  const mockEarnings = [
    // Página 1
    {
      id: 1,
      asset: "AZE-t",
      tokenName: "Azore",
      amount: 5.42342017,
      quote: 2.50, // valor de 1 AZE-t em cBRL
      date: "2025-01-15"
    },
    {
      id: 2,
      asset: "STT",
      tokenName: "Stake Token",
      amount: 17.5000012,
      quote: 0.01,
      date: "2025-01-14"
    },
    {
      id: 3,
      asset: "PCN",
      tokenName: "Pratique Coin",
      amount: 2.15,
      quote: 1.00,
      date: "2025-01-13"
    },
    {
      id: 4,
      asset: "CNT",
      tokenName: "Coinage Trade",
      amount: 1.33,
      quote: 0.75,
      date: "2025-01-12"
    },
    {
      id: 5,
      asset: "MJD",
      tokenName: "Meu Jurídico Digital",
      amount: 0.85,
      quote: 1.25,
      date: "2025-01-11"
    },
    // Página 2
    {
      id: 6,
      asset: "AZE-t",
      tokenName: "Azore",
      amount: 3.38451203,
      quote: 2.50,
      date: "2025-01-10"
    },
    {
      id: 7,
      asset: "STT",
      tokenName: "Stake Token",
      amount: 120.7500025,
      quote: 0.01,
      date: "2025-01-09"
    },
    {
      id: 8,
      asset: "PCN",
      tokenName: "Pratique Coin",
      amount: 100.97,
      quote: 1.00,
      date: "2025-01-08"
    },
    {
      id: 9,
      asset: "CNT",
      tokenName: "Coinage Trade",
      amount: 1.15,
      quote: 0.75,
      date: "2025-01-07"
    },
    {
      id: 10,
      asset: "MJD",
      tokenName: "Meu Jurídico Digital",
      amount: 0.92,
      quote: 1.25,
      date: "2025-01-06"
    },
    // Página 3
    {
      id: 11,
      asset: "AZE-t",
      tokenName: "Azore",
      amount: 1.51234567,
      quote: 2.50,
      date: "2025-01-05"
    },
    {
      id: 12,
      asset: "STT",
      tokenName: "Stake Token",
      amount: 87.2500015,
      quote: 0.01,
      date: "2025-01-04"
    },
    {
      id: 13,
      asset: "PCN",
      tokenName: "Pratique Coin",
      amount: 200.43,
      quote: 1.00,
      date: "2025-01-03"
    },
    {
      id: 14,
      asset: "CNT",
      tokenName: "Coinage Trade",
      amount: 1.67,
      quote: 0.75,
      date: "2025-01-02"
    },
    {
      id: 15,
      asset: "MJD",
      tokenName: "Meu Jurídico Digital",
      amount: 0.78,
      quote: 1.25,
      date: "2025-01-01"
    },
    // Página 4
    {
      id: 16,
      asset: "AZE-t",
      tokenName: "Azore",
      amount: 3.39876543,
      quote: 2.50,
      date: "2024-12-31"
    },
    {
      id: 17,
      asset: "STT",
      tokenName: "Stake Token",
      amount: 246.1250035,
      quote: 0.01,
      date: "2024-12-30"
    },
    {
      id: 18,
      asset: "PCN",
      tokenName: "Pratique Coin",
      amount: 188.88,
      quote: 1.00,
      date: "2024-12-29"
    },
    {
      id: 19,
      asset: "CNT",
      tokenName: "Coinage Trade",
      amount: 1.42,
      quote: 0.75,
      date: "2024-12-28"
    },
    {
      id: 20,
      asset: "MJD",
      tokenName: "Meu Jurídico Digital",
      amount: 0.96,
      quote: 1.25,
      date: "2024-12-27"
    }
  ];

  // Calcular total de ganhos acumulados
  const totalEarnings = mockEarnings.reduce((sum, earning) => sum + (earning.amount * earning.quote), 0);

  // Paginação
  const totalPages = Math.ceil(mockEarnings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentEarnings = mockEarnings.slice(startIndex, startIndex + itemsPerPage);

  const goToPage = (page) => {
    setCurrentPage(page);
  };

  const goToPreviousPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const goToNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  };

  const goToFirstPage = () => {
    setCurrentPage(1);
  };

  const goToLastPage = () => {
    setCurrentPage(totalPages);
  };

  return (
    <Card 
      title="Proventos" 
      subtitle="Acompanhe as distribuições dos proventos gerados pelos seus investimentos"
      headerslot={
        <div className="flex flex-col items-end">
          <span className="text-sm text-slate-500 dark:text-slate-400">Ganhos Acumulados</span>
          <span className="balance font-semibold text-lg">
            {formatCurrency(totalEarnings)}
          </span>
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
              {currentEarnings.length > 0 ? (
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
                              src={getTokenLogo(earning.asset)}
                              alt={earning.asset}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // Fallback para placeholder se imagem não carregar
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 items-center justify-center hidden">
                              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                                {earning.asset.slice(0, 2)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-slate-900 dark:text-white">
                            {earning.asset}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {earning.tokenName}
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    {/* Quantidade */}
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-900 dark:text-white">
                      {parseFloat(earning.amount).toFixed(6)}
                    </td>
                    
                    {/* Valor em BRL com tooltip */}
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white balance">
                      <Tooltip content={`1 ${earning.asset} ≈ ${earning.quote.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 6 })} cBRL`}>
                        <span className="cursor-pointer">
                          {formatCurrency(earning.amount * earning.quote)}
                        </span>
                      </Tooltip>
                    </td>
                    
                    {/* Data */}
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                      {new Date(earning.date).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
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
        {mockEarnings.length > itemsPerPage && (
          <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 rounded-lg">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
              <div className="text-sm text-slate-500 dark:text-slate-400 text-center md:text-left">
                Exibindo {startIndex + 1} ao {Math.min(startIndex + itemsPerPage, mockEarnings.length)} de {mockEarnings.length} registros
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

export default Earnings;