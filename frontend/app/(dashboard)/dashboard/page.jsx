"use client";
import React, { useState } from "react";
import dynamic from "next/dynamic";
import Card from "@/components/ui/Card";
import Textinput from "@/components/ui/Textinput";
import PortfolioDonutChart from "@/components/partials/widget/chart/portfolio-donut-chart";
import PortfolioSummary from "@/components/partials/widget/PortfolioSummary";
import Link from "next/link";
import SimpleBar from "simplebar-react";
import Earnings from "@/components/partials/widget/Earnings";
import CompanyTable from "@/components/partials/table/company-table";
import HistoryChart from "@/components/partials/widget/chart/history-chart";
import AccountReceivable from "@/components/partials/widget/chart/account-receivable";
import AccountPayable from "@/components/partials/widget/chart/account-payable";
import useAuthStore from "@/store/authStore";
import useCacheData from "@/hooks/useCacheData";

const CardSlider = dynamic(
  () => import("@/components/partials/widget/CardSlider"),
  {
    ssr: false,
  }
);
import TransactionsTable from "@/components/partials/table/transactions";
import SelectMonth from "@/components/partials/SelectMonth";
import HomeBredCurbs from "@/components/partials/HomeBredCurbs";
import DigitalAssetsCard from "@/components/partials/widget/DigitalAssetsCard";

const users = [
  {
    name: "Ab",
  },
  {
    name: "Bc",
  },
  {
    name: "Cd",
  },
  {
    name: "Df",
  },
  {
    name: "Ab",
  },
  {
    name: "Sd",
  },
  {
    name: "Sg",
  },
];

const BankingPage = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const { user } = useAuthStore();
  const { balances, loading } = useCacheData();

  // Função para obter saudação baseada na hora
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  return (
    <div className="space-y-5">
      <HomeBredCurbs title="Dashboard" />
      <Card
        title="Portfólio"
        subtitle="Confira abaixo o seu patrimônio digital"
        bodyClass="p-4"
      >
        <div className="grid lg:grid-cols-2 grid-cols-1 gap-6">
          {/* Seção de boas-vindas */}
          <div className="flex items-center justify-center">
            <div className="flex space-x-4 items-center rtl:space-x-reverse">
              <div className="flex-none">
                <div className="h-20 w-20 rounded-full">
                  <img
                    src="/assets/images/users/ivan.jpg"
                    alt=""
                    className="block w-full h-full object-cover rounded-full"
                  />
                </div>
              </div>
              <div className="flex-1">
                <h4 className="text-xl font-medium mb-2">
                  <span className="block font-light">{getGreeting()},</span>
                  <span className="block">{user?.name || "Usuário"}</span>
                </h4>
                <p className="text-sm dark:text-slate-300">
                  Bem-vindo à Coinage
                </p>
              </div>
            </div>
          </div>

          {/* Seção do gráfico donut */}
          <div className="flex items-center justify-center">
            <PortfolioDonutChart />
          </div>
        </div>
        <PortfolioSummary />
      </Card>
      <div className="grid grid-cols-12 gap-5">
        <div className="lg:col-span-6 col-span-12 space-y-5">
          <DigitalAssetsCard />
        </div>
        <div className="lg:col-span-6 col-span-12 space-y-5">
          {/* <TransactionsTable /> */}
          <Card title="All Company" headerslot={<SelectMonth />} noborder>
            <CompanyTable />
          </Card>
        </div>
      </div>
      <div className="grid lg:grid-cols-2 grid-cols-1 gap-5">
        <Earnings />
        <Card title="History" headerslot={<SelectMonth />}>
          <div className="legend-ring4">
            <HistoryChart />
          </div>
        </Card>
      </div>
    </div>
  );
};

export default BankingPage;
