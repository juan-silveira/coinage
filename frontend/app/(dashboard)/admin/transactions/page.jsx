"use client";

import { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Textinput from "@/components/ui/Textinput";
import Select from "@/components/ui/Select";
import Badge from "@/components/ui/Badge";
import usePermissions from "@/hooks/usePermissions";
import { useRouter } from "next/navigation";
import { useAlertContext } from '@/contexts/AlertContext';
import { 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ArrowRightLeft,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  User,
  Hash,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Eye
} from 'lucide-react';

const CompanyTransactionsPage = () => {
  const { showSuccess, showError, showInfo, showWarning } = useAlertContext();
  const router = useRouter();
  const permissions = usePermissions();
  
  // Estados
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  
  // Filtros
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    status: '',
    dateFrom: '',
    dateTo: '',
    minAmount: '',
    maxAmount: '',
    user: ''
  });

  // Estatísticas
  const [stats, setStats] = useState({
    total: 0,
    totalValue: 0,
    deposits: 0,
    withdrawals: 0,
    transfers: 0,
    pending: 0,
    confirmed: 0,
    failed: 0
  });

  // Opções para filtros
  const typeOptions = [
    { value: '', label: 'Todos os Tipos' },
    { value: 'deposit', label: 'Depósito' },
    { value: 'withdraw', label: 'Saque' },
    { value: 'transfer', label: 'Transferência' },
    { value: 'exchange', label: 'Troca' },
    { value: 'investment', label: 'Investimento' }
  ];

  const statusOptions = [
    { value: '', label: 'Todos os Status' },
    { value: 'pending', label: 'Pendente' },
    { value: 'confirmed', label: 'Confirmado' },
    { value: 'failed', label: 'Falhou' },
    { value: 'cancelled', label: 'Cancelado' }
  ];

  useEffect(() => {
    if (!permissions.canViewCompanySettings) {
      router.push("/dashboard");
      return;
    }
    loadTransactions();
  }, [permissions, router]);

  // Aplicar filtros quando filters mudarem
  useEffect(() => {
    applyFilters();
  }, [transactions, filters]);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      // Mock data - substituir por API real
      const mockTransactions = [
        {
          id: 1,
          hash: "0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba",
          type: "deposit",
          amount: 2500.00,
          currency: "BRL",
          cryptoAmount: 2.5,
          cryptoCurrency: "ETH",
          status: "confirmed",
          createdAt: "2025-01-18T10:30:00Z",
          confirmedAt: "2025-01-18T10:32:00Z",
          user: {
            id: 1,
            name: "Ivan Alberton",
            email: "ivan.alberton@navi.inf.br"
          },
          fees: 0,
          network: "mainnet",
          blockNumber: 19234567,
          confirmations: 12,
          description: "Depósito via PIX"
        },
        {
          id: 2,
          hash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
          type: "withdraw",
          amount: 1000.00,
          currency: "BRL",
          cryptoAmount: 0.5,
          cryptoCurrency: "ETH",
          status: "pending",
          createdAt: "2025-01-18T09:15:00Z",
          confirmedAt: null,
          user: {
            id: 2,
            name: "Maria Silva Santos",
            email: "maria.santos@empresa.com"
          },
          fees: 8.90,
          network: "mainnet",
          blockNumber: null,
          confirmations: 0,
          description: "Saque via TED"
        },
        {
          id: 3,
          hash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
          type: "transfer",
          amount: 500.00,
          currency: "BRL",
          cryptoAmount: 0.25,
          cryptoCurrency: "ETH",
          status: "confirmed",
          createdAt: "2025-01-17T16:45:00Z",
          confirmedAt: "2025-01-17T16:47:00Z",
          user: {
            id: 3,
            name: "João Pedro Oliveira",
            email: "joao.oliveira@empresa.com"
          },
          fees: 2.50,
          network: "mainnet",
          blockNumber: 19234555,
          confirmations: 24,
          description: "Transferência interna",
          recipient: {
            name: "Ana Carolina",
            email: "ana@empresa.com"
          }
        },
        {
          id: 4,
          hash: "0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321",
          type: "exchange",
          amount: 3000.00,
          currency: "BRL",
          cryptoAmount: 0.048,
          cryptoCurrency: "BTC",
          status: "confirmed",
          createdAt: "2025-01-17T14:20:00Z",
          confirmedAt: "2025-01-17T14:22:00Z",
          user: {
            id: 1,
            name: "Ivan Alberton",
            email: "ivan.alberton@navi.inf.br"
          },
          fees: 9.00,
          network: "mainnet",
          blockNumber: 19234540,
          confirmations: 35,
          description: "Troca BRL → BTC",
          exchangeRate: 62500.00
        },
        {
          id: 5,
          hash: "0x5555555555555555555555555555555555555555555555555555555555555555",
          type: "deposit",
          amount: 750.00,
          currency: "BRL",
          cryptoAmount: null,
          cryptoCurrency: null,
          status: "failed",
          createdAt: "2025-01-17T12:10:00Z",
          confirmedAt: null,
          user: {
            id: 4,
            name: "Carlos Mendes",
            email: "carlos@empresa.com"
          },
          fees: 0,
          network: "mainnet",
          blockNumber: null,
          confirmations: 0,
          description: "Depósito PIX - Falha na validação",
          errorMessage: "Chave PIX inválida"
        }
      ];
      
      setTransactions(mockTransactions);
      
      // Calcular estatísticas
      const newStats = {
        total: mockTransactions.length,
        totalValue: mockTransactions.reduce((sum, tx) => sum + (tx.status === 'confirmed' ? tx.amount : 0), 0),
        deposits: mockTransactions.filter(tx => tx.type === 'deposit').length,
        withdrawals: mockTransactions.filter(tx => tx.type === 'withdraw').length,
        transfers: mockTransactions.filter(tx => tx.type === 'transfer').length,
        pending: mockTransactions.filter(tx => tx.status === 'pending').length,
        confirmed: mockTransactions.filter(tx => tx.status === 'confirmed').length,
        failed: mockTransactions.filter(tx => tx.status === 'failed').length
      };
      setStats(newStats);
      
    } catch (error) {
      console.error("Error loading transactions:", error);
      showError("Erro ao carregar transações");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...transactions];

    // Filtro de busca
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(tx => 
        tx.hash.toLowerCase().includes(search) ||
        tx.user.name.toLowerCase().includes(search) ||
        tx.user.email.toLowerCase().includes(search) ||
        tx.description.toLowerCase().includes(search) ||
        (tx.recipient && tx.recipient.name.toLowerCase().includes(search))
      );
    }

    // Filtro de tipo
    if (filters.type) {
      filtered = filtered.filter(tx => tx.type === filters.type);
    }

    // Filtro de status
    if (filters.status) {
      filtered = filtered.filter(tx => tx.status === filters.status);
    }

    // Filtro de usuário
    if (filters.user) {
      const userSearch = filters.user.toLowerCase();
      filtered = filtered.filter(tx => 
        tx.user.name.toLowerCase().includes(userSearch) ||
        tx.user.email.toLowerCase().includes(userSearch)
      );
    }

    // Filtro de valor mínimo
    if (filters.minAmount) {
      filtered = filtered.filter(tx => tx.amount >= parseFloat(filters.minAmount));
    }

    // Filtro de valor máximo
    if (filters.maxAmount) {
      filtered = filtered.filter(tx => tx.amount <= parseFloat(filters.maxAmount));
    }

    // Filtro de data
    if (filters.dateFrom) {
      filtered = filtered.filter(tx => 
        new Date(tx.createdAt) >= new Date(filters.dateFrom)
      );
    }

    if (filters.dateTo) {
      filtered = filtered.filter(tx => 
        new Date(tx.createdAt) <= new Date(filters.dateTo)
      );
    }

    setFilteredTransactions(filtered);
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      type: '',
      status: '',
      dateFrom: '',
      dateTo: '',
      minAmount: '',
      maxAmount: '',
      user: ''
    });
  };

  const exportTransactions = () => {
    const csvData = filteredTransactions.map(tx => ({
      Hash: tx.hash,
      Tipo: tx.type,
      'Valor (BRL)': `R$ ${tx.amount.toFixed(2)}`,
      'Valor Crypto': tx.cryptoAmount ? `${tx.cryptoAmount} ${tx.cryptoCurrency}` : 'N/A',
      Status: tx.status,
      Usuário: tx.user.name,
      Email: tx.user.email,
      'Data Criação': new Date(tx.createdAt).toLocaleString('pt-BR'),
      'Data Confirmação': tx.confirmedAt ? new Date(tx.confirmedAt).toLocaleString('pt-BR') : 'N/A',
      Taxa: `R$ ${tx.fees.toFixed(2)}`,
      Descrição: tx.description,
      Network: tx.network,
      'Bloco': tx.blockNumber || 'N/A',
      Confirmações: tx.confirmations
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transacoes-empresa-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'deposit': return <ArrowDownLeft className="text-green-600" size={16} />;
      case 'withdraw': return <ArrowUpRight className="text-red-600" size={16} />;
      case 'transfer': return <ArrowRightLeft className="text-blue-600" size={16} />;
      case 'exchange': return <RefreshCw className="text-purple-600" size={16} />;
      default: return <DollarSign className="text-gray-600" size={16} />;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="text-green-600" size={16} />;
      case 'pending': return <Clock className="text-yellow-600" size={16} />;
      case 'failed': return <XCircle className="text-red-600" size={16} />;
      case 'cancelled': return <XCircle className="text-gray-600" size={16} />;
      default: return <AlertTriangle className="text-orange-600" size={16} />;
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'failed': return 'bg-red-500';
      case 'cancelled': return 'bg-gray-500';
      default: return 'bg-orange-500';
    }
  };

  const getTypeBadgeColor = (type) => {
    switch (type) {
      case 'deposit': return 'bg-green-500';
      case 'withdraw': return 'bg-red-500';
      case 'transfer': return 'bg-blue-500';
      case 'exchange': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'deposit': return 'Depósito';
      case 'withdraw': return 'Saque';
      case 'transfer': return 'Transferência';
      case 'exchange': return 'Troca';
      case 'investment': return 'Investimento';
      default: return type;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'confirmed': return 'Confirmado';
      case 'pending': return 'Pendente';
      case 'failed': return 'Falhou';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  if (!permissions.canViewCompanySettings) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Transações da Empresa
        </h1>
        <div className="flex items-center space-x-2">
          <Button
            onClick={exportTransactions}
            variant="outline"
            className="btn-outline-brand"
          >
            <Download size={16} className="mr-2" />
            Exportar CSV
          </Button>
          <Button
            onClick={loadTransactions}
            variant="outline"
            isLoading={loading}
          >
            <RefreshCw size={16} className="mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <Card>
          <div className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Hash className="text-blue-600" size={20} />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                <p className="text-xl font-bold">{stats.total}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="text-green-600" size={20} />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">Volume</p>
                <p className="text-lg font-bold">R$ {stats.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <ArrowDownLeft className="text-green-600" size={20} />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">Depósitos</p>
                <p className="text-xl font-bold">{stats.deposits}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <ArrowUpRight className="text-red-600" size={20} />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">Saques</p>
                <p className="text-xl font-bold">{stats.withdrawals}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ArrowRightLeft className="text-blue-600" size={20} />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">Transferências</p>
                <p className="text-xl font-bold">{stats.transfers}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="text-green-600" size={20} />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">Confirmadas</p>
                <p className="text-xl font-bold">{stats.confirmed}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="text-yellow-600" size={20} />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">Pendentes</p>
                <p className="text-xl font-bold">{stats.pending}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="text-red-600" size={20} />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">Falharam</p>
                <p className="text-xl font-bold">{stats.failed}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Filtros */}
      <Card title="Filtros" icon="heroicons-outline:funnel">
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-4">
          <div className="md:col-span-2">
            <Textinput
              placeholder="Buscar por hash, usuário ou descrição..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              suffix={<Search size={16} className="text-gray-400" />}
            />
          </div>
          
          <Select
            options={typeOptions}
            value={filters.type}
            onChange={(value) => handleFilterChange('type', value)}
            placeholder="Tipo"
          />
          
          <Select
            options={statusOptions}
            value={filters.status}
            onChange={(value) => handleFilterChange('status', value)}
            placeholder="Status"
          />
          
          <Textinput
            placeholder="Usuário"
            value={filters.user}
            onChange={(e) => handleFilterChange('user', e.target.value)}
          />
          
          <Textinput
            type="number"
            placeholder="Valor mín."
            value={filters.minAmount}
            onChange={(e) => handleFilterChange('minAmount', e.target.value)}
            step="0.01"
          />
          
          <Textinput
            type="number"
            placeholder="Valor máx."
            value={filters.maxAmount}
            onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
            step="0.01"
          />
          
          <div className="flex space-x-2">
            <Textinput
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              placeholder="Data início"
              className="flex-1"
            />
            <Textinput
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              placeholder="Data fim"
              className="flex-1"
            />
            <Button onClick={clearFilters} variant="outline">
              Limpar
            </Button>
          </div>
        </div>
      </Card>

      {/* Lista de Transações */}
      <Card title={`Transações (${filteredTransactions.length})`} icon="heroicons-outline:credit-card">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-12">
            <DollarSign size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">Nenhuma transação encontrada</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTransactions.map((transaction) => (
              <div key={transaction.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    {/* Ícone do tipo */}
                    <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                      {getTypeIcon(transaction.type)}
                    </div>
                    
                    {/* Informações da transação */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          {getTypeLabel(transaction.type)} - R$ {transaction.amount.toFixed(2)}
                        </h3>
                        <Badge
                          label={getTypeLabel(transaction.type)}
                          className={`${getTypeBadgeColor(transaction.type)} text-white`}
                        />
                        <Badge
                          label={getStatusLabel(transaction.status)}
                          className={`${getStatusBadgeColor(transaction.status)} text-white`}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="space-y-1">
                          <div className="flex items-center text-gray-600 dark:text-gray-400">
                            <User size={14} className="mr-2" />
                            {transaction.user.name}
                          </div>
                          <div className="flex items-center text-gray-600 dark:text-gray-400">
                            <Hash size={14} className="mr-2" />
                            {transaction.hash.slice(0, 20)}...
                          </div>
                          <div className="flex items-center text-gray-600 dark:text-gray-400">
                            <Calendar size={14} className="mr-2" />
                            {new Date(transaction.createdAt).toLocaleString('pt-BR')}
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          {transaction.cryptoAmount && (
                            <div className="flex items-center text-gray-600 dark:text-gray-400">
                              <DollarSign size={14} className="mr-2" />
                              {transaction.cryptoAmount} {transaction.cryptoCurrency}
                            </div>
                          )}
                          <div className="flex items-center text-gray-600 dark:text-gray-400">
                            <DollarSign size={14} className="mr-2" />
                            Taxa: R$ {transaction.fees.toFixed(2)}
                          </div>
                          {transaction.confirmations > 0 && (
                            <div className="flex items-center text-gray-600 dark:text-gray-400">
                              <CheckCircle size={14} className="mr-2" />
                              {transaction.confirmations} confirmações
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-2">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {transaction.description}
                        </p>
                        {transaction.recipient && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Para: {transaction.recipient.name} ({transaction.recipient.email})
                          </p>
                        )}
                        {transaction.errorMessage && (
                          <p className="text-sm text-red-600">
                            Erro: {transaction.errorMessage}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Ações */}
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedTransaction(transaction);
                        setShowTransactionModal(true);
                      }}
                      variant="outline"
                    >
                      <Eye size={14} className="mr-1" />
                      Detalhes
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Modal de Detalhes da Transação */}
      {selectedTransaction && (
        <div className={`fixed inset-0 z-50 ${showTransactionModal ? 'block' : 'hidden'}`}>
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowTransactionModal(false)}></div>
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Detalhes da Transação
                  </h2>
                  <Button
                    onClick={() => setShowTransactionModal(false)}
                    variant="outline"
                    size="sm"
                  >
                    Fechar
                  </Button>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Hash</label>
                      <code className="text-sm bg-gray-100 dark:bg-gray-700 p-2 rounded break-all">
                        {selectedTransaction.hash}
                      </code>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tipo</label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">{getTypeLabel(selectedTransaction.type)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                      <div className="flex items-center mt-1">
                        {getStatusIcon(selectedTransaction.status)}
                        <span className="ml-2 text-sm text-gray-900 dark:text-white">
                          {getStatusLabel(selectedTransaction.status)}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Valor (BRL)</label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">R$ {selectedTransaction.amount.toFixed(2)}</p>
                    </div>
                    {selectedTransaction.cryptoAmount && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Valor Crypto</label>
                        <p className="mt-1 text-sm text-gray-900 dark:text-white">
                          {selectedTransaction.cryptoAmount} {selectedTransaction.cryptoCurrency}
                        </p>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Taxa</label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">R$ {selectedTransaction.fees.toFixed(2)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Usuário</label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">
                        {selectedTransaction.user.name} ({selectedTransaction.user.email})
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Network</label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedTransaction.network}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Data Criação</label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">
                        {new Date(selectedTransaction.createdAt).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    {selectedTransaction.confirmedAt && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Data Confirmação</label>
                        <p className="mt-1 text-sm text-gray-900 dark:text-white">
                          {new Date(selectedTransaction.confirmedAt).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    )}
                    {selectedTransaction.blockNumber && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Bloco</label>
                        <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedTransaction.blockNumber}</p>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirmações</label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedTransaction.confirmations}</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descrição</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedTransaction.description}</p>
                  </div>
                  
                  {selectedTransaction.recipient && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Destinatário</label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">
                        {selectedTransaction.recipient.name} ({selectedTransaction.recipient.email})
                      </p>
                    </div>
                  )}
                  
                  {selectedTransaction.exchangeRate && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Taxa de Câmbio</label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">
                        R$ {selectedTransaction.exchangeRate.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} por {selectedTransaction.cryptoCurrency}
                      </p>
                    </div>
                  )}
                  
                  {selectedTransaction.errorMessage && (
                    <div>
                      <label className="block text-sm font-medium text-red-700">Mensagem de Erro</label>
                      <p className="mt-1 text-sm text-red-600">{selectedTransaction.errorMessage}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyTransactionsPage;