"use client";
import React, { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Textinput from '@/components/ui/Textinput';
import Select from '@/components/ui/Select';
import { useAlertContext } from '@/contexts/AlertContext';
import useAuthStore from '@/store/authStore';
import useBalanceSync from '@/hooks/useBalanceSync';
import { Copy, CreditCard, Banknote, CheckCircle, Clock, AlertCircle } from 'lucide-react';

const WithdrawPage = () => {
  const { user } = useAuthStore();
  const { balance } = useBalanceSync();
  const { showSuccess, showError, showInfo, showWarning } = useAlertContext();
  
  const [formData, setFormData] = useState({
    amount: '',
    pixKey: ''
  });
  const [loading, setLoading] = useState(false);
  const [fee, setFee] = useState(0);
  const [netAmount, setNetAmount] = useState(0);
  const [recentWithdrawals, setRecentWithdrawals] = useState([]);

  // Carregar histórico de saques ao inicializar
  useEffect(() => {
    if (user?.id) {
      loadRecentWithdrawals();
    }
  }, [user]);

  // Calcular taxa quando valor mudar
  useEffect(() => {
    if (formData.amount && parseFloat(formData.amount) > 0) {
      calculateFee();
    } else {
      setFee(0);
      setNetAmount(0);
    }
  }, [formData.amount]);

  const loadRecentWithdrawals = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/withdrawals/user/${user.id}?limit=5`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRecentWithdrawals(data.data?.withdrawals || []);
      }
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    }
  };

  const calculateFee = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/withdrawals/calculate-fee', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: parseFloat(formData.amount)
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setFee(data.data?.fee || 0);
        setNetAmount(data.data?.netAmount || 0);
      }
    } catch (error) {
      console.error('Erro ao calcular taxa:', error);
    }
  };

  const validatePixKey = async (pixKey) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/withdrawals/validate-pix', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ pixKey })
      });
      
      const data = await response.json();
      return data.data?.isValid || false;
    } catch (error) {
      console.error('Erro ao validar PIX:', error);
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validações
      const amount = parseFloat(formData.amount);
      if (amount < 10) {
        showError('Valor mínimo para saque é R$ 10,00');
        return;
      }
      
      if (amount + fee > balance) {
        showError('Saldo insuficiente (incluindo taxa)');
        return;
      }

      // Validar chave PIX
      const pixKeyValid = await validatePixKey(formData.pixKey);
      if (!pixKeyValid) {
        showError('Chave PIX inválida');
        return;
      }

      // Enviar solicitação de saque
      const token = localStorage.getItem('token');
      const response = await fetch('/api/withdrawals', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user.id,
          amount,
          pixKey: formData.pixKey
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showSuccess('Saque solicitado com sucesso! Processamento iniciado.');
        setFormData({
          amount: '',
          pixKey: ''
        });
        setFee(0);
        setNetAmount(0);
        
        // Recarregar histórico
        setTimeout(() => {
          loadRecentWithdrawals();
        }, 1000);
        
      } else {
        showError(data.message || 'Erro ao processar saque');
      }
      
    } catch (error) {
      console.error('Erro no saque:', error);
      showError('Erro de conexão. Tente novamente.');
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

  const getStatusBadge = (status) => {
    const statusConfig = {
      PENDING: {
        icon: Clock,
        text: 'Pendente',
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
      },
      PROCESSING: {
        icon: Clock,
        text: 'Processando',
        className: 'bg-blue-100 text-blue-800 border-blue-200'
      },
      COMPLETED: {
        icon: CheckCircle,
        text: 'Concluído',
        className: 'bg-green-100 text-green-800 border-green-200'
      },
      FAILED: {
        icon: AlertCircle,
        text: 'Falhou',
        className: 'bg-red-100 text-red-800 border-red-200'
      },
      CANCELLED: {
        icon: AlertCircle,
        text: 'Cancelado',
        className: 'bg-gray-100 text-gray-800 border-gray-200'
      }
    };

    const config = statusConfig[status] || statusConfig.PENDING;
    const Icon = config.icon;

    return (
      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.className}`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.text}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Sacar
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário de Saque PIX */}
        <div className="lg:col-span-2">
          <Card title="Saque PIX" icon="fa6-brands:pix">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Valor */}
              <div>
                <Textinput
                  label="Valor (cBRL)"
                  type="number"
                  placeholder="0,00"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  required
                  step="0.01"
                  min="10"
                  max={balance || 0}
                />
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-500">Valor mínimo: R$ 10,00</span>
                  <span className="text-gray-500">
                    Saldo: {new Intl.NumberFormat('pt-BR', { 
                      style: 'currency', 
                      currency: 'BRL' 
                    }).format(balance || 0)}
                  </span>
                </div>
              </div>

              {/* Chave PIX */}
              <div>
                <Textinput
                  label="Chave PIX"
                  placeholder="Digite sua chave PIX (email, CPF, telefone ou chave aleatória)"
                  value={formData.pixKey}
                  onChange={(e) => handleInputChange('pixKey', e.target.value)}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  💡 Suportamos: Email, CPF, CNPJ, telefone e chaves aleatórias
                </p>
              </div>

              {/* Resumo */}
              {formData.amount && parseFloat(formData.amount) > 0 && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
                  <h4 className="font-semibold text-gray-900 dark:text-white">Resumo do Saque</h4>
                  <div className="flex justify-between text-sm">
                    <span>Valor solicitado:</span>
                    <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(formData.amount))}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Taxa:</span>
                    <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(fee)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold border-t pt-2">
                    <span>Você receberá:</span>
                    <span className="text-green-600">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(formData.amount) || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Total debitado:</span>
                    <span className="text-red-600">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((parseFloat(formData.amount) || 0) + fee)}</span>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                isLoading={loading}
                disabled={!formData.amount || !formData.pixKey || parseFloat(formData.amount) < 10}
              >
                {loading ? 'Processando...' : 'Solicitar Saque PIX'}
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
                {new Intl.NumberFormat('pt-BR', { 
                  style: 'currency', 
                  currency: 'BRL' 
                }).format(balance || 0)}
              </div>
              <p className="text-sm text-gray-500">
                cBRL disponível para saque
              </p>
            </div>
          </Card>

          {/* Taxas e Limites */}
          <Card title="Taxas e Limites PIX" icon="heroicons-outline:information-circle">
            <div className="space-y-4">
              <div className="flex justify-between py-2 border-b">
                <span className="text-sm text-gray-600">Taxa PIX</span>
                <span className="text-sm font-medium">
                  {new Intl.NumberFormat('pt-BR', { 
                    style: 'currency', 
                    currency: 'BRL' 
                  }).format(2.50)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-sm text-gray-600">Valor mínimo</span>
                <span className="text-sm font-medium">R$ 10,00</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-sm text-gray-600">Valor máximo</span>
                <span className="text-sm font-medium">R$ 50.000,00</span>
              </div>
              <div className="pt-2">
                <p className="text-xs text-gray-500">
                  • Processamento: 5-15 minutos<br/>
                  • Disponível 24h/7 dias<br/>
                  • Confirmação automática
                </p>
              </div>
            </div>
          </Card>

          {/* Histórico Recente */}
          <Card title="Últimos Saques" icon="heroicons-outline:clock">
            {recentWithdrawals.length > 0 ? (
              <div className="space-y-3">
                {recentWithdrawals.map((withdrawal) => (
                  <div key={withdrawal.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                    <div>
                      <p className="text-sm font-medium">
                        {new Intl.NumberFormat('pt-BR', { 
                          style: 'currency', 
                          currency: 'BRL' 
                        }).format(withdrawal.amount)}
                      </p>
                      <p className="text-xs text-gray-500">
                        PIX • {new Date(withdrawal.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                      <p className="text-xs text-gray-400">
                        {withdrawal.pixKey?.replace(/(.{3}).*(.{4})/, '$1***$2')}
                      </p>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(withdrawal.status)}
                      {withdrawal.pixTransactionId && (
                        <p className="text-xs text-gray-400 mt-1">
                          ID: {withdrawal.pixTransactionId.slice(-8)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Banknote className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-sm">Nenhum saque realizado ainda</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default WithdrawPage;