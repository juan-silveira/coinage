"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/api';
import { useBranding } from '@/hooks/useBranding';
import useDarkMode from '@/hooks/useDarkMode';
import WhitelabelLayout from '@/components/layout/WhitelabelLayout';
import Button from '@/components/ui/Button';
import Textinput from '@/components/ui/Textinput';
import Card from '@/components/ui/Card';
import BrandHeader from '@/components/ui/BrandHeader';
import { useAlertContext } from '@/contexts/AlertContext';
import { ArrowLeft } from 'lucide-react';

/**
 * Primeiro passo do registro: verificação de email
 */
const EmailVerificationStep = ({ companyAlias, onNext }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { getPrimaryColor } = useBranding();
  const router = useRouter();
  const { showError } = useAlertContext();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !email.includes('@')) {
      showError('Por favor, digite um email válido');
      return;
    }

    setLoading(true);

    try {
      console.log('🔍 Verificando email no banco de dados...');
      const result = await authService.checkUserStatus(email, companyAlias);
      
      console.log('✅ Resultado da verificação:', result);
      
      if (onNext) {
        onNext(result);
      }

    } catch (error) {
      console.error('Erro ao verificar email:', error);
      showError('Erro ao verificar email. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl w-full space-y-8">
        <BrandHeader taglineClassName="text-sm mb-4" className="space-y-2" />

        <Card className="mt-8 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Textinput
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="w-full"
              />
            </div>

            <div className="flex flex-col space-y-3">
              <Button
                type="submit"
                className="w-full btn-brand"
                style={{ backgroundColor: 'var(--brand-primary)' }}
                isLoading={loading}
              >
                Continuar
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="w-full btn-outline-brand"
                style={{ borderColor: getPrimaryColor(), color: getPrimaryColor() }}
                disabled={loading}
              >
                <ArrowLeft size={16} className="mr-2" />
                Voltar
              </Button>
            </div>
          </form>

        </Card>
      </div>
    </div>
  );
};

export default EmailVerificationStep;