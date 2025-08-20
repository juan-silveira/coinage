"use client";
import React from 'react';
import { useBranding } from '@/hooks/useBranding';

/**
 * Layout base para páginas whitelabel
 */
const WhitelabelLayout = ({ 
  children, 
  showHeader = true, 
  showFooter = true, 
  headerContent = null,
  footerContent = null,
  className = ""
}) => {
  const { 
    getBrandName, 
    getTagline, 
    getPrimaryColor, 
    getSecondaryColor,
    getInlineStyles 
  } = useBranding();

  return (
    <div 
      className={`whitelabel-layout min-h-screen flex flex-col ${className}`}
      style={getInlineStyles()}
    >
      {/* CSS Dinâmico para o branding */}
      <style jsx>{`
        .whitelabel-layout {
          --brand-primary: ${getPrimaryColor()};
          --brand-secondary: ${getSecondaryColor()};
        }
        
        .btn-brand {
          background-color: var(--brand-primary);
          border-color: var(--brand-primary);
          color: white;
        }
        
        .btn-brand:hover {
          background-color: var(--brand-secondary);
          border-color: var(--brand-secondary);
          color: white;
        }
        
        .btn-outline-brand {
          border-color: var(--brand-primary);
          color: var(--brand-primary);
          background-color: transparent;
        }
        
        .btn-outline-brand:hover {
          background-color: var(--brand-primary);
          border-color: var(--brand-primary);
          color: white;
        }
        
        .text-brand {
          color: var(--brand-primary);
        }
        
        .border-brand {
          border-color: var(--brand-primary);
        }
        
        .bg-brand {
          background-color: var(--brand-primary);
        }
        
        .bg-brand-secondary {
          background-color: var(--brand-secondary);
        }
      `}</style>

      {/* Header */}
      {showHeader && (
        <header className="whitelabel-header">
          {headerContent || (
            <div className="container mx-auto px-4 py-6">
              <div className="flex flex-col items-center justify-center">
                <div className="text-center">
                  <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {getBrandName()}
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {getTagline()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </header>
      )}

      {/* Conteúdo principal */}
      <main className="whitelabel-main flex-1 flex items-center justify-center">
        {children}
      </main>

      {/* Footer */}
      {showFooter && (
        <footer className="whitelabel-footer">
          {footerContent || (
            <div className="container mx-auto px-4 py-6 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                © 2025 {getBrandName()}. Todos os direitos reservados.
              </p>
            </div>
          )}
        </footer>
      )}
    </div>
  );
};

export default WhitelabelLayout;