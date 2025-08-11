import React, { useState, useEffect } from "react";
import Icon from "@/components/ui/Icon";

// Hook personalizado para detectar tamanho da tela
const useScreenSize = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Verificar tamanho inicial
    checkScreenSize();

    // Adicionar listener para mudanças de tamanho
    window.addEventListener('resize', checkScreenSize);

    // Cleanup
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  return isMobile;
};

const BalancesTable = ({ balances, loading = false }) => {
  const isMobile = useScreenSize();

  // Mapear símbolos para nomes completos
  const tokenNames = {
    'AZE': 'Azore Token (Mainnet)',
    'AZE-t': 'Azore Token (Testnet)',
    'cBRL': 'Crypto Real Brasileiro',
    'TEST': 'Test Token',
    'USDC': 'USD Coin',
    'STT': 'Stake Token Test'
  };

  // Função para obter o nome do token
  const getTokenName = (symbol) => {
    return tokenNames[symbol] || `${symbol} Token`;
  };

  // Função para formatar o saldo com truncamento para valores muito longos
  const formatBalance = (balance) => {
    if (balance === '0' || balance === 0 || !balance) {
      return '0.000000';
    }
    
    const formatted = parseFloat(balance).toFixed(6);
    
    // Aplicar truncamento apenas em telas menores que 768px
    if (isMobile && formatted.length > 12) {
      const num = parseFloat(balance);
      if (num >= 1000000) {
        return (num / 1000000).toFixed(2) + 'M';
      } else if (num >= 1000) {
        return (num / 1000).toFixed(2) + 'K';
      } else {
        return num.toFixed(2);
      }
    }
    
    return formatted;
  };

  // Função para obter o símbolo correto do AZE baseado na rede
  const getCorrectAzeSymbol = () => {
    if (!balances) return 'AZE-t'; // Default para testnet
    const network = balances.network || 'testnet';
    return network === 'testnet' ? 'AZE-t' : 'AZE';
  };

  // Função para obter saldo específico (mesma lógica do useCacheData)
  const getBalanceForSymbol = (symbol, balancesData) => {
    if (!balancesData) {
      return '0.000000';
    }

    // Se o símbolo é AZE, usar o símbolo correto baseado na rede
    if (symbol === 'AZE') {
      const network = balancesData.network || 'testnet';
      symbol = network === 'testnet' ? 'AZE-t' : 'AZE';
    }

    // Tentar obter da balancesTable primeiro
    if (balancesData.balancesTable && balancesData.balancesTable[symbol]) {
      return formatBalance(balancesData.balancesTable[symbol]);
    }

    // Se não encontrou na balancesTable, tentar na tokenBalances
    if (balancesData.tokenBalances && Array.isArray(balancesData.tokenBalances)) {
      const token = balancesData.tokenBalances.find(t => 
        t.tokenSymbol === symbol || t.tokenName === symbol
      );
      if (token) {
        return formatBalance(token.balanceEth || token.balance);
      }
    }

    // Se é AZE/AZE-t e temos azeBalance
    if ((symbol === 'AZE' || symbol === 'AZE-t') && balancesData.azeBalance) {
      return formatBalance(balancesData.azeBalance.balanceEth);
    }

    // Se é AZE/AZE-t, tentar buscar em qualquer lugar que possa ter o valor
    if (symbol === 'AZE' || symbol === 'AZE-t') {
      // Tentar AZE primeiro
      if (balancesData.balancesTable && balancesData.balancesTable.AZE) {
        return formatBalance(balancesData.balancesTable.AZE);
      }
      // Tentar AZE-t
      if (balancesData.balancesTable && balancesData.balancesTable['AZE-t']) {
        return formatBalance(balancesData.balancesTable['AZE-t']);
      }
      // Tentar na tokenBalances com qualquer variação
      if (balancesData.tokenBalances && Array.isArray(balancesData.tokenBalances)) {
        const azeToken = balancesData.tokenBalances.find(t => 
          t.tokenSymbol === 'AZE' || t.tokenSymbol === 'AZE-t' || 
          t.tokenName === 'AZE' || t.tokenName === 'AZE-t'
        );
        if (azeToken) {
          return formatBalance(azeToken.balanceEth || azeToken.balance);
        }
      }
    }

    return '0.000000';
  };

  // Processar dados dos balances
  let tokenEntries = [];
  const correctAzeSymbol = getCorrectAzeSymbol();
  
  // Verificar se balances existe antes de processar
  if (balances) {
    // Se temos balancesTable, usar ela
    if (balances.balancesTable && Object.keys(balances.balancesTable).length > 0) {
      tokenEntries = Object.entries(balances.balancesTable);
      
      // Corrigir símbolo do AZE se necessário
      tokenEntries = tokenEntries.map(([symbol, balance]) => {
        if (symbol === 'AZE' || symbol === 'AZE-t') {
          return [correctAzeSymbol, balance];
        }
        return [symbol, balance];
      });
    }
    // Se não temos balancesTable mas temos tokenBalances, processar
    else if (balances.tokenBalances && Array.isArray(balances.tokenBalances)) {
      tokenEntries = balances.tokenBalances.map(token => [
        token.tokenSymbol,
        token.balanceEth || token.balance
      ]);
    }
    // Se temos azeBalance, adicionar AZE com símbolo correto
    else if (balances.azeBalance) {
      tokenEntries.push([correctAzeSymbol, balances.azeBalance.balanceEth]);
    }

    // Garantir que AZE (com símbolo correto) e cBRL sempre apareçam, mesmo com saldo zero
    const allTokens = new Set(tokenEntries.map(([symbol]) => symbol));
    if (!allTokens.has(correctAzeSymbol)) {
      // Usar a lógica de busca para obter o valor correto
      const azeBalance = getBalanceForSymbol('AZE', balances);
      tokenEntries.push([correctAzeSymbol, parseFloat(azeBalance)]);
    }
    if (!allTokens.has('cBRL')) {
      const cbrlBalance = getBalanceForSymbol('cBRL', balances);
      tokenEntries.push(['cBRL', parseFloat(cbrlBalance)]);
    }
  }

  // Calcular total de tokens (API já retorna o total correto incluindo AZE)
  const totalTokens = balances?.totalTokens || tokenEntries.length;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse bg-slate-200 dark:bg-slate-600 h-4 w-full rounded"></div>
        <div className="animate-pulse bg-slate-200 dark:bg-slate-600 h-4 w-3/4 rounded"></div>
        <div className="animate-pulse bg-slate-200 dark:bg-slate-600 h-4 w-1/2 rounded"></div>
      </div>
    );
  }

  if (!balances) {
    return (
      <div className="text-center py-8">
        <Icon icon="heroicons:information-circle" className="w-12 h-12 text-slate-400 mx-auto mb-4" />
        <p className="text-slate-600 dark:text-slate-400">
          Nenhum saldo disponível. Faça login para ver seus balances.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tabela de Balances */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse dark:border-slate-700 dark:border">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-700 dark:text-slate-300">
              <th className="w-16 md:w-20 text-xs font-medium leading-4 uppercase text-slate-600 ltr:text-left ltr:last:text-right rtl:text-right rtl:last:text-left">
                <span className="block px-3 md:px-6 py-5 font-semibold">Logo</span>
              </th>
              <th className="w-20 md:w-24 text-xs font-medium leading-4 uppercase text-slate-600 ltr:text-left ltr:last:text-right rtl:text-right rtl:last:text-left">
                <span className="block px-3 md:px-6 py-5 font-semibold">Sigla</span>
              </th>
              <th className="min-w-0 flex-1 text-xs font-medium leading-4 uppercase text-slate-600 ltr:text-left ltr:last:text-right rtl:text-right rtl:last:text-left">
                <span className="block px-3 md:px-6 py-5 font-semibold">Nome</span>
              </th>
              <th className="w-24 md:w-32 text-xs font-medium leading-4 uppercase text-slate-600 ltr:text-left ltr:last:text-right rtl:text-right rtl:last:text-left">
                <span className="block px-3 md:px-6 py-5 font-semibold">Saldo</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {tokenEntries.map(([tokenSymbol, balance], index) => (
              <tr
                key={tokenSymbol}
                className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                <td className="w-16 md:w-20 text-slate-900 dark:text-slate-300 text-sm font-normal ltr:text-left ltr:last:text-right rtl:text-right rtl:last:text-left px-3 md:px-6 py-4">
                  <div className="flex items-center">
                    <img
                      src={`/assets/images/currencies/${tokenSymbol}.png`}
                      alt={tokenSymbol}
                      className="w-8 h-8 rounded-full"
                      onError={(e) => {
                        // Fallback para imagem padrão se não encontrar
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div className="w-8 h-8 bg-slate-200 dark:bg-slate-600 rounded-full flex items-center justify-center hidden">
                      <span className="text-slate-600 dark:text-slate-400 text-xs font-bold">
                        {tokenSymbol.charAt(0)}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="w-20 md:w-24 text-slate-900 dark:text-slate-300 text-sm font-normal ltr:text-left ltr:last:text-right rtl:text-right rtl:last:text-left px-3 md:px-6 py-4">
                  <span className="font-medium">{tokenSymbol}</span>
                </td>
                <td className="min-w-0 flex-1 text-slate-900 dark:text-slate-300 text-sm font-normal ltr:text-left ltr:last:text-right rtl:text-right rtl:last:text-left px-3 md:px-6 py-4">
                  <span className="text-slate-600 dark:text-slate-400 truncate block" title={getTokenName(tokenSymbol)}>
                    {getTokenName(tokenSymbol)}
                  </span>
                </td>
                <td className="w-24 md:w-32 text-slate-900 dark:text-slate-300 text-sm font-normal ltr:text-left ltr:last:text-right rtl:text-right rtl:last:text-left px-3 md:px-6 py-4">
                  <span className="font-bold text-xs md:text-sm" title={formatBalance(balance)}>
                    {formatBalance(balance)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Resumo */}
      <div className="md:flex px-3 md:px-6 py-6 items-center bg-slate-50 dark:bg-slate-700 rounded-lg">
        {/* <div className="flex-1 text-slate-500 dark:text-slate-300 text-sm">
          Dados carregados do cache Redis - Performance otimizada
        </div> */}
        <div className="flex-none min-w-0 md:min-w-[270px] space-y-3">
          <div className="flex justify-between">
            <span className="font-medium text-slate-600 text-xs dark:text-slate-300 uppercase">
              Total de Tokens:
            </span>
            <span className="text-slate-900 dark:text-slate-300">
              {totalTokens}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium text-slate-600 text-xs dark:text-slate-300 uppercase">
              Rede:
            </span>
            <span className="text-slate-900 dark:text-slate-300">
              {balances.network || 'testnet'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium text-slate-600 text-xs dark:text-slate-300 uppercase">
              Endereço:
            </span>
            <span className="text-slate-900 dark:text-slate-300 font-mono text-xs truncate ml-2" title={balances.address || 'N/A'}>
              {balances.address ? `${balances.address.substring(0, 8)}...` : 'N/A'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BalancesTable;
