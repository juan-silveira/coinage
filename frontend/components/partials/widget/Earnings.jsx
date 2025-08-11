"use client";
import React, { useState } from "react";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import { formatCurrency } from "@/constants/tokenPrices";

const Earnings = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Dados mockados de proventos - substituir por dados reais da API
  const mockEarnings = [
    {
      id: 1,
      asset: "AZE-t",
      currency: "BRL",
      quote: "0.42342017",
      valueInBRL: 847.23,
      date: "2025-01-15"
    },
    {
      id: 2,
      asset: "STT",
      currency: "BRL", 
      quote: "999999794.5000012",
      valueInBRL: 1250.45,
      date: "2025-01-10"
    },
    {
      id: 3,
      asset: "PCN",
      currency: "BRL",
      quote: "0",
      valueInBRL: 0,
      date: "2025-01-05"
    },
    {
      id: 4,
      asset: "CNT",
      currency: "BRL",
      quote: "0",
      valueInBRL: 0,
      date: "2025-01-01"
    }
  ];

  const toggleAccordion = () => {
    setIsOpen(!isOpen);
  };

  // Calcular total de ganhos acumulados
  const totalEarnings = mockEarnings.reduce((sum, earning) => sum + earning.valueInBRL, 0);

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
    <Card title="Proventos" subtitle="Acompanhe as distribuições dos proventos gerados pelos seus investimentos">
      <div className="space-y-4">
        {/* Accordion Header */}
        <div
          className={`border rounded-lg overflow-hidden transition-all duration-200 ${
            isOpen
              ? "border-primary-500 shadow-lg"
              : "border-slate-200 dark:border-slate-700"
          }`}
        >
          <div
            className={`flex justify-between items-center p-4 cursor-pointer transition-colors duration-200 ${
              isOpen
                ? "bg-primary-500 text-white"
                : "bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700"
            }`}
            onClick={toggleAccordion}
          >
            <div className="flex items-center space-x-3">
              <span
                className={`text-lg transition-transform duration-200 ${
                  isOpen ? "rotate-180" : ""
                }`}
              >
                <Icon icon="heroicons-outline:chevron-down" />
              </span>
              <span className="font-medium">Proventos</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-sm opacity-80">Ganhos Acumulados</span>
              <span className="balance font-semibold">
                {formatCurrency(totalEarnings)}
              </span>
            </div>
          </div>

          {/* Accordion Content */}
          {isOpen && (
            <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-slate-50 dark:bg-slate-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Ativo
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Moeda
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Cotação
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
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">
                            {earning.asset}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                            {earning.currency}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-900 dark:text-white">
                            {parseFloat(earning.quote).toFixed(6)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white balance">
                            {formatCurrency(earning.valueInBRL)}
                          </td>
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
                <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      Exibindo {startIndex + 1} ao {Math.min(startIndex + itemsPerPage, mockEarnings.length)} de {mockEarnings.length} registros
                    </div>
                    <div className="flex items-center space-x-1">
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
          )}
        </div>
      </div>
    </Card>
  );
};

export default Earnings;