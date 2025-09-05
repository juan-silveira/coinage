import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });
import useDarkMode from "@/hooks/useDarkMode";
import useEarnings from "@/hooks/useEarnings";
import { formatCurrency, formatCurrencyPrecise } from "@/constants/tokenPrices";

const EarningChart = ({
  className = "bg-slate-50 dark:bg-slate-900 rounded py-3 px-4 md:col-span-2",
}) => {
  const [isDark] = useDarkMode();
  const [chartData, setChartData] = useState({ series: [], labels: [], totalValue: 0 });
  
  // Hook para buscar earnings
  const { earnings, loading, stats } = useEarnings({
    limit: 50, // Buscar mais dados para o gráfico
    autoFetch: true,
  });

  // Processar dados para o gráfico
  useEffect(() => {
    if (!earnings || earnings.length === 0) {
      setChartData({ series: [], labels: [], totalValue: 0 });
      return;
    }

    // Agrupar earnings por token
    const tokenGroups = earnings.reduce((groups, earning) => {
      const symbol = earning.tokenSymbol;
      if (!groups[symbol]) {
        groups[symbol] = {
          symbol,
          amount: 0,
          value: 0
        };
      }
      
      const earningValue = parseFloat(earning.amount) * parseFloat(earning.quote || 0);
      groups[symbol].amount += parseFloat(earning.amount);
      groups[symbol].value += earningValue;
      
      return groups;
    }, {});

    const tokenData = Object.values(tokenGroups);
    const totalValue = tokenData.reduce((sum, token) => sum + token.value, 0);

    // Ordenar por valor e pegar os top 5 tokens
    const topTokens = tokenData
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    const series = topTokens.map(token => token.value);
    const labels = topTokens.map(token => token.symbol);

    setChartData({ series, labels, totalValue });
  }, [earnings]);

  // Configurações do gráfico
  const options = {
    labels: chartData.labels,
    dataLabels: {
      enabled: false,
    },
    colors: ["#0CE7FA", "#FA916B", "#10B981", "#F59E0B", "#8B5CF6"],
    legend: {
      position: "bottom",
      fontSize: "12px",
      fontFamily: "Inter",
      fontWeight: 400,
      markers: {
        width: 8,
        height: 8,
        offsetY: 0,
        offsetX: -5,
        radius: 12,
      },
      itemMargin: {
        horizontal: 12,
        vertical: 0,
      },
      labels: {
        colors: isDark ? "#CBD5E1" : "#475569",
      },
    },
    plotOptions: {
      pie: {
        donut: {
          size: "65%",
        },
      },
    },
    tooltip: {
      y: {
        formatter: function(value) {
          return formatCurrencyPrecise(value);
        }
      }
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          legend: {
            position: "bottom",
          },
        },
      },
    ],
  };

  // Calcular variação percentual (mock para demonstração)
  const weeklyChange = "+12%"; // TODO: Implementar cálculo real
  
  return (
    <div className={` ${className}`}>
      <div className="flex items-center">
        <div className="flex-none">
          <div className="text-sm text-slate-600 dark:text-slate-300 mb-[6px]">
            Proventos
          </div>
          <div className="text-lg text-slate-900 dark:text-white font-medium mb-[6px] balance">
            {loading ? (
              <div className="h-6 w-24 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-500 rounded animate-pulse"></div>
            ) : (
              formatCurrencyPrecise(chartData.totalValue)
            )}
          </div>
          <div className="font-normal text-xs text-slate-600 dark:text-slate-300">
            <span className="text-primary-500">{weeklyChange}</span>
            {" "}Da semana passada
          </div>
        </div>
        <div className="flex-1">
          <div className="legend-ring2">
            {loading || chartData.series.length === 0 ? (
              <div className="flex items-center justify-center h-[200px]">
                <div className="text-center">
                  {loading ? (
                    <>
                      <div className="w-16 h-16 bg-slate-200 dark:bg-slate-600 rounded-full animate-pulse mx-auto mb-2"></div>
                      <div className="text-slate-500 dark:text-slate-400 text-sm">Carregando...</div>
                    </>
                  ) : (
                    <>
                      <div className="text-slate-400 dark:text-slate-600 text-lg mb-2">📊</div>
                      <div className="text-slate-500 dark:text-slate-400 text-sm">Sem dados</div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <Chart
                type="donut"
                height="200"
                width="100%"
                options={options}
                series={chartData.series}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EarningChart;
