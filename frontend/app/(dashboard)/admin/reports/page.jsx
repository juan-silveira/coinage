"use client";

import { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Textinput from "@/components/ui/Textinput";
import Select from "react-select";
import Modal from "@/components/ui/Modal";
import usePermissions from "@/hooks/usePermissions";
import { useRouter } from "next/navigation";
import { useAlertContext } from '@/contexts/AlertContext';
import { 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  FileText, 
  BarChart3, 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Eye,
  Trash2,
  Plus
} from 'lucide-react';

const CompanyReportsPage = () => {
  const { showSuccess, showError, showInfo, showWarning } = useAlertContext();
  const router = useRouter();
  const permissions = usePermissions();
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  
  // Filtros
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    status: '',
    dateFrom: '',
    dateTo: ''
  });

  // Estatísticas
  const [stats, setStats] = useState({
    total: 0,
    ready: 0,
    generating: 0,
    failed: 0
  });

  // Dados para gerar novo relatório
  const [newReportData, setNewReportData] = useState({
    type: 'transactions',
    title: '',
    description: '',
    period: 'last-30-days',
    customDateFrom: '',
    customDateTo: '',
    includeCharts: true,
    format: 'pdf'
  });

  useEffect(() => {
    if (!permissions.canViewCompanySettings) {
      router.push("/dashboard");
      return;
    }
    
    loadReports();
  }, [permissions, router]);

  const loadReports = async () => {
    try {
      setLoading(true);
      // Mock data - substituir por API real
      const mockReports = [
        {
          id: 1,
          title: "Relatório de Transações - Janeiro 2025",
          description: "Relatório completo de todas as transações realizadas no mês",
          type: "transactions",
          period: "2025-01",
          format: "pdf",
          fileSize: "2.4 MB",
          generatedAt: "2025-01-18T10:30:00Z",
          createdAt: "2025-01-18T10:25:00Z",
          status: "ready",
          downloadUrl: "/reports/transactions-2025-01.pdf",
          generatedBy: {
            name: "Ivan Alberton",
            email: "ivan.alberton@navi.inf.br"
          },
          totalRecords: 15678,
          totalVolume: 2500000.00
        },
        {
          id: 2,
          title: "Relatório de Usuários Ativos",
          description: "Lista de usuários com atividade nos últimos 30 dias",
          type: "users",
          period: "last-30-days",
          format: "csv",
          fileSize: null,
          generatedAt: null,
          createdAt: "2025-01-18T09:15:00Z",
          status: "generating",
          downloadUrl: null,
          generatedBy: {
            name: "Maria Silva",
            email: "maria@empresa.com"
          },
          totalRecords: null,
          progress: 65
        },
        {
          id: 3,
          title: "Relatório Financeiro - Dezembro 2024",
          description: "Balanço financeiro e estatísticas do mês",
          type: "financial",
          period: "2024-12",
          format: "pdf",
          fileSize: "1.8 MB",
          generatedAt: "2025-01-02T14:20:00Z",
          createdAt: "2025-01-02T14:15:00Z",
          status: "ready",
          downloadUrl: "/reports/financial-2024-12.pdf",
          generatedBy: {
            name: "Carlos Admin",
            email: "carlos@empresa.com"
          },
          totalRecords: 2345,
          totalVolume: 5600000.00
        },
        {
          id: 4,
          title: "Relatório de Segurança",
          description: "Análise de atividades suspeitas e logins",
          type: "security",
          period: "last-7-days",
          format: "xlsx",
          fileSize: null,
          generatedAt: null,
          createdAt: "2025-01-17T16:45:00Z",
          status: "failed",
          downloadUrl: null,
          generatedBy: {
            name: "Sistema",
            email: "sistema@empresa.com"
          },
          errorMessage: "Erro ao conectar com o banco de dados"
        }
      ];
      
      setReports(mockReports);
      
      // Calcular estatísticas
      const newStats = {
        total: mockReports.length,
        ready: mockReports.filter(r => r.status === 'ready').length,
        generating: mockReports.filter(r => r.status === 'generating').length,
        failed: mockReports.filter(r => r.status === 'failed').length
      };
      setStats(newStats);
      
    } catch (error) {
      console.error("Error loading reports:", error);
      showError("Erro ao carregar relatórios");
    } finally {
      setLoading(false);
    }
  };

  // Aplicar filtros
  useEffect(() => {
    applyFilters();
  }, [reports, filters]);

  const applyFilters = () => {
    let filtered = [...reports];

    // Filtro de busca
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(report => 
        report.title.toLowerCase().includes(search) ||
        report.description.toLowerCase().includes(search) ||
        report.type.toLowerCase().includes(search)
      );
    }

    // Filtro de tipo
    if (filters.type) {
      filtered = filtered.filter(report => report.type === filters.type);
    }

    // Filtro de status
    if (filters.status) {
      filtered = filtered.filter(report => report.status === filters.status);
    }

    // Filtro de data
    if (filters.dateFrom) {
      filtered = filtered.filter(report => 
        new Date(report.createdAt) >= new Date(filters.dateFrom)
      );
    }

    if (filters.dateTo) {
      filtered = filtered.filter(report => 
        new Date(report.createdAt) <= new Date(filters.dateTo)
      );
    }

    setFilteredReports(filtered);
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
      type: '',
      status: '',
      dateFrom: '',
      dateTo: ''
    });
  };

  const generateReport = async () => {
    try {
      setGenerating(true);
      // TODO: Implement API call to generate report
      console.log("Generating report:", newReportData);
      showSuccess("Relatório sendo gerado. Você será notificado quando estiver pronto.");
      setShowGenerateModal(false);
      setNewReportData({
        type: 'transactions',
        title: '',
        description: '',
        period: 'last-30-days',
        customDateFrom: '',
        customDateTo: '',
        includeCharts: true,
        format: 'pdf'
      });
      loadReports(); // Recarregar lista
    } catch (error) {
      console.error("Error generating report:", error);
      showError("Erro ao gerar relatório");
    } finally {
      setGenerating(false);
    }
  };

  const deleteReport = async (reportId) => {
    try {
      // TODO: Implement API call
      setReports(reports.filter(r => r.id !== reportId));
      showSuccess("Relatório excluído com sucesso!");
    } catch (error) {
      console.error("Error deleting report:", error);
      showError("Erro ao excluir relatório");
    }
  };

  const downloadReport = (report) => {
    if (report.status !== "ready" || !report.downloadUrl) {
      showWarning("Relatório não está disponível para download");
      return;
    }
    
    // TODO: Implement actual download
    const link = document.createElement('a');
    link.href = report.downloadUrl;
    link.download = `${report.title.replace(/\s+/g, '-').toLowerCase()}.${report.format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showSuccess("Download iniciado!");
  };

  const exportReports = () => {
    const csvData = filteredReports.map(report => ({
      Título: report.title,
      Tipo: report.type,
      Status: report.status,
      Formato: report.format,
      'Tamanho do Arquivo': report.fileSize || 'N/A',
      'Data de Criação': new Date(report.createdAt).toLocaleString('pt-BR'),
      'Data de Geração': report.generatedAt ? new Date(report.generatedAt).toLocaleString('pt-BR') : 'N/A',
      'Gerado por': report.generatedBy.name,
      'Total de Registros': report.totalRecords || 'N/A',
      'Volume Total': report.totalVolume ? `R$ ${report.totalVolume.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'N/A'
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorios-empresa-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "ready":
        return <Badge label="Pronto" className="bg-green-500 text-white" />;
      case "generating":
        return <Badge label="Gerando..." className="bg-yellow-500 text-white" />;
      case "failed":
        return <Badge label="Erro" className="bg-red-500 text-white" />;
      default:
        return <Badge label="Pendente" className="bg-gray-500 text-white" />;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "ready": return <CheckCircle className="text-green-600" size={16} />;
      case "generating": return <Clock className="text-yellow-600" size={16} />;
      case "failed": return <XCircle className="text-red-600" size={16} />;
      default: return <AlertTriangle className="text-gray-600" size={16} />;
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "transactions": return <BarChart3 className="text-blue-600" size={16} />;
      case "users": return <FileText className="text-green-600" size={16} />;
      case "financial": return <BarChart3 className="text-purple-600" size={16} />;
      case "security": return <AlertTriangle className="text-red-600" size={16} />;
      default: return <FileText className="text-gray-600" size={16} />;
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case "transactions": return "Transações";
      case "users": return "Usuários";
      case "financial": return "Financeiro";
      case "security": return "Segurança";
      default: return type;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "ready": return "Pronto";
      case "generating": return "Gerando";
      case "failed": return "Falhou";
      default: return status;
    }
  };

  // Opções para filtros
  const typeOptions = [
    { value: '', label: 'Todos os Tipos' },
    { value: 'transactions', label: 'Transações' },
    { value: 'users', label: 'Usuários' },
    { value: 'financial', label: 'Financeiro' },
    { value: 'security', label: 'Segurança' }
  ];

  const statusOptions = [
    { value: '', label: 'Todos os Status' },
    { value: 'ready', label: 'Pronto' },
    { value: 'generating', label: 'Gerando' },
    { value: 'failed', label: 'Falhou' }
  ];

  const itemsPerPageOptions = [
    { value: 10, label: "10 por página" },
    { value: 20, label: "20 por página" },
    { value: 50, label: "50 por página" },
    { value: 100, label: "100 por página" }
  ];

  const reportTypeOptions = [
    { value: 'transactions', label: 'Transações' },
    { value: 'users', label: 'Usuários' },
    { value: 'financial', label: 'Financeiro' },
    { value: 'security', label: 'Segurança' }
  ];

  const periodOptions = [
    { value: 'today', label: 'Hoje' },
    { value: 'last-7-days', label: 'Últimos 7 dias' },
    { value: 'last-30-days', label: 'Últimos 30 dias' },
    { value: 'last-90-days', label: 'Últimos 90 dias' },
    { value: 'current-month', label: 'Mês atual' },
    { value: 'last-month', label: 'Mês passado' },
    { value: 'current-year', label: 'Ano atual' },
    { value: 'custom', label: 'Personalizado' }
  ];

  const formatOptions = [
    { value: 'pdf', label: 'PDF' },
    { value: 'csv', label: 'CSV' },
    { value: 'xlsx', label: 'Excel (XLSX)' }
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

  // Pagination
  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
  const currentReports = filteredReports.slice(
    (currentPage - 1) * itemsPerPage, 
    currentPage * itemsPerPage
  );

  const goToPage = (page) => setCurrentPage(page);
  const goToPreviousPage = () => setCurrentPage(Math.max(1, currentPage - 1));
  const goToNextPage = () => setCurrentPage(Math.min(totalPages, currentPage + 1));
  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);

  const handleItemsPerPageChange = (option) => {
    setItemsPerPage(option.value);
    setCurrentPage(1);
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
            Relatórios da Empresa
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Gere e baixe relatórios detalhados sobre a atividade da empresa
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            onClick={exportReports}
            variant="outline"
            className="btn-outline-brand"
          >
            <Download size={16} className="mr-2" />
            Exportar CSV
          </Button>
          <Button
            onClick={() => setShowGenerateModal(true)}
            className="btn-brand"
          >
            <Plus size={16} className="mr-2" />
            Novo Relatório
          </Button>
          <Button
            onClick={loadReports}
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
                <FileText className="text-blue-600" size={20} />
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
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="text-green-600" size={20} />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">Prontos</p>
                <p className="text-xl font-bold">{stats.ready}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="text-yellow-600" size={20} />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">Gerando</p>
                <p className="text-xl font-bold">{stats.generating}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="text-red-600" size={20} />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">Falharam</p>
                <p className="text-xl font-bold">{stats.failed}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 items-end">
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Buscar
            </label>
            <div className="relative">
              <Textinput
                placeholder="Título, descrição ou tipo..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
              <Search size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Tipo
            </label>
            <Select
              className="react-select"
              classNamePrefix="select"
              options={typeOptions}
              value={typeOptions.find(option => option.value === filters.type)}
              onChange={(option) => handleFilterChange('type', option?.value || '')}
              placeholder="Tipo"
              styles={selectStyles}
              isClearable
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Status
            </label>
            <Select
              className="react-select"
              classNamePrefix="select"
              options={statusOptions}
              value={statusOptions.find(option => option.value === filters.status)}
              onChange={(option) => handleFilterChange('status', option?.value || '')}
              placeholder="Status"
              styles={selectStyles}
              isClearable
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Data Início
            </label>
            <Textinput
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            />
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-2">
                Data Fim
              </label>
              <Textinput
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              />
            </div>
            <div className="pt-7">
              <Button
                onClick={clearFilters}
                variant="outline"
                className="btn-outline-secondary"
              >
                Limpar
              </Button>
            </div>
          </div>
        </div>

        {/* Resumo dos filtros */}
        {(filters.search || filters.type || filters.status || filters.dateFrom || filters.dateTo) && (
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-slate-600 dark:text-slate-400">Filtros ativos:</span>
              {filters.search && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-500/20 dark:text-primary-300">
                  Busca: {filters.search}
                </span>
              )}
              {filters.type && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-500/20 dark:text-primary-300">
                  Tipo: {typeOptions.find(o => o.value === filters.type)?.label}
                </span>
              )}
              {filters.status && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-500/20 dark:text-primary-300">
                  Status: {statusOptions.find(o => o.value === filters.status)?.label}
                </span>
              )}
              {(filters.dateFrom || filters.dateTo) && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-500/20 dark:text-primary-300">
                  Período: {filters.dateFrom || '...'} a {filters.dateTo || '...'}
                </span>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Lista de Relatórios */}
      <Card>
        <div className="space-y-4">
          {/* Cabeçalho da tabela com contador */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Relatórios ({loading ? '...' : filteredReports.length})
            </h3>
            <div className="flex items-center space-x-2">
              <Select
                className="react-select"
                classNamePrefix="select"
                options={itemsPerPageOptions}
                value={itemsPerPageOptions.find(option => option.value === itemsPerPage)}
                onChange={handleItemsPerPageChange}
                styles={selectStyles}
              />
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
              <span className="ml-2 text-slate-600 dark:text-slate-400">Carregando relatórios...</span>
            </div>
          )}

          {/* Tabela responsiva */}
          {!loading && (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-slate-50 dark:bg-slate-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Relatório
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Detalhes
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Criado por
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-700">
                  {currentReports.length > 0 ? (
                    currentReports.map((report) => (
                      <tr
                        key={report.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors duration-150"
                      >
                        {/* Relatório */}
                        <td className="px-4 py-3">
                          <div className="flex items-start space-x-3">
                            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                              {getTypeIcon(report.type)}
                            </div>
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-slate-900 dark:text-white">
                                {report.title}
                              </h4>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                {report.description}
                              </p>
                            </div>
                          </div>
                        </td>
                        
                        {/* Tipo */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            {getTypeIcon(report.type)}
                            <span className="text-sm text-slate-700 dark:text-slate-300">
                              {getTypeLabel(report.type)}
                            </span>
                          </div>
                        </td>
                        
                        {/* Status */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(report.status)}
                            {getStatusBadge(report.status)}
                            {report.status === 'generating' && report.progress && (
                              <span className="text-xs text-slate-500">({report.progress}%)</span>
                            )}
                          </div>
                          {report.status === 'failed' && report.errorMessage && (
                            <p className="text-xs text-red-600 mt-1">{report.errorMessage}</p>
                          )}
                        </td>
                        
                        {/* Detalhes */}
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <div className="space-y-1">
                            <div className="text-slate-900 dark:text-white">
                              Formato: {report.format?.toUpperCase()}
                            </div>
                            {report.fileSize && (
                              <div className="text-slate-500 dark:text-slate-400">
                                Tamanho: {report.fileSize}
                              </div>
                            )}
                            {report.totalRecords && (
                              <div className="text-slate-500 dark:text-slate-400">
                                {report.totalRecords.toLocaleString()} registros
                              </div>
                            )}
                            {report.totalVolume && (
                              <div className="text-green-600 font-medium">
                                R$ {report.totalVolume.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                              </div>
                            )}
                          </div>
                        </td>
                        
                        {/* Criado por */}
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                          <div>
                            <div className="font-medium">{report.generatedBy.name}</div>
                            <div className="text-xs">{new Date(report.createdAt).toLocaleDateString('pt-BR')}</div>
                            {report.generatedAt && (
                              <div className="text-xs">Pronto: {new Date(report.generatedAt).toLocaleDateString('pt-BR')}</div>
                            )}
                          </div>
                        </td>
                        
                        {/* Ações */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedReport(report);
                                setShowReportModal(true);
                              }}
                              variant="outline"
                            >
                              <Eye size={14} className="mr-1" />
                              Ver
                            </Button>
                            
                            <Button
                              size="sm"
                              onClick={() => downloadReport(report)}
                              disabled={report.status !== 'ready'}
                              className={report.status === 'ready' ? 'btn-brand' : 'btn-outline-secondary'}
                            >
                              <Download size={14} className="mr-1" />
                              Download
                            </Button>
                            
                            {permissions.canManageRoles && (
                              <Button
                                size="sm"
                                onClick={() => deleteReport(report.id)}
                                variant="outline"
                                className="text-red-600 hover:bg-red-50"
                              >
                                <Trash2 size={14} />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                        <div className="flex flex-col items-center">
                          <FileText className="w-12 h-12 mb-2 opacity-50" />
                          <span className="font-medium">Nenhum relatório encontrado</span>
                          <span className="text-sm">Clique em "Novo Relatório" para gerar um relatório</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && filteredReports.length > itemsPerPage && (
            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
                <div className="text-sm text-slate-500 dark:text-slate-400 text-center md:text-left">
                  Exibindo {((currentPage - 1) * itemsPerPage) + 1} ao {Math.min(currentPage * itemsPerPage, filteredReports.length)} de {filteredReports.length} registros
                </div>
                <div className="flex items-center justify-center space-x-1">
                  <button
                    onClick={goToFirstPage}
                    disabled={currentPage === 1}
                    className="px-2 py-1 rounded text-slate-500 hover:text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    «
                  </button>
                  <button
                    onClick={goToPreviousPage}
                    disabled={currentPage === 1}
                    className="px-2 py-1 rounded text-slate-500 hover:text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ‹
                  </button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
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
                  ))}
                  
                  <button
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                    className="px-2 py-1 rounded text-slate-500 hover:text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ›
                  </button>
                  <button
                    onClick={goToLastPage}
                    disabled={currentPage === totalPages}
                    className="px-2 py-1 rounded text-slate-500 hover:text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    »
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Modal de Gerar Relatório */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowGenerateModal(false)}></div>
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Gerar Novo Relatório
                  </h2>
                  <Button
                    onClick={() => setShowGenerateModal(false)}
                    variant="outline"
                    size="sm"
                  >
                    Fechar
                  </Button>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tipo de Relatório</label>
                      <Select
                        options={reportTypeOptions}
                        value={reportTypeOptions.find(opt => opt.value === newReportData.type)}
                        onChange={(option) => setNewReportData(prev => ({ ...prev, type: option.value }))}
                        styles={selectStyles}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Formato</label>
                      <Select
                        options={formatOptions}
                        value={formatOptions.find(opt => opt.value === newReportData.format)}
                        onChange={(option) => setNewReportData(prev => ({ ...prev, format: option.value }))}
                        styles={selectStyles}
                      />
                    </div>
                  </div>
                  
                  <Textinput
                    label="Título"
                    value={newReportData.title}
                    onChange={(e) => setNewReportData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Ex: Relatório de Transações - Janeiro 2025"
                    required
                  />
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Descrição</label>
                    <textarea
                      value={newReportData.description}
                      onChange={(e) => setNewReportData(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className="form-control w-full"
                      placeholder="Descrição detalhada do relatório..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Período</label>
                    <Select
                      options={periodOptions}
                      value={periodOptions.find(opt => opt.value === newReportData.period)}
                      onChange={(option) => setNewReportData(prev => ({ ...prev, period: option.value }))}
                      styles={selectStyles}
                    />
                  </div>
                  
                  {newReportData.period === 'custom' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Textinput
                        label="Data Início"
                        type="date"
                        value={newReportData.customDateFrom}
                        onChange={(e) => setNewReportData(prev => ({ ...prev, customDateFrom: e.target.value }))}
                        required
                      />
                      
                      <Textinput
                        label="Data Fim"
                        type="date"
                        value={newReportData.customDateTo}
                        onChange={(e) => setNewReportData(prev => ({ ...prev, customDateTo: e.target.value }))}
                        required
                      />
                    </div>
                  )}
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="includeCharts"
                      checked={newReportData.includeCharts}
                      onChange={(e) => setNewReportData(prev => ({ ...prev, includeCharts: e.target.checked }))}
                      className="mr-2"
                    />
                    <label htmlFor="includeCharts" className="text-sm text-gray-700 dark:text-gray-300">
                      Incluir gráficos e visualizações
                    </label>
                  </div>
                  
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      onClick={() => setShowGenerateModal(false)}
                      variant="outline"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={generateReport}
                      className="btn-brand"
                      isLoading={generating}
                    >
                      <Plus size={16} className="mr-2" />
                      Gerar Relatório
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalhes do Relatório */}
      {selectedReport && (
        <div className={`fixed inset-0 z-50 ${showReportModal ? 'block' : 'hidden'}`}>
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowReportModal(false)}></div>
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Detalhes do Relatório
                  </h2>
                  <Button
                    onClick={() => setShowReportModal(false)}
                    variant="outline"
                    size="sm"
                  >
                    Fechar
                  </Button>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Título</label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedReport.title}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tipo</label>
                      <div className="flex items-center mt-1">
                        {getTypeIcon(selectedReport.type)}
                        <span className="ml-2 text-sm text-gray-900 dark:text-white">
                          {getTypeLabel(selectedReport.type)}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                      <div className="flex items-center mt-1">
                        {getStatusIcon(selectedReport.status)}
                        <span className="ml-2 text-sm text-gray-900 dark:text-white">
                          {getStatusLabel(selectedReport.status)}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Formato</label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedReport.format?.toUpperCase()}</p>
                    </div>
                    {selectedReport.fileSize && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tamanho do Arquivo</label>
                        <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedReport.fileSize}</p>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Período</label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedReport.period}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Criado em</label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">
                        {new Date(selectedReport.createdAt).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    {selectedReport.generatedAt && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Gerado em</label>
                        <p className="mt-1 text-sm text-gray-900 dark:text-white">
                          {new Date(selectedReport.generatedAt).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Gerado por</label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">
                        {selectedReport.generatedBy.name} ({selectedReport.generatedBy.email})
                      </p>
                    </div>
                    {selectedReport.totalRecords && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Total de Registros</label>
                        <p className="mt-1 text-sm text-gray-900 dark:text-white">
                          {selectedReport.totalRecords.toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descrição</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedReport.description}</p>
                  </div>
                  
                  {selectedReport.totalVolume && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Volume Total</label>
                      <p className="mt-1 text-sm text-green-600 font-medium">
                        R$ {selectedReport.totalVolume.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  )}
                  
                  {selectedReport.errorMessage && (
                    <div>
                      <label className="block text-sm font-medium text-red-700">Mensagem de Erro</label>
                      <p className="mt-1 text-sm text-red-600">{selectedReport.errorMessage}</p>
                    </div>
                  )}
                  
                  {selectedReport.status === 'generating' && selectedReport.progress && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Progresso</label>
                      <div className="mt-1">
                        <div className="bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${selectedReport.progress}%` }}
                          ></div>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{selectedReport.progress}% concluído</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyReportsPage;