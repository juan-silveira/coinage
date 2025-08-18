"use client";

import { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import usePermissions from "@/hooks/usePermissions";
import { useRouter } from "next/navigation";

const SystemCompaniesPage = () => {
  const router = useRouter();
  const permissions = usePermissions();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!permissions.canViewSystemSettings) {
      router.push("/dashboard");
      return;
    }
    
    loadCompanies();
  }, [permissions, router]);

  const loadCompanies = async () => {
    try {
      // TODO: Implement API call to get all companies
      const mockCompanies = [
        {
          id: 1,
          name: "Coinage",
          alias: "coinage",
          isActive: true,
          userCount: 150,
          transactionCount: 1250,
          createdAt: "2024-01-15",
          rateLimit: {
            requestsPerMinute: 1000,
            requestsPerHour: 10000,
            requestsPerDay: 100000
          }
        },
        {
          id: 2,
          name: "Navi",
          alias: "navi",
          isActive: true,
          userCount: 75,
          transactionCount: 850,
          createdAt: "2024-02-01",
          rateLimit: {
            requestsPerMinute: 500,
            requestsPerHour: 5000,
            requestsPerDay: 50000
          }
        }
      ];
      
      setCompanies(mockCompanies);
    } catch (error) {
      console.error("Error loading companies:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!permissions.canViewSystemSettings) {
    return null;
  }

  return (
    <div className="space-y-5">
      <Card title="Gestão de Empresas">
        <div className="mb-6">
          <p className="text-slate-600 dark:text-slate-400">
            Gerencie todas as empresas do sistema e suas configurações.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-slate-900 dark:text-white">
                Empresas Cadastradas ({companies.length})
              </h3>
              <Button
                text="Nova Empresa"
                icon="heroicons-outline:plus"
                className="btn-primary"
                onClick={() => alert("Funcionalidade em desenvolvimento")}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {companies.map((company) => (
                <div key={company.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-xl font-semibold text-slate-900 dark:text-white mb-1">
                        {company.name}
                      </h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Alias: {company.alias}
                      </p>
                    </div>
                    {company.isActive ? (
                      <Badge label="Ativa" className="bg-success-500" />
                    ) : (
                      <Badge label="Inativa" className="bg-secondary-500" />
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary-500">
                        {company.userCount}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        Usuários
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-info-500">
                        {company.transactionCount.toLocaleString()}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        Transações
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <h5 className="font-medium text-slate-900 dark:text-white mb-2">
                      Limites de Rate
                    </h5>
                    <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                      <p>Por minuto: {company.rateLimit.requestsPerMinute.toLocaleString()}</p>
                      <p>Por hora: {company.rateLimit.requestsPerHour.toLocaleString()}</p>
                      <p>Por dia: {company.rateLimit.requestsPerDay.toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <div className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                    Criada em: {new Date(company.createdAt).toLocaleDateString()}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      text="Editar"
                      icon="heroicons-outline:pencil"
                      className="btn-sm btn-secondary flex-1"
                      onClick={() => alert("Funcionalidade em desenvolvimento")}
                    />
                    <Button
                      text="Ver Detalhes"
                      icon="heroicons-outline:eye"
                      className="btn-sm btn-primary flex-1"
                      onClick={() => alert("Funcionalidade em desenvolvimento")}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default SystemCompaniesPage;