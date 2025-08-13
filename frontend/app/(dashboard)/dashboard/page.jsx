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
import EarningsChart from "@/components/partials/widget/chart/earnings-chart";
import AccountReceivable from "@/components/partials/widget/chart/account-receivable";
import AccountPayable from "@/components/partials/widget/chart/account-payable";
import useAuthStore from "@/store/authStore";
import useCacheData from "@/hooks/useCacheData";
import useEarnings from "@/hooks/useEarnings";

const CardSlider = dynamic(
  () => import("@/components/partials/widget/CardSlider"),
  {
    ssr: false,
  }
);
import TransactionHistoryTable from "@/components/partials/table/TransactionHistoryTable";
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
  
  // Hook compartilhado para earnings
  const earningsData = useEarnings({
    limit: 100, // Buscar mais dados para o gráfico
    autoFetch: true,
  });
  
  // Não mostrar loading geral - deixar os componentes individuais lidarem com seus placeholders

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
        <PortfolioSummary />
      </Card>
      <div className="grid grid-cols-12 gap-5">
        <div className="lg:col-span-6 col-span-12 space-y-5">
          <DigitalAssetsCard />
        </div>
        <div className="lg:col-span-6 col-span-12 space-y-5">
          <TransactionHistoryTable />
        </div>
      </div>
      <div className="grid lg:grid-cols-2 grid-cols-1 gap-5">
        <Earnings />
        <Card title="Histórico de Proventos" subtitle="Acompanhe o histórico das distribuições dos proventos" headerslot={<SelectMonth />}>
          <div className="legend-ring4">
            <EarningsChart earnings={earningsData.earnings || []} />
          </div>
        </Card>
      </div>
    </div>
  );
};

export default BankingPage;
