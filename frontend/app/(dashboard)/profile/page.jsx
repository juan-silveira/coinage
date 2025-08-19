"use client";
import React, { useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Textinput from '@/components/ui/Textinput';
import Select from '@/components/ui/Select';
import { useAlertContext } from '@/contexts/AlertContext';
import { User, Mail, Phone, MapPin, Calendar, Edit, Save, Camera } from 'lucide-react';

const ProfilePage = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const { showSuccess, showError, showInfo, showWarning } = useAlertContext();
  
  const [profileData, setProfileData] = useState({
    name: 'Juan Silveira',
    email: 'juansilveira@gmail.com',
    phone: '+55 11 99999-9999',
    cpf: '123.456.789-00',
    birthDate: '1990-05-15',
    address: {
      street: 'Rua das Flores, 123',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234-567',
      country: 'Brasil'
    },
    preferences: {
      language: 'pt-BR',
      timezone: 'America/Sao_Paulo',
      currency: 'BRL',
      notifications: {
        email: true,
        sms: false,
        push: true,
        marketing: false
      }
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      showSuccess('Perfil atualizado com sucesso!');
      setIsEditing(false);
    } catch (error) {
      showError('Erro ao atualizar perfil. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setProfileData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setProfileData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const languages = [
    { value: 'pt-BR', label: 'Português (Brasil)' },
    { value: 'en-US', label: 'English (US)' },
    { value: 'es-ES', label: 'Español' }
  ];

  const timezones = [
    { value: 'America/Sao_Paulo', label: 'São Paulo (UTC-3)' },
    { value: 'America/New_York', label: 'New York (UTC-5)' },
    { value: 'Europe/London', label: 'London (UTC+0)' }
  ];

  const currencies = [
    { value: 'BRL', label: 'Real Brasileiro (BRL)' },
    { value: 'USD', label: 'Dólar Americano (USD)' },
    { value: 'EUR', label: 'Euro (EUR)' }
  ];

  const tabs = [
    { id: 'personal', label: 'Dados Pessoais', icon: User },
    { id: 'address', label: 'Endereço', icon: MapPin },
    { id: 'preferences', label: 'Preferências', icon: Edit }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Dados da Conta
        </h1>
        <Button
          onClick={() => setIsEditing(!isEditing)}
          variant={isEditing ? "outline" : "default"}
          className={isEditing ? "btn-outline-brand" : "btn-brand"}
        >
          {isEditing ? <Save size={16} className="mr-2" /> : <Edit size={16} className="mr-2" />}
          {isEditing ? 'Cancelar' : 'Editar'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Foto do Perfil */}
        <div className="lg:col-span-1">
          <Card title="Foto do Perfil">
            <div className="text-center">
              <div className="relative inline-block">
                <div className="w-32 h-32 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-4xl font-bold mx-auto mb-4">
                  JS
                </div>
                {isEditing && (
                  <button className="absolute bottom-2 right-2 bg-blue-500 text-white rounded-full p-2 hover:bg-blue-600">
                    <Camera size={16} />
                  </button>
                )}
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {profileData.name}
              </h3>
              <p className="text-sm text-gray-500">{profileData.email}</p>
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-center text-sm text-gray-600">
                  <Calendar size={16} className="mr-2" />
                  Membro desde Jan 2024
                </div>
                <div className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                  Conta Verificada
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Formulário */}
        <div className="lg:col-span-3">
          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon size={16} className="mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <form onSubmit={handleSubmit}>
            {activeTab === 'personal' && (
              <Card title="Informações Pessoais">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Textinput
                    label="Nome Completo"
                    value={profileData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    disabled={!isEditing}
                    required
                  />
                  <Textinput
                    label="Email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    disabled={true} // Email geralmente não pode ser alterado
                  />
                  <Textinput
                    label="Telefone"
                    value={profileData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    disabled={!isEditing}
                  />
                  <Textinput
                    label="CPF"
                    value={profileData.cpf}
                    onChange={(e) => handleInputChange('cpf', e.target.value)}
                    disabled={true} // CPF geralmente não pode ser alterado
                  />
                  <Textinput
                    label="Data de Nascimento"
                    type="date"
                    value={profileData.birthDate}
                    onChange={(e) => handleInputChange('birthDate', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
              </Card>
            )}

            {activeTab === 'address' && (
              <Card title="Endereço">
                <div className="space-y-6">
                  <Textinput
                    label="Endereço"
                    value={profileData.address.street}
                    onChange={(e) => handleInputChange('address.street', e.target.value)}
                    disabled={!isEditing}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Textinput
                      label="Cidade"
                      value={profileData.address.city}
                      onChange={(e) => handleInputChange('address.city', e.target.value)}
                      disabled={!isEditing}
                    />
                    <Textinput
                      label="Estado"
                      value={profileData.address.state}
                      onChange={(e) => handleInputChange('address.state', e.target.value)}
                      disabled={!isEditing}
                    />
                    <Textinput
                      label="CEP"
                      value={profileData.address.zipCode}
                      onChange={(e) => handleInputChange('address.zipCode', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <Textinput
                    label="País"
                    value={profileData.address.country}
                    onChange={(e) => handleInputChange('address.country', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
              </Card>
            )}

            {activeTab === 'preferences' && (
              <div className="space-y-6">
                <Card title="Preferências do Sistema">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Select
                      label="Idioma"
                      options={languages}
                      value={profileData.preferences.language}
                      onChange={(value) => handleInputChange('preferences.language', value)}
                      disabled={!isEditing}
                    />
                    <Select
                      label="Fuso Horário"
                      options={timezones}
                      value={profileData.preferences.timezone}
                      onChange={(value) => handleInputChange('preferences.timezone', value)}
                      disabled={!isEditing}
                    />
                    <Select
                      label="Moeda Principal"
                      options={currencies}
                      value={profileData.preferences.currency}
                      onChange={(value) => handleInputChange('preferences.currency', value)}
                      disabled={!isEditing}
                    />
                  </div>
                </Card>

                <Card title="Notificações">
                  <div className="space-y-4">
                    {Object.entries(profileData.preferences.notifications).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {key === 'email' && 'Notificações por Email'}
                            {key === 'sms' && 'Notificações por SMS'}
                            {key === 'push' && 'Notificações Push'}
                            {key === 'marketing' && 'Comunicações de Marketing'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {key === 'email' && 'Receber atualizações importantes por email'}
                            {key === 'sms' && 'Receber alertas de segurança por SMS'}
                            {key === 'push' && 'Notificações no navegador'}
                            {key === 'marketing' && 'Ofertas e novidades da plataforma'}
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={value}
                            onChange={(e) => handleInputChange(`preferences.notifications.${key}`, e.target.checked)}
                            disabled={!isEditing}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {isEditing && (
              <div className="flex justify-end space-x-4 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="btn-brand"
                  isLoading={loading}
                >
                  Salvar Alterações
                </Button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;