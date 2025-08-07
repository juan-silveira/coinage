"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useAuthStore from "@/store/authStore";

const HomePage = () => {
  const router = useRouter();
  const { isAuthenticated, requiresPasswordChange } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (requiresPasswordChange) {
      router.push('/change-password');
      return;
    }

    // Redirecionar para o dashboard
    router.push('/dashboard');
  }, [isAuthenticated, requiresPasswordChange, router]);

  // Página de loading enquanto redireciona
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-slate-600 dark:text-slate-400">Carregando...</p>
      </div>
    </div>
  );
};

export default HomePage;
