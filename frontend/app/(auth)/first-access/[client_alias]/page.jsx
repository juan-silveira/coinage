"use client";
import React, { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { authService } from '@/services/api';
import { useBranding } from '@/hooks/useBranding';
import useAuthStore from '@/store/authStore';
import Button from '@/components/ui/Button';
import Textinput from '@/components/ui/Textinput';
import Card from '@/components/ui/Card';
import { useAlertContext, AlertProvider } from '@/contexts/AlertContext';
import { Eye, EyeOff, Key, Shield, User, Phone, Calendar, LogOut } from 'lucide-react';

/**
 * Tela de primeiro acesso para completar dados do usuário
 */
const FirstAccessPageContent = () => {
  const [formData, setFormData] = useState({
    cpf: '',
    phone: '',
    birthDate: ''
  });
  const [loading, setLoading] = useState(false);
  const [generatingKeys, setGeneratingKeys] = useState(false);
  const [keysGenerated, setKeysGenerated] = useState(false);
  const [userKeys, setUserKeys] = useState(null);
  
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { getBrandName, getPrimaryColor } = useBranding();
  const { user, logout, updateUser } = useAuthStore();
  const { showError, showSuccess, showInfo } = useAlertContext();
  
  const companyAlias = params.company_alias;
  const userId = searchParams.get('userId') || user?.id;
  const userName = searchParams.get('userName') || user?.name;

  useEffect(() => {
    if (!userId) {
      showError('Sessão inválida. Redirecionando para login...');
      router.push(`/login/${companyAlias}`);
    }
  }, [userId, companyAlias, router, showError]);

  // Função para validar CPF
  const validateCPF = (cpf) => {
    cpf = cpf.replace(/\D/g, '');
    
    if (cpf.length !== 11) return false;
    
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1+$/.test(cpf)) return false;
    
    // Validação do primeiro dígito verificador
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.charAt(9))) return false;
    
    // Validação do segundo dígito verificador
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf.charAt(i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.charAt(10))) return false;
    
    return true;
  };

  const handleInputChange = (field) => (e) => {
    let value = e.target.value;
    
    // Aplicar máscaras
    if (field === 'cpf') {
      // Remove todos os caracteres não numéricos
      value = value.replace(/\D/g, '');
      
      // Limita a 11 dígitos
      if (value.length > 11) {
        value = value.slice(0, 11);
      }
      
      // Aplica a máscara do CPF
      if (value.length > 9) {
        value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
      } else if (value.length > 6) {
        value = value.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
      } else if (value.length > 3) {
        value = value.replace(/(\d{3})(\d{1,3})/, '$1.$2');
      }
    }
    
    if (field === 'phone') {
      // Remove todos os caracteres não numéricos
      value = value.replace(/\D/g, '');
      
      // Limita a 11 dígitos
      if (value.length > 11) {
        value = value.slice(0, 11);
      }
      
      // Aplica a máscara do telefone
      if (value.length > 10) {
        // Celular com 11 dígitos: (xx) 9xxxx-xxxx
        value = value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
      } else if (value.length > 6) {
        // Telefone fixo ou celular com 10 dígitos: (xx) xxxx-xxxx
        value = value.replace(/(\d{2})(\d{4})(\d{1,4})/, '($1) $2-$3');
      } else if (value.length > 2) {
        value = value.replace(/(\d{2})(\d{1,5})/, '($1) $2');
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    // Validar CPF
    if (!formData.cpf || formData.cpf.replace(/\D/g, '').length !== 11) {
      showError('CPF deve ter 11 dígitos');
      return false;
    }

    if (!validateCPF(formData.cpf)) {
      showError('CPF inválido');
      return false;
    }

    // Validar telefone
    const phoneDigits = formData.phone.replace(/\D/g, '');
    if (!formData.phone || phoneDigits.length < 10) {
      showError('Telefone deve ter pelo menos 10 dígitos');
      return false;
    }

    if (phoneDigits.length !== 10 && phoneDigits.length !== 11) {
      showError('Telefone deve ter 10 ou 11 dígitos');
      return false;
    }

    // Validar se o telefone não é uma sequência repetida
    if (/^(\d)\1+$/.test(phoneDigits)) {
      showError('Telefone inválido');
      return false;
    }

    // Validar data de nascimento
    if (!formData.birthDate) {
      showError('Data de nascimento é obrigatória');
      return false;
    }

    // Validar idade mínima (18 anos)
    const birthDate = new Date(formData.birthDate);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (age < 18 || (age === 18 && monthDiff < 0) || 
        (age === 18 && monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      showError('Usuário deve ter pelo menos 18 anos');
      return false;
    }

    // Validar se a data não é futura
    if (birthDate > today) {
      showError('Data de nascimento não pode ser futura');
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
    setGeneratingKeys(true);

    try {
      console.log('📝 Completando dados do primeiro acesso...');
      
      const result = await authService.completeFirstAccess({
        userId,
        cpf: formData.cpf.replace(/\D/g, ''),
        phone: formData.phone.replace(/\D/g, ''),
        birthDate: formData.birthDate,
        companyAlias
      });

      console.log('✅ Resultado:', result);
      
      if (result.success) {
        setUserKeys(result.data.keys);
        setKeysGenerated(true);
        
        // Atualizar dados do usuário no store
        updateUser({
          isFirstAccess: false,
          cpf: formData.cpf.replace(/\D/g, ''),
          phone: formData.phone.replace(/\D/g, ''),
          birthDate: formData.birthDate
        });
        
        showSuccess('Dados completados com sucesso!');
      }

    } catch (error) {
      console.error('Erro ao completar primeiro acesso:', error);
      showError('Erro ao completar dados. Tente novamente.');
    } finally {
      setLoading(false);
      setGeneratingKeys(false);
    }
  };

  const handleContinue = () => {
    // Redirecionar para dashboard após completar dados
    router.push('/dashboard');
  };

  const handleLogout = () => {
    const userCompanyAlias = logout();
    showInfo('Você foi desconectado.');
    // Usar o companyAlias da URL se disponível, senão usar o do usuário
    router.push(`/login/${companyAlias || userCompanyAlias}`);
  };

  if (keysGenerated && userKeys) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl w-full space-y-8">
          <Card className="p-8">
            <div className="text-center mb-8">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-800 mb-4">
                <Shield className="h-8 w-8 text-green-600 dark:text-green-300" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Chaves Geradas com Sucesso!
              </h2>
              
              <p className="text-gray-600 dark:text-gray-400">
                Suas chaves blockchain foram geradas. Mantenha-as seguras!
              </p>
            </div>

            <div className="space-y-6">
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <Key className="h-5 w-5 text-blue-600 mr-2" />
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    Chave Pública (Endereço)
                  </h3>
                </div>
                <p className="font-mono text-sm bg-white dark:bg-gray-900 p-3 rounded border break-all">
                  {userKeys.publicKey}
                </p>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <Shield className="h-5 w-5 text-yellow-600 mr-2" />
                  <h3 className="font-medium text-yellow-800 dark:text-yellow-200">
                    Importante - Segurança
                  </h3>
                </div>
                <div className="text-sm text-yellow-700 dark:text-yellow-300 space-y-2">
                  <p>• Suas chaves estão armazenadas de forma segura no sistema</p>
                  <p>• Você pode visualizar suas chaves a qualquer momento no painel</p>
                  <p>• Nunca compartilhe sua chave privada com terceiros</p>
                  <p>• Faça backup das suas chaves em local seguro</p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-center">
              <Button
                onClick={handleContinue}
                className="px-8 py-3"
                style={{ backgroundColor: getPrimaryColor() }}
              >
                Continuar para Dashboard
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Botão de logout no canto superior direito */}
        <div className="flex justify-end">
          <button
            onClick={handleLogout}
            className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <LogOut size={16} className="mr-2" />
            Sair
          </button>
        </div>
        
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
            Complete seus Dados
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Olá, <strong>{userName}</strong>! Complete suas informações para acessar o {getBrandName()}
          </p>
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              ⚠️ Este passo é obrigatório para continuar. Você pode fazer logout se necessário.
            </p>
          </div>
        </div>

        <Card className="mt-8 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                CPF
              </label>
              <div className="relative">
                <User className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  value={formData.cpf}
                  onChange={handleInputChange('cpf')}
                  placeholder="000.000.000-00"
                  required
                  className="form-control py-2 pl-10 w-full"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Telefone
              </label>
              <div className="relative">
                <Phone className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  value={formData.phone}
                  onChange={handleInputChange('phone')}
                  placeholder="(00) 00000-0000"
                  required
                  className="form-control py-2 pl-10 w-full"
                />
              </div>
            </div>

            <div>
              <Textinput
                label="Data de Nascimento"
                type="date"
                value={formData.birthDate}
                onChange={handleInputChange('birthDate')}
                required
                className="w-full"
                prefix={<Calendar className="h-4 w-4 text-gray-400" />}
              />
            </div>

            {generatingKeys && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 p-4 rounded-lg">
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
                  <div>
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      Gerando suas chaves blockchain...
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-300">
                      Este processo pode levar alguns segundos
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <Button
                type="submit"
                className="w-full"
                isLoading={loading}
                disabled={generatingKeys}
                style={{ backgroundColor: getPrimaryColor() }}
              >
                {generatingKeys ? 'Gerando Chaves...' : 'Completar Cadastro'}
              </Button>
            </div>
          </form>

          <div className="mt-6">
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <Key className="h-4 w-4 text-gray-600 mr-2" />
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  O que acontece a seguir?
                </h3>
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                <p>• Seus dados serão salvos de forma segura</p>
                <p>• Chaves blockchain serão geradas automaticamente</p>
                <p>• Você poderá acessar todas as funcionalidades</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

const FirstAccessPage = () => {
  return (
    <AlertProvider>
      <FirstAccessPageContent />
    </AlertProvider>
  );
};

export default FirstAccessPage;