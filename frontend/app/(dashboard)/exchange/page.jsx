"use client";
import React, { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import { useAlertContext } from '@/contexts/AlertContext';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import BuyTab from '@/components/partials/exchange/BuyTab';
import SellTab from '@/components/partials/exchange/SellTab';

const ExchangePage = () => {
  useDocumentTitle('Exchange - Comprar e Vender', 'Coinage', true);
  
  const { showSuccess, showError } = useAlertContext();
  
  // State management
  const [activeTab, setActiveTab] = useState('buy');
  const [loading, setLoading] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  
  // Form data
  const [buyData, setBuyData] = useState({
    payAmount: '',
    payCurrency: 'PIX',
    receiveCurrency: 'PCN'
  });
  
  const [sellData, setSellData] = useState({
    payAmount: '',
    payCurrency: 'PCN',
    receiveCurrency: 'PIX'
  });
  
  const [orders, setOrders] = useState([]);
  const [orderFilters, setOrderFilters] = useState({
    status: 'all',
    type: 'all'
  });

  // Currency data
  const fiatCurrencies = [
    { code: 'cBRL', name: 'Coinager Real Brasileiro', icon: '/assets/images/currencies/cBRL.png', balance: 1250.75 },
    { code: 'PIX', name: 'Transferência Bancária (PIX)', icon: 'pix', balance: null },
    // { code: 'USDT', name: 'Dólar Americano', icon: '/assets/images/currencies/USDT.png', balance: 0 }
  ];
  
  const cryptoCurrencies = [
    { code: 'CNT', name: 'Coinage Token', icon: '/assets/images/currencies/CNT.png', balance: 12.00125, price_brl: 1.0, price_usd: 0.18 },
    { code: 'PCN', name: 'Pratique Coin', icon: '/assets/images/currencies/PCN.png', balance: 1002.451234, price_brl: 1.0, price_usd: 0.18 },
    { code: 'MJD', name: 'Meu Jurídico Digital', icon: '/assets/images/currencies/MJD.png', balance: 100.0, price_brl: 15.0, price_usd: 2.7 },
    { code: 'IMB', name: 'Imobiliária', icon: '/assets/images/currencies/IMB.png', balance: 111.0, price_brl: 10.0, price_usd: 1.8 }
  ];
  
  
  // Fee configuration
  const feeConfig = {
    buy: { percentage: 1, fixed: 0 },
    sell: { percentage: 3.5, fixed: 0 },
    pix: { percentage: 0.5, fixed: 0 }
  };

  // Calculate amounts
  const calculateBuyAmount = (payAmount) => {
    const crypto = cryptoCurrencies.find(c => c.code === buyData.receiveCurrency);
    if (!crypto) return { receiveAmount: 0, fee: 0, price: 0 };
    
    const priceKey = buyData.payCurrency === 'USD' ? 'price_usd' : 'price_brl';
    const price = crypto[priceKey] || 0;
    const fee = (payAmount * feeConfig.buy.percentage) / 100;
    const netAmount = payAmount - fee;
    const receiveAmount = price > 0 ? netAmount / price : 0;
    
    return { receiveAmount, fee, price, netAmount, payAmount };
  };
  
  const calculateSellAmount = (sellAmount) => {
    const crypto = cryptoCurrencies.find(c => c.code === sellData.payCurrency);
    if (!crypto) return { receiveAmount: 0, fee: 0, price: 0 };
    
    const priceKey = sellData.receiveCurrency === 'USD' ? 'price_usd' : 'price_brl';
    const price = crypto[priceKey] || 0;
    const grossAmount = sellAmount * price;
    const fee = (grossAmount * feeConfig.sell.percentage) / 100;
    const receiveAmount = grossAmount - fee;
    
    return { receiveAmount, fee, price, grossAmount, sellAmount };
  };
  
  // Load mock orders
  useEffect(() => {
    setOrders([
      { id: 1, type: 'buy', pair: 'CNT/BRL', amount: 100, price: 1.0, total: 100, status: 'completed' },
      { id: 2, type: 'sell', pair: 'MJD/BRL', amount: 10, price: 15.0, total: 150, status: 'pending' },
      { id: 3, type: 'buy', pair: 'PCN/BRL', amount: 500, price: 1.0, total: 500, status: 'completed' }
    ]);
  }, []);

  const handleBuySubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      showSuccess(`Compra de ${buyData.receiveCurrency} realizada com sucesso!`);
      setBuyData(prev => ({ ...prev, payAmount: '' }));
    } catch (error) {
      showError('Erro ao processar compra. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSellSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      showSuccess(`Venda de ${sellData.payCurrency} realizada com sucesso!`);
      setSellData(prev => ({ ...prev, payAmount: '' }));
    } catch (error) {
      showError('Erro ao processar venda. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const handleDropdownToggle = (dropdownName) => {
    setOpenDropdown(openDropdown === dropdownName ? null : dropdownName);
  };
  
  const handleCurrencySelect = (section, field, currency) => {
    if (section === 'buy') {
      setBuyData(prev => ({ ...prev, [field]: currency.code }));
    } else {
      setSellData(prev => ({ ...prev, [field]: currency.code }));
    }
    setOpenDropdown(null);
  };
  
  
  const handleMaxSell = () => {
    const crypto = cryptoCurrencies.find(c => c.code === sellData.payCurrency);
    if (crypto && crypto.balance > 0) {
      setSellData(prev => ({ ...prev, payAmount: crypto.balance.toString() }));
    }
  };
  
  const formatNumber = (num, decimals = 6) => {
    if (num === 0) return '0';
    if (num < 0.01) return num.toFixed(decimals);
    return num.toFixed(num < 1 ? 4 : 2);
  };
  
  const getAvailableBalance = (currencyCode) => {
    const crypto = cryptoCurrencies.find(c => c.code === currencyCode);
    return crypto ? crypto.balance : 0;
  };
  
  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openDropdown && !event.target.closest('.relative')) {
        setOpenDropdown(null);
      }
    };
    
    if (openDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdown]);

  return (
    <div className="space-y-6">
      {/* Header */}

      <div className="text-2xl font-medium text-gray-900 dark:text-white mb-4">
        Comprar e Vender
      </div>

      {/* Exchange Interface */}
      <div className="flex justify-center">
        <div className="w-full max-w-md">
          {/* Tabs */}
          <ul className="flex" role="tablist">
            <li className="flex-1">
              <button
                className={`w-full px-5 py-3 text-sm font-semibold border-none shadow-sm transition-colors ${
                  activeTab === 'buy'
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400'
                    : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-600'
                } rounded-tl-lg`}
                onClick={() => setActiveTab('buy')}
              >
                Comprar
              </button>
            </li>
            <li className="flex-1">
              <button
                className={`w-full px-5 py-3 text-sm font-semibold border-none shadow-sm transition-colors ${
                  activeTab === 'sell'
                    ? 'bg-white dark:bg-slate-800 text-red-600 dark:text-red-400'
                    : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-600'
                } rounded-tr-lg`}
                onClick={() => setActiveTab('sell')}
              >
                Vender
              </button>
            </li>
          </ul>

          {/* Tab Content */}
          <div className="bg-white dark:bg-slate-800 shadow-sm rounded-b-lg rounded-tr-lg">
            {activeTab === 'buy' ? (
              <BuyTab
                buyData={buyData}
                setBuyData={setBuyData}
                fiatCurrencies={fiatCurrencies}
                cryptoCurrencies={cryptoCurrencies}
                calculateBuyAmount={calculateBuyAmount}
                formatNumber={formatNumber}
                loading={loading}
                onSubmit={handleBuySubmit}
                openDropdown={openDropdown}
                onDropdownToggle={handleDropdownToggle}
                onCurrencySelect={handleCurrencySelect}
              />
            ) : (
              <SellTab
                sellData={sellData}
                setSellData={setSellData}
                fiatCurrencies={fiatCurrencies}
                cryptoCurrencies={cryptoCurrencies}
                calculateSellAmount={calculateSellAmount}
                formatNumber={formatNumber}
                getAvailableBalance={getAvailableBalance}
                onMaxSell={handleMaxSell}
                loading={loading}
                onSubmit={handleSellSubmit}
                openDropdown={openDropdown}
                onDropdownToggle={handleDropdownToggle}
                onCurrencySelect={handleCurrencySelect}
              />
            )}
          </div>
        </div>
      </div>

      {/* Orders Section */}
      <div className="mt-8">
        <div className="flex items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Minhas Ordens</h3>
          <div className="ml-3 bg-blue-600 h-0.5 w-16"></div>
        </div>

        <Card>
          <div className="flex justify-end mb-4 space-x-4">
            <div className="flex flex-col">
              <label className="text-xs text-gray-600 dark:text-gray-400 mb-1">Status</label>
              <div className="btn-group" role="group">
                <button
                  className={`px-3 py-1 text-xs border rounded-l-md ${
                    orderFilters.status === 'all'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600'
                  }`}
                  onClick={() => setOrderFilters(prev => ({ ...prev, status: 'all' }))}
                >
                  Todas
                </button>
                <button
                  className={`px-3 py-1 text-xs border-t border-b border-r rounded-r-md ${
                    orderFilters.status === 'open'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600'
                  }`}
                  onClick={() => setOrderFilters(prev => ({ ...prev, status: 'open' }))}
                >
                  Abertas
                </button>
              </div>
            </div>

            <div className="flex flex-col">
              <label className="text-xs text-gray-600 dark:text-gray-400 mb-1">Tipo</label>
              <div className="btn-group" role="group">
                <button
                  className={`px-3 py-1 text-xs border rounded-l-md ${
                    orderFilters.type === 'all'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600'
                  }`}
                  onClick={() => setOrderFilters(prev => ({ ...prev, type: 'all' }))}
                >
                  Todas
                </button>
                <button
                  className={`px-3 py-1 text-xs border-t border-b ${
                    orderFilters.type === 'sell'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600'
                  }`}
                  onClick={() => setOrderFilters(prev => ({ ...prev, type: 'sell' }))}
                >
                  Venda
                </button>
                <button
                  className={`px-3 py-1 text-xs border rounded-r-md ${
                    orderFilters.type === 'buy'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600'
                  }`}
                  onClick={() => setOrderFilters(prev => ({ ...prev, type: 'buy' }))}
                >
                  Compra
                </button>
              </div>
            </div>
          </div>

          {/* Orders Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-slate-700">
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Par</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Tipo</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Quantidade</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Preço</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Total</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Ações</th>
                </tr>
              </thead>
              <tbody>
                {orders.length > 0 ? orders.map(order => (
                  <tr key={order.id} className="border-b border-gray-100 dark:border-slate-700">
                    <td className="py-3 px-4">{order.pair}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        order.type === 'buy' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {order.type === 'buy' ? 'Compra' : 'Venda'}
                      </span>
                    </td>
                    <td className="py-3 px-4">{order.amount}</td>
                    <td className="py-3 px-4">{formatNumber(order.price, 2)}</td>
                    <td className="py-3 px-4">{formatNumber(order.total, 2)}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        order.status === 'completed'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}>
                        {order.status === 'completed' ? 'Concluída' : 'Pendente'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {order.status === 'pending' && (
                        <Button size="sm" className="text-xs bg-red-600 hover:bg-red-700">
                          <Icon icon="heroicons:trash" className="w-3 h-3 mr-1" />
                          Cancelar
                        </Button>
                      )}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-gray-500 dark:text-gray-400">
                      Nenhuma ordem encontrada
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ExchangePage;