"use client";

import React, { useState } from "react";
import Icon from "@/components/ui/Icon";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import TwoFactorAuthModal from "@/components/partials/security/TwoFactorAuthModal";
import ChangePasswordModal from "@/components/partials/security/ChangePasswordModal";
import ApiKeyModal from "@/components/partials/security/ApiKeyModal";

const SecurityPage = () => {
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-8">
        <div className="px-2 sm:px-4 lg:px-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Seguranca
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Gerencie suas configuracoes de seguranca e privacidade
            </p>
          </div>

          {/* Security Settings */}
          <div className="space-y-6">
            {/* Password Section */}
            <Card>
              <div className="flex items-center justify-between p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <Icon icon="heroicons-outline:lock-closed" className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      Senha
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Altere sua senha para manter sua conta segura
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => setShowPasswordModal(true)}
                  className="btn-outline"
                >
                  Alterar Senha
                </Button>
              </div>
            </Card>

            {/* Two-Factor Authentication */}
            <Card>
              <div className="flex items-center justify-between p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                    <Icon icon="heroicons-outline:shield-check" className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      Autenticacao de Dois Fatores
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Adicione uma camada extra de seguranca a sua conta
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => setShow2FAModal(true)}
                  className="btn-outline"
                >
                  Configurar 2FA
                </Button>
              </div>
            </Card>

            {/* API Keys */}
            <Card>
              <div className="flex items-center justify-between p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                    <Icon icon="heroicons-outline:key" className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      Chaves de API
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Gerencie suas chaves de API para integracao com outros servicos
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => setShowApiKeyModal(true)}
                  className="btn-outline"
                >
                  Gerenciar Chaves
                </Button>
              </div>
            </Card>

            {/* Login Sessions */}
            <Card>
              <div className="p-6">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
                    <Icon icon="heroicons-outline:device-mobile" className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      Sessoes Ativas
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Visualize e gerencie suas sessoes de login ativas
                    </p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Icon icon="heroicons-outline:desktop-computer" className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          Chrome no Windows
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Ultimo acesso: agora
                        </p>
                      </div>
                    </div>
                    <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-1 rounded-full">
                      Atual
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Icon icon="heroicons-outline:device-mobile" className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          Safari no iPhone
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Ultimo acesso: 2 horas atras
                        </p>
                      </div>
                    </div>
                    <Button
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-xs"
                    >
                      Revogar
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            {/* Security Alerts */}
            <Card>
              <div className="p-6">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg">
                    <Icon icon="heroicons-outline:exclamation-triangle" className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      Alertas de Seguranca
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Configure notificacoes para atividades suspeitas
                    </p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                      Notificar sobre logins suspeitos
                    </span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                      Alertar sobre mudancas de senha
                    </span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                      Notificar sobre novos dispositivos
                    </span>
                  </label>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Modals */}
      <TwoFactorAuthModal
        isOpen={show2FAModal}
        onClose={() => setShow2FAModal(false)}
      />
      
      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />
      
      <ApiKeyModal
        isOpen={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
      />
    </>
  );
};

export default SecurityPage;