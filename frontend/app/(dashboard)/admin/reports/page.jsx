"use client";

import { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import usePermissions from "@/hooks/usePermissions";
import { useRouter } from "next/navigation";

const CompanyReportsPage = () => {
  const router = useRouter();
  const permissions = usePermissions();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!permissions.canViewCompanySettings) {
      router.push("/dashboard");
      return;
    }
    
    loadReports();
  }, [permissions, router]);

  const loadReports = async () => {
    try {
      // TODO: Implement API call to get company reports
      const mockReports = [
        {
          id: 1,
          title: "Relatório de Transações - Dezembro 2024",
          description: "Relatório completo de todas as transações realizadas no mês",
          type: "transactions",
          period: "2024-12",
          generatedAt: new Date().toISOString(),
          status: "ready",
          downloadUrl: "#"
        },
        {
          id: 2,
          title: "Relatório de Usuários Ativos",
          description: "Lista de usuários com atividade nos últimos 30 dias",
          type: "users",
          period: "last-30-days",
          generatedAt: new Date().toISOString(),
          status: "generating",
          downloadUrl: null
        }
      ];
      
      setReports(mockReports);
    } catch (error) {
      console.error("Error loading reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (type) => {
    try {
      // TODO: Implement API call to generate report
      console.log("Generating report:", type);
      alert("Relatório sendo gerado. Você será notificado quando estiver pronto.");
    } catch (error) {
      console.error("Error generating report:", error);
      alert("Erro ao gerar relatório");
    }
  };

  const downloadReport = (report) => {
    if (report.status !== "ready" || !report.downloadUrl) return;
    
    // TODO: Implement actual download
    window.open(report.downloadUrl, '_blank');
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "ready":
        return <Badge label="Pronto" className="bg-success-500" />;
      case "generating":
        return <Badge label="Gerando..." className="bg-warning-500" />;
      case "error":
        return <Badge label="Erro" className="bg-danger-500" />;
      default:
        return <Badge label="Pendente" className="bg-secondary-500" />;
    }
  };

  if (!permissions.canViewCompanySettings) {
    return null;
  }

  return (
    <div className="space-y-5">
      <Card title="Relatórios da Empresa">
        <div className="mb-6">
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Gere e baixe relatórios detalhados sobre a atividade da empresa.
          </p>
          
          <div className="flex flex-wrap gap-3">
            <Button
              text="Relatório de Transações"
              icon="heroicons-outline:credit-card"
              className="btn-primary"
              onClick={() => generateReport("transactions")}
            />
            <Button
              text="Relatório de Usuários"
              icon="heroicons-outline:users"
              className="btn-secondary"
              onClick={() => generateReport("users")}
            />
            <Button
              text="Relatório Financeiro"
              icon="heroicons-outline:chart-bar"
              className="btn-info"
              onClick={() => generateReport("financial")}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-slate-900 dark:text-white">
              Relatórios Disponíveis
            </h3>
            
            {reports.length === 0 ? (
              <div className="text-center py-10 text-slate-500 dark:text-slate-400">
                Nenhum relatório disponível. Clique nos botões acima para gerar novos relatórios.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {reports.map((report) => (
                  <div key={report.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="text-lg font-medium text-slate-900 dark:text-white">
                            {report.title}
                          </h4>
                          {getStatusBadge(report.status)}
                        </div>
                        
                        <p className="text-slate-600 dark:text-slate-400 mb-2">
                          {report.description}
                        </p>
                        
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                          <p>Período: {report.period}</p>
                          <p>Gerado em: {new Date(report.generatedAt).toLocaleString()}</p>
                        </div>
                      </div>
                      
                      <div className="ml-4">
                        <Button
                          text="Download"
                          icon="heroicons-outline:arrow-down-tray"
                          className={`btn-sm ${report.status === "ready" ? "btn-primary" : "btn-secondary"}`}
                          onClick={() => downloadReport(report)}
                          disabled={report.status !== "ready"}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default CompanyReportsPage;