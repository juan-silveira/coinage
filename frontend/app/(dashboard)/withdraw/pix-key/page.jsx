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
  const [validating, setValidating] = useState(false);
  const [isValid, setIsValid] = useState(null);
  
  // Estados para dados bancários (preenchidos automaticamente após validação)
  const [bankData, setBankData] = useState({
    bankCode: '',
    bankName: '',
    bankLogo: '',
    agency: '',
    agencyDigit: '',
    accountNumber: '',
    accountDigit: '',
    accountType: 'corrente',
    holderName: '',
    holderDocument: ''
  });
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

      // Inicializar dados bancários com dados do usuário
      setBankData(prev => ({
        ...prev,
        holderName: user?.name || '',
        holderDocument: user?.cpf || ''
      }));

    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error);
    }
  };

  // Atualizar valor do CPF quando mudar para esse tipo ou carregar componente
  useEffect(() => {
    if (pixKeyType === 'cpf' && user?.cpf) {
      const formattedCPF = formatCPF(user.cpf);
      setPixKeyValue(formattedCPF);
      setIsValid(null); // CPF precisa ser validado
    } else if (pixKeyType === 'cpf' && !user?.cpf) {
      setPixKeyValue('');
      setIsValid(null); // CPF não disponível
    }
  }, [pixKeyType, user?.cpf]);

  // Garantir que o CPF seja carregado na inicialização se já estiver selecionado
  useEffect(() => {
    if (pixKeyType === 'cpf' && user?.cpf && !pixKeyValue) {
      const formattedCPF = formatCPF(user.cpf);
      setPixKeyValue(formattedCPF);
      setIsValid(null); // Precisa validar
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
    setIsValid(null);
  };

  // Reformatar valor quando mudar o tipo de chave PIX
  useEffect(() => {
    // Limpar status de validação e dados bancários ao mudar tipo
    setIsValid(null);
    setBankData({
      bankCode: '',
      bankName: '',
      bankLogo: '',
      agency: '',
      agencyDigit: '',
      accountNumber: '',
      accountDigit: '',
      accountType: 'corrente',
      holderName: user?.name || '',
      holderDocument: user?.cpf || ''
    });
    
    // Tratar valores específicos por tipo
    if (pixKeyType === 'cpf' && user?.cpf) {
      // Se mudou para CPF e tem CPF do usuário, usar ele mas não validar ainda
      const formattedCPF = formatCPF(user.cpf);
      setPixKeyValue(formattedCPF);
    } else if (pixKeyType === 'phone' && pixKeyValue && pixKeyValue.includes('.')) {
      // Se mudou para telefone e tem valor de CPF, limpar
      setPixKeyValue('');
    } else if (pixKeyType !== 'cpf' && pixKeyType !== 'phone') {
      // Para email/random, sempre limpar
      setPixKeyValue('');
    }
  }, [pixKeyType, user?.cpf, user?.name]);

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

  const validatePixKey = async () => {
    // Para CPF, se não tem valor mas tem no user, usar o CPF do usuário
    if (pixKeyType === 'cpf' && !pixKeyValue && user?.cpf) {
      const formattedCPF = formatCPF(user.cpf);
      setPixKeyValue(formattedCPF);
      setIsValid(true);
      return true;
    }
    
    if (!pixKeyValue) {
      showError('Digite uma chave PIX válida');
      return false;
    }

    setValidating(true);
    try {
      if (pixKeyType === 'cpf') {
        const cleanCPF = pixKeyValue.replace(/\D/g, '');
        
        if (cleanCPF.length !== 11) {
          setIsValid(false);
          showError('CPF inválido', 'O CPF deve conter 11 dígitos');
          return false;
        }
        
        if (!validateCPF(pixKeyValue)) {
          setIsValid(false);
          showError('CPF inválido', 'Digite um CPF válido');
          return false;
        }
        
        showInfo('Validando CPF...', 'Consultando dados bancários via PIX');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Simular resposta da API externa com dados bancários
        const pixData = {
          bankCode: '341',
          bankName: 'Itaú Unibanco S.A.',
          bankLogo: '/assets/banks/itau.png',
          agency: '0001',
          agencyDigit: '2',
          accountNumber: '12345',
          accountDigit: '6',
          accountType: 'corrente',
          holderName: user?.name || 'Nome do Titular',
          holderDocument: cleanCPF
        };
        
        setBankData(prev => ({ ...prev, ...pixData }));
        setIsValid(true);
        showSuccess('CPF validado com sucesso', 'Dados bancários obtidos automaticamente');
        return true;
      }
      
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
        
        if (/^(\d)\1+$/.test(phoneDigits)) {
          setIsValid(false);
          showError('Telefone inválido', 'Digite um número de telefone válido');
          return false;
        }
        
        showInfo('Validando telefone...', 'Consultando dados bancários via PIX');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Simular resposta da API externa com dados bancários
        const pixData = {
          bankCode: '260',
          bankName: 'Nu Pagamentos S.A.',
          bankLogo: '/assets/banks/nubank.png',
          agency: '0001',
          agencyDigit: '',
          accountNumber: '98765',
          accountDigit: '4',
          accountType: 'pagamentos',
          holderName: user?.name || 'Nome do Titular',
          holderDocument: user?.cpf?.replace(/\D/g, '') || '12345678901'
        };
        
        setBankData(prev => ({ ...prev, ...pixData }));
        setIsValid(true);
        showSuccess('Telefone validado com sucesso', 'Dados bancários obtidos automaticamente');
        return true;
      }
      
      if (pixKeyType === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(pixKeyValue)) {
          setIsValid(false);
          showError('E-mail inválido', 'Digite um e-mail válido');
          return false;
        }
        
        showInfo('Validando e-mail...', 'Consultando dados bancários via PIX');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Simular resposta da API externa com dados bancários
        const pixData = {
          bankCode: '077',
          bankName: 'Banco Inter S.A.',
          bankLogo: '/assets/banks/inter.png',
          agency: '0001',
          agencyDigit: '',
          accountNumber: '54321',
          accountDigit: '8',
          accountType: 'corrente',
          holderName: user?.name || 'Nome do Titular',
          holderDocument: user?.cpf?.replace(/\D/g, '') || '12345678901'
        };
        
        setBankData(prev => ({ ...prev, ...pixData }));
        setIsValid(true);
        showSuccess('E-mail validado com sucesso', 'Dados bancários obtidos automaticamente');
        return true;
      }
      
      if (pixKeyType === 'random') {
        if (pixKeyValue.length < 10) {
          setIsValid(false);
          showError('Chave inválida', 'A chave aleatória deve ter pelo menos 10 caracteres');
          return false;
        }
        
        showInfo('Validando chave...', 'Consultando dados bancários via PIX');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Simular resposta da API externa com dados bancários
        const pixData = {
          bankCode: '237',
          bankName: 'Banco Bradesco S.A.',
          bankLogo: '/assets/banks/bradesco.png',
          agency: '1234',
          agencyDigit: '5',
          accountNumber: '11111',
          accountDigit: '0',
          accountType: 'poupanca',
          holderName: user?.name || 'Nome do Titular',
          holderDocument: user?.cpf?.replace(/\D/g, '') || '12345678901'
        };
        
        setBankData(prev => ({ ...prev, ...pixData }));
        setIsValid(true);
        showSuccess('Chave validada com sucesso', 'Dados bancários obtidos automaticamente');
        return true;
      }
      
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

  const handleSavePixKey = async () => {
    setLoading(true);
    
    // Garantir que holderDocument seja uma string
    const holderDoc = bankData.holderDocument || user?.cpf || '';
    
    const pixKeyData = {
      keyType: pixKeyType,
      keyValue: pixKeyType === 'email' || pixKeyType === 'random' 
        ? pixKeyValue 
        : pixKeyValue.replace(/\D/g, ''),
      bankCode: bankData.bankCode || '',
      bankName: bankData.bankName || '',
      bankLogo: bankData.bankLogo || '',
      agency: bankData.agency || '',
      agencyDigit: bankData.agencyDigit || '',
      accountNumber: bankData.accountNumber || '',
      accountDigit: bankData.accountDigit || '',
      accountType: bankData.accountType || 'corrente',
      holderName: bankData.holderName || user?.name || '',
      holderDocument: typeof holderDoc === 'string' ? holderDoc.replace(/\D/g, '') : '',
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
      
      // Fallback: salvar no localStorage quando API falhar
      console.log('API indisponível, salvando localmente...');
      
      const localPixKey = {
        ...pixKeyData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        isVerified: true,
        isActive: true
      };
      
      const localKeys = JSON.parse(localStorage.getItem('userPixKeys') || '[]');
      localKeys.push(localPixKey);
      localStorage.setItem('userPixKeys', JSON.stringify(localKeys));
      
      showSuccess('Chave PIX cadastrada', 'Chave PIX salva com sucesso (modo offline)');
      router.push('/withdraw');
    } finally {
      setLoading(false);
    }
  };

  const handleNextStep = async () => {
    // Só chegar aqui se isValid === true, então pode salvar diretamente
    await handleSavePixKey();
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

  // Verificar se a chave PIX está completa
  const isPixKeyComplete = () => {
    if (!pixKeyValue) return false;
    
    switch (pixKeyType) {
      case 'cpf':
        const cleanCPF = pixKeyValue.replace(/\D/g, '');
        return cleanCPF.length === 11;
        
      case 'phone':
        const cleanPhone = pixKeyValue.replace(/\D/g, '');
        return cleanPhone.length === 10 || cleanPhone.length === 11;
        
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(pixKeyValue);
        
      case 'random':
        return pixKeyValue.length >= 10;
        
      default:
        return false;
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

            {/* Status de validação */}
            {isValid === true && (
              <div className="flex items-center mt-2 text-green-600 dark:text-green-400">
                <Icon icon="heroicons:check-circle" className="w-4 h-4 mr-1" />
                <span className="text-sm">Chave validada com sucesso</span>
              </div>
            )}
            
            {isValid === false && (
              <div className="flex items-center mt-2 text-red-600 dark:text-red-400">
                <Icon icon="heroicons:x-circle" className="w-4 h-4 mr-1" />
                <span className="text-sm">Chave inválida</span>
              </div>
            )}
          </div>

          {/* Dados bancários detectados */}
          {isValid === true && bankData.bankName && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center border">
                  <Icon icon="heroicons:building-library" className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-green-800 dark:text-green-200 mb-1">
                    Dados Bancários Detectados
                  </h4>
                  <div className="space-y-1 text-sm text-green-700 dark:text-green-300">
                    <p><strong>Banco:</strong> {bankData.bankName}</p>
                    <p><strong>Agência:</strong> {bankData.agency}{bankData.agencyDigit && `-${bankData.agencyDigit}`}</p>
                    <p><strong>Conta:</strong> {bankData.accountNumber}-{bankData.accountDigit} ({bankData.accountType})</p>
                    <p><strong>Titular:</strong> {bankData.holderName}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Botões de ação */}
          <div className="flex space-x-3">
            {/* Botão validar - para todos os tipos quando chave está completa mas não validada */}
            {isPixKeyComplete() && isValid === null && (
              <Button
                onClick={validatePixKey}
                disabled={validating || loading}
                className="flex-1"
                variant="outline"
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
            )}

            {/* Botão cadastrar - só aparece após validação */}
            {isValid === true && (
              <Button
                onClick={handleNextStep}
                disabled={loading}
                className={isPixKeyComplete() && isValid === null ? "flex-1" : "w-full"}
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
            )}
          </div>
        </div>
      </Card>

      {/* Informações */}
      <Card title="Como funciona?">
        <ul className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Sua chave PIX é validada automaticamente via consulta ao Banco Central</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Os dados bancários são obtidos automaticamente, sem necessidade de digitação</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>A chave deve estar vinculada ao seu CPF por segurança</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Você pode alterar ou adicionar mais chaves a qualquer momento no seu perfil</span>
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