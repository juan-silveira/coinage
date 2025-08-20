"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useAuthStore from "@/store/authStore";

const AuthGuard = ({ children }) => {
  const router = useRouter();
  const { isAuthenticated, requiresPasswordChange, user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Aguardar um pouco para o Zustand carregar o estado do localStorage
    const timer = setTimeout(() => {
      if (!isAuthenticated) {
        router.push('/login');
        return;
      }

      // Verificar se o email foi confirmado (emailConfirmed e isActive = true)
      if (user && (!user.emailConfirmed || !user.isActive)) {
        // Redirecionar para página de confirmação de email
        router.push('/email-confirmation-required');
        return;
      }

      if (requiresPasswordChange) {
        router.push('/change-password');
        return;
      }

      setIsLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, [isAuthenticated, requiresPasswordChange, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  return children;
};

export default AuthGuard;
