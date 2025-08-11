"use client";
import React from "react";
import useCacheData from "@/hooks/useCacheData";
import useAuthStore from "@/store/authStore";
import { getTokenPrice, formatCurrency as formatCurrencyHelper } from "@/constants/tokenPrices";

const PortfolioSummary = () => {
  const { balances, loading } = useCacheData();
  const { user } = useAuthStore();

  // Usar formatação centralizada
  const formatCurrency = formatCurrencyHelper;

  // Função para obter o símbolo correto do AZE baseado na rede
  const getCorrectAzeSymbol = () => {
    const network = balances?.network || 'testnet';
    return network === 'testnet' ? 'AZE-t' : 'AZE';
  };

  // Mapeamento de tokens por categoria (4 categorias para Total Investido)
  const getTokenCategories = () => {
    const network = balances?.network || 'testnet';
    return {
      cryptocurrencies: [getCorrectAzeSymbol()], // AZE ou AZE-t dependendo da rede
      startups: ['CNT'],
      utility: ['MJD'],
      digital: network === 'testnet' ? ['PCN', 'STT'] : ['PCN'] // STT apenas na testnet
    };
  };
  
  const tokenCategories = getTokenCategories();

  // Usar preços centralizados de @/constants/tokenPrices

  // Função para obter balance de um token
  const getBalance = (symbol) => {
    if (!balances) return 0;
    
    // Lógica especial para AZE/AZE-t - se não encontrar AZE-t, buscar AZE
    let searchSymbol = symbol;
    if (symbol === 'AZE-t' && !balances.balancesTable?.[symbol]) {
      searchSymbol = 'AZE';
    }
    
    if (balances.balancesTable && balances.balancesTable[searchSymbol]) {
      const value = parseFloat(balances.balancesTable[searchSymbol]) || 0;
      return value;
    }
    
    if (balances.tokenBalances && Array.isArray(balances.tokenBalances)) {
      const token = balances.tokenBalances.find(t => t.tokenSymbol === searchSymbol || t.tokenName === searchSymbol);
      if (token) {
        const value = parseFloat(token.balanceEth || token.balance) || 0;
        return value;
      }
    }
    return 0;
  };

  // Calcular dados do portfólio
  const getSummaryData = () => {
    if (!balances) {
      return {
        totalPortfolio: 0,
        availableBalance: 0,
        projectedBalance: 0,
        totalInvested: 0,
        totalInOrder: 0
      };
    }

    let totalInvested = 0;
    const availableBalance = getBalance('cBRL'); // cBRL disponível
    
    // Calcular total investido por categoria
    Object.entries(tokenCategories).forEach(([, tokens]) => {
      tokens.forEach(symbol => {
        const balance = getBalance(symbol);
        const price = getTokenPrice(symbol);
        const valueBRL = balance * price;
        totalInvested += valueBRL;
      });
    });

    const totalPortfolio = totalInvested + availableBalance;

    return {
      totalPortfolio,
      availableBalance,
      projectedBalance: 0, // Para implementar com stake
      totalInvested,
      totalInOrder: 0 // Para implementar com livro de ofertas
    };
  };

  const summaryData = getSummaryData();

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6">
        <div className="space-y-4">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4">
      {/* Desktop: grid lado a lado | Mobile: stack vertical */}
      <div className="grid lg:grid-cols-2 grid-cols-1 gap-4">
      {/* Seção esquerda - Patrimônio total */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-4 text-center flex flex-col justify-center">
        <div className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-1">
          {user?.name || 'USUÁRIO'}, este é o seu patrimônio
        </div>
        <div className="text-2xl font-bold text-slate-900 dark:text-white balance">
          {formatCurrency(summaryData.totalPortfolio)}
        </div>
      </div>

        {/* Grid 2x2 - Desktop: ao lado | Mobile: abaixo */}
        <div className="grid grid-cols-2 gap-2">
        {/* Saldo disponível */}
        <div className="bg-white dark:bg-slate-800 rounded-lg p-3 text-center">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">
            Saldo disponível
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-white balance">
            {formatCurrency(summaryData.availableBalance)}
          </div>
        </div>

        {/* Saldo projetado */}
        <div className="bg-white dark:bg-slate-800 rounded-lg p-3 text-center">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">
            Saldo projetado
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-white balance">
            {formatCurrency(summaryData.projectedBalance)}
          </div>
        </div>

        {/* Total investido */}
        <div className="bg-white dark:bg-slate-800 rounded-lg p-3 text-center">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">
            Total investido
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-white balance">
            {formatCurrency(summaryData.totalInvested)}
          </div>
        </div>

        {/* Total em ordem */}
        <div className="bg-white dark:bg-slate-800 rounded-lg p-3 text-center">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">
            Total em Ordem
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-white balance">
            {formatCurrency(summaryData.totalInOrder)}
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default PortfolioSummary;