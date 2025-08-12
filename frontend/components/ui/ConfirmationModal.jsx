import React from 'react';
import Modal from './Modal';
import Button from './Button';
import Icon from './Icon';

const ConfirmationModal = ({ 
  activeModal, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  confirmButtonColor = 'red',
  icon = 'warning'
}) => {
  const getButtonClasses = () => {
    const baseClasses = 'px-6 py-3 rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
    
    if (confirmButtonColor === 'red') {
      return `${baseClasses} bg-red-500 hover:bg-red-600 focus:ring-red-500 text-white`;
    }
    
    return `${baseClasses} bg-blue-500 hover:bg-blue-600 focus:ring-blue-500 text-white`;
  };



  const getIconName = () => {
    if (icon === 'warning') {
      return 'heroicons-outline:exclamation-triangle';
    } else if (icon === 'danger') {
      return 'heroicons-outline:exclamation-circle';
    } else if (icon === 'info') {
      return 'heroicons-outline:information-circle';
    }
    
    return 'heroicons-outline:question-mark-circle';
  };

  return (
    <Modal 
      activeModal={activeModal} 
      onClose={onClose} 
      title={title}
      centered={true}
      className="max-w-lg"
    >
      <div className="text-center">
        {/* Ícone */}
        <Icon icon={getIconName()} className="mx-auto mb-4 text-6xl text-yellow-500" />
        
        {/* Mensagem */}
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {message}
        </p>
        
        {/* Botões */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={onClose}
            className="btn-outline px-6 py-3"
          >
            {cancelText}
          </Button>
          
          <Button
            onClick={onConfirm}
            className={getButtonClasses()}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmationModal;
