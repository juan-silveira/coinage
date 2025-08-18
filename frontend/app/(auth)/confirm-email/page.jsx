"use client";
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCompanyContext } from '@/contexts/CompanyContext';
import { useBranding } from '@/hooks/useBranding';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import WhitelabelLayout from '@/components/layout/WhitelabelLayout';
import { toast } from 'react-toastify';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

/**
 * Página de confirmação de email
 */
export default function ConfirmEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const companyAlias = searchParams.get('company');
  
  const { loadCompanyBrandingByAlias } = useCompanyContext();
  const { 
    getBrandName, 
    getLogoUrl, 
    getPrimaryColor,
    getInlineStyles 
  } = useBranding();
  
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('');
  const [brandingLoaded, setBrandingLoaded] = useState(false);

          // Carregar branding da empresa
  useEffect(() => {
    const loadBranding = async () => {
      try {
        if (companyAlias) {
          await loadCompanyBrandingByAlias(companyAlias);
        }
        setBrandingLoaded(true);
      } catch (error) {
        console.error('Erro ao carregar branding:', error);
        setBrandingLoaded(true);
      }
    };

    loadBranding();
  }, [companyAlias, loadCompanyBrandingByAlias]);

  // Confirmar email
  useEffect(() => {
    const confirmEmail = async () => {
      if (!token || !companyAlias) {
        setStatus('error');
        setMessage('Token ou empresa inválida');
        return;
      }

      try {
        // Simular confirmação (backend ainda não disponível)
        console.log('🔗 Simulando confirmação de email...');
        console.log('Token:', token);
        console.log('Empresa:', companyAlias);

        // Simular delay da API
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Sempre retornar sucesso para demonstração
        setStatus('success');
        setMessage('Email confirmado com sucesso! Sua conta foi ativada.');
        toast.success('Email confirmado com sucesso!');

        // Simular diferentes resultados baseado no token para demo
        if (token.includes('expired')) {
          setStatus('error');
          setMessage('Token expirado. Por favor, solicite um novo link de confirmação.');
        } else if (token.includes('invalid')) {
          setStatus('error');
          setMessage('Token inválido. Verifique o link ou solicite um novo.');
        }

      } catch (error) {
        console.error('Erro na confirmação:', error);
        setStatus('error');
        setMessage('Erro ao confirmar email. Tente novamente.');
        toast.error('Erro ao confirmar email');
      }
    };

    if (brandingLoaded) {
      confirmEmail();
    }
  }, [token, companyAlias, brandingLoaded]);

  const handleGoToLogin = () => {
    if (companyAlias) {
      router.push(`/login/${companyAlias}`);
    } else {
      router.push('/login');
    }
  };

  const handleResendEmail = () => {
    // Implementar reenvio de email
    console.log('🔄 Reenviando email de confirmação...');
    toast.info('Email de confirmação reenviado com sucesso!');
  };

  if (!brandingLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const renderIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-12 w-12 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-12 w-12 text-red-600" />;
      default:
        return <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />;
    }
  };

  const renderTitle = () => {
    switch (status) {
      case 'loading':
        return 'Confirmando email...';
      case 'success':
        return 'Email confirmado!';
      case 'error':
        return 'Erro na confirmação';
      default:
        return 'Processando...';
    }
  };

  return (
    <WhitelabelLayout showHeader={false} showFooter={false}>
      <div 
        className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
        style={getInlineStyles()}
      >
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <img
              src={getLogoUrl()}
              alt={getBrandName()}
              className="mx-auto h-12 w-auto"
              onError={(e) => {
                e.target.src = '/assets/images/logo/logo.svg';
              }}
            />
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
              Confirmação de Email
            </h2>
          </div>

          {/* Status Card */}
          <Card className="mt-8 p-8 text-center">
            <div className="mx-auto flex items-center justify-center mb-4">
              {renderIcon()}
            </div>
            
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {renderTitle()}
            </h3>
            
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {message || 'Processando sua confirmação...'}
            </p>

            {/* Actions baseadas no status */}
            <div className="space-y-3">
              {status === 'success' && (
                <Button
                  onClick={handleGoToLogin}
                  className="w-full"
                  style={{ backgroundColor: getPrimaryColor() }}
                >
                  Ir para Login
                </Button>
              )}

              {status === 'error' && (
                <>
                  <Button
                    onClick={handleResendEmail}
                    className="w-full"
                    style={{ backgroundColor: getPrimaryColor() }}
                  >
                    Reenviar Email
                  </Button>
                  
                  <Button
                    onClick={handleGoToLogin}
                    variant="outline"
                    className="w-full"
                  >
                    Ir para Login
                  </Button>
                </>
              )}

              {status === 'loading' && (
                <div className="text-sm text-gray-500">
                  Aguarde enquanto confirmamos seu email...
                </div>
              )}
            </div>

            {/* Informações adicionais */}
            {companyAlias && (
              <div className="mt-6 text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Confirmando para {getBrandName()}
                </p>
              </div>
            )}

            {/* Demo info */}
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                💡 Para demonstração:
              </h4>
              <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Token com "expired": simula token expirado</li>
                <li>• Token com "invalid": simula token inválido</li>
                <li>• Outros tokens: simula confirmação bem-sucedida</li>
              </ul>
            </div>
          </Card>
        </div>
      </div>
    </WhitelabelLayout>
  );
}