"use client";
import React from 'react';
import { 
  Lock, 
  Unlock, 
  TrendingUp, 
  Clock, 
  Percent,
  Award,
  Info
} from 'lucide-react';
import Image from '@/components/ui/Image';

const StakeTab = () => {
  const stakeOptions = [
    {
      title: 'CNT - Coinage',
      subtitle: '(Renda Digital)',
      risk: 'Baixo',
      riskLevel: 1,
      currency: 'CNT',
      receivableInteger: '2.054',
      receivableDecimals: '324568',
      quarterlyReturn: '14.40%',
      stakedInteger: '938',
      stakedDecimals: '92',
      distributedInteger: '11.001',
      distributedDecimals: '123456',
      vencimento: '01/01/26',
      disponivel: '2538',
      aliquota: '22.5%',
    },
    {
      title: 'IMB - Imobiliário',
      subtitle: '(Renda Digital)',
      risk: 'Baixo',
      riskLevel: 1,
      currency: 'IMB',
      receivableInteger: '834',
      receivableDecimals: '887412',
      quarterlyReturn: '14.31%',
      stakedInteger: '880',
      stakedDecimals: '37',
      distributedInteger: '9.870',
      distributedDecimals: '543210',
      vencimento: '01/07/26',
      disponivel: '4838',
      aliquota: '20%',
    },
    {
      title: 'MJD - Meu Jurídico Digital',
      subtitle: '(Renda Digital)',
      risk: 'Baixo',
      riskLevel: 1,
      currency: 'MJD',
      receivableInteger: '1.120',
      receivableDecimals: '102030',
      quarterlyReturn: '13.80%',
      stakedInteger: '857',
      stakedDecimals: '90',
      distributedInteger: '10.500',
      distributedDecimals: '987654',
      vencimento: '01/01/27',
      disponivel: '4046',
      aliquota: '17.5%',
    },
  ];

  const getRiskBadge = (risk, level) => {
    const colors = {
      'Baixo': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      'Médio': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      'Alto': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[risk] || colors['Baixo']}`}>
        {risk}
      </span>
    );
  };

  const getCurrencyColor = (currency) => {
    const colors = {
      'CNT': 'bg-blue-600',
      'IMB': 'bg-indigo-600',
      'MJD': 'bg-purple-600',
    };
    return colors[currency] || 'bg-gray-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Stake de Ativos Digitais</h2>
            <p className="text-purple-100">
              Bloqueie seus ativos e receba recompensas periódicas
            </p>
          </div>
          <Award size={48} className="text-purple-200" />
        </div>
      </div>

      {/* Stake Options Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {stakeOptions.map((option, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {option.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {option.subtitle}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold`}>
                  <Image src={`assets/images/currencies/${option.currency}.png`} alt={option.currency} />
                </div>
              </div>

              {/* Receivable Amount */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-4">
                <div className="text-center">
                  <p className="text-xs text-gray-600 dark:text-gray-400 uppercase mb-1">
                    À Receber
                  </p>
                  <div className="flex items-baseline justify-center">
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                      {option.receivableInteger}
                    </span>
                    <span className="text-lg">,</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {option.receivableDecimals}
                    </span>
                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                      {option.currency}
                    </span>
                  </div>
                </div>
              </div>

              {/* Info Grid */}
              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Risco:</span>
                  {getRiskBadge(option.risk, option.riskLevel)}
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                    <Percent size={14} className="mr-1" />
                    Retorno Trimestral:
                  </span>
                  <span className="text-sm font-semibold text-green-600">
                    {option.quarterlyReturn}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                    <Clock size={14} className="mr-1" />
                    Vencimento:
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {option.vencimento}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Alíquota:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {option.aliquota}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Disponível:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {option.disponivel} {option.currency}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Em Stake:</span>
                  <div className="flex items-baseline">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      {option.stakedInteger}
                    </span>
                    <span className="text-xs">,</span>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {option.stakedDecimals}
                    </span>
                    <span className="ml-1 text-xs text-gray-600 dark:text-gray-400">
                      {option.currency}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button className="flex items-center justify-center px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors">
                  <Lock size={16} className="mr-1" />
                  Fazer Stake
                </button>
                <button className="flex items-center justify-center px-3 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors">
                  <Unlock size={16} className="mr-1" />
                  Retirar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Info Section */}
      <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <Info className="h-6 w-6 text-indigo-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-indigo-900 dark:text-indigo-200 mb-2">
              Como funciona o Stake?
            </h3>
            <div className="text-sm text-indigo-700 dark:text-indigo-300 space-y-2">
              <p>
                O Stake permite que você bloqueie seus ativos digitais por um período determinado 
                em troca de recompensas periódicas. Quanto maior o período de bloqueio, maiores as recompensas.
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Rendimentos pagos periodicamente conforme o plano escolhido</li>
                <li>Possibilidade de reinvestir automaticamente os rendimentos</li>
                <li>Diferentes níveis de risco e retorno disponíveis</li>
                <li>Retirada antecipada sujeita a penalidades</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StakeTab;