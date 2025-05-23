import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { Session } from '../types';
import { useAuth } from './AuthContext';
import api from '../lib/api';

interface SessionContextType {
  activeSession: Session | null;
  loading: boolean;
  error: string | null;
  startSession: () => Promise<Session | void>;
  endSession: () => Promise<void>;
  hasActiveSession: boolean;
  refreshSession: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  
  // Referencias para controlar llamadas
  const checkInProgress = useRef(false);
  const mountedRef = useRef(true);
  const lastCheckTime = useRef(0);

  // Función para verificar sesión activa - con mejor control
  const checkActiveSession = useCallback(async (force: boolean = false) => {
    if (!isAuthenticated || !user || authLoading || !mountedRef.current) {
      if (mountedRef.current) {
        setActiveSession(null);
      }
      return;
    }

    // Debounce: evitar múltiples llamadas muy frecuentes
    const now = Date.now();
    if (!force && (now - lastCheckTime.current < 5000 || checkInProgress.current)) {
      return;
    }

    checkInProgress.current = true;
    lastCheckTime.current = now;

    try {
      if (mountedRef.current) {
        setLoading(true);
        setError(null);
      }
      
      // Timeout más corto para mejorar responsividad
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      const response = await api.get(`/api/sessions/active/${user.id}`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (mountedRef.current) {
        setActiveSession(response.data || null);
      }
    } catch (error: any) {
      if (!mountedRef.current) return;
      
      if (error.name === 'AbortError') {
        console.log('Session check was aborted');
        setError('Verificación de sesión cancelada');
      } else {
        console.error('Error checking active session:', error);
        setError('Error al verificar sesión activa');
      }
      // No limpiar activeSession en caso de error de red temporal
    } finally {
      checkInProgress.current = false;
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [user?.id, isAuthenticated, authLoading]);

  // Función para refrescar sesión
  const refreshSession = useCallback(async () => {
    await checkActiveSession(true);
  }, [checkActiveSession]);

  // Efecto principal - simplificado
  useEffect(() => {
    let mounted = true;
    let intervalId: NodeJS.Timeout;
    mountedRef.current = true;

    const initialize = async () => {
      if (mounted && isAuthenticated && user && !authLoading) {
        await checkActiveSession();
        
        // Intervalo más espaciado para reducir carga
        intervalId = setInterval(() => {
          if (!document.hidden && mounted) {
            checkActiveSession();
          }
        }, 60000); // 1 minuto en lugar de 30 segundos
      }
    };

    initialize();

    return () => {
      mounted = false;
      mountedRef.current = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isAuthenticated, user, authLoading, checkActiveSession]);

  // Efecto para manejar visibilidad - simplificado
  useEffect(() => {
    let visibilityTimeout: NodeJS.Timeout;
    let focusTimeout: NodeJS.Timeout;

    const handleVisibilityChange = () => {
      if (!document.hidden && mountedRef.current) {
        clearTimeout(visibilityTimeout);
        visibilityTimeout = setTimeout(() => {
          if (mountedRef.current) {
            refreshSession();
          }
        }, 2000); // Delay más largo para evitar sobrecarga
      }
    };

    const handleWindowFocus = () => {
      if (mountedRef.current) {
        clearTimeout(focusTimeout);
        focusTimeout = setTimeout(() => {
          if (mountedRef.current) {
            refreshSession();
          }
        }, 2000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
      clearTimeout(visibilityTimeout);
      clearTimeout(focusTimeout);
    };
  }, [refreshSession]);

  const startSession = async (): Promise<Session | void> => {
    if (!user || !mountedRef.current) {
      throw new Error('Usuario no autenticado');
    }

    try {
      if (mountedRef.current) {
        setLoading(true);
        setError(null);
      }
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const response = await api.post('/api/sessions/start', 
        { user_id: user.id },
        { signal: controller.signal }
      );
      
      clearTimeout(timeoutId);
      
      if (mountedRef.current) {
        setActiveSession(response.data);
      }
      return response.data;
    } catch (error: any) {
      if (!mountedRef.current) return;
      
      if (error.name === 'AbortError') {
        const message = 'Tiempo de espera agotado al iniciar sesión';
        setError(message);
        throw new Error(message);
      } else {
        console.error('Error starting session:', error);
        const message = error.response?.data?.message || 'Error al iniciar sesión';
        setError(message);
        throw new Error(message);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  const endSession = async () => {
    if (!activeSession || !mountedRef.current) {
      return;
    }

    try {
      if (mountedRef.current) {
        setLoading(true);
        setError(null);
      }
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      await api.put(`/api/sessions/end/${activeSession.id}`, {}, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (mountedRef.current) {
        setActiveSession(null);
      }
    } catch (error: any) {
      if (!mountedRef.current) return;
      
      if (error.name === 'AbortError') {
        const message = 'Tiempo de espera agotado al finalizar sesión';
        setError(message);
        throw new Error(message);
      } else {
        console.error('Error ending session:', error);
        const message = error.response?.data?.message || 'Error al finalizar sesión';
        setError(message);
        throw new Error(message);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const value = {
    activeSession,
    loading,
    error,
    startSession,
    endSession,
    hasActiveSession: !!activeSession,
    refreshSession,
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};