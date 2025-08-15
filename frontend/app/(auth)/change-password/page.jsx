"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SimpleInput from "@/components/ui/SimpleInput";
import useGlobalAlert from "@/hooks/useGlobalAlert";
import useAuthStore from "@/store/authStore";
import { authService } from "@/services/api";
import useDarkMode from "@/hooks/useDarkMode";

const ChangePasswordPage = () => {
  const router = useRouter();
  const { 
    isAuthenticated, 
    requiresPasswordChange, 
    isLoading, 
    setLoading,
    clearRequiresPasswordChange 
  } = useAuthStore();
  const [isDark] = useDarkMode();
  const { showSuccess, showError } = useGlobalAlert();
  
  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});

  // Verificar se precisa trocar senha
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/');
      return;
    }
    
    if (!requiresPasswordChange) {
      router.push('/');
    }
  }, [isAuthenticated, requiresPasswordChange, router]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpar erro do campo
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const errors = [];
    
    if (password.length < minLength) {
      errors.push(`Mínimo de ${minLength} caracteres`);
    }
    if (!hasUpperCase) {
      errors.push("Pelo menos uma letra maiúscula");
    }
    if (!hasLowerCase) {
      errors.push("Pelo menos uma letra minúscula");
    }
    if (!hasNumbers) {
      errors.push("Pelo menos um número");
    }
    if (!hasSpecialChar) {
      errors.push("Pelo menos um caractere especial");
    }

    return errors;
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.oldPassword) {
      newErrors.oldPassword = "Senha atual é obrigatória";
    }

    if (!formData.newPassword) {
      newErrors.newPassword = "Nova senha é obrigatória";
    } else {
      const passwordErrors = validatePassword(formData.newPassword);
      if (passwordErrors.length > 0) {
        newErrors.newPassword = passwordErrors.join(", ");
      }
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Confirmação de senha é obrigatória";
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "As senhas não coincidem";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await authService.changePassword(formData.oldPassword, formData.newPassword);
      
      // Limpar flag de troca de senha
      clearRequiresPasswordChange();
      
      showSuccess("Senha alterada com sucesso!");
      
      // Redirecionar para o dashboard
      router.push('/');
      
    } catch (error) {
      let errorMessage = "Erro ao alterar senha";
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 401) {
        errorMessage = "Senha atual incorreta";
      } else if (error.response?.status === 0) {
        errorMessage = "Erro de conexão com o servidor";
      }
      
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated || !requiresPasswordChange) {
    return null;
  }

  return (
    <>
      <div className="loginwrapper">
        <div className="lg-inner-column">
          <div className="left-column relative z-[1]">
            <div className="max-w-[520px] pt-20 ltr:pl-20 rtl:pr-20">
              <Link href="/">
                <img
                  src={
                    isDark
                      ? "/assets/images/logo/logo-white.svg"
                      : "/assets/images/logo/logo.svg"
                  }
                  alt=""
                  className="mb-10"
                />
              </Link>
              <h4>
                Mantenha sua{" "}
                <span className="text-slate-800 dark:text-slate-400 font-bold">
                  segurança
                </span>{" "}
                sempre atualizada
              </h4>
            </div>
            <div className="absolute left-0 2xl:bottom-[-160px] bottom-[-130px] h-full w-full z-[-1]">
              <img
                src="/assets/images/auth/ils1.svg"
                alt=""
                className="h-full w-full object-contain"
              />
            </div>
          </div>
          <div className="right-column relative">
            <div className="inner-content h-full flex flex-col bg-white dark:bg-slate-800">
              <div className="auth-box h-full flex flex-col justify-center">
                <div className="mobile-logo text-center mb-6 lg:hidden block">
                  <Link href="/">
                    <img
                      src={
                        isDark
                          ? "/assets/images/logo/logo-white.svg"
                          : "/assets/images/logo/logo.svg"
                      }
                      alt=""
                      className="mx-auto"
                    />
                  </Link>
                </div>
                <div className="text-center 2xl:mb-10 mb-4">
                  <h4 className="font-medium">Alterar Senha</h4>
                  <div className="text-slate-500 text-base">
                    Por segurança, você precisa alterar sua senha no primeiro acesso
                  </div>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <SimpleInput
                    type="password"
                    name="oldPassword"
                    label="Senha Atual"
                    value={formData.oldPassword}
                    onChange={handleInputChange}
                    placeholder="Digite sua senha atual"
                    error={errors.oldPassword}
                    required
                  />

                  <SimpleInput
                    type="password"
                    name="newPassword"
                    label="Nova Senha"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    placeholder="Digite a nova senha"
                    error={errors.newPassword}
                    required
                  />
                  <div className="mt-2 text-xs text-slate-500">
                    A senha deve conter pelo menos 8 caracteres, incluindo maiúsculas, minúsculas, números e caracteres especiais.
                  </div>

                  <SimpleInput
                    type="password"
                    name="confirmPassword"
                    label="Confirmar Nova Senha"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirme a nova senha"
                    error={errors.confirmPassword}
                    required
                  />

                  <button 
                    type="submit"
                    className="btn btn-dark block w-full text-center"
                    disabled={isLoading}
                  >
                    {isLoading ? "Alterando..." : "Alterar Senha"}
                  </button>
                </form>
              </div>
              <div className="auth-footer text-center">
                Copyright 2025, Coinage All Rights Reserved.
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChangePasswordPage;
