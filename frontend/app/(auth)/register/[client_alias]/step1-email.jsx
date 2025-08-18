"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/api';
import { useBranding } from '@/hooks/useBranding';
import WhitelabelLayout from '@/components/layout/WhitelabelLayout';
import Button from '@/components/ui/Button';
import Textinput from '@/components/ui/Textinput';
import Card from '@/components/ui/Card';
import { toast } from 'react-toastify';

/**
 * Primeiro passo do registro: verificação de email
 */
const EmailVerificationStep = ({ companyAlias, onNext }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { getBrandName, getPrimaryColor } = useBranding();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !email.includes('@')) {
      toast.error('Por favor, digite um email válido');
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
      toast.error('Erro ao verificar email. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
            Acesso {getBrandName()}
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Digite seu email para continuar
          </p>
        </div>

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

            <div>
              <Button
                type="submit"
                className="w-full"
                isLoading={loading}
                style={{ backgroundColor: getPrimaryColor() }}
              >
                Continuar
              </Button>
            </div>
          </form>

        </Card>
      </div>
    </div>
  );
};

export default EmailVerificationStep;