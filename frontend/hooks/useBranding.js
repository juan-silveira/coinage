"use client";
import { useEffect, useState } from 'react';
import { useCompanyContext } from '@/contexts/CompanyContext';

/**
 * Hook para gerenciar branding dinâmico
 */
export const useBranding = () => {
  const { companyBranding, getActiveBranding, isWhitelabelContext } = useCompanyContext();
  const [branding, setBranding] = useState(null);

  useEffect(() => {
    setBranding(getActiveBranding());
  }, [companyBranding]);

  // Aplicar CSS customizado para o branding
  const applyBrandingStyles = (brandingData) => {
    if (!brandingData) return;

    const root = document.documentElement;
    
    // Aplicar variáveis CSS
    root.style.setProperty('--brand-primary', brandingData.primary_color || '#3B82F6');
    root.style.setProperty('--brand-secondary', brandingData.secondary_color || '#1E293B');
    
    // Atualizar título da página se necessário
    if (brandingData.brand_name && isWhitelabelContext()) {
      document.title = `${brandingData.brand_name} - ${document.title.split(' - ').pop()}`;
    }
  };

  // Auto-aplicar estilos quando branding mudar
  useEffect(() => {
    if (branding) {
      applyBrandingStyles(branding);
    }
  }, [branding, isWhitelabelContext]);

  // Obter URL da logo baseada no modo escuro
  const getLogoUrl = (isDark = false) => {
    if (!branding) return '/assets/images/logo/logo.svg';
    
    return isDark 
      ? (branding.logo_dark_url || '/assets/images/logo/logo-white.svg')
      : (branding.logo_url || '/assets/images/logo/logo.svg');
  };

  // Obter cor primária
  const getPrimaryColor = () => {
    return branding?.primary_color || '#3B82F6';
  };

  // Obter cor secundária
  const getSecondaryColor = () => {
    return branding?.secondary_color || '#1E293B';
  };

  // Obter nome da marca
  const getBrandName = () => {
    return branding?.brand_name || 'Coinage';
  };

  // Obter tagline
  const getTagline = () => {
    return branding?.tagline || 'Sistema de gestão de tokens e transações em blockchain';
  };

  // Gerar estilos CSS inline para componentes
  const getInlineStyles = () => {
    return {
      '--brand-primary': getPrimaryColor(),
      '--brand-secondary': getSecondaryColor(),
    };
  };

  // Gerar classes CSS para botões
  const getBrandedButtonClass = (variant = 'primary') => {
    const baseClass = 'btn';
    
    switch (variant) {
      case 'primary':
        return `${baseClass} btn-brand`;
      case 'outline':
        return `${baseClass} btn-outline-brand`;
      default:
        return baseClass;
    }
  };

  return {
    branding,
    isWhitelabel: isWhitelabelContext(),
    
    // Getters
    getLogoUrl,
    getPrimaryColor,
    getSecondaryColor,
    getBrandName,
    getTagline,
    getInlineStyles,
    getBrandedButtonClass,
    
    // Actions
    applyBrandingStyles
  };
};

export default useBranding;