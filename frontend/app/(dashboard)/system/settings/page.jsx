"use client";
import React, { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Textinput from '@/components/ui/Textinput';
import Select from '@/components/ui/Select';
import { useAlertContext } from '@/contexts/AlertContext';
import api from '@/services/api';
import { 
  Save, 
  Shield, 
  DollarSign, 
  Mail, 
  Database, 
  Server, 
  Globe,
  Bell,
  Key,
  Settings,
  AlertTriangle,
  Coins,
  Plus,
  Eye,
  EyeOff,
  Trash2,
  CheckCircle,
  XCircle,
  Edit3,
  Users,
  Layers,
  Link
} from 'lucide-react';

const SystemSettingsPage = () => {
  const { showSuccess, showError, showInfo, showWarning } = useAlertContext();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  
  // Token management states
  const [tokens, setTokens] = useState([]);
  const [loadingTokens, setLoadingTokens] = useState(false);
  const [showTokenForm, setShowTokenForm] = useState(false);
  const [tokenForm, setTokenForm] = useState({
    address: '',
    network: 'testnet',
    contractType: 'token',
    adminAddress: '',
    website: '',
    description: ''
  });

  // Stake contracts management states
  const [stakeContracts, setStakeContracts] = useState([]);
  const [loadingStakeContracts, setLoadingStakeContracts] = useState(false);
  const [showStakeForm, setShowStakeForm] = useState(false);
  const [stakeForm, setStakeForm] = useState({
    address: '',
    tokenAddress: '',
    network: 'testnet',
    name: '',
    description: '',
    adminAddress: ''
  });

  // Role management states
  const [selectedAddress, setSelectedAddress] = useState('');
  const [selectedContract, setSelectedContract] = useState('');
  const [addressRoles, setAddressRoles] = useState({});
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [grantingRole, setGrantingRole] = useState(false);
  
  const [settings, setSettings] = useState({
    general: {
      platformName: 'Coinage',
      platformDescription: 'Plataforma líder em criptomoedas',
      timezone: 'America/Sao_Paulo',
      language: 'pt-BR',
      currency: 'BRL',
      maintenanceMode: false
    },
    security: {
      passwordMinLength: 8,
      twoFactorRequired: true,
      maxLoginAttempts: 5,
      sessionTimeout: 30,
      ipWhitelist: '',
      apiRateLimit: 100
    },
    financial: {
      minDeposit: 10,
      maxDeposit: 50000,
      minWithdraw: 10,
      maxWithdraw: 50000,
      transferFee: 0.5,
      exchangeFee: 0.3,
      pixFee: 0,
      tedFee: 8.90
    },
    email: {
      smtpHost: 'smtp.gmail.com',
      smtpPort: 587,
      smtpUser: 'noreply@coinage.com',
      smtpPassword: '••••••••',
      fromEmail: 'noreply@coinage.com',
      fromName: 'Coinage',
      enableNotifications: true
    },
    api: {
      enablePublicApi: true,
      enableWebhooks: true,
      webhookSecret: '••••••••••••••••',
      apiVersion: 'v1',
      rateLimit: 1000,
      enableCors: true
    },
    database: {
      backupFrequency: 'daily',
      retentionDays: 30,
      autoBackup: true,
      encryptionEnabled: true
    }
  });

  const tabs = [
    { id: 'general', label: 'Geral', icon: Settings },
    { id: 'security', label: 'Segurança', icon: Shield },
    { id: 'financial', label: 'Financeiro', icon: DollarSign },
    { id: 'tokens', label: 'Tokens', icon: Coins },
    { id: 'stakes', label: 'Contratos Stake', icon: Layers },
    { id: 'roles', label: 'Roles & Permissões', icon: Users },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'api', label: 'API', icon: Server },
    { id: 'database', label: 'Banco de Dados', icon: Database }
  ];

  const timezones = [
    { value: 'America/Sao_Paulo', label: 'São Paulo (UTC-3)' },
    { value: 'America/New_York', label: 'New York (UTC-5)' },
    { value: 'Europe/London', label: 'London (UTC+0)' },
    { value: 'Asia/Tokyo', label: 'Tokyo (UTC+9)' }
  ];

  const languages = [
    { value: 'pt-BR', label: 'Português (Brasil)' },
    { value: 'en-US', label: 'English (US)' },
    { value: 'es-ES', label: 'Español' }
  ];

  const currencies = [
    { value: 'BRL', label: 'Real Brasileiro (BRL)' },
    { value: 'USD', label: 'Dólar Americano (USD)' },
    { value: 'EUR', label: 'Euro (EUR)' }
  ];

  const backupFrequencies = [
    { value: 'hourly', label: 'A cada hora' },
    { value: 'daily', label: 'Diariamente' },
    { value: 'weekly', label: 'Semanalmente' },
    { value: 'monthly', label: 'Mensalmente' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      showSuccess('Configurações atualizadas com sucesso!');
    } catch (error) {
      showError('Erro ao atualizar configurações. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (section, field, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleToggle = (section, field) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: !prev[section][field]
      }
    }));
  };

  // Token management functions
  const fetchTokens = async () => {
    setLoadingTokens(true);
    try {
      const response = await api.get('/api/tokens');
      if (response.data.success) {
        setTokens(response.data.data?.tokens || []);
      } else {
        showError('Erro ao carregar tokens');
      }
    } catch (error) {
      console.error('Error fetching tokens:', error);
      showError('Erro ao carregar tokens');
    } finally {
      setLoadingTokens(false);
    }
  };

  const handleTokenSubmit = async () => {
    setLoading(true);

    try {
      const response = await api.post('/api/tokens/register', tokenForm);

      if (response.data.success) {
        showSuccess(`Token ${response.data.data.tokenInfo.isUpdate ? 'atualizado' : 'registrado'} com sucesso!`);
        setShowTokenForm(false);
        setTokenForm({
          address: '',
          network: 'testnet',
          contractType: 'token',
          adminAddress: '',
          website: '',
          description: ''
        });
        fetchTokens();
      } else {
        showError(response.data.message || 'Erro ao registrar token');
      }
    } catch (error) {
      console.error('Error registering token:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Erro ao registrar token';
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleTokenActivate = async (contractAddress, isActive) => {
    // Atualização otimista - atualizar o estado local imediatamente
    setTokens(prevTokens => 
      prevTokens.map(token => 
        token.address === contractAddress 
          ? { ...token, isActive: !isActive }
          : token
      )
    );

    try {
      const endpoint = isActive ? 'deactivate' : 'activate';
      const response = await api.post(`/api/tokens/${contractAddress}/${endpoint}`);

      if (response.data.success) {
        showSuccess(`Token ${isActive ? 'desativado' : 'ativado'} com sucesso!`);
        // Buscar tokens atualizados do servidor para sincronizar
        await fetchTokens();
      } else {
        // Reverter a mudança otimista se falhar
        setTokens(prevTokens => 
          prevTokens.map(token => 
            token.address === contractAddress 
              ? { ...token, isActive: isActive }
              : token
          )
        );
        showError(response.data.message || 'Erro ao alterar status do token');
      }
    } catch (error) {
      console.error('Error changing token status:', error);
      // Reverter a mudança otimista se falhar
      setTokens(prevTokens => 
        prevTokens.map(token => 
          token.address === contractAddress 
            ? { ...token, isActive: isActive }
            : token
        )
      );
      const errorMessage = error.response?.data?.message || error.message || 'Erro ao alterar status do token';
      showError(errorMessage);
    }
  };

  // ===== STAKE CONTRACTS FUNCTIONS =====
  
  const fetchStakeContracts = async () => {
    try {
      setLoadingStakeContracts(true);
      
      // Try to fetch from API first
      try {
        const response = await api.get('/api/stake-contracts');
        if (response.data.success) {
          setStakeContracts(response.data.data);
          return;
        }
      } catch (apiError) {
        console.warn('API not available, using fallback data:', apiError.message);
      }
      
      // No fallback data - start with empty list
      setStakeContracts([]);
      
      console.warn('API não disponível - lista de contratos iniciada vazia');
    } catch (error) {
      console.error('Error fetching stake contracts:', error);
      showError('Erro ao carregar contratos de stake');
    } finally {
      setLoadingStakeContracts(false);
    }
  };

  const handleStakeSubmit = async () => {
    setLoading(true);
    try {
      let newContract;
      
      // Try to save to API first
      try {
        const response = await api.post('/api/stake-contracts', stakeForm);
        if (response.data.success) {
          newContract = response.data.data;
          showSuccess('Contrato de stake registrado no banco de dados!');
        }
      } catch (apiError) {
        console.warn('API not available, using local data:', apiError.message);
        // Fallback to local state only
        newContract = {
          id: Date.now(),
          ...stakeForm,
          isActive: true,
          createdAt: new Date().toISOString(),
          isFallbackData: true
        };
        showWarning('Contrato registrado localmente - API não disponível');
      }
      
      setStakeContracts(prev => [...prev, newContract]);
      setShowStakeForm(false);
      setStakeForm({
        address: '',
        tokenAddress: '',
        network: 'testnet',
        name: '',
        description: '',
        adminAddress: ''
      });
      
    } catch (error) {
      console.error('Error registering stake contract:', error);
      showError('Erro ao registrar contrato de stake');
    } finally {
      setLoading(false);
    }
  };

  // ===== ROLE MANAGEMENT FUNCTIONS =====
  
  const checkAddressRoles = async () => {
    if (!selectedAddress || !selectedContract) {
      showWarning('Selecione um endereço e contrato');
      return;
    }

    try {
      setLoadingRoles(true);
      // Mock role checking - would use roleService
      const mockRoles = {
        DEFAULT_ADMIN_ROLE: selectedAddress === '0x5528C065931f523CA9F3a6e49a911896fb1D2e6f',
        MINTER_ROLE: false,
        TRANSFER_ROLE: selectedContract === '0xe21fc42e8c8758f6d999328228721F7952e5988d',
        BURNER_ROLE: false
      };
      
      setAddressRoles(mockRoles);
      showInfo(`Roles verificadas para ${selectedAddress.slice(0,6)}...${selectedAddress.slice(-4)}`);
    } catch (error) {
      showError('Erro ao verificar roles');
    } finally {
      setLoadingRoles(false);
    }
  };

  const handleGrantRole = async (roleKey) => {
    if (!selectedAddress || !selectedContract) {
      showWarning('Selecione um endereço e contrato');
      return;
    }

    try {
      setGrantingRole(true);
      // Mock grant role - would use roleService
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setAddressRoles(prev => ({
        ...prev,
        [roleKey]: true
      }));
      
      showSuccess(`Role ${roleKey} concedida com sucesso!`);
    } catch (error) {
      showError('Erro ao conceder role');
    } finally {
      setGrantingRole(false);
    }
  };

  // Load data when specific tabs are active
  useEffect(() => {
    if (activeTab === 'tokens') {
      fetchTokens();
    } else if (activeTab === 'stakes') {
      fetchStakeContracts();
    }
  }, [activeTab]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Configurações Globais
        </h1>
        <div className="flex items-center space-x-2">
          <div className="flex items-center text-yellow-600 bg-yellow-100 px-3 py-1 rounded-full text-sm">
            <AlertTriangle size={16} className="mr-1" />
            Configurações Críticas
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar com Tabs */}
        <div className="lg:col-span-1">
          <Card>
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                        : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon size={16} className="mr-3" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </Card>
        </div>

        {/* Conteúdo das Configurações */}
        <div className="lg:col-span-3">
          <form onSubmit={handleSubmit}>
            {activeTab === 'general' && (
              <Card title="Configurações Gerais" icon="heroicons-outline:cog-6-tooth">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Textinput
                      label="Nome da Plataforma"
                      value={settings.general.platformName}
                      onChange={(e) => handleInputChange('general', 'platformName', e.target.value)}
                      required
                    />
                    <Textinput
                      label="Descrição"
                      value={settings.general.platformDescription}
                      onChange={(e) => handleInputChange('general', 'platformDescription', e.target.value)}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Select
                      label="Fuso Horário"
                      options={timezones}
                      value={settings.general.timezone}
                      onChange={(value) => handleInputChange('general', 'timezone', value)}
                    />
                    <Select
                      label="Idioma Padrão"
                      options={languages}
                      value={settings.general.language}
                      onChange={(value) => handleInputChange('general', 'language', value)}
                    />
                    <Select
                      label="Moeda Principal"
                      options={currencies}
                      value={settings.general.currency}
                      onChange={(value) => handleInputChange('general', 'currency', value)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Modo Manutenção</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Desabilita o acesso de usuários à plataforma
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.general.maintenanceMode}
                        onChange={() => handleToggle('general', 'maintenanceMode')}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </Card>
            )}

            {activeTab === 'security' && (
              <Card title="Configurações de Segurança" icon="heroicons-outline:shield-check">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Textinput
                      label="Comprimento Mínimo da Senha"
                      type="number"
                      value={settings.security.passwordMinLength}
                      onChange={(e) => handleInputChange('security', 'passwordMinLength', parseInt(e.target.value))}
                      min="6"
                      max="20"
                    />
                    <Textinput
                      label="Máximo de Tentativas de Login"
                      type="number"
                      value={settings.security.maxLoginAttempts}
                      onChange={(e) => handleInputChange('security', 'maxLoginAttempts', parseInt(e.target.value))}
                      min="3"
                      max="10"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Textinput
                      label="Timeout da Sessão (minutos)"
                      type="number"
                      value={settings.security.sessionTimeout}
                      onChange={(e) => handleInputChange('security', 'sessionTimeout', parseInt(e.target.value))}
                      min="5"
                      max="120"
                    />
                    <Textinput
                      label="Rate Limit API (req/min)"
                      type="number"
                      value={settings.security.apiRateLimit}
                      onChange={(e) => handleInputChange('security', 'apiRateLimit', parseInt(e.target.value))}
                      min="10"
                      max="1000"
                    />
                  </div>

                  <Textinput
                    label="Whitelist de IPs (separados por vírgula)"
                    value={settings.security.ipWhitelist}
                    onChange={(e) => handleInputChange('security', 'ipWhitelist', e.target.value)}
                    placeholder="192.168.1.1, 10.0.0.1"
                  />

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">2FA Obrigatório</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Exige autenticação de dois fatores para todos os usuários
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.security.twoFactorRequired}
                        onChange={() => handleToggle('security', 'twoFactorRequired')}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </Card>
            )}

            {activeTab === 'financial' && (
              <Card title="Configurações Financeiras" icon="heroicons-outline:currency-dollar">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Textinput
                      label="Depósito Mínimo (R$)"
                      type="number"
                      value={settings.financial.minDeposit}
                      onChange={(e) => handleInputChange('financial', 'minDeposit', parseFloat(e.target.value))}
                      step="0.01"
                    />
                    <Textinput
                      label="Depósito Máximo (R$)"
                      type="number"
                      value={settings.financial.maxDeposit}
                      onChange={(e) => handleInputChange('financial', 'maxDeposit', parseFloat(e.target.value))}
                      step="0.01"
                    />
                    <Textinput
                      label="Saque Mínimo (R$)"
                      type="number"
                      value={settings.financial.minWithdraw}
                      onChange={(e) => handleInputChange('financial', 'minWithdraw', parseFloat(e.target.value))}
                      step="0.01"
                    />
                    <Textinput
                      label="Saque Máximo (R$)"
                      type="number"
                      value={settings.financial.maxWithdraw}
                      onChange={(e) => handleInputChange('financial', 'maxWithdraw', parseFloat(e.target.value))}
                      step="0.01"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Textinput
                      label="Taxa de Transferência (%)"
                      type="number"
                      value={settings.financial.transferFee}
                      onChange={(e) => handleInputChange('financial', 'transferFee', parseFloat(e.target.value))}
                      step="0.01"
                    />
                    <Textinput
                      label="Taxa de Troca (%)"
                      type="number"
                      value={settings.financial.exchangeFee}
                      onChange={(e) => handleInputChange('financial', 'exchangeFee', parseFloat(e.target.value))}
                      step="0.01"
                    />
                    <Textinput
                      label="Taxa PIX (R$)"
                      type="number"
                      value={settings.financial.pixFee}
                      onChange={(e) => handleInputChange('financial', 'pixFee', parseFloat(e.target.value))}
                      step="0.01"
                    />
                    <Textinput
                      label="Taxa TED (R$)"
                      type="number"
                      value={settings.financial.tedFee}
                      onChange={(e) => handleInputChange('financial', 'tedFee', parseFloat(e.target.value))}
                      step="0.01"
                    />
                  </div>
                </div>
              </Card>
            )}

            {activeTab === 'email' && (
              <Card title="Configurações de Email" icon="heroicons-outline:envelope">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Textinput
                      label="Host SMTP"
                      value={settings.email.smtpHost}
                      onChange={(e) => handleInputChange('email', 'smtpHost', e.target.value)}
                    />
                    <Textinput
                      label="Porta SMTP"
                      type="number"
                      value={settings.email.smtpPort}
                      onChange={(e) => handleInputChange('email', 'smtpPort', parseInt(e.target.value))}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Textinput
                      label="Usuário SMTP"
                      value={settings.email.smtpUser}
                      onChange={(e) => handleInputChange('email', 'smtpUser', e.target.value)}
                    />
                    <Textinput
                      label="Senha SMTP"
                      type="password"
                      value={settings.email.smtpPassword}
                      onChange={(e) => handleInputChange('email', 'smtpPassword', e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Textinput
                      label="Email Remetente"
                      type="email"
                      value={settings.email.fromEmail}
                      onChange={(e) => handleInputChange('email', 'fromEmail', e.target.value)}
                    />
                    <Textinput
                      label="Nome Remetente"
                      value={settings.email.fromName}
                      onChange={(e) => handleInputChange('email', 'fromName', e.target.value)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Notificações por Email</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Habilita o envio automático de notificações
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.email.enableNotifications}
                        onChange={() => handleToggle('email', 'enableNotifications')}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </Card>
            )}

            {activeTab === 'api' && (
              <Card title="Configurações da API" icon="heroicons-outline:server">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Textinput
                      label="Versão da API"
                      value={settings.api.apiVersion}
                      onChange={(e) => handleInputChange('api', 'apiVersion', e.target.value)}
                      disabled
                    />
                    <Textinput
                      label="Rate Limit (req/hora)"
                      type="number"
                      value={settings.api.rateLimit}
                      onChange={(e) => handleInputChange('api', 'rateLimit', parseInt(e.target.value))}
                    />
                  </div>

                  <Textinput
                    label="Webhook Secret"
                    type="password"
                    value={settings.api.webhookSecret}
                    onChange={(e) => handleInputChange('api', 'webhookSecret', e.target.value)}
                  />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">API Pública</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Permite acesso à API pública da plataforma
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.api.enablePublicApi}
                          onChange={() => handleToggle('api', 'enablePublicApi')}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">Webhooks</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Habilita o sistema de webhooks
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.api.enableWebhooks}
                          onChange={() => handleToggle('api', 'enableWebhooks')}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">CORS</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Habilita Cross-Origin Resource Sharing
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.api.enableCors}
                          onChange={() => handleToggle('api', 'enableCors')}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {activeTab === 'tokens' && (
              <Card title="Gerenciamento de Tokens" icon="heroicons-outline:circle-stack">
                <div className="space-y-6">
                  {/* Header com botão de adicionar */}
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Gerencie os tokens ERC20 registrados no sistema
                    </p>
                    <Button
                      onClick={() => setShowTokenForm(!showTokenForm)}
                      className="btn-primary"
                    >
                      <Plus size={16} className="mr-2" />
                      {showTokenForm ? 'Cancelar' : 'Registrar Token'}
                    </Button>
                  </div>

                  {/* Formulário de registro */}
                  {showTokenForm && (
                    <div className="p-4 border border-dashed border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-600">
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Textinput
                            label="Endereço do Contrato *"
                            value={tokenForm.address}
                            onChange={(e) => setTokenForm(prev => ({ ...prev, address: e.target.value }))}
                            placeholder="0x..."
                            required
                          />
                          <Select
                            label="Rede"
                            options={[
                              { value: 'testnet', label: 'Testnet' },
                              { value: 'mainnet', label: 'Mainnet' }
                            ]}
                            value={tokenForm.network}
                            onChange={(value) => setTokenForm(prev => ({ ...prev, network: value }))}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Select
                            label="Tipo de Contrato"
                            options={[
                              { value: 'token', label: 'Token ERC20' },
                              { value: 'stake', label: 'Staking' },
                              { value: 'exchange', label: 'Exchange/DEX' }
                            ]}
                            value={tokenForm.contractType}
                            onChange={(value) => setTokenForm(prev => ({ ...prev, contractType: value }))}
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Textinput
                            label="Admin Public Key (opcional)"
                            value={tokenForm.adminAddress}
                            onChange={(e) => setTokenForm(prev => ({ ...prev, adminAddress: e.target.value }))}
                            placeholder="0x..."
                          />
                          <Textinput
                            label="Website (opcional)"
                            value={tokenForm.website}
                            onChange={(e) => setTokenForm(prev => ({ ...prev, website: e.target.value }))}
                            placeholder="https://..."
                          />
                        </div>

                        <Textinput
                          label="Descrição (opcional)"
                          value={tokenForm.description}
                          onChange={(e) => setTokenForm(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Descrição do token..."
                        />

                        <div className="flex justify-end space-x-2">
                          <Button
                            type="button"
                            onClick={() => setShowTokenForm(false)}
                            className="btn-outline-secondary"
                          >
                            Cancelar
                          </Button>
                          <Button
                            onClick={handleTokenSubmit}
                            className="btn-primary"
                            isLoading={loading}
                          >
                            <Save size={16} className="mr-2" />
                            Registrar Token
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Lista de tokens */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      Tokens Registrados
                    </h4>
                    
                    {loadingTokens ? (
                      <div className="flex justify-center p-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    ) : tokens.length === 0 ? (
                      <div className="text-center p-8 text-gray-500 dark:text-gray-400">
                        <Coins size={48} className="mx-auto mb-4 opacity-50" />
                        <p>Nenhum token registrado</p>
                        <p className="text-sm">Clique em "Registrar Token" para começar</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700">
                              <th className="pb-3 font-semibold text-gray-700 dark:text-gray-300">Token</th>
                              <th className="pb-3 font-semibold text-gray-700 dark:text-gray-300">Símbolo</th>
                              <th className="pb-3 font-semibold text-gray-700 dark:text-gray-300">Endereço</th>
                              <th className="pb-3 font-semibold text-gray-700 dark:text-gray-300">Rede</th>
                              <th className="pb-3 font-semibold text-gray-700 dark:text-gray-300">Tipo</th>
                              <th className="pb-3 font-semibold text-gray-700 dark:text-gray-300">Status</th>
                              <th className="pb-3 font-semibold text-gray-700 dark:text-gray-300">Registrado em</th>
                              <th className="pb-3 font-semibold text-gray-700 dark:text-gray-300 text-center">Ações</th>
                            </tr>
                          </thead>
                          <tbody>
                            {tokens.map((token) => (
                              <tr key={token.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                <td className="py-4">
                                  <div className="flex items-center space-x-3">
                                    <img
                                      src={`/assets/images/currencies/${token.metadata?.symbol || token.symbol || 'DEFAULT'}.png`}
                                      alt={token.metadata?.symbol || token.symbol || 'Token'}
                                      className="w-10 h-10 rounded-full"
                                      onError={(e) => {
                                        e.target.src = '/assets/images/currencies/DEFAULT.png';
                                      }}
                                    />
                                    <span className="font-medium text-gray-900 dark:text-white">
                                      {token.metadata?.name || token.name || 'Token'}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-4">
                                  <span className="text-gray-600 dark:text-gray-400">
                                    {token.metadata?.symbol || token.symbol || 'N/A'}
                                  </span>
                                </td>
                                <td className="py-4">
                                  {token.network === 'testnet' ? (
                                    <a
                                      href={`https://floripa.azorescan.com/address/${token.address}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center hover:opacity-80 transition-opacity"
                                    >
                                      <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
                                        {token.address.slice(0, 6)}...{token.address.slice(-4)}
                                      </code>
                                    </a>
                                  ) : (
                                    <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">
                                      {token.address.slice(0, 6)}...{token.address.slice(-4)}
                                    </code>
                                  )}
                                </td>
                                <td className="py-4">
                                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                    {token.network}
                                  </span>
                                </td>
                                <td className="py-4">
                                  {token.metadata?.contractType && (
                                    <span className="px-2 py-1 rounded text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                                      {token.metadata.contractType}
                                    </span>
                                  )}
                                </td>
                                <td className="py-4">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    token.isActive 
                                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                  }`}>
                                    {token.isActive ? 'Ativo' : 'Inativo'}
                                  </span>
                                </td>
                                <td className="py-4 text-gray-600 dark:text-gray-400">
                                  {new Date(token.createdAt).toLocaleDateString('pt-BR')}
                                </td>
                                <td className="py-4 text-center">
                                  <button
                                    onClick={() => handleTokenActivate(token.address, token.isActive)}
                                    className={`p-2 rounded-lg transition-colors ${
                                      token.isActive 
                                        ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20' 
                                        : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                                    }`}
                                    title={token.isActive ? 'Desativar' : 'Ativar'}
                                  >
                                    {token.isActive ? <XCircle size={18} /> : <CheckCircle size={18} />}
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {activeTab === 'stakes' && (
              <Card title="Gerenciamento de Contratos de Stake" icon="heroicons-outline:server-stack">
                <div className="space-y-6">
                  {/* Header com botão de adicionar */}
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Gerencie os contratos de stake registrados no sistema
                    </p>
                    <Button
                      onClick={() => setShowStakeForm(!showStakeForm)}
                      className="btn-primary"
                    >
                      <Plus size={16} className="mr-2" />
                      {showStakeForm ? 'Cancelar' : 'Registrar Contrato'}
                    </Button>
                  </div>

                  {/* Formulário de registro de stake */}
                  {showStakeForm && (
                    <div className="p-4 border border-dashed border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-600">
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Textinput
                            label="Endereço do Contrato de Stake *"
                            value={stakeForm.address}
                            onChange={(e) => setStakeForm(prev => ({ ...prev, address: e.target.value }))}
                            placeholder="0x..."
                            required
                          />
                          <Textinput
                            label="Endereço do Token *"
                            value={stakeForm.tokenAddress}
                            onChange={(e) => setStakeForm(prev => ({ ...prev, tokenAddress: e.target.value }))}
                            placeholder="0x..."
                            required
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Select
                            label="Rede"
                            options={[
                              { value: 'testnet', label: 'Testnet' },
                              { value: 'mainnet', label: 'Mainnet' }
                            ]}
                            value={stakeForm.network}
                            onChange={(value) => setStakeForm(prev => ({ ...prev, network: value }))}
                          />
                          <Textinput
                            label="Nome do Contrato *"
                            value={stakeForm.name}
                            onChange={(e) => setStakeForm(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Ex: Pedacinho Pratique Lagoa"
                            required
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Textinput
                            label="Endereço do Admin (opcional)"
                            value={stakeForm.adminAddress}
                            onChange={(e) => setStakeForm(prev => ({ ...prev, adminAddress: e.target.value }))}
                            placeholder="0x..."
                          />
                          <div></div>
                        </div>

                        <Textinput
                          label="Descrição (opcional)"
                          value={stakeForm.description}
                          onChange={(e) => setStakeForm(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Descrição do contrato de stake..."
                        />

                        <div className="flex justify-end space-x-2">
                          <Button
                            onClick={() => setShowStakeForm(false)}
                            className="btn-secondary"
                          >
                            Cancelar
                          </Button>
                          <Button
                            onClick={handleStakeSubmit}
                            className="btn-primary"
                            isLoading={loading}
                          >
                            <Save size={16} className="mr-2" />
                            Registrar Contrato
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Lista de contratos de stake */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        Contratos Registrados
                      </h4>
                      {stakeContracts.some(contract => contract.isFallbackData) && (
                        <div className="flex items-center space-x-2 text-sm text-amber-600 dark:text-amber-400">
                          <AlertTriangle size={16} />
                          <span>Dados de demonstração</span>
                        </div>
                      )}
                    </div>
                    
                    {loadingStakeContracts ? (
                      <div className="flex justify-center p-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    ) : stakeContracts.length === 0 ? (
                      <div className="text-center p-8 text-gray-500 dark:text-gray-400">
                        <Layers size={48} className="mx-auto mb-4 opacity-50" />
                        <p>Nenhum contrato de stake registrado</p>
                        <p className="text-sm">Clique em "Registrar Contrato" para começar</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700">
                              <th className="pb-3 font-semibold text-gray-700 dark:text-gray-300">Nome</th>
                              <th className="pb-3 font-semibold text-gray-700 dark:text-gray-300">Endereço</th>
                              <th className="pb-3 font-semibold text-gray-700 dark:text-gray-300">Token</th>
                              <th className="pb-3 font-semibold text-gray-700 dark:text-gray-300">Rede</th>
                              <th className="pb-3 font-semibold text-gray-700 dark:text-gray-300">Status</th>
                              <th className="pb-3 font-semibold text-gray-700 dark:text-gray-300">Admin</th>
                              <th className="pb-3 font-semibold text-gray-700 dark:text-gray-300">Registrado em</th>
                            </tr>
                          </thead>
                          <tbody>
                            {stakeContracts.map((contract) => (
                              <tr key={contract.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                <td className="py-4">
                                  <div className="flex items-center space-x-3">
                                    <Layers className="w-8 h-8 text-blue-500" />
                                    <div>
                                      <span className="font-medium text-gray-900 dark:text-white">
                                        {contract.name}
                                      </span>
                                      {contract.description && (
                                        <p className="text-xs text-gray-500 mt-1">
                                          {contract.description}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="py-4">
                                  {contract.network === 'testnet' ? (
                                    <a
                                      href={`https://floripa.azorescan.com/address/${contract.address}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center hover:opacity-80 transition-opacity"
                                    >
                                      <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
                                        {contract.address.slice(0, 6)}...{contract.address.slice(-4)}
                                      </code>
                                      <Link size={12} className="ml-1 text-blue-500" />
                                    </a>
                                  ) : (
                                    <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">
                                      {contract.address.slice(0, 6)}...{contract.address.slice(-4)}
                                    </code>
                                  )}
                                </td>
                                <td className="py-4">
                                  <code className="bg-purple-100 dark:bg-purple-900 px-2 py-1 rounded text-xs text-purple-700 dark:text-purple-300">
                                    {contract.tokenAddress.slice(0, 6)}...{contract.tokenAddress.slice(-4)}
                                  </code>
                                </td>
                                <td className="py-4">
                                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                    {contract.network}
                                  </span>
                                </td>
                                <td className="py-4">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    contract.isActive 
                                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                  }`}>
                                    {contract.isActive ? 'Ativo' : 'Inativo'}
                                  </span>
                                </td>
                                <td className="py-4">
                                  {contract.adminAddress ? (
                                    <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">
                                      {contract.adminAddress.slice(0, 6)}...{contract.adminAddress.slice(-4)}
                                    </code>
                                  ) : (
                                    <span className="text-gray-400 text-xs">N/A</span>
                                  )}
                                </td>
                                <td className="py-4 text-gray-600 dark:text-gray-400">
                                  {new Date(contract.createdAt).toLocaleDateString('pt-BR')}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {activeTab === 'roles' && (
              <Card title="Gerenciamento de Roles" icon="heroicons-outline:users">
                <div className="space-y-6">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Verifique e conceda roles para endereços nos contratos de tokens e stake
                  </p>

                  {/* Formulário de verificação de roles */}
                  <div className="p-4 border border-dashed border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-600">
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-4">
                        Verificar Roles de Endereço
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Textinput
                          label="Endereço para verificar *"
                          value={selectedAddress}
                          onChange={(e) => setSelectedAddress(e.target.value)}
                          placeholder="0x..."
                          required
                        />
                        <Select
                          label="Contrato *"
                          options={[
                            { value: '0x0b5F5510160E27E6BFDe03914a18d555B590DAF5', label: 'PCN Token' },
                            { value: '0xe21fc42e8c8758f6d999328228721F7952e5988d', label: 'Stake Contract' },
                            { value: '0x5528C065931f523CA9F3a6e49a911896fb1D2e6f', label: 'Admin Token' }
                          ]}
                          value={selectedContract}
                          onChange={(value) => setSelectedContract(value)}
                        />
                      </div>

                      <div className="flex justify-end">
                        <Button
                          onClick={checkAddressRoles}
                          className="btn-primary"
                          isLoading={loadingRoles}
                          disabled={!selectedAddress || !selectedContract}
                        >
                          <Eye size={16} className="mr-2" />
                          Verificar Roles
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Resultado das roles */}
                  {Object.keys(addressRoles).length > 0 && (
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        Roles para {selectedAddress.slice(0, 6)}...{selectedAddress.slice(-4)}
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {Object.entries(addressRoles).map(([roleKey, hasRole]) => (
                          <div key={roleKey} className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-2">
                                {hasRole ? (
                                  <CheckCircle className="text-green-500" size={20} />
                                ) : (
                                  <XCircle className="text-red-500" size={20} />
                                )}
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {roleKey.replace('_ROLE', '').replace('_', ' ')}
                                </span>
                              </div>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                hasRole 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              }`}>
                                {hasRole ? 'TEM' : 'NÃO TEM'}
                              </span>
                            </div>
                            
                            {!hasRole && (
                              <Button
                                onClick={() => handleGrantRole(roleKey)}
                                className="btn-primary btn-sm w-full"
                                isLoading={grantingRole}
                                size="sm"
                              >
                                <Key size={14} className="mr-1" />
                                Conceder Role
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Informações importantes */}
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <AlertTriangle className="text-yellow-600 dark:text-yellow-400 flex-shrink-0" size={20} />
                      <div>
                        <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                          Informações Importantes
                        </h4>
                        <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                          <li>• <strong>TRANSFER_ROLE:</strong> Necessária para contratos de stake realizarem transferências</li>
                          <li>• <strong>ADMIN_ROLE:</strong> Permite conceder/revogar outras roles</li>
                          <li>• <strong>MINTER_ROLE:</strong> Permite criar novos tokens</li>
                          <li>• <strong>BURNER_ROLE:</strong> Permite queimar tokens</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {activeTab === 'database' && (
              <Card title="Configurações do Banco de Dados" icon="heroicons-outline:server">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Select
                      label="Frequência de Backup"
                      options={backupFrequencies}
                      value={settings.database.backupFrequency}
                      onChange={(value) => handleInputChange('database', 'backupFrequency', value)}
                    />
                    <Textinput
                      label="Retenção de Backups (dias)"
                      type="number"
                      value={settings.database.retentionDays}
                      onChange={(e) => handleInputChange('database', 'retentionDays', parseInt(e.target.value))}
                      min="7"
                      max="365"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">Backup Automático</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Realiza backups automaticamente na frequência definida
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.database.autoBackup}
                          onChange={() => handleToggle('database', 'autoBackup')}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">Criptografia</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Habilita criptografia para dados sensíveis
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.database.encryptionEnabled}
                          onChange={() => handleToggle('database', 'encryptionEnabled')}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            <div className="flex justify-end pt-6">
              <Button
                type="submit"
                className="btn-brand"
                isLoading={loading}
              >
                <Save size={16} className="mr-2" />
                Salvar Configurações
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SystemSettingsPage;