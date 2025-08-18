import React, { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import mockDepositService from '@/services/mockDepositService';
import mockPixService from '@/services/mockPixService';

const MockDebugPanel = ({ userId = 'mock-user-123' }) => {
  const [stats, setStats] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Carregar estatísticas e transações
  const loadData = async () => {
    setLoading(true);
    try {
      const depositStats = mockDepositService.getMockStats();
      const pixStats = mockPixService.getMockStats();
      const transactionsData = await mockDepositService.listUserTransactions(userId);
      const pixData = await mockPixService.listUserPayments(userId);
      
      // Combinar estatísticas
      const combinedStats = {
        ...depositStats,
        pix: pixStats
      };
      
      setStats(combinedStats);
      if (transactionsData.success) {
        setTransactions(transactionsData.transactions);
      }
    } catch (error) {
      console.error('Erro ao carregar dados mock:', error);
    } finally {
      setLoading(false);
    }
  };

  // Carregar dados ao montar componente
  useEffect(() => {
    loadData();
    
    // Atualizar a cada 5 segundos
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [userId]);

  // Função para criar dados mock
  const handleSeedData = async () => {
    setLoading(true);
    try {
      await mockDepositService.seedMockData(userId);
      await loadData();
    } catch (error) {
      console.error('Erro ao criar dados mock:', error);
    } finally {
      setLoading(false);
    }
  };

  // Função para limpar dados
  const handleClearData = () => {
    mockDepositService.clearMockData();
    mockPixService.clearMockData();
    setStats(null);
    setTransactions([]);
  };

  // Função para forçar confirmação de uma transação
  const handleForceConfirm = async (transactionId) => {
    try {
      // Simular confirmação imediata
      const blockchainData = {
        transactionHash: '0x' + Math.random().toString(16).substr(2, 64),
        blockNumber: Math.floor(Math.random() * 1000000) + 1000000,
        gasUsed: Math.floor(Math.random() * 500000) + 100000,
        gasPrice: '20000000000',
        confirmations: 12,
        timestamp: new Date().toISOString()
      };

      // Atualizar no banco mock
      const { mockDatabase } = await import('@/services/mockDepositService');
      mockDatabase.updateTransaction(transactionId, {
        status: 'confirmed',
        blockchainData
      });

      await loadData();
    } catch (error) {
      console.error('Erro ao forçar confirmação:', error);
    }
  };

  // Função para forçar falha de uma transação
  const handleForceFail = async (transactionId) => {
    try {
      const { mockDatabase } = await import('@/services/mockDepositService');
      mockDatabase.updateTransaction(transactionId, {
        status: 'failed',
        metadata: {
          failureReason: 'Falha forçada via debug',
          failedAt: new Date().toISOString()
        }
      });

      await loadData();
    } catch (error) {
      console.error('Erro ao forçar falha:', error);
    }
  };

  if (!stats) {
    return (
      <Card className="p-4 mb-6">
        <div className="text-center">
          <Icon icon="heroicons:arrow-path" className="w-6 h-6 text-blue-500 animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-600 dark:text-gray-400">Carregando dados mock...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          🧪 Painel de Debug Mock
        </h3>
        <div className="flex space-x-2">
          <Button
            onClick={handleSeedData}
            disabled={loading}
            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 text-sm"
          >
            🌱 Criar Dados
          </Button>
          <Button
            onClick={handleClearData}
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 text-sm"
          >
            🧹 Limpar
          </Button>
          <Button
            onClick={loadData}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 text-sm"
          >
            🔄 Atualizar
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-7 gap-4 mb-4">
        <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Transações</div>
        </div>
        <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg">
          <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">{stats.pending}</div>
          <div className="text-xs text-yellow-600 dark:text-yellow-400">Pendentes</div>
        </div>
        <div className="text-center p-3 bg-green-50 dark:bg-green-900/30 rounded-lg">
          <div className="text-2xl font-bold text-green-700 dark:text-green-400">{stats.confirmed}</div>
          <div className="text-xs text-green-600 dark:text-green-400">Confirmadas</div>
        </div>
        <div className="text-center p-3 bg-red-50 dark:bg-red-900/30 rounded-lg">
          <div className="text-2xl font-bold text-red-700 dark:text-red-400">{stats.failed}</div>
          <div className="text-xs text-red-600 dark:text-red-400">Falharam</div>
        </div>
        <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
          <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
            R$ {stats.totalAmount.toFixed(2)}
          </div>
          <div className="text-xs text-blue-600 dark:text-blue-400">Total Confirmado</div>
        </div>
        <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
          <div className="text-2xl font-bold text-purple-700 dark:text-purple-400">
            {stats.pix?.total || 0}
          </div>
          <div className="text-xs text-purple-600 dark:text-purple-400">Pagamentos PIX</div>
        </div>
        <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/30 rounded-lg">
          <div className="text-2xl font-bold text-orange-700 dark:text-orange-400">
            {stats.pix?.paid || 0}
          </div>
          <div className="text-xs text-orange-600 dark:text-orange-400">PIX Pagos</div>
        </div>
      </div>

      {/* Transações */}
      {transactions.length > 0 && (
        <div>
          <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
            Transações do Usuário: {userId}
          </h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      #{tx.id}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      tx.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                      tx.status === 'confirmed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                      'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {tx.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    R$ {tx.amount?.toFixed(2)} • {new Date(tx.createdAt).toLocaleTimeString()}
                  </div>
                  {tx.blockchainData?.transactionHash && (
                    <div className="text-xs text-gray-500 dark:text-gray-500 font-mono">
                      Hash: {tx.blockchainData.transactionHash.substring(0, 10)}...
                    </div>
                  )}
                </div>
                
                <div className="flex space-x-1">
                  {tx.status === 'pending' && (
                    <>
                      <Button
                        onClick={() => handleForceConfirm(tx.id)}
                        className="bg-green-500 hover:bg-green-600 text-white p-1 text-xs"
                        title="Forçar Confirmação"
                      >
                        ✅
                      </Button>
                      <Button
                        onClick={() => handleForceFail(tx.id)}
                        className="bg-red-500 hover:bg-red-600 text-white p-1 text-xs"
                        title="Forçar Falha"
                      >
                        ❌
                      </Button>
                    </>
                  )}
                  <Button
                    onClick={() => window.open(`/deposit/tx/${tx.id}`, '_blank')}
                    className="bg-blue-500 hover:bg-blue-600 text-white p-1 text-xs"
                    title="Ver Detalhes"
                  >
                    👁️
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Informações */}
      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex items-start space-x-2">
          <Icon icon="heroicons:information-circle" className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-blue-700 dark:text-blue-300">
            <strong>Debug Info:</strong> Este painel mostra dados simulados em memória. 
            Use os botões para criar dados de teste, forçar confirmações/falhas, 
            ou limpar todos os dados. Os dados são atualizados automaticamente a cada 5 segundos.
          </div>
        </div>
      </div>
    </Card>
  );
};

export default MockDebugPanel;
