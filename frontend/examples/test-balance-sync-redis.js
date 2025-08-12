/**
 * Exemplo de teste para o sistema de sincronização de balances com Redis
 * 
 * Este arquivo demonstra como usar o hook useBalanceSync com integração Redis
 */

import React, { useState, useEffect } from 'react';
import useBalanceSync from '../hooks/useBalanceSync';

const TestBalanceSyncRedis = () => {
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);

  // Hook de sincronização de balances
  const {
    isActive,
    lastSync,
    syncError,
    balanceChanges,
    redisSyncStatus,
    startSync,
    stopSync,
    syncBalances,
    forceSyncBalances,
    forceRedisSync,
    clearChanges,
    formatLastSync
  } = useBalanceSync((changes, newBalances) => {
    console.log('🔄 Callback de atualização chamado:', { changes, newBalances });
    addTestResult('✅ Callback de atualização executado', { changes: changes.length, newBalances });
  });

  // Adicionar resultado de teste
  const addTestResult = (message, data = null) => {
    const timestamp = new Date().toLocaleTimeString();
    setTestResults(prev => [...prev, { timestamp, message, data }]);
  };

  // Teste 1: Iniciar sincronização
  const testStartSync = async () => {
    try {
      setIsRunning(true);
      addTestResult('🚀 Iniciando teste de sincronização...');
      
      await startSync();
      addTestResult('✅ Sincronização iniciada com sucesso');
      
    } catch (error) {
      addTestResult('❌ Erro ao iniciar sincronização', { error: error.message });
    } finally {
      setIsRunning(false);
    }
  };

  // Teste 2: Sincronização manual
  const testManualSync = async () => {
    try {
      setIsRunning(true);
      addTestResult('🔄 Executando sincronização manual...');
      
      await syncBalances();
      addTestResult('✅ Sincronização manual concluída');
      
    } catch (error) {
      addTestResult('❌ Erro na sincronização manual', { error: error.message });
    } finally {
      setIsRunning(false);
    }
  };

  // Teste 3: Sincronização forçada
  const testForceSync = async () => {
    try {
      setIsRunning(true);
      addTestResult('💪 Executando sincronização forçada...');
      
      await forceSyncBalances();
      addTestResult('✅ Sincronização forçada concluída');
      
    } catch (error) {
      addTestResult('❌ Erro na sincronização forçada', { error: error.message });
    } finally {
      setIsRunning(false);
    }
  };

  // Teste 4: Sincronização Redis
  const testRedisSync = async () => {
    try {
      setIsRunning(true);
      addTestResult('🔄 Executando sincronização Redis...');
      
      await forceRedisSync();
      addTestResult('✅ Sincronização Redis concluída');
      
    } catch (error) {
      addTestResult('❌ Erro na sincronização Redis', { error: error.message });
    } finally {
      setIsRunning(false);
    }
  };

  // Teste 5: Parar sincronização
  const testStopSync = () => {
    try {
      addTestResult('⏹️ Parando sincronização...');
      stopSync();
      addTestResult('✅ Sincronização parada com sucesso');
    } catch (error) {
      addTestResult('❌ Erro ao parar sincronização', { error: error.message });
    }
  };

  // Teste 6: Limpar histórico
  const testClearChanges = () => {
    try {
      addTestResult('🗑️ Limpando histórico de mudanças...');
      clearChanges();
      addTestResult('✅ Histórico limpo com sucesso');
    } catch (error) {
      addTestResult('❌ Erro ao limpar histórico', { error: error.message });
    }
  };

  // Teste 7: Verificar status
  const testCheckStatus = () => {
    const status = {
      isActive,
      lastSync: formatLastSync(),
      syncError,
      balanceChangesCount: balanceChanges.length,
      redisSyncStatus
    };
    
    addTestResult('📊 Status atual do sistema', status);
  };

  // Teste 8: Simular mudanças de balance
  const testSimulateChanges = () => {
    addTestResult('🎭 Simulando mudanças de balance...');
    
    // Simular mudanças (apenas para teste)
    const mockChanges = [
      {
        token: 'AZE',
        previousBalance: '100.000000',
        newBalance: '150.000000',
        difference: '50.000000',
        type: 'increase',
        timestamp: new Date().toISOString()
      },
      {
        token: 'cBRL',
        previousBalance: '1000.000000',
        newBalance: '950.000000',
        difference: '-50.000000',
        type: 'decrease',
        timestamp: new Date().toISOString()
      }
    ];
    
    addTestResult('✅ Mudanças simuladas', { changes: mockChanges });
  };

  // Limpar resultados
  const clearResults = () => {
    setTestResults([]);
  };

  // Auto-teste ao montar componente
  useEffect(() => {
    addTestResult('🔍 Componente montado - sistema pronto para testes');
    testCheckStatus();
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">
        🧪 Teste do Sistema de Sincronização de Balances com Redis
      </h1>

      {/* Status do Sistema */}
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-3">📊 Status do Sistema</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{isActive ? '🟢' : '🔴'}</div>
            <div className="text-sm text-gray-600">Ativo</div>
            <div className="font-semibold">{isActive ? 'Sim' : 'Não'}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">🕒</div>
            <div className="text-sm text-gray-600">Última Sincronização</div>
            <div className="font-semibold">{formatLastSync()}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">💰</div>
            <div className="text-sm text-gray-600">Mudanças</div>
            <div className="font-semibold">{balanceChanges.length}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">🔄</div>
            <div className="text-sm text-gray-600">Status Redis</div>
            <div className="font-semibold">{redisSyncStatus}</div>
          </div>
        </div>
      </div>

      {/* Botões de Teste */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <button
          onClick={testStartSync}
          disabled={isRunning || isActive}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-semibold"
        >
          🚀 Iniciar Sync
        </button>
        
        <button
          onClick={testManualSync}
          disabled={isRunning}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-semibold"
        >
          🔄 Sync Manual
        </button>
        
        <button
          onClick={testForceSync}
          disabled={isRunning}
          className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-semibold"
        >
          💪 Sync Forçada
        </button>
        
        <button
          onClick={testRedisSync}
          disabled={isRunning}
          className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-semibold"
        >
          🔄 Sync Redis
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <button
          onClick={testStopSync}
          disabled={!isActive}
          className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-semibold"
        >
          ⏹️ Parar Sync
        </button>
        
        <button
          onClick={testCheckStatus}
          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-semibold"
        >
          📊 Ver Status
        </button>
        
        <button
          onClick={testSimulateChanges}
          className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg font-semibold"
        >
          🎭 Simular Mudanças
        </button>
        
        <button
          onClick={testClearChanges}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold"
        >
          🗑️ Limpar Histórico
        </button>
      </div>

      {/* Botões de Utilidade */}
      <div className="flex justify-center mb-6">
        <button
          onClick={clearResults}
          className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-semibold"
        >
          🧹 Limpar Resultados
        </button>
      </div>

      {/* Resultados dos Testes */}
      <div className="bg-white border rounded-lg p-4">
        <h2 className="text-xl font-semibold mb-3">📋 Resultados dos Testes</h2>
        <div className="max-h-96 overflow-y-auto">
          {testResults.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Nenhum teste executado ainda</p>
          ) : (
            testResults.map((result, index) => (
              <div key={index} className="border-b py-2 last:border-b-0">
                <div className="flex items-start gap-3">
                  <span className="text-sm text-gray-500 min-w-[80px]">{result.timestamp}</span>
                  <div className="flex-1">
                    <div className="font-medium">{result.message}</div>
                    {result.data && (
                      <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Mudanças de Balance */}
      {balanceChanges.length > 0 && (
        <div className="bg-white border rounded-lg p-4 mt-6">
          <h2 className="text-xl font-semibold mb-3">💰 Mudanças Detectadas</h2>
          <div className="space-y-2">
            {balanceChanges.map((change, index) => (
              <div key={index} className="bg-gray-50 p-3 rounded border">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    change.type === 'increase' ? 'bg-green-100 text-green-800' :
                    change.type === 'decrease' ? 'bg-red-100 text-red-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {change.type === 'increase' ? '📈' : 
                     change.type === 'decrease' ? '📉' : '🆕'} {change.type}
                  </span>
                  <span className="font-semibold">{change.token}</span>
                </div>
                <div className="text-sm text-gray-600">
                  <div>Anterior: {change.previousBalance}</div>
                  <div>Novo: {change.newBalance}</div>
                  <div>Diferença: {change.difference}</div>
                  <div>Timestamp: {new Date(change.timestamp).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Erros */}
      {syncError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-6">
          <h2 className="text-xl font-semibold mb-3 text-red-800">❌ Erro de Sincronização</h2>
          <div className="text-red-700">{syncError}</div>
        </div>
      )}
    </div>
  );
};

export default TestBalanceSyncRedis;
