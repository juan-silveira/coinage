"use client";
import React from 'react';
import { TrendingUp, ShoppingCart, Activity } from 'lucide-react';
import Image from '@/components/ui/Image';

const VariableIncomeTab = () => {
  const products = [
    {
      icon: 'MJD.png',
      name: 'Meu Jurídico Digital',
      code: 'MJD',
      price: 'R$ 1,00',
      profitability: 'Royalties de até 17% ao ano',
      profitabilityClass: 'text-green-600',
      payment: 'Semestral',
      daysRemaining: '175 dias',
      market: 'Primário',
    },
    {
      icon: 'IMB.png',
      name: 'Imobiliário',
      code: 'IMB',
      price: 'R$ 1,00',
      profitability: 'Aprox. 20% ao ano + Reajuste IGPM',
      profitabilityClass: 'text-green-600',
      payment: 'Trimestral',
      daysRemaining: 'Finalizado',
      market: 'Encerrado',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Ativo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Preço
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Rentabilidade
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Pagamento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Dias Restantes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Mercado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {products.map((product, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8">
                        <div className="h-8 w-8 rounded-full flex items-center justify-center text-white font-bold text-xs">
                          <Image src={`assets/images/currencies/${product.code}.png`} alt={product.code} />
                        </div>
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {product.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          ({product.code})
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {product.price}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${product.profitabilityClass}`}>
                    {product.profitability}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {product.payment}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {product.daysRemaining}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {product.market}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button 
                      className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs leading-4 font-medium rounded-full text-white ${
                        product.market === 'Encerrado' 
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                      }`}
                      disabled={product.market === 'Encerrado'}
                    >
                      <ShoppingCart size={14} className="mr-1" />
                      {product.market === 'Encerrado' ? 'Encerrado' : 'Comprar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <Activity className="h-5 w-5 text-purple-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-purple-800 dark:text-purple-200">
              Sobre Renda Variável Digital
            </h3>
            <div className="mt-2 text-sm text-purple-700 dark:text-purple-300">
              <p>
                Produtos com retornos variáveis baseados em royalties e participações. 
                Oferece potencial de maior rentabilidade com pagamentos periódicos vinculados ao desempenho dos ativos.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VariableIncomeTab;