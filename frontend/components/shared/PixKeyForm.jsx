"use client";
import React, { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import Icon from '@/components/ui/Icon';
import { useAlertContext } from '@/contexts/AlertContext';
import useAuthStore from '@/store/authStore';
import pixKeysService from '@/services/pixKeys.service';
import banksService from '@/services/banks.service';

const PixKeyForm = ({ 
  onSuccess, 
  onCancel, 
  mode = 'withdraw', // 'withdraw', 'deposit', 'transfer'
  showTitle = true,
  className = ''
}) => {
  const { user } = useAuthStore();
  const { showSuccess, showError, showInfo } = useAlertContext();
  
  const [pixKeyType, setPixKeyType] = useState('cpf');
  const [pixKeyValue, setPixKeyValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [isValid, setIsValid] = useState(null);
  
  // Estados para dados bancários
  const [banks, setBanks] = useState([]);
  const [selectedBank, setSelectedBank] = useState(null);
  const [accountTypes, setAccountTypes] = useState([]);
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
  const [step, setStep] = useState(1);
  const [existingPixKeys, setExistingPixKeys] = useState([]);
  const [loadingBanks, setLoadingBanks] = useState(true);

  // Carregar dados iniciais
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoadingBanks(true);
      
      // Sempre usar dados locais para evitar erros de API
      setBanks([
        { code: '001', name: 'Banco do Brasil', shortName: 'BB', logo: '/assets/banks/bb.png', type: 'commercial' },
        { code: '341', name: 'Itaú', shortName: 'Itaú', logo: '/assets/banks/itau.png', type: 'commercial' },
        { code: '237', name: 'Bradesco', shortName: 'Bradesco', logo: '/assets/banks/bradesco.png', type: 'commercial' },
        { code: '104', name: 'Caixa', shortName: 'Caixa', logo: '/assets/banks/caixa.png', type: 'public' },
        { code: '033', name: 'Santander', shortName: 'Santander', logo: '/assets/banks/santander.png', type: 'commercial' },
        { code: '260', name: 'Nubank', shortName: 'Nubank', logo: '/assets/banks/nubank.png', type: 'digital' },
        { code: '077', name: 'Inter', shortName: 'Inter', logo: '/assets/banks/inter.png', type: 'digital' },
        { code: '323', name: 'Mercado Pago', shortName: 'Mercado Pago', logo: '/assets/banks/mp.png', type: 'digital' }
      ]);
      
      setAccountTypes([
        { value: 'corrente', label: 'Conta Corrente' },
        { value: 'poupanca', label: 'Conta Poupança' },
        { value: 'pagamentos', label: 'Conta de Pagamentos' },
        { value: 'salario', label: 'Conta Salário' }
      ]);

      // Inicializar dados bancários
      setBankData(prev => ({
        ...prev,
        holderName: user?.name || '',
        holderDocument: user?.cpf || ''
      }));

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoadingBanks(false);
    }
  };

  // Atualizar valor do CPF quando mudar
  useEffect(() => {
    if (pixKeyType === 'cpf' && user?.cpf) {
      const formattedCPF = formatCPF(user.cpf);
      setPixKeyValue(formattedCPF);
      setIsValid(true);
    }
  }, [pixKeyType, user?.cpf]);

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
    const cleanValue = value.replace(/\D/g, '');
    const limitedValue = cleanValue.slice(0, 11);
    
    if (limitedValue.length <= 2) {
      return limitedValue;
    } else if (limitedValue.length <= 6) {
      return `(${limitedValue.slice(0, 2)}) ${limitedValue.slice(2)}`;
    } else if (limitedValue.length === 10) {
      return `(${limitedValue.slice(0, 2)}) ${limitedValue.slice(2, 6)}-${limitedValue.slice(6)}`;
    } else if (limitedValue.length === 11) {
      return `(${limitedValue.slice(0, 2)}) ${limitedValue.slice(2, 7)}-${limitedValue.slice(7)}`;
    } else {
      return `(${limitedValue.slice(0, 2)}) ${limitedValue.slice(2)}`;
    }
  };

  const handlePixKeyChange = (value) => {
    let formattedValue = value;
    
    if (pixKeyType === 'phone') {
      formattedValue = formatPhone(value);
    }
    
    setPixKeyValue(formattedValue);
    setIsValid(null);
  };

  const validatePixKey = async () => {
    setValidating(true);
    try {
      // Validações simples locais
      if (pixKeyType === 'cpf') {
        setIsValid(true);
        showSuccess('CPF validado', 'O CPF corresponde ao titular da conta');
        return true;
      }
      
      if (pixKeyType === 'phone') {
        const phoneDigits = pixKeyValue.replace(/\D/g, '');
        if (phoneDigits.length !== 10 && phoneDigits.length !== 11) {
          setIsValid(false);
          showError('Telefone inválido', 'O telefone deve ter 10 ou 11 dígitos');
          return false;
        }
        setIsValid(true);
        showSuccess('Telefone validado');
        return true;
      }
      
      if (pixKeyType === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(pixKeyValue)) {
          setIsValid(false);
          showError('E-mail inválido');
          return false;
        }
        setIsValid(true);
        showSuccess('E-mail validado');
        return true;
      }
      
      if (pixKeyType === 'random') {
        if (pixKeyValue.length < 10) {
          setIsValid(false);
          showError('Chave inválida', 'A chave deve ter pelo menos 10 caracteres');
          return false;
        }
        setIsValid(true);
        showSuccess('Chave validada');
        return true;
      }
      
      return false;
    } finally {
      setValidating(false);
    }
  };

  const handleSavePixKey = async () => {
    setLoading(true);
    try {
      const pixKeyData = {
        keyType: pixKeyType,
        keyValue: pixKeyValue.replace(/\D/g, ''),
        holderName: bankData.holderName,
        holderDocument: bankData.holderDocument.replace(/\D/g, ''),
        isDefault: existingPixKeys.length === 0
      };

      // Tentar salvar na API
      try {
        const response = await pixKeysService.createPixKey(pixKeyData);
        if (response.success) {
          showSuccess('Chave PIX cadastrada', 'Sua chave PIX foi cadastrada com sucesso');
          if (onSuccess) {
            onSuccess(response.data.pixKey);
          }
          return;
        }
      } catch (apiError) {
        console.warn('API não disponível, salvando localmente');
      }

      // Fallback: salvar no localStorage
      const localPixKeys = JSON.parse(localStorage.getItem('userPixKeys') || '[]');
      const newPixKey = {
        ...pixKeyData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      };
      localPixKeys.push(newPixKey);
      localStorage.setItem('userPixKeys', JSON.stringify(localPixKeys));
      
      showSuccess('Chave PIX cadastrada', 'Sua chave PIX foi salva localmente');
      if (onSuccess) {
        onSuccess(newPixKey);
      }
    } catch (error) {
      console.error('Erro ao salvar chave PIX:', error);
      showError('Erro ao salvar', 'Não foi possível salvar a chave PIX');
    } finally {
      setLoading(false);
    }
  };

  const handleNextStep = async () => {
    const isValidKey = await validatePixKey();
    if (!isValidKey) return;
    
    // Skip banking step - save directly
    await handleSavePixKey();
  };

  const handleBankSelect = (bank) => {
    setSelectedBank(bank);
    setBankData(prev => ({
      ...prev,
      bankCode: bank.code,
      bankName: bank.name,
      bankLogo: bank.logo
    }));
  };

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
    <div className={`space-y-6 ${className}`}>
      {showTitle && (
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Cadastrar Chave PIX
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Configure sua chave PIX para {mode === 'withdraw' ? 'receber saques' : 'transações'}
          </p>
        </div>
      )}

      {/* Etapa 1: Chave PIX */}
      {step === 1 && (
        <Card>
          <div className="space-y-6">
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

            <div>
              {pixKeyType === 'cpf' ? (
                <div>
                  <label className="form-label">Chave PIX (CPF)</label>
                  <input
                    type="text"
                    className="form-control py-2"
                    value={pixKeyValue || (user?.cpf ? formatCPF(user.cpf) : '')}
                    readOnly
                    placeholder={!user?.cpf ? "CPF não encontrado" : ""}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Usando o CPF cadastrado em sua conta
                  </p>
                </div>
              ) : (
                <div>
                  <label className="form-label">Chave PIX</label>
                  <input
                    type="text"
                    className="form-control py-2"
                    placeholder={
                      pixKeyType === 'email' ? 'seu@email.com' :
                      pixKeyType === 'phone' ? '(11) 98765-4321' :
                      'Digite sua chave'
                    }
                    value={pixKeyValue}
                    onChange={(e) => handlePixKeyChange(e.target.value)}
                    disabled={validating}
                  />
                </div>
              )}
              
              {isValid === true && (
                <div className="flex items-center mt-2 text-green-600 dark:text-green-400">
                  <Icon icon="heroicons:check-circle" className="h-4 w-4 mr-1" />
                  <span className="text-sm">Chave PIX válida</span>
                </div>
              )}
            </div>

            <div className="flex space-x-3">
              {onCancel && (
                <Button onClick={onCancel} variant="outline" className="flex-1">
                  Cancelar
                </Button>
              )}
              
              {pixKeyType === 'cpf' && (pixKeyValue || user?.cpf) && (
                <Button onClick={handleNextStep} disabled={loading} className="flex-1">
                  {loading ? 'Salvando...' : 'Cadastrar Chave PIX'}
                </Button>
              )}

              {pixKeyType !== 'cpf' && isPixKeyComplete() && isValid === null && (
                <Button
                  onClick={validatePixKey}
                  disabled={validating}
                  className="flex-1"
                  variant="outline"
                >
                  {validating ? 'Validando...' : 'Validar Chave'}
                </Button>
              )}

              {pixKeyType !== 'cpf' && isValid === true && (
                <Button onClick={handleNextStep} disabled={loading} className="flex-1">
                  {loading ? 'Salvando...' : 'Cadastrar Chave PIX'}
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Etapa 2: Dados Bancários */}
      {step === 2 && (
        <Card>
          <div className="space-y-6">
            <div>
              <label className="form-label">Selecione seu Banco</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {banks.map((bank) => (
                  <button
                    key={bank.code}
                    type="button"
                    onClick={() => handleBankSelect(bank)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      selectedBank?.code === bank.code
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <span className="text-xs font-medium">{bank.shortName}</span>
                  </button>
                ))}
              </div>
            </div>

            {selectedBank && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Agência</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="0001"
                      value={bankData.agency}
                      onChange={(e) => setBankData(prev => ({ ...prev, agency: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="form-label">Dígito</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="1"
                      maxLength="1"
                      value={bankData.agencyDigit}
                      onChange={(e) => setBankData(prev => ({ ...prev, agencyDigit: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Conta</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="12345"
                      value={bankData.accountNumber}
                      onChange={(e) => setBankData(prev => ({ ...prev, accountNumber: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="form-label">Dígito</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="6"
                      maxLength="2"
                      value={bankData.accountDigit}
                      onChange={(e) => setBankData(prev => ({ ...prev, accountDigit: e.target.value }))}
                    />
                  </div>
                </div>

                <Select
                  options={accountTypes}
                  label="Tipo de Conta"
                  value={bankData.accountType}
                  onChange={(e) => setBankData(prev => ({ ...prev, accountType: e.target.value }))}
                />

                <div>
                  <label className="form-label">Nome do Titular</label>
                  <input
                    type="text"
                    className="form-control"
                    value={bankData.holderName}
                    onChange={(e) => setBankData(prev => ({ ...prev, holderName: e.target.value }))}
                  />
                </div>
              </>
            )}

            <div className="flex space-x-3">
              <Button onClick={() => setStep(1)} variant="outline" className="flex-1">
                <Icon icon="heroicons:arrow-left" className="h-5 w-5 mr-2" />
                Voltar
              </Button>
              
              {selectedBank && bankData.agency && bankData.accountNumber && bankData.accountDigit && (
                <Button onClick={handleSavePixKey} disabled={loading} className="flex-1">
                  {loading ? 'Salvando...' : 'Cadastrar Chave PIX'}
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default PixKeyForm;