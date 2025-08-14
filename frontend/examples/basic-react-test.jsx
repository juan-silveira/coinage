"use client";
import React, { useState, useEffect } from 'react';

/**
 * Teste ultra-básico do React - sem dependências externas
 */
const BasicReactTest = () => {
  const [counter, setCounter] = useState(0);
  const [clicks, setClicks] = useState(0);
  const [lastClick, setLastClick] = useState('Nunca');

  // Log de cada renderização
  useEffect(() => {
    console.log('🔄 [BasicReactTest] Componente renderizado, counter:', counter, 'clicks:', clicks);
  });

  // Função simples de incremento
  const handleClick = () => {
    console.log('🔍 [BasicReactTest] Botão clicado!');
    console.log('🔍 [BasicReactTest] Estado atual - counter:', counter, 'clicks:', clicks);
    
    // Atualizar contador
    setCounter(prev => {
      const newValue = prev + 1;
      console.log('🔄 [BasicReactTest] setCounter chamado:', prev, '→', newValue);
      return newValue;
    });
    
    // Atualizar cliques
    setClicks(prev => {
      const newValue = prev + 1;
      console.log('🔄 [BasicReactTest] setClicks chamado:', prev, '→', newValue);
      return newValue;
    });
    
    // Atualizar timestamp
    const now = new Date().toLocaleTimeString();
    setLastClick(now);
    console.log('🔄 [BasicReactTest] Timestamp atualizado:', now);
  };

  // Função para resetar
  const handleReset = () => {
    console.log('🔍 [BasicReactTest] Resetando tudo...');
    setCounter(0);
    setClicks(0);
    setLastClick('Nunca');
  };

  // Função para testar múltiplas atualizações
  const handleMultiple = () => {
    console.log('🔍 [BasicReactTest] Testando múltiplas atualizações...');
    
    setCounter(100);
    setCounter(200);
    setCounter(300);
    setClicks(prev => prev + 3);
  };

  console.log('🔍 [BasicReactTest] Renderizando - counter:', counter, 'clicks:', clicks);

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        🧪 Teste Ultra-Básico - React
      </h2>
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 text-gray-700">Estado Atual</h3>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-blue-50 p-3 rounded">
            <div className="text-sm text-blue-600">Counter</div>
            <div className="text-xl font-bold text-blue-800">{counter}</div>
          </div>
          <div className="bg-green-50 p-3 rounded">
            <div className="text-sm text-green-600">Clicks</div>
            <div className="text-xl font-bold text-green-800">{clicks}</div>
          </div>
          <div className="bg-orange-50 p-3 rounded">
            <div className="text-sm text-orange-600">Último Click</div>
            <div className="text-sm font-bold text-orange-800">{lastClick}</div>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 text-gray-700">Ações</h3>
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={handleClick}
            className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 text-lg font-semibold"
          >
            🖱️ Clicar Aqui
          </button>
          
          <button
            onClick={handleReset}
            className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 text-lg font-semibold"
          >
            🔄 Resetar
          </button>
          
          <button
            onClick={handleMultiple}
            className="bg-purple-500 text-white px-6 py-3 rounded-lg hover:bg-purple-600 text-lg font-semibold"
          >
            🚀 Múltiplas
          </button>
        </div>
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-3 text-gray-700">Instruções</h3>
        <div className="bg-gray-100 p-4 rounded">
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
            <li>Abra o console do navegador (F12)</li>
            <li>Clique em "🖱️ Clicar Aqui" várias vezes</li>
            <li>Observe se os números mudam na tela</li>
            <li>Verifique se há logs no console</li>
            <li>Teste os outros botões também</li>
          </ol>
        </div>
      </div>

      <div className="text-sm text-gray-600">
        <p><strong>O que deve acontecer:</strong></p>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>✅ <strong>Counter</strong> deve aumentar a cada clique</li>
          <li>✅ <strong>Clicks</strong> deve mostrar o total de cliques</li>
          <li>✅ <strong>Último Click</strong> deve mostrar o horário atual</li>
          <li>✅ <strong>Console</strong> deve mostrar logs a cada operação</li>
        </ul>
        
        <p className="mt-3"><strong>Se NÃO funcionar:</strong></p>
        <ul className="list-disc list-inside mt-2 space-y-1 text-red-600">
          <li>❌ Há um problema fundamental no React</li>
          <li>❌ Pode ser um problema de build ou configuração</li>
          <li>❌ Pode ser um problema de JavaScript</li>
        </ul>
      </div>
    </div>
  );
};

export default BasicReactTest;
