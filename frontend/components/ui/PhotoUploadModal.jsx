"use client";
import React, { useState } from 'react';
import { X, Upload, Camera, Loader2 } from 'lucide-react';
import { useAlertContext } from '@/contexts/AlertContext';
import useAuthStore from '@/store/authStore';
import imageStorageService from '@/services/imageStorage.service';

const PhotoUploadModal = ({ isOpen, onClose, onPhotoUploaded, currentPhoto }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const { showSuccess, showError } = useAlertContext();
  const { user, setProfilePhotoUrl } = useAuthStore();

  if (!isOpen) return null;

  const handleFileSelect = async (selectedFile) => {
    if (!selectedFile) return;

    try {
      // Validate using service
      imageStorageService.validateImage(selectedFile);
      
      setFile(selectedFile);

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

    try {
      // Get the data URL from preview or create it
      const dataUrl = preview || await imageStorageService.fileToDataUrl(file);
      
      // Save to local storage
      const imageData = await imageStorageService.saveProfileImage(user.id, file, dataUrl);
      
      if (imageData) {
        showSuccess('Foto de perfil atualizada com sucesso!');
        // Update the store with the local data URL
        setProfilePhotoUrl(dataUrl);
        
        // Manter compatibilidade com callback
        if (onPhotoUploaded) {
          onPhotoUploaded(dataUrl);
        }
        handleClose();
      }
    } catch (error) {
      console.error('Error saving photo locally:', error);
      showError(error.message || 'Erro ao salvar foto. Tente novamente.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (isUploading) return;
    setFile(null);
    setPreview(null);
    onClose();
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Atualizar Foto de Perfil
          </h2>
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Current Photo */}
          {currentPhoto && !preview && (
            <div className="mb-6 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Foto atual:</p>
              <div className="w-24 h-24 mx-auto rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                <img
                  src={currentPhoto}
                  alt="Foto atual"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            </div>
          )}

          {/* Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                : 'border-gray-300 dark:border-gray-600'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {preview ? (
              <div className="space-y-4">
                <div className="w-32 h-32 mx-auto rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <p className="font-medium">{file.name}</p>
                  <p>{formatFileSize(file.size)}</p>
                </div>
                <button
                  onClick={() => {setPreview(null); setFile(null);}}
                  disabled={isUploading}
                  className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
                >
                  Remover foto
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <Camera size={24} className="text-gray-500 dark:text-gray-400" />
                  </div>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400 mb-2">
                    Arraste uma foto aqui ou
                  </p>
                  <label className="cursor-pointer">
                    <span className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">
                      Selecionar arquivo
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      onChange={handleFileInput}
                      disabled={isUploading}
                    />
                  </label>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  JPG, PNG, GIF ou WebP até 5MB
                </p>
              </div>
            )}
          </div>
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
                <span>Enviando...</span>
              </>
            ) : (
              <>
                <Upload size={16} />
                <span>Enviar Foto</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PhotoUploadModal;