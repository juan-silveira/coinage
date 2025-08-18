"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/api';
import { useBranding } from '@/hooks/useBranding';
import useAuthStore from '@/store/authStore';
import Button from '@/components/ui/Button';
import Textinput from '@/components/ui/Textinput';
import Card from '@/components/ui/Card';
import { toast } from 'react-toastify';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';

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

  const { data } = userStatus;
  const isLinking = userStatus.action === 'link_existing_user';

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!password) {
      toast.error('Por favor, digite sua senha');
      return;
    }

    setLoading(true);

    try {
      if (isLinking) {
        // Vincular usuário existente à nova empresa
        console.log('🔗 Vinculando usuário existente...');
        const result = await authService.linkExistingUser(data.userId, password, companyAlias);
        
        toast.success(`Conta vinculada com sucesso ao ${getBrandName()}!`);
        
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
          toast.success('Login realizado com sucesso!');
          router.push('/dashboard');
        }
      }

      if (onSuccess) {
        onSuccess();
      }

    } catch (error) {
      console.error('Erro no login:', error);
      
      if (error.response?.status === 401) {
        toast.error('Senha incorreta. Tente novamente.');
      } else {
        toast.error('Erro ao fazer login. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
            {isLinking ? 'Vincular Conta' : 'Fazer Login'}
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {userStatus.message}
          </p>
        </div>

        <Card className="mt-8 p-6">
          {/* Informações do usuário */}
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 dark:text-blue-300 font-medium">
                    {data.userName?.charAt(0) || data.email?.charAt(0)}
                  </span>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  {data.userName || 'Usuário'}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {data.email}
                </p>
              </div>
            </div>
          </div>

          {/* Mostrar empresas existentes se for vinculação */}
          {isLinking && data.existingCompanies?.length > 0 && (
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Empresas já vinculadas:
              </h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400">
                {data.existingCompanies.map((company, index) => (
                  <li key={index} className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span>{company.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Textinput
                label="Senha"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha"
                required
                className="w-full"
                autoComplete="current-password"
                suffix={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                }
              />
            </div>

            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                className="flex-1"
                disabled={loading}
              >
                <ArrowLeft size={16} className="mr-2" />
                Voltar
              </Button>
              
              <Button
                type="submit"
                className="flex-1"
                isLoading={loading}
                style={{ backgroundColor: getPrimaryColor() }}
              >
                {isLinking ? 'Vincular Conta' : 'Entrar'}
              </Button>
            </div>
          </form>

          {/* Link para recuperação de senha */}
          <div className="mt-4 text-center">
            <button
              type="button"
              className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400"
              onClick={() => {
                // Implementar recuperação de senha
                toast.info('Funcionalidade de recuperação de senha em breve');
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