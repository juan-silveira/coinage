"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import SimpleInput from "@/components/ui/SimpleInput";
import { useAlertContext } from "@/contexts/AlertContext";
import useAuthStore from "@/store/authStore";
import { authService } from "@/services/api";
import useDarkMode from "@/hooks/useDarkMode";

// Configurações default para fallback
const defaultBranding = {
  brand_name: "Coinage",
  primary_color: "#3B82F6",
  secondary_color: "#1E293B", 
  logo_url: "/assets/images/logo/logo.svg",
  logo_dark_url: "/assets/images/logo/logo-white.svg",
  tagline: "Sistema de gestão de tokens e transações em blockchain"
};

const WhitelabelLoginPage = () => {
  const router = useRouter();
  const params = useParams();
  const clientAlias = params.client_alias;
  const { login, isAuthenticated, isLoading, setLoading } = useAuthStore();
  const [isDark] = useDarkMode();
  const { showSuccess, showError } = useAlertContext();
  
  const [branding, setBranding] = useState(defaultBranding);
  const [brandingLoading, setBrandingLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});

  // Buscar configurações de branding
  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const response = await fetch(`http://localhost:8800/api/whitelabel/client-branding/${clientAlias}`);
        const data = await response.json();
        
        if (data.success) {
          setBranding(data.data);
          document.title = `${data.data.brand_name} - Login`;
        } else {
          // Se não encontrar o alias, usar branding padrão
          document.title = 'Coinage - Login';
        }
        
      } catch (error) {
        console.error('Erro ao buscar branding:', error);
        // Em caso de erro, usar configuração padrão
        document.title = 'Coinage - Login';
      } finally {
        setBrandingLoading(false);
      }
    };

    fetchBranding();
  }, [clientAlias]);

  // Verificar se já está autenticado
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  // Verificar toasts do sessionStorage
  useEffect(() => {
    const currentUrl = window.location.pathname;
    if (currentUrl.includes('/login/')) {
      sessionStorage.removeItem('showLoginError');
      sessionStorage.removeItem('showLoginSuccess'); 
      sessionStorage.removeItem('loginUserName');
    }

    const logoutSuccess = sessionStorage.getItem('showLogoutSuccess');
    if (logoutSuccess) {
      showSuccess("Logout realizado com sucesso");
      sessionStorage.removeItem('showLogoutSuccess');
    }

    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    if (error === 'auth') {
      showError("Email ou senha incorretos");
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
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
      // Incluir client_alias na requisição de login
      const response = await authService.login(formData.email, formData.password, clientAlias);
      
      const { user, accessToken, refreshToken, isFirstAccess } = response.data;
      
      login(user, accessToken, refreshToken, isFirstAccess);
      
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
      
      showError(errorMessage);
    }
  };

  // Loading do branding
  if (brandingLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Carregando...</p>
        </div>
      </div>
    );
  }

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
      <style jsx>{`
        :root {
          --brand-primary: ${branding.primary_color};
          --brand-secondary: ${branding.secondary_color};
        }
        .btn-brand {
          background-color: ${branding.primary_color};
          border-color: ${branding.primary_color};
        }
        .btn-brand:hover {
          background-color: ${branding.secondary_color};
          border-color: ${branding.secondary_color};
        }
        .text-brand {
          color: ${branding.primary_color};
        }
        .border-brand {
          border-color: ${branding.primary_color};
        }
      `}</style>
      
      <div className="loginwrapper">
        <div className="lg-inner-column">
          <div className="left-column relative z-[1]">
            <div className="max-w-[520px] pt-20 ltr:pl-20 rtl:pr-20">
              <Link href="/">
                <img
                  src={isDark ? branding.logo_dark_url : branding.logo_url}
                  alt={branding.brand_name}
                  className="mb-10 h-12 object-contain"
                  onError={(e) => {
                    // Fallback para logo padrão se não carregar
                    e.target.src = isDark ? "/assets/images/logo/logo-white.svg" : "/assets/images/logo/logo.svg";
                  }}
                />
              </Link>
              <h4>
                {branding.tagline}
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
                      src={isDark ? branding.logo_dark_url : branding.logo_url}
                      alt={branding.brand_name}
                      className="mx-auto h-10 object-contain"
                      onError={(e) => {
                        e.target.src = isDark ? "/assets/images/logo/logo-white.svg" : "/assets/images/logo/logo.svg";
                      }}
                    />
                  </Link>
                </div>
                <div className="text-center 2xl:mb-10 mb-4">
                  <h4 className="font-medium">Bem-vindo à {branding.brand_name}</h4>
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
                    className="btn btn-brand block w-full text-center text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? "Entrando..." : "Entrar"}
                  </button>
                </form>
                
                <div className="md:max-w-[345px] mx-auto font-normal text-slate-500 dark:text-slate-400 mt-12 uppercase text-sm">
                  Não tem uma conta?{" "}
                  <Link
                    href={`/register/${clientAlias}`}
                    className="text-brand font-medium hover:underline"
                  >
                    Cadastre-se
                  </Link>
                </div>
              </div>
              <div className="auth-footer text-center">
                Copyright 2025, {branding.brand_name} All Rights Reserved.
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default WhitelabelLoginPage;