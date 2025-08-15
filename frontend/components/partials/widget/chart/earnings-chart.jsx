import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });
import { colors } from "@/constant/data";
import useDarkMode from "@/hooks/useDarkMode";


const EarningsChart = ({ height = 360, earnings = [] }) => {
  const [isDark] = useDarkMode();
  const [series, setSeries] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Cores para cada token (usando as cores disponíveis no tema)
  const tokenColors = [colors.primary, colors.warning, colors.success, colors.info];

  // Processar dados para o gráfico quando earnings mudar
  useEffect(() => {
    if (earnings && earnings.length > 0) {
      try {
        // Agrupar por token e data
        const earningsByToken = {};
        const dates = new Set();

        earnings.forEach(earning => {
          try {
            // Validar dados antes de processar
            if (!earning.distributionDate || !earning.tokenSymbol || 
                isNaN(parseFloat(earning.amount)) || isNaN(parseFloat(earning.quote))) {
              console.warn('Dados inválidos ignorados:', earning);
              return;
            }

            const date = new Date(earning.distributionDate).toISOString().split('T')[0];
            dates.add(date);

            if (!earningsByToken[earning.tokenSymbol]) {
              earningsByToken[earning.tokenSymbol] = {
                name: earning.tokenName || earning.tokenSymbol,
                data: {},
              };
            }

            if (!earningsByToken[earning.tokenSymbol].data[date]) {
              earningsByToken[earning.tokenSymbol].data[date] = 0;
            }

            // Calcular valor em cBRL: amount * quote
            const amount = parseFloat(earning.amount) || 0;
            const quote = parseFloat(earning.quote) || 0;
            const valueInCbrl = amount * quote;
            
            if (!isNaN(valueInCbrl) && isFinite(valueInCbrl)) {
              earningsByToken[earning.tokenSymbol].data[date] += valueInCbrl;
            }
          } catch (err) {
            console.warn('Erro ao processar earning:', earning, err);
          }
        });

        // Converter para formato do gráfico
        const sortedDates = Array.from(dates).sort();
        const chartSeries = Object.entries(earningsByToken)
          .filter(([symbol, data]) => {
            // Filtrar séries que têm dados válidos
            const hasValidData = sortedDates.some(date => 
              data.data[date] && data.data[date] > 0 && isFinite(data.data[date])
            );
            return hasValidData;
          })
          .map(([symbol, data]) => ({
            name: symbol,
            data: sortedDates.map(date => {
              const value = data.data[date] || 0;
              return isFinite(value) ? value : 0;
            }),
          }));

        // Validar se as séries têm dados válidos
        if (chartSeries.length === 0) {
          setError('Nenhum dado válido encontrado para o gráfico');
          setSeries([]);
          setCategories([]);
          return;
        }

        setSeries(chartSeries);
        setCategories(sortedDates);
        setError(null);
      } catch (err) {
        console.error('Erro ao processar dados para gráfico:', err);
        setError('Erro ao processar dados do gráfico');
      }
    } else {
      setSeries([]);
      setCategories([]);
      setError('Nenhum dado disponível para o gráfico');
    }
  }, [earnings]);

  const options = {
    chart: {
      toolbar: {
        show: false,
      },
      offsetX: 0,
      offsetY: 0,
      zoom: {
        enabled: false,
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: "straight",
      width: 2,
    },
    colors: tokenColors,
    tooltip: {
      theme: "dark",
      y: {
        formatter: function (val) {
          if (val === null || val === undefined || isNaN(val) || !isFinite(val)) {
            return "0,00 cBRL";
          }
          return parseFloat(val).toFixed(2) + " cBRL";
        },
      },
    },
    legend: {
      offsetY: 4,
      show: true,
      fontSize: "12px",
      fontFamily: "Inter",
      labels: {
        colors: isDark ? "#CBD5E1" : "#475569",
      },
      markers: {
        width: 6,
        height: 6,
        offsetY: 0,
        offsetX: -5,
        radius: 12,
      },
      itemMargin: {
        horizontal: 18,
        vertical: 0,
      },
    },
    grid: {
      show: true,
      borderColor: isDark ? "#334155" : "#e2e8f0",
      strokeDashArray: 10,
      position: "back",
    },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 0.3,
        opacityFrom: 0.4,
        opacityTo: 0.5,
        stops: [0, 30, 0],
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: isDark ? "#CBD5E1" : "#475569",
          fontFamily: "Inter",
        },
        formatter: function (val) {
          if (val === null || val === undefined || isNaN(val) || !isFinite(val)) {
            return "0,00";
          }
          return parseFloat(val).toFixed(2);
        },
      },
      title: {
        text: "Valor em cBRL",
        style: {
          color: isDark ? "#CBD5E1" : "#475569",
          fontFamily: "Inter",
        },
      },
    },
    xaxis: {
      type: "category",
      categories: categories.length > 0 ? categories : [],
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      labels: {
        style: {
          colors: isDark ? "#CBD5E1" : "#475569",
          fontFamily: "Inter",
        },
        format: "dd/MM",
        rotate: -45,
        rotateAlways: false,
      },
      title: {
        text: "",
        style: {
          color: isDark ? "#CBD5E1" : "#475569",
          fontFamily: "Inter",
        },
      },
    },
  };

  // Mostrar loading ou erro
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[200px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-slate-500 dark:text-slate-400">Carregando dados do gráfico...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full min-h-[200px]">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <p className="text-red-600 font-medium mb-2">Erro ao carregar gráfico</p>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  // Se não há dados, mostrar mensagem
  if (!series || series.length === 0) {
    return (
      <div className="flex items-center justify-center h-full min-h-[200px]">
        <div className="text-center">
          <div className="text-slate-400 text-4xl mb-4">📊</div>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Nenhum dado disponível</p>
          <p className="text-slate-400 text-sm">Não há proventos para exibir no gráfico</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Chart 
        options={options} 
        series={series} 
        type="area" 
        height={height} 
        width="100%"
        onError={(error) => {
          console.error('Erro no gráfico ApexCharts:', error);
        }}
      />
    </>
  );
};

export default EarningsChart;
