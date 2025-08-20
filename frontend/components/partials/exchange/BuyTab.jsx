"use client";
import React, { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Tooltip from '@/components/ui/Tooltip';
import { ChevronDown, Info } from 'lucide-react';

const BuyTab = ({
  buyData,
  setBuyData,
  fiatCurrencies,
  cryptoCurrencies,
  calculateBuyAmount,
  formatNumber,
  loading,
  onSubmit,
  openDropdown,
  onDropdownToggle,
  onCurrencySelect
}) => {
  const [receiveAmount, setReceiveAmount] = useState('');
  const [calculation, setCalculation] = useState(null);

  // Update receive amount when pay amount changes
  useEffect(() => {
    if (buyData.payAmount && parseFloat(buyData.payAmount) > 0) {
      const calc = calculateBuyAmount(parseFloat(buyData.payAmount));
      setReceiveAmount(formatNumber(calc.receiveAmount));
      setCalculation(calc);
    } else {
      setReceiveAmount('');
      setCalculation(null);
    }
  }, [buyData.payAmount, buyData.payCurrency, buyData.receiveCurrency, calculateBuyAmount, formatNumber]);

  const handlePayAmountChange = (e) => {
    let value = e.target.value;
    // Allow only numbers, dots and commas
    value = value.replace(/[^0-9.,]/g, '');
    // Replace comma with dot for consistency
    value = value.replace(/,/g, '.');
    // Prevent multiple dots
    const parts = value.split('.');
    if (parts.length > 2) {
      value = parts[0] + '.' + parts.slice(1).join('');
    }
    setBuyData(prev => ({ ...prev, payAmount: value }));
  };
  
  const handleMaxBuy = () => {
    const currency = getSelectedPayCurrency();
    if (currency.balance !== undefined && currency.balance !== null && currency.balance > 0) {
      setBuyData(prev => ({ ...prev, payAmount: currency.balance.toString() }));
    }
  };
  
  const getAvailableBalance = () => {
    const currency = getSelectedPayCurrency();
    return currency.balance || 0;
  };

  const getSelectedPayCurrency = () => {
    return fiatCurrencies.find(c => c.code === buyData.payCurrency) || fiatCurrencies[0];
  };

  const getSelectedReceiveCurrency = () => {
    return cryptoCurrencies.find(c => c.code === buyData.receiveCurrency) || cryptoCurrencies[0];
  };


  const PIXIcon = () => (
    <svg className="" xmlns="http://www.w3.org/2000/svg" width="25" viewBox="0 0 24 24">
      <path fill="#3cbeac" d="m15.45 16.52l-3.01-3.01c-.11-.11-.24-.13-.31-.13s-.2.02-.31.13L8.8 16.53c-.34.34-.87.89-2.64.89l3.71 3.7a3 3 0 0 0 4.24 0l3.72-3.71c-.91 0-1.67-.18-2.38-.89M8.8 7.47l3.02 3.02c.08.08.2.13.31.13s.23-.05.31-.13l2.99-2.99c.71-.74 1.52-.91 2.43-.91l-3.72-3.71a3 3 0 0 0-4.24 0l-3.71 3.7c1.76 0 2.3.58 2.61.89" />
      <path fill="#3cbeac" d="m21.11 9.85l-2.25-2.26H17.6c-.54 0-1.08.22-1.45.61l-3 3c-.28.28-.65.42-1.02.42a1.5 1.5 0 0 1-1.02-.42L8.09 8.17c-.38-.38-.9-.6-1.45-.6H5.17l-2.29 2.3a3 3 0 0 0 0 4.24l2.29 2.3h1.48c.54 0 1.06-.22 1.45-.6l3.02-3.02c.28-.28.65-.42 1.02-.42s.74.14 1.02.42l3.01 3.01c.38.38.9.6 1.45.6h1.26l2.25-2.26a3.042 3.042 0 0 0-.02-4.29" />
    </svg>
  );

  return (
    <form onSubmit={onSubmit} className="relative">
      {/* Header */}
      <div className="text-center text-blue-600 dark:text-blue-400 font-semibold border-b border-blue-600 dark:border-blue-400 py-3 mb-0">
        COMPRAR
      </div>

      {/* Pay Section */}
      <div className="p-4 pb-2">
        <div className="border border-gray-300 dark:border-slate-600 rounded px-4 py-0">
          <label className="block mt-3 mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Pagar
          </label>
          <div className="flex justify-between items-center relative">
            <input
              type="text"
              className="flex-1 border-0 p-0 text-lg bg-transparent focus:outline-none focus:ring-0 text-gray-900 dark:text-white"
              placeholder="10"
              value={buyData.payAmount}
              onChange={handlePayAmountChange}
            />
            <div className="flex items-center">
              {/* Show Max button only when currency is not PIX */}
              {buyData.payCurrency !== 'PIX' && getAvailableBalance() > 0 && (
                <button
                  type="button"
                  className="text-yellow-600 hover:text-yellow-700 text-sm font-medium mr-2 bg-transparent border-none"
                  onClick={handleMaxBuy}
                >
                  Máx
                </button>
              )}
              <button
                type="button"
                className="flex items-center px-0 py-2 bg-transparent border-none text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                onClick={() => onDropdownToggle('buy_pay')}
              >
                {getSelectedPayCurrency().icon === 'pix' ? (
                  <PIXIcon />
                ) : (
                  <img 
                    src={getSelectedPayCurrency().icon} 
                    alt={getSelectedPayCurrency().code} 
                    width="25" 
                    className="mr-2"
                  />
                )}
                <span className={`mr-1 ${getSelectedPayCurrency().icon === 'pix' ? 'ml-2' : ''}`}>{getSelectedPayCurrency().code}</span>
                <ChevronDown size={16} />
              </button>
            </div>

            {/* Pay Currency Dropdown */}
            {openDropdown === 'buy_pay' && (
              <div className="absolute top-full right-0 mt-1 bg-white dark:bg-slate-800 shadow-lg rounded-md border border-gray-200 dark:border-slate-600 z-20 min-w-[200px]">
                <ul className="py-1">
                  {fiatCurrencies.map(currency => (
                    <li
                      key={currency.code}
                      className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer flex items-center"
                      onClick={() => onCurrencySelect('buy', 'payCurrency', currency)}
                    >
                      {currency.icon === 'pix' ? (
                        <div className="mr-3">
                          <PIXIcon />
                        </div>
                      ) : (
                        <img src={currency.icon} alt={currency.code} width="25" className="mr-3" />
                      )}
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{currency.code}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{currency.name}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          {/* Show balance for non-PIX currencies */}
          {buyData.payCurrency !== 'PIX' && (
            <div className="flex text-xs text-gray-500 dark:text-gray-400 mt-1 mb-3">
              <span className="mr-1">Disponível:</span>
              <span>{formatNumber(getAvailableBalance(), 6)}</span>
              <span className="ml-1">{buyData.payCurrency}</span>
            </div>
          )}
        </div>
      </div>

      {/* Receive Section */}
      <div className="px-4 py-2">
        <div className="border border-gray-300 dark:border-slate-600 rounded px-4 py-0">
          <label className="flex items-center mt-3 mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Receber
            {calculation && (
              <Tooltip
                content={
                  <div className="text-sm">
                    <div className="font-bold text-center mb-2">Informações da Compra</div>
                    <hr className="my-2 border-gray-600" />
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>Preço:</span>
                        <span>1 {buyData.receiveCurrency} ≈ {formatNumber(calculation.price, 2)} {buyData.payCurrency}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Pagar:</span>
                        <span>≈ {formatNumber(calculation.payAmount, 2)} {buyData.payCurrency}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Taxa:</span>
                        <span>≈ {formatNumber(calculation.fee, 2)} {buyData.payCurrency}</span>
                      </div>
                      <div className="flex justify-between font-semibold">
                        <span>Receber:</span>
                        <span>≈ {formatNumber(calculation.receiveAmount)} {buyData.receiveCurrency}</span>
                      </div>
                    </div>
                    <hr className="my-2 border-gray-600" />
                    <div className="text-xs text-gray-300">
                      <strong>Observação:</strong> os preços das criptomoedas podem variar de acordo com as condições do mercado.
                    </div>
                  </div>
                }
                placement="top"
                theme="dark"
                allowHTML={true}
                maxWidth={350}
                interactive={true}
              >
                <button
                  type="button"
                  className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <Info size={16} />
                </button>
              </Tooltip>
            )}
          </label>
          <div className="flex justify-between items-center relative">
            <input
              type="text"
              className="flex-1 border-0 p-0 text-lg bg-transparent focus:outline-none focus:ring-0 text-gray-900 dark:text-white"
              placeholder="0.00000000"
              value={receiveAmount}
              readOnly
            />
            <button
              type="button"
              className="flex items-center px-0 py-2 bg-transparent border-none text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              onClick={() => onDropdownToggle('buy_receive')}
            >
              {getSelectedReceiveCurrency().icon === 'pix' ? (
                <PIXIcon />
              ) : (
                <img 
                  src={getSelectedReceiveCurrency().icon} 
                  alt={getSelectedReceiveCurrency().code} 
                  width="25" 
                  className="mr-2"
                />
              )}
              <span className={`mr-1 ${getSelectedReceiveCurrency().icon === 'pix' ? 'ml-2' : ''}`}>{getSelectedReceiveCurrency().code}</span>
              <ChevronDown size={16} />
            </button>

            {/* Receive Currency Dropdown */}
            {openDropdown === 'buy_receive' && (
              <div className="absolute top-full right-0 mt-1 bg-white dark:bg-slate-800 shadow-lg rounded-md border border-gray-200 dark:border-slate-600 z-20 min-w-[200px]">
                <ul className="py-1">
                  {cryptoCurrencies.map(currency => (
                    <li
                      key={currency.code}
                      className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer flex items-center"
                      onClick={() => onCurrencySelect('buy', 'receiveCurrency', currency)}
                    >
                      {currency.icon === 'pix' ? (
                        <div className="mr-3">
                          <PIXIcon />
                        </div>
                      ) : (
                        <img src={currency.icon} alt={currency.code} width="25" className="mr-3" />
                      )}
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{currency.code}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{currency.name}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>


      {/* Submit Button */}
      <div className="px-4 pb-4">
        <Button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          isLoading={loading}
          disabled={!buyData.payAmount || parseFloat(buyData.payAmount) <= 0}
        >
          Comprar {getSelectedReceiveCurrency().code}
        </Button>
      </div>

    </form>
  );
};

export default BuyTab;