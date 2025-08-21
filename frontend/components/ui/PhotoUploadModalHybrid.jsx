"use client";
import React, { useState } from 'react';
import { X, Upload, Camera, Loader2, Cloud, HardDrive, CheckCircle } from 'lucide-react';
import { useAlertContext } from '@/contexts/AlertContext';
import useAuthStore from '@/store/authStore';
import s3PhotoService from '@/services/s3PhotoService';
import imageStorageService from '@/services/imageStorage.service';

const PhotoUploadModalHybrid = ({ isOpen, onClose, onPhotoUploaded, currentPhoto }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null); // { s3: 'success'|'failed'|null, indexeddb: 'success'|'failed'|null }
  const { showSuccess, showError } = useAlertContext();
  const { user, setProfilePhotoUrl } = useAuthStore();

  if (!isOpen) return null;

  const handleFileSelect = async (selectedFile) => {
    if (!selectedFile) return;

    try {
      // Validate using service
      imageStorageService.validateImage(selectedFile);
      
      setFile(selectedFile);
      setUploadStatus(null); // Reset status

      // Create preview
      const dataUrl = await imageStorageService.fileToDataUrl(selectedFile);
      setPreview(dataUrl);
    } catch (error) {
      showError(error.message);
    }
  };

  const handleFileInput = (e) => {
    handleFileSelect(e.target.files[0]);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || !user?.id) {
      showError('Selecione uma foto para enviar');
      return;
    }

    setIsUploading(true);
    setUploadStatus({ s3: null, indexeddb: null });

    try {
      console.log('📸 [PhotoUpload] Iniciando upload híbrido...');
      
      // Usar o serviço híbrido S3 + IndexedDB
      const result = await s3PhotoService.saveProfilePhoto(user.id, file);
      
      if (result.success) {
        // Atualizar status baseado na fonte
        if (result.source === 's3') {
          setUploadStatus({ s3: 'success', indexeddb: result.hasLocalBackup ? 'success' : 'failed' });
          showSuccess('✅ Foto salva no S3 com backup local!');
        } else if (result.source === 'indexeddb') {
          setUploadStatus({ s3: s3PhotoService.useS3 ? 'failed' : null, indexeddb: 'success' });
          showSuccess('💾 Foto salva localmente! ' + (s3PhotoService.useS3 ? '(S3 indisponível)' : ''));
        }
        
        // Update the store with the result URL
        setProfilePhotoUrl(result.url);
        
        // Manter compatibilidade com callback
        if (onPhotoUploaded) {
          onPhotoUploaded(result.url);
        }
        
        // Fechar modal após 2 segundos para mostrar status
        setTimeout(() => {
          handleClose();
        }, 2000);
      } else {
        setUploadStatus({ s3: 'failed', indexeddb: 'failed' });
        showError('❌ Falha ao salvar foto em ambos S3 e IndexedDB');
      }
    } catch (error) {
      console.error('❌ [PhotoUpload] Erro no upload:', error);
      setUploadStatus({ s3: 'failed', indexeddb: 'failed' });
      showError(error.message || 'Erro ao salvar foto. Tente novamente.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (isUploading) return;
    setFile(null);
    setPreview(null);
    setUploadStatus(null);
    onClose();
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderUploadStatus = () => {
    if (!uploadStatus || isUploading) return null;

    return (
      <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Status do Upload:
        </h4>
        <div className="space-y-2">
          {/* S3 Status */}
          {s3PhotoService.useS3 && (
            <div className="flex items-center space-x-2">
              <Cloud size={16} className="text-blue-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">S3 (Amazon):</span>
              {uploadStatus.s3 === 'success' && (
                <CheckCircle size={16} className="text-green-500" />
              )}
              {uploadStatus.s3 === 'failed' && (
                <X size={16} className="text-red-500" />
              )}
              <span className={`text-sm font-medium ${
                uploadStatus.s3 === 'success' ? 'text-green-600' : 'text-red-600'
              }`}>
                {uploadStatus.s3 === 'success' ? 'Sucesso' : 'Falhou'}
              </span>
            </div>
          )}
          
          {/* IndexedDB Status */}
          <div className="flex items-center space-x-2">
            <HardDrive size={16} className="text-purple-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Local (IndexedDB):</span>
            {uploadStatus.indexeddb === 'success' && (
              <CheckCircle size={16} className="text-green-500" />
            )}
            {uploadStatus.indexeddb === 'failed' && (
              <X size={16} className="text-red-500" />
            )}
            <span className={`text-sm font-medium ${
              uploadStatus.indexeddb === 'success' ? 'text-green-600' : 'text-red-600'
            }`}>
              {uploadStatus.indexeddb === 'success' ? 'Sucesso' : 'Falhou'}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Camera className="text-blue-500" size={24} />
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Upload de Foto
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {s3PhotoService.useS3 ? 'S3 + Backup Local' : 'Armazenamento Local'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {/* Current Photo */}
          {currentPhoto && (
            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Foto atual:</p>
              <img 
                src={currentPhoto} 
                alt="Foto atual" 
                className="w-16 h-16 rounded-full object-cover mx-auto"
              />
            </div>
          )}

          {/* Upload Area */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragActive 
                ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
            }`}
          >
            {preview ? (
              <div className="space-y-3">
                <img 
                  src={preview} 
                  alt="Preview" 
                  className="w-24 h-24 rounded-full object-cover mx-auto"
                />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <Upload className="mx-auto text-gray-400" size={48} />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Clique para selecionar ou arraste uma foto
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileInput}
                    className="hidden"
                    id="photo-input"
                    disabled={isUploading}
                  />
                  <label
                    htmlFor="photo-input"
                    className="inline-block px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 cursor-pointer transition-colors text-sm"
                  >
                    Selecionar Arquivo
                  </label>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  JPG, PNG, GIF ou WebP até 5MB
                </p>
              </div>
            )}
          </div>

          {/* Upload Status */}
          {renderUploadStatus()}

          {/* S3 Info */}
          {s3PhotoService.useS3 && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center space-x-2 mb-1">
                <Cloud size={16} className="text-blue-500" />
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  Modo S3 Ativo
                </span>
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                Sua foto será salva na Amazon S3 com backup local automático para acesso offline.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || isUploading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            {isUploading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>
                  {s3PhotoService.useS3 ? 'Enviando para S3...' : 'Salvando...'}
                </span>
              </>
            ) : (
              <>
                <Upload size={16} />
                <span>
                  {s3PhotoService.useS3 ? 'Enviar para S3' : 'Salvar Local'}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PhotoUploadModalHybrid;