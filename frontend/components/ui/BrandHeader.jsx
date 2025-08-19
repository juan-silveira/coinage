"use client";
import React from 'react';
import { useBranding } from '@/hooks/useBranding';
import useDarkMode from '@/hooks/useDarkMode';

/**
 * Componente reutilizável para exibir logo, nome da empresa e tagline
 * Garante consistência entre todas as telas de autenticação
 */
const BrandHeader = ({ 
  showTagline = true,
  className = "",
  logoClassName = "h-12",
  titleClassName = "text-xl font-semibold",
  taglineClassName = "text-sm"
}) => {
  const { getBrandName, getTagline, getLogoUrl } = useBranding();
  const [isDark] = useDarkMode();

  return (
    <div className={`text-center flex flex-col items-center gap-2 ${className}`}>
      <img
        src={getLogoUrl(isDark)}
        alt={getBrandName()}
        className={`object-contain ${logoClassName}`}
        onError={(e) => { 
          e.target.src = isDark ? '/assets/images/logo/logo-white.svg' : '/assets/images/logo/logo.svg'; 
        }}
      />
      <div className="text-center">
        <h1 className={`text-gray-900 dark:text-white ${titleClassName}`}>
          {getBrandName()}
        </h1>
        {showTagline && (
          <p className={`text-gray-600 dark:text-gray-400 ${taglineClassName}`}>
            {getTagline()}
          </p>
        )}
      </div>
    </div>
  );
};

export default BrandHeader;