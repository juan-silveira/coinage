"use client";
import React, { useState, useEffect } from 'react';
import { ShoppingCart, Lock, Loader2, TrendingUp } from 'lucide-react';
import MeuPedacinhoPratique from './MeuPedacinhoPratique';
import Image from '@/components/ui/Image';
import stakeContractsService from '@/services/stakeContractsService';
import { useAuth } from '@/hooks/useAuth';
import { useAlertContext } from '@/contexts/AlertContext';
import api from '@/services/api';

const PrivateOffersTab = () => {
  const { user } = useAuth();
  const { showError } = useAlertContext();
  const [loading, setLoading] = useState(true);
  const [privateStakeContracts, setPrivateStakeContracts] = useState([]);
  const [tokenInfo, setTokenInfo] = useState({}); // Armazenar informações dos tokens


  useEffect(() => {
    loadPrivateStakeContracts();
  }, [user]);

  const loadPrivateStakeContracts = async (forceRefresh = false) => {
    try {
      setLoading(true);
      
      // Limpar cache se forceRefresh
      if (forceRefresh) {
        stakeContractsService.clearCache();
      }
      
      const userAddress = user?.walletAddress || user?.blockchainAddress || user?.publicKey;
      
      const result = await stakeContractsService.categorizeStakeContracts(userAddress, forceRefresh);
      
      // Validar resultado antes de definir estado
      if (result && Array.isArray(result.privateOffers)) {
        setPrivateStakeContracts(result.privateOffers);
        
        // Carregar informações dos tokens após definir os contratos
        if (result.privateOffers.length > 0) {
          await loadTokensInfo(result.privateOffers);
        }
      } else {
        console.warn('Invalid result from categorizeStakeContracts:', result);
        setPrivateStakeContracts([]);
      }
    } catch (error) {
      console.error('Error loading private stake contracts:', error);
      setPrivateStakeContracts([]); // Garantir estado válido em caso de erro
      showError('Erro ao carregar ofertas privadas. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  // Função para buscar informações de um token específico
  const fetchTokenInfo = async (tokenAddress, network) => {
    try {
      // Primeiro tentar via contract call (mais confiável)
      const symbolResponse = await api.post('/api/contracts/read', {
        contractAddress: tokenAddress,
        functionName: 'symbol',
        params: [],
        network
      });
      
      if (symbolResponse.data.success && symbolResponse.data.data?.result) {
        const symbol = Array.isArray(symbolResponse.data.data.result) 
          ? symbolResponse.data.data.result[0] 
          : symbolResponse.data.data.result;
        
        return {
          symbol: symbol || 'UNKNOWN',
          name: symbol || 'Unknown Token',
          decimals: 18
        };
      }
      
      return null;
    } catch (error) {
      console.warn(`Failed to fetch token info for ${tokenAddress}:`, error.message);
      return null;
    }
  };

  // Carregar informações dos tokens para todos os contratos
  const loadTokensInfo = async (contracts) => {
    const tokensInfo = {};
    
    for (const contract of contracts) {
      // Verificar se existe tokenAddress no metadata
      const tokenAddress = contract.tokenAddress || contract.stakeToken;
      
      if (tokenAddress && tokenAddress !== '0x0000000000000000000000000000000000000000') {
        const info = await fetchTokenInfo(tokenAddress, contract.network);
        if (info) {
          tokensInfo[contract.address] = {
            ...info,
            tokenAddress
          };
        }
      }
    }
    
    setTokenInfo(tokensInfo);
  };

  const formatStakeContractForDisplay = (contract) => {
    // Validar dados do contrato
    if (!contract || typeof contract !== 'object') {
      console.warn('Invalid contract for display formatting:', contract);
      return null;
    }

    // Usar informações do token carregadas dinamicamente
    const tokenSymbol = tokenInfo[contract.address]?.symbol || contract.symbol || 'STAKE';
    
    return {
      icon: `${tokenSymbol}.png`,
      name: contract.name || 'Unknown Contract',
      code: tokenSymbol,
      price: '1 unidade',
      profitability: 'Recompensas de stake',
      profitabilityClass: 'text-purple-600',
      payment: 'Variável',
      daysRemaining: 'Sem prazo definido',
      market: 'Privado',
      type: 'stake',
      contractAddress: contract.address || '',
      network: contract.network || ''
    };
  };

  // Usar apenas contratos de stake reais com validação
  const allProducts = privateStakeContracts
    .map(formatStakeContractForDisplay)
    .filter(product => product !== null); // Filtrar produtos inválidos

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <span className="ml-2 text-gray-600 dark:text-gray-400">
              Carregando ofertas privadas...
            </span>
          </div>
        ) : (
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
                    Prazo
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
                {allProducts.length > 0 ? allProducts.map((product, index) => (
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
              )) : (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <Lock className="h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">
                        Nenhuma oferta privada disponível
                      </p>
                      <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                        Você não está autorizado para nenhum stake privado no momento
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        )}
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