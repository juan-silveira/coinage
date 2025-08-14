"use client";
import React, { useState, useEffect } from 'react';

/**
 * Componente simples para testar se o React está funcionando
 * Testa apenas useState e useEffect básicos
 */
const SimpleStateTest = () => {
  const [count, setCount] = useState(0);
  const [renderCount, setRenderCount] = useState(0);
  const [lastUpdate, setLastUpdate] = useState('Nunca');

  // Contador de re-renderizações
  useEffect(() => {
    setRenderCount(prev => prev + 1);
    console.log('🔄 [SimpleStateTest] Componente re-renderizado, count:', count);
  });

  // Função para incrementar
  const handleIncrement = () => {
    console.log('🔍 [SimpleStateTest] Incrementando count de', count, 'para', count + 1);
    setCount(prev => {
      const newCount = prev + 1;
      console.log('🔄 [SimpleStateTest] setCount chamado com:', newCount);
      return newCount;
    });
    setLastUpdate(new Date().toLocaleTimeString());
  };

  // Função para decrementar
  const handleDecrement = () => {
    console.log('🔍 [SimpleStateTest] Decrementando count de', count, 'para', count - 1);
    setCount(prev => {
      const newCount = prev - 1;
      console.log('🔄 [SimpleStateTest] setCount chamado com:', newCount);
      return newCount;
    });
    setLastUpdate(new Date().toLocaleTimeString());
  };

  // Função para resetar
  const handleReset = () => {
    console.log('🔍 [SimpleStateTest] Resetando count para 0');
    setCount(0);
    setLastUpdate(new Date().toLocaleTimeString());
  };

  // Função para testar múltiplas atualizações
  const handleMultipleUpdates = () => {
    console.log('🔍 [SimpleStateTest] Testando múltiplas atualizações');
    
    // Atualização 1
    setCount(prev => {
      console.log('🔄 [SimpleStateTest] Atualização 1:', prev, '→', prev + 10);
      return prev + 10;
    });
    
    // Atualização 2
    setCount(prev => {
      console.log('🔄 [SimpleStateTest] Atualização 2:', prev, '→', prev + 20);
      return prev + 20;
    });
    
    // Atualização 3
    setCount(prev => {
      console.log('🔄 [SimpleStateTest] Atualização 3:', prev, '→', prev + 30);
      return prev + 30;
    });
    
    setLastUpdate(new Date().toLocaleTimeString());
  };

  // Função para testar atualização assíncrona
  const handleAsyncUpdate = async () => {
    console.log('🔍 [SimpleStateTest] Testando atualização assíncrona');
    
    // Simular operação assíncrona
    await new Promise(resolve => setTimeout(resolve, 100));
    
    setCount(prev => {
      const newCount = prev + 100;
      console.log('🔄 [SimpleStateTest] Atualização assíncrona:', prev, '→', newCount);
      return newCount;
    });
    
    setLastUpdate(new Date().toLocaleTimeString());
  };

  console.log('🔍 [SimpleStateTest] Renderizando com count:', count);

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        🧪 Teste Simples de Estado - React
      </h2>
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 text-gray-700">Status do Estado</h3>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-blue-50 p-3 rounded">
            <div className="text-sm text-blue-600">Count</div>
            <div className="text-xl font-bold text-blue-800">{count}</div>
          </div>
          <div className="bg-green-50 p-3 rounded">
            <div className="text-sm text-green-600">Re-renderizações</div>
            <div className="text-xl font-bold text-green-800">{renderCount}</div>
          </div>
          <div className="bg-orange-50 p-3 rounded">
            <div className="text-sm text-orange-600">Última Atualização</div>
            <div className="text-sm font-bold text-orange-800">{lastUpdate}</div>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 text-gray-700">Testes Básicos</h3>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleIncrement}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            ➕ Incrementar (+1)
          </button>
          
          <button
            onClick={handleDecrement}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            ➖ Decrementar (-1)
          </button>
          
          <button
            onClick={handleReset}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            🔄 Resetar (0)
          </button>
          
          <button
            onClick={handleMultipleUpdates}
            className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
          >
            🚀 Múltiplas Atualizações
          </button>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 text-gray-700">Teste Assíncrono</h3>
        <button
          onClick={handleAsyncUpdate}
          className="bg-indigo-500 text-white px-6 py-3 rounded-lg hover:bg-indigo-600 text-lg font-semibold"
        >
          ⏱️ Atualização Assíncrona (+100)
        </button>
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-3 text-gray-700">Logs do Console</h3>
        <div className="bg-gray-100 p-4 rounded">
          <p className="text-sm text-gray-600">
            Abra o console do navegador (F12) para ver os logs detalhados de cada operação.
          </p>
          <div className="mt-2 text-xs text-gray-500 space-y-1">
            <div>• Cada clique deve gerar logs no console</div>
            <div>• O count deve atualizar imediatamente na tela</div>
            <div>• O número de re-renderizações deve aumentar</div>
            <div>• A última atualização deve mostrar o horário atual</div>
          </div>
        </div>
      </div>

      <div className="text-sm text-gray-600">
        <p><strong>O que este teste verifica:</strong></p>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li><strong>useState:</strong> Se o estado está sendo atualizado corretamente</li>
          <li><strong>useEffect:</strong> Se o componente está re-renderizando</li>
          <li><strong>Eventos:</strong> Se os cliques estão sendo capturados</li>
          <li><strong>Atualizações:</strong> Se as mudanças aparecem na tela</li>
        </ul>
      </div>
    </div>
  );
};

export default SimpleStateTest;
