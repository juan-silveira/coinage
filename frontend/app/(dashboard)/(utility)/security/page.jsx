"use client";

import React, { useState } from "react";
import Icon from "@/components/ui/Icon";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import TwoFactorAuthModal from "@/components/partials/security/TwoFactorAuthModal";
import ChangePasswordModal from "@/components/partials/security/ChangePasswordModal";
import Link from "next/link";

const SecurityPage = () => {
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  return (
    <>
      <div className="min-h-screen py-8">
        <div className="px-2 sm:px-4 lg:px-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Segurança
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Gerencie suas configurações de segurança e privacidade
            </p>
          </div>

          {/* Security Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Change Password */}
            <Card className="p-6 bg-white dark:bg-slate-800">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mr-4">
                  <Icon icon="heroicons-outline:lock-closed" className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Alterar Senha
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Atualize sua senha regularmente
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setShowPasswordModal(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                Alterar Senha
              </Button>
            </Card>

            {/* Two-Factor Authentication */}
            <Card className="p-6 bg-white dark:bg-slate-800">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mr-4">
                  <Icon icon="heroicons-outline:shield-check" className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Autenticação 2FA
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Proteção adicional para sua conta
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setShow2FAModal(true)}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                Configurar 2FA
              </Button>
            </Card>

            {/* API Keys */}
            <Card className="p-6 bg-white dark:bg-slate-800">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mr-4">
                  <Icon icon="heroicons-outline:key" className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Chaves da API
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Gerencie suas chaves de integração
                  </p>
                </div>
              </div>
              <Link href="/api-key">
                <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                  Gerenciar Chaves
                </Button>
              </Link>
            </Card>

            {/* Login History */}
            <Card className="p-6 bg-white dark:bg-slate-800">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center mr-4">
                  <Icon icon="heroicons-outline:clock" className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Histórico de Login
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Monitore acessos à sua conta
                  </p>
                </div>
              </div>
              <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white">
                Ver Histórico
              </Button>
            </Card>

            {/* Device Management */}
            <Card className="p-6 bg-white dark:bg-slate-800">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center mr-4">
                  <Icon icon="heroicons-outline:device-phone-mobile" className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Dispositivos
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Gerencie dispositivos conectados
                  </p>
                </div>
              </div>
              <Button className="w-full bg-red-600 hover:bg-red-700 text-white">
                Gerenciar Dispositivos
              </Button>
            </Card>

            {/* Privacy Settings */}
            <Card className="p-6 bg-white dark:bg-slate-800">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center mr-4">
                  <Icon icon="heroicons-outline:eye-slash" className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Privacidade
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Configure suas preferências de privacidade
                  </p>
                </div>
              </div>
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                Configurar Privacidade
              </Button>
            </Card>
          </div>

          {/* Security Tips */}
          <div className="mt-8">
            <Card className="p-6 bg-white dark:bg-slate-800">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Dicas de Segurança
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start space-x-3">
                  <Icon icon="heroicons-outline:check-circle" className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Senha Forte</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Use senhas com pelo menos 8 caracteres, incluindo letras, números e símbolos
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Icon icon="heroicons-outline:check-circle" className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Ative o 2FA</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      A autenticação de dois fatores adiciona uma camada extra de segurança
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Icon icon="heroicons-outline:check-circle" className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Monitore Atividade</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Verifique regularmente o histórico de login e dispositivos conectados
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Icon icon="heroicons-outline:check-circle" className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Chaves da API</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Revogue chaves da API que não estão mais sendo utilizadas
                    </p>
                  </div>
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
    </>
  );
};

export default SecurityPage;