import React, { useState, useEffect } from "react";
import Icon from "@/components/ui/Icon";
import Card from "@/components/ui/Card";
import { userService } from "@/services/api";
import useAuthStore from "@/store/authStore";

const HomeBredCurbs = ({ title }) => {
  const [value, setValue] = useState({
    startDate: new Date(),
    endDate: new Date().setMonth(11),
  });

  const [balances, setBalances] = useState({
    aze: "0,000000",
    cbrl: "0,000000"
  });
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuthStore();

  const handleValueChange = (newValue) => {
    setValue(newValue);
  };

  // Função para formatar o valor como moeda brasileira com 6 casas decimais
  const formatCurrency = (value) => {
    if (!value || value === "0" || value === "0.0" || value === "0.00") {
      return "0,000000";
    }
    
    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      return "0,000000";
    }
    
    return numValue.toLocaleString('pt-BR', {
      minimumFractionDigits: 6,
      maximumFractionDigits: 6
    });
  };

  // Função para obter saldo específico (mesma lógica do useCacheData)
  const getBalanceForSymbol = (symbol, balancesData) => {
    if (!balancesData) {
      return '0,000000';
    }

    // Se o símbolo é AZE, usar o símbolo correto baseado na rede
    if (symbol === 'AZE') {
      const network = balancesData.network || 'testnet';
      symbol = network === 'testnet' ? 'AZE-t' : 'AZE';
    }

    // Tentar obter da balancesTable primeiro
    if (balancesData.balancesTable && balancesData.balancesTable[symbol]) {
      return formatCurrency(balancesData.balancesTable[symbol]);
    }

    // Se não encontrou na balancesTable, tentar na tokenBalances
    if (balancesData.tokenBalances && Array.isArray(balancesData.tokenBalances)) {
      const token = balancesData.tokenBalances.find(t => 
        t.tokenSymbol === symbol || t.tokenName === symbol
      );
      if (token) {
        return formatCurrency(token.balanceEth || token.balance);
      }
    }

    // Se é AZE/AZE-t e temos azeBalance
    if ((symbol === 'AZE' || symbol === 'AZE-t') && balancesData.azeBalance) {
      return formatCurrency(balancesData.azeBalance.balanceEth);
    }

    // Se é AZE/AZE-t, tentar buscar em qualquer lugar que possa ter o valor
    if (symbol === 'AZE' || symbol === 'AZE-t') {
      // Tentar AZE primeiro
      if (balancesData.balancesTable && balancesData.balancesTable.AZE) {
        return formatCurrency(balancesData.balancesTable.AZE);
      }
      // Tentar AZE-t
      if (balancesData.balancesTable && balancesData.balancesTable['AZE-t']) {
        return formatCurrency(balancesData.balancesTable['AZE-t']);
      }
      // Tentar na tokenBalances com qualquer variação
      if (balancesData.tokenBalances && Array.isArray(balancesData.tokenBalances)) {
        const azeToken = balancesData.tokenBalances.find(t => 
          t.tokenSymbol === 'AZE' || t.tokenSymbol === 'AZE-t' || 
          t.tokenName === 'AZE' || t.tokenName === 'AZE-t'
        );
        if (azeToken) {
          return formatCurrency(azeToken.balanceEth || azeToken.balance);
        }
      }
    }

    return '0,000000';
  };

  // Buscar saldo do usuário
  useEffect(() => {
    const fetchBalance = async () => {
      if (!user?.publicKey) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await userService.getUserBalances(user.publicKey, 'testnet');
        
        if (response.success && response.data) {
          const newBalances = {
            aze: getBalanceForSymbol('AZE', response.data),
            cbrl: getBalanceForSymbol('cBRL', response.data)
          };

          setBalances(newBalances);
        } else {
          setBalances({ aze: "0,000000", cbrl: "0,000000" });
        }
      } catch (error) {
        console.error('Erro ao buscar saldo:', error);
        setBalances({ aze: "0,000000", cbrl: "0,000000" });
      } finally {
        setIsLoading(false);
      }
    };

    fetchBalance();
  }, [user?.publicKey]);

  return (
    <div className="flex justify-between flex-wrap items-center mb-6">
      <h4 className="font-medium lg:text-2xl text-xl capitalize text-slate-900 inline-block ltr:pr-4 rtl:pl-4">
        {title}
      </h4>
      <div className="flex items-center space-x-4">
        <Card>
          <div className="flex items-center space-x-2">
            <Icon className="text-2xl text-primary" icon="heroicons:banknotes" />
            <div>
              <div className="text-xs">Saldo AZE</div>
              <div className="balance font-bold">
                {isLoading ? (
                  <div className="animate-pulse bg-slate-200 dark:bg-slate-600 h-4 w-16 rounded"></div>
                ) : (
                  `${balances.aze} AZE`
                )}
              </div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center space-x-2">
            <Icon className="text-2xl text-primary" icon="heroicons:currency-dollar" />
            <div>
              <div className="text-xs">Saldo cBRL</div>
              <div className="balance font-bold">
                {isLoading ? (
                  <div className="animate-pulse bg-slate-200 dark:bg-slate-600 h-4 w-16 rounded"></div>
                ) : (
                  `${balances.cbrl} cBRL`
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>
      {/* <div className="flex sm:space-x-4 space-x-2 sm:justify-end items-center rtl:space-x-reverse">
        <div className="date-btn inline-flex btn btn-md whitespace-nowrap space-x-2 rtl:space-x-reverse cursor-pointer bg-white dark:bg-slate-800 dark:text-slate-300 btn-md h-min text-sm font-normal text-slate-900">
          <span className="text-lg">
            <Icon icon="heroicons:calendar" />
          </span>
          <span>Weekly</span>
        </div>
        <div className="date-btn inline-flex btn btn-md whitespace-nowrap space-x-2 rtl:space-x-reverse cursor-pointer bg-white dark:bg-slate-800 dark:text-slate-300 btn-md h-min text-sm font-normal text-slate-900">
          <span className="text-lg">
            <Icon icon="heroicons-outline:filter" />
          </span>
          <span>Select date</span>
        </div>
      </div> */}
    </div>
  );
};

export default HomeBredCurbs;
