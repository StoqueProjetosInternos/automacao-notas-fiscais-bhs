import { useEffect, useRef } from 'react';

export const useActivityTimeout = (onTimeout: () => void, timeoutMs: number = 15 * 60 * 1000) => {
  const timeoutRef = useRef<any | null>(null);

  const resetTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      console.log('[ACTIVITY] Inatividade detectada no cliente. Deslogando usuário.');
      onTimeout();
    }, timeoutMs);
  };

  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    // Inicia o timer
    resetTimer();

    const handleActivity = () => {
      resetTimer();
    };

    // Registra listeners de atividade
    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [onTimeout, timeoutMs]);
};
