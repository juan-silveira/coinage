"use client";
import React, { useState } from "react";
import Icon from "@/components/ui/Icon";
import Card from "@/components/ui/Card";
import useCacheData from "@/hooks/useCacheData";

const TransactionHistoryTable = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const { balances } = useCacheData();

  // Função para obter logo do token
  const getTokenLogo = (symbol) => {
    return `/assets/images/currencies/${symbol}.png`;
  };

  // Mock data com 20 transações para 4 páginas
  const mockTransactions = [
    // Transfer (2 transactions sequenciais com hashes diferentes)
    {
      id: 1,
      tokenSymbol: "AZE-t",
      tokenName: "Azore",
      txHash: "0xa1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6",
      type: "transfer",
      subType: "debit",
      amount: -150.75,
      date: "2025-01-15"
    },
    {
      id: 2,
      tokenSymbol: "STT", 
      tokenName: "Stake Token",
      txHash: "0xb3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8",
      type: "transfer",
      subType: "credit",
      amount: +1500000.25,
      date: "2025-01-15"
    },
    {
      id: 3,
      tokenSymbol: "cBRL",
      tokenName: "Coinage Real Brasil", 
      txHash: "0xb2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a1",
      type: "deposit",
      subType: "credit",
      amount: +250.0,
      date: "2025-01-14"
    },
    {
      id: 4,
      tokenSymbol: "CNT",
      tokenName: "Coinage Trade",
      tokenLogo: "/assets/images/all-img/cnt-logo.png", 
      txHash: "0xc3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a1b2",
      type: "withdraw",
      subType: "debit",
      amount: -75.50,
      date: "2025-01-13"
    },
    {
      id: 5,
      tokenSymbol: "MJD",
      tokenName: "Meu Jurídico Digital",
      txHash: "0xd4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a1b2c3",
      type: "stake", 
      subType: "debit",
      amount: -500.0,
      date: "2025-01-12"
    },
    // Exchange (2 transactions sequenciais com hashes diferentes)
    {
      id: 6,
      tokenSymbol: "AZE-t",
      tokenName: "Azore",
      txHash: "0xe5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a1b2c3d4",
      type: "exchange",
      subType: "debit", 
      amount: -200.0,
      date: "2025-01-11"
    },
    {
      id: 7,
      tokenSymbol: "PCN",
      tokenName: "Pratique Coin",
      txHash: "0xf6g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2",
      type: "exchange",
      subType: "credit",
      amount: +400.0,
      date: "2025-01-11"
    },
    {
      id: 8,
      tokenSymbol: "STT",
      tokenName: "Stake Token", 
      txHash: "0xf6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a1b2c3d4e5",
      type: "unstake",
      subType: "credit",
      amount: +750000.0,
      date: "2025-01-10"
    },
    {
      id: 9,
      tokenSymbol: "CNT",
      tokenName: "Coinage Trade",
      txHash: "0xg7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a1b2c3d4e5f6",
      type: "deposit",
      subType: "credit",
      amount: +125.25,
      date: "2025-01-09"
    },
    {
      id: 10,
      tokenSymbol: "MJD", 
      tokenName: "Meu Jurídico Digital",
      txHash: "0xh8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a1b2c3d4e5f6g7",
      type: "withdraw",
      subType: "debit",
      amount: -300.0,
      date: "2025-01-08"
    },
    // Transfer (2 transactions com hashes diferentes)
    {
      id: 11,
      tokenSymbol: "PCN",
      tokenName: "Pratique Coin",
      tokenLogo: "/assets/images/all-img/pcn-logo.png", 
      txHash: "0xi9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a1b2c3d4e5f6g7h8",
      type: "transfer",
      subType: "debit",
      amount: -50.0,
      date: "2025-01-07"
    },
    {
      id: 12,
      tokenSymbol: "AZE-t",
      tokenName: "Azore",
      txHash: "0xj0k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f3g4h5i6",
      type: "transfer", 
      subType: "credit",
      amount: +100.0,
      date: "2025-01-07"
    },
    {
      id: 13,
      tokenSymbol: "STT",
      tokenName: "Stake Token",
      txHash: "0xj0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a1b2c3d4e5f6g7h8i9",
      type: "stake",
      subType: "debit",
      amount: -2000000.0,
      date: "2025-01-06"
    },
    {
      id: 14,
      tokenSymbol: "CNT",
      tokenName: "Coinage Trade",
      txHash: "0xk1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a1b2c3d4e5f6g7h8i9j0",
      type: "deposit",
      subType: "credit", 
      amount: +87.75,
      date: "2025-01-05"
    },
    {
      id: 15,
      tokenSymbol: "MJD",
      tokenName: "Meu Jurídico Digital",
      txHash: "0xl2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a1b2c3d4e5f6g7h8i9j0k1",
      type: "unstake",
      subType: "credit",
      amount: +650.0,
      date: "2025-01-04"
    },
    // Exchange (2 transactions com hashes diferentes)
    {
      id: 16,
      tokenSymbol: "STT",
      tokenName: "Stake Token",
      tokenLogo: "/assets/images/all-img/stt-logo.png", 
      txHash: "0xm3n4o5p6q7r8s9t0u1v2w3x4y5z6a1b2c3d4e5f6g7h8i9j0k1l2",
      type: "exchange",
      subType: "debit",
      amount: -1500000.0,
      date: "2025-01-03"
    },
    {
      id: 17,
      tokenSymbol: "CNT",
      tokenName: "Coinage Trade",
      txHash: "0xn4o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f3g4h5i6j7k8l9m0",
      type: "exchange",
      subType: "credit",
      amount: +1125.0,
      date: "2025-01-03"
    },
    {
      id: 18,
      tokenSymbol: "AZE-t",
      tokenName: "Azore",
      txHash: "0xn4o5p6q7r8s9t0u1v2w3x4y5z6a1b2c3d4e5f6g7h8i9j0k1l2m3",
      type: "withdraw",
      subType: "debit",
      amount: -75.0,
      date: "2025-01-02"
    },
    {
      id: 19,
      tokenSymbol: "PCN",
      tokenName: "Pratique Coin",
      txHash: "0xo5p6q7r8s9t0u1v2w3x4y5z6a1b2c3d4e5f6g7h8i9j0k1l2m3n4",
      type: "deposit", 
      subType: "credit",
      amount: +180.50,
      date: "2025-01-01"
    },
    {
      id: 20,
      tokenSymbol: "MJD",
      tokenName: "Meu Jurídico Digital", 
      txHash: "0xp6q7r8s9t0u1v2w3x4y5z6a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5",
      type: "stake",
      subType: "debit",
      amount: -420.0,
      date: "2024-12-31"
    }
  ];

  // Paginação
  const totalPages = Math.ceil(mockTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentTransactions = mockTransactions.slice(startIndex, startIndex + itemsPerPage);

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

  // Função para obter URL da blockchain baseada na rede
  const getBlockchainUrl = (txHash) => {
    const network = balances?.network || 'testnet';
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
      title="Histórico de Transações" 
      subtitle="Confira abaixo o histórico de transações"
    >
      <div className="space-y-4">
        {/* Tabela */}
        <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-slate-50 dark:bg-slate-800">
            <tr>
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
                      {transaction.amount > 0 ? '+' : ''}{transaction.amount.toFixed(2)}
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
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
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

      {/* Pagination */}
      {mockTransactions.length > itemsPerPage && (
        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
            <div className="text-sm text-slate-500 dark:text-slate-400 text-center md:text-left">
              Exibindo {startIndex + 1} ao {Math.min(startIndex + itemsPerPage, mockTransactions.length)} de {mockTransactions.length} registros
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

export default TransactionHistoryTable;