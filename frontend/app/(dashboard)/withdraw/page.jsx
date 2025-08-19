"use client";
import React, { useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Textinput from '@/components/ui/Textinput';
import Select from '@/components/ui/Select';
import { useAlertContext } from '@/contexts/AlertContext';
import { Copy, CreditCard, Banknote } from 'lucide-react';

const WithdrawPage = () => {
  const [formData, setFormData] = useState({
    amount: '',
    method: '',
    pixKey: '',
    bankAccount: '',
    agency: '',
    account: ''
  });
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError, showInfo, showWarning } = useAlertContext();

  const withdrawMethods = [
    { value: 'pix', label: 'PIX' },
    { value: 'ted', label: 'TED' },
    { value: 'bank_transfer', label: 'Transferência Bancária' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      showSuccess('Solicitação de saque enviada com sucesso!');
      setFormData({
        amount: '',
        method: '',
        pixKey: '',
        bankAccount: '',
        agency: '',
        account: ''
      });
    } catch (error) {
      showError('Erro ao processar saque. Tente novamente.');
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Sacar
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário de Saque */}
        <div className="lg:col-span-2">
          <Card title="Solicitar Saque" icon="fa6-brands:pix">
            <form onSubmit={handleSubmit} className="space-y-6">
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
                  min="10"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Valor mínimo: R$ 10,00
                </p>
              </div>

              {/* Método de Saque */}
              <div>
                <Select
                  label="Método de Saque"
                  options={withdrawMethods}
                  value={formData.method}
                  onChange={(value) => handleInputChange('method', value)}
                  placeholder="Selecione o método"
                  required
                />
              </div>

              {/* PIX */}
              {formData.method === 'pix' && (
                <div>
                  <Textinput
                    label="Chave PIX"
                    placeholder="Digite sua chave PIX"
                    value={formData.pixKey}
                    onChange={(e) => handleInputChange('pixKey', e.target.value)}
                    required
                  />
                </div>
              )}

              {/* TED/Transferência */}
              {(formData.method === 'ted' || formData.method === 'bank_transfer') && (
                <div className="space-y-4">
                  <Textinput
                    label="Banco"
                    placeholder="Nome do banco"
                    value={formData.bankAccount}
                    onChange={(e) => handleInputChange('bankAccount', e.target.value)}
                    required
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Textinput
                      label="Agência"
                      placeholder="0000"
                      value={formData.agency}
                      onChange={(e) => handleInputChange('agency', e.target.value)}
                      required
                    />
                    <Textinput
                      label="Conta"
                      placeholder="00000-0"
                      value={formData.account}
                      onChange={(e) => handleInputChange('account', e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full btn-brand"
                isLoading={loading}
                disabled={!formData.amount || !formData.method}
              >
                Solicitar Saque
              </Button>
            </form>
          </Card>
        </div>

        {/* Informações */}
        <div className="space-y-6">
          {/* Saldo Disponível */}
          <Card title="Saldo Disponível">
            <div className="text-center py-4">
              <div className="text-3xl font-bold text-green-600 mb-2">
                R$ 1.234,56
              </div>
              <p className="text-sm text-gray-500">
                Disponível para saque
              </p>
            </div>
          </Card>

          {/* Taxas e Limites */}
          <Card title="Taxas e Limites" icon="heroicons-outline:information-circle">
            <div className="space-y-4">
              <div className="flex justify-between py-2 border-b">
                <span className="text-sm text-gray-600">PIX</span>
                <span className="text-sm font-medium">Grátis</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-sm text-gray-600">TED</span>
                <span className="text-sm font-medium">R$ 8,90</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-sm text-gray-600">Transferência</span>
                <span className="text-sm font-medium">R$ 3,50</span>
              </div>
              <div className="pt-2">
                <p className="text-xs text-gray-500">
                  • Limite diário: R$ 5.000,00<br/>
                  • Limite mensal: R$ 50.000,00<br/>
                  • Processamento: 1-2 dias úteis
                </p>
              </div>
            </div>
          </Card>

          {/* Histórico Recente */}
          <Card title="Últimos Saques" icon="heroicons-outline:clock">
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="text-sm font-medium">R$ 500,00</p>
                  <p className="text-xs text-gray-500">PIX • 12/08/2025</p>
                </div>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                  Concluído
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="text-sm font-medium">R$ 1.200,00</p>
                  <p className="text-xs text-gray-500">TED • 10/08/2025</p>
                </div>
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                  Processando
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium">R$ 300,00</p>
                  <p className="text-xs text-gray-500">PIX • 08/08/2025</p>
                </div>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                  Concluído
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default WithdrawPage;