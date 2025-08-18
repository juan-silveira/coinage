"use client";

import { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import usePermissions from "@/hooks/usePermissions";
import { useRouter } from "next/navigation";
import TransactionHistoryTable from "@/components/partials/table/TransactionHistoryTable";

const CompanyTransactionsPage = () => {
  const router = useRouter();
  const permissions = usePermissions();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!permissions.canViewCompanySettings) {
      router.push("/dashboard");
      return;
    }
    
    loadTransactions();
  }, [permissions, router]);

  const loadTransactions = async () => {
    try {
      // TODO: Implement API call to get company transactions
      const mockTransactions = [
        {
          id: 1,
          user: "Ivan Alberton",
          type: "deposit",
          amount: "2.5 ETH",
          status: "confirmed",
          hash: "0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba",
          date: new Date().toISOString(),
          network: "mainnet"
        },
        {
          id: 2,
          user: "Usuário Teste 1",
          type: "transfer",
          amount: "0.5 ETH",
          status: "pending",
          hash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
          date: new Date().toISOString(),
          network: "mainnet"
        }
      ];
      
      setTransactions(mockTransactions);
    } catch (error) {
      console.error("Error loading transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!permissions.canViewCompanySettings) {
    return null;
  }

  return (
    <div className="space-y-5">
      <Card title="Transações da Empresa">
        <div className="mb-4">
          <p className="text-slate-600 dark:text-slate-400">
            Visualize todas as transações realizadas pelos usuários da empresa.
          </p>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
        ) : (
          <TransactionHistoryTable data={transactions} />
        )}
      </Card>
    </div>
  );
};

export default CompanyTransactionsPage;