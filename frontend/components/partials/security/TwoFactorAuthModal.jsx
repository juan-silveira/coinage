"use client";

import { useState } from "react";
import Icon from "@/components/ui/Icon";
import Modal from "@/components/ui/Modal";
import useDarkmode from "@/hooks/useDarkMode";

const TwoFactorAuthModal = ({ isOpen, onClose }) => {
  const [isDark] = useDarkmode();
  const [is2FAEnabled, setIs2FAEnabled] = useState(true);
  const [showQRCode, setShowQRCode] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");

  const handleToggle2FA = () => {
    if (is2FAEnabled) {
      // Desativar 2FA
      setIs2FAEnabled(false);
    } else {
      // Ativar 2FA - mostrar QR code
      setShowQRCode(true);
    }
  };

  const handleVerifyCode = (e) => {
    e.preventDefault();
    // Aqui você implementaria a verificação do código
    console.log("Verificando código:", verificationCode);
    if (verificationCode.length === 6) {
      setIs2FAEnabled(true);
      setShowQRCode(false);
      setVerificationCode("");
    }
  };

  const handleDisable2FA = () => {
    setIs2FAEnabled(false);
    onClose();
  };

  // Classes baseadas no tema atual
  const themeClasses = {
    label: isDark ? "text-slate-300" : "text-slate-700",
    input: isDark 
      ? "border-slate-600 bg-slate-600 text-white placeholder-slate-400 focus:ring-primary-500 focus:border-primary-500" 
      : "border-slate-300 bg-white text-slate-900 placeholder-slate-500 focus:ring-primary-500 focus:border-primary-500",
    statusBg: isDark ? "bg-slate-700" : "bg-slate-50",
    statusText: isDark ? "text-slate-300" : "text-slate-700",
    qrBg: isDark ? "bg-slate-700" : "bg-slate-50",
    qrText: isDark ? "text-slate-300" : "text-slate-700",
    backupBg: isDark ? "bg-slate-700" : "bg-slate-50",
    backupText: isDark ? "text-slate-400" : "text-slate-600",
    codeBg: isDark ? "bg-slate-600" : "bg-white",
    codeText: isDark ? "text-slate-300" : "text-slate-700",
    closeButton: isDark 
      ? "bg-slate-700 hover:bg-slate-600 text-slate-300" 
      : "bg-slate-200 hover:bg-slate-300 text-slate-700"
  };

  return (
    <Modal
      activeModal={isOpen}
      onClose={onClose}
      title="Autenticação de Dois Fatores (2FA)"
      className="max-w-md"
      centered
    >
          {/* Status */}
          <div className="mb-6">
            <div className={`flex items-center justify-between p-4 rounded-lg ${themeClasses.statusBg}`}>
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${
                  is2FAEnabled ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <span className={`text-sm font-medium ${themeClasses.statusText}`}>
                  Status: {is2FAEnabled ? 'Ativo' : 'Inativo'}
                </span>
              </div>
              <button
                onClick={handleToggle2FA}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  is2FAEnabled
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {is2FAEnabled ? 'Desativar' : 'Ativar'}
              </button>
            </div>
          </div>

          {/* QR Code Section */}
          {showQRCode && (
            <div className={`mb-6 p-4 rounded-lg ${themeClasses.qrBg}`}>
              <h3 className={`text-sm font-medium mb-3 ${themeClasses.qrText}`}>
                Escaneie o QR Code com seu app de autenticação
              </h3>
              <div className="flex justify-center mb-4">
                <div className="w-32 h-32 bg-white p-2 rounded-lg">
                  {/* Placeholder para QR Code */}
                  <div className="w-full h-full bg-slate-200 dark:bg-slate-600 rounded flex items-center justify-center">
                    <Icon icon="heroicons-outline:qrcode" className="w-16 h-16 text-slate-400" />
                  </div>
                </div>
              </div>
              
              {/* Verification Code Input */}
              <form onSubmit={handleVerifyCode} className="space-y-3">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${themeClasses.label}`}>
                    Código de Verificação
                  </label>
                  <input
                    type="text"
                    placeholder="Digite o código de 6 dígitos"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg text-center text-lg tracking-widest transition-colors duration-200 ${themeClasses.input}`}
                    maxLength={6}
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  Verificar e Ativar
                </button>
              </form>
            </div>
          )}

          {/* Backup Codes */}
          {is2FAEnabled && (
            <div className="mb-6">
              <h3 className={`text-sm font-medium mb-3 ${themeClasses.label}`}>
                Códigos de Backup
              </h3>
              <div className={`p-4 rounded-lg ${themeClasses.backupBg}`}>
                <p className={`text-sm mb-3 ${themeClasses.backupText}`}>
                  Guarde estes códigos em um local seguro. Você pode usá-los para acessar sua conta se perder seu dispositivo.
                </p>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {['123456', '234567', '345678', '456789', '567890', '678901'].map((code, index) => (
                    <div key={index} className={`px-3 py-2 rounded text-center font-mono text-sm ${themeClasses.codeBg} ${themeClasses.codeText}`}>
                      {code}
                    </div>
                  ))}
                </div>
                <button className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
                  Gerar Novos Códigos
                </button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3">
            {is2FAEnabled && (
              <button
                onClick={handleDisable2FA}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Desativar 2FA
              </button>
            )}
            <button
              onClick={onClose}
              className={`flex-1 font-medium py-2 px-4 rounded-lg transition-colors duration-200 ${themeClasses.closeButton}`}
            >
              Fechar
            </button>
          </div>
    </Modal>
  );
};

export default TwoFactorAuthModal;



