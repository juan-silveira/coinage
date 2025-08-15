"use client";

import { useState } from "react";
import Icon from "@/components/ui/Icon";
import Modal from "@/components/ui/Modal";
import useDarkmode from "@/hooks/useDarkMode";

const ChangePasswordModal = ({ isOpen, onClose }) => {
  const [isDark] = useDarkmode();
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Aqui você implementaria a lógica para alterar a senha
    console.log("Alterando senha:", formData);
    onClose();
  };

  // Classes baseadas no tema atual
  const themeClasses = {
    label: isDark ? "text-slate-300" : "text-slate-700",
    input: isDark 
      ? "border-slate-600 bg-slate-700 text-white placeholder-slate-400 focus:ring-primary-500 focus:border-primary-500" 
      : "border-slate-300 bg-white text-slate-900 placeholder-slate-500 focus:ring-primary-500 focus:border-primary-500",
    iconButton: isDark 
      ? "text-slate-400 hover:text-slate-200" 
      : "text-slate-400 hover:text-slate-600"
  };

  return (
    <Modal
      activeModal={isOpen}
      onClose={onClose}
      title="Alterar Senha"
      className="max-w-md"
      centered
    >
      <form onSubmit={handleSubmit} className="space-y-6">
          {/* Current Password */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${themeClasses.label}`}>
              Confirme a Senha Atual
            </label>
            <div className="relative">
              <input
                type={showPasswords.current ? "text" : "password"}
                placeholder="Digite a Senha Atual"
                value={formData.currentPassword}
                onChange={(e) => handleInputChange("currentPassword", e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 ${themeClasses.input}`}
                required
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility("current")}
                className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${themeClasses.iconButton}`}
              >
                <Icon 
                  icon={showPasswords.current ? "heroicons-outline:eye-off" : "heroicons-outline:eye"} 
                  className="w-5 h-5" 
                />
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${themeClasses.label}`}>
              Nova Senha
            </label>
            <div className="relative">
              <input
                type={showPasswords.new ? "text" : "password"}
                placeholder="Digite a Nova Senha"
                value={formData.newPassword}
                onChange={(e) => handleInputChange("newPassword", e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 ${themeClasses.input}`}
                required
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility("new")}
                className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${themeClasses.iconButton}`}
              >
                <Icon 
                  icon={showPasswords.new ? "heroicons-outline:eye-off" : "heroicons-outline:eye"} 
                  className="w-5 h-5" 
                />
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${themeClasses.label}`}>
              Confirme a Nova Senha
            </label>
            <div className="relative">
              <input
                type={showPasswords.confirm ? "text" : "password"}
                placeholder="Confirme a Nova Senha"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 ${themeClasses.input}`}
                required
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility("confirm")}
                className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${themeClasses.iconButton}`}
              >
                <Icon 
                  icon={showPasswords.confirm ? "heroicons-outline:eye-off" : "heroicons-outline:eye"} 
                  className="w-5 h-5" 
                />
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
          >
            Atualizar Senha
          </button>
      </form>
    </Modal>
  );
};

export default ChangePasswordModal;



