"use client";
import React, { useState } from "react";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import useCachedBalances from "@/hooks/useCachedBalances";
import useConfig from "@/hooks/useConfig";
import { getTokenPrice, formatCurrency as formatCurrencyHelper } from "@/constants/tokenPrices";

const DigitalAssetsCard = () => {
  const [activeIndex, setActiveIndex] = useState(null);
  const { balances, loading, getBalance, getCorrectAzeSymbol } = useCachedBalances();
  const { defaultNetwork } = useConfig();

  const toggleAccordion = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };


  // Mapeamento de tokens por categoria (cBRL não entra em nenhuma categoria)
  const getTokenCategories = () => {
    const network = balances?.network || defaultNetwork;
    return {
      criptomoedas: [getCorrectAzeSymbol()], // AZE ou AZE-t, sem cBRL
      startups: ['CNT'],
      utility: ['MJD'],
      digital: network === 'testnet' ? ['PCN', 'STT'] : ['PCN'] // STT apenas na testnet
    };
  };
  
  const tokenCategories = getTokenCategories();

  // Usar preços centralizados de @/constants/tokenPrices

  // Função para obter o nome correto do token baseado na rede
  const getTokenName = (symbol) => {
    if (symbol === 'AZE' || symbol === 'AZE-t') {
      const network = balances?.network || defaultNetwork;
      return network === 'testnet' ? 'Azore (testnet)' : 'Azore';
    }
    
    const tokenNames = {
      'cBRL': 'Coinage Real Brasil',
      'CNT': 'Coinage Trade',
      'MJD': 'Meu Jurídico Digital',
      'PCN': 'Pratique Coin',
      'STT': 'Simple Test Token'
    };
    
    return tokenNames[symbol] || symbol;
  };
  
  // Nomes das categorias
  const categoryNames = {
    criptomoedas: "Criptomoedas",
    startups: "Startups",
    utility: "Utility Tokens",
    digital: "Renda Digital"
  };

  // Função para formatar saldo
  const formatBalance = (balance) => {
    if (!balance || balance === '0' || balance === 0) return '0.000000';
    return parseFloat(balance).toFixed(6);
  };

  // Usar formatação centralizada
  const formatCurrency = formatCurrencyHelper;

  // Função para calcular valor em BRL baseado no preço do token
  const calculateValueBRL = (balance, symbol) => {
    const price = getTokenPrice(symbol);
    const value = parseFloat(balance) * price;
    return formatCurrency(value);
  };

  // Processar dados dos balances
  const processAssetData = () => {
    if (!balances || loading) return [];

    const categories = [];
    
    Object.entries(tokenCategories).forEach(([categoryKey, tokens]) => {
      const categoryData = {
        title: categoryNames[categoryKey],
        balance: "R$ 0,00",
        data: []
      };

      let totalValue = 0;

      tokens.forEach(symbol => {
        const balance = getBalance(symbol);
        const formattedBalance = formatBalance(balance);
        const valueBRL = calculateValueBRL(balance, symbol);
        
        // Extrair valor numérico para cálculo do total
        const price = getTokenPrice(symbol);
        const numericValue = parseFloat(balance) * price;
        totalValue += numericValue;

        categoryData.data.push({
          symbol: symbol,
          name: getTokenName(symbol),
          available: `${formattedBalance} ${symbol}`,
          valueBRL: valueBRL
        });
      });

      // Atualizar saldo total da categoria
      categoryData.balance = formatCurrency(totalValue);
      
      // Só adicionar categoria se tiver dados
      if (categoryData.data.length > 0) {
        categories.push(categoryData);
      }
    });

    return categories;
  };

  const assetCategories = processAssetData();

  if (loading) {
    return (
      <Card title="Ativos Digitais" subtitle="Veja o detalhamento dos seus ativos por categoria">
        <div className="space-y-4">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card title="Ativos Digitais" subtitle="Veja o detalhamento dos seus ativos por categoria">
      <div className="space-y-4">
        <div className="space-y-3">
          {assetCategories.map((category, index) => (
            <div
              key={index}
              className={`border rounded-lg overflow-hidden transition-all duration-200 ${
                activeIndex === index
                  ? "border-primary-500 shadow-lg"
                  : "border-slate-200 dark:border-slate-700"
              }`}
            >
              {/* Header do accordion */}
              <div
                className={`flex justify-between items-center p-4 cursor-pointer transition-colors duration-200 ${
                  activeIndex === index
                    ? "bg-primary-500 text-white"
                    : "bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}
                onClick={() => toggleAccordion(index)}
              >
                <div className="flex items-center space-x-3">
                  <span
                    className={`text-lg transition-transform duration-200 ${
                      activeIndex === index ? "rotate-180" : ""
                    }`}
                  >
                    <Icon icon="heroicons-outline:chevron-down" />
                  </span>
                  <span className="font-medium">{category.title}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-sm opacity-80">Saldo</span>
                  <span className="balance font-semibold">{category.balance}</span>
                </div>
              </div>

              {/* Conteúdo do accordion */}
              {activeIndex === index && (
                <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-slate-50 dark:bg-slate-800">
                        <tr>
                          <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            <div className="flex justify-center">
                              <Icon icon="heroicons-outline:currency-dollar" className="w-4 h-4" />
                            </div>
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Sigla
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Nome
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Disponível
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Valor em BRL
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-700">
                        {category.data.map((item, itemIndex) => (
                          <tr
                            key={itemIndex}
                            className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors duration-150"
                          >
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center justify-center">
                                <div className="w-8 h-8 bg-slate-200 dark:bg-slate-600 rounded-full flex items-center justify-center">
                                  <img 
                                    src={`/assets/images/currencies/${item.symbol}.png`} 
                                    alt={item.symbol} 
                                    className="w-full h-full object-cover rounded-full"
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                      e.target.nextSibling.style.display = 'flex';
                                    }}
                                  />
                                  <div className="w-8 h-8 bg-slate-200 dark:bg-slate-600 rounded-full flex items-center justify-center hidden">
                                    <span className="text-slate-600 dark:text-slate-400 text-xs font-bold">
                                      {item.symbol.charAt(0)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">
                              {item.symbol}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                              {item.name}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-900 dark:text-white">
                              {item.available}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">
                              {item.valueBRL}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* Espaçador para manter altura similar ao TransactionHistoryTable quando fechado */}
        {activeIndex === null && (
          <div className="responsive-spacer flex items-center justify-center">
            <style jsx>{`
              .responsive-spacer {
                min-height: 0px;
              }
              @media (min-width: 1024px) {
                .responsive-spacer {
                  min-height: 78px;
                }
              }
              @media (min-width: 1196px) {
                .responsive-spacer {
                  min-height: 64px;
                }
              }
              @media (min-width: 1280px) {
                .responsive-spacer {
                  min-height: 78px;
                }
              }
              @media (min-width: 1444px) {
                .responsive-spacer {
                  min-height: 64px;
                }
              }
              @media (min-width: 1834px) {
                .responsive-spacer {
                  min-height: 49px;
                }
              }
            `}</style>
          </div>
        )}
      </div>
    </Card>
  );
};

export default DigitalAssetsCard;
