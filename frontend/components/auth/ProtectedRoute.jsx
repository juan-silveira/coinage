import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/components/partials/auth/store';

const ProtectedRoute = ({ children }) => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { isAuth, loading, user } = useSelector((state) => state.auth);

  useEffect(() => {
    // Se não está autenticado e não está carregando, redirecionar para login
    if (!isAuth && !loading) {
      router.push('/');
      return;
    }

    // Se está autenticado mas não tem dados do usuário, buscar
    if (isAuth && !user) {
      dispatch(getCurrentUser());
    }
  }, [isAuth, loading, user, router, dispatch]);

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-slate-900 dark:border-white"></div>
      </div>
    );
  }

  // Se não está autenticado, não renderizar nada (será redirecionado)
  if (!isAuth) {
    return null;
  }

  // Se está autenticado, renderizar o conteúdo
  return <>{children}</>;
};

export default ProtectedRoute; 