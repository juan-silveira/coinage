import React, { useState } from "react";
import Icon from "@/components/ui/Icon";
import Card from "@/components/ui/Card";
import useCachedBalances from "@/hooks/useCachedBalances";

const HomeBredCurbs = ({ title }) => {
  const [value, setValue] = useState({
    startDate: new Date(),
    endDate: new Date().setMonth(11),
  });

  // Usar o hook useCachedBalances para reagir automaticamente às mudanças
  const {
    getBalance,
    loading: isLoading,
    getCorrectAzeSymbol,
  } = useCachedBalances();

  const handleValueChange = (newValue) => {
    setValue(newValue);
  };

  // Formatar os saldos usando o hook useCachedBalances
  const formatForDisplay = (value) => {
    // Garante que o valor de entrada seja tratado como string
    const stringValue = String(value);

    // 1. Separa a parte inteira da parte decimal
    const parts = stringValue.split(".");
    const integerPart = parts[0];
    const decimalPart = parts[1] || ""; // Usa string vazia se não houver decimais

    // 2. Formata a parte inteira com os separadores de milhar do padrão brasileiro ('pt-BR')
    const formattedIntegerPart = Number(integerPart).toLocaleString("pt-BR");

    // 3. Retorna a parte inteira formatada, unida à parte decimal com uma vírgula
    // Se não houver parte decimal, retorna apenas a parte inteira formatada
    return decimalPart
      ? `${formattedIntegerPart},${decimalPart}`
      : formattedIntegerPart;
  };

  return (
    <div className="flex justify-between flex-wrap items-center mb-6">
      <h4 className="font-medium lg:text-2xl text-xl capitalize text-slate-900 inline-block ltr:pr-4 rtl:pl-4">
        {title}
      </h4>
      <div className="flex items-center space-x-4">
        <Card bodyClass="px-4 py-2">
          <div className="flex items-center space-x-2">
            {/* <Icon className="text-2xl text-primary" icon="heroicons:banknotes" /> */}
            <img
              src={`/assets/images/currencies/${getCorrectAzeSymbol()}.png`}
              alt="Aze"
              className="w-6 h-6"
            />
            <div>
              <div className="text-xs">Saldo {getCorrectAzeSymbol()}</div>
              <div className="balance font-bold">
                {isLoading ? (
                  <div className="animate-pulse bg-slate-200 dark:bg-slate-600 h-4 w-16 rounded"></div>
                ) : (
                  <>
                    {formatForDisplay(getBalance(getCorrectAzeSymbol()))}
                    {/* {" "}
                  <span className="text-xs">{getCorrectAzeSymbol()}</span> */}
                  </>
                )}
              </div>
            </div>
          </div>
        </Card>
        <Card bodyClass="px-4 py-2">
          <div className="flex items-center space-x-2">
            {/* <Icon className="text-2xl text-primary" icon="heroicons:currency-dollar" /> */}
            <img
              src="/assets/images/currencies/cBRL.png"
              alt="cBRL"
              className="w-6 h-6"
            />
            <div>
              <div className="text-xs">Saldo cBRL</div>
              <div className="balance font-bold">
                {isLoading ? (
                  <div className="animate-pulse bg-slate-200 dark:bg-slate-600 h-4 w-16 rounded"></div>
                ) : (
                  <>
                    {formatForDisplay(getBalance("cBRL"))}
                    {/* {" "}
                    <span className="text-xs">cBRL</span> */}
                  </>
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
