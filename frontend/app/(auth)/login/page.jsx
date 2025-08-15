"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SimpleInput from "@/components/ui/SimpleInput";
import { useAlertContext } from "@/contexts/AlertContext";
import useAuthStore from "@/store/authStore";
import { authService } from "@/services/api";
import useDarkMode from "@/hooks/useDarkMode";

const LoginPage = () => {
  const router = useRouter();
  const { login, isAuthenticated, isLoading, setLoading } = useAuthStore();
  const [isDark] = useDarkMode();
  const { showSuccess, showError } = useAlertContext();
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});

  // Alterar title da página
  useEffect(() => {
    document.title = 'Coinage - Login';
  }, []);

  // Verificar se já está autenticado
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  // Verificar toasts do sessionStorage
  useEffect(() => {
    // Limpar resíduos de sessões anteriores (exceto logout se vier de uma sessão válida)
    const currentUrl = window.location.pathname;
    if (currentUrl === '/login') {
      // Se estamos na página de login, limpar flags de login
      sessionStorage.removeItem('showLoginError');
      sessionStorage.removeItem('showLoginSuccess');
      sessionStorage.removeItem('loginUserName');
    }

    // Verificar se há sucesso de logout (só mostrar se vier de uma sessão válida)
    const logoutSuccess = sessionStorage.getItem('showLogoutSuccess');
    if (logoutSuccess) {
      showSuccess("Logout realizado com sucesso");
      sessionStorage.removeItem('showLogoutSuccess');
    }

    // Verificar se há erro na URL (após redirecionamento)
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    if (error === 'auth') {
      showError("Email ou senha incorretos");
      // Limpar o parâmetro da URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

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

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = "Email é obrigatório";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email inválido";
    }

    if (!formData.password) {
      newErrors.password = "Senha é obrigatória";
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
      const response = await authService.login(formData.email, formData.password);
      
      // Extrair dados da estrutura correta: response.data
      const { user, accessToken, refreshToken, isFirstAccess } = response.data;
      
      // Fazer login no store
      login(user, accessToken, refreshToken, isFirstAccess);
      
      // Redirecionar baseado na necessidade de trocar senha
      if (isFirstAccess) {
        router.push('/change-password');
      } else {
        router.push('/');
      }
      
    } catch (error) {
      setLoading(false);
      
      let errorMessage = "Erro ao fazer login";
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 401) {
        errorMessage = "Email ou senha incorretos";
      } else if (error.response?.status === 0) {
        errorMessage = "Erro de conexão com o servidor";
      }
      
      // Exibir toast de erro imediatamente
      showError(errorMessage);
    }
  };

  // Se já está autenticado, mostrar loading
  if (isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Redirecionando...</p>
        </div>
      </div>
    );
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
              Sistema de gestão de tokens e transações em{" "}
                <span className="text-slate-800 dark:text-slate-400 font-bold">
                blockchain
                </span>{" "}
                .
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
                  <h4 className="font-medium">Bem-vindo à Coinage</h4>
                  <div className="text-slate-500 text-base">
                    Faça login para acessar sua conta
                  </div>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <SimpleInput
                    type="email"
                    name="email"
                    label="Email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Digite seu email"
                    error={errors.email}
                    required
                  />
                  
                  <SimpleInput
                    type="password"
                    name="password"
                    label="Senha"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Digite sua senha"
                    error={errors.password}
                    required
                  />

                  <button 
                    type="submit"
                    className="btn btn-dark block w-full text-center"
                    disabled={isLoading}
                  >
                    {isLoading ? "Entrando..." : "Entrar"}
                  </button>
                </form>
                
                <div className="md:max-w-[345px] mx-auto font-normal text-slate-500 dark:text-slate-400 mt-12 uppercase text-sm">
                  Não tem uma conta?{" "}
                  <Link
                    href="/register"
                    className="text-slate-900 dark:text-white font-medium hover:underline"
                  >
                    Cadastre-se
                  </Link>
                </div>
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

export default LoginPage;
