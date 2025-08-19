"use client";
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { useCompanyContext } from '@/contexts/CompanyContext';
import { useBranding } from '@/hooks/useBranding';
import WhitelabelLayout from '@/components/layout/WhitelabelLayout';

// Importar os componentes dos passos
import EmailVerificationStep from './step1-email';
import ExistingUserLoginStep from './step2-login';
import NewUserRegisterStep from './step2-register';

export default function RegisterWhitelabelPage() {
  const params = useParams();
  const router = useRouter();
  const companyAlias = params.client_alias;
  
  const { loadCompanyBrandingByAlias } = useCompanyContext();
  const { 
    getBrandName,
    getInlineStyles 
  } = useBranding();
  
  const [currentStep, setCurrentStep] = useState('email');
  const [userStatus, setUserStatus] = useState(null);
  const [brandingLoaded, setBrandingLoaded] = useState(false);

          // Carregar branding da empresa
  useEffect(() => {
    let mounted = true;
    
    const loadBranding = async () => {
      try {
        if (companyAlias && mounted) {
          console.log('🔄 Iniciando carregamento de branding para:', companyAlias);
          await loadCompanyBrandingByAlias(companyAlias);
          if (mounted) setBrandingLoaded(true);
        }
      } catch (error) {
        console.error('❌ Erro ao carregar branding:', error);
        
        // Se a empresa não for encontrada, redirecionar para coinage
        if (error.message === 'CLIENT_NOT_FOUND' && mounted) {
          router.replace('/register/coinage');
          return;
        }
        
        if (mounted) setBrandingLoaded(true); // Continuar mesmo com erro
      }
    };

    loadBranding();
    
    return () => {
      mounted = false;
    };
  }, [companyAlias, router]); // Removido loadCompanyBrandingByAlias das dependências

  // Handlers para navegação entre passos
  const handleEmailNext = useCallback((result) => {
    setUserStatus(result);
    
    if (result.action === 'login_existing_user' || result.action === 'link_existing_user') {
      setCurrentStep('login');
    } else if (result.action === 'register_new_user') {
      setCurrentStep('register');
    } else {
      console.error('Ação desconhecida:', result.action);
    }
  }, []);

  const handleBackToEmail = useCallback(() => {
    setCurrentStep('email');
    setUserStatus(null);
  }, []);

  const handleSuccess = useCallback((result) => {
    console.log('Fluxo concluído com sucesso:', result);
    // Aqui poderia redirecionar ou mostrar uma tela de sucesso
  }, []);

  if (!brandingLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Renderizar o passo atual
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'email':
        return (
          <EmailVerificationStep
            companyAlias={companyAlias}
            onNext={handleEmailNext}
          />
        );
      
      case 'login':
        return (
          <ExistingUserLoginStep
            companyAlias={companyAlias}
            userStatus={userStatus}
            onBack={handleBackToEmail}
            onSuccess={handleSuccess}
          />
        );
      
      case 'register':
        return (
          <NewUserRegisterStep
            companyAlias={companyAlias}
            userStatus={userStatus}
            onBack={handleBackToEmail}
            onSuccess={handleSuccess}
          />
        );
      
      default:
        return <div>Passo desconhecido</div>;
    }
  };

  return (
    <WhitelabelLayout showHeader={false} showFooter={false}>
      <div style={getInlineStyles()}>
        {renderCurrentStep()}
      </div>
    </WhitelabelLayout>
  );
}