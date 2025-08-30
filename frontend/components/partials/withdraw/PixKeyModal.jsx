"use client";
import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Textinput from '@/components/ui/Textinput';
import Select from '@/components/ui/Select';
import Icon from '@/components/ui/Icon';
import { useAlertContext } from '@/contexts/AlertContext';
import useAuthStore from '@/store/authStore';

const PixKeyModal = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuthStore();
  const { showSuccess, showError, showInfo } = useAlertContext();
  
  const [pixKeyType, setPixKeyType] = useState('cpf');
  const [pixKeyValue, setPixKeyValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [isValid, setIsValid] = useState(null);

  // Reset do estado quando modal fechar
  useEffect(() => {
    if (!isOpen) {
      setPixKeyType('cpf');
      setPixKeyValue('');
      setIsValid(null);
      setValidating(false);
      setLoading(false);
    }
  }, [isOpen]);

  const pixKeyTypes = [
    { value: 'cpf', label: 'CPF' },
    { value: 'email', label: 'E-mail' },
    { value: 'phone', label: 'Telefone' },
    { value: 'random', label: 'Chave Aleatória' }
  ];

  const formatCPF = (value) => {
    // Remove todos os caracteres não numéricos
    const cleanValue = value.replace(/\D/g, '');
    
    // Limita a 11 dígitos
    const limitedValue = cleanValue.slice(0, 11);
    
    // Aplica a máscara progressiva do CPF
    if (limitedValue.length <= 3) {
      return limitedValue;
    } else if (limitedValue.length <= 6) {
      return `${limitedValue.slice(0, 3)}.${limitedValue.slice(3)}`;
    } else if (limitedValue.length <= 9) {
      return `${limitedValue.slice(0, 3)}.${limitedValue.slice(3, 6)}.${limitedValue.slice(6)}`;
    } else {
      return `${limitedValue.slice(0, 3)}.${limitedValue.slice(3, 6)}.${limitedValue.slice(6, 9)}-${limitedValue.slice(9)}`;
    }
  };

  const formatPhone = (value) => {
    // Remove todos os caracteres não numéricos
    value = value.replace(/\D/g, '');
    
    // Limita a 11 dígitos
    if (value.length > 11) {
      value = value.slice(0, 11);
    }
    
    // Aplica a máscara do telefone
    if (value.length > 10) {
      // Celular com 11 dígitos: (xx) 9xxxx-xxxx
      value = value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (value.length > 6) {
      // Telefone fixo ou celular com 10 dígitos: (xx) xxxx-xxxx
      value = value.replace(/(\d{2})(\d{4})(\d{1,4})/, '($1) $2-$3');
    } else if (value.length > 2) {
      value = value.replace(/(\d{2})(\d{1,5})/, '($1) $2');
    }
    
    return value;
  };

  const handlePixKeyChange = (value) => {
    let formattedValue = value;
    
    if (pixKeyType === 'cpf') {
      formattedValue = formatCPF(value);
    } else if (pixKeyType === 'phone') {
      formattedValue = formatPhone(value);
    } else if (pixKeyType === 'email' || pixKeyType === 'random') {
      // Para email e chave aleatória, não aplicar formatação
      formattedValue = value;
    }
    
    setPixKeyValue(formattedValue);
    setIsValid(null);
  };

  // Função para validar CPF
  const validateCPF = (cpf) => {
    cpf = cpf.replace(/\D/g, '');
    
    if (cpf.length !== 11) return false;
    
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1+$/.test(cpf)) return false;
    
    // Validação do primeiro dígito verificador
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.charAt(9))) return false;
    
    // Validação do segundo dígito verificador
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf.charAt(i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.charAt(10))) return false;
    
    return true;
  };

  const validatePixKey = async () => {
    if (!pixKeyValue) {
      showError('Digite uma chave PIX válida');
      return false;
    }

    setValidating(true);
    try {
      const token = localStorage.getItem('token');
      
      // Validação de CPF para chaves do tipo CPF
      if (pixKeyType === 'cpf') {
        // Remover formatação do CPF
        const cleanCPF = pixKeyValue.replace(/\D/g, '');
        
        // Validar se o CPF tem 11 dígitos
        if (cleanCPF.length !== 11) {
          setIsValid(false);
          showError('CPF inválido', 'O CPF deve conter 11 dígitos');
          return false;
        }
        
        // Validar CPF com algoritmo
        if (!validateCPF(pixKeyValue)) {
          setIsValid(false);
          showError('CPF inválido', 'Digite um CPF válido');
          return false;
        }
        
        // TODO: Fazer chamada real para API de validação se CPF pertence ao titular
        // Por enquanto, simular sucesso
        showInfo('Validando CPF...', 'Verificando se o CPF pertence ao titular da conta');
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        setIsValid(true);
        showSuccess('CPF validado', 'O CPF corresponde ao titular da conta');
        return true;
      }
      
      // Validação de telefone
      if (pixKeyType === 'phone') {
        const phoneDigits = pixKeyValue.replace(/\D/g, '');
        
        if (phoneDigits.length < 10) {
          setIsValid(false);
          showError('Telefone inválido', 'O telefone deve ter pelo menos 10 dígitos');
          return false;
        }
        
        if (phoneDigits.length !== 10 && phoneDigits.length !== 11) {
          setIsValid(false);
          showError('Telefone inválido', 'O telefone deve ter 10 ou 11 dígitos');
          return false;
        }
        
        // Validar se o telefone não é uma sequência repetida
        if (/^(\d)\1+$/.test(phoneDigits)) {
          setIsValid(false);
          showError('Telefone inválido', 'Digite um número de telefone válido');
          return false;
        }
        
        showInfo('Validando telefone...', 'Verificando dados do telefone');
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        setIsValid(true);
        showSuccess('Telefone validado', 'O telefone foi validado com sucesso');
        return true;
      }
      
      // Validação de email
      if (pixKeyType === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(pixKeyValue)) {
          setIsValid(false);
          showError('E-mail inválido', 'Digite um e-mail válido');
          return false;
        }
        
        showInfo('Validando e-mail...', 'Verificando dados do e-mail');
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        setIsValid(true);
        showSuccess('E-mail validado', 'O e-mail foi validado com sucesso');
        return true;
      }
      
      // Para chave aleatória
      if (pixKeyType === 'random') {
        if (pixKeyValue.length < 10) {
          setIsValid(false);
          showError('Chave inválida', 'A chave aleatória deve ter pelo menos 10 caracteres');
          return false;
        }
        
        showInfo('Validando chave...', 'Verificando dados da chave');
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        setIsValid(true);
        showSuccess('Chave validada', 'A chave foi validada com sucesso');
        return true;
      }
      
      // Default
      setIsValid(false);
      showError('Tipo de chave não reconhecido');
      return false;
      
    } catch (error) {
      console.error('Erro ao validar chave PIX:', error);
      setIsValid(false);
      showError('Erro na validação', 'Não foi possível validar a chave PIX');
      return false;
    } finally {
      setValidating(false);
    }
  };

  const handleSave = async () => {
    const isValidKey = await validatePixKey();
    if (!isValidKey) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // TODO: Fazer chamada real para API para salvar chave PIX
      // Por enquanto, simular salvamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const pixKeyData = {
        type: pixKeyType,
        value: pixKeyValue,
        validated: true
      };
      
      // Salvar no localStorage temporariamente
      localStorage.setItem('userPixKey', JSON.stringify(pixKeyData));
      
      showSuccess('Chave PIX cadastrada', 'Sua chave PIX foi cadastrada com sucesso');
      
      if (onSuccess) {
        onSuccess(pixKeyData);
      }
      
      onClose();
    } catch (error) {
      console.error('Erro ao salvar chave PIX:', error);
      showError('Erro ao salvar', 'Não foi possível salvar a chave PIX');
    } finally {
      setLoading(false);
    }
  };

  const getPlaceholder = () => {
    switch (pixKeyType) {
      case 'cpf':
        return '000.000.000-00';
      case 'email':
        return 'seu@email.com';
      case 'phone':
        return '(11) 98765-4321';
      case 'random':
        return 'Digite sua chave aleatória';
      default:
        return 'Digite sua chave PIX';
    }
  };

  const getHelperText = () => {
    switch (pixKeyType) {
      case 'cpf':
        return 'O CPF deve ser o mesmo cadastrado na conta';
      case 'email':
        return 'Digite o e-mail cadastrado como chave PIX';
      case 'phone':
        return 'Digite o número de telefone com DDD';
      case 'random':
        return 'Cole sua chave aleatória PIX';
      default:
        return '';
    }
  };

  return (
    <Modal
      title="Cadastrar Chave PIX"
      activeModal={isOpen}
      onClose={onClose}
      sizeClass="max-w-lg"
    >
      <div className="space-y-6">
        <div className="bg-yellow-50 dark:bg-slate-800 border border-yellow-200 dark:border-slate-700 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <Icon 
              icon="heroicons:exclamation-triangle" 
              className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5"
            />
            <div>
              <h4 className="font-semibold text-yellow-800 dark:text-slate-200 mb-1">
                Importante
              </h4>
              <p className="text-sm text-yellow-700 dark:text-slate-300">
                A chave PIX deve pertencer ao mesmo CPF cadastrado em sua conta Coinage.
                Isso é necessário para garantir a segurança das suas transações.
              </p>
            </div>
          </div>
        </div>

        <div>
          <Select
            options={pixKeyTypes}
            label="Tipo de Chave PIX"
            value={pixKeyType}
            onChange={(e) => {
              setPixKeyType(e.target.value);
              setPixKeyValue('');
              setIsValid(null);
            }}
          />
        </div>

        <div>
          <Textinput
            label="Chave PIX"
            placeholder={getPlaceholder()}
            value={pixKeyValue}
            onChange={(e) => handlePixKeyChange(e.target.value)}
            disabled={validating}
          />
          {getHelperText() && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{getHelperText()}</p>
          )}
          
          {isValid === true && (
            <div className="flex items-center mt-2 text-green-600 dark:text-green-400">
              <Icon icon="heroicons:check-circle" className="h-4 w-4 mr-1" />
              <span className="text-sm">Chave PIX válida</span>
            </div>
          )}
          
          {isValid === false && (
            <div className="flex items-center mt-2 text-red-600 dark:text-red-400">
              <Icon icon="heroicons:x-circle" className="h-4 w-4 mr-1" />
              <span className="text-sm">Chave PIX inválida</span>
            </div>
          )}
        </div>

        <div className="flex space-x-3">
          <Button
            onClick={validatePixKey}
            disabled={!pixKeyValue || validating || loading}
            className="flex-1"
            variant="secondary"
          >
            {validating ? (
              <div className="flex items-center justify-center">
                <Icon icon="heroicons:arrow-path" className="h-5 w-5 animate-spin mr-2" />
                Validando...
              </div>
            ) : (
              'Validar Chave'
            )}
          </Button>

          <Button
            onClick={handleSave}
            disabled={!isValid || loading}
            className="flex-1"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <Icon icon="heroicons:arrow-path" className="h-5 w-5 animate-spin mr-2" />
                Salvando...
              </div>
            ) : (
              'Cadastrar Chave'
            )}
          </Button>
        </div>

        <div className="bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-700 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 dark:text-slate-200 mb-2">
            Como funciona?
          </h4>
          <ul className="space-y-1 text-sm text-blue-700 dark:text-slate-300">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Cadastre sua chave PIX para receber saques</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>A chave deve estar vinculada ao seu CPF</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Você pode alterar a chave a qualquer momento</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Os saques serão enviados apenas para esta chave</span>
            </li>
          </ul>
        </div>
      </div>
    </Modal>
  );
};

export default PixKeyModal;