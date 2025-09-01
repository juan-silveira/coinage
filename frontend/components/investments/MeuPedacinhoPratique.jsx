"use client";
import React, { useState } from 'react';
import Image from '@/components/ui/Image';
import { 
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';

const MeuPedacinhoPratique = () => {
  const [expandedCards, setExpandedCards] = useState({});

  const stakes = [
    {
      title: 'Pedacinho Pratique Lagoa',
      subtitle: '(Renda Digital)',
      currency: 'PCN',
      risk: 1,
      receivableInteger: '2.054',
      receivableDecimals: '324568',
      quarterlyReturn: '5.68%',
      returnDate: '15/09/2025',
      stakedInteger: '15.000',
      stakedDecimals: '098546',
      distributedInteger: '11.001',
      distributedDecimals: '123456',
    },
    {
      title: 'Pedacinho Pratique Imbiribeira',
      subtitle: '(Renda Digital)',
      currency: 'PCN',
      risk: 2,
      receivableInteger: '834',
      receivableDecimals: '887412',
      quarterlyReturn: '4.92%',
      returnDate: '15/09/2025',
      stakedInteger: '11.500',
      stakedDecimals: '000000',
      distributedInteger: '9.870',
      distributedDecimals: '543210',
    },
    {
      title: 'Pedacinho Pratique Forquilhinhas',
      subtitle: '(Renda Digital)',
      currency: 'PCN',
      risk: 3,
      receivableInteger: '1.120',
      receivableDecimals: '102030',
      quarterlyReturn: '6.15%',
      returnDate: '15/09/2025',
      stakedInteger: '13.200',
      stakedDecimals: '456789',
      distributedInteger: '10.500',
      distributedDecimals: '987654',
    },
  ];

  const getRiskIcon = (risk) => {
    const riskConfig = {
      0: { bars: 0, color: 'text-gray-400', label: 'Muito Baixo' },
      1: { bars: 1, color: 'text-green-500', label: 'Baixo' },
      2: { bars: 2, color: 'text-blue-500', label: 'Médio' },
      3: { bars: 3, color: 'text-yellow-500', label: 'Alto' },
      4: { bars: 4, color: 'text-red-500', label: 'Muito Alto' },
    };

    const config = riskConfig[risk] || riskConfig[0];
    const totalBars = 4;
    
    return (
      <div className="flex items-center space-x-2">
        <div className="flex items-end space-x-0.5">
          {[...Array(totalBars)].map((_, i) => {
            const barHeight = `${(i + 1) * 5}px`;
            const isActive = i < config.bars;
            return (
              <div
                key={i}
                style={{ height: barHeight }}
                className={`w-1 rounded-sm transition-colors ${
                  isActive 
                    ? risk === 1 ? 'bg-green-500' 
                    : risk === 2 ? 'bg-blue-500'
                    : risk === 3 ? 'bg-yellow-500'
                    : risk === 4 ? 'bg-red-500'
                    : 'bg-gray-400'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
              />
            );
          })}
        </div>
        <span className="text-xs text-gray-500">{config.label}</span>
      </div>
    );
  };

  const toggleCard = (index) => {
    setExpandedCards(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header com saldo disponível */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Meu Pedacinho Pratique
          </h2>
          <div className="h-1 w-16 bg-red-500 mt-2"></div>
        </div>
        
        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between space-x-8">
            <div className="text-sm opacity-90">Disponível:</div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold">PCN</span>
              </div>
              <div className="flex items-baseline">
                <span className="text-2xl font-bold">1.000</span>
                <span className="text-lg">,</span>
                <span className="text-sm opacity-75">000000</span>
                <span className="ml-1 text-sm">PCN</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cards de Stakes */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {stakes.map((stake, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <h3 className="text-center text-lg font-semibold text-gray-900 dark:text-white">
                {stake.title}
              </h3>
              <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-4">
                {stake.subtitle}
              </p>

              <div className="flex justify-between items-center mb-4">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                    <Image src={`assets/images/currencies/${stake.currency}.png`} alt={stake.currency} />
                  </div>
                  <span className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {stake.currency}
                  </span>
                </div>

                <div className="text-center">
                  <div className="flex items-baseline justify-center">
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stake.receivableInteger}
                    </span>
                    <span className="text-lg">,</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {stake.receivableDecimals}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 uppercase mt-1">
                    {stake.currency} à receber
                  </div>
                </div>

                <div className="flex flex-col space-y-2">
                  <button className="px-3 py-1 text-xs font-medium text-red-600 border border-red-600 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                    Receber
                  </button>
                  <button className="px-3 py-1 text-xs font-medium text-red-600 border border-red-600 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                    Reinvestir
                  </button>
                </div>
              </div>

              {/* Botões de ação */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                <button className="px-2 py-1.5 text-xs font-medium text-white bg-red-600 rounded-full hover:bg-red-700 transition-colors">
                  Comprar
                </button>
                <button className="px-2 py-1.5 text-xs font-medium text-white bg-red-600 rounded-full hover:bg-red-700 transition-colors">
                  Vender
                </button>
                <button className="px-2 py-1.5 text-xs font-medium text-white bg-red-600 rounded-full hover:bg-red-700 transition-colors">
                  Investir
                </button>
                <button className="px-2 py-1.5 text-xs font-medium text-white bg-red-600 rounded-full hover:bg-red-700 transition-colors">
                  Retirar
                </button>
              </div>

              {/* Informações */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Risco:</span>
                  {getRiskIcon(stake.risk)}
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Último Trimestral:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {stake.quarterlyReturn}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Próximo Vencimento:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {stake.returnDate}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Meu Stake:</span>
                  <div className="flex items-baseline">
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      {stake.stakedInteger}
                    </span>
                    <span>,</span>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {stake.stakedDecimals}
                    </span>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <hr className="my-4 border-gray-200 dark:border-gray-700" />

              {/* Expandable section */}
              <button
                onClick={() => toggleCard(index)}
                className="w-full flex items-center justify-center text-red-600 hover:text-red-700 transition-colors"
              >
                <span className="text-sm font-medium mr-1">Mais</span>
                {expandedCards[index] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {expandedCards[index] && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Total Distribuído:
                      </span>
                      <div className="flex items-baseline">
                        <span className="text-lg font-bold text-gray-900 dark:text-white">
                          {stake.distributedInteger}
                        </span>
                        <span>,</span>
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {stake.distributedDecimals}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <div className="flex items-center text-red-700 dark:text-red-300">
                        <Info size={16} className="mr-2" />
                        <span className="text-xs font-medium">Meu Pedacinho Pratique</span>
                      </div>
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                        Modalidade de distribuição de lucros baseado na proporcionalidade e no prazo de stake de PCN.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MeuPedacinhoPratique;