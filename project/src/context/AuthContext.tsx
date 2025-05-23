import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import { User } from '../types';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  
  // Referencias para controlar llamadas simultáneas
  const authCheckInProgress = useRef(false);
  const refreshInProgress = useRef(false);
  const mountedRef = useRef(true);

  // Función para obtener el perfil del usuario - simplificada
  const fetchUserProfile = useCallback(async (userId: string, email: string): Promise<User> => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !profile) {
        // Retornar usuario básico si no hay perfil
        return {
          id: userId,
          email: email,
          role: 'operator' as const,
          first_name: '',
          last_name: '',
          created_at: new Date().toISOString(),
        };
      }

      return profile as User;
    } catch (error) {
      console.error('Profile fetch error:', error);
      return {
        id: userId,
        email: email,
        role: 'operator' as const,
        first_name: '',
        last_name: '',
        created_at: new Date().toISOString(),
      };
    }
  }, []);

  // Función para verificar sesión - con control de concurrencia
  const checkSession = useCallback(async () => {
    // Evitar múltiples verificaciones simultáneas
    if (authCheckInProgress.current || !mountedRef.current) {
      return;
    }

    authCheckInProgress.current = true;

    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Session error:', error);
        if (mountedRef.current) {
          setUser(null);
        }
        return;
      }

      if (session?.user && mountedRef.current) {
        const profile = await fetchUserProfile(session.user.id, session.user.email ?? '');
        if (mountedRef.current) {
          setUser(profile);
        }
      } else if (mountedRef.current) {
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      if (mountedRef.current) {
        setUser(null);
      }
    } finally {
      authCheckInProgress.current = false;
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [fetchUserProfile]);

  // Función para refrescar autenticación - con debounce
  const refreshAuth = useCallback(async () => {
    if (refreshInProgress.current || !mountedRef.current) {
      return;
    }

    refreshInProgress.current = true;

    try {
      await checkSession();
    } finally {
      refreshInProgress.current = false;
    }
  }, [checkSession]);

  // Inicialización - solo una vez
  useEffect(() => {
    let mounted = true;
    mountedRef.current = true;

    const initializeAuth = async () => {
      if (!mounted) return;
      
      setLoading(true);
      await checkSession();
      
      if (mounted) {
        setInitialized(true);
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      mountedRef.current = false;
    };
  }, []); // Sin dependencias para ejecutar solo una vez

  // Configurar listeners después de inicialización
  useEffect(() => {
    if (!initialized) return;

    // Listener para cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mountedRef.current) return;

        console.log('Auth state changed:', event);

        // Solo manejar eventos importantes
        if (event === 'SIGNED_IN' && session?.user) {
          const profile = await fetchUserProfile(session.user.id, session.user.email ?? '');
          if (mountedRef.current) {
            setUser(profile);
          }
        } else if (event === 'SIGNED_OUT') {
          if (mountedRef.current) {
            setUser(null);
          }
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          // No necesitamos volver a fetch el perfil en token refresh
          // Solo actualizamos si no tenemos usuario
          if (!user && mountedRef.current) {
            const profile = await fetchUserProfile(session.user.id, session.user.email ?? '');
            if (mountedRef.current) {
              setUser(profile);
            }
          }
        }
      }
    );

    // Listener para visibilidad de página - con debounce
    let visibilityTimeout: NodeJS.Timeout;
    const handleVisibilityChange = () => {
      if (!document.hidden && mountedRef.current) {
        // Debounce para evitar múltiples llamadas
        clearTimeout(visibilityTimeout);
        visibilityTimeout = setTimeout(() => {
          if (mountedRef.current) {
            refreshAuth();
          }
        }, 1000);
      }
    };

    // Listener para foco de ventana - con debounce
    let focusTimeout: NodeJS.Timeout;
    const handleWindowFocus = () => {
      if (mountedRef.current) {
        clearTimeout(focusTimeout);
        focusTimeout = setTimeout(() => {
          if (mountedRef.current) {
            refreshAuth();
          }
        }, 1000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
      clearTimeout(visibilityTimeout);
      clearTimeout(focusTimeout);
    };
  }, [initialized, fetchUserProfile, refreshAuth, user]);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        throw new Error(error.message);
      }

      // No necesitamos hacer nada aquí, onAuthStateChange manejará la actualización
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      // onAuthStateChange manejará la limpieza del estado
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signOut,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    refreshAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};