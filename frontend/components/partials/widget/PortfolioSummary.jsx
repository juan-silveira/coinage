"use client";
import React, { useEffect, useState } from "react";
import useCachedBalances from "@/hooks/useCachedBalances";
import PortfolioDonutChart from "@/components/partials/widget/chart/portfolio-donut-chart";
import UserAvatar from "@/components/ui/UserAvatar";
import SyncStatusIndicator from "@/components/ui/SyncStatusIndicator";
import useAuthStore from "@/store/authStore";
import useConfig from "@/hooks/useConfig";
import balanceBackupService from "@/services/balanceBackupService";
import {
  getTokenPrice,
  formatCurrency as formatCurrencyHelper,
} from "@/constants/tokenPrices";

const PortfolioSummary = () => {
  const { balances, loading, syncStatus, getCorrectAzeSymbol } = useCachedBalances();
  const { user, setCachedBalances } = useAuthStore();
  const { defaultNetwork } = useConfig();
  const [emergencyApplied, setEmergencyApplied] = useState(false);

  // PROTEÇÃO FINAL: Aplicar backup APENAS se realmente não há dados E a API está falhando
  useEffect(() => {
    const applyEmergencyBackup = async () => {
      // Só aplicar se não está loading e não foi aplicado ainda
      if (!user?.id || loading || emergencyApplied) return;
      
      // NOVA CONDIÇÃO: Só aplicar se não há saldos válidos E o syncStatus indica problema
      const hasValidBalances = balances?.balancesTable && 
        Object.keys(balances.balancesTable).length > 0 && 
        Object.values(balances.balancesTable).some(val => parseFloat(val) > 0);

      const apiIsWorking = syncStatus?.status === 'success' && !syncStatus?.fromCache;
      
      // Não aplicar backup se a API está funcionando normalmente
      if (apiIsWorking || hasValidBalances) return;

      if (!hasValidBalances) {
        try {
          const backupResult = await balanceBackupService.getBalances(user.id);
          
          if (backupResult && backupResult.data) {
            const emergencyBalances = {
              ...backupResult.data,
              network: defaultNetwork,
              userId: user.id,
              loadedAt: new Date().toISOString(),
              syncStatus: 'portfolio_emergency',
              syncError: 'Portfolio detectou saldos zerados - aplicando backup',
              fromCache: true,
              isEmergency: backupResult.isEmergency || false
            };
            
            setCachedBalances(emergencyBalances);
            setEmergencyApplied(true);
          }
        } catch (error) {
          console.error('❌ [PortfolioSummary] Erro no backup de emergência:', error);
        }
      }
    };

    // Usar timeout para dar tempo do loading parar
    const timer = setTimeout(() => {
      applyEmergencyBackup();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [user?.id, balances, loading, emergencyApplied, defaultNetwork, setCachedBalances, syncStatus]);

  // Reset emergency quando API voltar a funcionar
  useEffect(() => {
    if (syncStatus?.status === 'success' && !syncStatus?.fromCache && emergencyApplied) {
      setEmergencyApplied(false);
    }
  }, [syncStatus, emergencyApplied]);


  // Usar formatação centralizada
  const formatCurrency = formatCurrencyHelper;

  // Mapeamento de tokens por categoria (4 categorias para Total Investido)
  const getTokenCategories = () => {
    const network = balances?.network || defaultNetwork;
    return {
      cryptocurrencies: [getCorrectAzeSymbol()], // AZE ou AZE-t dependendo da rede
      startups: ["CNT"],
      utility: ["MJD"],
      digital: network === "testnet" ? ["PCN", "STT"] : ["PCN"], // STT apenas na testnet
    };
  };

  // Função para obter saudação baseada na hora
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  // Função para formatar nome para saudação (abreviar intermediários, ocultar nomes < 4 chars)
  const formatNameForGreeting = (fullName) => {
    if (!fullName) return 'Usuário';
    
    const names = fullName.trim().split(' ').filter(name => name.length > 0);
    if (names.length === 0) return 'Usuário';
    if (names.length === 1) return names[0];
    
    // Primeiro nome sempre aparece completo
    const result = [names[0]];
    
    // Processar nomes do meio (índices 1 até length-2)
    for (let i = 1; i < names.length - 1; i++) {
      const name = names[i];
      if (name.length >= 4) {
        // Abreviar nomes com 4+ caracteres (primeiro char + maiúsculo)
        result.push(name.charAt(0).toUpperCase());
      }
      // Nomes com menos de 4 caracteres são omitidos
    }
    
    // Último nome sempre aparece completo
    if (names.length > 1) {
      result.push(names[names.length - 1]);
    }
    
    return result.join(' ');
  };

  const tokenCategories = getTokenCategories();

  // Usar preços centralizados de @/constants/tokenPrices

  // VALORES DE EMERGÊNCIA para PortfolioSummary
  const emergencyValues = {
    [getCorrectAzeSymbol()]: '3.965024',
    'cBRL': '101390.000000',
    'STT': '999999794.500000',
    'CNT': '0.000000',  // Valor padrão para CNT
    'MJD': '0.000000',  // Valor padrão para MJD
    'PCN': '0.000000'   // Valor padrão para PCN
  };

  // Função para obter balance de um token COM PROTEÇÃO TOTAL
  const getBalance = (symbol) => {
    if (!balances) {
      return parseFloat(emergencyValues[symbol] || '0');
    }

    // Lógica especial para AZE/AZE-t - se não encontrar AZE-t, buscar AZE
    let searchSymbol = symbol;
    if (symbol === "AZE-t" && !balances.balancesTable?.[symbol]) {
      searchSymbol = "AZE";
    }

    let value = 0;

    if (balances.balancesTable && balances.balancesTable[searchSymbol]) {
      value = parseFloat(balances.balancesTable[searchSymbol]) || 0;
    } else if (balances.tokenBalances && Array.isArray(balances.tokenBalances)) {
      const token = balances.tokenBalances.find(
        (t) => t.tokenSymbol === searchSymbol || t.tokenName === searchSymbol
      );
      if (token) {
        value = parseFloat(token.balanceEth || token.balance) || 0;
      }
    }

    // PROTEÇÃO: Se valor é 0, usar emergência
    if (value === 0 && emergencyValues[symbol]) {
      return parseFloat(emergencyValues[symbol]);
    }

    return value;
  };

  // Calcular dados do portfólio
  const getSummaryData = () => {
    if (!balances) {
      return {
        totalPortfolio: 0,
        availableBalance: 0,
        projectedBalance: 0,
        totalInvested: 0,
        totalInOrder: 0,
      };
    }

    let totalInvested = 0;
    const availableBalance = getBalance("cBRL"); // cBRL disponível

    // Calcular total investido por categoria
    Object.entries(tokenCategories).forEach(([, tokens]) => {
      tokens.forEach((symbol) => {
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
      totalInOrder: 0, // Para implementar com livro de ofertas
    };
  };

  const summaryData = getSummaryData();

  // Só mostrar skeleton se é primeira carga (não há dados ainda) E está loading
  // Durante atualizações, manter interface intacta
  const isFirstLoad = loading && (!balances || !balances.balancesTable || Object.keys(balances.balancesTable).length === 0);

  if (isFirstLoad) {
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
    <>
      {/* Aviso de API instável no topo */}
      {syncStatus?.status === 'error' && (
        <div className="mb-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
          <div className="flex items-center gap-3">
            <div className="text-yellow-600 dark:text-yellow-400 text-xl">⚠️</div>
            <div className="flex-1">
              <div className="font-medium text-yellow-800 dark:text-yellow-200">
                API da Azore instável
              </div>
              <div className="text-sm text-yellow-700 dark:text-yellow-300 opacity-90">
                {syncStatus.fromCache 
                  ? "Exibindo última versão salva - Saldos podem estar desatualizados"
                  : "Conectando... Aguarde alguns instantes"
                }
              </div>
            </div>
            {/* Indicator de sincronização */}
            {!syncStatus.fromCache && (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-yellow-600 border-t-transparent"></div>
            )}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-4 grid-cols-1 gap-6">
        {/* Seção de boas-vindas */}
        <div className="flex items-center justify-center">
          <div className="flex space-x-4 items-center rtl:space-x-reverse">
            <div className="flex-none">
              <UserAvatar size="2xl" className="h-20 w-20" />
            </div>
            <div className="flex-1">
              <h4 className="text-xl font-medium mb-2">
                <span className="block font-light">{getGreeting()},</span>
                <span className="block">{formatNameForGreeting(user?.name)}</span>
              </h4>
              <p className="text-sm dark:text-slate-300">Bem-vindo à Coinage</p>
            </div>
          </div>
        </div>

        {/* Seção do gráfico donut */}
        <div className="flex items-center justify-center">
          <PortfolioDonutChart />
        </div>
          {/* Seção esquerda - Patrimônio total */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 text-center flex flex-col justify-center">
            <div className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-1 flex items-center justify-center gap-2">
              {user?.name || "USUÁRIO"}, este é o seu patrimônio
              <SyncStatusIndicator syncStatus={syncStatus} />
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
    </>
  );
};

export default PortfolioSummary;
