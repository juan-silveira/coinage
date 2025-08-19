"use client";
import React, { useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Textinput from '@/components/ui/Textinput';
import Select from '@/components/ui/Select';
import { useAlertContext } from '@/contexts/AlertContext';
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
  AlertTriangle
} from 'lucide-react';

const SystemSettingsPage = () => {
  const { showSuccess, showError, showInfo, showWarning } = useAlertContext();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  
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