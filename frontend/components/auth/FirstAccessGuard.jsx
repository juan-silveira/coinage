"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import useAuthStore from '@/store/authStore';
import { useBranding } from '@/hooks/useBranding';

/**
 * Componente que verifica se o usuário precisa completar o primeiro acesso
 * Se isFirstAccess for true, redireciona para a tela de primeiro acesso obrigatoriamente
 */
const FirstAccessGuard = ({ children }) => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const { companyAlias } = useBranding();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkFirstAccess = () => {
      // Se não estiver autenticado, não fazer nada
      if (!isAuthenticated || !user) {
        setChecking(false);
        return;
      }

      // Se já estiver na página de primeiro acesso, permitir
      if (pathname.includes('/first-access')) {
        setChecking(false);
        return;
      }

      // Se for página de login ou auth, permitir
      if (pathname.includes('/login') || pathname.includes('/register')) {
        setChecking(false);
        return;
      }

      // Se isFirstAccess for true, redirecionar obrigatoriamente
      if (user.isFirstAccess === true) {
        // Construir URL de primeiro acesso com dados do usuário
        const firstAccessUrl = `/first-access/${companyAlias || 'coinage-app'}?userId=${user.id}&userName=${encodeURIComponent(user.name)}&email=${encodeURIComponent(user.email)}`;
        
        router.push(firstAccessUrl);
        return;
      }

      // Se chegou até aqui, está tudo ok
      setChecking(false);
    };

    checkFirstAccess();
  }, [isAuthenticated, user, pathname, router, companyAlias]);

  // Mostrar loading enquanto verifica
  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 dark:text-gray-400">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  // Se não estiver autenticado ou tudo estiver ok, renderizar children
  return children;
};

export default FirstAccessGuard;