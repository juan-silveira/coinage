import { useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import useAuthStore from '@/store/authStore';
import { authService } from '@/services/api';

const SESSION_TIMEOUT = 10 * 60 * 1000; // 10 minutos
const WARNING_TIME = 2 * 60 * 1000; // Avisar 2 minutos antes

const useTokenRenewal = () => {
  const { isAuthenticated, refreshToken, setTokens, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  
  const timeoutRef = useRef(null);
  const warningTimeoutRef = useRef(null);
  const isRenewing = useRef(false);
  const lastActivity = useRef(Date.now());

  // Renovar token (resetar sessão para 10 minutos)
  const renewToken = useCallback(async () => {
    if (isRenewing.current || !isAuthenticated || !refreshToken) {
      return false;
    }

    isRenewing.current = true;

    try {
      console.log('🔄 [TokenRenewal] Renovando token por atividade...');
      
      const response = await authService.refreshToken(refreshToken);
      
      if (response.success) {
        const { accessToken, refreshToken: newRefreshToken } = response.data;
        setTokens(accessToken, newRefreshToken);
        console.log('✅ [TokenRenewal] Sessão renovada para +10 minutos');
        return true;
      } else {
        console.warn('⚠️ [TokenRenewal] Falha na renovação');
        return false;
      }
    } catch (error) {
      console.error('❌ [TokenRenewal] Erro na renovação:', error);
      return false;
    } finally {
      isRenewing.current = false;
    }
  }, [isAuthenticated, refreshToken, setTokens]);

  // Fazer logout por inatividade
  const logoutByInactivity = useCallback(() => {
    console.log('⏰ [TokenRenewal] Logout por inatividade (10 minutos)');
    logout();
    window.location.href = '/login?reason=inactivity';
  }, [logout]);

  // Resetar timer de sessão
  const resetSessionTimer = useCallback(() => {
    lastActivity.current = Date.now();
    
    // Limpar timers existentes
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }

    // Timer para logout automático
    timeoutRef.current = setTimeout(logoutByInactivity, SESSION_TIMEOUT);
    
    // Timer para aviso (opcional - pode implementar modal depois)
    warningTimeoutRef.current = setTimeout(() => {
      console.log('⚠️ [TokenRenewal] Aviso: Sessão expira em 2 minutos');
    }, SESSION_TIMEOUT - WARNING_TIME);

    console.log(`🔄 [TokenRenewal] Timer resetado - sessão expira em 10 minutos`);
  }, [logoutByInactivity]);

  // Detectar atividade do usuário (PROTEGIDO CONTRA CRASHES)
  const handleUserActivity = useCallback(async () => {
    try {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivity.current;
      
      // Só renovar se passou mais de 1 minuto desde a última atividade
      if (timeSinceLastActivity > 60000) {
        console.log(`🔄 [TokenRenewal] Atividade detectada após ${Math.round(timeSinceLastActivity/1000)}s`);
        
        try {
          // Tentar renovar token
          const renewed = await renewToken();
          if (renewed) {
            resetSessionTimer();
          } else {
            console.warn('⚠️ [TokenRenewal] Renovação falhou, mas EVITANDO logout desnecessário');
            // Apenas resetar timer sem fazer logout
            resetSessionTimer();
          }
        } catch (renewError) {
          console.error('❌ [TokenRenewal] Erro na renovação (EVITANDO CRASH):', renewError);
          // Continuar sem fazer logout por erro de renovação
          resetSessionTimer();
        }
      } else {
        // Apenas resetar timer sem renovar token
        resetSessionTimer();
      }
    } catch (error) {
      console.error('❌ [TokenRenewal] ERRO CRÍTICO na atividade do usuário (CRASH EVITADO):', error);
      console.error('❌ [TokenRenewal] Stack trace:', error.stack);
      
      // Em caso de erro crítico, apenas resetar timer
      try {
        resetSessionTimer();
      } catch (resetError) {
        console.error('❌ [TokenRenewal] Erro crítico até no reset do timer:', resetError);
      }
    }
  }, [renewToken, resetSessionTimer, logoutByInactivity]);

  // Listener para mudanças de rota
  useEffect(() => {
    if (isAuthenticated) {
      console.log(`🔄 [TokenRenewal] Navegação detectada: ${pathname}`);
      handleUserActivity();
    }
  }, [pathname, isAuthenticated, handleUserActivity]);

  // Listeners de atividade
  useEffect(() => {
    if (!isAuthenticated) return;

    const events = [
      'mousedown', 
      'mousemove', 
      'keypress', 
      'scroll', 
      'touchstart',
      'click',
      'focus',
      'blur'
    ];

    let throttleTimer = null;
    
    const throttledActivity = () => {
      try {
        if (throttleTimer) return;
        
        throttleTimer = setTimeout(() => {
          try {
            handleUserActivity();
          } catch (error) {
            console.error('❌ [TokenRenewal] Erro no handleUserActivity (PROTEGIDO):', error);
          } finally {
            throttleTimer = null;
          }
        }, 30000); // Throttle para não renovar a cada clique (máximo 1x por 30s)
      } catch (error) {
        console.error('❌ [TokenRenewal] Erro no throttledActivity (PROTEGIDO):', error);
      }
    };

    // Adicionar listeners
    events.forEach(event => {
      document.addEventListener(event, throttledActivity, true);
    });

    // Timer inicial
    resetSessionTimer();

    return () => {
      // Remover listeners
      events.forEach(event => {
        document.removeEventListener(event, throttledActivity, true);
      });
      
      // Limpar timers
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
      if (throttleTimer) {
        clearTimeout(throttleTimer);
      }
    };
  }, [isAuthenticated, handleUserActivity, resetSessionTimer]);

  return { renewToken: handleUserActivity, resetSessionTimer };
};

export default useTokenRenewal;