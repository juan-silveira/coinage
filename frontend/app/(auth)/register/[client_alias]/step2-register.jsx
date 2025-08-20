"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/api';
import { useBranding } from '@/hooks/useBranding';
import Button from '@/components/ui/Button';
import Textinput from '@/components/ui/Textinput';
import Card from '@/components/ui/Card';
import PasswordStrengthIndicator from '@/components/ui/PasswordStrengthIndicator';
import { useAlertContext } from '@/contexts/AlertContext';
import { Eye, EyeOff, ArrowLeft, CheckCircle } from 'lucide-react';

/**
 * Segundo passo: Registro completo para usuário novo
 */
const NewUserRegisterStep = ({ 
  companyAlias, 
  userStatus, 
  onBack, 
  onSuccess 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const { getBrandName, getPrimaryColor } = useBranding();
  const router = useRouter();
  const { showSuccess, showError, showInfo, showWarning } = useAlertContext();

  // Atualizar email quando userStatus mudar
  useEffect(() => {
    console.log('🔍 UserStatus no step2-register:', userStatus);
    if (userStatus?.data?.email && !formData.email) {
      console.log('✅ Atualizando email para:', userStatus.data.email);
      setFormData(prev => ({
        ...prev,
        email: userStatus.data.email
      }));
    }
  }, [userStatus, formData.email]);

  const handleInputChange = (field) => (e) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      showError('Nome é obrigatório');
      return false;
    }

    if (!formData.email.includes('@')) {
      showError('Email inválido');
      return false;
    }

    if (formData.password.length < 6) {
      showError('Senha deve ter pelo menos 6 caracteres');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      showError('Senhas não coincidem');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      console.log('📝 Registrando novo usuário...');
      const result = await authService.registerNewUserWhitelabel({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        companyAlias
      });

      console.log('✅ Resultado do registro:', result);
      
      setRegistrationSuccess(true);
      showSuccess('Cadastro realizado com sucesso!');

      if (onSuccess) {
        onSuccess(result);
      }

    } catch (error) {
      console.error('Erro no registro:', error);
      
      if (error.response?.status === 409) {
        showError('Este email já está em uso');
      } else {
        showError('Erro ao criar conta. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (registrationSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <Card className="p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-800 mb-4">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-300" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Cadastro Realizado!
            </h2>
            
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Enviamos um email de confirmação para <strong>{formData.email}</strong>. 
              Clique no link para ativar sua conta.
            </p>

            <div className="space-y-3">
              <Button
                onClick={() => router.push(`/login/${companyAlias}`)}
                className="w-full btn-brand"
              >
                Ir para Login
              </Button>
              
              <button
                onClick={() => {
                  // Implementar reenvio de email
                  showInfo('Email reenviado com sucesso!');
                }}
                className="w-full text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400"
              >
                Não recebeu o email? Reenviar
              </button>
            </div>

            {/* Informação sobre bypass */}
            <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <p className="text-xs text-yellow-700 dark:text-yellow-300">
                💡 Durante o desenvolvimento, a confirmação por email está em modo bypass. 
                Você pode fazer login normalmente.
              </p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
            Criar Conta - {getBrandName()}
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Complete seus dados para finalizar o cadastro
          </p>
        </div>

        <Card className="mt-8 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Textinput
                label="Nome Completo"
                type="text"
                value={formData.name}
                onChange={handleInputChange('name')}
                placeholder="Seu nome completo"
                required
                className="w-full"
                autoComplete="off"
              />
            </div>

            <div>
              <Textinput
                label="Email"
                type="email"
                value={formData.email}
                onChange={handleInputChange('email')}
                placeholder={formData.email || "seu@email.com"}
                required
                disabled
                className="w-full bg-gray-50 dark:bg-gray-700"
              />
              <p className="mt-1 text-xs text-gray-500">
                Email já preenchido na etapa anterior
              </p>
            </div>

            <div>
              <Textinput
                label="Senha"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleInputChange('password')}
                placeholder="Crie uma senha segura"
                required
                className="w-full"
                autoComplete="new-password"
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
              
              {formData.password && (
                <div className="mt-2">
                  <PasswordStrengthIndicator password={formData.password} />
                </div>
              )}
            </div>

            <div>
              <Textinput
                label="Confirmar Senha"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleInputChange('confirmPassword')}
                placeholder="Digite a senha novamente"
                required
                className="w-full"
                autoComplete="new-password"
                suffix={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                }
              />
              
              {formData.confirmPassword && (
                <div className="mt-1">
                  {formData.password === formData.confirmPassword ? (
                    <p className="text-xs text-green-600">✓ Senhas coincidem</p>
                  ) : (
                    <p className="text-xs text-red-600">✗ Senhas não coincidem</p>
                  )}
                </div>
              )}
            </div>

            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                className="flex-1 btn-outline-brand"
                style={{ borderColor: 'var(--brand-primary)', color: 'var(--brand-primary)' }}
                disabled={loading}
              >
                <ArrowLeft size={16} className="mr-2" />
                Voltar
              </Button>
              
              <Button
                type="submit"
                className="flex-1 btn-brand"
                style={{ backgroundColor: 'var(--brand-primary)' }}
                isLoading={loading}
              >
                Criar Conta
              </Button>
            </div>
          </form>

          {/* Termos e condições */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Ao criar uma conta, você concorda com nossos{' '}
              <a href="#" className="text-blue-600 hover:text-blue-500">
                Termos de Uso
              </a>{' '}
              e{' '}
              <a href="#" className="text-blue-600 hover:text-blue-500">
                Política de Privacidade
              </a>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default NewUserRegisterStep;