"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useAlertContext } from '@/contexts/AlertContext';
import { 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Users,
  FileText,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import api from '@/services/api';

const AdminDocumentsPage = () => {
  const router = useRouter();
  const { showError } = useAlertContext();
  const [documents, setDocuments] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    documentType: '',
    status: 'pending'
  });
  const [pagination, setPagination] = useState({});

  // Buscar documentos e estatísticas
  useEffect(() => {
    fetchDocuments();
    fetchStats();
  }, [filters]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          params.append(key, value);
        }
      });

      const response = await api.get(`/user-documents/pending?${params.toString()}`);
      if (response.data.success) {
        setDocuments(response.data.data.documents);
        setPagination(response.data.data.pagination);
      }
    } catch (error) {
      console.error('Erro ao buscar documentos:', error);
      showError('Erro ao carregar documentos');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/user-documents/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="text-green-500" size={18} />;
      case 'pending':
        return <Clock className="text-yellow-500" size={18} />;
      case 'rejected':
        return <XCircle className="text-red-500" size={18} />;
      default:
        return <FileText className="text-gray-400" size={18} />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'approved':
        return <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Aprovado</span>;
      case 'pending':
        return <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Pendente</span>;
      case 'rejected':
        return <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Rejeitado</span>;
      default:
        return <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">Não enviado</span>;
    }
  };

  const getDocumentTypeLabel = (type) => {
    switch (type) {
      case 'front':
        return 'Frente';
      case 'back':
        return 'Verso';
      case 'selfie':
        return 'Selfie';
      default:
        return type;
    }
  };

  const handleViewDocument = (documentId) => {
    router.push(`/admin/documents/${documentId}`);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset para primeira página quando filtrar
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({
      ...prev,
      page: newPage
    }));
  };

  if (loading && documents.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Validação de Documentos
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Gerencie e valide documentos dos usuários
          </p>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="text-yellow-600" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pendentes</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.pending || 0}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="text-green-600" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Aprovados</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.approved || 0}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="text-red-600" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Rejeitados</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.rejected || 0}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="text-blue-600" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.total || 0}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <div className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-60">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos</option>
                <option value="pending">Pendentes</option>
                <option value="approved">Aprovados</option>
                <option value="rejected">Rejeitados</option>
              </select>
            </div>

            <div className="flex-1 min-w-60">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tipo de Documento
              </label>
              <select
                value={filters.documentType}
                onChange={(e) => handleFilterChange('documentType', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos</option>
                <option value="front">Frente</option>
                <option value="back">Verso</option>
                <option value="selfie">Selfie</option>
              </select>
            </div>

            <div className="flex items-end">
              <Button
                onClick={() => {
                  setFilters({ page: 1, limit: 20, documentType: '', status: 'pending' });
                }}
                className="btn btn-secondary"
              >
                <Filter size={16} />
                Limpar Filtros
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Lista de Documentos */}
      <Card>
        <div className="p-6">
          <div className="space-y-4">
            {documents.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-500">Nenhum documento encontrado</p>
              </div>
            ) : (
              documents.map((doc) => (
                <div key={doc.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        {getStatusIcon(doc.status)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {doc.user?.name || 'Usuário desconhecido'}
                          </h3>
                          <span className="text-sm text-gray-500">
                            ({doc.user?.email})
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                          <span>{getDocumentTypeLabel(doc.documentType)}</span>
                          <span>•</span>
                          {getStatusText(doc.status)}
                          <span>•</span>
                          <span>
                            {new Date(doc.uploadedAt).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        {doc.user?.userCompanies && doc.user.userCompanies.length > 0 && (
                          <p className="text-xs text-gray-400 mt-1">
                            Empresa: {doc.user.userCompanies[0].company?.name}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => handleViewDocument(doc.id)}
                        className="btn btn-primary btn-sm"
                      >
                        <Eye size={14} />
                        Visualizar
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Paginação */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-500">
                Mostrando {((pagination.page - 1) * pagination.limit) + 1} a {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} resultados
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={!pagination.hasPrev}
                  className="btn btn-secondary btn-sm"
                >
                  <ChevronLeft size={16} />
                  Anterior
                </Button>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Página {pagination.page} de {pagination.totalPages}
                </span>
                <Button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={!pagination.hasNext}
                  className="btn btn-secondary btn-sm"
                >
                  Próxima
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default AdminDocumentsPage;