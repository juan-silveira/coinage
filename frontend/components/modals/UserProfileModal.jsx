"use client";

import { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Textinput from "@/components/ui/Textinput";
import Select from "react-select";
import { useAlertContext } from '@/contexts/AlertContext';
import {
  User,
  Mail,
  Phone,
  CreditCard,
  Calendar,
  Eye,
  EyeOff,
  Wallet,
  TrendingUp,
  TrendingDown,
  Activity,
  Shield,
  Lock,
  Unlock,
  Edit,
  Save,
  X,
  Clock,
  MapPin,
  Smartphone,
  Globe,
  Hash,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRightLeft,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';

const UserProfileModal = ({ 
  show, 
  onClose, 
  user, 
  onUserUpdate = null,
  canEdit = false,
  canViewSensitive = false 
}) => {
  const { showSuccess, showError, showInfo, showWarning } = useAlertContext();
  const [activeTab, setActiveTab] = useState('profile');
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userTransactions, setUserTransactions] = useState([]);
  const [userEarnings, setUserEarnings] = useState([]);
  const [userBalances, setUserBalances] = useState([]);
  const [userActions, setUserActions] = useState([]);
  
  // Estados para edição
  const [editData, setEditData] = useState({
    name: '',
    email: '',
    phone: '',
    status: '',
    role: ''
  });

  const tabs = [
    { id: 'profile', label: 'Perfil', icon: User },
    { id: 'balances', label: 'Saldos', icon: Wallet },
    { id: 'transactions', label: 'Transações', icon: Activity },
    { id: 'earnings', label: 'Rendimentos', icon: TrendingUp },
    { id: 'actions', label: 'Ações', icon: Shield }
  ];

  const statusOptions = [
    { value: 'active', label: 'Ativo' },
    { value: 'inactive', label: 'Inativo' },
    { value: 'pending', label: 'Pendente' },
    { value: 'blocked', label: 'Bloqueado' }
  ];

  const roleOptions = [
    { value: 'USER', label: 'Usuário' },
    { value: 'ADMIN', label: 'Administrador' },
    { value: 'APP_ADMIN', label: 'Admin da Empresa' },
    { value: 'SUPER_ADMIN', label: 'Super Admin' }
  ];

  useEffect(() => {
    if (show && user) {
      setEditData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        status: user.status || 'active',
        role: user.role || 'USER'
      });
      loadUserData();
    }
  }, [show, user]);

  const loadUserData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      
      // Mock data - substituir por API real
      setUserTransactions([
        {
          id: 1,
          type: 'deposit',
          amount: 1000.00,
          currency: 'BRL',
          status: 'confirmed',
          date: '2025-01-18T10:30:00Z',
          hash: '0x123...456'
        },
        {
          id: 2,
          type: 'withdraw',
          amount: -500.00,
          currency: 'BRL',
          status: 'pending',
          date: '2025-01-17T15:20:00Z',
          hash: '0x789...012'
        }
      ]);

      setUserEarnings([
        {
          id: 1,
          type: 'stake_reward',
          amount: 45.67,
          currency: 'ETH',
          date: '2025-01-18T08:00:00Z',
          apy: 12.5
        },
        {
          id: 2,
          type: 'referral_bonus',
          amount: 25.00,
          currency: 'BRL',
          date: '2025-01-17T12:15:00Z'
        }
      ]);

      setUserBalances([
        {
          id: 1,
          symbol: 'BRL',
          name: 'Real Brasileiro',
          balance: 1234.56,
          locked: 0,
          available: 1234.56
        },
        {
          id: 2,
          symbol: 'ETH',
          name: 'Ethereum',
          balance: 2.5678,
          locked: 0.5,
          available: 2.0678
        }
      ]);

      setUserActions([
        {
          id: 1,
          action: 'login',
          description: 'Login realizado',
          ip: '192.168.1.100',
          userAgent: 'Chrome/96.0.4664.110',
          location: 'São Paulo, SP',
          date: '2025-01-18T09:30:00Z',
          success: true
        },
        {
          id: 2,
          action: 'profile_update',
          description: 'Dados do perfil atualizados',
          ip: '192.168.1.100',
          userAgent: 'Chrome/96.0.4664.110',
          location: 'São Paulo, SP',
          date: '2025-01-17T14:20:00Z',
          success: true
        },
        {
          id: 3,
          action: 'failed_login',
          description: 'Tentativa de login falhada',
          ip: '10.0.0.50',
          userAgent: 'Firefox/95.0',
          location: 'Rio de Janeiro, RJ',
          date: '2025-01-17T10:15:00Z',
          success: false
        }
      ]);

    } catch (error) {
      console.error('Error loading user data:', error);
      showError('Erro ao carregar dados do usuário');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      // TODO: Implementar API call
      console.log('Updating user:', editData);
      
      if (onUserUpdate) {
        onUserUpdate({ ...user, ...editData });
      }
      
      showSuccess('Dados atualizados com sucesso!');
      setEditMode(false);
    } catch (error) {
      console.error('Error updating user:', error);
      showError('Erro ao atualizar dados');
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'deposit': return <ArrowDownLeft className="text-green-600" size={16} />;
      case 'withdraw': return <ArrowUpRight className="text-red-600" size={16} />;
      case 'transfer': return <ArrowRightLeft className="text-blue-600" size={16} />;
      default: return <DollarSign className="text-gray-600" size={16} />;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="text-green-600" size={14} />;
      case 'pending': return <Clock className="text-yellow-600" size={14} />;
      case 'failed': return <XCircle className="text-red-600" size={14} />;
      default: return <AlertTriangle className="text-orange-600" size={14} />;
    }
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'login': return <Lock className="text-green-600" size={14} />;
      case 'logout': return <Unlock className="text-blue-600" size={14} />;
      case 'profile_update': return <Edit className="text-orange-600" size={14} />;
      case 'failed_login': return <XCircle className="text-red-600" size={14} />;
      default: return <Activity className="text-gray-600" size={14} />;
    }
  };

  if (!user) return null;

  return (
    <Modal
      title={`Perfil do Usuário - ${user.name}`}
      activeModal={show}
      onClose={() => {
        setEditMode(false);
        onClose();
      }}
      className="max-w-6xl"
    >
      <div className="space-y-6">
        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Informações do Perfil</h3>
              {canEdit && (
                <div className="flex space-x-2">
                  {editMode ? (
                    <>
                      <Button
                        onClick={() => setEditMode(false)}
                        variant="outline"
                        size="sm"
                      >
                        <X size={14} className="mr-1" />
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleSave}
                        className="btn-brand"
                        size="sm"
                        isLoading={loading}
                      >
                        <Save size={14} className="mr-1" />
                        Salvar
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={() => setEditMode(true)}
                      variant="outline"
                      size="sm"
                    >
                      <Edit size={14} className="mr-1" />
                      Editar
                    </Button>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                {editMode ? (
                  <>
                    <Textinput
                      label="Nome Completo"
                      value={editData.name}
                      onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                    />
                    <Textinput
                      label="Email"
                      type="email"
                      value={editData.email}
                      onChange={(e) => setEditData(prev => ({ ...prev, email: e.target.value }))}
                    />
                    <Textinput
                      label="Telefone"
                      value={editData.phone}
                      onChange={(e) => setEditData(prev => ({ ...prev, phone: e.target.value }))}
                    />
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
                      <Select
                        options={statusOptions}
                        value={statusOptions.find(opt => opt.value === editData.status)}
                        onChange={(option) => setEditData(prev => ({ ...prev, status: option.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Role</label>
                      <Select
                        options={roleOptions}
                        value={roleOptions.find(opt => opt.value === editData.role)}
                        onChange={(option) => setEditData(prev => ({ ...prev, role: option.value }))}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center space-x-3">
                      <Mail size={16} className="text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium">{user.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Phone size={16} className="text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Telefone</p>
                        <p className="font-medium">{user.phone || 'Não informado'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <CreditCard size={16} className="text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">CPF</p>
                        <p className="font-medium">{user.cpf || 'Não informado'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Calendar size={16} className="text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Membro desde</p>
                        <p className="font-medium">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Shield size={16} className="text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Role</p>
                    <Badge label={user.role} className="bg-blue-500 text-white" />
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Activity size={16} className="text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <Badge 
                      label={user.status} 
                      className={user.status === 'active' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'} 
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Eye size={16} className="text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Último Login</p>
                    <p className="font-medium">
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleString('pt-BR') : 'Nunca'}
                    </p>
                  </div>
                </div>

                {canViewSensitive && (
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h4 className="text-sm font-medium text-red-600 mb-2">Informações Sensíveis</h4>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-gray-500">Chave Pública</p>
                        <code className="text-xs bg-gray-100 dark:bg-gray-800 p-1 rounded break-all">
                          {user.publicKey || 'N/A'}
                        </code>
                      </div>
                      <div>
                        <p className="text-xs text-red-600">Chave Privada</p>
                        <code className="text-xs bg-red-50 dark:bg-red-900/20 p-1 rounded break-all text-red-600">
                          {user.privateKey || 'N/A'}
                        </code>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Balances Tab */}
        {activeTab === 'balances' && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Saldos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userBalances.map((balance) => (
                <Card key={balance.id} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">{balance.symbol}</h4>
                    <Wallet size={20} className="text-gray-400" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Total</span>
                      <span className="font-medium">{balance.balance.toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Disponível</span>
                      <span className="text-green-600">{balance.available.toFixed(4)}</span>
                    </div>
                    {balance.locked > 0 && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Bloqueado</span>
                        <span className="text-orange-600">{balance.locked.toFixed(4)}</span>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Transações Recentes</h3>
            <div className="space-y-3">
              {userTransactions.map((tx) => (
                <div key={tx.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getTransactionIcon(tx.type)}
                      <div>
                        <p className="font-medium">{tx.type.toUpperCase()}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(tx.date).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2)} {tx.currency}
                      </p>
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(tx.status)}
                        <span className="text-xs text-gray-500">{tx.status}</span>
                      </div>
                    </div>
                  </div>
                  {tx.hash && (
                    <p className="text-xs text-gray-400 mt-2 font-mono">
                      Hash: {tx.hash}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Earnings Tab */}
        {activeTab === 'earnings' && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Rendimentos</h3>
            <div className="space-y-3">
              {userEarnings.map((earning) => (
                <div key={earning.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <TrendingUp className="text-green-600" size={16} />
                      <div>
                        <p className="font-medium">{earning.type.replace('_', ' ').toUpperCase()}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(earning.date).toLocaleString('pt-BR')}
                        </p>
                        {earning.apy && (
                          <p className="text-xs text-blue-600">APY: {earning.apy}%</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-green-600">
                        +{earning.amount.toFixed(4)} {earning.currency}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions Tab */}
        {activeTab === 'actions' && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Histórico de Ações</h3>
            <div className="space-y-3">
              {userActions.map((action) => (
                <div key={action.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg ${action.success ? 'bg-green-100' : 'bg-red-100'}`}>
                        {getActionIcon(action.action)}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{action.description}</p>
                        <div className="text-sm text-gray-500 space-y-1 mt-1">
                          <div className="flex items-center space-x-4">
                            <span className="flex items-center">
                              <Globe size={12} className="mr-1" />
                              {action.ip}
                            </span>
                            <span className="flex items-center">
                              <MapPin size={12} className="mr-1" />
                              {action.location}
                            </span>
                          </div>
                          <div className="flex items-center space-x-4">
                            <span className="flex items-center">
                              <Smartphone size={12} className="mr-1" />
                              {action.userAgent}
                            </span>
                            <span className="flex items-center">
                              <Clock size={12} className="mr-1" />
                              {new Date(action.date).toLocaleString('pt-BR')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <Badge 
                      label={action.success ? 'Sucesso' : 'Falhou'} 
                      className={action.success ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default UserProfileModal;