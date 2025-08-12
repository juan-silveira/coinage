"use client";

import React, { useState } from "react";
import Icon from "@/components/ui/Icon";

const FeesPage = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  const toggleAccordion = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  const feesData = [
    {
      title: "Transferências",
      icon: "heroicons-outline:arrow-path",
      content: [
        {
          category: "Transferências entre contas Coinage",
          description: "Para qualquer titularidade com qualquer valor",
          fee: "Grátis",
          isFree: true
        },
        {
          category: "Transferências para outros bancos",
          items: [
            {
              description: "Para contas de mesma titularidade com valores acima de R$ 300,00",
              fee: "Grátis",
              isFree: true
            },
            {
              description: "Para contas de mesma titularidade com valores até R$ 300,00",
              fee: "R$ 5,00 por transferência",
              isFree: false
            },
            {
              description: "Para contas de outra titularidade com qualquer valor",
              fee: "R$ 5,00 por transferência",
              isFree: false
            }
          ]
        }
      ]
    },
    {
      title: "Outros serviços",
      icon: "heroicons-outline:star",
      content: [
        {
          description: "Pagamento de contas e boletos",
          fee: "Grátis",
          isFree: true
        },
        {
          description: "Depósito",
          fee: "Grátis",
          isFree: true
        },
        {
          description: "Programa de pontos",
          fee: "Grátis",
          isFree: true
        },
        {
          description: "Recarga para telefone",
          fee: "Grátis",
          isFree: true
        },
        {
          description: "Extratos e comprovantes",
          fee: "Grátis",
          isFree: true
        }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          Confira as tarifas e prazos da sua conta
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Consulte todas as tarifas e condições dos nossos serviços
        </p>
      </div>
      
      <div className="max-w-4xl mx-auto">
        <div className="space-y-4">
          {feesData.map((item, index) => (
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
                  <Icon icon={item.icon} className="w-5 h-5" />
                  <span className="font-medium">{item.title}</span>
                </div>
              </div>

              {/* Conteúdo do accordion */}
              {activeIndex === index && (
                <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
                  <div className="p-6 space-y-6">
                    {item.title === "Transferências" ? (
                      <div className="space-y-6">
                        {/* Transferências entre contas Coinage */}
                        <div className="border-b border-gray-100 pb-4">
                          <h4 className="font-semibold text-gray-800 dark:text-white mb-2">
                            {item.content[0].category}
                          </h4>
                          <p className="text-gray-600 dark:text-gray-400 mb-2">
                            {item.content[0].description}
                          </p>
                          <span className="text-primary-500 font-medium text-lg">
                            {item.content[0].fee}
                          </span>
                        </div>
                        
                        {/* Transferências para outros bancos */}
                        <div>
                          <h4 className="font-semibold text-gray-800 dark:text-white mb-4">
                            {item.content[1].category}
                          </h4>
                          <div className="space-y-4">
                            {item.content[1].items.map((subItem, subIndex) => (
                              <div key={subIndex} className="flex flex-col">
                                <span className="text-gray-600 dark:text-gray-400 mb-1">
                                  {subItem.description}
                                </span>
                                <span className={`font-medium text-lg ${
                                  subItem.isFree ? 'text-primary-500' : 'text-gray-800 dark:text-white'
                                }`}>
                                  {subItem.fee}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Outros serviços */
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          {item.content.slice(0, 3).map((service, serviceIndex) => (
                            <div key={serviceIndex} className="flex flex-col">
                              <span className="text-gray-800 dark:text-white mb-1">
                                {service.description}
                              </span>
                              <span className="text-primary-500 font-medium text-lg">
                                {service.fee}
                              </span>
                            </div>
                          ))}
                        </div>
                        
                        <div className="space-y-4">
                          {item.content.slice(3).map((service, serviceIndex) => (
                            <div key={serviceIndex + 3} className="flex flex-col">
                              <span className="text-gray-800 dark:text-white mb-1">
                                {service.description}
                              </span>
                              <span className="text-primary-500 font-medium text-lg">
                                {service.fee}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeesPage;
