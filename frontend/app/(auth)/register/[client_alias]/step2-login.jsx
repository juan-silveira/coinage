"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/api';
import { useBranding } from '@/hooks/useBranding';
import useAuthStore from '@/store/authStore';
import Button from '@/components/ui/Button';
import Textinput from '@/components/ui/Textinput';
import Card from '@/components/ui/Card';
import BrandHeader from '@/components/ui/BrandHeader';
import { useAlertContext } from '@/contexts/AlertContext';
import { Eye, EyeOff, ArrowLeft, Building2, UserCheck } from 'lucide-react';

/**
 * Segundo passo: Login para usuário existente
 */
const ExistingUserLoginStep = ({ 
  companyAlias, 
  userStatus, 
  onBack, 
  onSuccess 
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { getBrandName, getPrimaryColor } = useBranding();
  const { login } = useAuthStore();
  const router = useRouter();
  const { showSuccess, showError, showInfo, showWarning } = useAlertContext();

  const { data } = userStatus;
  const isLinking = userStatus.action === 'link_existing_user';

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!password) {
      showError('Por favor, digite sua senha');
      return;
    }

    setLoading(true);

    try {
      if (isLinking) {
        // Vincular usuário existente à nova empresa
        console.log('🔗 Vinculando usuário existente...');
        const result = await authService.linkExistingUser(data.userId, password, companyAlias);
        
        showSuccess(`Conta vinculada com sucesso ao ${getBrandName()}!`);
        
        // Fazer login automaticamente na nova empresa
        if (result.data.accessToken) {
          login(result.data.user, result.data.accessToken, result.data.refreshToken);
          router.push('/dashboard');
        } else {
          router.push(`/login/${companyAlias}`);
        }
        
      } else {
        // Login normal na empresa
        console.log('🔑 Fazendo login...');
        const response = await authService.loginWhitelabel(data.email, password, companyAlias);
        
        if (response.success) {
          login(response.data.user, response.data.accessToken, response.data.refreshToken);
          showSuccess('Login realizado com sucesso!');
          router.push('/dashboard');
        }
      }

      if (onSuccess) {
        onSuccess();
      }

    } catch (error) {
      console.error('Erro no login:', error);
      
      if (error.response?.status === 401) {
        showError('Senha incorreta. Tente novamente.');
      } else {
        showError('Erro ao fazer login. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl w-full space-y-8">
        <BrandHeader taglineClassName="text-sm mb-4" className="space-y-2" />
        
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">
            {isLinking ? 'Vincular Conta' : 'Fazer Login'}
          </h2>
          
          {isLinking ? (
            <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed max-w-md mx-auto mb-6">
              Olá <span className="font-semibold text-gray-900 dark:text-white">{data.userName}</span>! 
              Vimos que você já tem um cadastro no nosso sistema. 
              Deseja vincular sua conta à empresa{' '}
              <span className="font-semibold" style={{ color: getPrimaryColor() }}>
                {data.company?.name || getBrandName()}
              </span>{' '}
              também?
            </p>
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-6">
              {userStatus.message}
            </p>
          )}
        </div>

        <Card className="mt-8 shadow-lg">
          {/* Informações do usuário - Layout centralizado */}
          <div className="mb-8">
            <div className="flex flex-col items-center text-center space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {data.userName || 'Usuário'}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {data.email}
                </p>
              </div>
            </div>
          </div>

          {/* Mostrar empresas existentes se for vinculação */}
          {isLinking && data.existingCompanies?.length > 0 && (
            <div className="mb-8 p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
              <div className="text-center">
                <h4 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4">
                  🏢 Empresas já vinculadas à sua conta
                </h4>
                <div className="flex flex-wrap justify-center gap-3">
                  {data.existingCompanies.map((company, index) => (
                    <div 
                      key={index} 
                      className="px-4 py-2 bg-white dark:bg-gray-600 rounded-full shadow-sm border border-gray-200 dark:border-gray-500 flex items-center space-x-2"
                    >
                      <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                        {company.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="max-w-sm mx-auto">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div>
                <Textinput
                  label="Senha"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua senha para continuar"
                  required
                  className="w-full"
                  autoComplete="current-password"
                  suffix={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  }
                />
              </div>

              <div className="flex flex-col space-y-3">
                <Button
                  type="submit"
                  className="w-full py-3 btn-brand text-base font-semibold"
                  style={{ backgroundColor: getPrimaryColor() }}
                  isLoading={loading}
                >
                  {isLinking ? '🔗 Vincular Conta' : '🔑 Entrar'}
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={onBack}
                  className="w-full py-2 btn-outline-brand text-sm"
                  style={{ borderColor: getPrimaryColor(), color: getPrimaryColor() }}
                  disabled={loading}
                >
                  <ArrowLeft size={16} className="mr-2" />
                  Voltar
                </Button>
              </div>
            </form>
          </div>

          {/* Link para recuperação de senha */}
          <div className="mt-8 text-center">
            <button
              type="button"
              className="text-sm font-medium hover:underline transition-colors"
              style={{ color: getPrimaryColor() }}
              onClick={() => {
                // Implementar recuperação de senha
                showInfo('Funcionalidade de recuperação de senha em breve');
              }}
            >
              Esqueceu sua senha?
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ExistingUserLoginStep;