"use client";

import { useState, useEffect, useRef } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import usePermissions from "@/hooks/usePermissions";
import { useRouter } from "next/navigation";
import Select from "react-select";
import { 
  Search, 
  Filter, 
  Download, 
  MoreHorizontal,
  Building2,
  Users,
  TrendingUp,
  AlertTriangle,
  Eye,
  Edit,
  Settings,
  Trash2,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Calendar
} from "lucide-react";
import { useAlertContext } from '@/contexts/AlertContext';
import { companyService } from '@/services/api';
import CompanyDetailsModal from "@/components/modals/CompanyDetailsModal";

const SystemCompaniesPage = () => {
  const { showSuccess, showError, showInfo, showWarning } = useAlertContext();
  const router = useRouter();
  const permissions = usePermissions();
  const [companies, setCompanies] = useState([]);
  const [filteredCompanies, setFilteredCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState(null);
  const [planFilter, setPlanFilter] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [showCompanyDetails, setShowCompanyDetails] = useState(false);
  const dropdownRef = useRef(null);

  const statusOptions = [
    { value: "", label: "Todos os Status" },
    { value: "active", label: "Ativas" },
    { value: "inactive", label: "Inativas" },
    { value: "suspended", label: "Suspensas" }
  ];

  const planOptions = [
    { value: "", label: "Todos os Planos" },
    { value: "starter", label: "Starter" },
    { value: "professional", label: "Professional" },
    { value: "enterprise", label: "Enterprise" },
    { value: "custom", label: "Personalizado" }
  ];

  useEffect(() => {
    if (!permissions.canViewSystemSettings) {
      router.push("/dashboard");
      return;
    }
    
    loadCompanies();
  }, [permissions, router]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    let filtered = companies;

    if (searchTerm) {
      filtered = filtered.filter(company =>
        company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.alias.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter?.value) {
      filtered = filtered.filter(company => company.status === statusFilter.value);
    }

    if (planFilter?.value) {
      filtered = filtered.filter(company => company.plan === planFilter.value);
    }

    setFilteredCompanies(filtered);
    setCurrentPage(1);
  }, [companies, searchTerm, statusFilter, planFilter]);

  const loadCompanies = async () => {
    try {
      const params = {
        page: 1,
        limit: 1000, // Carregar todas para estatísticas
      };

      const response = await companyService.getCompanies(params);
      
      if (response.success && response.data) {
        const companiesData = response.data.companies || [];
        
        // Transformar dados da API para o formato esperado
        const transformedCompanies = companiesData.map(company => ({
          id: company.id,
          name: company.name,
          alias: company.alias || company.name.toLowerCase().replace(/\s+/g, '-'),
          email: company.email || `admin@${company.name.toLowerCase().replace(/\s+/g, '')}.com`,
          status: company.isActive ? 'active' : 'inactive',
          plan: company.plan || 'starter',
          userCount: company.userCount || 0,
          transactionCount: company.transactionCount || 0,
          monthlyRevenue: company.monthlyRevenue || 0,
          createdAt: company.createdAt,
          lastActivity: company.lastActivityAt || company.updatedAt,
          country: company.country || 'Brasil',
          settings: {
            apiEnabled: company.apiEnabled || false,
            webhooksEnabled: company.webhooksEnabled || false,
            twoFactorRequired: company.twoFactorRequired || false
          }
        }));
        
        setCompanies(transformedCompanies);
      } else {
        showError("Erro ao carregar empresas");
      }
    } catch (error) {
      console.error("Error loading companies:", error);
      showError("Erro ao carregar empresas");
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyAction = (action, company) => {
    setOpenDropdown(null);
    
    switch (action) {
      case 'viewDetails':
        setSelectedCompany(company);
        setShowCompanyDetails(true);
        break;
      case 'editCompany':
        showInfo("Modal de edição de empresa em desenvolvimento");
        break;
      case 'manageSettings':
        showInfo("Configurações da empresa em desenvolvimento");
        break;
      case 'activateCompany':
        showSuccess(`Empresa ${company.name} ativada com sucesso`);
        break;
      case 'deactivateCompany':
        showWarning(`Empresa ${company.name} desativada`);
        break;
      case 'suspendCompany':
        showError(`Empresa ${company.name} suspensa`);
        break;
      case 'deleteCompany':
        if (window.confirm(`Tem certeza que deseja deletar a empresa ${company.name}?`)) {
          showError(`Empresa ${company.name} deletada`);
        }
        break;
      default:
        break;
    }
  };

  const exportData = () => {
    const csvContent = [
      ['ID', 'Nome', 'Alias', 'Email', 'Status', 'Plano', 'Usuários', 'Transações', 'Receita Mensal', 'Criado em'],
      ...filteredCompanies.map(company => [
        company.id,
        company.name,
        company.alias,
        company.email,
        company.status,
        company.plan,
        company.userCount,
        company.transactionCount,
        company.monthlyRevenue,
        new Date(company.createdAt).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'empresas.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { label: "Ativa", className: "bg-success-500" },
      inactive: { label: "Inativa", className: "bg-secondary-500" },
      suspended: { label: "Suspensa", className: "bg-danger-500" }
    };
    const config = statusConfig[status] || { label: status, className: "bg-secondary-500" };
    return <Badge label={config.label} className={config.className} />;
  };

  const getPlanBadge = (plan) => {
    const planConfig = {
      starter: { label: "Starter", className: "bg-info-500" },
      professional: { label: "Professional", className: "bg-primary-500" },
      enterprise: { label: "Enterprise", className: "bg-warning-500" },
      custom: { label: "Personalizado", className: "bg-purple-500" }
    };
    const config = planConfig[plan] || { label: plan, className: "bg-secondary-500" };
    return <Badge label={config.label} className={config.className} />;
  };

  const DropdownMenu = ({ company }) => {
    const isActive = company.status === 'active';
    const isInactive = company.status === 'inactive';
    const isSuspended = company.status === 'suspended';

    return (
      <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10 border border-gray-200 dark:border-gray-700">
        <div className="py-1">
          <button
            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            onClick={() => handleCompanyAction('viewDetails', company)}
          >
            <Eye size={14} className="mr-2" />
            Ver Detalhes
          </button>
          
          <button
            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            onClick={() => handleCompanyAction('editCompany', company)}
          >
            <Edit size={14} className="mr-2" />
            Editar Empresa
          </button>
          
          <button
            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            onClick={() => handleCompanyAction('manageSettings', company)}
          >
            <Settings size={14} className="mr-2" />
            Configurações
          </button>

          <div className="border-t border-gray-200 dark:border-gray-600 my-1"></div>

          {isInactive && (
            <button
              className="flex items-center w-full px-4 py-2 text-sm text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
              onClick={() => handleCompanyAction('activateCompany', company)}
            >
              <CheckCircle size={14} className="mr-2" />
              Ativar Empresa
            </button>
          )}

          {isActive && (
            <>
              <button
                className="flex items-center w-full px-4 py-2 text-sm text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors"
                onClick={() => handleCompanyAction('deactivateCompany', company)}
              >
                <XCircle size={14} className="mr-2" />
                Desativar Empresa
              </button>
              
              <button
                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                onClick={() => handleCompanyAction('suspendCompany', company)}
              >
                <AlertTriangle size={14} className="mr-2" />
                Suspender Empresa
              </button>
            </>
          )}

          {isSuspended && (
            <button
              className="flex items-center w-full px-4 py-2 text-sm text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
              onClick={() => handleCompanyAction('activateCompany', company)}
            >
              <CheckCircle size={14} className="mr-2" />
              Reativar Empresa
            </button>
          )}

          <div className="border-t border-gray-200 dark:border-gray-600 my-1"></div>
          
          <button
            className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            onClick={() => handleCompanyAction('deleteCompany', company)}
          >
            <Trash2 size={14} className="mr-2" />
            Deletar Empresa
          </button>
        </div>
      </div>
    );
  };

  // Cálculos das estatísticas
  const totalCompanies = companies.length;
  const activeCompanies = companies.filter(c => c.status === 'active').length;
  const totalUsers = companies.reduce((sum, c) => sum + c.userCount, 0);
  const totalRevenue = companies.reduce((sum, c) => sum + c.monthlyRevenue, 0);

  // Paginação
  const totalPages = Math.ceil(filteredCompanies.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCompanies = filteredCompanies.slice(startIndex, endIndex);

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  if (!permissions.canViewSystemSettings) {
    return null;
  }

  return (
    <div className="space-y-5">
      {/* Cartões de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-primary-100 dark:bg-primary-500/20">
              <Building2 className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Total Empresas
              </p>
              <p className="text-2xl font-semibold text-slate-900 dark:text-white">
                {totalCompanies}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-success-100 dark:bg-success-500/20">
              <CheckCircle className="h-6 w-6 text-success-600 dark:text-success-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Empresas Ativas
              </p>
              <p className="text-2xl font-semibold text-slate-900 dark:text-white">
                {activeCompanies}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-info-100 dark:bg-info-500/20">
              <Users className="h-6 w-6 text-info-600 dark:text-info-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Total Usuários
              </p>
              <p className="text-2xl font-semibold text-slate-900 dark:text-white">
                {totalUsers.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-warning-100 dark:bg-warning-500/20">
              <TrendingUp className="h-6 w-6 text-warning-600 dark:text-warning-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Receita Mensal
              </p>
              <p className="text-2xl font-semibold text-slate-900 dark:text-white">
                R$ {totalRevenue.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabela de Empresas */}
      <Card>
        <div className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Gestão de Empresas
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Gerencie todas as empresas do sistema
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                text="Nova Empresa"
                className="btn-primary"
                onClick={() => showInfo("Modal de criação de empresa em desenvolvimento")}
              />
              <Button
                icon={Download}
                className="btn-secondary"
                iconOnly
                onClick={exportData}
              />
            </div>
          </div>

          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Buscar
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar empresas..."
                  className="pl-10 w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Status
              </label>
              <Select
                options={statusOptions}
                value={statusFilter}
                onChange={setStatusFilter}
                placeholder="Filtrar por status"
                isClearable
                className="react-select-container"
                classNamePrefix="react-select"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Plano
              </label>
              <Select
                options={planOptions}
                value={planFilter}
                onChange={setPlanFilter}
                placeholder="Filtrar por plano"
                isClearable
                className="react-select-container"
                classNamePrefix="react-select"
              />
            </div>

            <div className="flex items-end">
              <Button
                icon={Filter}
                text="Limpar Filtros"
                className="btn-secondary w-full"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter(null);
                  setPlanFilter(null);
                }}
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-10">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                  <thead className="bg-slate-50 dark:bg-slate-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Empresa
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Plano
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Usuários
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Receita Mensal
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Última Atividade
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-700">
                    {currentCompanies.map((company) => (
                      <tr key={company.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-slate-900 dark:text-white">
                              {company.name}
                            </div>
                            <div className="text-sm text-slate-500 dark:text-slate-400">
                              {company.alias} • {company.email}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(company.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getPlanBadge(company.plan)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">
                          {company.userCount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">
                          R$ {company.monthlyRevenue.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                          <div className="flex items-center">
                            <Calendar size={14} className="mr-1" />
                            {new Date(company.lastActivity).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="relative" ref={dropdownRef}>
                            <button
                              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                              onClick={() => setOpenDropdown(openDropdown === company.id ? null : company.id)}
                            >
                              <MoreHorizontal size={16} />
                            </button>
                            {openDropdown === company.id && (
                              <DropdownMenu company={company} />
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginação */}
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-slate-700 dark:text-slate-300">
                  Mostrando {startIndex + 1} a {Math.min(endIndex, filteredCompanies.length)} de{" "}
                  {filteredCompanies.length} empresas
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => goToPage(1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-md border border-slate-300 dark:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <ChevronsLeft size={16} />
                  </button>
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-md border border-slate-300 dark:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="px-3 py-2 text-sm">
                    {currentPage} de {totalPages}
                  </span>
                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-md border border-slate-300 dark:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <ChevronRight size={16} />
                  </button>
                  <button
                    onClick={() => goToPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-md border border-slate-300 dark:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <ChevronsRight size={16} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Modal de Detalhes da Empresa */}
      {showCompanyDetails && selectedCompany && (
        <CompanyDetailsModal
          isOpen={showCompanyDetails}
          onClose={() => {
            setShowCompanyDetails(false);
            setSelectedCompany(null);
          }}
          company={selectedCompany}
        />
      )}
    </div>
  );
};

export default SystemCompaniesPage;