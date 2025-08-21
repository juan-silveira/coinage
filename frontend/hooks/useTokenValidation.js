import { useEffect, useRef } from 'react';
import useAuthStore from '@/store/authStore';
import { authService } from '@/services/api';

const useTokenValidation = () => {
  const { isAuthenticated, accessToken, refreshToken, logout, setTokens } = useAuthStore();
  const hasValidated = useRef(false);

  useEffect(() => {
    // Só executar uma vez por carregamento da página
    if (hasValidated.current) return;
    hasValidated.current = true;

    const validateToken = async () => {
      // Se não está autenticado ou não tem token, não validar
      if (!isAuthenticated || !accessToken) return;

      try {
        // Tentar fazer uma requisição com o token atual
        const response = await authService.validateToken(accessToken);
        
        if (response.success) {
          // Token válido, continuar com a sessão
          // console.log('✅ Token válido - sessão mantida');
          return;
        }
      } catch (error) {
        console.log('⚠️ Token inválido, tentando renovar...');
      }

      // Token inválido, tentar renovar com refreshToken
      if (refreshToken) {
        try {
          const refreshResponse = await authService.refreshToken(refreshToken);
          
          if (refreshResponse.success) {
            const { accessToken: newAccessToken, refreshToken: newRefreshToken } = refreshResponse.data;
            setTokens(newAccessToken, newRefreshToken);
            console.log('✅ Token renovado com sucesso');
            return;
          }
        } catch (refreshError) {
          console.log('❌ Erro ao renovar token:', refreshError);
        }
      }

      // Se chegou até aqui, tokens são inválidos - fazer logout
      console.log('🚪 Tokens inválidos - fazendo logout');
      logout();
    };

    validateToken();
  }, [isAuthenticated, accessToken, refreshToken, logout, setTokens]);
};

export default useTokenValidation;