"use client";

import { useState } from "react";
import Icon from "@/components/ui/Icon";

const ApiKeyModal = ({ isOpen, onClose }) => {
  const [apiKeys, setApiKeys] = useState([
    {
      id: 1,
      name: "Chave Principal",
      key: "sk_live_1234567890abcdef",
      permissions: ["read", "write"],
      lastUsed: "2025-08-15",
      status: "active"
    },
    {
      id: 2,
      name: "Chave de Teste",
      key: "sk_test_0987654321fedcba",
      permissions: ["read"],
      lastUsed: "2025-08-10",
      status: "active"
    }
  ]);
  const [showNewKeyForm, setShowNewKeyForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState(["read"]);
  const [showKey, setShowKey] = useState({});

  const permissions = [
    { id: "read", label: "Leitura", description: "Acesso apenas para leitura de dados" },
    { id: "write", label: "Escrita", description: "Acesso para criar e modificar dados" },
    { id: "admin", label: "Administração", description: "Acesso completo ao sistema" }
  ];

  const toggleKeyVisibility = (keyId) => {
    setShowKey(prev => ({
      ...prev,
      [keyId]: !prev[keyId]
    }));
  };

  const handlePermissionChange = (permissionId) => {
    setSelectedPermissions(prev => {
      if (prev.includes(permissionId)) {
        return prev.filter(p => p !== permissionId);
      } else {
        return [...prev, permissionId];
      }
    });
  };

  const generateNewKey = () => {
    if (!newKeyName.trim()) return;

    const newKey = {
      id: Date.now(),
      name: newKeyName,
      key: `sk_${Math.random().toString(36).substr(2, 9)}_${Date.now().toString(36)}`,
      permissions: selectedPermissions,
      lastUsed: new Date().toISOString().split('T')[0],
      status: "active"
    };

    setApiKeys(prev => [newKey, ...prev]);
    setNewKeyName("");
    setSelectedPermissions(["read"]);
    setShowNewKeyForm(false);
  };

  const revokeKey = (keyId) => {
    setApiKeys(prev => prev.map(key => 
      key.id === keyId ? { ...key, status: "revoked" } : key
    ));
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // Aqui você poderia mostrar uma notificação de sucesso
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            Chaves da API
          </h2>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowNewKeyForm(true)}
              className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
            >
              <Icon icon="heroicons-outline:plus" className="w-4 h-4 mr-2" />
              Nova Chave
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              <Icon icon="heroicons-outline:x" className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* New Key Form */}
          {showNewKeyForm && (
            <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">
                Criar Nova Chave da API
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Nome da Chave
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Chave de Produção"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-slate-600 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Permissões
                  </label>
                  <div className="space-y-2">
                    {permissions.map(permission => (
                      <label key={permission.id} className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedPermissions.includes(permission.id)}
                          onChange={() => handlePermissionChange(permission.id)}
                          className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-slate-300 rounded"
                        />
                        <div>
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            {permission.label}
                          </span>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {permission.description}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={generateNewKey}
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                  >
                    Gerar Chave
                  </button>
                  <button
                    onClick={() => setShowNewKeyForm(false)}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-600 dark:hover:bg-slate-500 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg transition-colors duration-200"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Existing API Keys */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-slate-900 dark:text-white">
              Chaves Existentes
            </h3>
            
            {apiKeys.map(apiKey => (
              <div
                key={apiKey.id}
                className={`p-4 border rounded-lg ${
                  apiKey.status === "active"
                    ? "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    : "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-slate-900 dark:text-white">
                      {apiKey.name}
                    </h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Último uso: {apiKey.lastUsed}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      apiKey.status === "active"
                        ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                        : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                    }`}>
                      {apiKey.status === "active" ? "Ativa" : "Revogada"}
                    </span>
                    {apiKey.status === "active" && (
                      <button
                        onClick={() => revokeKey(apiKey.id)}
                        className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <Icon icon="heroicons-outline:trash" className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  {/* API Key Display */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Chave da API
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type={showKey[apiKey.id] ? "text" : "password"}
                        value={apiKey.key}
                        readOnly
                        className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-mono"
                      />
                      <button
                        onClick={() => toggleKeyVisibility(apiKey.id)}
                        className="px-3 py-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      >
                        <Icon 
                          icon={showKey[apiKey.id] ? "heroicons-outline:eye-off" : "heroicons-outline:eye"} 
                          className="w-4 h-4" 
                        />
                      </button>
                      <button
                        onClick={() => copyToClipboard(apiKey.key)}
                        className="px-3 py-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      >
                        <Icon icon="heroicons-outline:clipboard" className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Permissions */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Permissões
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {apiKey.permissions.map(permission => (
                        <span
                          key={permission}
                          className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded"
                        >
                          {permission}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Close Button */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-medium rounded-lg transition-colors duration-200"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyModal;



