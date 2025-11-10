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

  const checkInProgress = useRef(false);
  const mountedRef = useRef(true);

  const checkActiveSession = useCallback(async (force = false) => {
    if (authLoading || !mountedRef.current) return;
    if (!isAuthenticated || !user) {
      if (mountedRef.current) setActiveSession(null);
      return;
    }
    if (checkInProgress.current && !force) return;

    checkInProgress.current = true;
    if (mountedRef.current) setLoading(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await api.get(`/api/sessions/active/${user.id}`, { signal: controller.signal });
      if (mountedRef.current) setActiveSession(response.data || null);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Error checking session:', err);
        if (mountedRef.current) setError('Error al verificar sesión activa');
      }
    } finally {
      clearTimeout(timeoutId);
      checkInProgress.current = false;
      if (mountedRef.current) setLoading(false);
    }
  }, [user, isAuthenticated, authLoading]);

  const refreshSession = useCallback(async () => {
    await checkActiveSession(true);
  }, [checkActiveSession]);

  useEffect(() => {
    mountedRef.current = true;

    if (!authLoading) {
      checkActiveSession();

      const intervalId = setInterval(() => {
        if (!document.hidden) checkActiveSession();
      }, 60000);

      return () => {
        clearInterval(intervalId);
        mountedRef.current = false;
      };
    }

    return () => {
      mountedRef.current = false;
    };
  }, [authLoading, checkActiveSession]);

  const startSession = async (): Promise<Session | void> => {
    if (!user) throw new Error('Usuario no autenticado');
    if (!mountedRef.current) return;

    setLoading(true);
    setError(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await api.post('/api/sessions/start', { user_id: user.id }, { signal: controller.signal });
      if (mountedRef.current) setActiveSession(response.data);
      return response.data;
    } catch (err: any) {
      const message =
        err.name === 'AbortError'
          ? 'Tiempo de espera agotado'
          : err.response?.data?.message || 'Error al iniciar sesión';
      if (mountedRef.current) setError(message);
      throw new Error(message);
    } finally {
      clearTimeout(timeoutId);
      if (mountedRef.current) setLoading(false);
    }
  };

  const endSession = async () => {
    if (!activeSession) return;
    if (!mountedRef.current) return;

    setLoading(true);
    setError(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      await api.put(`/api/sessions/end/${activeSession.id}`, {}, { signal: controller.signal });
      if (mountedRef.current) setActiveSession(null);
    } catch (err: any) {
      const message =
        err.name === 'AbortError'
          ? 'Tiempo de espera agotado'
          : err.response?.data?.message || 'Error al finalizar sesión';
      if (mountedRef.current) setError(message);
      throw new Error(message);
    } finally {
      clearTimeout(timeoutId);
      if (mountedRef.current) setLoading(false);
    }
  };

  return (
    <SessionContext.Provider
      value={{
        activeSession,
        loading,
        error,
        startSession,
        endSession,
        hasActiveSession: !!activeSession,
        refreshSession,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};
