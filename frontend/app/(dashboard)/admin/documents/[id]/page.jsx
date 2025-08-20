"use client";
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useAlertContext } from '@/contexts/AlertContext';
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  Clock, 
  User,
  Calendar,
  FileText,
  Building,
  Mail,
  Download,
  Eye
} from 'lucide-react';
import api from '@/services/api';

const DocumentDetailPage = () => {
  const router = useRouter();
  const params = useParams();
  const documentId = params.id;
  const { showSuccess, showError } = useAlertContext();
  
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [documentUrl, setDocumentUrl] = useState(null);

  useEffect(() => {
    if (documentId) {
      fetchDocumentDetails();
    }
  }, [documentId]);

  const fetchDocumentDetails = async () => {
    try {
      setLoading(true);
      // Como não temos uma rota específica para buscar um documento por ID, 
      // vamos buscar todos os pendentes e filtrar pelo ID
      const response = await api.get('/user-documents/pending?limit=1000');
      if (response.data.success) {
        const foundDoc = response.data.data.documents.find(doc => doc.id === documentId);
        if (foundDoc) {
          setDocument(foundDoc);
          // Buscar URL do documento se necessário
          if (foundDoc.s3Url) {
            setDocumentUrl(foundDoc.s3Url);
          }
        } else {
          showError('Documento não encontrado');
          router.push('/admin/documents');
        }
      }
    } catch (error) {
      console.error('Erro ao buscar documento:', error);
      showError('Erro ao carregar documento');
      router.push('/admin/documents');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      setApproving(true);
      const response = await api.post(`/user-documents/admin/${documentId}/approve`);
      if (response.data.success) {
        showSuccess('Documento aprovado com sucesso!');
        router.push('/admin/documents');
      }
    } catch (error) {
      console.error('Erro ao aprovar documento:', error);
      showError(error.response?.data?.message || 'Erro ao aprovar documento');
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      showError('Motivo da rejeição é obrigatório');
      return;
    }

    try {
      setRejecting(true);
      const response = await api.post(`/user-documents/admin/${documentId}/reject`, {
        rejectionReason: rejectionReason.trim()
      });
      if (response.data.success) {
        showSuccess('Documento rejeitado');
        router.push('/admin/documents');
      }
    } catch (error) {
      console.error('Erro ao rejeitar documento:', error);
      showError(error.response?.data?.message || 'Erro ao rejeitar documento');
    } finally {
      setRejecting(false);
      setShowRejectModal(false);
      setRejectionReason('');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="text-green-500" size={24} />;
      case 'pending':
        return <Clock className="text-yellow-500" size={24} />;
      case 'rejected':
        return <XCircle className="text-red-500" size={24} />;
      default:
        return <FileText className="text-gray-400" size={24} />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'approved':
        return <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">Aprovado</span>;
      case 'pending':
        return <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">Pendente</span>;
      case 'rejected':
        return <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">Rejeitado</span>;
      default:
        return <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">Não enviado</span>;
    }
  };

  const getDocumentTypeLabel = (type) => {
    switch (type) {
      case 'front':
        return 'Frente do Documento';
      case 'back':
        return 'Verso do Documento';
      case 'selfie':
        return 'Selfie com Documento';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="text-center py-8">
        <FileText className="mx-auto text-gray-400 mb-4" size={48} />
        <p className="text-gray-500">Documento não encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          onClick={() => router.push('/admin/documents')}
          className="btn btn-secondary"
        >
          <ArrowLeft size={16} />
          Voltar
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Validação de Documento
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {getDocumentTypeLabel(document.documentType)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informações do Documento */}
        <div className="lg:col-span-1 space-y-6">
          {/* Status */}
          <Card>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                {getStatusIcon(document.status)}
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Status</h3>
                  <div className="mt-1">
                    {getStatusText(document.status)}
                  </div>
                </div>
              </div>
              
              {document.status === 'rejected' && document.rejectionReason && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                    Motivo da Rejeição:
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    {document.rejectionReason}
                  </p>
                </div>
              )}

              {document.reviewer && (
                <div className="mt-4 text-sm text-gray-500">
                  <p>Revisado por: {document.reviewer.name}</p>
                  {document.reviewedAt && (
                    <p>Em: {new Date(document.reviewedAt).toLocaleString('pt-BR')}</p>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Informações do Usuário */}
          <Card>
            <div className="p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <User size={18} />
                Usuário
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-500">Nome</p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {document.user?.name || 'Não informado'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="text-sm text-gray-900 dark:text-white flex items-center gap-1">
                    <Mail size={14} />
                    {document.user?.email || 'Não informado'}
                  </p>
                </div>
                {document.user?.userCompanies && document.user.userCompanies.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Empresa</p>
                    <p className="text-sm text-gray-900 dark:text-white flex items-center gap-1">
                      <Building size={14} />
                      {document.user.userCompanies[0].company?.name || 'Não informado'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Informações do Arquivo */}
          <Card>
            <div className="p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FileText size={18} />
                Arquivo
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-500">Nome do arquivo</p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {document.filename || 'Não informado'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Tipo</p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {document.mimeType || 'Não informado'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Enviado em</p>
                  <p className="text-sm text-gray-900 dark:text-white flex items-center gap-1">
                    <Calendar size={14} />
                    {new Date(document.uploadedAt).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Preview do Documento */}
        <div className="lg:col-span-2">
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Preview do Documento
                </h3>
                {documentUrl && (
                  <Button
                    onClick={() => window.open(documentUrl, '_blank')}
                    className="btn btn-secondary btn-sm"
                  >
                    <Eye size={14} />
                    Ver em tela cheia
                  </Button>
                )}
              </div>

              <div className="border-2 border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-800 min-h-96 flex items-center justify-center">
                {documentUrl && document.mimeType?.startsWith('image/') ? (
                  <img 
                    src={documentUrl} 
                    alt={getDocumentTypeLabel(document.documentType)}
                    className="max-w-full max-h-96 object-contain rounded"
                  />
                ) : documentUrl && document.mimeType === 'application/pdf' ? (
                  <div className="text-center">
                    <FileText className="mx-auto text-gray-400 mb-4" size={48} />
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Arquivo PDF
                    </p>
                    <Button
                      onClick={() => window.open(documentUrl, '_blank')}
                      className="btn btn-primary"
                    >
                      <Download size={16} />
                      Abrir PDF
                    </Button>
                  </div>
                ) : (
                  <div className="text-center">
                    <FileText className="mx-auto text-gray-400 mb-4" size={48} />
                    <p className="text-gray-500">
                      Preview não disponível
                    </p>
                  </div>
                )}
              </div>

              {/* Ações */}
              {document.status === 'pending' && (
                <div className="flex gap-4 mt-6">
                  <Button
                    onClick={handleApprove}
                    disabled={approving}
                    className="btn btn-success flex-1"
                  >
                    {approving ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Aprovando...</span>
                      </div>
                    ) : (
                      <>
                        <CheckCircle size={16} />
                        Aprovar Documento
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => setShowRejectModal(true)}
                    className="btn btn-danger flex-1"
                  >
                    <XCircle size={16} />
                    Rejeitar Documento
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Modal de Rejeição */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Rejeitar Documento
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Informe o motivo da rejeição. Esta informação será enviada ao usuário.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Digite o motivo da rejeição..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 min-h-24"
              rows={4}
            />
            <div className="flex gap-3 mt-4">
              <Button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                }}
                className="btn btn-secondary flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleReject}
                disabled={rejecting || !rejectionReason.trim()}
                className="btn btn-danger flex-1"
              >
                {rejecting ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Rejeitando...</span>
                  </div>
                ) : (
                  'Confirmar Rejeição'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentDetailPage;