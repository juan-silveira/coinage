"use client";
import React from "react";
import dynamic from "next/dynamic";
import useCacheData from "@/hooks/useCacheData";
import { getTokenPrice, formatCurrency as formatCurrencyHelper } from "@/constants/tokenPrices";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const PortfolioDonutChart = () => {
  const { balances, loading } = useCacheData();

  // Usar formatação centralizada
  const formatCurrency = formatCurrencyHelper;

  // Função para obter o símbolo correto do AZE baseado na rede
  const getCorrectAzeSymbol = () => {
    const network = balances?.network || 'testnet';
    return network === 'testnet' ? 'AZE-t' : 'AZE';
  };

  // Mapeamento de tokens por categoria (4 categorias)
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

  // Nomes das categorias
  const categoryNames = {
    cryptocurrencies: "Criptomoedas",
    startups: "Startups",
    utility: "Utility Tokens",
    digital: "Renda Digital"
  };

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
      return parseFloat(balances.balancesTable[searchSymbol]) || 0;
    }
    if (balances.tokenBalances && Array.isArray(balances.tokenBalances)) {
      const token = balances.tokenBalances.find(t => t.tokenSymbol === searchSymbol || t.tokenName === searchSymbol);
      if (token) return parseFloat(token.balanceEth || token.balance) || 0;
    }
    return 0;
  };

  // Processamento dos dados do cache
  const getChartData = () => {
    const series = [];
    const labels = [];
    const colors = [];

    // Mapeamento fixo de cores por categoria (igual à legenda)
    const colorMap = {
      'Saldo Disponível': '#3B82F6', // Azul
      'Criptomoedas': '#10B981',     // Verde  
      'Startups': '#8B5CF6',         // Roxo
      'Utility Tokens': '#F59E0B',   // Laranja
      'Renda Digital': '#EF4444'     // Vermelho
    };

    let totalValue = 0;
    const availableBalance = getBalance('cBRL'); // cBRL disponível

    // Adicionar saldo disponível (cBRL) primeiro
    if (availableBalance > 0) {
      series.push(availableBalance);
      labels.push('Saldo Disponível');
      colors.push(colorMap['Saldo Disponível']);
      totalValue += availableBalance;
    }

    // Array para armazenar dados de cada categoria (sempre incluir todas)
    const categoryData = [];
    
    // Calcular cada categoria
    Object.entries(tokenCategories).forEach(([categoryKey, tokens]) => {
      let categoryTotal = 0;

      tokens.forEach(symbol => {
        const balance = getBalance(symbol);
        const price = getTokenPrice(symbol);
        const valueBRL = balance * price;
        categoryTotal += valueBRL;
      });

      const categoryName = categoryNames[categoryKey];
      categoryData.push({
        key: categoryKey,
        name: categoryName,
        value: categoryTotal
      });

      // Adicionar ao gráfico apenas se tiver valor > 0
      if (categoryTotal > 0) {
        series.push(categoryTotal);
        labels.push(categoryName);
        colors.push(colorMap[categoryName]);
        totalValue += categoryTotal;
      }
    });

    // Se não há dados, criar gráfico placeholder
    if (series.length === 0) {
      return {
        series: [1], // Valor mínimo para mostrar o donut
        labels: ['Sem dados'],
        colors: ['#E5E7EB'], // Cinza claro
        totalValue: 0,
        isEmpty: true
      };
    }

    return {
      series,
      labels,
      colors: colors, // Usar o array de cores que montamos
      totalValue,
      isEmpty: false,
      allCategories: categoryData, // Incluir dados de todas as categorias
      availableBalance
    };
  };

  const chartData = getChartData();

  // Configuração do gráfico donut
  const chartOptions = {
    chart: {
      type: 'donut',
      height: 180,
      toolbar: {
        show: false
      }
    },
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
          labels: {
            show: true,
            name: {
              show: false
            },
            value: {
              show: false
            },
            total: {
              show: true,
              showAlways: true,
              label: 'Total',
              fontSize: '12px',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 400,
              color: '#64748B',
              formatter: () => {
                return chartData.isEmpty ? 'R$ 0,00' : formatCurrency(chartData.totalValue);
              }
            }
          }
        },
        expandOnClick: false
      }
    },
    colors: chartData.colors,
    labels: chartData.labels,
    legend: {
      show: false
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      show: false
    },
    tooltip: {
      enabled: !chartData.isEmpty,
      y: {
        formatter: function (value) {
          return formatCurrency(value);
        }
      }
    },
    responsive: [{
      breakpoint: 480,
      options: {
        chart: {
          height: 180
        }
      }
    }]
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }


  return (
    <div className="space-y-3">
      {/* Layout responsivo: Desktop - lado a lado, Mobile - vertical */}
      <div className="flex lg:flex-row flex-col lg:items-center lg:space-x-6 lg:space-y-0 space-y-3">
        {/* Gráfico Donut */}
        <div className="flex justify-center lg:flex-none">
          <Chart
            options={chartOptions}
            series={chartData.series}
            type="donut"
            height={180}
            width={180}
          />
        </div>

        {/* Legenda - Sempre mostrar todas as categorias */}
        <div className="space-y-2 lg:flex-1">
        {chartData.isEmpty ? (
          <div className="text-center text-slate-500 dark:text-slate-400 py-4">
            <p className="text-sm font-medium">Nenhum ativo encontrado</p>
            <p className="text-xs">Seus investimentos aparecerão aqui</p>
          </div>
        ) : (
          <>
            {/* Saldo Disponível */}
            {chartData.availableBalance !== undefined && (
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#3B82F6' }}></div>
                  <span className="text-slate-600 dark:text-slate-400">Saldo Disponível</span>
                </div>
                <span className="font-medium text-slate-900 dark:text-white balance">
                  {formatCurrency(chartData.availableBalance)}
                </span>
              </div>
            )}
            
            {/* Todas as categorias */}
            {chartData.allCategories && chartData.allCategories.map((category, index) => (
              <div key={category.key} className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: ['#10B981', '#8B5CF6', '#F59E0B', '#EF4444'][index] }}
                  ></div>
                  <span className="text-slate-600 dark:text-slate-400">{category.name}</span>
                </div>
                <span className="font-medium text-slate-900 dark:text-white balance">
                  {formatCurrency(category.value)}
                </span>
              </div>
            ))}
          </>
        )}
        </div>
      </div>
    </div>
  );
};

export default PortfolioDonutChart;