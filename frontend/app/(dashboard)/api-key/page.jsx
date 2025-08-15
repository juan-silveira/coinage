"use client";

import { useState } from "react";
import Icon from "@/components/ui/Icon";
import useDarkmode from "@/hooks/useDarkMode";

const ApiKeyPage = () => {
  const [isDark] = useDarkmode();
  const [apiKeys, setApiKeys] = useState([
    {
      id: 1,
      name: "Chave Principal",
      key: "sk_live_1234567890abcdef",
      permissions: ["read", "write"],
      lastUsed: "2025-08-15",
      status: "active",
      createdAt: "2025-01-01"
    },
    {
      id: 2,
      name: "Chave de Teste",
      key: "sk_test_0987654321fedcba",
      permissions: ["read"],
      lastUsed: "2025-08-10",
      status: "active",
      createdAt: "2025-01-05"
    },
    {
      id: 3,
      name: "Chave de Desenvolvimento",
      key: "sk_dev_abcdef1234567890",
      permissions: ["read", "write", "admin"],
      lastUsed: "2025-08-08",
      status: "revoked",
      createdAt: "2025-01-10"
    }
  ]);
  const [showNewKeyForm, setShowNewKeyForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState(["read"]);
  const [showKey, setShowKey] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const permissions = [
    { id: "read", label: "Leitura", description: "Acesso apenas para leitura de dados", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400" },
    { id: "write", label: "Escrita", description: "Acesso para criar e modificar dados", color: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400" },
    { id: "admin", label: "Administração", description: "Acesso completo ao sistema", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400" }
  ];

  // Classes baseadas no tema atual
  const themeClasses = {
    pageBg: isDark ? "bg-slate-900" : "bg-slate-50",
    cardBg: isDark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200",
    text: isDark ? "text-slate-300" : "text-slate-700",
    textSecondary: isDark ? "text-slate-400" : "text-slate-600",
    textMuted: isDark ? "text-slate-500" : "text-slate-500",
    border: isDark ? "border-slate-700" : "border-slate-200",
    input: isDark 
      ? "border-slate-600 bg-slate-700 text-white placeholder-slate-400 focus:ring-primary-500 focus:border-primary-500" 
      : "border-slate-300 bg-white text-slate-900 placeholder-slate-500 focus:ring-primary-500 focus:border-primary-500",
    button: isDark 
      ? "bg-slate-700 hover:bg-slate-600 text-slate-300" 
      : "bg-slate-200 hover:bg-slate-300 text-slate-700",
    statusBg: isDark ? "bg-slate-700" : "bg-slate-50",
    statusText: isDark ? "text-slate-300" : "text-slate-700"
  };

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
      status: "active",
      createdAt: new Date().toISOString().split('T')[0]
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

  const filteredKeys = apiKeys.filter(key => {
    const matchesSearch = key.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         key.key.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || key.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    if (status === "active") {
      return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
    }
    return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
  };

  return (
    <div className={`min-h-screen ${themeClasses.pageBg}`}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold mb-2 ${themeClasses.text}`}>
            Chaves da API
          </h1>
          <p className={`text-lg ${themeClasses.textSecondary}`}>
            Gerencie suas chaves de API para integrações e desenvolvimento
          </p>
        </div>

        {/* Controls */}
        <div className={`p-6 rounded-lg border ${themeClasses.cardBg} ${themeClasses.border} mb-6`}>
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Icon icon="heroicons-outline:search" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar chaves..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg ${themeClasses.input}`}
                />
              </div>

              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className={`px-4 py-2 border rounded-lg ${themeClasses.input}`}
              >
                <option value="all">Todos os Status</option>
                <option value="active">Ativas</option>
                <option value="revoked">Revogadas</option>
              </select>
            </div>

            {/* New Key Button */}
            <button
              onClick={() => setShowNewKeyForm(true)}
              className="inline-flex items-center px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
            >
              <Icon icon="heroicons-outline:plus" className="w-4 h-4 mr-2" />
              Nova Chave
            </button>
          </div>
        </div>

        {/* New Key Form */}
        {showNewKeyForm && (
          <div className={`p-6 rounded-lg border ${themeClasses.cardBg} ${themeClasses.border} mb-6`}>
            <h3 className={`text-xl font-semibold mb-4 ${themeClasses.text}`}>
              Criar Nova Chave da API
            </h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className={`block text-sm font-medium mb-2 ${themeClasses.text}`}>
                  Nome da Chave
                </label>
                <input
                  type="text"
                  placeholder="Ex: Chave de Produção"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg ${themeClasses.input}`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${themeClasses.text}`}>
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
                        <span className={`text-sm font-medium ${themeClasses.text}`}>
                          {permission.label}
                        </span>
                        <p className={`text-xs ${themeClasses.textMuted}`}>
                          {permission.description}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={generateNewKey}
                className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
              >
                Gerar Chave
              </button>
              <button
                onClick={() => setShowNewKeyForm(false)}
                className={`px-6 py-2 ${themeClasses.button} text-sm font-medium rounded-lg transition-colors duration-200`}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* API Keys List */}
        <div className="space-y-4">
          {filteredKeys.length === 0 ? (
            <div className={`text-center py-12 ${themeClasses.textSecondary}`}>
              <Icon icon="heroicons-outline:key" className="w-16 h-16 mx-auto mb-4 text-slate-400" />
              <p className="text-lg font-medium">Nenhuma chave encontrada</p>
              <p className="text-sm">Crie sua primeira chave da API para começar</p>
            </div>
          ) : (
            filteredKeys.map(apiKey => (
              <div
                key={apiKey.id}
                className={`p-6 border rounded-lg ${themeClasses.cardBg} ${themeClasses.border}`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  {/* Key Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className={`text-lg font-semibold mb-1 ${themeClasses.text}`}>
                          {apiKey.name}
                        </h4>
                        <p className={`text-sm ${themeClasses.textSecondary}`}>
                          Criada em {apiKey.createdAt} • Último uso: {apiKey.lastUsed}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusBadge(apiKey.status)}`}>
                          {apiKey.status === "active" ? "Ativa" : "Revogada"}
                        </span>
                        {apiKey.status === "active" && (
                          <button
                            onClick={() => revokeKey(apiKey.id)}
                            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                            title="Revogar chave"
                          >
                            <Icon icon="heroicons-outline:trash" className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* API Key Display */}
                    <div className="mb-4">
                      <label className={`block text-sm font-medium mb-2 ${themeClasses.text}`}>
                        Chave da API
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type={showKey[apiKey.id] ? "text" : "password"}
                          value={apiKey.key}
                          readOnly
                          className={`flex-1 px-3 py-2 border rounded-lg text-sm font-mono ${themeClasses.input}`}
                        />
                        <button
                          onClick={() => toggleKeyVisibility(apiKey.id)}
                          className={`px-3 py-2 ${themeClasses.button} rounded-lg`}
                          title={showKey[apiKey.id] ? "Ocultar" : "Mostrar"}
                        >
                          <Icon 
                            icon={showKey[apiKey.id] ? "heroicons-outline:eye-off" : "heroicons-outline:eye"} 
                            className="w-4 h-4" 
                          />
                        </button>
                        <button
                          onClick={() => copyToClipboard(apiKey.key)}
                          className={`px-3 py-2 ${themeClasses.button} rounded-lg`}
                          title="Copiar para área de transferência"
                        >
                          <Icon icon="heroicons-outline:clipboard" className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Permissions */}
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${themeClasses.text}`}>
                        Permissões
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {apiKey.permissions.map(permission => {
                          const permInfo = permissions.find(p => p.id === permission);
                          return (
                            <span
                              key={permission}
                              className={`px-3 py-1 text-xs rounded-full ${permInfo?.color || 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'}`}
                            >
                              {permInfo?.label || permission}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className={`p-6 rounded-lg border ${themeClasses.cardBg} ${themeClasses.border} text-center`}>
            <div className="text-2xl font-bold text-primary-600 mb-2">
              {apiKeys.filter(k => k.status === "active").length}
            </div>
            <div className={`text-sm ${themeClasses.textSecondary}`}>Chaves Ativas</div>
          </div>
          <div className={`p-6 rounded-lg border ${themeClasses.cardBg} ${themeClasses.border} text-center`}>
            <div className="text-2xl font-bold text-slate-600 mb-2">
              {apiKeys.filter(k => k.status === "revoked").length}
            </div>
            <div className={`text-sm ${themeClasses.textSecondary}`}>Chaves Revogadas</div>
          </div>
          <div className={`p-6 rounded-lg border ${themeClasses.cardBg} ${themeClasses.border} text-center`}>
            <div className="text-2xl font-bold text-green-600 mb-2">
              {apiKeys.length}
            </div>
            <div className={`text-sm ${themeClasses.textSecondary}`}>Total de Chaves</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyPage;
