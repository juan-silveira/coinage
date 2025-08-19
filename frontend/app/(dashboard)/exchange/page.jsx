"use client";
import React, { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Textinput from '@/components/ui/Textinput';
import Select from '@/components/ui/Select';
import { useAlertContext } from '@/contexts/AlertContext';
import { ArrowUpDown, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';

const ExchangePage = () => {
  const { showSuccess, showError, showInfo, showWarning } = useAlertContext();
  const [formData, setFormData] = useState({
    fromCurrency: 'BRL',
    toCurrency: 'BTC',
    fromAmount: '',
    toAmount: ''
  });
  const [loading, setLoading] = useState(false);
  const [exchangeRate, setExchangeRate] = useState(null);
  const [marketData, setMarketData] = useState([]);

  const currencies = [
    { value: 'BRL', label: 'Real Brasileiro (BRL)', symbol: 'R$' },
    { value: 'BTC', label: 'Bitcoin (BTC)', symbol: '₿' },
    { value: 'ETH', label: 'Ethereum (ETH)', symbol: 'Ξ' },
    { value: 'USDT', label: 'Tether (USDT)', symbol: '$' },
    { value: 'ADA', label: 'Cardano (ADA)', symbol: 'ADA' },
    { value: 'DOT', label: 'Polkadot (DOT)', symbol: 'DOT' }
  ];

  // Simular dados de mercado
  useEffect(() => {
    setMarketData([
      { symbol: 'BTC/BRL', price: 'R$ 312.450,00', change: '+2.34%', trend: 'up' },
      { symbol: 'ETH/BRL', price: 'R$ 18.920,00', change: '+1.87%', trend: 'up' },
      { symbol: 'USDT/BRL', price: 'R$ 5,23', change: '-0.12%', trend: 'down' },
      { symbol: 'ADA/BRL', price: 'R$ 2,45', change: '+5.67%', trend: 'up' },
      { symbol: 'DOT/BRL', price: 'R$ 45,30', change: '+3.21%', trend: 'up' }
    ]);

    // Simular taxa de câmbio
    if (formData.fromCurrency && formData.toCurrency) {
      setExchangeRate({
        rate: 0.0000032,
        fee: 0.5,
        total: 0.5
      });
    }
  }, [formData.fromCurrency, formData.toCurrency]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      showSuccess('Troca realizada com sucesso!');
      setFormData({
        fromCurrency: 'BRL',
        toCurrency: 'BTC',
        fromAmount: '',
        toAmount: ''
      });
    } catch (error) {
      showError('Erro ao processar troca. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Calcular conversão automática
    if (field === 'fromAmount' && value && exchangeRate) {
      const converted = (parseFloat(value) * exchangeRate.rate).toFixed(8);
      setFormData(prev => ({
        ...prev,
        toAmount: converted
      }));
    }
  };

  const swapCurrencies = () => {
    setFormData(prev => ({
      ...prev,
      fromCurrency: prev.toCurrency,
      toCurrency: prev.fromCurrency,
      fromAmount: prev.toAmount,
      toAmount: prev.fromAmount
    }));
  };

  const getCurrencySymbol = (currency) => {
    return currencies.find(c => c.value === currency)?.symbol || '';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Trocar Moedas
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário de Troca */}
        <div className="lg:col-span-2">
          <Card title="Nova Troca" icon="material-symbols:currency-exchange-rounded">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* De */}
              <div className="space-y-4">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Você paga
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    options={currencies}
                    value={formData.fromCurrency}
                    onChange={(value) => handleInputChange('fromCurrency', value)}
                    placeholder="Selecione a moeda"
                  />
                  <Textinput
                    type="number"
                    placeholder="0.00"
                    value={formData.fromAmount}
                    onChange={(e) => handleInputChange('fromAmount', e.target.value)}
                    step="0.00000001"
                    prefix={getCurrencySymbol(formData.fromCurrency)}
                  />
                </div>
              </div>

              {/* Botão de Troca */}
              <div className="flex justify-center">
                <Button
                  type="button"
                  onClick={swapCurrencies}
                  className="rounded-full w-12 h-12 p-0 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
                >
                  <ArrowUpDown size={20} className="text-gray-600 dark:text-gray-300" />
                </Button>
              </div>

              {/* Para */}
              <div className="space-y-4">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Você recebe
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    options={currencies}
                    value={formData.toCurrency}
                    onChange={(value) => handleInputChange('toCurrency', value)}
                    placeholder="Selecione a moeda"
                  />
                  <Textinput
                    type="number"
                    placeholder="0.00"
                    value={formData.toAmount}
                    onChange={(e) => handleInputChange('toAmount', e.target.value)}
                    step="0.00000001"
                    prefix={getCurrencySymbol(formData.toCurrency)}
                    readOnly
                  />
                </div>
              </div>

              {/* Taxa de Câmbio */}
              {exchangeRate && (
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Taxa de Câmbio</span>
                    <RefreshCw size={16} className="text-gray-400 cursor-pointer hover:text-gray-600" />
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        1 {formData.fromCurrency} = {exchangeRate.rate.toFixed(8)} {formData.toCurrency}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Taxa:</span>
                      <span>{exchangeRate.fee}%</span>
                    </div>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full btn-brand"
                isLoading={loading}
                disabled={!formData.fromAmount || !formData.fromCurrency || !formData.toCurrency}
              >
                Trocar Agora
              </Button>
            </form>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Saldos */}
          <Card title="Seus Saldos">
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-white text-xs font-bold mr-3">
                    ₿
                  </div>
                  <span className="text-sm font-medium">Bitcoin</span>
                </div>
                <span className="text-sm">0.00123 BTC</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold mr-3">
                    Ξ
                  </div>
                  <span className="text-sm font-medium">Ethereum</span>
                </div>
                <span className="text-sm">0.45 ETH</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white text-xs font-bold mr-3">
                    R$
                  </div>
                  <span className="text-sm font-medium">Real</span>
                </div>
                <span className="text-sm">R$ 1.234,56</span>
              </div>
            </div>
          </Card>

          {/* Preços de Mercado */}
          <Card title="Preços de Mercado" icon="heroicons-outline:chart-bar">
            <div className="space-y-3">
              {marketData.map((coin, index) => (
                <div key={index} className="flex justify-between items-center py-2">
                  <div>
                    <p className="text-sm font-medium">{coin.symbol}</p>
                    <p className="text-xs text-gray-500">{coin.price}</p>
                  </div>
                  <div className={`flex items-center text-sm ${coin.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                    {coin.trend === 'up' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                    <span className="ml-1">{coin.change}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Histórico de Trocas */}
          <Card title="Trocas Recentes" icon="heroicons-outline:clock">
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="text-sm font-medium">BRL → BTC</p>
                  <p className="text-xs text-gray-500">R$ 1.000,00 → 0.0032 BTC</p>
                </div>
                <span className="text-xs text-gray-500">Hoje</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="text-sm font-medium">ETH → BRL</p>
                  <p className="text-xs text-gray-500">0.5 ETH → R$ 9.460,00</p>
                </div>
                <span className="text-xs text-gray-500">Ontem</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium">BTC → USDT</p>
                  <p className="text-xs text-gray-500">0.001 BTC → 62.45 USDT</p>
                </div>
                <span className="text-xs text-gray-500">2 dias</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ExchangePage;