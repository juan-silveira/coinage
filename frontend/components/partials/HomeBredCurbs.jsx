import React, { useState } from "react";
import Icon from "@/components/ui/Icon";
import Card from "@/components/ui/Card";
import useCacheData from "@/hooks/useCacheData";

const HomeBredCurbs = ({ title }) => {
  const [value, setValue] = useState({
    startDate: new Date(),
    endDate: new Date().setMonth(11),
  });

  // Usar o hook useCacheData para reagir automaticamente às mudanças
  const { getBalance, loading: isLoading } = useCacheData();

  const handleValueChange = (newValue) => {
    setValue(newValue);
  };

  // Formatar os saldos usando o hook useCacheData
  const formatForDisplay = (value) => {
    return value.replace('.', ','); // Converter ponto para vírgula (padrão brasileiro)
  };

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
                  `${formatForDisplay(getBalance('AZE'))} AZE`
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
                  `${formatForDisplay(getBalance('cBRL'))} cBRL`
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
