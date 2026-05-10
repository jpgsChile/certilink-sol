import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { authService } from "@/lib/services/auth.service";
import type { User, Session } from "@supabase/supabase-js";
import type { Otec } from "@/lib/database.types";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  otec: Otec | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, institucion: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshOtec: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [otec, setOtec] = useState<Otec | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOtec = useCallback(async () => {
    try {
      const otecData = await authService.getOtec();
      setOtec(otecData);
    } catch {
      setOtec(null);
    }
  }, []);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        fetchOtec().finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, s) => {
        setSession(s);
        setUser(s?.user ?? null);
        if (s?.user) {
          await fetchOtec();
        } else {
          setOtec(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchOtec]);

  const signIn = async (email: string, password: string) => {
    const data = await authService.signIn({ email, password });
    setUser(data.user);
    setSession(data.session);
    await fetchOtec();
  };

  const signUp = async (email: string, password: string, institucion: string) => {
    await authService.signUp({ email, password, institucion });
  };

  const signOut = async () => {
    await authService.signOut();
    setUser(null);
    setSession(null);
    setOtec(null);
  };

  const refreshOtec = async () => {
    await fetchOtec();
  };

  return (
    <AuthContext.Provider
      value={{ user, session, otec, loading, signIn, signUp, signOut, refreshOtec }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}