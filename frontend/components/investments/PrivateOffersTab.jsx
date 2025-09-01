"use client";
import React from 'react';
import { ShoppingCart, Lock } from 'lucide-react';
import MeuPedacinhoPratique from './MeuPedacinhoPratique';
import Image from '@/components/ui/Image';

const PrivateOffersTab = () => {
  const products = [
    {
      icon: 'PCN.png',
      name: 'Pratique Coin',
      code: 'PCN',
      price: 'R$ 1,00',
      profitability: 'Atrelado ao lucro da empresa',
      profitabilityClass: 'text-green-600',
      payment: 'Trimestral',
      daysRemaining: '90 dias',
      market: 'Primário',
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
                    <button className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs leading-4 font-medium rounded-full text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                      <ShoppingCart size={14} className="mr-1" />
                      Comprar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <Lock className="h-5 w-5 text-red-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
              Sobre Ofertas Privadas
            </h3>
            <div className="mt-2 text-sm text-red-700 dark:text-red-300">
              <p>
                Oportunidades exclusivas de investimento com participação nos lucros empresariais. 
                Oferece distribuições trimestrais baseadas no desempenho das empresas parceiras.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Meu Pedacinho Pratique Section */}
      <div className="mt-8">
        <MeuPedacinhoPratique />
      </div>
    </div>
  );
};

export default PrivateOffersTab;