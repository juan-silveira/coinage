"use client";
import React, { useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { TrendingUp, TrendingDown, Plus, Eye, BarChart3, PieChart } from 'lucide-react';

const InvestmentsPage = () => {
  const [selectedTab, setSelectedTab] = useState('portfolio');

  const portfolioData = [
    {
      id: 1,
      name: 'Bitcoin',
      symbol: 'BTC',
      amount: '0.00123',
      valueInBRL: 'R$ 384,39',
      change24h: '+2.34%',
      trend: 'up',
      color: 'bg-yellow-500'
    },
    {
      id: 2,
      name: 'Ethereum',
      symbol: 'ETH',
      amount: '0.45',
      valueInBRL: 'R$ 8.514,00',
      change24h: '+1.87%',
      trend: 'up',
      color: 'bg-blue-600'
    },
    {
      id: 3,
      name: 'Cardano',
      symbol: 'ADA',
      amount: '1250.00',
      valueInBRL: 'R$ 3.062,50',
      change24h: '+5.67%',
      trend: 'up',
      color: 'bg-blue-500'
    },
    {
      id: 4,
      name: 'Polkadot',
      symbol: 'DOT',
      amount: '25.50',
      valueInBRL: 'R$ 1.155,15',
      change24h: '-1.23%',
      trend: 'down',
      color: 'bg-pink-500'
    }
  ];

  const opportunitiesData = [
    {
      id: 1,
      name: 'Solana',
      symbol: 'SOL',
      price: 'R$ 145,30',
      change24h: '+8.45%',
      trend: 'up',
      marketCap: 'R$ 62.4B',
      description: 'Blockchain de alta performance para DApps'
    },
    {
      id: 2,
      name: 'Chainlink',
      symbol: 'LINK',
      price: 'R$ 72,80',
      change24h: '+3.21%',
      trend: 'up',
      marketCap: 'R$ 41.2B',
      description: 'Rede de oráculos descentralizada'
    },
    {
      id: 3,
      name: 'Polygon',
      symbol: 'MATIC',
      price: 'R$ 4,15',
      change24h: '+6.78%',
      trend: 'up',
      marketCap: 'R$ 38.7B',
      description: 'Solução de escalabilidade Ethereum'
    }
  ];

  const totalPortfolioValue = portfolioData.reduce((sum, asset) => {
    return sum + parseFloat(asset.valueInBRL.replace('R$ ', '').replace('.', '').replace(',', '.'));
  }, 0);

  const tabs = [
    { id: 'portfolio', label: 'Meu Portfólio', icon: PieChart },
    { id: 'opportunities', label: 'Oportunidades', icon: TrendingUp },
    { id: 'analysis', label: 'Análises', icon: BarChart3 }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Meus Investimentos
        </h1>
        <Button className="btn-brand">
          <Plus size={16} className="mr-2" />
          Novo Investimento
        </Button>
      </div>

      {/* Resumo do Portfólio */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <div className="p-6">
            <h3 className="text-sm font-medium opacity-90">Valor Total</h3>
            <p className="text-2xl font-bold mt-2">
              R$ {totalPortfolioValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <div className="flex items-center mt-2">
              <TrendingUp size={16} className="mr-1" />
              <span className="text-sm">+5.23% (24h)</span>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Ativos</h3>
            <p className="text-2xl font-bold mt-2 text-gray-900 dark:text-white">
              {portfolioData.length}
            </p>
            <p className="text-sm text-gray-500 mt-2">Diversificação: Boa</p>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Retorno 30d</h3>
            <p className="text-2xl font-bold mt-2 text-green-600">+12.45%</p>
            <p className="text-sm text-gray-500 mt-2">R$ 1.347,89</p>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Maior Ativo</h3>
            <p className="text-2xl font-bold mt-2 text-gray-900 dark:text-white">ETH</p>
            <p className="text-sm text-gray-500 mt-2">65.4% do portfólio</p>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  selectedTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon size={16} className="mr-2" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Conteúdo das Tabs */}
      {selectedTab === 'portfolio' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card title="Seus Ativos" icon="heroicons-outline:briefcase">
              <div className="space-y-4">
                {portfolioData.map((asset) => (
                  <div key={asset.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex items-center">
                      <div className={`w-12 h-12 ${asset.color} rounded-full flex items-center justify-center text-white font-bold text-sm mr-4`}>
                        {asset.symbol.slice(0, 2)}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">{asset.name}</h3>
                        <p className="text-sm text-gray-500">{asset.amount} {asset.symbol}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900 dark:text-white">{asset.valueInBRL}</p>
                      <div className={`flex items-center text-sm ${asset.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                        {asset.trend === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        <span className="ml-1">{asset.change24h}</span>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      <Eye size={14} className="mr-1" />
                      Ver
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div>
            <Card title="Distribuição" icon="heroicons-outline:chart-pie">
              <div className="space-y-4">
                {portfolioData.map((asset, index) => {
                  const percentage = ((parseFloat(asset.valueInBRL.replace('R$ ', '').replace('.', '').replace(',', '.')) / totalPortfolioValue) * 100).toFixed(1);
                  return (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 ${asset.color} rounded-full mr-3`}></div>
                        <span className="text-sm font-medium">{asset.symbol}</span>
                      </div>
                      <span className="text-sm text-gray-600">{percentage}%</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </div>
      )}

      {selectedTab === 'opportunities' && (
        <Card title="Oportunidades de Investimento" icon="heroicons-outline:star">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {opportunitiesData.map((opportunity) => (
              <div key={opportunity.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">{opportunity.name}</h3>
                    <p className="text-sm text-gray-500">{opportunity.symbol}</p>
                  </div>
                  <div className={`flex items-center text-sm ${opportunity.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                    {opportunity.trend === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    <span className="ml-1">{opportunity.change24h}</span>
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Preço:</span>
                    <span className="text-sm font-medium">{opportunity.price}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Market Cap:</span>
                    <span className="text-sm font-medium">{opportunity.marketCap}</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mb-4">{opportunity.description}</p>
                <Button size="sm" className="w-full btn-brand">
                  Investir
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {selectedTab === 'analysis' && (
        <Card title="Análises e Insights" icon="heroicons-outline:chart-bar">
          <div className="text-center py-12">
            <BarChart3 size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Análises em Desenvolvimento
            </h3>
            <p className="text-gray-500">
              Esta seção estará disponível em breve com gráficos detalhados e análises de mercado.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default InvestmentsPage;