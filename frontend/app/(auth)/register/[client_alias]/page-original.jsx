"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import SimpleInput from "@/components/ui/SimpleInput";
import useGlobalAlert from "@/hooks/useGlobalAlert";
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

const WhitelabelRegisterPage = () => {
  const router = useRouter();
  const params = useParams();
  const companyAlias = params.company_alias;
  const { isAuthenticated, isLoading, setLoading } = useAuthStore();
  const [isDark] = useDarkMode();
  const { showSuccess, showError } = useGlobalAlert();
  
  const [branding, setBranding] = useState(defaultBranding);
  const [brandingLoading, setBrandingLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});

  // Buscar configurações de branding
  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const response = await fetch(`http://localhost:8800/api/whitelabel/company-branding/${companyAlias}`);
        const data = await response.json();
        
        if (data.success) {
          setBranding(data.data);
          document.title = `${data.data.brand_name} - Cadastro`;
        } else {
          // Se não encontrar o alias, usar branding padrão
          document.title = 'Coinage - Cadastro';
        }
        
      } catch (error) {
        console.error('Erro ao buscar branding:', error);
        // Em caso de erro, usar configuração padrão
        document.title = 'Coinage - Cadastro';
      } finally {
        setBrandingLoading(false);
      }
    };

    fetchBranding();
  }, [companyAlias]);

  // Verificar se já está autenticado
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

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

    if (!formData.name) {
      newErrors.name = "Nome é obrigatório";
    }

    if (!formData.email) {
      newErrors.email = "Email é obrigatório";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email inválido";
    }

    if (!formData.password) {
      newErrors.password = "Senha é obrigatória";
    } else if (formData.password.length < 6) {
      newErrors.password = "Senha deve ter pelo menos 6 caracteres";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Confirmação de senha é obrigatória";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Senhas não coincidem";
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
      // Incluir company_alias na requisição de registro
      const response = await authService.register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        company_alias: companyAlias
      });
      
      showSuccess("Conta criada com sucesso! Faça login para continuar.");
      
      // Redirecionar para login do mesma empresa
      router.push(`/login/${companyAlias}`);
      
    } catch (error) {
      setLoading(false);
      
      let errorMessage = "Erro ao criar conta";
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 409) {
        errorMessage = "Este email já está em uso";
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
                  <h4 className="font-medium">Crie sua conta na {branding.brand_name}</h4>
                  <div className="text-slate-500 text-base">
                    Preencha os dados abaixo para começar
                  </div>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <SimpleInput
                    type="text"
                    name="name"
                    label="Nome completo"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Digite seu nome completo"
                    error={errors.name}
                    required
                  />

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

                  <SimpleInput
                    type="password"
                    name="confirmPassword"
                    label="Confirmar senha"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirme sua senha"
                    error={errors.confirmPassword}
                    required
                  />

                  <button 
                    type="submit"
                    className="btn btn-brand block w-full text-center text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? "Criando conta..." : "Criar conta"}
                  </button>
                </form>
                
                <div className="md:max-w-[345px] mx-auto font-normal text-slate-500 dark:text-slate-400 mt-12 uppercase text-sm">
                  Já tem uma conta?{" "}
                  <Link
                    href={`/login/${companyAlias}`}
                    className="text-brand font-medium hover:underline"
                  >
                    Faça login
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

export default WhitelabelRegisterPage;