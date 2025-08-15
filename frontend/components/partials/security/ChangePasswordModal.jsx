"use client";

import { useState } from "react";
import Icon from "@/components/ui/Icon";
import Modal from "@/components/ui/Modal";
import useDarkmode from "@/hooks/useDarkMode";
import useAuthStore from "@/store/authStore";
import { authService } from "@/services/api";
import { useAlertContext } from "@/contexts/AlertContext";
import { validatePassword } from "@/utils/passwordValidation";
import PasswordStrengthIndicator from "@/components/ui/PasswordStrengthIndicator";

const ChangePasswordModal = ({ isOpen, onClose }) => {
  const [isDark] = useDarkmode();
  const { accessToken } = useAuthStore();
  const { showSuccess, showError } = useAlertContext();
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
  const [isLoading, setIsLoading] = useState(false);

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

  const validateForm = () => {
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      showError("Todos os campos são obrigatórios");
      return false;
    }

    // Validação de senha forte
    const passwordValidation = validatePassword(formData.newPassword);
    if (!passwordValidation.isValid) {
      showError(`Senha não atende aos critérios de segurança:\n${passwordValidation.errors.join('\n')}`);
      return false;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      showError("A nova senha e a confirmação não coincidem");
      return false;
    }

    if (formData.currentPassword === formData.newPassword) {
      showError("A nova senha deve ser diferente da senha atual");
      return false;
    }

    return true;
  };

  // Verificar se o formulário pode ser submetido
  const canSubmit = () => {
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      return false;
    }

    const passwordValidation = validatePassword(formData.newPassword);
    if (!passwordValidation.isValid) {
      return false;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const data = await authService.changePassword(
        formData.currentPassword,
        formData.newPassword
      );

      if (data.success) {
        showSuccess("Senha alterada com sucesso!");
        setFormData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        });
        // Fechar modal em caso de sucesso
        onClose();
      } else {
        showError(data.message || "Erro ao alterar senha");
      }
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      if (error.response?.data?.message) {
        showError(error.response.data.message);
      } else {
        showError("Erro de conexão. Tente novamente.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Classes baseadas no tema atual
  const themeClasses = {
    label: isDark ? "text-slate-300" : "text-slate-700",
    input: isDark 
      ? "bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500" 
      : "bg-white border-slate-300 text-slate-900 placeholder-slate-500 focus:border-blue-500 focus:ring-blue-500",
    iconButton: isDark 
      ? "text-slate-400 hover:text-slate-300" 
      : "text-slate-500 hover:text-slate-700"
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
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility("current")}
              className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${themeClasses.iconButton}`}
              disabled={isLoading}
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
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility("new")}
              className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${themeClasses.iconButton}`}
              disabled={isLoading}
            >
              <Icon 
                icon={showPasswords.new ? "heroicons-outline:eye-off" : "heroicons-outline:eye"} 
                className="w-5 h-5" 
              />
            </button>
          </div>
          {formData.newPassword && (
            <PasswordStrengthIndicator password={formData.newPassword} />
          )}
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
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility("confirm")}
              className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${themeClasses.iconButton}`}
              disabled={isLoading}
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
          disabled={isLoading || !canSubmit()}
          className={`w-full font-medium py-3 px-4 rounded-lg transition-colors duration-200 ${
            isLoading || !canSubmit()
              ? 'bg-gray-400 cursor-not-allowed text-white'
              : 'bg-primary-600 hover:bg-primary-700 text-white'
          }`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <Icon icon="heroicons-outline:refresh" className="w-5 h-5 animate-spin mr-2" />
              Alterando...
            </div>
          ) : (
            'Atualizar Senha'
          )}
        </button>
      </form>
    </Modal>
  );
};

export default ChangePasswordModal;



