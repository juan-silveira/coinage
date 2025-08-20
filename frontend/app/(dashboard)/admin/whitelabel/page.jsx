"use client";

import { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import Textinput from "@/components/ui/Textinput";
import Button from "@/components/ui/Button";
import Select from "react-select";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import usePermissions from "@/hooks/usePermissions";
import { useRouter } from "next/navigation";
import { useAlertContext } from '@/contexts/AlertContext';
import { 
  Search, 
  Download, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight, 
  Edit, 
  Save,
  Globe,
  Palette,
  Settings,
  X,
  Upload,
  Eye,
  Monitor,
  Smartphone,
  Image,
  Link,
  Type
} from 'lucide-react';

const WhitelabelManagementPage = () => {
  const router = useRouter();
  const permissions = usePermissions();
  const { showSuccess, showError } = useAlertContext();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [companies, setCompanies] = useState([]);
  const [filteredCompanies, setFilteredCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [showBrandingModal, setShowBrandingModal] = useState(false);
  
  // Filtros
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    hasCustomBranding: ''
  });

  // Estatísticas
  const [stats, setStats] = useState({
    total: 0,
    withCustomBranding: 0,
    defaultBranding: 0,
    active: 0
  });
  
  const [brandingData, setBrandingData] = useState({
    companyId: null,
    companyName: "",
    primaryColor: "#10B981",
    secondaryColor: "#059669",
    backgroundColor: "#FFFFFF",
    textColor: "#111827",
    logoUrl: "/assets/images/companies/coinage.png",
    logoUrlDark: "/assets/images/companies/coinage.png",
    faviconUrl: "/assets/images/companies/coinage-favicon.ico",
    loginTitle: "Bem-vindo à Coinage",
    loginSubtitle: "Plataforma líder em criptomoedas",
    welcomeMessage: "Bem-vindo à Coinage! A plataforma mais confiável para suas operações com criptomoedas.",
    footerText: "© 2025 Coinage. Todos os direitos reservados.",
    supportUrl: "https://support.coinage.com",
    privacyPolicyUrl: "https://coinage.com/privacy",
    termsOfServiceUrl: "https://coinage.com/terms",
    contactEmail: "support@coinage.com"
  });

  // Opções para filtros
  const statusOptions = [
    { value: '', label: 'Todos os Status' },
    { value: 'active', label: 'Ativo' },
    { value: 'inactive', label: 'Inativo' },
    { value: 'pending', label: 'Pendente' }
  ];

  const brandingOptions = [
    { value: '', label: 'Todas' },
    { value: 'true', label: 'Personalizada' },
    { value: 'false', label: 'Padrão' }
  ];

  const itemsPerPageOptions = [
    { value: 10, label: '10 por página' },
    { value: 20, label: '20 por página' },
    { value: 50, label: '50 por página' },
    { value: 100, label: '100 por página' }
  ];

  // Estilos para react-select
  const selectStyles = {
    option: (provided, state) => ({
      ...provided,
      fontSize: "14px",
    }),
    control: (provided) => ({
      ...provided,
      minHeight: "38px",
      fontSize: "14px",
    }),
  };

  useEffect(() => {
    if (!permissions.canViewCompanySettings) {
      router.push("/dashboard");
      return;
    }
    
    loadCompanies();
  }, [permissions, router]);

  // Aplicar filtros quando filters mudarem
  useEffect(() => {
    applyFilters();
  }, [companies, filters]);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      // Mock data - substituir por API real
      const mockCompanies = [
        {
          id: 1,
          name: "Coinage",
          alias: "coinage",
          status: "active",
          hasCustomBranding: true,
          users: 1250,
          transactions: 8930,
          volume: 2500000,
          createdAt: "2024-01-15T10:30:00Z",
          lastActivity: "2025-01-18T14:22:00Z",
          branding: {
            primaryColor: "#10B981",
            secondaryColor: "#059669",
            logoUrl: "/assets/images/companies/coinage.png",
            loginTitle: "Bem-vindo à Coinage"
          }
        },
        {
          id: 2,
          name: "TechCorp Solutions",
          alias: "techcorp",
          status: "active",
          hasCustomBranding: false,
          users: 450,
          transactions: 2100,
          volume: 890000,
          createdAt: "2024-03-10T14:22:00Z",
          lastActivity: "2025-01-17T16:45:00Z",
          branding: null
        },
        {
          id: 3,
          name: "StartupXYZ",
          alias: "startupxyz",
          status: "inactive",
          hasCustomBranding: true,
          users: 89,
          transactions: 456,
          volume: 125000,
          createdAt: "2024-05-22T09:15:00Z",
          lastActivity: "2024-12-20T11:30:00Z",
          branding: {
            primaryColor: "#3B82F6",
            secondaryColor: "#1D4ED8",
            logoUrl: "/assets/images/companies/startupxyz.png",
            loginTitle: "StartupXYZ Platform"
          }
        }
      ];
      
      setCompanies(mockCompanies);
      
      // Calcular estatísticas
      const newStats = {
        total: mockCompanies.length,
        withCustomBranding: mockCompanies.filter(c => c.hasCustomBranding).length,
        defaultBranding: mockCompanies.filter(c => !c.hasCustomBranding).length,
        active: mockCompanies.filter(c => c.status === 'active').length
      };
      setStats(newStats);
      
    } catch (error) {
      console.error("Error loading companies:", error);
      showError("Erro ao carregar empresas");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...companies];

    // Filtro de busca
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(company => 
        company.name.toLowerCase().includes(search) ||
        company.alias.toLowerCase().includes(search)
      );
    }

    // Filtro de status
    if (filters.status) {
      filtered = filtered.filter(company => company.status === filters.status);
    }

    // Filtro de personalização
    if (filters.hasCustomBranding) {
      const hasCustom = filters.hasCustomBranding === 'true';
      filtered = filtered.filter(company => company.hasCustomBranding === hasCustom);
    }

    setFilteredCompanies(filtered);
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: '',
      hasCustomBranding: ''
    });
  };

  const handleItemsPerPageChange = (option) => {
    setItemsPerPage(option.value);
    setCurrentPage(1);
  };

  const openBrandingModal = (company) => {
    setSelectedCompany(company);
    setBrandingData({
      companyId: company.id,
      companyName: company.name,
      primaryColor: company.branding?.primaryColor || "#10B981",
      secondaryColor: company.branding?.secondaryColor || "#059669",
      backgroundColor: company.branding?.backgroundColor || "#FFFFFF",
      textColor: company.branding?.textColor || "#111827",
      logoUrl: company.branding?.logoUrl || "/assets/images/companies/default.png",
      logoUrlDark: company.branding?.logoUrlDark || "/assets/images/companies/default.png",
      faviconUrl: company.branding?.faviconUrl || "/assets/images/companies/default-favicon.ico",
      loginTitle: company.branding?.loginTitle || `Bem-vindo à ${company.name}`,
      loginSubtitle: company.branding?.loginSubtitle || "Plataforma de criptomoedas",
      welcomeMessage: company.branding?.welcomeMessage || `Bem-vindo à ${company.name}! Sua plataforma confiável para operações com criptomoedas.`,
      footerText: company.branding?.footerText || `© 2025 ${company.name}. Todos os direitos reservados.`,
      supportUrl: company.branding?.supportUrl || `https://support.${company.alias}.com`,
      privacyPolicyUrl: company.branding?.privacyPolicyUrl || `https://${company.alias}.com/privacy`,
      termsOfServiceUrl: company.branding?.termsOfServiceUrl || `https://${company.alias}.com/terms`,
      contactEmail: company.branding?.contactEmail || `support@${company.alias}.com`
    });
    setShowBrandingModal(true);
  };

  const exportCompanies = () => {
    const csvData = filteredCompanies.map(company => ({
      'Nome': company.name,
      'Alias': company.alias,
      'Status': getStatusLabel(company.status),
      'Personalização': company.hasCustomBranding ? 'Personalizada' : 'Padrão',
      'Usuários': company.users,
      'Transações': company.transactions,
      'Volume (BRL)': `R$ ${company.volume.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      'Data Criação': new Date(company.createdAt).toLocaleString('pt-BR'),
      'Última Atividade': new Date(company.lastActivity).toLocaleString('pt-BR')
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `empresas-whitelabel-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Pagination
  const totalPages = Math.ceil(filteredCompanies.length / itemsPerPage);
  const currentCompanies = filteredCompanies.slice(
    (currentPage - 1) * itemsPerPage, 
    currentPage * itemsPerPage
  );

  const goToPage = (page) => setCurrentPage(page);
  const goToPreviousPage = () => setCurrentPage(Math.max(1, currentPage - 1));
  const goToNextPage = () => setCurrentPage(Math.min(totalPages, currentPage + 1));

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case "active": return "bg-green-500";
      case "inactive": return "bg-gray-500";
      case "pending": return "bg-yellow-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "active": return "Ativo";
      case "inactive": return "Inativo";
      case "pending": return "Pendente";
      default: return status;
    }
  };

  const handleInputChange = (field, value) => {
    setBrandingData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      // TODO: Implement API call to save branding data
      console.log("Saving branding data:", brandingData);
      showSuccess("Configurações salvas com sucesso!");
      setShowBrandingModal(false);
      loadCompanies(); // Recarregar dados
    } catch (error) {
      console.error("Error saving branding data:", error);
      showError("Erro ao salvar configurações");
    } finally {
      setSaving(false);
    }
  };

  if (!permissions.canViewCompanySettings) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Gestão do Whitelabel
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Configure a identidade visual e textos das empresas na plataforma
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            onClick={exportCompanies}
            variant="outline"
            className="btn-outline-brand"
          >
            <Download size={16} className="mr-2" />
            Exportar CSV
          </Button>
          <Button
            onClick={loadCompanies}
            variant="outline"
            isLoading={loading}
          >
            <RefreshCw size={16} className="mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Globe className="text-blue-600" size={20} />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                <p className="text-xl font-bold">{stats.total}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Palette className="text-purple-600" size={20} />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">Personalizadas</p>
                <p className="text-xl font-bold">{stats.withCustomBranding}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Settings className="text-gray-600" size={20} />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">Padrão</p>
                <p className="text-xl font-bold">{stats.defaultBranding}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Globe className="text-green-600" size={20} />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">Ativas</p>
                <p className="text-xl font-bold">{stats.active}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 items-end">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Buscar
            </label>
            <div className="relative">
              <Textinput
                placeholder="Nome ou alias da empresa"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
              <Search size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Status
            </label>
            <Select
              className="react-select"
              classNamePrefix="select"
              placeholder="Filtrar por status"
              options={statusOptions}
              value={statusOptions.find(option => option.value === filters.status)}
              onChange={(option) => handleFilterChange('status', option?.value || '')}
              styles={selectStyles}
              isClearable
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Personalização
            </label>
            <Select
              className="react-select"
              classNamePrefix="select"
              placeholder="Filtrar por branding"
              options={brandingOptions}
              value={brandingOptions.find(option => option.value === filters.hasCustomBranding)}
              onChange={(option) => handleFilterChange('hasCustomBranding', option?.value || '')}
              styles={selectStyles}
              isClearable
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Itens por página
            </label>
            <Select
              className="react-select"
              classNamePrefix="select"
              options={itemsPerPageOptions}
              value={itemsPerPageOptions.find(option => option.value === itemsPerPage)}
              onChange={handleItemsPerPageChange}
              styles={selectStyles}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Button
              onClick={clearFilters}
              variant="outline"
              size="sm"
            >
              Limpar
            </Button>
          </div>
        </div>

        {/* Resumo dos filtros */}
        {(filters.search || filters.status || filters.hasCustomBranding) && (
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-slate-600 dark:text-slate-400">Filtros ativos:</span>
              {filters.search && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-500/20 dark:text-primary-300">
                  Busca: {filters.search}
                </span>
              )}
              {filters.status && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-500/20 dark:text-primary-300">
                  Status: {statusOptions.find(o => o.value === filters.status)?.label}
                </span>
              )}
              {filters.hasCustomBranding && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-500/20 dark:text-primary-300">
                  Branding: {brandingOptions.find(o => o.value === filters.hasCustomBranding)?.label}
                </span>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Lista de Empresas */}
      <Card>
        <div className="space-y-4">
          {/* Cabeçalho da tabela com contador */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Empresas ({loading ? '...' : filteredCompanies.length})
            </h3>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
              <span className="ml-2 text-slate-600 dark:text-slate-400">Carregando empresas...</span>
            </div>
          )}

          {/* Tabela responsiva */}
          {!loading && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                <thead className="bg-slate-50 dark:bg-slate-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Empresa
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Personalização
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Estatísticas
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Atividade
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-700">
                  {currentCompanies.length > 0 ? (
                    currentCompanies.map((company) => (
                      <tr
                        key={company.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors duration-150"
                      >
                        {/* Empresa */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <div className="relative">
                              <div 
                                className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                                style={{ backgroundColor: company.branding?.primaryColor || '#6B7280' }}
                              >
                                {company.branding?.logoUrl ? (
                                  <img
                                    src={company.branding.logoUrl}
                                    alt={company.name}
                                    className="w-8 h-8 rounded object-cover"
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                      e.target.nextSibling.style.display = 'flex';
                                    }}
                                  />
                                ) : null}
                                <span className="text-white font-bold text-sm">
                                  {company.name.charAt(0)}
                                </span>
                              </div>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-slate-900 dark:text-white">
                                {company.name}
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">
                                @{company.alias}
                              </div>
                            </div>
                          </div>
                        </td>
                        
                        {/* Status */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Badge
                            label={getStatusLabel(company.status)}
                            className={`${getStatusBadgeColor(company.status)} text-white`}
                          />
                        </td>
                        
                        {/* Personalização */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            {company.hasCustomBranding ? (
                              <>
                                <Palette className="w-4 h-4 text-purple-600" />
                                <span className="text-sm text-purple-600 font-medium">Personalizada</span>
                              </>
                            ) : (
                              <>
                                <Settings className="w-4 h-4 text-gray-500" />
                                <span className="text-sm text-gray-500">Padrão</span>
                              </>
                            )}
                          </div>
                        </td>
                        
                        {/* Estatísticas */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm">
                            <div className="text-slate-900 dark:text-white">{company.users.toLocaleString()} usuários</div>
                            <div className="text-slate-500 dark:text-slate-400">{company.transactions.toLocaleString()} transações</div>
                            <div className="text-green-600 font-medium">R$ {company.volume.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</div>
                          </div>
                        </td>
                        
                        {/* Atividade */}
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                          <div>
                            <div>Criado: {new Date(company.createdAt).toLocaleDateString('pt-BR')}</div>
                            <div>Ativo: {new Date(company.lastActivity).toLocaleDateString('pt-BR')}</div>
                          </div>
                        </td>
                        
                        {/* Ações */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <Button
                              onClick={() => openBrandingModal(company)}
                              size="sm"
                              className="btn-outline-brand"
                            >
                              <Edit size={14} className="mr-1" />
                              Editar
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                        <div className="flex flex-col items-center">
                          <Globe className="w-12 h-12 mb-2 opacity-50" />
                          <span className="font-medium">Nenhuma empresa encontrada</span>
                          <span className="text-sm">Tente ajustar os filtros para ver mais resultados</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && filteredCompanies.length > itemsPerPage && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                Mostrando {(currentPage - 1) * itemsPerPage + 1} a {Math.min(currentPage * itemsPerPage, filteredCompanies.length)} de {filteredCompanies.length} empresas
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className="p-2 rounded text-slate-400 hover:text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} />
                </button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + Math.max(1, currentPage - 2);
                    return page <= totalPages ? (
                      <button
                        key={page}
                        onClick={() => goToPage(page)}
                        className={`px-3 py-1 rounded text-sm transition-colors ${
                          currentPage === page
                            ? "bg-primary-500 text-white"
                            : "text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                        }`}
                      >
                        {page}
                      </button>
                    ) : null;
                  })}
                </div>
                
                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded text-slate-400 hover:text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Modal de Edição de Branding */}
      {selectedCompany && showBrandingModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm" 
            onClick={() => setShowBrandingModal(false)}
          ></div>
          <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Personalização de Branding
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {selectedCompany.name} (@{selectedCompany.alias})
                </p>
              </div>
              <Button
                onClick={() => setShowBrandingModal(false)}
                variant="ghost"
                size="sm"
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </Button>
            </div>

            <div className="p-6 space-y-8">
              {/* Cores */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center">
                  <Palette className="w-5 h-5 mr-2" />
                  Cores
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Cor Primária
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={brandingData.primaryColor}
                        onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                        className="w-12 h-10 rounded border border-slate-300 cursor-pointer"
                      />
                      <Textinput
                        value={brandingData.primaryColor}
                        onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                        placeholder="#10B981"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Cor Secundária
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={brandingData.secondaryColor}
                        onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                        className="w-12 h-10 rounded border border-slate-300 cursor-pointer"
                      />
                      <Textinput
                        value={brandingData.secondaryColor}
                        onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                        placeholder="#059669"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Textos */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center">
                  <Type className="w-5 h-5 mr-2" />
                  Textos
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Título da Tela de Login
                    </label>
                    <Textinput
                      value={brandingData.loginTitle}
                      onChange={(e) => handleInputChange('loginTitle', e.target.value)}
                      placeholder="Bem-vindo à Coinage"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Subtítulo da Tela de Login
                    </label>
                    <Textinput
                      value={brandingData.loginSubtitle}
                      onChange={(e) => handleInputChange('loginSubtitle', e.target.value)}
                      placeholder="Plataforma líder em criptomoedas"
                    />
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center">
                  <Eye className="w-5 h-5 mr-2" />
                  Preview
                </h3>
                <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-6">
                  <div 
                    className="w-full h-32 rounded-lg flex items-center justify-center border-2"
                    style={{
                      backgroundColor: brandingData.backgroundColor,
                      color: brandingData.textColor,
                      borderColor: brandingData.primaryColor
                    }}
                  >
                    <h2 
                      className="text-2xl font-bold mb-2"
                      style={{ color: brandingData.primaryColor }}
                    >
                      {brandingData.loginTitle}
                    </h2>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-6 border-t border-slate-200 dark:border-slate-700">
                <Button
                  onClick={() => setShowBrandingModal(false)}
                  variant="outline"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSave}
                  className="btn-brand"
                  isLoading={saving}
                >
                  <Save size={16} className="mr-2" />
                  Salvar Alterações
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhitelabelManagementPage;