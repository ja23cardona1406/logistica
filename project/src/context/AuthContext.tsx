import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { User as AppUser } from '../types';

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;       // true SOLO hasta que hidratamos la sesión inicial
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [ready, setReady] = useState(false); // <- bandera de “ya hidraté la sesión inicial”
  const mountedRef = useRef(true);

  const minimalFromSession = (id: string, email: string | null | undefined): AppUser => ({
    id,
    email: email ?? '',
    role: 'operator',
    first_name: '',
    last_name: '',
    created_at: new Date().toISOString(),
  });

  const fetchUserProfile = useCallback(async (userId: string, email: string | null | undefined): Promise<AppUser> => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (error || !data) return minimalFromSession(userId, email);
      return data as AppUser;
    } catch {
      return minimalFromSession(userId, email);
    }
  }, []);

  // Hidratar sesión inicial
  const hydrateInitialSession = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) console.error('[Auth] getSession error:', error);
      const session = data?.session;

      if (session?.user) {
        // 1) HIDRATAR INMEDIATO -> evita user=null y redirección
        const immediate = minimalFromSession(session.user.id, session.user.email);
        if (mountedRef.current) setUser(immediate);

        // 2) PERFIL EN SEGUNDO PLANO
        fetchUserProfile(session.user.id, session.user.email).then((p) => {
          if (mountedRef.current) setUser(p);
        });
      } else {
        if (mountedRef.current) setUser(null);
      }
    } finally {
      if (mountedRef.current) setReady(true);
    }
  }, [fetchUserProfile]);

  useEffect(() => {
    mountedRef.current = true;
    hydrateInitialSession();

    // Listener para cambios posteriores
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // IMPORTANTE: este listener no decide el "ready"; solo reacciona a cambios.
      if (!mountedRef.current) return;
      console.log('[Auth] onAuthStateChange event=', event, ' session?', !!session);

      if (session?.user) {
        // Set inmediato + perfil en segundo plano
        const immediate = minimalFromSession(session.user.id, session.user.email);
        setUser(immediate);
        fetchUserProfile(session.user.id, session.user.email).then((p) => {
          if (mountedRef.current) setUser(p);
        });
      } else {
        setUser(null);
      }
    });

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [hydrateInitialSession, fetchUserProfile]);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) throw new Error(error.message);

    const sessionUser = data.session?.user;
    if (!sessionUser) throw new Error('No se pudo crear la sesión.');

    // igual: hidratación inmediata + perfil async
    const immediate = minimalFromSession(sessionUser.id, sessionUser.email);
    if (mountedRef.current) setUser(immediate);
    fetchUserProfile(sessionUser.id, sessionUser.email).then((p) => {
      if (mountedRef.current) setUser(p);
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    if (mountedRef.current) setUser(null);
  };

  const refreshAuth = async () => hydrateInitialSession();

  const loading = !ready; // loading solo depende de hidratación inicial

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signOut,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
