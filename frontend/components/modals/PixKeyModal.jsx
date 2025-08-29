"use client";
import React from 'react';
import Modal from '@/components/ui/Modal';
import PixKeyForm from '@/components/shared/PixKeyForm';

const PixKeyModal = ({ 
  isOpen, 
  onClose, 
  onSuccess,
  mode = 'withdraw' 
}) => {
  const handleSuccess = (pixKey) => {
    if (onSuccess) {
      onSuccess(pixKey);
    }
    onClose();
  };

  return (
    <Modal
      activeModal={isOpen}
      onClose={onClose}
      title="Cadastrar Chave PIX"
      className="max-w-4xl"
    >
      <PixKeyForm
        onSuccess={handleSuccess}
        onCancel={onClose}
        mode={mode}
        showTitle={false}
      />
    </Modal>
  );
};

export default PixKeyModal;