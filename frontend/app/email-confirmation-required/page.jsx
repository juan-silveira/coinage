"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/store/authStore';
import { useAlertContext } from '@/contexts/AlertContext';
import api from '@/services/api';
import { Mail, AlertCircle, LogOut, CheckCircle } from 'lucide-react';

export default function EmailConfirmationRequired() {
  const router = useRouter();
  const { user, logout, setUser } = useAuthStore();
  const { showSuccess, showError } = useAlertContext();
  const [isConfirming, setIsConfirming] = useState(false);

  // Redirecionar se usuário não está logado ou email já confirmado
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (user.emailConfirmed && user.isActive) {
      router.push('/dashboard');
      return;
    }
  }, [user, router]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleManualConfirm = async () => {
    if (isConfirming) return;
    
    setIsConfirming(true);
    
    try {
      const response = await api.post('/api/email-confirmation/manual-confirm');
      
      if (response.data.success) {
        // Mostrar sucesso
        showSuccess('Email confirmado com sucesso! Redirecionando para o dashboard...');
        
        // Atualizar dados do usuário
        const updatedUser = { ...user, emailConfirmed: true, isActive: true };
        setUser(updatedUser);
        
        // Redirecionar para dashboard após um pequeno delay
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      } else {
        showError('Erro ao confirmar email: ' + response.data.message);
      }
    } catch (error) {
      console.error('Erro ao confirmar email:', error);
      showError('Erro ao confirmar email. Tente novamente.');
    } finally {
      setIsConfirming(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mb-4">
            <Mail className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
          </div>
          
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Confirmação de Email Necessária
          </h1>
          
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Para acessar o sistema, você precisa confirmar seu endereço de email.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 shadow-lg rounded-lg p-6 space-y-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-slate-700 dark:text-slate-300">
              <p className="font-medium mb-1">Email não confirmado:</p>
              <p className="text-slate-600 dark:text-slate-400 break-all">
                {user.email}
              </p>
            </div>
          </div>

          <div className="border-t dark:border-slate-700 pt-4">
            <h3 className="font-medium text-slate-900 dark:text-white mb-2">
              Próximos passos:
            </h3>
            <ol className="text-sm text-slate-600 dark:text-slate-400 space-y-2">
              <li className="flex items-start">
                <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mr-2 mt-0.5 flex-shrink-0">
                  1
                </span>
                Verifique sua caixa de entrada
              </li>
              <li className="flex items-start">
                <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mr-2 mt-0.5 flex-shrink-0">
                  2
                </span>
                Clique no link de confirmação no email
              </li>
              <li className="flex items-start">
                <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mr-2 mt-0.5 flex-shrink-0">
                  3
                </span>
                Retorne e faça login novamente
              </li>
            </ol>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <p className="text-xs text-yellow-800 dark:text-yellow-200">
              💡 <strong>Dica:</strong> Verifique também sua pasta de spam ou lixo eletrônico.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleManualConfirm}
            disabled={isConfirming}
            className="w-full flex items-center justify-center px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg shadow-sm text-sm font-medium transition-colors disabled:cursor-not-allowed"
          >
            {isConfirming ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                Confirmando...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Já confirmei meu email
              </>
            )}
          </button>
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm bg-white dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Fazer Logout
          </button>
          
          <p className="text-center text-xs text-slate-500 dark:text-slate-400">
            Não recebeu o email? Entre em contato com o suporte.
          </p>
        </div>
      </div>
    </div>
  );
}