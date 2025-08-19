"use client";
import React, { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useAlertContext } from '@/contexts/AlertContext';
import { 
  Upload, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  X,
  FileText
} from 'lucide-react';
import api from '@/services/api';

const DocumentValidationPage = () => {
  const { showSuccess, showError, showInfo } = useAlertContext();
  const [documents, setDocuments] = useState({
    front: null,
    back: null,
    selfie: null
  });
  const [selectedFiles, setSelectedFiles] = useState({
    front: null,
    back: null,
    selfie: null
  });
  const [loading, setLoading] = useState({
    front: false,
    back: false,
    selfie: false
  });
  const [fetchingDocs, setFetchingDocs] = useState(true);

  const documentTypes = [
    {
      id: 'front',
      label: 'Frente do Documento',
      description: 'RG, CNH ou Passaporte (frente)'
    },
    {
      id: 'back',
      label: 'Verso do Documento',
      description: 'Verso do mesmo documento'
    },
    {
      id: 'selfie',
      label: 'Selfie com Documento',
      description: 'Segurando o documento ao lado do rosto'
    }
  ];

  // Buscar documentos existentes
  useEffect(() => {
    fetchUserDocuments();
  }, []);

  // Limpeza de objetos URL quando componente é desmontado
  useEffect(() => {
    return () => {
      Object.values(selectedFiles).forEach(file => {
        if (file?.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, [selectedFiles]);

  const fetchUserDocuments = async () => {
    try {
      setFetchingDocs(true);
      const response = await api.get('/user-documents');
      if (response.data.success && response.data.data) {
        const docsMap = {};
        response.data.data.forEach(doc => {
          docsMap[doc.documentType] = doc;
        });
        setDocuments(docsMap);
      }
    } catch (error) {
      console.error('Erro ao buscar documentos:', error);
    } finally {
      setFetchingDocs(false);
    }
  };

  const handleFileSelect = (file, documentType) => {
    if (!file) return;

    // Validar tipo de arquivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      showError('Tipo de arquivo não permitido. Use JPEG, PNG, HEIC, WEBP ou PDF.');
      return;
    }

    // Validar tamanho (10MB)
    if (file.size > 10 * 1024 * 1024) {
      showError('Arquivo muito grande. Máximo: 10MB.');
      return;
    }

    // Criar preview para imagens
    const fileWithPreview = Object.assign(file, {
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
    });

    setSelectedFiles(prev => ({
      ...prev,
      [documentType]: fileWithPreview
    }));
  };

  const handleRemoveFile = (documentType) => {
    const file = selectedFiles[documentType];
    if (file?.preview) {
      URL.revokeObjectURL(file.preview);
    }
    setSelectedFiles(prev => ({
      ...prev,
      [documentType]: null
    }));
  };

  const handleFileUpload = async (file, documentType) => {
    if (!file) return;

    // Validar tipo de arquivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      showError('Tipo de arquivo não permitido. Use JPEG, PNG, HEIC, WEBP ou PDF.');
      return;
    }

    // Validar tamanho (10MB)
    if (file.size > 10 * 1024 * 1024) {
      showError('Arquivo muito grande. Máximo: 10MB.');
      return;
    }

    setLoading(prev => ({ ...prev, [documentType]: true }));
    
    try {
      const formData = new FormData();
      formData.append('document', file);

      const response = await api.post(`/user-documents/${documentType}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        setDocuments(prev => ({
          ...prev,
          [documentType]: response.data.data
        }));
        // Limpar arquivo selecionado após upload
        handleRemoveFile(documentType);
        showSuccess('Documento enviado com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao enviar documento:', error);
      showError(error.response?.data?.message || 'Erro ao enviar documento');
    } finally {
      setLoading(prev => ({ ...prev, [documentType]: false }));
    }
  };

  const handleUploadAll = async () => {
    const filesToUpload = Object.entries(selectedFiles).filter(([type, file]) => {
      if (!file) return false;
      const doc = documents[type];
      return !doc || doc.status === 'rejected';
    });

    if (filesToUpload.length === 0) {
      showInfo('Nenhum documento selecionado para envio');
      return;
    }

    setLoading(prev => {
      const newLoading = { ...prev };
      filesToUpload.forEach(([type]) => {
        newLoading[type] = true;
      });
      return newLoading;
    });

    try {
      const uploadPromises = filesToUpload.map(async ([documentType, file]) => {
        const formData = new FormData();
        formData.append('document', file);

        const response = await api.post(`/user-documents/${documentType}/upload`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        if (response.data.success) {
          return { documentType, data: response.data.data };
        }
        throw new Error(`Erro no envio do documento ${documentType}`);
      });

      const results = await Promise.all(uploadPromises);
      
      // Atualizar documentos
      setDocuments(prev => {
        const newDocs = { ...prev };
        results.forEach(({ documentType, data }) => {
          newDocs[documentType] = data;
        });
        return newDocs;
      });

      // Limpar arquivos selecionados
      results.forEach(({ documentType }) => {
        handleRemoveFile(documentType);
      });

      showSuccess(`${results.length} documento(s) enviado(s) com sucesso!`);
    } catch (error) {
      console.error('Erro ao enviar documentos:', error);
      showError('Erro ao enviar um ou mais documentos');
    } finally {
      setLoading({ front: false, back: false, selfie: false });
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
        return null;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'approved':
        return <span className="text-xs text-green-600">Aprovado</span>;
      case 'pending':
        return <span className="text-xs text-yellow-600">Em análise</span>;
      case 'rejected':
        return <span className="text-xs text-red-600">Rejeitado</span>;
      default:
        return <span className="text-xs text-gray-500">Não enviado</span>;
    }
  };

  const DocumentUploader = ({ documentType, label, description, document, loading }) => {
    const selectedFile = selectedFiles[documentType];
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      accept: {
        'image/*': ['.jpeg', '.jpg', '.png', '.heic', '.webp'],
        'application/pdf': ['.pdf']
      },
      maxSize: 10 * 1024 * 1024,
      multiple: false,
      disabled: loading || document?.status === 'approved',
      onDrop: (acceptedFiles) => {
        if (acceptedFiles.length > 0) {
          handleFileSelect(acceptedFiles[0], documentType);
        }
      }
    });

    return (
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium text-gray-900 dark:text-white">{label}</h3>
              {document && getStatusIcon(document.status)}
            </div>
            <p className="text-xs text-gray-500">{description}</p>
          </div>
        </div>

        {document && document.status !== 'rejected' ? (
          // Documento já enviado - exibir resultado final
          <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            {document.s3Url && document.mimeType?.startsWith('image/') ? (
              <img 
                src={document.s3Url} 
                alt={label}
                className="w-16 h-16 object-cover rounded border border-gray-300"
              />
            ) : (
              <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                <FileText className="text-gray-400" size={24} />
              </div>
            )}
            <div className="flex-1">
              <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                {document.filename}
              </p>
              <div className="flex items-center gap-2 mt-1">
                {getStatusText(document.status)}
                {document.status === 'approved' && (
                  <CheckCircle className="text-green-500" size={16} />
                )}
              </div>
              {document.rejectionReason && (
                <p className="text-xs text-red-500 mt-1">
                  Motivo: {document.rejectionReason}
                </p>
              )}
              {document.uploadedAt && (
                <p className="text-xs text-gray-500 mt-1">
                  Enviado em {new Date(document.uploadedAt).toLocaleDateString('pt-BR')}
                </p>
              )}
            </div>
          </div>
        ) : (
          // Layout lado a lado: Dropzone + Preview
          <div className="grid grid-cols-2 gap-4">
            {/* Dropzone do lado esquerdo */}
            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed rounded-lg p-4 text-center cursor-pointer
                transition-colors duration-200 h-32 flex flex-col items-center justify-center
                ${isDragActive 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                }
                ${loading ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <input {...getInputProps()} />
              {loading ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span className="text-xs text-gray-600">Enviando...</span>
                </div>
              ) : (
                <>
                  <Upload className="text-gray-400 mb-2" size={24} />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {isDragActive ? 'Solte aqui' : 'Clique ou arraste'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    JPEG, PNG, PDF (máx. 10MB)
                  </p>
                </>
              )}
            </div>

            {/* Preview do lado direito */}
            <div className="border-2 border-gray-200 dark:border-gray-600 rounded-lg p-4 h-32 flex items-center justify-center bg-gray-50 dark:bg-gray-800">
              {selectedFile ? (
                <div className="w-full h-full flex items-center justify-center relative">
                  {selectedFile.preview ? (
                    <div className="relative w-full h-full">
                      <img 
                        src={selectedFile.preview} 
                        alt={label}
                        className="w-full h-full object-contain rounded"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFile(documentType);
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="text-gray-400" size={32} />
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFile(documentType);
                        }}
                        className="bg-red-500 text-white rounded px-2 py-1 text-xs hover:bg-red-600 transition-colors"
                      >
                        Remover
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center">
                  <FileText className="text-gray-300 dark:text-gray-600 mx-auto mb-2" size={32} />
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    Preview do arquivo
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (fetchingDocs) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const approvedCount = Object.values(documents).filter(doc => doc?.status === 'approved').length;
  const isComplete = approvedCount === 3;

  return (
    <div className="space-y-6">
      {/* Header com Status */}
      <Card>
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Validação de Documentos
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Envie os 3 documentos obrigatórios para validação
              </p>
            </div>
            <div className="text-right">
              <div className={`text-2xl font-bold ${isComplete ? 'text-green-600' : 'text-gray-600'}`}>
                {approvedCount}/3
              </div>
              <p className="text-xs text-gray-500">Aprovados</p>
            </div>
          </div>
          
          {/* Barra de progresso */}
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  isComplete ? 'bg-green-500' : 'bg-blue-600'
                }`}
                style={{ width: `${(approvedCount / 3) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Documentos */}
      <Card>
        <div className="p-6 space-y-4">
          {documentTypes.map((docType) => (
            <DocumentUploader
              key={docType.id}
              documentType={docType.id}
              label={docType.label}
              description={docType.description}
              document={documents[docType.id]}
              loading={loading[docType.id]}
            />
          ))}
          
          {/* Botão de Envio - Sempre Visível */}
          {(() => {
            const hasSelectedFiles = Object.values(selectedFiles).some(file => file !== null);
            const isLoading = Object.values(loading).some(l => l);
            const selectedCount = Object.values(selectedFiles).filter(file => file !== null).length;
            
            return (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    {selectedCount > 0 ? (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedCount} documento(s) selecionado(s)
                      </p>
                    ) : (
                      <p className="text-sm text-gray-400 dark:text-gray-500">
                        Selecione arquivos para enviar
                      </p>
                    )}
                  </div>
                  <Button
                    onClick={handleUploadAll}
                    disabled={!hasSelectedFiles || isLoading}
                    className={`btn ${!hasSelectedFiles ? 'btn-secondary opacity-50' : 'btn-primary'}`}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Enviando...</span>
                      </div>
                    ) : (
                      <>
                        <Upload size={16} />
                        {selectedCount > 1 ? `Enviar ${selectedCount} Documentos` : selectedCount === 1 ? 'Enviar Documento' : 'Enviar Documentos'}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            );
          })()}
        </div>
      </Card>

      {/* Avisos Importantes */}
      <Card>
        <div className="p-4">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="text-amber-500 flex-shrink-0" size={18} />
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p className="font-medium text-gray-900 dark:text-white mb-1">Documentos Aceitos</p>
              <ul className="space-y-1 text-xs">
                <li>• RG, CNH, Passaporte ou Carteira Profissional</li>
                <li>• Fotos nítidas, sem reflexos ou sombras</li>
                <li>• Use o mesmo documento nas 3 fotos</li>
                <li>• Análise em até 2 dias úteis</li>
              </ul>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default DocumentValidationPage;