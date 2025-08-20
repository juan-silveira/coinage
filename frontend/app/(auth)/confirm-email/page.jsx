"use client";
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCompanyContext } from '@/contexts/CompanyContext';
import { useBranding } from '@/hooks/useBranding';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import WhitelabelLayout from '@/components/layout/WhitelabelLayout';
import { useAlertContext } from '@/contexts/AlertContext';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

/**
 * Página de confirmação de email
 */
export default function ConfirmEmailPage() {
  const { showSuccess, showError, showInfo, showWarning } = useAlertContext();
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
      if (!token) {
        setStatus('error');
        setMessage('Token de confirmação inválido ou ausente');
        return;
      }

      try {
        console.log('🔗 Confirmando email com token:', token);
        
        // Fazer chamada para API de confirmação
        const response = await fetch(`/api/email-confirmation/confirm?token=${token}&company=${companyAlias || 'default'}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setStatus('success');
          setMessage(data.message || 'Email confirmado com sucesso! Sua conta foi ativada.');
          showSuccess('Email confirmado com sucesso!');
          
          // Redirecionar para login após 3 segundos
          setTimeout(() => {
            handleGoToLogin();
          }, 3000);
          
        } else {
          setStatus('error');
          setMessage(data.message || 'Erro ao confirmar email');
          showError(data.message || 'Erro ao confirmar email');
        }

      } catch (error) {
        console.error('Erro na confirmação:', error);
        setStatus('error');
        setMessage('Erro de conexão. Tente novamente mais tarde.');
        showError('Erro ao confirmar email');
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

  const handleResendEmail = async () => {
    try {
      setStatus('loading');
      setMessage('Reenviando email de confirmação...');
      
      // Para reenviar, precisamos do email do usuário
      const email = prompt('Digite seu email para reenviar a confirmação:');
      if (!email) {
        setStatus('error');
        setMessage('Email é necessário para reenviar');
        return;
      }
      
      const response = await fetch('/api/email-confirmation/resend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email,
          companyAlias: companyAlias || 'default'
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStatus('success');
        setMessage('Email de confirmação reenviado com sucesso! Verifique sua caixa de entrada.');
        showSuccess('Email reenviado com sucesso!');
      } else {
        setStatus('error');
        setMessage(data.message || 'Erro ao reenviar email');
        showError(data.message || 'Erro ao reenviar email');
      }
      
    } catch (error) {
      console.error('Erro ao reenviar email:', error);
      setStatus('error');
      setMessage('Erro de conexão. Tente novamente mais tarde.');
      showError('Erro ao reenviar email');
    }
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

            {/* Suporte */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Problemas? Entre em contato com <strong>suporte@coinage.com</strong>
              </p>
            </div>
          </Card>
        </div>
      </div>
    </WhitelabelLayout>
  );
}