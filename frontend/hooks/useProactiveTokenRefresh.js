import { useEffect, useRef, useCallback } from 'react';
import useAuthStore from '@/store/authStore';
import { authService } from '@/services/api';

const useProactiveTokenRefresh = () => {
  const { isAuthenticated, refreshToken, accessToken, setTokens } = useAuthStore();
  const isRefreshing = useRef(false);
  const lastRefreshTime = useRef(0);

  // Verificar se o token está próximo de expirar (proativo)
  const shouldRefreshToken = useCallback(() => {
    if (!accessToken) return false;
    
    try {
      // Decodificar JWT para verificar expiração
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = payload.exp - now;
      
      // Renovar se faltar menos de 2 minutos para expirar
      return timeUntilExpiry < 120; // 2 minutos
    } catch (error) {
      console.warn('⚠️ [ProactiveTokenRefresh] Erro ao decodificar token:', error);
      return false;
    }
  }, [accessToken]);

  // Renovar token proativamente
  const refreshTokenProactively = useCallback(async () => {
    if (isRefreshing.current || !isAuthenticated || !refreshToken) {
      return false;
    }

    // Evitar refresh muito frequente (mínimo 30 segundos entre tentativas)
    const now = Date.now();
    if (now - lastRefreshTime.current < 30000) {
      return false;
    }

    isRefreshing.current = true;
    lastRefreshTime.current = now;

    try {
      console.log('🔄 [ProactiveTokenRefresh] Renovando token proativamente...');
      const response = await authService.refreshToken(refreshToken);
      
      if (response.success) {
        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;
        setTokens(newAccessToken, newRefreshToken);
        
        console.log('✅ [ProactiveTokenRefresh] Token renovado proativamente');
        return true;
      } else {
        console.warn('⚠️ [ProactiveTokenRefresh] Falha na renovação proativa');
        return false;
      }
    } catch (error) {
      console.error('❌ [ProactiveTokenRefresh] Erro na renovação proativa:', error);
      return false;
    } finally {
      isRefreshing.current = false;
    }
  }, [isAuthenticated, refreshToken, setTokens]);

  // Verificar token periodicamente
  useEffect(() => {
    if (!isAuthenticated) return;

    const checkInterval = setInterval(() => {
      if (shouldRefreshToken()) {
        refreshTokenProactively();
      }
    }, 60000); // Verificar a cada minuto

    return () => clearInterval(checkInterval);
  }, [isAuthenticated, shouldRefreshToken, refreshTokenProactively]);

  // Verificar token antes de requisições importantes
  const ensureValidToken = useCallback(async () => {
    if (shouldRefreshToken()) {
      return await refreshTokenProactively();
    }
    return true;
  }, [shouldRefreshToken, refreshTokenProactively]);

  return {
    ensureValidToken,
    refreshTokenProactively,
    shouldRefreshToken
  };
};

export default useProactiveTokenRefresh;
