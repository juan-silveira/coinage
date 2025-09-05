"use client";
import React, { useState, useEffect, useCallback } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import Icon from '@/components/ui/Icon';
import { useAlertContext } from '@/contexts/AlertContext';
import useAuthStore from '@/store/authStore';
import { useRouter } from 'next/navigation';
import pixKeysService from '@/services/pixKeys.service';

const PixKeyPage = () => {
  const { user } = useAuthStore();
  const { showSuccess, showError, showInfo } = useAlertContext();
  const router = useRouter();
  
  const [pixKeyType, setPixKeyType] = useState('cpf');
  const [pixKeyValue, setPixKeyValue] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [existingPixKeys, setExistingPixKeys] = useState([]);

  // Carregar dados iniciais
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      // Tentar carregar chaves PIX existentes (opcional)
      try {
        const pixKeysResponse = await pixKeysService.getPixKeys();
        if (pixKeysResponse?.success) {
          setExistingPixKeys(pixKeysResponse.data.pixKeys);
        }
      } catch (error) {
        // console.log('Não foi possível carregar chaves PIX existentes');
        setExistingPixKeys([]);
      }


    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error);
    }
  };

  // Atualizar valor do CPF quando mudar para esse tipo ou carregar componente
  useEffect(() => {
    if (pixKeyType === 'cpf' && user?.cpf) {
      const formattedCPF = formatCPF(user.cpf);
      setPixKeyValue(formattedCPF);
    } else if (pixKeyType === 'cpf' && !user?.cpf) {
      setPixKeyValue('');
    }
  }, [pixKeyType, user?.cpf]);

  // Garantir que o CPF seja carregado na inicialização se já estiver selecionado
  useEffect(() => {
    if (pixKeyType === 'cpf' && user?.cpf && !pixKeyValue) {
      const formattedCPF = formatCPF(user.cpf);
      setPixKeyValue(formattedCPF);
    }
  }, [user]);

  const pixKeyTypes = [
    { value: 'cpf', label: 'CPF' },
    { value: 'email', label: 'E-mail' },
    { value: 'phone', label: 'Telefone' },
    { value: 'random', label: 'Chave Aleatória' }
  ];

  const formatCPF = (value) => {
    const cleanValue = value.replace(/\D/g, '');
    const limitedValue = cleanValue.slice(0, 11);
    
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
    // Remove todos caracteres não numéricos
    const cleanValue = value.replace(/\D/g, '');
    
    // Limita a 11 dígitos
    const limitedValue = cleanValue.slice(0, 11);
    
    // Formatação progressiva para telefone brasileiro
    if (limitedValue.length <= 2) {
      return limitedValue;
    } else if (limitedValue.length <= 6) {
      return `(${limitedValue.slice(0, 2)}) ${limitedValue.slice(2)}`;
    } else if (limitedValue.length === 10) {
      // Telefone fixo: (XX) XXXX-XXXX
      return `(${limitedValue.slice(0, 2)}) ${limitedValue.slice(2, 6)}-${limitedValue.slice(6)}`;
    } else if (limitedValue.length === 11) {
      // Celular: (XX) XXXXX-XXXX
      return `(${limitedValue.slice(0, 2)}) ${limitedValue.slice(2, 7)}-${limitedValue.slice(7)}`;
    } else {
      // Estados intermediários (7, 8, 9 dígitos)
      return `(${limitedValue.slice(0, 2)}) ${limitedValue.slice(2)}`;
    }
  };

  const handlePixKeyChange = (value) => {
    let formattedValue = value;
    
    // Aplicar formatação manual apenas para telefone
    if (pixKeyType === 'phone') {
      formattedValue = formatPhone(value);
    }
    
    setPixKeyValue(formattedValue);
  };

  // Reformatar valor quando mudar o tipo de chave PIX
  useEffect(() => {
    // Tratar valores específicos por tipo
    if (pixKeyType === 'cpf' && user?.cpf) {
      // Se mudou para CPF e tem CPF do usuário, usar ele
      const formattedCPF = formatCPF(user.cpf);
      setPixKeyValue(formattedCPF);
    } else if (pixKeyType === 'phone' && pixKeyValue && pixKeyValue.includes('.')) {
      // Se mudou para telefone e tem valor de CPF, limpar
      setPixKeyValue('');
    } else if (pixKeyType !== 'cpf' && pixKeyType !== 'phone') {
      // Para email/random, sempre limpar
      setPixKeyValue('');
    }
  }, [pixKeyType, user?.cpf]);

  const validateCPF = (cpf) => {
    cpf = cpf.replace(/\D/g, '');
    
    if (cpf.length !== 11) return false;
    
    if (/^(\d)\1+$/.test(cpf)) return false;
    
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.charAt(9))) return false;
    
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf.charAt(i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.charAt(10))) return false;
    
    return true;
  };

  // Validação básica de formato (sem consulta externa)
  const isValidPixKey = () => {
    if (!pixKeyValue) return false;
    
    switch (pixKeyType) {
      case 'cpf':
        const cleanCPF = pixKeyValue.replace(/\D/g, '');
        return cleanCPF.length === 11 && validateCPF(pixKeyValue);
        
      case 'phone':
        const phoneDigits = pixKeyValue.replace(/\D/g, '');
        return (phoneDigits.length === 10 || phoneDigits.length === 11) && 
               !/^(\d)\1+$/.test(phoneDigits);
        
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(pixKeyValue);
        
      case 'random':
        return pixKeyValue.length >= 10;
        
      default:
        return false;
    }
  };

  const handleSavePixKey = async () => {
    // Validação básica
    if (!isValidPixKey()) {
      showError('Chave PIX inválida', 'Verifique o formato da chave PIX');
      return;
    }

    setLoading(true);
    
    const pixKeyData = {
      keyType: pixKeyType,
      keyValue: pixKeyType === 'email' || pixKeyType === 'random' 
        ? pixKeyValue 
        : pixKeyValue.replace(/\D/g, ''),
      isDefault: existingPixKeys.length === 0 // Primeira chave é padrão
    };

    try {
      const response = await pixKeysService.createPixKey(pixKeyData);
      
      if (response.success) {
        showSuccess('Chave PIX cadastrada', 'Sua chave PIX foi cadastrada com sucesso');
        router.push('/withdraw');
        return;
      } else {
        throw new Error(response.message || 'Erro ao cadastrar chave PIX');
      }
    } catch (error) {
      console.error('Erro ao salvar chave PIX:', error);
      showError('Erro ao cadastrar chave PIX', 'Tente novamente mais tarde');
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
        return 'Digite o e-mail que será usado como chave PIX';
      case 'phone':
        return 'Digite o número de telefone com DDD';
      case 'random':
        return 'Cole sua chave aleatória PIX (32 caracteres)';
      default:
        return '';
    }
  };


  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Cadastrar Chave PIX
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Configure sua chave PIX para receber saques
        </p>
      </div>

      {/* Aviso importante */}
      <Card className="border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20">
        <div className="flex items-start space-x-3">
          <Icon icon="heroicons:exclamation-triangle" className="h-6 w-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-1">
              Importante
            </h3>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              A chave PIX deve pertencer ao mesmo CPF cadastrado em sua conta Coinage. 
              Isso é necessário para garantir a segurança das suas transações.
            </p>
          </div>
        </div>
      </Card>

      {/* Formulário - Etapa 1: Dados da Chave PIX */}
      <Card title="Dados Da Chave PIX">
        <div className="space-y-6">
          {/* Seleção do tipo de chave PIX */}
          <Select
            label="Tipo De Chave PIX"
            options={pixKeyTypes}
            value={pixKeyType}
            onChange={(e) => setPixKeyType(e.target.value)}
          />

          {/* Input da chave PIX */}
          <div>
            <label className="form-label">
              Chave PIX ({pixKeyType === 'cpf' ? 'CPF' : pixKeyType === 'email' ? 'E-mail' : pixKeyType === 'phone' ? 'Telefone' : 'Chave Aleatória'})
            </label>
            
            {pixKeyType === 'cpf' ? (
              <input
                type="text"
                className="form-control"
                placeholder={getPlaceholder()}
                value={pixKeyValue}
                onChange={(e) => handlePixKeyChange(e.target.value)}
                readOnly={user?.cpf ? true : false}
              />
            ) : (
              <input
                type="text"
                className="form-control"
                placeholder={getPlaceholder()}
                value={pixKeyValue}
                onChange={(e) => handlePixKeyChange(e.target.value)}
              />
            )}
            
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {pixKeyType === 'cpf' && user?.cpf ? 
                'Usando o CPF cadastrado em sua conta' : 
                getHelperText()
              }
            </p>

          </div>


          {/* Botão de ação */}
          <div className="flex justify-center">
            <Button
              onClick={handleSavePixKey}
              disabled={loading || !isValidPixKey()}
              className="w-full"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <Icon icon="heroicons:arrow-path" className="h-5 w-5 animate-spin mr-2" />
                  Cadastrando...
                </div>
              ) : (
                <>
                  Cadastrar Chave PIX
                  <Icon icon="heroicons:check" className="h-5 w-5 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Informações */}
      <Card title="Como funciona?">
        <ul className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Digite sua chave PIX (CPF, e-mail, telefone ou chave aleatória)</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>A chave deve estar vinculada ao seu CPF por segurança</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Após o cadastro, você poderá realizar saques via PIX</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Você pode adicionar mais chaves a qualquer momento</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Os saques serão enviados apenas para suas chaves cadastradas</span>
          </li>
        </ul>
      </Card>
    </div>
  );
};

export default PixKeyPage;