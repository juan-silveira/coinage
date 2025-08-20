"use client";
import React, { useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Textinput from '@/components/ui/Textinput';
import Select from '@/components/ui/Select';
import { useAlertContext } from '@/contexts/AlertContext';
import { Search, ArrowRight, User, Users } from 'lucide-react';

const TransferPage = () => {
  const [formData, setFormData] = useState({
    recipient: '',
    amount: '',
    description: '',
    transferType: 'internal'
  });
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const { showSuccess, showError, showInfo, showWarning } = useAlertContext();

  const transferTypes = [
    { value: 'internal', label: 'Transferência Interna (Coinage)' },
    { value: 'external', label: 'Transferência Externa (PIX/TED)' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      showSuccess('Transferência realizada com sucesso!');
      setFormData({
        recipient: '',
        amount: '',
        description: '',
        transferType: 'internal'
      });
    } catch (error) {
      showError('Erro ao processar transferência. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const searchUsers = async (query) => {
    if (!query || query.length < 3) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    // Simulate search API
    setTimeout(() => {
      setSearchResults([
        { id: 1, name: 'João Silva', email: 'joao@email.com', avatar: 'JS' },
        { id: 2, name: 'Maria Santos', email: 'maria@email.com', avatar: 'MS' },
        { id: 3, name: 'Pedro Oliveira', email: 'pedro@email.com', avatar: 'PO' }
      ]);
      setSearching(false);
    }, 500);
  };

  const selectUser = (user) => {
    setFormData(prev => ({
      ...prev,
      recipient: user.email
    }));
    setSearchResults([]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Transferir
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário de Transferência */}
        <div className="lg:col-span-2">
          <Card title="Nova Transferência" icon="heroicons-outline:switch-horizontal">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Tipo de Transferência */}
              <div>
                <Select
                  label="Tipo de Transferência"
                  options={transferTypes}
                  value={formData.transferType}
                  onChange={(value) => handleInputChange('transferType', value)}
                />
              </div>

              {/* Destinatário */}
              <div className="relative">
                <Textinput
                  label={formData.transferType === 'internal' ? 'Email do Destinatário' : 'Chave PIX / Dados Bancários'}
                  placeholder={formData.transferType === 'internal' ? 'usuario@email.com' : 'CPF, email ou telefone'}
                  value={formData.recipient}
                  onChange={(e) => {
                    handleInputChange('recipient', e.target.value);
                    if (formData.transferType === 'internal') {
                      searchUsers(e.target.value);
                    }
                  }}
                  required
                  suffix={<Search size={16} className="text-gray-400" />}
                />
                
                {/* Resultados da busca */}
                {formData.transferType === 'internal' && searchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg">
                    {searchResults.map((user) => (
                      <div
                        key={user.id}
                        onClick={() => selectUser(user)}
                        className="flex items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                      >
                        <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">
                          {user.avatar}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {user.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Valor */}
              <div>
                <Textinput
                  label="Valor (R$)"
                  type="number"
                  placeholder="0,00"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  required
                  step="0.01"
                  min="0.01"
                />
              </div>

              {/* Descrição */}
              <div>
                <Textinput
                  label="Descrição (Opcional)"
                  placeholder="Motivo da transferência"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                />
              </div>

              {/* Resumo */}
              {formData.amount && formData.recipient && (
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Resumo da Transferência
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Destinatário:</span>
                      <span className="font-medium">{formData.recipient}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Valor:</span>
                      <span className="font-medium">R$ {formData.amount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Taxa:</span>
                      <span className="font-medium">
                        {formData.transferType === 'internal' ? 'Grátis' : 'R$ 2,50'}
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-gray-900 dark:text-white font-medium">Total:</span>
                      <span className="font-bold">
                        R$ {(parseFloat(formData.amount || 0) + (formData.transferType === 'internal' ? 0 : 2.5)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full btn-brand"
                isLoading={loading}
                disabled={!formData.amount || !formData.recipient}
              >
                <ArrowRight size={16} className="mr-2" />
                Transferir
              </Button>
            </form>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Saldo */}
          <Card title="Saldo Disponível">
            <div className="text-center py-4">
              <div className="text-3xl font-bold text-green-600 mb-2">
                R$ 1.234,56
              </div>
              <p className="text-sm text-gray-500">
                Disponível para transferência
              </p>
            </div>
          </Card>

          {/* Contatos Recentes */}
          <Card title="Contatos Recentes" icon="heroicons-outline:users">
            <div className="space-y-3">
              <div
                onClick={() => selectUser({ email: 'joao@email.com', name: 'João Silva' })}
                className="flex items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer"
              >
                <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">
                  JS
                </div>
                <div>
                  <p className="text-sm font-medium">João Silva</p>
                  <p className="text-xs text-gray-500">joao@email.com</p>
                </div>
              </div>
              <div
                onClick={() => selectUser({ email: 'maria@email.com', name: 'Maria Santos' })}
                className="flex items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer"
              >
                <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">
                  MS
                </div>
                <div>
                  <p className="text-sm font-medium">Maria Santos</p>
                  <p className="text-xs text-gray-500">maria@email.com</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Transferências Recentes */}
          <Card title="Últimas Transferências" icon="heroicons-outline:clock">
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b">
                <div className="flex items-center">
                  <ArrowRight size={16} className="text-red-500 mr-2" />
                  <div>
                    <p className="text-sm font-medium">R$ 200,00</p>
                    <p className="text-xs text-gray-500">Para João Silva</p>
                  </div>
                </div>
                <span className="text-xs text-gray-500">Hoje</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <div className="flex items-center">
                  <ArrowRight size={16} className="text-red-500 mr-2" />
                  <div>
                    <p className="text-sm font-medium">R$ 150,00</p>
                    <p className="text-xs text-gray-500">PIX Externa</p>
                  </div>
                </div>
                <span className="text-xs text-gray-500">Ontem</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TransferPage;